#!/usr/bin/env python3
"""
Applique un export métadonnées Artlogic (CSV/TSV/JSON/XLS/XLSX) aux œuvres D1
de l'atelier preview — PATCH légendes seulement (jamais les images KV).

Usage:
  python3 apply-artlogic-metadata.py --file /chemin/export.csv            # dry-run
  python3 apply-artlogic-metadata.py --file /chemin/export.csv --apply    # écrit
  python3 apply-artlogic-metadata.py --search                             # cherche le fichier

Auth via env ATELIER_USER / ATELIER_PASS or --user/--password — ne pas logger le mot de passe.
No password defaults in source (secrets stay in env / CLI only).
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

BASE_DEFAULT = "https://atelier-kv-preview.galerie-vittet-preview.pages.dev"
SEARCH_ROOTS = [
    Path("/workspace"),
    Path("/tmp"),
    Path("/home/ubuntu"),
    Path("/opt/cursor/artifacts"),
    Path("/cursor/stores"),
    Path.home() / "Downloads",
    Path("/Users/emmanuel/Downloads"),
]
# Noms vraiment liés à Artlogic / export œuvres (évite faux positifs type go "list_export").
STRONG_HINTS = ("artlogic", "website1111", "artworks.all", "artworks-all")
WEAK_HINTS = ("artworks", "oeuvres", "métadonnées", "metadonnees", "metadata")
EXTS = {".csv", ".tsv", ".json", ".xls", ".xlsx", ".txt"}
SKIP_DIR_PARTS = {
    "node_modules",
    ".git",
    "go/pkg/mod",
    ".cursor-server",
    "toolchain@",
}

# Alias colonnes Artlogic / FR / EN → champs internes
# Champs FR atelier : artiste, titre, note, signé et date, support, dimensions, éditions
COL_ALIASES = {
    "artist": {
        "artist",
        "artiste",
        "artist name",
        "artist_name",
        "auteur",
        "author",
        "maker",
    },
    "title": {"title", "titre", "artwork title", "work title", "name", "nom"},
    "support": {
        "medium",
        "technique",
        "media",
        "matériau",
        "materiau",
        "support",
        "medium / materials",
        "materials",
    },
    "dimensions": {
        "dimensions",
        "dimension",
        "size",
        "sizes",
        "mesure",
        "mesures",
    },
    "signed_dated": {
        "signed_and_dated",
        "signed and dated",
        "signed",
        "signé et date",
        "signe et date",
        "signature",
        "signed dated",
    },
    "editions": {
        "edition_details",
        "edition details",
        "editions",
        "édition",
        "edition",
        "éditions",
    },
    "stock": {
        "stock number",
        "stock_number",
        "stock no",
        "stock no.",
        "stock",
        "inventory",
        "inventory number",
        "inv",
        "inv.",
        "référence",
        "reference",
        "ref",
        "sku",
        "artwork id",
        "object id",
        "artwork_id",
        "object_id",
        # "id" volontairement exclu : sur Artlogic c'est l'id interne numérique,
        # rarement égal au slug / stock D1 (évite faux positifs).
    },
    "filename": {
        "filename",
        "file name",
        "file",
        "fichier",
        "image",
        "image filename",
        "image file",
        "primary image",
        "photo",
        "photograph",
        "image 1",
        "web image",
        "website image",
        "main_image",
        "main image",
        "primary_image",
        "images",
    },
    "note": {
        "description",
        "description2",
        "note",
        "notes",
        "caption",
        "légende",
        "legende",
        "texte",
        "text",
        "commentary",
    },
    "date": {
        "date",
        "year",
        "année",
        "annee",
        "period",
        "période",
        "periode",
        "dated",
        "creation date",
    },
    "categories": {"categories", "catégorie", "categorie", "category", "tags"},
}


def slugify(value: str, max_len: int = 48) -> str:
    ascii_ = (
        unicodedata.normalize("NFKD", str(value or ""))
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )
    ascii_ = re.sub(r"[^a-z0-9]+", "-", ascii_).strip("-")[:max_len]
    return ascii_ or "oeuvre"


def norm_key(s: str) -> str:
    return re.sub(r"\s+", " ", str(s or "").strip().lower())


def stem_of(name: str) -> str:
    """Accepte un nom de fichier local ou une URL Artlogic (main_image)."""
    raw = str(name or "").strip()
    if not raw:
        return ""
    # URL → dernier segment de chemin (ignore query/fragment)
    if "://" in raw or raw.startswith("//"):
        from urllib.parse import urlparse, unquote

        path = unquote(urlparse(raw if "://" in raw else f"https:{raw}").path)
        base = path.rstrip("/").split("/")[-1]
        # Artlogic tronque parfois l'extension (anne-d-autriche-.j) → retirer suffixe type fichier
        stem = Path(base).stem if "." in base else base
        stem = re.sub(r"[\.-]+j(pe?g)?$", "", stem, flags=re.I)
        stem = re.sub(r"[\.-]+png$", "", stem, flags=re.I)
        stem = re.sub(r"[\.-]+webp$", "", stem, flags=re.I)
        return stem.rstrip(".-")
    base = Path(raw.replace("\\", "/")).name
    return Path(base).stem


def is_reimport_duplicate(a: str, b: str) -> bool:
    """True si l'un est l'autre + '-N' (re-import), pas une paire foo-1 / foo-2."""
    a, b = str(a or ""), str(b or "")
    if not a or not b or a == b:
        return a == b and bool(a)
    longer, shorter = (a, b) if len(a) >= len(b) else (b, a)
    if longer.startswith(shorter + "-"):
        return longer[len(shorter) + 1 :].isdigit()
    return False


def same_import_family(a: str, b: str) -> bool:
    return is_reimport_duplicate(a, b)


def search_exports() -> list[Path]:
    hits: list[Path] = []
    seen: set[str] = set()
    for root in SEARCH_ROOTS:
        if not root.exists():
            continue
        try:
            for p in root.rglob("*"):
                if not p.is_file():
                    continue
                if p.suffix.lower() not in EXTS:
                    continue
                path_s = str(p)
                if any(part in path_s for part in SKIP_DIR_PARTS):
                    continue
                low = p.name.lower()
                strong = any(h in low for h in STRONG_HINTS)
                weak = any(h in low for h in WEAK_HINTS) and (
                    "export" in low or "artlogic" in low or low.endswith(".xls") or low.endswith(".xlsx")
                )
                if not (strong or weak):
                    continue
                try:
                    key = str(p.resolve())
                except OSError:
                    key = str(p)
                if key in seen:
                    continue
                seen.add(key)
                hits.append(p)
        except (PermissionError, OSError):
            continue
    return sorted(hits, key=lambda p: p.stat().st_mtime if p.exists() else 0, reverse=True)


def map_headers(headers: list[str]) -> dict[str, str]:
    """field interne → nom de colonne source.

    Préférence stock_number > id Artlogic ; main_image > images générique.
    """
    mapping: dict[str, str] = {}
    # Priorité explicite pour colonnes Artlogic fréquentes
    preferred = {
        "stock": ("stock_number", "stock number", "stock no", "stock no.", "stock"),
        "filename": ("main_image", "main image", "primary_image", "filename", "images"),
        "artist": ("artist", "artiste"),
        "title": ("title", "titre"),
        "support": ("medium", "support", "technique"),
        "dimensions": ("dimensions", "dimension"),
        "signed_dated": ("signed_and_dated", "signed and dated", "signé et date"),
        "editions": ("edition_details", "edition details", "editions", "éditions"),
        "date": ("year", "date", "creation_date"),
        "note": ("description", "description2", "notes", "note"),
        "categories": ("category_names", "categories", "category"),
    }
    header_by_norm = {norm_key(h): h for h in headers}
    for field, prefs in preferred.items():
        for pref in prefs:
            if pref in header_by_norm:
                mapping[field] = header_by_norm[pref]
                break
    for h in headers:
        nh = norm_key(h)
        for field, aliases in COL_ALIASES.items():
            if nh in aliases and field not in mapping:
                mapping[field] = h
    return mapping


def read_tabular(path: Path) -> tuple[list[str], list[dict]]:
    suffix = path.suffix.lower()
    if suffix in {".csv", ".tsv", ".txt"}:
        text = path.read_text(encoding="utf-8-sig", errors="replace")
        sample = text[:8192]
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        except csv.Error:
            dialect = "excel-tab" if suffix == ".tsv" or "\t" in sample.splitlines()[0:1][0] else "excel"
        reader = csv.DictReader(text.splitlines(), dialect=dialect)
        headers = list(reader.fieldnames or [])
        rows = [dict(r) for r in reader]
        return headers, rows
    if suffix == ".json":
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        if isinstance(data, dict):
            for k in ("rows", "items", "artworks", "data", "oeuvres"):
                if isinstance(data.get(k), list):
                    data = data[k]
                    break
            else:
                raise SystemExit("JSON : liste d'œuvres introuvable")
        if not data:
            return [], []
        headers = list(data[0].keys())
        return headers, [dict(r) for r in data]
    if suffix == ".xlsx":
        import openpyxl

        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb.active
        rows_iter = ws.iter_rows(values_only=True)
        headers = [str(c or "").strip() for c in next(rows_iter)]
        rows = []
        for vals in rows_iter:
            row = {
                headers[i]: ("" if vals[i] is None else str(vals[i]))
                for i in range(len(headers))
            }
            if any(str(v).strip() for v in row.values()):
                rows.append(row)
        return headers, rows
    if suffix == ".xls":
        import xlrd

        book = xlrd.open_workbook(str(path))
        sheet = book.sheet_by_index(0)
        headers = [str(sheet.cell_value(0, c)).strip() for c in range(sheet.ncols)]
        rows = []
        for r in range(1, sheet.nrows):
            row = {
                headers[c]: str(sheet.cell_value(r, c)).strip()
                for c in range(sheet.ncols)
            }
            if any(v.strip() for v in row.values()):
                rows.append(row)
        return headers, rows
    raise SystemExit(f"Format non supporté : {suffix}")


def cell(row: dict, header: str | None) -> str:
    if not header:
        return ""
    return str(row.get(header) or "").strip()


def build_note(row: dict, mapping: dict[str, str]) -> str:
    """note = description Artlogic (description puis description2), pas le composite medium."""
    primary = cell(row, mapping.get("note"))
    if primary:
        return primary[:200]
    # Si mapping a pris description seule, tenter description2 brut
    for key in ("description2", "description", "notes", "note"):
        for h, v in row.items():
            if norm_key(h) == key and str(v or "").strip():
                return str(v).strip()[:200]
    return ""


def build_meta_patch(row: dict, mapping: dict[str, str], artist: str, title: str) -> dict:
    """Champs FR séparés alignés CSV Artlogic."""
    note = build_note(row, mapping)
    support = cell(row, mapping.get("support"))[:180]
    dimensions = cell(row, mapping.get("dimensions"))[:120]
    signed_dated = cell(row, mapping.get("signed_dated"))[:120]
    editions = cell(row, mapping.get("editions"))[:180]
    return {
        "artist": artist[:120],
        "title": title[:140],
        "note": note,
        "signed_dated": signed_dated,
        "support": support,
        "dimensions": dimensions,
        "editions": editions,
        "alt": (title or artist)[:180],
    }


def guess_categories(title: str, note: str, artist: str, support: str = "") -> list[str]:
    """Uniquement peinture | miniature | aquarelle (plus portraits/paysages)."""
    blob = f"{title} {note} {artist} {support}".lower()
    if "miniature" in blob or "minia" in blob:
        return ["miniature"]
    if any(w in blob for w in ("aquarelle", "watercolor", "watercolour", "gouache")):
        # petites gouaches souvent miniatures — heuristique dimension dans support/note
        dim = re.search(r"(\d+[.,]?\d*)\s*x\s*(\d+[.,]?\d*)\s*cm", blob)
        if dim:
            try:
                a = float(dim.group(1).replace(",", "."))
                b = float(dim.group(2).replace(",", "."))
                if max(a, b) <= 12:
                    return ["miniature"]
            except ValueError:
                pass
        if "gouache" in blob and "aquarelle" not in blob:
            return ["peinture"]
        return ["aquarelle"]
    return ["peinture"]


def work_match_keys(work: dict) -> set[str]:
    keys: set[str] = set()
    wid = str(work.get("id") or "")
    title = str(work.get("title") or "")
    image = str(work.get("image") or "")
    keys.add(slugify(wid.removeprefix("ajout-").removeprefix("exposee-"), 80))
    keys.add(slugify(title, 80))
    keys.add(slugify(stem_of(image).removeprefix("ajout-"), 80))
    # variantes sans suffixe numérique -2
    for k in list(keys):
        keys.add(re.sub(r"-\d+$", "", k))
    return {k for k in keys if k}


def export_match_keys(row: dict, mapping: dict[str, str]) -> set[str]:
    keys: set[str] = set()
    fn = cell(row, mapping.get("filename"))
    stock = cell(row, mapping.get("stock"))
    title = cell(row, mapping.get("title"))
    artist = cell(row, mapping.get("artist"))
    if fn:
        stem = stem_of(fn)
        keys.add(slugify(stem, 80))
        keys.add(slugify(stem.removeprefix("ajout-"), 80))
        # parfois le stock est dans le nom de fichier
        keys.add(slugify(Path(stem).stem, 80))
    if stock:
        keys.add(slugify(stock, 80))
        keys.add(slugify(f"stock-{stock}", 80))
    if title:
        keys.add(slugify(title, 80))
        if artist:
            keys.add(slugify(f"{artist} {title}", 80))
            keys.add(slugify(f"{title} {artist}", 80))
    for k in list(keys):
        keys.add(re.sub(r"-\d+$", "", k))
    return {k for k in keys if k}


def confidence(export_keys: set[str], work_keys: set[str], row: dict, work: dict, mapping: dict[str, str]) -> tuple[str, float]:
    """Retourne (raison, score 0..1)."""
    inter = export_keys & work_keys
    if not inter:
        return ("", 0.0)
    fn = cell(row, mapping.get("filename"))
    stock = cell(row, mapping.get("stock"))
    # filename exact / stem → très fiable
    if fn:
        stem = slugify(stem_of(fn), 80)
        if stem in work_keys or slugify(stem.removeprefix("ajout-"), 80) in work_keys:
            return ("filename", 0.98)
    if stock and slugify(stock, 80) in work_keys:
        return ("stock", 0.95)
    # id slug égalité forte
    best = max(inter, key=len)
    if len(best) >= 8 and best in work_keys and best in export_keys:
        return ("slug", 0.88)
    if len(best) >= 5:
        return ("slug-weak", 0.72)
    return ("weak", 0.55)


def http_json(method: str, url: str, user: str, password: str, body: dict | None = None):
    """Appelle l'API atelier. Préfère curl (UA accepté) ; fallback urllib."""
    import base64
    import subprocess

    data = None if body is None else json.dumps(body)
    curl = [
        "curl",
        "-sS",
        "-u",
        f"{user}:{password}",
        "-H",
        "Accept: application/json",
        "-H",
        "X-Atelier: 1",
        "-H",
        "User-Agent: Mozilla/5.0 (compatible; GalerieVittetAtelierMeta/1.0)",
        "-w",
        "\n__HTTP_STATUS__%{http_code}",
        "-X",
        method,
    ]
    if data is not None:
        curl += ["-H", "Content-Type: application/json; charset=utf-8", "--data-binary", data]
    curl.append(url)
    try:
        proc = subprocess.run(curl, capture_output=True, text=True, timeout=90)
        out = proc.stdout or ""
        if "__HTTP_STATUS__" in out:
            raw, _, status_s = out.rpartition("__HTTP_STATUS__")
            status = int(status_s.strip() or "0")
        else:
            raw, status = out, 0
        try:
            payload = json.loads(raw) if raw.strip() else None
        except json.JSONDecodeError:
            payload = {"error": raw[:500]}
        if status:
            return status, payload
    except (OSError, subprocess.TimeoutExpired):
        pass

    headers = {
        "Accept": "application/json",
        "X-Atelier": "1",
        "User-Agent": "Mozilla/5.0 (compatible; GalerieVittetAtelierMeta/1.0)",
        "Authorization": "Basic "
        + base64.b64encode(f"{user}:{password}".encode()).decode(),
    }
    raw_body = None if body is None else json.dumps(body).encode("utf-8")
    if raw_body is not None:
        headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(url, data=raw_body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw.decode("utf-8") if raw else "null")
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"error": raw[:300]}
        return e.code, payload


