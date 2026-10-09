# Keeping the HUX plan alive

The website has two named versions: **V1-PROOF** is the current build and **V0-GENESIS** is the original plan model. A third version follows the proof. Its name and scope are not set. Historical `stair-v1` file paths stay intact so that old research references continue to work.

## Update the shared plan

1. Record the decision, the order or the measured result in the applicable source document: [inventory](parts-on-hand.md), [bench sessions](checklists/one-leg-bench-session.md), [acceptance protocol](v1-proof-validation.md) or [decisions](decisions.md).
2. Update `tools/living-drawings/plan-data.json` in the same change. Its version records supply the current actions, purchased parts, milestones, bench sequence and dated updates that the site shows. Update `updatedAt` and include the source references.
3. Keep unknown order quantities and paid costs as `null`. A planned pair of motors does not establish an ordered quantity. Ordered parts are project spend, not free reuse. Record paid orders in V1-PROOF `orders`, with goods, shipping, tax and paid totals. The purchase-card `actualCost` is goods only. Update the public-safe [purchase evidence](purchases.md) and regenerate the budget with `python3 tools/v1-proof/review.py --write`. Never add both the order payments and their goods-only purchase cards.
4. Close a physical milestone only when measured evidence exists for its acceptance criteria. Keep the failed trials and link their session records. Simulation passes do not close physical acceptance.
5. Build and check the site. Then publish the generated output through the deployment process of the current host.

## Bench notes in the browser

The current build page includes a local notebook for work and test observations. Notes persist in that browser when storage is available. They do not change the published plan or synchronize between devices. Export a copy before you clear the browser data. Transfer reviewed measurements into a dated repository session record to make them part of the shared project history.

“Passed” in a local observation describes that recorded trial only. It does not release a whole build stage. Record the setup, the outcome and the evidence. Keep the full [session template](checklists/one-leg-bench-session.md) for physical trials.

The [mechanical testing page](../tools/living-drawings/mechanical-tests.html) adds a movable layout and a dated session journal. Shared steps/history are in `tools/living-drawings/mechanical-tests-data.json`. Actual test events need a dated repository session and linked measurements/evidence.

Device drafts use separate browser storage. Their export/import does not silently replace sessions that conflict, and removed drafts remain available for restoration. Device drafts never close shared gates. Refer to the [recording workflow](mechanical-testing.md).

## Build and preview

Run from `tools/living-drawings`:

```sh
npm run build
npm run test:site
python3 -m http.server 8080 --directory ../../dist/site
```

Open `http://localhost:8080/`. The output is a self-contained static site in `dist/site`. Publish that directory, not the repository checkout or only the original HTML folder. The build renders Markdown into HTML with document navigation and section links. It resolves links against their source files, and it keeps the current interactive drawings and simulations. No browser Markdown renderer or remote document service is necessary.

## Electrical PDFs

The Electrical page includes separate PDF views for EL-01 and EL-05. Each PDF contains one 11 x 17 inch landscape sheet with 0.5 inch margins. The five-sheet atlas uses the same paper size. Print at 100% scale.

After a change to an electrical diagram, regenerate its SVG and PDF in the same commit. Run `node cad/wiring/render.mjs` from the repository root. This command rebuilds all electrical SVGs, registers, PNGs and PDFs from their shared sources. Refer to the [electrical export procedure](../cad/wiring/README.md) for the runtime requirements and visual checks.

The export manifest records hashes of the source files and outputs. The site build rejects missing or stale exports before it changes the output directory. The production publisher uses the same check. Do not change the manifest by hand to bypass a failed check.

## Published assets

Local vendor downloads in `cad/vendor`, optional derived meshes in `tools/living-drawings/models`, and the locally extracted duplicate `cad/prints/v1-proof-r01/hux-v1-proof-r01` stay out of the published bundle. The canonical print-kit folder and ZIP remain published. The archived sandbox supports its current envelope-geometry fallback. Styles and direct script assets receive content-based cache keys so that rebuilt pages load the updated files.

The current project has six primary sections, with the same navigation on drawings, simulations and rendered documents:

| Section | Published route | Contents |
| --- | --- | --- |
| Overview | `/` (also `/v1-proof.html`) | Active scope, assembly rendering, design targets and current status |
| Mechanical | `/mechanical.html` | Assembly, interactive general arrangement and drawing register |
| Electrical | `/electrical.html` | EL-01–04 wiring atlas, enlarged vector viewer, printable PDF and architecture |
| Build & test | `/build.html` | Workbench, milestones, updates and local session notebook |
| Parts & budget | `/parts.html` | Paid orders, shopping list, component register and allowances |
| Documents | `/documents.html` | Discipline-grouped source register and historical archive |

Mechanical includes `/joints.html` for close-up detail studies and links to `/mechanical-tests.html`. Electrical includes `/controls.html`. Build & test links to the current simulation evidence and the 3D sandbox. `/v0-genesis.html` keeps the old plan model. `/docs/…html` remains the readable route for each source guide.

The 3D sandbox is one page for both robots. The query `?robot=` sets the robot. `/sim.html` opens V0-GENESIS.

The builder supplies the shared header, the breadcrumbs, the section navigation and the footer. New authored pages use `workshop.css` after their page styles. Edit the navigation in `build_site.py`. Do not add a second header.

`workshop.js` keeps old homepage bookmarks such as `/#build`, `/#model`, `/#connections` and `/#budget`. It forwards them to the dedicated page. The publication step also relocates repository links to these old fragments. Keep the local notebook storage keys intact when you reorganize pages.

Joint studies remain open. The source-checked EL-01–04 wiring atlas replaces the electrical placeholders. Its [verification record](wiring-atlas.md) keeps the unresolved circuits and the physical harness release visible.

Replace placeholders with measured photographs or reviewed drawings only when their evidence exists. Keep the sheet identifiers and the release status. The source Markdown remains editable in the repository. The site links to the rendered pages.

## Writing standard

All active text obeys Simplified Technical English (STE). The rules and the project names are in [writing-standard.md](writing-standard.md). `npm run test:site` runs `python3 tools/ste/check_repo.py`, the STE gate. The site build fails when the gate finds an error. Run the gate on each document before you publish.

## Live publishing and freshness

The signed GitHub push hook for `main` uses the host configuration in [nova-centauri/vps-1](https://github.com/nova-centauri/vps-1/blob/main/docs/hux.md). The deploy script builds a separate release with the Python publisher of this repository. It validates the links of the release, then atomically switches the published directory. A failed build keeps the prior release. Failed post-publish route/revision checks restore the prior release. Generated output is not committed to this repository.

Check [deployment.json](https://hux.xer0.io/deployment.json): its `revision` must equal the intended Hux Git commit. Then make sure that the live [budget](https://hux.xer0.io/docs/bom.html), [paid orders](https://hux.xer0.io/docs/purchases.html), [motor connections](https://hux.xer0.io/docs/electronics.html) and [control architecture](https://hux.xer0.io/docs/software.html) are correct. Also make sure that the orders and totals on the homepage are correct. [build-report.json](https://hux.xer0.io/build-report.json) must report no errors. A successful push or a homepage HTTP 200 alone does not establish that the new guides and data are current.

Use `npm test` for the current model and simulation regression checks. Run `npm run test:legacy` when you change the historical engineering or simulator behavior.
