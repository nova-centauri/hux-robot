#!/usr/bin/env python3
"""check_repo.py - the Hux STE gate.

This tool runs the STE structural checks of ste_check.py on all the active
text of the repository:

- active Markdown files (not the archive, not the research notes)
- the text fields of the plan data and the mechanical test data (V1-PROOF only)
- the visible text of the V1-PROOF pages in tools/living-drawings
- the text constants of tools/living-drawings/build_site.py

Usage:
    python3 tools/ste/check_repo.py            # check everything, exit 1 on errors
    python3 tools/ste/check_repo.py --list     # list the files that the gate checks
    python3 tools/ste/check_repo.py FILE...    # check only these files
    python3 tools/ste/check_repo.py --vocab    # also report words that are not approved

The vocabulary report is advisory. Robotics technical names (gearmotor, encoder,
IMU) are permitted by STE rule 1.5 but are not in the approved word list.
Exit code 0 = no structural errors. Exit code 1 = one or more errors.
"""

import ast
import json
import re
import sys
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE / "scripts"))
import ste_check  # noqa: E402

DRAWINGS = ROOT / "tools" / "living-drawings"

# Markdown trees that the gate does not check. The archive and the research
# notes are historical records. The STE skill text is upstream text.
MD_EXCLUDE_PREFIXES = (
    "docs/archive/", "docs/research/", "tools/ste/", "cad/vendor/",
    "cad/prints/v1-proof-r01/hux-v1-proof-r01/", "dist/", "node_modules/",
    ".claude/", "Claude outputs/",
)
# Checklists are procedures. The other documents mix procedure and description.
PROCEDURAL_PREFIXES = ("docs/checklists/",)

# Pages of the V0-GENESIS archive. Keep this set equal to ARCHIVE_PAGES in build_site.py.
ARCHIVE_PAGES = {"v0-genesis.html", "stairs.html", "sheet.html", "sheet2.html", "sim.html",
                 "flow.html", "software.html", "hardware.html", "media.html", "engineering.html"}

JSON_FILES = ("plan-data.json", "mechanical-tests-data.json")
# JSON keys that hold titles, names, identifiers, or values. STE rule 8.6 counts
# a title as one word, so the gate does not check these fields.
JSON_SKIP_KEYS = {"id", "title", "name", "label", "value", "href", "url", "path", "file",
                  "source", "sources", "sourcePaths", "date", "updatedAt", "revision", "status",
                  "kind", "type", "icon", "version", "currentVersion", "schemaVersion", "sku",
                  "vendor", "unit", "code", "currency", "schema"}
# Version records of the plan data that the gate does not check.
JSON_SKIP_VERSIONS = {"V0-GENESIS"}

# HTML elements whose text is a title, a label, a control, or code (rule 8.6).
HTML_SKIP_TAGS = {"script", "style", "svg", "template", "noscript", "code", "pre", "kbd", "samp",
                  "title", "h1", "h2", "h3", "h4", "h5", "h6", "th", "td", "button", "label",
                  "option", "select", "nav", "input", "textarea", "math", "var"}
HTML_BLOCK_TAGS = {"p", "li", "dd", "dt", "div", "section", "article", "aside", "header", "footer",
                   "main", "figcaption", "summary", "details", "blockquote", "br", "tr", "ul", "ol",
                   "dl", "table", "figure", "form", "fieldset", "legend", "small", "output"}


def rel(path):
    return path.resolve().relative_to(ROOT).as_posix()


# ---------------------------------------------------------------- collectors

def markdown_files():
    out = []
    for p in sorted(ROOT.rglob("*.md")):
        r = rel(p)
        if r.startswith(MD_EXCLUDE_PREFIXES) or "/node_modules/" in r or r.startswith(".git/"):
            continue
        out.append(p)
    return out


def html_files():
    return [p for p in sorted(DRAWINGS.glob("*.html")) if p.name not in ARCHIVE_PAGES]


def json_files():
    return [DRAWINGS / n for n in JSON_FILES if (DRAWINGS / n).exists()]


