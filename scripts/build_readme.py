#!/usr/bin/env python3
"""projects.json 으로 README.md 의 프로젝트 카드 구간을 다시 만든다.

README.md 안의 두 표식 사이만 바꾸고 나머지 본문은 건드리지 않는다.

    <!-- PROJECTS:START -->
    ...여기가 매번 새로 생성된다...
    <!-- PROJECTS:END -->

사용법
    python3 scripts/build_readme.py                 # README.md 갱신
    python3 scripts/build_readme.py --check         # 갱신이 필요하면 exit 1 (CI 용)
    python3 scripts/build_readme.py --sync-thumbs ../   # 형제 저장소들의 docs/images/thumbnail.png 를
                                                         # docs/images/projects/<name>.png 로 줄여 복사

새 프로젝트를 추가할 때는 projects.json 의 "projects" 배열에 한 항목을 넣고 이 스크립트를 돌린다.
표준 라이브러리만 쓴다(썸네일 축소는 Pillow 가 있으면 Pillow, 없으면 macOS sips, 둘 다 없으면 그대로 복사).
"""
from __future__ import annotations

import argparse
import html
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "projects.json"
README = ROOT / "README.md"
START = "<!-- PROJECTS:START -->"
END = "<!-- PROJECTS:END -->"
REQUIRED = ("name", "repo", "category", "ko", "en", "status", "started", "thumb")
THUMB_WIDTH = 800  # README 카드에는 이 폭이면 충분하다(원본은 3200x1800)


def load() -> dict:
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    cats = [c["id"] for c in data["categories"]]
    seen = set()
    errors = []
    for i, p in enumerate(data["projects"]):
        missing = [k for k in REQUIRED if not p.get(k)]
        if missing:
            errors.append(f"projects[{i}] ({p.get('name', '?')}): 빠진 필드 {missing}")
        if p.get("category") not in cats:
            errors.append(f"{p.get('name')}: 분류 '{p.get('category')}' 가 categories 에 없음 ({cats})")
        if p.get("name") in seen:
            errors.append(f"{p.get('name')}: 이름 중복")
        seen.add(p.get("name"))
    if errors:
        sys.exit("projects.json 오류\n  " + "\n  ".join(errors))
    return data


def cell(p: dict) -> str:
    e = html.escape
    title = e(p.get("title") or p["name"])
    repo = e(p["repo"])
    thumb = p["thumb"]
    if not (ROOT / thumb).exists():
        print(f"[경고] 썸네일 없음: {thumb} (--sync-thumbs 로 받거나 직접 넣으세요)", file=sys.stderr)
    return (
        '<td width="50%" valign="top">\n'
        f'<a href="{repo}"><img src="{e(thumb)}" alt="{title}" width="400"></a><br>\n'
        f'<b><a href="{repo}">{title}</a></b> <sub>· {e(p["started"])} 시작</sub><br>\n'
        f'{e(p["ko"])}<br>\n'
        f'<sub>{e(p["en"])}</sub><br>\n'
        f'<sub>{e(p["status"])}</sub>\n'
        "</td>"
    )


def render(data: dict) -> str:
    projects = data["projects"]
    out = [START, "", f"<!-- scripts/build_readme.py 가 projects.json 으로 만든 구간입니다. 직접 고치지 마세요. -->", ""]
    out.append(f"프로젝트 {len(projects)}개 · 분류 {len(data['categories'])}개 · 카드 썸네일의 화면은 설명용 목업입니다.")
    out.append("")
    for c in data["categories"]:
        group = [p for p in projects if p["category"] == c["id"]]
        if not group:
            continue
        out.append(f"### {c['id']} · {c['en']}")
        out.append("")
        out.append(c.get("ko_desc", ""))
        out.append("")
        out.append("<table>")
        for i in range(0, len(group), 2):
            pair = group[i : i + 2]
            cells = [cell(p) for p in pair]
            if len(cells) == 1:
                cells.append('<td width="50%" valign="top"></td>')
            out.append("<tr>")
            out.extend(cells)
            out.append("</tr>")
        out.append("</table>")
        out.append("")
    out.append(END)
    return "\n".join(out)


def replace_block(text: str, block: str) -> str:
    s, e = text.find(START), text.find(END)
    if s < 0 or e < 0 or e < s:
        sys.exit(f"README.md 에 {START} / {END} 표식이 없습니다.")
    return text[:s] + block + text[e + len(END) :]


def shrink(src: Path, dst: Path) -> str:
    dst.parent.mkdir(parents=True, exist_ok=True)
    try:
        from PIL import Image  # type: ignore

        with Image.open(src) as im:
            im = im.convert("RGB")
            h = round(im.height * THUMB_WIDTH / im.width)
            im.resize((THUMB_WIDTH, h), Image.LANCZOS).save(dst, optimize=True)
        return "pillow"
    except ImportError:
        pass
    if shutil.which("sips"):
        shutil.copyfile(src, dst)
        subprocess.run(["sips", "--resampleWidth", str(THUMB_WIDTH), str(dst)], check=True, capture_output=True)
        return "sips"
    shutil.copyfile(src, dst)
    return "copy"


def sync_thumbs(data: dict, repos_dir: Path) -> None:
    for p in data["projects"]:
        src = repos_dir / p["name"] / "docs" / "images" / "thumbnail.png"
        if not src.exists():
            print(f"[건너뜀] {p['name']}: {src} 없음", file=sys.stderr)
            continue
        how = shrink(src, ROOT / p["thumb"])
        print(f"[썸네일] {p['name']} → {p['thumb']} ({how})")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="README 가 최신이 아니면 exit 1")
    ap.add_argument("--sync-thumbs", metavar="REPOS_DIR", type=Path,
                    help="<REPOS_DIR>/<name>/docs/images/thumbnail.png 를 줄여 복사")
    args = ap.parse_args()

    data = load()
    if args.sync_thumbs:
        sync_thumbs(data, args.sync_thumbs.expanduser().resolve())

    text = README.read_text(encoding="utf-8")
    new = replace_block(text, render(data))
    if args.check:
        if new != text:
            sys.exit("README.md 가 projects.json 과 다릅니다. python3 scripts/build_readme.py 를 돌리세요.")
        print("README.md 최신")
        return
    if new != text:
        README.write_text(new, encoding="utf-8")
        print(f"README.md 갱신 (프로젝트 {len(data['projects'])}개)")
    else:
        print("README.md 변경 없음")


if __name__ == "__main__":
    main()
