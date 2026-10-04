const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Notebook, sourceURL, escape, purchaseQuantities, quantitySummary, remainingShoppingList } = require('./plan.js');
const siteRoot = path.resolve(__dirname, '../../dist/site');

function publishedRoute(href, base = 'https://hux.xer0.io/') {
  const url = new URL(href);
  const prefix = new URL(base).pathname;
  assert.ok(url.pathname.startsWith(prefix), `Route escaped the published base: ${href}`);
  const target = path.join(siteRoot, decodeURIComponent(url.pathname.slice(prefix.length)));
  assert.ok(fs.existsSync(target) && fs.statSync(target).isFile(), `Missing published target: ${href}`);
  if (url.hash) {
    const ids = new Set([...fs.readFileSync(target, 'utf8').matchAll(/\s(?:id|name)\s*=\s*(["'])(.*?)\1/g)].map((match) => match[2]));
    assert.ok(ids.has(decodeURIComponent(url.hash.slice(1))), `Missing published fragment: ${href}`);
  }
}

function runWorkshop(script, href) {
  const url = new URL(href);
  let redirected;
  vm.runInNewContext(script, {
    URL,
    location: {
      href: url.href, pathname: url.pathname, hash: url.hash, search: url.search,
      replace(destination) { redirected = String(destination); },
    },
  }, { timeout: 1000 });
  return redirected;
}

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), values };
}
const version = { slug: 'v1-proof', nextActions: [{ id: 'inspect', title: 'Inspect received actuators', status: 'pending' }], bench: { stages: [{ id: 'servo', title: 'Bare servo', status: 'pending' }] }, milestones: [] };
const record = { targetId: 'bench:servo', outcome: 'passed', date: '2026-09-29', notes: 'Ten slow cycles completed.', evidence: 'Maximum error 0.8°; session log bench-001.csv.' };

function orderedVersion() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'plan-data.json'), 'utf8'));
  return data.versions.find((item) => item.id === 'V1-PROOF');
}

test('a second wheel order updates the live quantity summary even before purchase cards change', () => {
  const incoming = orderedVersion();
  assert.equal(quantitySummary(incoming).needed, '1 motor + 1 driver');
  assert.equal(remainingShoppingList(incoming).find((item) => item.partId === 'pololu-4752').need, '1 more motor');
  assert.match(quantitySummary(incoming).detail, /first restrained bench channel/);
  const second = JSON.parse(JSON.stringify(incoming.orders[0]));
  second.id = 'second-wheel-channel';
  incoming.orders.push(second);
  assert.deepEqual(purchaseQuantities(incoming)['pololu-4752'], { ordered: 2, planned: 2, missing: 0 });
  assert.equal(quantitySummary(incoming).needed, '0 motors + 0 drivers');
  assert.equal(remainingShoppingList(incoming).some((item) => item.partId === 'pololu-4752'), false);
  assert.match(quantitySummary(incoming).detail, /full wheel motor\/driver pair is ordered/);
  assert.match(quantitySummary(incoming).detail, /2 \/ 2 servos \(0 servos still needed\)/);
  assert.doesNotMatch(quantitySummary(incoming).detail, /first restrained bench channel|second wheel channel is still required/);
});

test('unknown order and planned quantities remain unknown in the live quantity summary', () => {
  const incoming = orderedVersion();
  incoming.orders[0].items[0].quantity = null;
  incoming.purchases.find((item) => item.id === 'st3215').plannedQuantity = null;
  const counts = purchaseQuantities(incoming);
  assert.deepEqual(counts['pololu-4752'], { ordered: null, planned: 2, missing: null });
  assert.equal(remainingShoppingList(incoming).find((item) => item.partId === 'pololu-4752').need, 'Confirm remaining quantity');
  assert.deepEqual(counts.st3215, { ordered: 2, planned: null, missing: null });
  assert.match(quantitySummary(incoming).needed, /motor count not recorded/);
  assert.match(quantitySummary(incoming).detail, /Not recorded servos still needed/);
  assert.doesNotMatch(quantitySummary(incoming).detail, /full wheel motor\/driver pair is ordered|first restrained bench channel/);
  incoming.orders = null;
  assert.equal(purchaseQuantities(incoming)['pololu-4035'].ordered, null);
});

