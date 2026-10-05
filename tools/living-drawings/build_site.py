#!/usr/bin/env python3
"""Publish the workshop and its Markdown sources as a portable static website.

No third-party packages or network access are required. The Markdown renderer
covers the repository's headings, tables, nested lists, checklists, blockquotes,
fenced code, emphasis, links and images. Source documents remain the authority.
Do not edit the generated pages. Run `python3 build_site.py --help`.
"""

from __future__ import annotations

import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import importlib.util
from urllib.parse import parse_qsl, quote, unquote, urlencode, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[2]
WEB = PurePosixPath("tools/living-drawings")
SOURCE_TREES = ("docs", "cad", "art", "firmware", "software", "tools/v1-proof", "tools/engineering")
OMIT = {".git", "node_modules", "__pycache__", ".DS_Store"}
# Local downloads and the extracted copy of the print ZIP are not source pages.
# Publish the canonical print-kit folder and ZIP; the sandbox has a mesh fallback.
LOCAL_ONLY = (PurePosixPath("cad/vendor"), WEB / "models",
              PurePosixPath("cad/prints/v1-proof-r01/hux-v1-proof-r01"))
URL_ATTRS = {"href", "src", "poster", "data-mesh", "data-poster"}
LIST = re.compile(r"^( *)([-+*]|\d+[.)]) +(.*)$")
MAIN_ROUTES = (
    ("index.html", "Overview"), ("mechanical.html", "Mechanical"),
    ("electrical.html", "Electrical"), ("build.html", "Build & test"),
    ("parts.html", "Parts & budget"), ("documents.html", "Documents"),
)
SUB_ROUTES = {
    "mechanical.html": (("mechanical.html", "Assembly"), ("joints.html", "Joint details"),
                        ("mechanical-tests.html", "Mechanical tests")),
    "electrical.html": (("electrical.html", "Wiring"), ("controls.html", "Control software")),
    "build.html": (("build.html", "Build plan"), ("docs/one-leg-bench.html", "Bench testing"),
                   ("proof-simulation.html", "Simulation evidence"), ("proof-sandbox.html", "3D sandbox")),
}
OLD_SECTIONS = {
    "build": ("build.html", ""), "model": ("mechanical.html", ""),
    "connections": ("electrical.html", ""), "intelligence": ("controls.html", ""),
    "budget": ("parts.html", ""), "archive": ("documents.html", "archive"),
}
ARCHIVE_PAGES = {"v0-genesis.html", "stairs.html", "sheet.html", "sheet2.html", "sim.html",
                 "flow.html", "software.html", "hardware.html", "media.html", "engineering.html"}


