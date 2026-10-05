#!/usr/bin/env python3
"""Regression checks for portable routes and readable published documents."""

from pathlib import Path, PurePosixPath
import importlib.util
import re
import tempfile
import unittest

import build_site as site


class MarkdownTests(unittest.TestCase):
    def test_headings_have_stable_fragments_and_duplicate_suffixes(self):
        markdown = site.Markdown()
        output = markdown.render("# Plan\n\n## Finish line\n\n## Finish line\n\n### **Load** & motion")
        self.assertIn('id="finish-line"', output)
        self.assertIn('id="finish-line-1"', output)
        self.assertIn('id="load--motion"', output)
        self.assertEqual(len(markdown.headings), 4)

    def test_tables_preserve_alignment_empty_cells_and_code_pipes(self):
        output = site.Markdown().render("| Signal | Value | Result |\n| --- | ---: | :---: |\n| `a|b` | 12 | |\n| a\\|b | | pass |")
        self.assertIn('<th style="text-align:right">Value</th>', output)
        self.assertIn('<td style="text-align:left"><code>a|b</code></td>', output)
        self.assertIn('<td style="text-align:center"></td>', output)
        self.assertIn('<td style="text-align:left">a|b</td>', output)
        self.assertEqual(output.count("<td "), 6)

    def test_checklists_are_read_only_without_invented_progress(self):
        output = site.Markdown().render("- [ ] Pending bench\n- [x] Measured result\n  - Keep evidence\n\n3. Next stage\n4. Repeat")
        self.assertIn('type="checkbox" disabled aria-label="Pending"', output)
        self.assertIn('type="checkbox" disabled checked aria-label="Complete"', output)
        self.assertIn("<ul>\n<li>Keep evidence</li>\n</ul>", output)
        self.assertIn('<ol start="3">', output)

    def test_code_and_untrusted_html_stay_literal(self):
        output = site.Markdown().render('```python\nprint("<script>")\n```\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))')
        self.assertIn('class="language-python"', output)
        self.assertIn('&lt;script&gt;', output)
        self.assertNotIn('<script>', output)
        self.assertNotIn('href="javascript:', output)

    def test_links_images_nested_labels_and_parentheses(self):
        output = site.inline('[note] **Read [a `file`](plan.md#next)** ![fixture](part.svg) [spec](https://example.org/a_(b))', lambda url: url.replace('.md', '.html'))
        self.assertIn('[note] <strong>Read <a href="plan.html#next">a <code>file</code></a></strong>', output)
        self.assertIn('<img src="part.svg" alt="fixture"', output)
        self.assertIn('href="https://example.org/a_(b)"', output)

    def test_session_form_blanks_and_identifier_underscores_are_preserved(self):
        output = site.inline('Voltage ___; current ___; BENCH_ARMED; **confirmed** and _measured_.')
        self.assertIn('Voltage ___; current ___; BENCH_ARMED;', output)
        self.assertIn('<strong>confirmed</strong>', output)
        self.assertIn('<em>measured</em>', output)


class RoutingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / 'docs/checklists').mkdir(parents=True)
        (self.root / 'docs/checklists/README.md').write_text('# Checklists')

    def tearDown(self):
        self.temp.cleanup()

    def test_repository_relative_paths_move_to_published_root(self):
        source = PurePosixPath('tools/living-drawings/proof-sandbox.html')
        self.assertEqual(site.source_url('../../docs/v1-proof.md#finish-line', source, self.root), 'docs/v1-proof.html#finish-line')
        self.assertEqual(site.source_url('../v1-proof/sim.js', source, self.root), 'tools/v1-proof/sim.js')
        self.assertEqual(site.source_url('../../docs/checklists/', source, self.root), 'docs/checklists/README.html')

    def test_document_routes_and_local_fragment_queries_survive(self):
        source = PurePosixPath('docs/checklists/session.md')
        self.assertEqual(site.source_url('../../tools/living-drawings/index.html#build', source, self.root), '../../build.html')
        self.assertEqual(site.source_url('../v1-proof.md?print=1#finish-line', source, self.root), '../v1-proof.html?print=1#finish-line')
        self.assertEqual(site.source_url('#outcome', source, self.root), '#outcome')

    def test_old_section_links_follow_the_organized_project_routes(self):
        source = PurePosixPath('tools/living-drawings/proof-sandbox.html')
        for fragment, (route, anchor) in site.OLD_SECTIONS.items():
            suffix = ('#' + anchor) if anchor else ''
            for old_route in ('index.html', 'v1-proof.html', '/index.html'):
                with self.subTest(fragment=fragment, old_route=old_route):
                    self.assertEqual(site.source_url(old_route + '?print=1#' + fragment, source, self.root), route + '?print=1' + suffix)
        self.assertEqual(site.source_url('v1-proof.html#next-version', source, self.root), 'v1-proof.html#next-version')
        self.assertEqual(site.source_url('#build', source, self.root), '#build')

    def test_html_entities_do_not_corrupt_external_urls(self):
        output = site.rewrite_html('<a href="https://example.org/?a=1&amp;b=2">source</a>', PurePosixPath('tools/living-drawings/index.html'), self.root)
        self.assertIn('?a=1&amp;b=2', output)
        self.assertNotIn('&amp;amp;', output)

    def test_script_data_urls_are_rewritten_without_changing_code_or_prose(self):
        text = 'const info = "../../docs/one-leg-bench.md#parts"; const data = "../v1-proof/model.json"; const sim = require("../v1-proof/sim"); const prose = "See docs.md later.";'
        output = site.rewrite_js(text, PurePosixPath('tools/living-drawings/spec.js'), self.root)
        self.assertIn('"docs/one-leg-bench.html#parts"', output)
        self.assertIn('"tools/v1-proof/model.json"', output)
        self.assertIn('require("../v1-proof/sim")', output)
        self.assertIn('"See docs.md later."', output)


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.output = self.root / 'dist/site'
        web = self.root / site.WEB
        web.mkdir(parents=True)
        (web / 'index.html').write_text('<html><head><link href="docs.css" rel="stylesheet"></head><body><h1 id="build">Build</h1><h2 id="next-version">Later</h2><a href="../../docs/one-leg-bench.md#setup">Bench</a><script src="../v1-proof/sim.js"></script></body></html>')
        (web / 'v0-genesis.html').write_text('<html><body>Archive</body></html>')
        for route in ('mechanical', 'electrical', 'controls', 'joints', 'build', 'parts', 'documents',
                      'mechanical-tests', 'proof-simulation', 'proof-sandbox'):
            (web / f'{route}.html').write_text(f'<html><head><title>{route}</title></head><body><main><h1 id="archive">{route}</h1></main></body></html>')
        (web / 'docs.css').write_text('body{color:#203830}')
        (web / 'workshop.css').write_text('.workshop-nav{display:flex}')
        (web / 'workshop.js').write_text('window.workshop = {};')
        (web / '.git').mkdir(); (web / '.git/config').write_text('private')
        (web / 'node_modules').mkdir(); (web / 'node_modules/private.js').write_text('private')
        (web / 'assets').mkdir(); (web / 'assets/part.glb').write_bytes(b'model')
        (self.root / 'tools/v1-proof').mkdir(); (self.root / 'tools/v1-proof/sim.js').write_text('window.sim = {};')
        (self.root / 'docs/checklists').mkdir(parents=True)
        (self.root / 'docs/archive/stair-v1').mkdir(parents=True)
        for path in ['one-leg-bench', 'parts-on-hand', 'decisions', 'checklists/README', 'archive/stair-v1/README']:
            (self.root / f'docs/{path}.md').write_text('# Working document\n\n## Setup\n\n- [ ] Verify\n')
        (self.root / 'README.md').write_text('# Hux\n\n[Models](tools/living-drawings/assets/)\n\n[Checklists](docs/checklists/)')

    def tearDown(self):
        self.temp.cleanup()

    def test_complete_build_has_readable_routes_assets_and_archival_context(self):
        report = site.build(self.root, self.output)
        self.assertEqual(report['errors'], [])
        self.assertEqual((self.output / 'v1-proof.html').read_text(), (self.output / 'index.html').read_text())
        self.assertTrue((self.output / 'tools/v1-proof/sim.js').exists())
        self.assertTrue((self.output / 'assets/index.html').exists())
        self.assertFalse((self.output / '.git').exists())
        self.assertFalse((self.output / 'node_modules').exists())
        archive = (self.output / 'docs/archive/stair-v1/README.html').read_text()
        self.assertIn('V0-GENESIS · historical planning.', archive)
        self.assertIn('Edit this document on GitHub', archive)
        self.assertNotIn('href="README.md"', archive)

    def test_shared_navigation_active_sections_and_contextual_routes(self):
        site.build(self.root, self.output)
        for route in ('index', 'mechanical', 'electrical', 'build', 'parts', 'documents',
                      'joints', 'controls', 'mechanical-tests', 'proof-simulation', 'proof-sandbox'):
            page = (self.output / f'{route}.html').read_text()
            self.assertEqual(page.count('class="workshop-header"'), 1)
            self.assertEqual(page.count('class="workshop-footer"'), 1)
            self.assertIn('aria-label="Project navigation"', page)
            self.assertIn('workshop.css?v=', page)
            self.assertIn('workshop.js?v=', page)
            section = site.route_section(PurePosixPath(str(site.WEB / f'{route}.html')))
            self.assertIn(f'href="{section}" aria-current="page"', page)
        joints = (self.output / 'joints.html').read_text()
        self.assertIn('aria-label="Mechanical pages"', joints)
        self.assertIn('href="joints.html" aria-current="page">Joint details', joints)
        controls = (self.output / 'controls.html').read_text()
        self.assertIn('href="controls.html" aria-current="page">Control software', controls)
        sandbox = (self.output / 'proof-sandbox.html').read_text()
        self.assertIn('href="proof-sandbox.html" aria-current="page">3D sandbox', sandbox)
        self.assertIn('href="docs/one-leg-bench.html">Bench testing', sandbox)

    def test_old_headers_are_removed_and_interactive_markup_stays_intact(self):
        source = PurePosixPath(str(site.WEB / 'proof-sandbox.html'))
        text = '''<html><head><title>Sandbox</title></head><body>
<header><div class="topbar"><a href="index.html">Old brand</a><nav><a href="v1-proof.html#build">Old menu</a></nav></div></header>
<main><nav class="version-rail"><a href="v0-genesis.html">Old versions</a></nav>
<canvas id="scene"></canvas><button id="reset">Reset</button><script>window.scene = "<canvas>";</script></main>
<footer>Recorded evidence only.</footer><script src="proof-sandbox.js"></script></body></html>'''
        page = site.authored_page(text, source, self.root)
        self.assertNotIn('Old brand', page)
        self.assertNotIn('Old menu', page)
        self.assertNotIn('version-rail', page)
        self.assertIn('<canvas id="scene"></canvas><button id="reset">Reset</button>', page)
        self.assertIn('<script>window.scene = "<canvas>";</script>', page)
        self.assertIn('<script src="proof-sandbox.js"></script>', page)
        self.assertIn('<aside class="workshop-page-note">Recorded evidence only.</aside>', page)

    def test_archived_masthead_keeps_title_without_competing_navigation(self):
        source = PurePosixPath(str(site.WEB / 'sheet.html'))
        text = '<html><body><main class="page"><header class="mast"><div><h1 id="drawing">Joint study</h1><p>Revision dimensions.</p><nav class="pages"><a href="sheet.html">Old sheets</a></nav></div></header><svg id="joint"></svg></main></body></html>'
        page = site.authored_page(text, source, self.root)
        self.assertIn('<h1 id="drawing">Joint study</h1>', page)
        self.assertIn('<p>Revision dimensions.</p>', page)
        self.assertIn('<svg id="joint"></svg>', page)
        self.assertNotIn('Old sheets', page)
        self.assertIn('V0-GENESIS · archive', page)
        self.assertIn('href="documents.html" aria-current="page"', page)
        self.assertIn('<head><link rel="stylesheet" href="workshop.css">', page)

    def test_generated_documents_and_file_indexes_share_project_navigation(self):
        site.build(self.root, self.output)
        document = (self.output / 'docs/checklists/README.html').read_text()
        self.assertIn('href="../../documents.html" aria-current="page"', document)
        self.assertIn('<strong>Mechanical</strong>', document)
        self.assertIn('<strong>Electrical &amp; controls</strong>', document)
        self.assertIn('href="../../build.html">Build board', document)
        self.assertNotIn('Next version', document)
        files = (self.output / 'assets/index.html').read_text()
        self.assertIn('class="workshop-header"', files)
        self.assertIn('href="../index.html">Overview', files)
        self.assertIn('href="../documents.html" aria-current="page"', files)

    def test_local_vendor_downloads_are_not_published(self):
        for folder in site.LOCAL_ONLY:
            local = self.root / folder
            local.mkdir(parents=True, exist_ok=True)
            (local / "local-model.glb").write_bytes(b"local reference only")
        site.build(self.root, self.output)
        for folder in site.LOCAL_ONLY:
            self.assertFalse((self.output / site.site_path(folder)).exists())
            self.assertTrue((self.root / folder / "local-model.glb").exists())

    def test_stale_electrical_sources_or_outputs_keep_the_prior_build(self):
        wiring = self.root / 'cad/wiring'
        wiring.mkdir(parents=True)
        checker = site.ROOT / 'cad/wiring/exports.py'
        spec = importlib.util.spec_from_file_location('test_wiring_exports', checker)
        exports = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(exports)
        for name in (*exports.INPUTS, *exports.OUTPUTS):
            (wiring / name).write_text('original bytes')
        (wiring / 'exports.py').write_text(checker.read_text())
        exports.write_manifest(wiring)
        self.assertEqual(site.build(self.root, self.output)['errors'], [])
        prior = (self.output / 'electrical.html').read_bytes()
        for name in ('complete.py', 'v1-proof-el-01-overview.svg',
                     'v1-proof-el-05-both-wheels-11x17.pdf',
                     'v1-proof-el-01-overview.png'):
            with self.subTest(name=name):
                path = wiring / name
                original = path.read_bytes()
                path.write_bytes(original + b' changed')
                with self.assertRaisesRegex(ValueError, 'electrical export is stale'):
                    site.build(self.root, self.output)
                self.assertEqual((self.output / 'electrical.html').read_bytes(), prior)
                path.write_bytes(original)
        (wiring / exports.MANIFEST).unlink()
        with self.assertRaisesRegex(ValueError, 'manifest is missing'):
            site.build(self.root, self.output)
        self.assertEqual((self.output / 'electrical.html').read_bytes(), prior)

    def test_rebuild_removes_stale_pages_but_protects_unrelated_directories(self):
        site.build(self.root, self.output)
        (self.output / 'stale.html').write_text('old')
        site.build(self.root, self.output)
        self.assertFalse((self.output / 'stale.html').exists())
        unsafe = self.root / 'unrelated'; unsafe.mkdir(); (unsafe / 'keep.txt').write_text('keep')
        with self.assertRaises(ValueError): site.build(self.root, unsafe)
        self.assertEqual((unsafe / 'keep.txt').read_text(), 'keep')
        with self.assertRaises(ValueError): site.build(self.root, self.root)
        with self.assertRaises(ValueError): site.build(self.root, self.root / 'docs/output')

    def test_asset_cache_keys_follow_content_and_preserve_url_options(self):
        source = self.root / site.WEB / 'index.html'
        source.write_text(source.read_text().replace('href="docs.css"', 'href="docs.css?theme=proof&amp;v=old#layer"').replace('</body>', '<script src="https://cdn.example.org/library.js?v=vendor"></script></body>'))
        site.build(self.root, self.output)

        def versions():
            page = (self.output / 'index.html').read_text()
            css = re.search(r'docs.css\?theme=proof&amp;v=([a-f0-9]{12})#layer', page)[1]
            js = re.search(r'tools/v1-proof/sim.js\?v=([a-f0-9]{12})', page)[1]
            return css, js, page

        first_css, first_js, first_page = versions()
        self.assertIn('https://cdn.example.org/library.js?v=vendor', first_page)
        nested = (self.output / 'docs/checklists/README.html').read_text()
        self.assertIn('../../docs.css?v=' + first_css, nested)
        site.build(self.root, self.output)
        self.assertEqual(versions(), (first_css, first_js, first_page))
        (self.root / site.WEB / 'docs.css').write_text('body{color:#a65431}')
        report = site.build(self.root, self.output)
        changed_css, same_js, _ = versions()
        self.assertNotEqual(changed_css, first_css)
        self.assertEqual(same_js, first_js)
        (self.root / 'tools/v1-proof/sim.js').write_text('window.sim = {revision: 2};')
        site.build(self.root, self.output)
        same_css, changed_js, _ = versions()
        self.assertEqual(same_css, changed_css)
        self.assertNotEqual(changed_js, first_js)
        self.assertEqual(report['errors'], [])
        self.assertEqual(site.validate(self.output), [])

    def test_validator_detects_raw_files_missing_files_and_bad_fragments(self):
        site.build(self.root, self.output)
        (self.output / 'raw.md').write_text('# Raw')
        (self.output / 'broken.html').write_text('<a href="raw.md">Raw</a><a href="missing.html">Missing</a><a href="index.html#missing">Anchor</a>')
        errors = site.validate(self.output)
        self.assertTrue(any('raw Markdown link' in error for error in errors))
        self.assertTrue(any('missing missing.html' in error for error in errors))
        self.assertTrue(any('missing fragment index.html#missing' in error for error in errors))


if __name__ == '__main__':
    unittest.main()