test('a pass requires evidence, and invalid attempts cannot change records or storage', () => {
  const storage = memoryStorage();
  const notebook = new Notebook(storage, version, '2026-09-29');
  assert.throws(() => notebook.add({ ...record, evidence: '  ' }), /pass needs evidence/);
  assert.throws(() => notebook.add({ ...record, targetId: 'milestone:nonexistent' }), /this version/);
  assert.throws(() => notebook.add({ ...record, date: '2026-02-30' }), /valid session date/);
  assert.equal(notebook.records.length, 0);
  assert.equal(storage.values.size, 0);
});

test('records survive a reload, remain version-specific, and never mutate published status', () => {
  const storage = memoryStorage();
  const canonicalBefore = JSON.stringify(version);
  const notebook = new Notebook(storage, version, '2026-09-29');
  const saved = notebook.add(record);
  const reloaded = new Notebook(storage, version, '2026-09-30');
  assert.equal(reloaded.records.length, 1);
  assert.equal(reloaded.records[0].id, saved.id);
  assert.equal(reloaded.records[0].evidence, record.evidence);
  assert.equal(new Notebook(storage, { ...version, slug: 'v0-genesis' }, '2026-09-29').records.length, 0);
  assert.equal(JSON.stringify(version), canonicalBefore);
  reloaded.remove(saved.id);
  assert.equal(new Notebook(storage, version, '2026-09-30').records.length, 0);
});

test('export identifies local drafts and preserves results without modifying the notebook', () => {
  const notebook = new Notebook(memoryStorage(), version, '2026-09-29');
  notebook.add(record);
  const exported = notebook.snapshot();
  assert.equal(exported.scope, 'browser-local-draft');
  assert.equal(exported.version, 'v1-proof');
  assert.equal(exported.publishedPlanUpdatedAt, '2026-09-29');
  assert.equal(exported.records[0].evidence, record.evidence);
  exported.records[0].notes = 'Changed exported copy';
  assert.equal(notebook.records[0].notes, record.notes);
});

test('storage failures leave records exportable and do not erase unreadable saved content', () => {
  const storage = memoryStorage();
  storage.setItem('hux.session-notebook.v1.v1-proof', 'old malformed content');
  const notebook = new Notebook(storage, version, '2026-09-29');
  notebook.add(record);
  assert.equal(notebook.canPersist, false);
  assert.match(notebook.warning, /Existing storage is untouched/);
  assert.equal(notebook.snapshot().records.length, 1);
  assert.equal(storage.getItem(notebook.key), 'old malformed content');
  const denied = new Notebook({ getItem() { return null; }, setItem() { throw new Error('quota'); } }, version, '2026-09-29');
  denied.add(record);
  assert.match(denied.warning, /could not save/);
  assert.equal(denied.records.length, 1);
});

test('an updated plan retains old notebook targets for historical context', () => {
  const storage = memoryStorage();
  new Notebook(storage, version, '2026-09-29').add(record);
  const nextPlan = { slug: 'v1-proof', nextActions: [], milestones: [], bench: null };
  const notebook = new Notebook(storage, nextPlan, '2026-10-01');
  assert.equal(notebook.records[0].targetTitle, 'Bench · Bare servo');
  assert.equal(notebook.canPersist, true);
  assert.throws(() => notebook.add(record), /this version/);
});