def main() -> int:
    ap = argparse.ArgumentParser(description="Matching Artlogic → PATCH D1 atelier preview")
    ap.add_argument("--file", help="Chemin export Artlogic (.csv/.tsv/.json/.xls/.xlsx)")
    ap.add_argument("--search", action="store_true", help="Cherche le fichier et quitte")
    ap.add_argument("--apply", action="store_true", help="Écrit les PATCH (sinon dry-run)")
    ap.add_argument(
        "--refresh",
        action="store_true",
        help="PATCH aussi les matchs déjà légendés (nouveaux champs support/dimensions/…)",
    )
    ap.add_argument("--threshold", type=float, default=0.85, help="Seuil matching clair (défaut 0.85)")
    ap.add_argument("--base", default=os.environ.get("ATELIER_BASE", BASE_DEFAULT))
    ap.add_argument("--user", default=os.environ.get("ATELIER_USER", ""))
    ap.add_argument("--password", default=os.environ.get("ATELIER_PASS", ""))
    ap.add_argument(
        "--out",
        default="/opt/cursor/artifacts/artlogic-ready/matching-report.json",
        help="Rapport JSON",
    )
    ap.add_argument("--limit", type=int, default=0, help="Limiter le nombre de PATCH (tests)")
    args = ap.parse_args()

    if args.apply and (not args.user or not args.password):
        print(
            "ATELIER_USER / ATELIER_PASS (ou --user/--password) requis pour --apply.",
            file=sys.stderr,
        )
        return 2

    if args.search or not args.file:
        hits = [
            p
            for p in search_exports()
            if "smoke-artlogic" not in p.name.lower()
            and "sample" not in p.name.lower()
        ]
        print(f"Fichiers candidats Artlogic : {len(hits)}")
        for p in hits[:30]:
            print(f"  {p}  ({p.stat().st_size} o)")
        if args.search:
            if not hits:
                print(
                    "ABSENT — joindre CSV/JSON/TXT (≤4 Mo). XLS souvent refusé par le chat Cloud ; "
                    "ZIP non supporté. Depuis Excel : Fichier → Enregistrer sous → CSV UTF-8."
                )
            return 2 if not hits else 0
        if not hits:
            print(
                "ABSENT — joindre CSV/JSON/TXT (≤4 Mo). XLS souvent refusé par le chat Cloud ; "
                "ZIP non supporté. Depuis Excel : Fichier → Enregistrer sous → CSV UTF-8."
            )
            return 2
        args.file = str(hits[0])
        print(f"Utilisation : {args.file}")

    path = Path(args.file)
    if not path.is_file():
        print(f"Fichier introuvable : {path}")
        return 2

    headers, rows = read_tabular(path)
    mapping = map_headers(headers)
    print("=== Export ===")
    print(f"fichier   : {path}")
    print(f"lignes    : {len(rows)}")
    print(f"colonnes  : {headers}")
    print(f"mapping   : {mapping}")

    status, works = http_json("GET", f"{args.base.rstrip('/')}/atelier/api/oeuvres", args.user, args.password)
    if status != 200 or not isinstance(works, list):
        print(f"API oeuvres HTTP {status} : {works}")
        return 1
    empty = [w for w in works if not str(w.get("artist") or "").strip()]
    print("=== D1 ===")
    print(f"oeuvres   : {len(works)} (artiste vide : {len(empty)})")

    # index works by match keys
    by_key: dict[str, list[dict]] = defaultdict(list)
    for w in works:
        for k in work_match_keys(w):
            by_key[k].append(w)

    clear: list[dict] = []
    ambiguous: list[dict] = []
    unmatched_export: list[dict] = []
    used_work_ids: set[str] = set()

    for idx, row in enumerate(rows):
        ekeys = export_match_keys(row, mapping)
        if not ekeys:
            unmatched_export.append({"row": idx + 2, "reason": "no-keys", "title": cell(row, mapping.get("title"))})
            continue
        candidates: dict[str, tuple[dict, str, float]] = {}
        for k in ekeys:
            for w in by_key.get(k, []):
                reason, score = confidence(ekeys, work_match_keys(w), row, w, mapping)
                prev = candidates.get(w["id"])
                if not prev or score > prev[2]:
                    candidates[w["id"]] = (w, reason, score)
        if not candidates:
            unmatched_export.append(
                {
                    "row": idx + 2,
                    "reason": "no-match",
                    "title": cell(row, mapping.get("title")),
                    "filename": cell(row, mapping.get("filename")),
                    "stock": cell(row, mapping.get("stock")),
                    "keys": sorted(ekeys)[:8],
                }
            )
            continue
        ranked = sorted(
            candidates.values(),
            key=lambda t: (
                t[2],
                # préférer artiste vide, puis id sans suffixe -2
                1 if not str(t[0].get("artist") or "").strip() else 0,
                0 if not re.search(r"-\d+$", t[0]["id"]) else 1,
                -len(t[0]["id"]),
            ),
            reverse=True,
        )
        best_w, best_reason, best_score = ranked[0]
        # ambiguïté : deux scores proches au-dessus du seuil
        rivals = [t for t in ranked if t[2] >= args.threshold and t[0]["id"] != best_w["id"]]
        # Match filename/stock très clair : ignorer rivaux nettement plus faibles
        # (ex. slug partiel sur une seed exposée vs stem exact ajout-*)
        if best_score >= 0.95 and best_reason in ("filename", "stock"):
            rivals = [t for t in rivals if t[2] >= best_score - 0.05]
        # Doublons d'import (ajout-foo / ajout-foo-2) : même famille → pas ambigu
        family_only = bool(rivals) and all(
            same_import_family(best_w["id"], t[0]["id"]) for t in rivals
        )
        if family_only and best_score >= 0.95 and best_reason in ("filename", "stock", "slug"):
            # cibler en priorité les artiste-vides de la famille non encore utilisés
            family_members = [best_w] + [t[0] for t in rivals]
            empty_unused = [
                w
                for w in family_members
                if not str(w.get("artist") or "").strip()
                and w["id"] not in used_work_ids
                and w.get("exposed") not in (1, True, "1")
            ]
            if empty_unused:
                best_w = empty_unused[0]
                rivals = []
                best_reason = f"{best_reason}-family"
            elif all(same_import_family(best_w["id"], t[0]["id"]) for t in rivals):
                rivals = []  # unique logique métier : une ligne CSV → une cible famille
        artist = cell(row, mapping.get("artist"))
        title = cell(row, mapping.get("title")) or str(best_w.get("title") or "")
        if not artist:
            unmatched_export.append(
                {
                    "row": idx + 2,
                    "reason": "no-artist-in-export",
                    "title": title,
                    "work_id": best_w["id"],
                    "score": best_score,
                }
            )
            continue
        patch = build_meta_patch(row, mapping, artist, title)
        # categories : peinture | miniature | aquarelle seulement
        empty_artist = not str(best_w.get("artist") or "").strip()
        if empty_artist or args.refresh:
            existing_cats = best_w.get("categories") or []
            allowed = {"peinture", "miniature", "aquarelle"}
            if isinstance(existing_cats, list) and existing_cats and set(existing_cats) <= allowed:
                patch["categories"] = existing_cats
            else:
                patch["categories"] = guess_categories(
                    title, patch["note"], artist, patch.get("support", "")
                )
            # ne touche PAS exposed (reste 0 pour ajouts rapides)
        is_exposed = best_w.get("exposed") in (1, True, "1")
        entry = {
            "row": idx + 2,
            "work_id": best_w["id"],
            "score": best_score,
            "reason": best_reason,
            "empty_artist": not str(best_w.get("artist") or "").strip(),
            "exposed": bool(is_exposed),
            "from_title": best_w.get("title"),
            "patch": patch,
            "export": {
                "artist": artist,
                "title": title,
                "filename": stem_of(cell(row, mapping.get("filename")))
                or cell(row, mapping.get("filename")),
                "stock": cell(row, mapping.get("stock")),
            },
        }
        # Garde-fou : ne jamais cibler les 12 seeds exposées (même match clair)
        if is_exposed:
            entry["reason"] = "skip-exposed-seed"
            ambiguous.append(entry)
            continue
        if best_score < args.threshold or rivals:
            entry["rivals"] = [
                {"id": t[0]["id"], "score": t[2], "reason": t[1]} for t in rivals[:5]
            ]
            ambiguous.append(entry)
            continue
        if best_w["id"] in used_work_ids:
            # 2ᵉ ligne CSV pour la même œuvre : tenter un frère -2/-3 encore libre
            siblings = [
                t[0]
                for t in ranked
                if same_import_family(best_w["id"], t[0]["id"])
                and t[0]["id"] not in used_work_ids
                and t[0].get("exposed") not in (1, True, "1")
                and (
                    not str(t[0].get("artist") or "").strip()
                    or args.refresh
                )
            ]
            if siblings:
                # préférer artiste vide
                siblings.sort(
                    key=lambda w: (
                        0 if not str(w.get("artist") or "").strip() else 1,
                        w["id"],
                    )
                )
                alt = siblings[0]
                entry["work_id"] = alt["id"]
                entry["from_title"] = alt.get("title")
                entry["empty_artist"] = not str(alt.get("artist") or "").strip()
                entry["reason"] = f"{best_reason}-sibling"
                best_w = alt
            else:
                entry["reason"] = "duplicate-work-target"
                ambiguous.append(entry)
                continue
        used_work_ids.add(best_w["id"])
        clear.append(entry)

    print("=== Matching ===")
    print(f"clair     : {len(clear)} (seuil ≥ {args.threshold})")
    print(f"ambigu    : {len(ambiguous)}")
    print(f"non-match : {len(unmatched_export)}")
    reasons = Counter(e["reason"] for e in clear)
    print(f"raisons   : {dict(reasons)}")

    applied = []
    errors = []
    if args.refresh:
        to_apply = [e for e in clear if not e.get("exposed")]
    else:
        to_apply = [e for e in clear if e["empty_artist"] and not e.get("exposed")]
    # seeds exposées jamais PATCH même si match clair
    if args.apply:
        batch = to_apply[: args.limit] if args.limit else to_apply
        mode = "refresh" if args.refresh else "empty-artist"
        print(f"=== APPLY {len(batch)} PATCH ({mode}) ===")
        for i, e in enumerate(batch):
            code, payload = http_json(
                "PATCH",
                f"{args.base.rstrip('/')}/atelier/api/oeuvres/{e['work_id']}",
                args.user,
                args.password,
                e["patch"],
            )
            if code == 200:
                applied.append(
                    {
                        "id": e["work_id"],
                        "artist": e["patch"]["artist"],
                        "title": e["patch"]["title"],
                        "support": e["patch"].get("support", ""),
                        "dimensions": e["patch"].get("dimensions", ""),
                    }
                )
            else:
                errors.append({"id": e["work_id"], "status": code, "error": payload})
            if (i + 1) % 25 == 0:
                print(f"  … {i + 1}/{len(batch)}")
                time.sleep(0.2)
        print(f"OK {len(applied)} / erreurs {len(errors)}")
    else:
        print("Dry-run — aucun PATCH. Relancer avec --apply [--refresh] si le taux est bon.")
        print(f"Candidats apply : {len(to_apply)} (refresh={bool(args.refresh)})")

    report = {
        "file": str(path),
        "rows": len(rows),
        "headers": headers,
        "mapping": mapping,
        "works": len(works),
        "empty_artist": len(empty),
        "threshold": args.threshold,
        "clear": len(clear),
        "clear_empty_artist": len(to_apply),
        "ambiguous": len(ambiguous),
        "unmatched": len(unmatched_export),
        "applied": len(applied),
        "errors": errors,
        "sample_clear": clear[:20],
        "sample_ambiguous": ambiguous[:20],
        "sample_unmatched": unmatched_export[:40],
        "mode": "apply" if args.apply else "dry-run",
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Rapport : {out}")

    # reste à faire côté D1
    matched_ids = {e["work_id"] for e in clear}
    leftover = [w["id"] for w in empty if w["id"] not in matched_ids]
    print(f"Restes artiste vide non matchés clairement : {len(leftover)}")
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
