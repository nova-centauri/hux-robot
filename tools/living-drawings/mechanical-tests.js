/* Passive geometry and a recoverable device journal; published gates stay independent. */
(function (root) {
  'use strict';
  const DEFAULT_GEOMETRY = Object.freeze({ linkMm: 110, pivotMm: 40, wheelMm: 100, neutralDeg: 30, minDeg: 15, maxDeg: 45, plateMm: 6, linkThicknessMm: 5, lowerSpacerMm: 2, upperSpacerMm: 12 });
  const OUTCOMES = Object.freeze({ note: 'Observation', passed: 'Passed trial', failed: 'Failed trial', blocked: 'Blocked / incomplete' });
  const KEY = 'hux.mechanical-journal.v1-proof';
  const LIMIT = 2000;
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function pose(angle, geometry = DEFAULT_GEOMETRY) {
    const q = Number(angle);
    if (!Number.isFinite(q) || q < geometry.minDeg || q > geometry.maxDeg) throw new Error('Angle is outside the passive design range.');
    const radians = q * Math.PI / 180;
    return { angle: q, x: geometry.linkMm * Math.sin(radians), y: geometry.linkMm * Math.cos(radians) };
  }

  function diagramSVG(angle, g = DEFAULT_GEOMETRY) {
    const p = pose(angle, g), s = 1.85, bx = 240, by = 215;
    const cx = bx + p.x * s, cy = by + p.y * s, upper = by - g.pivotMm * s, carrierUpper = cy - g.pivotMm * s;
    const rad = p.angle * Math.PI / 180, arcX = bx + 57 * Math.sin(rad), arcY = by + 57 * Math.cos(rad);
    const labelX = (bx + cx) / 2 + Math.cos(rad) * 21, labelY = (upper + carrierUpper) / 2 - Math.sin(rad) * 21;
    const fixedPlate = 70 * s, plateTop = (upper + by) / 2 - fixedPlate / 2;
    const f = (n) => Number(n.toFixed(2));
    const ghost = [g.minDeg, g.maxDeg].map((q) => {
      const end = pose(q, g), x = bx + end.x * s, y = by + end.y * s;
      return `<path d="M${bx} ${by}L${f(x)} ${f(y)}" class="ghost"/><circle cx="${f(x)}" cy="${f(y)}" r="3" class="ghost-point"/>`;
    }).join('');
    const stack = (y, spacer, name) => {
      const start = 755, scale = 8, plate = g.plateMm * scale, gap = spacer * scale, link = g.linkThicknessMm * scale;
      return `<text x="730" y="${y - 15}" class="label">${name} link / ${spacer} mm spacers</text><rect x="${start}" y="${y}" width="${plate}" height="46" class="plate"/><rect x="${start + plate}" y="${y + 10}" width="${gap}" height="26" class="spacer"/><rect x="${start + plate + gap}" y="${y}" width="${link}" height="46" class="${name.toLowerCase()}-fill"/><path d="M${start - 15} ${y + 23}H${start + plate + gap + link + 15}" class="axis"/><text x="730" y="${y + 72}" class="small">Plate 0–${g.plateMm} · link ${g.plateMm + spacer}–${g.plateMm + spacer + g.linkThicknessMm} mm</text>`;
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1020 525" role="img" aria-labelledby="bench-sheet-title bench-sheet-desc" class="bench-diagram">
      <title id="bench-sheet-title">Passive Hux leg at ${p.angle} degrees, with side and lateral spacer views</title><desc id="bench-sheet-desc">Two ${g.linkMm} millimetre links connect fixed and carrier pivots ${g.pivotMm} millimetres apart. Axle position is ${p.x.toFixed(2)} millimetres rearward and ${p.y.toFixed(2)} downward. Lower spacers are ${g.lowerSpacerMm} millimetres; upper spacers are ${g.upperSpacerMm} millimetres at both link ends. Wheel and motor packaging are references; powered mounts and strength are unqualified.</desc>
      <defs><pattern id="bench-grid" width="37" height="37" patternUnits="userSpaceOnUse"><path d="M37 0H0V37" fill="none" stroke="#d5ddd3" stroke-width=".6"/></pattern><marker id="bench-arrow" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto-start-reverse"><path d="M0 0L5 2.5L0 5Z" fill="#5c6c63"/></marker><style>.bench-diagram text{font-family:system-ui,-apple-system,sans-serif;fill:#203830;font-size:14px}.bench-diagram .kicker{font:10px ui-monospace,monospace;letter-spacing:1.4px;fill:#5c6c63}.bench-diagram .label{font-size:14px;font-weight:650}.bench-diagram .small{font-size:12px;fill:#5c6c63}.bench-diagram .plate{fill:#e4e9e0;stroke:#819486;stroke-width:1.2}.bench-diagram .lower-fill{fill:#357457}.bench-diagram .upper-fill{fill:#b57a41}.bench-diagram .spacer{fill:#d4dcca;stroke:#819486;stroke-width:1}.bench-diagram .axis{stroke:#819486;stroke-width:1;stroke-dasharray:4 5;fill:none}.bench-diagram .ghost{stroke:#b3c0b2;stroke-width:1.5;stroke-dasharray:4 5;fill:none}.bench-diagram .ghost-point{fill:#b3c0b2}.bench-diagram .dim{stroke:#5c6c63;stroke-width:1;marker-start:url(#bench-arrow);marker-end:url(#bench-arrow);fill:none}.bench-diagram .leader{stroke:#819486;stroke-width:1;fill:none}</style></defs>
      <rect width="1020" height="525" fill="#fffefa"/><rect x="24" y="68" width="660" height="430" fill="url(#bench-grid)" opacity=".48"/><path d="M700 26V499" stroke="#d5ddd3"/>
      <text x="34" y="35" class="kicker">SIDE VIEW / PASSIVE SWEEP</text><text x="730" y="35" class="kicker">R01 / END VIEW</text><text x="730" y="65" class="label">Separate lateral planes.</text>
      <text x="453" y="82" class="small">Rearward</text><path d="M523 78H577" stroke="#5c6c63" marker-end="url(#bench-arrow)"/>
      ${ghost}<circle cx="${f(cx)}" cy="${f(cy)}" r="${g.wheelMm * s / 2}" fill="#e5ece0" fill-opacity=".38" stroke="#9aac9a" stroke-width="1.4" stroke-dasharray="6 5"/>
      <rect x="${bx - fixedPlate / 2}" y="${f(plateTop)}" width="${fixedPlate}" height="${fixedPlate}" rx="8" class="plate"/>
      <rect x="${f(cx - 8 * s)}" y="${f(carrierUpper - 8 * s)}" width="${16 * s}" height="${(g.pivotMm + 16) * s}" rx="12" class="plate"/>
      <path d="M${bx} ${upper}L${f(cx)} ${f(carrierUpper)}" stroke="#b57a41" stroke-width="15" stroke-linecap="round"/><path d="M${bx} ${by}L${f(cx)} ${f(cy)}" stroke="#357457" stroke-width="15" stroke-linecap="round"/>
      ${[[bx, upper], [bx, by], [cx, carrierUpper], [cx, cy]].map(([x,y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="14.8" fill="${i % 2 ? '#357457' : '#b57a41'}"/><circle cx="${f(x)}" cy="${f(y)}" r="4.2" fill="#fffefa" stroke="#203830" stroke-width="1.2"/>`).join('')}
      <path d="M166 ${upper}H137M166 ${by}H137" class="leader"/><path d="M145 ${upper}V${by}" class="dim"/><text x="83" y="${(upper + by) / 2 + 5}" class="label">${g.pivotMm} mm</text>
      <text x="187" y="103" class="small">Fixed plate</text><g transform="translate(${f(labelX)} ${f(labelY)}) rotate(${90 - p.angle})"><rect x="-36" y="-12" width="72" height="24" rx="3" fill="#fffefa"/><text text-anchor="middle" y="5" class="label">${g.linkMm} mm</text></g>
      <path d="M${bx} ${by + 22}V${by + 107}" class="axis"/><path d="M${bx} ${by + 57}A57 57 0 0 0 ${f(arcX)} ${f(arcY)}" class="leader"/><text x="${bx + 9}" y="${by + 104}" class="label">${p.angle}°</text>
      <path d="M${f(cx + 19)} ${f(cy)}H516" class="leader"/><text x="527" y="${f(cy - 5)}" class="label">Carrier / axle</text><text x="527" y="${f(cy + 15)}" class="small">Support to detail</text>
      <text x="34" y="480" class="small">Both links: ${g.linkMm} mm centers</text><text x="34" y="501" class="small">Dashed circle: Ø${g.wheelMm} wheel envelope</text>
      ${stack(130, g.lowerSpacerMm, 'Lower')}${stack(270, g.upperSpacerMm, 'Upper')}
      <text x="730" y="371" class="small">Spacers at both ends of each link.</text><path d="M730 392H983" stroke="#d5ddd3"/><text x="730" y="416" class="label">Motor · hub · bearings · cables</text><text x="730" y="440" class="small">Dry-fit received hardware through the sweep.</text><text x="730" y="464" class="small">No released powered mount or load rating.</text><text x="730" y="496" class="kicker">DIMENSIONS IN MILLIMETRES</text>
    </svg>`;
  }

  function validWhen(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
    const day = new Date(value.slice(0, 10) + 'T12:00:00Z');
    return !Number.isNaN(day.valueOf()) && day.toISOString().slice(0, 10) === value.slice(0, 10) && Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60;
  }
  function validateRecord(input, steps) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid session record in the journal.');
    const step = steps.find((item) => item.id === input.stepId);
    if (!step) throw new Error('Choose a step from this test route.');
    if (!validWhen(input.when)) throw new Error('Choose a valid session date and time.');
    if (!Object.hasOwn(OUTCOMES, input.outcome)) throw new Error('Choose a trial result.');
    const fields = {};
    for (const key of ['measurements', 'notes', 'evidence']) {
      if (typeof input[key] !== 'string') throw new Error('Session fields must be text.');
      fields[key] = input[key].trim();
      if (fields[key].length > 8000) throw new Error('Keep each session field under 8,000 characters.');
    }
    if (!fields.notes) throw new Error('Add an observation about what happened.');
    if (input.outcome === 'passed' && (!fields.measurements || !fields.evidence)) throw new Error('A passed trial needs measurements and a photo, log or session reference.');
    if (typeof input.id !== 'string' || !input.id || input.id.length > 128) throw new Error('Invalid session identity.');
    if (typeof input.recordedAt !== 'string' || Number.isNaN(Date.parse(input.recordedAt))) throw new Error('Invalid recording time.');
    if (typeof input.timezone !== 'string') throw new Error('Invalid session time zone.');
    try { new Intl.DateTimeFormat('en', { timeZone: input.timezone }); } catch (error) { throw new Error('Invalid session time zone.'); }
    return { id: input.id, stepId: step.id, stepTitle: step.title, when: input.when, timezone: input.timezone, outcome: input.outcome, ...fields, recordedAt: input.recordedAt };
  }
  function checkedSnapshot(value, steps) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Choose an exported Hux mechanical journal.');
    if (value.schemaVersion !== 1 || value.version !== 'v1-proof' || value.scope !== 'device-mechanical-drafts' || !Array.isArray(value.records) || !Array.isArray(value.removedRecords ?? [])) throw new Error('Choose an exported Hux mechanical journal.');
    if (value.records.length + (value.removedRecords?.length || 0) > LIMIT) throw new Error('The journal is too large to import safely.');
    const records = value.records.map((r) => validateRecord(r, steps));
    const removedRecords = (value.removedRecords || []).map((r) => validateRecord(r, steps));
    const ids = [...records, ...removedRecords].map((r) => r.id);
    if (new Set(ids).size !== ids.length) throw new Error('The imported journal contains duplicate session identities.');
    return { records, removedRecords };
  }
  class Journal {
    constructor(storage, steps) {
      this.storage = storage; this.steps = steps; this.records = []; this.removedRecords = []; this.canPersist = true; this.warning = '';
      try {
        const raw = storage.getItem(KEY);
        if (raw) Object.assign(this, checkedSnapshot(JSON.parse(raw), steps));
      } catch (error) {
        this.canPersist = false;
        this.warning = 'The saved journal could not be read or device storage is unavailable. Existing data is untouched. Export new notes before leaving this tab.';
      }
    }
    snapshot() { return { schemaVersion: 1, scope: 'device-mechanical-drafts', version: 'v1-proof', records: this.records.map((r) => ({ ...r })), removedRecords: this.removedRecords.map((r) => ({ ...r })) }; }
    persist() {
      if (!this.canPersist) return;
      try { this.storage.setItem(KEY, JSON.stringify(this.snapshot())); }
      catch (error) { this.canPersist = false; this.warning = 'Device storage could not save this journal. Notes remain in this tab; export a copy before leaving.'; }
    }
    add(input) {
      if (this.records.length + this.removedRecords.length >= LIMIT) throw new Error('Export this journal before starting a new one; the session limit has been reached.');
      const record = validateRecord({ ...input, id: root.crypto?.randomUUID ? root.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`, recordedAt: new Date().toISOString() }, this.steps);
      this.records.push(record); this.persist(); return record;
    }
    remove(id) {
      const record = this.records.find((r) => r.id === id);
      if (!record) return;
      this.records = this.records.filter((r) => r.id !== id); this.removedRecords.push(record); this.persist();
    }
    restoreLast() {
      const record = this.removedRecords.pop();
      if (record) { this.records.push(record); this.persist(); }
      return record;
    }
    import(raw) {
      if (typeof raw !== 'string' || raw.length > 1048576) throw new Error('Choose a journal under 1 MB.');
      let parsed;
      try { parsed = JSON.parse(raw); } catch (error) { throw new Error('Choose a valid exported Hux mechanical journal.'); }
      const incoming = checkedSnapshot(parsed, this.steps);
      const existing = new Map([...this.records, ...this.removedRecords].map((r) => [r.id, r]));
      const records = [], removedRecords = [];
      for (const [target, items] of [[records, incoming.records], [removedRecords, incoming.removedRecords]]) {
        for (const record of items) {
          const old = existing.get(record.id);
          if (old && JSON.stringify(old) !== JSON.stringify(record)) throw new Error('A session identity conflicts with this device’s copy. Nothing was imported; keep both export files for review.');
          if (!old) target.push(record);
        }
      }
      if (existing.size + records.length + removedRecords.length > LIMIT) throw new Error('The combined journal would exceed the session limit. Nothing was imported.');
      this.records.push(...records); this.removedRecords.push(...removedRecords); this.persist();
      return records.length + removedRecords.length;
    }
  }
  function chronology(events, records, trialsOnly = false) {
    const rows = [...events.map((event, index) => ({ ...event, scope: 'shared', sortIndex: index })), ...records.map((record, index) => ({ ...record, date: record.when.slice(0,10), kind: 'test', title: record.stepTitle, scope: 'draft', sortIndex: events.length + index }))];
    return rows.filter((r) => !trialsOnly || r.kind === 'test').sort((a,b) => (b.when || b.date).localeCompare(a.when || a.date) || b.sortIndex - a.sortIndex);
  }
  function sourceURL(path, base) {
    if (typeof path !== 'string' || !path || /(^|\/)\.\.(\/|$)|^[a-z][a-z\d+.-]*:|^\/|\\|[\u0000-\u001f]/i.test(path)) return null;
    return new URL(path.replace(/^tools\/living-drawings\//, '').replace(/\.md(?=[?#]|$)/, '.html'), base).href;
  }
  const api = { DEFAULT_GEOMETRY, OUTCOMES, Journal, pose, diagramSVG, validateRecord, chronology, escape, sourceURL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  const scriptBase = new URL('.', document.currentScript?.src || root.location.href);
  const byId = (id) => document.getElementById(id);
  const form = byId('mechanical-session-form');
  let data, journal, exportURL, trialsOnly = false;
  const referenceNames = { README: 'Assembly guide', 'one-leg-bench': 'Bench guide', '2026-10-02-mechanical-fit': 'Fit checklist', 'parts-on-hand': 'Inventory', purchases: 'Paid orders', 'mechanical-testing': 'Timeline guide', 'mechanical-v1': 'Acceptance checklist', 'one-leg-bench-session': 'Session template' };
  function sources(paths) {
    return (paths || []).map((path) => {
      const url = sourceURL(path, scriptBase);
      if (!url) return '';
      const name = path.split(/[?#]/)[0].split('/').pop().replace(/\.(md|html)$/, '');
      return `<a href="${escape(url)}">${escape(referenceNames[name] || name.replace(/[-_]/g, ' '))} ↗</a>`;
    }).join('');
  }
  function message(text, error = false) { byId('session-message').textContent = text; byId('session-message').classList.toggle('is-error', error); }
  function storageState() {
    byId('journal-warning').hidden = !journal.warning; byId('journal-warning').textContent = journal.warning;
    byId('restore-draft').hidden = !journal.removedRecords.length;
  }
  function draw() {
    const q = Number(byId('bench-angle').value), p = pose(q, data.geometry);
    byId('bench-drawing').innerHTML = diagramSVG(q, data.geometry);
    byId('bench-angle-value').textContent = `${q}°`;
    byId('axle-x').textContent = `${p.x.toFixed(2)} mm`; byId('axle-y').textContent = `${p.y.toFixed(2)} mm`;
    document.querySelectorAll('[data-angle]').forEach((button) => button.classList.toggle('is-selected', Number(button.dataset.angle) === q));
  }
  function history() {
    const rows = chronology(data.events, journal.records, trialsOnly);
    byId('shared-test-count').textContent = data.events.filter((r) => r.kind === 'test').length;
    byId('mechanical-history').innerHTML = rows.map((r) => {
      const pretty = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(r.date + 'T12:00:00Z'));
      const kind = r.scope === 'draft' ? `Device draft · ${OUTCOMES[r.outcome]}` : r.kind === 'test' ? `Project record · ${OUTCOMES[r.outcome]}` : 'Project record · ' + r.kind;
      return `<li><div class="history-date"><time datetime="${escape(r.when || r.date)}">${pretty}</time>${r.when ? `<small>${escape(r.when.slice(11))} · ${escape(r.timezone)}</small>` : ''}</div><div class="history-copy"><div class="history-heading"><h3>${escape(r.title)}</h3><span class="history-kind ${r.scope === 'draft' ? 'is-draft' : ''}">${escape(kind)}</span></div>${r.measurements ? `<p class="history-measurements">${escape(r.measurements)}</p>` : ''}<p>${escape(r.notes)}</p>${r.evidence ? `<p class="history-evidence"><strong>Evidence:</strong> ${escape(r.evidence)}</p>` : ''}${r.sourcePaths ? `<div class="step-sources">${sources(r.sourcePaths)}</div>` : ''}${r.scope === 'draft' ? `<button type="button" class="remove-draft" data-remove="${escape(r.id)}">Remove device draft</button>` : ''}</div></li>`;
    }).join('');
    byId('history-empty').hidden = rows.length > 0;
    storageState();
  }
  function hint() { byId('step-measurement-hint').textContent = data.steps.find((step) => step.id === form.elements.stepId.value)?.measure || ''; }
  function renderSteps() {
    byId('mechanical-steps').innerHTML = data.steps.map((step, index) => `<li class="${step.status === 'ready' ? 'is-ready' : ''}"><span class="step-number">${String(index + 1).padStart(2, '0')}</span>${index === 5 ? '<p class="phase-break">After mounts, power and fault gates</p>' : ''}<div class="test-step-head"><h3>${escape(step.title)}</h3><span class="step-state">${step.status === 'ready' ? 'Start here' : step.phase === 'powered' ? 'Later / powered' : 'Upcoming'}</span></div><details ${index === 0 ? 'open' : ''}><summary>Action and evidence</summary><div class="test-step-body"><p>${escape(step.action)}</p><p><strong>Measure:</strong> ${escape(step.measure)}</p><p class="step-evidence"><strong>Evidence:</strong> ${escape(step.evidence)}</p><div class="step-sources">${sources(step.sourcePaths)}</div><button type="button" class="record-step" data-step="${step.id}">Record this step ↘</button></div></details></li>`).join('');
    form.elements.stepId.innerHTML = data.steps.map((step) => `<option value="${step.id}">${step.id} · ${escape(step.title)}</option>`).join('');
    hint();
  }
  async function boot() {
    try {
      const response = await fetch(new URL('mechanical-tests-data.json', scriptBase), { cache: 'no-cache' });
      if (!response.ok) throw new Error('The test route could not load.');
      data = await response.json();
      if (data.schemaVersion !== 1 || data.version !== 'v1-proof' || !Array.isArray(data.steps) || !Array.isArray(data.events)) throw new Error('Unsupported test route.');
      let storage;
      try { storage = root.localStorage; } catch (error) { storage = { getItem() { throw error; } }; }
      journal = new Journal(storage, data.steps);
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date(), local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      form.elements.when.value = local; byId('session-zone').textContent = zone;
      const restore = document.createElement('button'); restore.type = 'button'; restore.id = 'restore-draft'; restore.className = 'test-button'; restore.textContent = 'Restore last removed draft';
      form.querySelector('.session-actions').append(restore);
      renderSteps(); draw(); history();
      ['save-session', 'export-journal', 'import-journal'].forEach((id) => { byId(id).disabled = false; });
      byId('bench-angle').addEventListener('input', draw);
      document.querySelectorAll('[data-angle]').forEach((button) => button.addEventListener('click', () => { byId('bench-angle').value = button.dataset.angle; draw(); }));
      document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
        const diagram = button.dataset.view === 'diagram'; byId('diagram-view').hidden = !diagram; byId('render-view').hidden = diagram; byId('pose-controls').hidden = !diagram;
        document.querySelectorAll('[data-view]').forEach((peer) => peer.setAttribute('aria-pressed', String(peer === button)));
      }));
      byId('mechanical-steps').addEventListener('click', (event) => { const button = event.target.closest('[data-step]'); if (button) { form.elements.stepId.value = button.dataset.step; hint(); byId('session').scrollIntoView({ behavior: 'auto', block: 'start' }); form.elements.measurements.focus({ preventScroll: true }); } });
      form.elements.stepId.addEventListener('change', hint);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        try {
          journal.add({ when: form.elements.when.value, timezone: zone, stepId: form.elements.stepId.value, outcome: form.elements.outcome.value, measurements: form.elements.measurements.value, notes: form.elements.notes.value, evidence: form.elements.evidence.value });
          form.elements.measurements.value = ''; form.elements.notes.value = ''; form.elements.evidence.value = ''; form.elements.outcome.value = 'note';
          history(); message(journal.canPersist ? 'Saved on this device and added to the timeline. Shared stage gates are unchanged.' : 'Added to this tab’s timeline. Export a copy before leaving.');
        } catch (error) { message(error.message, true); }
      });
      byId('export-journal').addEventListener('click', () => {
        const backup = JSON.stringify(journal.snapshot(), null, 2);
        if (exportURL) URL.revokeObjectURL(exportURL);
        exportURL = URL.createObjectURL(new Blob([backup], { type: 'application/json' }));
        byId('journal-backup-text').value = backup;
        byId('journal-download').href = exportURL; byId('journal-download').download = `hux-mechanical-journal-${form.elements.when.value.slice(0, 10)}.json`;
        byId('journal-backup').hidden = false; byId('journal-backup').open = true;
        message('Backup ready. Download the journal file or copy the backup text below.');
      });
      byId('select-backup').addEventListener('click', () => { byId('journal-backup-text').focus(); byId('journal-backup-text').select(); });
      byId('import-journal').addEventListener('click', () => byId('journal-file').click());
      byId('journal-file').addEventListener('change', async (event) => {
        const file = event.target.files[0]; if (!file) return;
        try { if (file.size > 1048576) throw new Error('Choose a journal under 1 MB.'); const count = journal.import(await file.text()); history(); message(`${count} new session record${count === 1 ? '' : 's'} imported. Matching existing records were kept.`); }
        catch (error) { message(error.message, true); }
        event.target.value = '';
      });
      byId('mechanical-history').addEventListener('click', (event) => { const button = event.target.closest('[data-remove]'); if (button) { journal.remove(button.dataset.remove); history(); message('Draft removed from the timeline. Use Restore last removed draft to bring it back.'); } });
      restore.addEventListener('click', () => { journal.restoreLast(); history(); message('Last removed draft restored.'); });
      document.querySelectorAll('[data-history]').forEach((button) => button.addEventListener('click', () => { trialsOnly = button.dataset.history === 'test'; document.querySelectorAll('[data-history]').forEach((peer) => peer.setAttribute('aria-pressed', String(peer === button))); history(); }));
      if (root.location.hash) byId(root.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' });
    } catch (error) { message('The interactive test route could not load. Reload the page or use the linked fit checklist.', true); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})(typeof globalThis !== 'undefined' ? globalThis : this);