def json_text(path):
    """Return the prose strings of a JSON file, one block for each string."""
    data = json.loads(path.read_text(encoding="utf-8"))
    blocks = []

    def walk(node, key=None):
        if isinstance(node, dict):
            if key == "versions" or ("id" in node and node.get("id") in JSON_SKIP_VERSIONS):
                pass
            if node.get("id") in JSON_SKIP_VERSIONS:
                return
            for k, v in node.items():
                if k in JSON_SKIP_KEYS:
                    continue
                walk(v, k)
        elif isinstance(node, list):
            for v in node:
                walk(v, key)
        elif isinstance(node, str):
            if len(node.split()) >= 4 and re.search(r"[A-Za-z]{3}", node):
                blocks.append(node.strip())

    walk(data)
    return "\n\n".join(blocks)


class TextCollector(HTMLParser):
    """Collect the visible text of a page, one block for each block element."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.blocks = []
        self.current = []

    def flush(self):
        text = " ".join("".join(self.current).split())
        if text:
            self.blocks.append(text)
        self.current = []

    def skipping(self):
        return any(t in HTML_SKIP_TAGS for t in self.stack)

    def handle_starttag(self, tag, attrs):
        if tag in HTML_BLOCK_TAGS or tag in HTML_SKIP_TAGS:
            self.flush()
        if tag not in ("br", "input", "img", "hr", "meta", "link", "source", "wbr"):
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in HTML_BLOCK_TAGS or tag in HTML_SKIP_TAGS:
            self.flush()
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if not self.skipping():
            self.current.append(data)

    def close(self):
        super().close()
        self.flush()


def html_text(path):
    parser = TextCollector()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    blocks = [b for b in parser.blocks if len(b.split()) >= 4 and re.search(r"[A-Za-z]{3}", b)]
    return "\n\n".join(blocks)


def python_text(path):
    """Return the prose string constants of a Python file, without HTML tags."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    blocks = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            text = re.sub(r"<[^>]+>", " ", node.value)
            text = " ".join(unescape(text).split())
            if len(text.split()) >= 6 and re.search(r"[A-Za-z]{3}", text) and " " in text:
                if "{" in node.value and "}" in node.value and re.search(r"\{[a-z_]+", node.value):
                    text = re.sub(r"\{[^}]*\}", "X", text)
                blocks.append(text)
    return "\n\n".join(blocks)


# ---------------------------------------------------------------- main

def targets(selected=None):
    """Return (path, kind, mode) for each file the gate checks."""
    out = []
    for p in markdown_files():
        mode = "procedural" if rel(p).startswith(PROCEDURAL_PREFIXES) else "mixed"
        out.append((p, "md", mode))
    for p in json_files():
        out.append((p, "json", "mixed"))
    for p in html_files():
        out.append((p, "html", "mixed"))
    builder = DRAWINGS / "build_site.py"
    if builder.exists():
        out.append((builder, "py", "mixed"))
    if selected:
        wanted = {Path(s).resolve() for s in selected}
        out = [t for t in out if t[0].resolve() in wanted]
    return out


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    flags = {a for a in argv if a.startswith("--")}
    items = targets(args or None)
    if "--list" in flags:
        for p, kind, mode in items:
            print(f"{kind:5} {mode:11} {rel(p)}")
        return 0

    approved = None
    if "--vocab" in flags:
        approved = ste_check.load_word_list(HERE / "references" / "word-list.md")

    report = ste_check.Report()
    for p, kind, mode in items:
        if kind == "md":
            text = p.read_text(encoding="utf-8")
        elif kind == "json":
            text = json_text(p)
        elif kind == "html":
            text = html_text(p)
        else:
            text = python_text(p)
        ste_check.check_text(text, mode, report, rel(p), approved)

    for loc, rule, msg in report.errors:
        print(f"ERROR   {loc} [rule {rule}] {msg}")
    if "--warnings" in flags:
        for loc, rule, msg in report.warnings:
            print(f"WARNING {loc} [rule {rule}] {msg}")
    if report.unknown:
        words = sorted(report.unknown, key=report.unknown.get, reverse=True)
        print(f"\nCHECK   {len(words)} words are not in the approved word list (advisory).")
        for chunk in [words[i:i + 12] for i in range(0, len(words), 12)]:
            print("        " + ", ".join(chunk))

    print(f"\nSTE gate: {len(items)} files, {len(report.errors)} errors, "
          f"{len(report.warnings)} warnings (use --warnings to list them).")
    if report.errors:
        print("The active text does not obey the STE structural rules. Correct the errors above.")
        print("Rules: tools/ste/references/writing-rules.md. Standard: docs/writing-standard.md.")
        return 1
    print("The active text obeys the STE structural rules that this tool can check.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
