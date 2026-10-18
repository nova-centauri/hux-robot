# V1-PROOF electrical atlas

Rev C, dated 2026-10-17. [Verification record and sources](../../docs/wiring-atlas.md) / [site integration](../../tools/living-drawings/electrical.html).

Seven coordinated SVG sheets are the editable, resolution-independent deliverables. The matching PNGs provide raster previews, up to 4800 pixels wide. All PDF pages use 11 x 17 inch paper in landscape orientation, with 0.5 inch margins. The [seven-page PDF](v1-proof-wiring-atlas.pdf) keeps vector text and paths.

The [system PDF](v1-proof-el-01-overview-11x17.pdf) and the [motor PDF](v1-proof-el-05-both-wheels-11x17.pdf) each contain one sheet. The Electrical page includes a PDF view and a download link beside each diagram. Select 11 x 17 inch paper, landscape orientation and 100% scale. The PDFs already include the margins. Disable printer headers and footers.

| Sheet | Drawing |
| --- | --- |
| EL-01 | [Complete system wiring by location](v1-proof-el-01-overview.svg) — rear elevation of the R05 body, every harness conductor with its connector position |
| EL-02 | [Pico 2 and SPI IMU](v1-proof-el-02-pico-imu.svg) — physical pins and the seven-wire sensor harness |
| EL-03 | [Wheel motor and encoder harness](v1-proof-el-03-wheel-harness.svg) — carrier pads, motor cable details and the leg junction board |
| EL-04 | [Power distribution and kill chain](v1-proof-el-04-power-servo.svg) — fused pack, latched rail switch, heartbeat gate, logic branch |
| EL-05 | [Both wheel motors — every wire](v1-proof-el-05-both-wheels.svg) — separate left and right paths through the junction board |
| EL-06 | [Harness bundles and run lengths](v1-proof-el-06-harness-runs.svg) — route model, cut lengths and connector hardware |
| EL-07 | [Connector loading](v1-proof-el-07-connectors.svg) — each connector with its positions and mating wires |

The [searchable conductor register](v1-proof-wire-register.html) maps EL-01 conductor IDs to connector positions, bundles and gauges. The [harness register](v1-proof-harness.html) lists the bundles, the cut lengths, the connector loading and the connector hardware with purchase candidates. The [JSON register](v1-proof-netlist.json) and the [harness data](v1-proof-harness.json) are the machine-readable review aids. IDs identify proposed harness connections. They do not release a wire gauge or an internal circuit.

Drawing logic lives in [build.py](build.py) and [complete.py](complete.py). The harness model, the mount positions and the length rule live in [harness.py](harness.py). EL-01 must draw exactly the wires of the harness model. The build stops on a difference. The same SVG supplies the website diagram and its PDF.

The [assembly guide](v1-proof-harness.html) adds one selectable card per harness. [assembly.py](assembly.py) generates the cards from the same model. It adds proposed physical wire colors without a circuit change. The JSON includes these color assignments. The guide identifies the PH-C layout conflict, the splice-length limits and the unspecified mating parts.

The connector inspector adds shaded plug views, socket faces, reversed wire entries and separate board headers. Select a wire to highlight its position. [connector_views.py](connector_views.py) draws each view from the same position schedule. The XH and motor shapes are illustrations. Their orientation still needs a hardware check. The motor guide starts with its supplied plug.

The guide supports a direct link such as `v1-proof-harness.html#H6`. Its print control prints the selected harness. Without JavaScript, all cards and views remain available. Print output includes every connector and view in the selected harness. Run `python3 cad/wiring/test_assembly.py` to check wire coverage, colors, connector counts and unresolved cuts.

Do not edit the PDFs or PNGs by hand. Keep electrical source changes and regenerated exports in the same commit.

Run these commands from the repository root. The Python command rebuilds all seven SVGs and the three registers:

```sh
python3 cad/wiring/build.py
```

For PNG/PDF export, `render.mjs` uses Sharp and Playwright. Set `NODE_PATH` to the installed packages. When the bundled browser of Playwright is not available, you can set `CHROME_PATH` to a local Chromium-compatible executable. The export needs no network call.

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

The figures describe source-checked pinouts and proposed interfaces. Dashed blocks remain unselected circuits. The run lengths are estimates from a route model. None of these outputs closes a physical harness, electrical protection or powered-motion gate.
