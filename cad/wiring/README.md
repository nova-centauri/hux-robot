# V1-PROOF electrical atlas

Rev B, dated 2026-10-04. [Verification record and sources](../../docs/wiring-atlas.md) / [site integration](../../tools/living-drawings/electrical.html).

Five coordinated SVG sheets are the editable, resolution-independent deliverables. The matching PNGs provide raster previews, up to 4800 pixels wide. All PDF pages use 11 x 17 inch paper in landscape orientation, with 0.5 inch margins. The [five-page PDF](v1-proof-wiring-atlas.pdf) keeps vector text and paths.

The [system PDF](v1-proof-el-01-overview-11x17.pdf) and the [motor PDF](v1-proof-el-05-both-wheels-11x17.pdf) each contain one sheet. The Electrical page includes a PDF view and a download link beside each diagram. Select 11 x 17 inch paper, landscape orientation and 100% scale. The PDFs already include the margins. Disable printer headers and footers.

The print layout date is October 5, 2026. EL-01 uses less vertical space, with full-size text and circular symbols. EL-01 and EL-05 use white backgrounds without the dot grid. The source audit remains Rev B, dated October 4, 2026.

| Sheet | Drawing |
| --- | --- |
| EL-01 | [Complete system wiring](v1-proof-el-01-overview.svg) — every proposed external conductor and both motor channels |
| EL-02 | [Pico 2 and SPI IMU](v1-proof-el-02-pico-imu.svg) — physical pins and the seven-wire sensor harness |
| EL-03 | [Wheel motor and encoder harness](v1-proof-el-03-wheel-harness.svg) — carrier pads and motor cable details |
| EL-04 | [Power distribution and servo bus](v1-proof-el-04-power-servo.svg) — isolation, actuator cut and unresolved interfaces |
| EL-05 | [Both wheel motors — every wire](v1-proof-el-05-both-wheels.svg) — separate left and right paths |

The [searchable wire register](v1-proof-wire-register.html) maps EL-01 conductor IDs to named endpoints. EL-05 uses terminal names, which you can search in the same register. The [JSON register](v1-proof-netlist.json) is the machine-readable review aid. IDs identify proposed external connections. They do not release a connector pinout, wire gauge or internal circuit.

Drawing logic lives in [build.py](build.py) and [complete.py](complete.py). The same SVG supplies the website diagram and its PDF. Do not edit the PDFs or PNGs by hand. Keep electrical source changes and regenerated exports in the same commit.

Run these commands from the repository root. The Python command rebuilds all five SVGs and both registers:

```sh
python3 cad/wiring/build.py
```

For PNG/PDF export, `render.mjs` uses Sharp and Playwright. Set `NODE_PATH` to the installed packages. When the bundled browser of Playwright is not available, you can set `CHROME_PATH` to a local Chromium-compatible executable. The Codex bundled workspace runtime provides the packages. The export needs no network call.

```sh
node cad/wiring/render.mjs
```

The export command also rebuilds the SVGs and registers before it creates the PDFs and PNGs. It records source and output hashes in `v1-proof-export-manifest.json` only after all exports succeed. `--png-only` does not update this record.

After each electrical change, run the export command, inspect both single-sheet PDFs and run these checks:

```sh
python3 cad/wiring/exports.py
cd tools/living-drawings
npm run build
npm run test:site
```

The site build checks the export record before it changes the output directory. A changed source, SVG, PDF or PNG stops the build until you regenerate the exports. This check also applies to the production publisher. Publish the complete `dist/site` directory through the normal deployment process.

The figures describe source-checked pinouts and proposed interfaces. Dashed blocks remain unselected circuits. None of these outputs closes a physical harness, electrical protection or powered-motion gate.
