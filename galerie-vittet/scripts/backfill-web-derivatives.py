#!/usr/bin/env python3
"""
Backfill dérivés web pour Galerie Vittet (ajouts KV).

- Lit la bibliothèque atelier (Basic Auth)
- Pour chaque œuvre sans champ `web` (ou --force) : télécharge l'original,
  redimensionne (max edge 1600, WebP avec budget ~220 Ko), POST .../web
- Ne supprime / n'écrase jamais l'original (detail:)

Usage:
  python3 backfill-web-derivatives.py \\
    --base https://atelier-kv-preview.galerie-vittet-preview.pages.dev \\
    --user vittet --password '…'
  # carousel only:
  python3 … --carousel-only --force
"""

from __future__ import annotations

import argparse
import io
import json
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image

WEB_MAX_EDGE = 1600
WEBP_QUALITY = 78
WEBP_TARGET_BYTES = 220_000
WEBP_MIN_QUALITY = 55
JPEG_FALLBACK_QUALITY = 78


def curl_json(url: str, user: str, password: str, method: str = "GET", form_file=None, form_type=None):
    cmd = [
        "curl",
        "-sS",
        "-A",
        "GalerieVittet-WebBackfill/1.1",
        "-u",
        f"{user}:{password}",
        "-H",
        "X-Atelier: 1",
        "-w",
        "\n%{http_code}",
    ]
    if method != "GET":
        cmd.extend(["-X", method])
    if form_file:
        ctype = form_type or "image/webp"
        cmd.extend(["-F", f"web=@{form_file};type={ctype}"])
    cmd.append(url)
    out = subprocess.check_output(cmd)
    *body_parts, code_line = out.split(b"\n")
    body = b"\n".join(body_parts)
    code = int(code_line.decode().strip() or "0")
    return code, body


def curl_bytes(url: str, user: str, password: str) -> bytes:
    cmd = [
        "curl",
        "-sS",
        "-A",
        "GalerieVittet-WebBackfill/1.1",
        "-u",
        f"{user}:{password}",
        "-o",
        "-",
        "-w",
        "\n%{http_code}",
        url,
    ]
    out = subprocess.check_output(cmd)
    *body_parts, code_line = out.split(b"\n")
    body = b"\n".join(body_parts)
    code = int(code_line.decode().strip() or "0")
    if code != 200:
        raise RuntimeError(f"GET {url} → HTTP {code}")
    return body


def _resize(img: Image.Image, max_edge: int) -> Image.Image:
    w, h = img.size
    scale = min(1.0, max_edge / max(w, h))
    if scale >= 1.0:
        return img
    nw = max(1, round(w * scale))
    nh = max(1, round(h * scale))
    return img.resize((nw, nh), Image.Resampling.LANCZOS)


def make_web_derivative(raw: bytes) -> tuple[bytes, str]:
    """Returns (bytes, content_type). Prefers WebP under target size."""
    img = Image.open(io.BytesIO(raw))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    elif img.mode == "L":
        img = img.convert("RGB")

    edge = WEB_MAX_EDGE
    quality = WEBP_QUALITY
    best: tuple[bytes, str] | None = None

    for _ in range(8):
        work = _resize(img, edge)
        buf = io.BytesIO()
        try:
            work.save(buf, format="WEBP", quality=quality, method=4)
            payload = buf.getvalue()
            ctype = "image/webp"
        except Exception:
            buf = io.BytesIO()
            work.save(buf, format="JPEG", quality=JPEG_FALLBACK_QUALITY, optimize=True)
            payload = buf.getvalue()
            ctype = "image/jpeg"

        if best is None or len(payload) < len(best[0]):
            best = (payload, ctype)
        if len(payload) <= WEBP_TARGET_BYTES:
            return payload, ctype
        if quality > WEBP_MIN_QUALITY + 2:
            quality = max(WEBP_MIN_QUALITY, quality - 8)
            continue
        if edge > 1100:
            edge = max(1100, int(edge * 0.85))
            quality = WEBP_QUALITY
            continue
        break

    assert best is not None
    return best


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    parser.add_argument("--user", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--only", default="", help="Comma-separated work ids")
    parser.add_argument(
        "--carousel-only",
        action="store_true",
        help="Only works flagged carousel=1 (hero path)",
    )
    parser.add_argument(
        "--jpg-web-only",
        action="store_true",
        help="Only works whose current web path ends with .jpg",
    )
    parser.add_argument("--sleep", type=float, default=0.15)
    parser.add_argument("--report", default="/opt/cursor/artifacts/web-backfill-report.json")
    args = parser.parse_args()

    base = args.base.rstrip("/")
    code, body = curl_json(f"{base}/atelier/api/oeuvres", args.user, args.password)
    if code != 200:
        print(f"list failed HTTP {code}: {body[:200]!r}", file=sys.stderr)
        return 1
    works = json.loads(body)
    only = {x.strip() for x in args.only.split(",") if x.strip()}
    targets = []
    for work in works:
        wid = work.get("id") or ""
        if not wid.startswith("ajout-"):
            continue
        if only and wid not in only:
            continue
        if args.carousel_only and not work.get("carousel"):
            continue
        web = work.get("web") or ""
        if args.jpg_web_only and web and not web.lower().endswith((".jpg", ".jpeg")):
            continue
        if web and not args.force:
            continue
        if not work.get("image"):
            continue
        targets.append(work)

    if args.limit > 0:
        targets = targets[: args.limit]

    print(f"backfill candidates: {len(targets)} / {len(works)}")
    report = {"ok": [], "fail": [], "skipped": []}
    tmp = Path("/tmp/web-derivative.bin")

    for i, work in enumerate(targets, 1):
        wid = work["id"]
        image_path = work["image"]
        url = f"{base}/{image_path}"
        print(f"[{i}/{len(targets)}] {wid} …", flush=True)
        try:
            original = curl_bytes(url, args.user, args.password)
            web_bytes, ctype = make_web_derivative(original)
            tmp.write_bytes(web_bytes)
            put_code, put_body = curl_json(
                f"{base}/atelier/api/oeuvres/{wid}/web",
                args.user,
                args.password,
                method="POST",
                form_file=str(tmp),
                form_type=ctype,
            )
            if put_code not in (200, 201):
                raise RuntimeError(f"POST web → HTTP {put_code}: {put_body[:180]!r}")
            entry = {
                "id": wid,
                "original_bytes": len(original),
                "web_bytes": len(web_bytes),
                "content_type": ctype,
                "ratio": round(len(web_bytes) / max(1, len(original)), 4),
            }
            report["ok"].append(entry)
            print(
                f"  OK original={len(original)} web={len(web_bytes)} "
                f"{ctype} ({entry['ratio']:.0%})",
                flush=True,
            )
        except Exception as exc:  # noqa: BLE001
            report["fail"].append({"id": wid, "error": str(exc)[:200]})
            print(f"  FAIL {exc}", flush=True)
        time.sleep(args.sleep)

    Path(args.report).parent.mkdir(parents=True, exist_ok=True)
    Path(args.report).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(
        f"done ok={len(report['ok'])} fail={len(report['fail'])} report={args.report}"
    )
    return 0 if not report["fail"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
