#!/usr/bin/env python3
"""
Backfill dérivés web pour Galerie Vittet (ajouts KV).

- Lit la bibliothèque atelier (Basic Auth)
- Pour chaque œuvre sans champ `web` (ou --force) : télécharge l'original,
  redimensionne (max edge 1800, JPEG q=82), POST /atelier/api/oeuvres/:id/web
- Ne supprime / n'écrase jamais l'original (detail:)

Usage:
  python3 backfill-web-derivatives.py \\
    --base https://atelier-kv-preview.galerie-vittet-preview.pages.dev \\
    --user vittet --password '…'
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

WEB_MAX_EDGE = 1800
JPEG_QUALITY = 82


def curl_json(url: str, user: str, password: str, method: str = "GET", form_file=None):
    cmd = [
        "curl",
        "-sS",
        "-A",
        "GalerieVittet-WebBackfill/1.0",
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
        cmd.extend(["-F", f"web=@{form_file};type=image/jpeg"])
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
        "GalerieVittet-WebBackfill/1.0",
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


def make_web_jpeg(raw: bytes) -> bytes:
    img = Image.open(io.BytesIO(raw))
    img = img.convert("RGB")
    w, h = img.size
    scale = min(1.0, WEB_MAX_EDGE / max(w, h))
    if scale < 1.0:
        nw = max(1, round(w * scale))
        nh = max(1, round(h * scale))
        img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buf.getvalue()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    parser.add_argument("--user", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--only", default="", help="Comma-separated work ids")
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
        web = work.get("web") or ""
        if web and not args.force:
            continue
        if not work.get("image"):
            continue
        targets.append(work)

    if args.limit > 0:
        targets = targets[: args.limit]

    print(f"backfill candidates: {len(targets)} / {len(works)}")
    report = {"ok": [], "fail": [], "skipped": []}
    tmp = Path("/tmp/web-derivative.jpg")

    for i, work in enumerate(targets, 1):
        wid = work["id"]
        image_path = work["image"]
        url = f"{base}/{image_path}"
        print(f"[{i}/{len(targets)}] {wid} …", flush=True)
        try:
            original = curl_bytes(url, args.user, args.password)
            web_bytes = make_web_jpeg(original)
            tmp.write_bytes(web_bytes)
            put_code, put_body = curl_json(
                f"{base}/atelier/api/oeuvres/{wid}/web",
                args.user,
                args.password,
                method="POST",
                form_file=str(tmp),
            )
            if put_code not in (200, 201):
                raise RuntimeError(f"POST web → HTTP {put_code}: {put_body[:180]!r}")
            entry = {
                "id": wid,
                "original_bytes": len(original),
                "web_bytes": len(web_bytes),
                "ratio": round(len(web_bytes) / max(1, len(original)), 4),
            }
            report["ok"].append(entry)
            print(
                f"  OK original={len(original)} web={len(web_bytes)} "
                f"({entry['ratio']:.0%})",
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
