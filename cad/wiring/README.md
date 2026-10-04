# V1-PROOF electrical atlas

Rev A, source checked 2026-10-03. [Verification record and sources](../../docs/wiring-atlas.md) / [site integration](../../tools/living-drawings/electrical.html).

Four coordinated SVG sheets are the editable, resolution-independent deliverables. Matching PNG exports are 3360 by 2240 pixels. The four-page PDF preserves vector text and paths on landscape 16.8 by 11.2 inch sheets; print with fit-to-page for other paper sizes.

Rebuild SVGs and the endpoint register:

```sh
python3 cad/wiring/build.py
```

For PNG/PDF export, `render.mjs` uses Sharp and Playwright. Set `NODE_PATH` to installed packages; optionally set `CHROME_PATH` to a local Chromium-compatible executable when Playwright's bundled browser is unavailable. The Codex bundled workspace runtime provides the packages. No network call is needed for generation.

```sh
node cad/wiring/render.mjs
```

The figures describe source-checked pinouts and proposed interfaces. Dashed blocks remain unselected circuits. None of these outputs closes a physical harness, electrical protection or powered-motion gate.