test('document routing preserves nested paths and anchors without allowing executable links', () => {
  const base = 'https://hux.xer0.io/';
  assert.equal(sourceURL('docs/checklists/one-leg-bench-session.md#results', base), 'https://hux.xer0.io/docs/checklists/one-leg-bench-session.html#results');
  assert.equal(sourceURL('docs/archive/stair-v1/README.md', base), 'https://hux.xer0.io/docs/archive/stair-v1/README.html');
  assert.equal(sourceURL('cad/layouts/one-leg-bench-template.svg', base), 'https://hux.xer0.io/cad/layouts/one-leg-bench-template.svg');
  assert.equal(sourceURL('tools/living-drawings/stairs.html', base), 'https://hux.xer0.io/stairs.html');
  assert.equal(sourceURL('docs/checklists/', base), 'https://hux.xer0.io/docs/checklists/README.html');
  assert.equal(sourceURL('docs/checklists#bring-up', base), 'https://hux.xer0.io/docs/checklists/README.html#bring-up');
  assert.equal(sourceURL('javascript:alert(1)', base), null);
  assert.equal(sourceURL(' javascript:alert(1)', base), null);
  assert.equal(sourceURL('java\nscript:alert(1)', base), null);
  assert.equal(sourceURL('../outside.md', base), null);
  assert.equal(sourceURL('//other.example/script', base), null);
  assert.equal(escape('<img src=x onerror="oops">'), '&lt;img src=x onerror=&quot;oops&quot;&gt;');
});

test('every published plan document and source route resolves with its fragment in the built site', () => {
  assert.ok(fs.existsSync(siteRoot), 'Build the website before checking published plan links.');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'plan-data.json'), 'utf8'));
  const sources = new Set();
  function visit(value) {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') {
      if (value.sourcePaths) value.sourcePaths.forEach((source) => sources.add(source));
      if (value.path) sources.add(value.path);
      Object.values(value).forEach(visit);
    }
  }
  visit(data);
  assert.ok(sources.size > 20, 'Inspect the complete source-backed plan.');
  for (const source of sources) {
    const href = sourceURL(source, 'https://hux.xer0.io/');
    assert.ok(href, `Invalid source: ${source}`);
    publishedRoute(href);
  }
});

test('old workshop bookmarks preserve destination, query and deployment base before and after publishing', () => {
  const destinations = {
    build: 'build.html#build', model: 'mechanical.html#model',
    connections: 'electrical.html#wiring', intelligence: 'controls.html#intelligence',
    budget: 'parts.html#budget', archive: 'documents.html#archive',
    'next-version': 'documents.html#next-version',
    'plan-panel-workbench': 'build.html#build',
    'plan-panel-milestones': 'build.html#plan-panel-milestones',
    'plan-panel-updates': 'build.html#plan-panel-updates',
    'plan-panel-parts': 'parts.html', 'plan-panel-library': 'documents.html',
  };
  for (const scriptPath of [path.join(__dirname, 'workshop.js'), path.join(siteRoot, 'workshop.js')]) {
    const script = fs.readFileSync(scriptPath, 'utf8');
    for (const base of ['https://hux.xer0.io/', 'https://hux.xer0.io/project/']) {
      for (const alias of ['', 'index.html', 'v1-proof.html']) {
        for (const query of ['', '?print=1&view=fit']) {
          for (const [fragment, route] of Object.entries(destinations)) {
            const original = new URL(alias + query + '#' + fragment, base).href;
            const expected = new URL(route, base);
            expected.search = query;
            assert.equal(runWorkshop(script, original), expected.href, `${path.relative(__dirname, scriptPath)}: ${original}`);
            // Plan tab panels are rendered from fetched data. The matrix still
            // checks their exact hash, while static destinations verify anchors.
            if (fragment === 'plan-panel-milestones' || fragment === 'plan-panel-updates') {
              expected.hash = 'build';
            }
            publishedRoute(expected.href, base);
          }
        }
      }
      assert.equal(runWorkshop(script, new URL('index.html#unknown-section', base).href), undefined);
      for (const route of ['mechanical.html#model', 'build.html#build', 'parts.html#budget', 'documents.html#archive']) {
        assert.equal(runWorkshop(script, new URL(route, base).href), undefined, `New route must stay in place: ${route}`);
      }
    }
  }
});
