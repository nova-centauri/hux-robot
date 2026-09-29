# Keeping the HUX plan alive

The website has two named versions: **V1-PROOF** is the current build and **V0-GENESIS** is the original planning model. A third version follows the proof; its name and scope are not set. Historical `stair-v1` file paths stay intact so old research references keep working.

## Update the shared plan

1. Record the decision, order or measured result in the relevant source document: [inventory](parts-on-hand.md), [bench sessions](checklists/one-leg-bench-session.md), [acceptance protocol](v1-proof-validation.md) or [decisions](decisions.md).
2. Update `tools/living-drawings/plan-data.json` in the same change. Its version records supply the current actions, purchased parts, milestones, bench sequence and dated updates shown on the site. Update `updatedAt` and include source references.
3. Keep unknown order quantities and paid costs as `null`. A planned pair of motors does not establish an ordered quantity. Ordered parts are project spend, not free reuse.
4. Close a physical milestone only after its acceptance criteria have measured evidence. Keep failed trials and link their session records. Simulation passes do not close physical acceptance.
5. Build and check the site, then publish the generated output through the existing host's deployment process.

## Bench notes in the browser

The current build page includes a local notebook for work and test observations. Notes persist in that browser when storage is available. They do not change the published plan or synchronize between devices. Export a copy before clearing browser data, and transfer reviewed measurements into a dated repository session record to make them part of the shared project history.

“Passed” in a local observation describes that recorded trial only. It does not release a whole build stage. Record the setup, outcome and evidence; keep the full [session template](checklists/one-leg-bench-session.md) for physical trials.

## Build and preview

Run from `tools/living-drawings`:

```sh
npm run build
npm run test:site
python3 -m http.server 8080 --directory ../../dist/site
```

Open `http://localhost:8080/`. The output is a self-contained static site in `dist/site`. Publish that directory, not the repository checkout or just the original HTML folder. The build renders Markdown into HTML with document navigation and section links, resolves links against their source files, and preserves the existing interactive drawings and simulations. No browser Markdown renderer or remote document service is required.

Local vendor downloads in `cad/vendor` and the optional derived meshes in `tools/living-drawings/models` stay out of the published bundle. The archived sandbox supports its existing envelope-geometry fallback. Styles and direct script assets receive content-based cache keys so rebuilt pages load updated files.

The main routes are `/` and `/v1-proof.html` for the current build, `/v0-genesis.html` for the old planning model, and `/docs/…html` for readable guides. Existing `/#build` bookmarks continue to open the active plan. The source Markdown remains editable in the repository; the site links to rendered pages.

Use `npm test` for the existing model and simulation regression checks. Run `npm run test:legacy` when modifying historical engineering or simulator behavior.
