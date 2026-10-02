const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Journal, pose, chronology, escape, sourceURL } = require('./mechanical-tests.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'mechanical-tests-data.json'), 'utf8'));
function storage() {
  const values = new Map();
  return { values, getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
}
const observation = { stepId: 'M1', when: '2026-10-02T14:30', timezone: 'America/Detroit', outcome: 'note', measurements: 'Lower link centers 110.2 mm.', notes: 'Measured the print; upper link measurement remains open.', evidence: 'fit-001.jpg' };

test('the sweep preserves the established parallelogram geometry at endpoints and neutral', () => {
  for (const [q, x, y] of [[15, 28.470095, 106.251841], [30, 55, 95.262794], [45, 77.781746, 77.781746]]) {
    const p = pose(q, data.geometry);
    assert.ok(Math.abs(p.x - x) < 0.00001);
    assert.ok(Math.abs(p.y - y) < 0.00001);
    assert.ok(Math.abs(Math.hypot(p.x, p.y) - 110) < 0.00001);
  }
  assert.throws(() => pose(NaN), /outside/);
  assert.throws(() => pose(46), /outside/);
});

test('trial notes persist with their session time, measurements and evidence without changing shared gates', () => {
  const device = storage();
  const before = JSON.stringify(data);
  const journal = new Journal(device, data.steps);
  const record = journal.add(observation);
  const restored = new Journal(device, data.steps);
  assert.deepEqual(restored.records[0], record);
  assert.equal(restored.records[0].when, '2026-10-02T14:30');
  assert.equal(restored.records[0].timezone, 'America/Detroit');
  assert.equal(JSON.stringify(data), before);
});

test('passes need measured evidence; invalid dates, steps and fields cannot mutate saved history', () => {
  const device = storage(), journal = new Journal(device, data.steps);
  const publishedStatus = data.steps[0].status;
  for (const input of [
    { ...observation, outcome: 'passed', measurements: '' },
    { ...observation, outcome: 'passed', evidence: '' },
    { ...observation, when: '2026-02-30T14:30' },
    { ...observation, when: '2026-10-02T24:30' },
    { ...observation, stepId: 'NONEXISTENT' },
    { ...observation, notes: ' ' },
    { ...observation, measurements: 'x'.repeat(8001) },
    { ...observation, timezone: 'Invalid/Zone' },
  ]) assert.throws(() => journal.add(input));
  assert.equal(journal.records.length, 0);
  assert.equal(device.values.size, 0);
  journal.add({ ...observation, outcome: 'passed' });
  assert.equal(journal.records[0].outcome, 'passed');
  assert.equal(data.steps[0].status, publishedStatus);
});

test('chronology includes failed trials, sorts actual session dates and filters preparation', () => {
  const journal = new Journal(storage(), data.steps);
  journal.add({ ...observation, when: '2026-10-01T09:00', outcome: 'failed' });
  journal.add({ ...observation, when: '2026-10-02T10:00' });
  const rows = chronology(data.events, journal.records, true).filter((r) => r.scope === 'draft');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].when, '2026-10-02T10:00');
  assert.equal(rows[1].outcome, 'failed');
  assert.equal(rows[0].scope, 'draft');
  assert.equal(chronology(data.events, journal.records).filter((r) => r.scope === 'shared').length, data.events.length);
});

test('removed drafts remain in exports and can be restored after a reload', () => {
  const device = storage(), journal = new Journal(device, data.steps);
  const record = journal.add(observation);
  journal.remove(record.id);
  assert.equal(journal.records.length, 0);
  assert.equal(journal.snapshot().removedRecords[0].id, record.id);
  const reload = new Journal(device, data.steps);
  assert.equal(reload.restoreLast().id, record.id);
  assert.equal(reload.records.length, 1);
  assert.equal(reload.removedRecords.length, 0);
});

test('imports merge idempotently and reject conflicting or invalid journals atomically', () => {
  const journal = new Journal(storage(), data.steps);
  const original = journal.add(observation);
  const incoming = new Journal(storage(), data.steps);
  incoming.add({ ...observation, when: '2026-10-02T15:30', outcome: 'failed' });
  assert.equal(journal.import(JSON.stringify(incoming.snapshot())), 1);
  assert.equal(journal.import(JSON.stringify(incoming.snapshot())), 0);
  const before = JSON.stringify(journal.snapshot());
  const bad = incoming.snapshot();
  bad.records.push({ ...original, notes: 'Conflicting replacement.' });
  bad.records.unshift({ ...original, id: 'otherwise-new-id' });
  assert.throws(() => journal.import(JSON.stringify(bad)), /conflicts/);
  assert.equal(JSON.stringify(journal.snapshot()), before);
  const wrongVersion = { ...incoming.snapshot(), version: 'v0-genesis' };
  assert.throws(() => journal.import(JSON.stringify(wrongVersion)), /exported Hux/);
  assert.throws(() => journal.import('null'), /exported Hux/);
  assert.throws(() => journal.import('not-json'), /valid exported Hux/);
  assert.throws(() => journal.import('x'.repeat(1048577)), /under 1 MB/);
  const duplicate = incoming.snapshot(); duplicate.records.push(duplicate.records[0]);
  assert.throws(() => journal.import(JSON.stringify(duplicate)), /duplicate/);
  assert.equal(JSON.stringify(journal.snapshot()), before);
});

test('unreadable or denied device storage is preserved while new notes remain exportable', () => {
  const device = storage(); device.values.set('hux.mechanical-journal.v1-proof', 'not-json');
  const journal = new Journal(device, data.steps);
  journal.add(observation);
  assert.equal(device.values.get('hux.mechanical-journal.v1-proof'), 'not-json');
  assert.equal(journal.snapshot().records.length, 1);
  assert.equal(journal.canPersist, false);
  const denied = new Journal({ getItem() { return null; }, setItem() { throw new Error('quota'); } }, data.steps);
  denied.add(observation);
  assert.match(denied.warning, /export a copy/i);
  assert.equal(denied.records.length, 1);
});

test('record text and source routes cannot become executable markup or URLs', () => {
  assert.equal(escape('<img src=x onerror="bad()">'), '&lt;img src=x onerror=&quot;bad()&quot;&gt;');
  assert.equal(sourceURL('javascript:bad()', 'https://hux.xer0.io/'), null);
  assert.equal(sourceURL('../secrets', 'https://hux.xer0.io/'), null);
  assert.equal(sourceURL('docs/one-leg-bench.md#power-and-interfaces', 'https://hux.xer0.io/'), 'https://hux.xer0.io/docs/one-leg-bench.html#power-and-interfaces');
});