def slug(text: str) -> str:
    """GitHub-style fragment IDs, with Unicode and duplicate headings."""
    text = re.sub(r"!?\[([^]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"<[^>]*>", "", html.unescape(text)).lower()
    text = re.sub(r"[^\w\-\s]", "", text)
    return text.replace(" ", "-")


def site_path(source: PurePosixPath) -> PurePosixPath:
    if source.is_relative_to(WEB):
        source = source.relative_to(WEB)
    return source.with_suffix(".html") if source.suffix.lower() == ".md" else source


def source_url(url: str, source: PurePosixPath, root: Path) -> str:
    """Resolve URLs in repository coordinates, then relocate into the site."""
    parsed = urlsplit(html.unescape(url))
    if parsed.scheme or parsed.netloc or not parsed.path:
        return html.unescape(url)
    raw = unquote(parsed.path)
    # A leading slash already denotes the published root, useful in new pages.
    if raw.startswith("/"):
        target = PurePosixPath(raw.lstrip("/"))
        if target.suffix.lower() == ".md":
            target = target.with_suffix(".html")
    else:
        normalized = os.path.normpath(str(source.parent / raw)).replace(os.sep, "/")
        target_source = PurePosixPath(normalized)
        directory = root / target_source
        if directory.is_dir() and (directory / "README.md").is_file():
            target_source /= "README.md"
        target = site_path(target_source)
    fragment = parsed.fragment
    # Published links follow the new project sections. Direct old bookmarks are
    # still accepted by workshop.js on the index/v1-proof alias.
    if str(target) in {"index.html", "v1-proof.html"} and fragment in OLD_SECTIONS:
        route, fragment = OLD_SECTIONS[fragment]
        target = PurePosixPath(route)
    relocated = os.path.relpath(str(target), str(site_path(source).parent)).replace(os.sep, "/")
    return urlunsplit(("", "", quote(relocated, safe="/.-_~"), parsed.query, fragment))


def inline(text: str, link=lambda url: url) -> str:
    """Escape the source text. Emit only the markup that this renderer creates."""
    out = []
    i = 0
    while i < len(text):
        if text[i] == "\\" and i + 1 < len(text) and text[i + 1] in r"\`*_{}[]()#+-.!|>":
            out.append(html.escape(text[i + 1])); i += 2; continue
        if text[i] == "`":
            ticks = len(text[i:]) - len(text[i:].lstrip("`"))
            end = text.find("`" * ticks, i + ticks)
            if end >= 0:
                out.append("<code>" + html.escape(text[i + ticks:end]) + "</code>")
                i = end + ticks; continue
        image = text.startswith("![", i)
        start = i + 1 if image else i
        if text[start:start + 1] == "[":
            middle, brackets = start + 1, 1
            while middle < len(text) and brackets:
                if text[middle] == "\\": middle += 2; continue
                if text[middle] == "[": brackets += 1
                if text[middle] == "]": brackets -= 1
                if brackets: middle += 1
            if brackets == 0 and text[middle:middle + 2] == "](":
                depth, end = 1, middle + 2
                while end < len(text) and depth:
                    if text[end] == "(": depth += 1
                    if text[end] == ")": depth -= 1
                    end += 1
                if not depth:
                    label = text[start + 1:middle]
                    url = text[middle + 2:end - 1].strip()
                    title = ""
                    titled = re.fullmatch(r'(.*?)\s+"(.*)"', url)
                    if titled:
                        url, title = titled.groups()
                    url = url.removeprefix("<").removesuffix(">")
                    # Documents are owned sources, but never turn an accidental
                    # javascript/data link into an executable page instruction.
                    if urlsplit(url).scheme.lower() in {"javascript", "data", "vbscript"}:
                        out.append(html.escape(label)); i = end; continue
                    attrs = f' title="{html.escape(title, quote=True)}"' if title else ""
                    url = html.escape(link(url), quote=True)
                    if image:
                        out.append(f'<img src="{url}" alt="{html.escape(label, quote=True)}" loading="lazy"{attrs}>')
                    else:
                        out.append(f'<a href="{url}"{attrs}>{inline(label)}</a>')
                    i = end; continue
        matched = False
        # Printable session records use underscore runs as write-in blanks.
        blank = re.match(r"_{3,}(?=\W|$)", text[i:])
        if blank:
            out.append(blank[0]); i += blank.end(); continue
        for marker, tag in (("**", "strong"), ("__", "strong"), ("~~", "del"), ("*", "em"), ("_", "em")):
            if not text.startswith(marker, i):
                continue
            if marker.startswith("_") and i and text[i - 1].isalnum():
                continue
            content_start = i + len(marker)
            if content_start >= len(text) or text[content_start].isspace() or text[content_start] == marker[0]:
                continue
            end = text.find(marker, i + len(marker))
            while end > 0 and text[end - 1].isspace():
                end = text.find(marker, end + len(marker))
            if end > i + len(marker):
                out.append(f"<{tag}>" + inline(text[i + len(marker):end], link) + f"</{tag}>")
                i = end + len(marker); matched = True; break
        if matched: continue
        auto = re.match(r"<(https?://[^>]+)>", text[i:])
        if auto:
            url = html.escape(auto[1], quote=True)
            out.append(f'<a href="{url}">{url}</a>'); i += auto.end(); continue
        out.append(html.escape(text[i])); i += 1
    return "".join(out)


def cells(line: str) -> list[str]:
    # A pipe inside `code` or escaped as \| does not end a table cell.
    line = line.strip().strip("|")
    out, part, fence = [], [], 0
    i = 0
    while i < len(line):
        if line[i] == "\\" and i + 1 < len(line):
            part.extend(line[i:i + 2]); i += 2; continue
        if line[i] == "`":
            n = len(line[i:]) - len(line[i:].lstrip("`"))
            fence = 0 if fence == n else (n if not fence else fence)
            part.extend(line[i:i + n]); i += n; continue
        if line[i] == "|" and not fence:
            out.append("".join(part).strip()); part = []
        else:
            part.append(line[i])
        i += 1
    out.append("".join(part).strip())
    return out


class Markdown:
    def __init__(self, link=lambda url: url):
        self.link = link
        self.headings = []
        self.ids = {}

    def render(self, source: str) -> str:
        return self.blocks(source.expandtabs(4).splitlines())

    def blocks(self, lines: list[str]) -> str:
        out, i = [], 0
        while i < len(lines):
            line = lines[i]
            if not line.strip(): i += 1; continue
            fence = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
            if fence:
                content, i = [], i + 1
                while i < len(lines) and not re.match(r"^ {0,3}" + re.escape(fence[1][0]) + "{" + str(len(fence[1])) + r",}\s*$", lines[i]):
                    content.append(lines[i]); i += 1
                language = re.sub(r"[^\w-]", "", fence[2].strip().split(" ")[0])
                attr = f' class="language-{language}"' if language else ""
                out.append(f"<pre><code{attr}>" + html.escape("\n".join(content)) + "</code></pre>")
                i += 1; continue
            heading = re.match(r"^ {0,3}(#{1,6}) +(.+?)\s*#*\s*$", line)
            if heading:
                level, title = len(heading[1]), heading[2]
                base = slug(title); count = self.ids.get(base, 0); self.ids[base] = count + 1
                anchor = base + (f"-{count}" if count else "")
                self.headings.append((level, title, anchor))
                out.append(f'<h{level} id="{anchor}">{inline(title, self.link)}<a class="heading-anchor" href="#{anchor}" aria-label="Link to this section">#</a></h{level}>')
                i += 1; continue
            if re.fullmatch(r" {0,3}([-*_])(?:\s*\1){2,}\s*", line):
                out.append("<hr>"); i += 1; continue
            if line.lstrip().startswith(">"):
                quote_lines = []
                while i < len(lines) and lines[i].lstrip().startswith(">"):
                    quote_lines.append(re.sub(r"^\s*> ?", "", lines[i])); i += 1
                out.append("<blockquote>" + self.blocks(quote_lines) + "</blockquote>"); continue
            if i + 1 < len(lines) and "|" in line and all(re.fullmatch(r":?-{3,}:?", c.replace(" ", "")) for c in cells(lines[i + 1])):
                headers, dividers = cells(line), cells(lines[i + 1])
                aligns = ["center" if c.startswith(":") and c.endswith(":") else "right" if c.endswith(":") else "left" for c in dividers]
                def row(values, tag):
                    return "<tr>" + "".join(f'<{tag} style="text-align:{aligns[n] if n < len(aligns) else "left"}">' + inline(value, self.link) + f"</{tag}>" for n, value in enumerate(values)) + "</tr>"
                out.append('<div class="doc-table" tabindex="0" role="region" aria-label="Scrollable table"><table><thead>' + row(headers, "th") + "</thead><tbody>")
                i += 2
                while i < len(lines) and lines[i].strip() and "|" in lines[i]:
                    out.append(row(cells(lines[i]), "td")); i += 1
                out.append("</tbody></table></div>"); continue
            match = LIST.match(line)
            if match:
                indent = len(match[1]); ordered = match[2][0].isdigit()
                tag = "ol" if ordered else "ul"
                number = int(match[2][:-1]) if ordered else 1
                start = f' start="{number}"' if ordered else ""
                out.append(f"<{tag}{start}>")
                while i < len(lines):
                    item = LIST.match(lines[i])
                    if not item or len(item[1]) != indent or item[2][0].isdigit() != ordered: break
                    continuation = indent + len(item[2]) + 1
                    item_lines = [item[3]]; i += 1
                    while i < len(lines):
                        if not lines[i].strip():
                            if i + 1 < len(lines) and len(lines[i + 1]) - len(lines[i + 1].lstrip()) > indent:
                                item_lines.append(""); i += 1; continue
                            break
                        if len(lines[i]) - len(lines[i].lstrip()) <= indent: break
                        item_lines.append(lines[i][min(continuation, len(lines[i]) - len(lines[i].lstrip())):]); i += 1
                    task = re.match(r"^\[([ xX])\] +(.*)$", item_lines[0])
                    check = ""
                    if task:
                        item_lines[0] = task[2]
                        checked = ' checked' if task[1].lower() == "x" else ""
                        check = f'<input type="checkbox" disabled{checked} aria-label="{"Complete" if checked else "Pending"}"> '
                    rendered = self.blocks(item_lines)
                    rendered = re.sub(r"^<p>(.*?)</p>(?=\s*(?:<[uo]l|$))", r"\1", rendered, count=1, flags=re.S)
                    task_class = ' class="task-item"' if task else ""
                    out.append(f'<li{task_class}>{check}{rendered}</li>')
                    while i < len(lines) and not lines[i].strip(): i += 1
                out.append(f"</{tag}>"); continue
            if line.startswith("    "):
                code = []
                while i < len(lines) and (lines[i].startswith("    ") or not lines[i].strip()):
                    code.append(lines[i][4:]); i += 1
                out.append("<pre><code>" + html.escape("\n".join(code).rstrip()) + "</code></pre>"); continue
            paragraph = [line]; i += 1
            while i < len(lines) and lines[i].strip():
                if re.match(r"^ {0,3}(#{1,6} |>|`{3,}|~{3,}|(?:[-*_]\s*){3,}$)", lines[i]) or LIST.match(lines[i]): break
                if i + 1 < len(lines) and "|" in lines[i] and all(re.fullmatch(r":?-{3,}:?", c.replace(" ", "")) for c in cells(lines[i + 1])): break
                paragraph.append(lines[i]); i += 1
            out.append("<p>" + inline("\n".join(paragraph), self.link).replace("  \n", "<br>\n") + "</p>")
        return "\n".join(out)


def legacy(source: PurePosixPath) -> bool:
    return (str(source).startswith(("docs/archive/", "docs/research/", "tools/engineering/", "art/", "cad/vendor/"))
            or str(source) == "docs/head-and-leg-review.md" or str(site_path(source)) in ARCHIVE_PAGES)


def published_url(source: PurePosixPath, path: str) -> str:
    """A root-site route relative to a published page, escaped for HTML."""
    parsed = urlsplit(path)
    relative = os.path.relpath(parsed.path, str(site_path(source).parent)).replace(os.sep, "/")
    return html.escape(urlunsplit(("", "", relative, parsed.query, parsed.fragment)), quote=True)


def route_section(source: PurePosixPath) -> str:
    route = str(site_path(source))
    if route == "v1-proof.html": return "index.html"
    for section, entries in SUB_ROUTES.items():
        if route in {path for path, _ in entries} and source.suffix.lower() == ".html": return section
    return route if route in dict(MAIN_ROUTES) else "documents.html"


def workshop_header(source: PurePosixPath, title: str) -> str:
    """One project navigation and revision context for every published page."""
    section = route_section(source)
    route = str(site_path(source))
    at = lambda path: published_url(source, path)
    historical = legacy(source)
    links = "".join(f'<a href="{at(path)}"' + (' aria-current="page"' if section == path else '') +
                    f'>{html.escape(label)}</a>' for path, label in MAIN_ROUTES)
    section_label = dict(MAIN_ROUTES)[section]
    breadcrumb = f'<a href="{at("index.html")}">Workshop</a>'
    if section != "index.html":
        breadcrumb += f'<span aria-hidden="true">/</span><a href="{at(section)}">{html.escape(section_label)}</a>'
    if route != section and route != "v1-proof.html":
        breadcrumb += f'<span aria-hidden="true">/</span><span>{html.escape(title)}</span>'
    revision = "V0-GENESIS · archive" if historical else "V1-PROOF · current build"
    subnav = ""
    if section in SUB_ROUTES:
        sublinks = "".join(f'<a href="{at(path)}"' + (' aria-current="page"' if route == path else '') +
                           f'>{html.escape(label)}</a>' for path, label in SUB_ROUTES[section])
        subnav = f'<nav class="workshop-subnav" aria-label="{html.escape(section_label)} pages">{sublinks}</nav>'
    return f'''<header class="workshop-header"><div class="workshop-header-inner"><a class="workshop-brand" href="{at('index.html')}">HUX<span>Mechanical project</span></a><nav class="workshop-nav" aria-label="Project navigation">{links}</nav></div></header>
<div class="workshop-routebar"><div class="workshop-breadcrumb" aria-label="Breadcrumb">{breadcrumb}<span class="workshop-revision">{revision}</span></div>{subnav}</div>'''


def workshop_footer(source: PurePosixPath) -> str:
    at = lambda path: published_url(source, path)
    context = "V0-GENESIS · archived studies" if legacy(source) else "V1-PROOF · engineering work in progress"
    return f'''<footer class="workshop-footer"><div class="workshop-footer-inner"><span>HUX / {context}</span><nav aria-label="Project references"><a href="{at('documents.html')}">Document library</a><a href="{at('v0-genesis.html')}">Archive</a></nav><p>Design references and recorded evidence. Physical qualification remains open.</p></div></footer>'''


def workshop_assets(source: PurePosixPath) -> str:
    return f'<link rel="stylesheet" href="{published_url(source, "workshop.css")}"><script src="{published_url(source, "workshop.js")}" defer></script>'


def authored_page(text: str, source: PurePosixPath, root: Path) -> str:
    """Replace the navigation. Do not reserialize the drawings or the interactive code."""
    text = rewrite_html(text, source, root)
    title_match = re.search(r'<title\b[^>]*>(.*?)</title>', text, flags=re.I | re.S)
    title = html.unescape(re.sub(r'<[^>]+>', '', title_match[1])).split(' · ')[0] if title_match else source.stem.replace('-', ' ').title()
    # The old mastheads contain useful H1/engineering context. Keep those
    # headings, while removing their competing site navigation.
    header = re.search(r'<header\b[^>]*>.*?</header\s*>', text, flags=re.I | re.S)
    if header:
        replacement = header[0] if re.search(r'<h[1-6]\b', header[0], flags=re.I) else ''
        replacement = re.sub(r'<nav\b[^>]*>.*?</nav\s*>', '', replacement, flags=re.I | re.S)
        text = text[:header.start()] + replacement + text[header.end():]
    text = re.sub(r'<nav\b[^>]*\bclass\s*=\s*(["\x27])[^"\x27]*\bversion-rail\b[^"\x27]*\1[^>]*>.*?</nav\s*>', '', text, flags=re.I | re.S)
    # Retain page-specific evidence statements, but make the shared footer the
    # only site footer. Nested archival notes and document edit links are content.
    text = re.sub(r'<footer\b(?![^>]*\bclass\s*=)[^>]*>(.*?)</footer\s*>',
                  r'<aside class="workshop-page-note">\1</aside>', text, flags=re.I | re.S)
    assets = ''
    if not re.search(r'\bhref\s*=\s*(["\x27])[^"\x27]*workshop\.css(?:[?][^"\x27]*)?\1', text, flags=re.I):
        assets += f'<link rel="stylesheet" href="{published_url(source, "workshop.css")}">'
    if not re.search(r'\bsrc\s*=\s*(["\x27])[^"\x27]*workshop\.js(?:[?][^"\x27]*)?\1', text, flags=re.I):
        assets += f'<script src="{published_url(source, "workshop.js")}" defer></script>'
    if re.search(r'</head\s*>', text, flags=re.I):
        text = re.sub(r'</head\s*>', assets + '</head>', text, count=1, flags=re.I)
    else:
        text = re.sub(r'(<html\b[^>]*>)', lambda match: match[0] + '<head>' + assets + '</head>', text, count=1, flags=re.I)
    text = re.sub(r'(<body\b[^>]*>)', lambda match: match[0] + '\n' + workshop_header(source, title), text, count=1, flags=re.I)
    text = re.sub(r'</body\s*>', workshop_footer(source) + '\n</body>', text, count=1, flags=re.I)
    return text


def document_sidebar(source: PurePosixPath, root: Path) -> str:
    groups = (
        ("Project", (("documents.html", "Document library"), ("docs/v1-proof.html", "Project brief"),
                     ("docs/decisions.html", "Decision history"))),
        ("Mechanical", (("mechanical.html", "Assembly overview"), ("joints.html", "Joint details"),
                        ("docs/mechanical-testing.html", "Mechanical test plan"))),
        ("Electrical & controls", (("electrical.html", "Wiring diagrams"), ("controls.html", "Control software"))),
        ("Build & test", (("build.html", "Build board"), ("docs/one-leg-bench.html", "Single-leg bench guide"),
                          ("docs/checklists/README.html", "Build checklists"))),
        ("Parts & records", (("parts.html", "Parts & budget"), ("docs/parts-on-hand.html", "Inventory & orders"),
                             ("v0-genesis.html", "Archived studies"))),
    )
    rendered = []
    for label, entries in groups:
        links = []
        for route, title in entries:
            original = (WEB / route) if "/" not in route else PurePosixPath(route).with_suffix('.md')
            if not (root / original).is_file(): continue
            current = ' aria-current="page"' if str(site_path(source)) == route else ''
            links.append(f'<a href="{published_url(source, route)}"{current}>{html.escape(title)}</a>')
        if links:
            rendered.append(f'<div class="doc-sidebar-group"><strong>{html.escape(label)}</strong>{"".join(links)}</div>')
    return '<nav aria-label="Workshop documents">' + ''.join(rendered) + '</nav>'


def document_page(source: PurePosixPath, text: str, root: Path) -> str:
    convert = lambda url: source_url(url, source, root)
    markdown = Markdown(convert)
    content = markdown.render(text)
    title = next((title for level, title, anchor in markdown.headings if level == 1), source.stem.replace("-", " ").title())
    title_text = re.sub("<[^>]+>", "", inline(title))
    if not any(level == 1 for level, _, _ in markdown.headings):
        content = "<h1>" + inline(title) + "</h1>\n" + content
    depth = os.path.relpath(".", str(site_path(source).parent)).replace(os.sep, "/")
    at = lambda path: html.escape(f"{depth}/{path}", quote=True)
    historical = legacy(source)
    label = "V0-GENESIS / ARCHIVE" if historical else "V1-PROOF / WORKING PLAN"
    notice = ('<strong>V0-GENESIS · historical planning.</strong> This earlier model is archived. Its requirements and purchase statements describe that revision. <a href="' + at("index.html") + '">V1-PROOF is the current build.</a>') if historical else ('<strong>Living work in progress.</strong> Plans and checklists are not test results. Progress is recorded in the <a href="' + at("build.html") + '">build board</a> and linked evidence.')
    toc = "".join(f'<li class="toc-level-{level}"><a href="#{anchor}">{inline(label)}</a></li>' for level, label, anchor in markdown.headings if level in (2, 3))
    # Link to the editable repository source, never back into a raw-file dead end.
    github = "https://github.com/nova-centauri/hux-robot/blob/main/" + quote(str(source), safe="/")
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title_text} · HUX</title><meta name="description" content="{html.escape(label + ': ' + html.unescape(title_text), quote=True)}"><link rel="stylesheet" href="{at('docs.css')}">{workshop_assets(source)}</head>
<body><a class="skip-link" href="#content">Skip to document</a>{workshop_header(source, html.unescape(title_text))}
<div class="doc-layout"><aside class="doc-sidebar"><p class="doc-eyebrow">{label}</p>{document_sidebar(source, root)}{'<details open><summary>On this page</summary><ol>' + toc + '</ol></details>' if toc else ''}</aside>
<main id="content" class="doc-main"><aside class="doc-notice{' doc-notice-archive' if historical else ''}" role="note">{notice}</aside><article class="doc-content">{content}</article><footer class="doc-footer"><a href="{github}">Edit this document on GitHub ↗</a><span>Published from {html.escape(str(source))}</span><a href="#content">Back to top ↑</a></footer></main></div>{workshop_footer(source)}</body></html>
'''


def rewrite_html(text: str, source: PurePosixPath, root: Path) -> str:
    # Work on attributes only, preserving the existing authored SVGs and scripts.
    pattern = r'(?P<name>\b(?:' + "|".join(URL_ATTRS) + r'))=(?P<q>[\x22\x27])(?P<url>.*?)(?P=q)'
    def replace(match):
        value = source_url(match["url"], source, root)
        return match["name"] + "=" + match["q"] + html.escape(value, quote=True) + match["q"]
    return re.sub(pattern, replace, text, flags=re.I)


def rewrite_js(text: str, source: PurePosixPath, root: Path) -> str:
    # URL-shaped string literals only: do not rewrite module requires or prose.
    # Existing drawing scripts use these for source-data links and asset buttons.
    pattern = r'''(?P<q>["'])(?P<url>(?:\.\.?/|/)?[\w./-]+\.(?:md|html|json|svg|glb)(?:[#?][^"'\s]*)?)(?P=q)'''
    return re.sub(pattern, lambda m: m["q"] + source_url(m["url"], source, root) + m["q"], text)


def version_assets(output: Path) -> None:
    """Make browsers fetch changed local styles and scripts after a rebuild."""
    output = output.resolve()
    hashes = {}
    for page in output.rglob("*.html"):
        def tag_version(match):
            tag = match[0]
            is_script = match["tag"].lower() == "script"
            attribute = "src" if is_script else "href"
            extension = ".js" if is_script else ".css"
            if not is_script and not re.search(r'''\brel\s*=\s*(["'])stylesheet\1''', tag, re.I):
                return tag

            def url_version(url_match):
                parsed = urlsplit(html.unescape(url_match["url"]))
                if parsed.scheme or parsed.netloc or not parsed.path.lower().endswith(extension):
                    return url_match[0]
                target = (output / unquote(parsed.path.lstrip("/")) if parsed.path.startswith("/") else page.parent / unquote(parsed.path)).resolve()
                if not target.is_relative_to(output) or not target.is_file():
                    return url_match[0]  # Normal link validation reports this.
                if target not in hashes:
                    hashes[target] = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
                query = [(key, value) for key, value in parse_qsl(parsed.query, keep_blank_values=True) if key != "v"]
                query.append(("v", hashes[target]))
                url = urlunsplit(("", "", parsed.path, urlencode(query), parsed.fragment))
                return url_match["prefix"] + url_match["q"] + html.escape(url, quote=True) + url_match["q"]

            pattern = r'(?P<prefix>\b' + attribute + r'\s*=\s*)(?P<q>["\x27])(?P<url>.*?)(?P=q)'
            return re.sub(pattern, url_version, tag, flags=re.I)

        page.write_text(re.sub(r"<(?P<tag>script|link)\b[^>]*>", tag_version, page.read_text(), flags=re.I))


class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.urls = []; self.ids = set()

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in URL_ATTRS and value: self.urls.append(value)
            if key in {"id", "name"} and value: self.ids.add(value)


def validate(output: Path) -> list[str]:
    """Catch broken published navigation, images, scripts and document anchors."""
    output = output.resolve()
    pages = {}
    for path in output.rglob("*.html"):
        parser = Links(); parser.feed(path.read_text()); pages[path.resolve()] = parser
    errors = []
    for path, parser in pages.items():
        for url in parser.urls:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc: continue
            target = ((output / unquote(parsed.path.lstrip("/"))) if parsed.path.startswith("/") else (path.parent / unquote(parsed.path))).resolve() if parsed.path else path
            if target.is_dir(): target /= "index.html"
            if not target.is_relative_to(output.resolve()) or not target.is_file():
                errors.append(f"{path.relative_to(output)}: missing {url}")
            elif parsed.path.endswith(".md"):
                errors.append(f"{path.relative_to(output)}: raw Markdown link {url}")
            elif parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
                errors.append(f"{path.relative_to(output)}: missing fragment {url}")
    return sorted(set(errors))


def build(root: Path, output: Path) -> dict:
    root, output = root.resolve(), output.resolve()
    # The production publisher uses this function directly. Stale electrical
    # PDFs must fail before the output directory or live release can change.
    wiring = root / 'cad/wiring'
    if (wiring / 'build.py').is_file():
        spec = importlib.util.spec_from_file_location('hux_wiring_exports', wiring / 'exports.py')
        if spec is None or spec.loader is None or not (wiring / 'exports.py').is_file():
            raise ValueError('The electrical export check is missing. Run node cad/wiring/render.mjs.')
        exports = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(exports)
        errors = exports.check_exports(wiring)
        if errors:
            raise ValueError('\n'.join(errors))
    # A marker ensures rebuilding cannot silently erase an unrelated directory.
    marker = output / ".hux-site-build"
    if output == root or root.is_relative_to(output):
        raise ValueError("The build output must not contain the source repository")
    if any(output.is_relative_to(root / tree) for tree in (*SOURCE_TREES, str(WEB))):
        raise ValueError("The build output must be outside the published source folders")
    if output.exists() and any(output.iterdir()):
        if not marker.is_file(): raise ValueError(f"The build does not replace an unmarked nonempty output: {output}")
        shutil.rmtree(output)
    output.mkdir(parents=True, exist_ok=True)
    marker.write_text("Generated HUX static site. A rebuild can replace it.\n")
    sources = [root / "README.md", root / "NOTES.md", root / "LICENSE"]
    for directory in (*SOURCE_TREES, str(WEB)):
        base = root / directory
        if base.exists():
            sources.extend(path for path in base.rglob("*") if path.is_file() and not any(part in OMIT or part.startswith(".") for part in path.relative_to(base).parts))
    documents = 0
    for path in sorted(set(sources)):
        if not path.is_file(): continue
        source = PurePosixPath(path.relative_to(root).as_posix())
        if any(source.is_relative_to(folder) for folder in LOCAL_ONLY): continue
        if source.is_relative_to(WEB) and (path.name in {"build_site.py", "package.json", "package-lock.json", "plan-test.js"} or path.name.startswith("test_") or path.name.endswith(("-test.js", ".test.js"))): continue
        destination = output / site_path(source)
        destination.parent.mkdir(parents=True, exist_ok=True)
        if path.suffix.lower() == ".md":
            destination.write_text(document_page(source, path.read_text(), root)); documents += 1
        elif path.suffix == ".html":
            destination.write_text(authored_page(path.read_text(), source, root))
        elif path.suffix == ".js" and source.is_relative_to(WEB):
            destination.write_text(rewrite_js(path.read_text(), source, root))
        else:
            shutil.copy2(path, destination)
    if (output / "index.html").exists():
        shutil.copy2(output / "index.html", output / "v1-proof.html")
    # Directory links such as the archived model folder get real landing pages,
    # independent of whether the host enables automatic directory listings.
    for directory in sorted((p for p in output.rglob("*") if p.is_dir()), reverse=True):
        if (directory / "index.html").exists(): continue
        rel = directory.relative_to(output)
        depth = os.path.relpath(output, directory).replace(os.sep, "/")
        if (directory / "README.html").exists():
            # Keep the readable source route canonical, but support /docs/foo/.
            (directory / "index.html").write_text((directory / "README.html").read_text())
            continue
        entries = []
        for path in sorted(directory.iterdir()):
            if path.name.startswith("."): continue
            name = path.name + ("/" if path.is_dir() else "")
            entries.append(f'<li><a href="{quote(name)}">{html.escape(name)}</a></li>')
        title = html.escape(str(rel))
        directory_source = PurePosixPath(str(rel)) / "index.html"
        (directory / "index.html").write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} · HUX files</title><link rel="stylesheet" href="{depth}/docs.css">{workshop_assets(directory_source)}</head><body>{workshop_header(directory_source, str(rel))}<main class="doc-main" style="margin:40px auto;padding:0 24px"><article class="doc-content"><h1>{title}</h1><p>Project files and references. Model files are reference geometry, not released fabrication drawings.</p><ul>{"".join(entries)}</ul></article></main>{workshop_footer(directory_source)}</body></html>')
    # Hash the published bytes after rewrites and all directory pages exist.
    version_assets(output)
    report = {"documents": documents, "html_pages": len(list(output.rglob("*.html"))), "output": str(output), "errors": validate(output)}
    (output / "build-report.json").write_text(json.dumps({key: value for key, value in report.items() if key != "output"}, indent=2) + "\n")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "dist/site", help="Generated site directory (default: repo/dist/site)")
    parser.add_argument("--check", action="store_true", help="Check a built site and do not rebuild it")
    args = parser.parse_args()
    try:
        if args.check:
            if not (args.output / ".hux-site-build").is_file(): raise ValueError("No build found. Run build_site.py first")
            errors = validate(args.output.resolve())
            report = {"output": str(args.output), "errors": errors}
        else:
            report = build(ROOT, args.output)
        print(json.dumps(report, indent=2))
        return 1 if report["errors"] else 0
    except (ValueError, OSError) as error:
        print(f"Site build failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
