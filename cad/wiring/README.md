# V1-PROOF electrical atlas

Rev A, source checked 2026-10-03. [Verification record and sources](../../docs/wiring-atlas.md) / [site integration](../../tools/living-drawings/electrical.html).

Four coordinated SVG sheets are the editable, resolution-independent deliverables. The PNG exports that match the sheets are 3360 by 2240 pixels. The four-page PDF keeps vector text and paths on landscape 16.8 by 11.2 inch sheets. For other paper sizes, print with fit-to-page.

Rebuild the SVGs and the endpoint register:

```sh
python3 cad/wiring/build.py
```

For PNG/PDF export, `render.mjs` uses Sharp and Playwright. Set `NODE_PATH` to the installed packages. When the bundled browser of Playwright is not available, you can set `CHROME_PATH` to a local Chromium-compatible executable. The Codex bundled workspace runtime provides the packages. The export needs no network call.

```sh
node cad/wiring/render.mjs
```

The figures describe source-checked pinouts and proposed interfaces. Dashed blocks remain unselected circuits. None of these outputs closes a physical harness, electrical protection or powered-motion gate.
