/* Published project facts and a deliberately separate, browser-local session notebook. */
(function (root) {
  'use strict';

  const OUTCOMES = { note: 'Observation', 'in-progress': 'In progress', blocked: 'Blocked', passed: 'Pass recorded' };
  const STORAGE_PREFIX = 'hux.session-notebook.v1.';
  const text = (value) => String(value == null ? '' : value);
  const escape = (value) => text(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const label = (value) => text(value).replace(/[-_]/g, ' ').replace(/^./, (char) => char.toUpperCase());
  const list = (value) => Array.isArray(value) ? value : [];
  const localDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  function sourceURL(path, base) {
    const value = text(path).trim();
    // All plan sources belong to this repository; never turn data into an executable URL.
    if (!value || value.startsWith('/') || /(^|\/)\.\.(\/|$)|^[a-z][a-z\d+.-]*:|\\|[\u0000-\u001f]/i.test(value)) return null;
    const [, pathname, suffix = ''] = value.match(/^([^?#]*)([?#].*)?$/);
    let relocated = pathname.replace(/^tools\/living-drawings\//, '');
    if (relocated.endsWith('/') || !relocated.split('/').pop().includes('.')) relocated = relocated.replace(/\/$/, '') + '/README.md';
    return new URL(relocated.replace(/\.md$/i, '.html') + suffix, base).href;
  }

  function targetsFor(version) {
    return [
      { id: 'general', title: 'General project observation' },
      ...list(version.nextActions).map((item) => ({ id: `action:${item.id}`, title: `Next action · ${item.title}` })),
      ...list(version.bench && version.bench.stages).map((item) => ({ id: `bench:${item.id}`, title: `Bench · ${item.title}` })),
      ...list(version.milestones).map((item) => ({ id: `milestone:${item.id}`, title: `Milestone · ${item.title}` })),
    ];
  }

  function validateRecord(input, targets, now) {
    const target = targets.find((item) => item.id === input.targetId);
    if (!target) throw new Error('Choose an item from this version’s plan.');
    if (!Object.hasOwn(OUTCOMES, input.outcome)) throw new Error('Choose a session outcome.');
    const notes = text(input.notes).trim();
    const evidence = text(input.evidence).trim();
    if (!notes) throw new Error('Add a brief note about what happened.');
    if (notes.length > 8000 || evidence.length > 8000) throw new Error('Keep each field under 8,000 characters.');
    if (input.outcome === 'passed' && !evidence) throw new Error('A pass needs evidence: include the measured result and a log, photo, or session record reference.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(Date.parse(`${input.date}T12:00:00Z`)) || new Date(`${input.date}T12:00:00Z`).toISOString().slice(0, 10) !== input.date) throw new Error('Choose a valid session date.');
    return {
      id: input.id || (root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      date: input.date, targetId: target.id, targetTitle: target.title, outcome: input.outcome,
      notes, evidence, recordedAt: now || new Date().toISOString(),
    };
  }

  class Notebook {
    constructor(storage, version, updatedAt) {
      this.storage = storage;
      this.version = version;
      this.updatedAt = updatedAt;
      this.targets = targetsFor(version);
      this.key = STORAGE_PREFIX + version.slug;
      this.records = [];
      this.warning = '';
      this.canPersist = true;
      try {
        const raw = storage.getItem(this.key);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.schemaVersion !== 1 || saved.version !== version.slug || !Array.isArray(saved.records)) throw new Error('Unrecognized notebook format.');
          // Keep earlier targets readable even when the published plan changes.
          for (const record of saved.records) {
            if (!record || typeof record.id !== 'string' || typeof record.targetId !== 'string' || typeof record.targetTitle !== 'string' || typeof record.recordedAt !== 'string') throw new Error('Invalid saved record.');
            validateRecord(record, [{ id: record.targetId, title: record.targetTitle }], record.recordedAt);
          }
          this.records = saved.records;
        }
      } catch (error) {
        this.canPersist = false;
        this.warning = 'Browser storage is unavailable or its saved notebook could not be read. Existing storage is untouched. New records remain in this tab; export them before leaving.';
      }
    }
    snapshot() {
      return { schemaVersion: 1, scope: 'browser-local-draft', version: this.version.slug, publishedPlanUpdatedAt: this.updatedAt, records: this.records.map((record) => ({ ...record })) };
    }
    persist() {
      if (!this.canPersist) return false;
      try {
        this.storage.setItem(this.key, JSON.stringify(this.snapshot()));
        return true;
      } catch (error) {
        this.canPersist = false;
        this.warning = 'This browser could not save the notebook. Records remain in this tab; export them before leaving.';
        return false;
      }
    }
    add(input) {
      const record = validateRecord(input, this.targets);
      this.records.unshift(record);
      this.persist();
      return record;
    }
    remove(id) {
      this.records = this.records.filter((record) => record.id !== id);
      this.persist();
    }
  }

  function purchaseQuantities(version) {
    const counts = {};
    for (const id of ['pololu-4752', 'pololu-4035', 'st3215']) {
      const part = list(version.purchases).find((item) => item.id === id) || {};
      const quantities = list(version.orders).flatMap((order) => list(order.items)).filter((item) => item.partId === id).map((item) => item.quantity);
      const known = Array.isArray(version.orders) && quantities.every((value) => Number.isInteger(value) && value >= 0);
      const ordered = known ? quantities.reduce((sum, value) => sum + value, 0) : null;
      const planned = Number.isInteger(part.plannedQuantity) && part.plannedQuantity >= 0 ? part.plannedQuantity : null;
      counts[id] = { ordered, planned, missing: planned === null || ordered === null ? null : Math.max(0, planned - ordered) };
    }
    return counts;
  }

  function quantitySummary(version) {
    const counts = purchaseQuantities(version);
    const motor = counts['pololu-4752'], driver = counts['pololu-4035'], servo = counts.st3215;
    const show = (value) => value === null ? 'Not recorded' : String(value);
    const units = (value, name) => value === null ? `${name} count not recorded` : `${value} ${name}${value === 1 ? '' : 's'}`;
    const needed = `${units(motor.missing, 'motor')} + ${units(driver.missing, 'driver')}`;
    let wheel = 'Recorded quantities do not yet establish a complete wheel motor/driver pair.';
    if (motor.missing === 0 && driver.missing === 0 && motor.planned === 2 && driver.planned === 2) {
      wheel = 'The full wheel motor/driver pair is ordered; delivery and qualification remain separate gates.';
    } else if (motor.ordered === 1 && driver.ordered === 1 && motor.planned === 2 && driver.planned === 2) {
      wheel = 'The first restrained bench channel is ordered; the second wheel channel is still required.';
    }
    const detail = `Ordered: ${show(motor.ordered)} / ${show(motor.planned)} motors, ${show(driver.ordered)} / ${show(driver.planned)} drivers, and ${show(servo.ordered)} / ${show(servo.planned)} servos (${show(servo.missing)} servos still needed). ${wheel}`;
    return { needed, detail };
  }

  function remainingShoppingList(version) {
    const counts = purchaseQuantities(version);
    return list(version.shoppingList).flatMap((item) => {
      if (!item.partId || !counts[item.partId]) return [item];
      const missing = counts[item.partId].missing;
      if (missing === 0) return [];
      return [{ ...item, need: missing === null ? 'Confirm remaining quantity' : `${missing} more ${item.unit}${missing === 1 ? '' : 's'}`, status: missing === null ? 'check-stock' : item.status }];
    });
  }

  const API = { Notebook, validateRecord, targetsFor, sourceURL, escape, purchaseQuantities, quantitySummary, remainingShoppingList };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (!root.document) return;
  const scriptBase = new URL('.', root.document.currentScript.src);
  let statusLabels = {};

  function sources(paths, title) {
    const links = list(paths).map((path, index) => {
      const url = sourceURL(path, scriptBase);
      if (!url) return '';
      const readable = title || text(path).split('/').pop().replace(/\.(?:md|html)(?:#.*)?$/, '').replace(/-/g, ' ');
      return `<a href="${escape(url)}">${escape(readable === 'README' ? 'Overview' : readable)} <span aria-hidden="true">↗</span></a>`;
    }).filter(Boolean);
    return links.length ? `<div class="plan-sources">${links.join('')}</div>` : '';
  }

  function status(value) {
    const normalized = text(value).toLowerCase();
    const kind = /ordered|shipped|current|active|progress/.test(normalized) ? 'active' : /archive|parked|blocked|unconfirmed|pending/.test(normalized) ? 'pending' : /complete|confirmed|passed/.test(normalized) ? 'recorded' : 'neutral';
    return `<span class="plan-status plan-status--${kind}">${escape(statusLabels[value] || label(value || 'Not recorded'))}</span>`;
  }

  function workbench(version) {
    const focus = version.focus || {};
    const bench = version.bench;
    return `<div class="plan-work-grid">
      <article class="plan-focus"><p class="plan-kicker">${version.role === 'archive' ? 'Preserved direction' : 'Current focus'}</p><h3>${escape(focus.title || version.name)}</h3><p>${escape(focus.summary || version.summary)}</p>${sources(focus.sourcePaths)}</article>
      <div class="plan-next"><div class="plan-block-head"><h3>${version.role === 'archive' ? 'Where it stands' : 'Next on the bench'}</h3><span class="plan-kicker">Published plan</span></div><ol class="plan-actions">${list(version.nextActions).map((item) => `<li><div class="plan-item-heading"><h4>${escape(item.title)}</h4>${status(item.status)}</div><p>${escape(item.detail)}</p>${sources(item.sourcePaths)}</li>`).join('') || '<li><p>No active work scheduled for this version.</p></li>'}</ol></div>
    </div>
    ${bench ? `<div class="plan-bench"><div class="plan-block-head"><div><p class="plan-kicker">The actuator exercise</p><h3>${escape(bench.title)}</h3></div>${status(bench.status)}</div><p class="plan-description">${escape(bench.summary)}</p><dl class="plan-geometry">${list(bench.geometry).map((item) => `<div><dt>${escape(item.label)}</dt><dd>${escape(item.value)}</dd></div>`).join('')}</dl>${sources(bench.sourcePaths)}<div class="plan-stage-heading"><h4>Arrival-day sequence</h4><span>Open a stage for its action and evidence gate.</span></div><div class="plan-stages">${list(bench.stages).map((stage, index) => `<details class="plan-stage"><summary><span class="plan-stage-number">${String(index).padStart(2, '0')}</span><span class="plan-stage-title">${escape(stage.title)}</span>${status(stage.status)}</summary><div class="plan-stage-body"><p>${escape(stage.action)}</p><div class="plan-evidence"><strong>Evidence before advancing</strong><p>${escape(stage.evidence)}</p></div></div></details>`).join('')}</div></div>` : ''}`;
  }

  function quantity(value, suffix) {
    return value === null || value === undefined ? 'Not recorded' : escape(value) + (suffix || '');
  }

  function parts(version) {
    return `<div class="plan-block-head"><div><p class="plan-kicker">Purchases & availability</p><h3>What is actually on hand?</h3><p class="plan-description">Purchase status, quantities and actual spend are kept separate from design allowances.</p></div></div><div class="plan-part-grid">${list(version.purchases).map((part) => `<article class="plan-part"><div class="plan-item-heading"><h4>${escape(part.name)}</h4>${status(part.status)}</div><dl><div><dt>Planned quantity</dt><dd>${quantity(part.plannedQuantity)}</dd></div><div><dt>Ordered quantity</dt><dd>${quantity(part.orderedQuantity)}</dd></div><div><dt>Goods paid (excl. shipping/tax)</dt><dd>${part.actualCost === null || part.actualCost === undefined ? 'Not recorded' : typeof part.actualCost === 'number' ? '$' + part.actualCost.toFixed(2) : escape(part.actualCost)}</dd></div><div><dt>Confirmed on</dt><dd>${quantity(part.confirmedOn)}</dd></div></dl><p>${escape(part.note)}</p>${sources(part.sourcePaths)}</article>`).join('') || '<p class="plan-empty">No confirmed purchases are recorded for this version.</p>'}</div>`;
  }

  function shoppingList(version) {
    const items = remainingShoppingList(version);
    if (!items.length) return '';
    return `<div class="purchase-shopping"><h3>Still to buy or check against stock</h3><p>${escape(version.shoppingSummary)}</p><div class="table-wrap"><table><caption class="sr-only">Remaining V1-PROOF shopping list</caption><thead><tr><th scope="col">Part / assembly</th><th scope="col">What remains</th><th scope="col">Next step</th></tr></thead><tbody>${items.map((item) => `<tr><td><strong>${escape(item.name)}</strong></td><td>${escape(item.need)}<small>${escape(item.note)}</small></td><td>${status(item.status)}</td></tr>`).join('')}</tbody></table></div><p class="small">Original planning caps below cover the full build allocations, including parts already bought. Missing parts still need quotes or confirmed reuse.</p></div>`;
  }

  function purchaseLedger(version) {
    const target = root.document.getElementById('purchase-ledger');
    if (!target || !list(version.orders).length) return;
    const money = (amount) => amount == null ? 'Not recorded' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const orders = version.orders;
    // Sum only order totals: purchase cards repeat goods costs, and are not extra spend.
    const known = orders.every((order) => Number.isFinite(order.paidTotal));
    const paidCents = orders.reduce((total, order) => total + Math.round((order.paidTotal || 0) * 100), 0);
    const ceiling = root.HuxProof && root.HuxProof.results.total_cap_usd;
    const paid = known ? paidCents / 100 : null;
    const remaining = known && Number.isFinite(ceiling) ? (Math.round(ceiling * 100) - paidCents) / 100 : null;
    const quantities = quantitySummary(version);
    target.innerHTML = `<div class="purchase-summary"><div><span class="plan-kicker">Recorded order totals</span><strong>${money(paid)}</strong><p>Combined order totals. Each order counted once; unshown charge breakdowns stay unknown.</p></div><div><span class="plan-kicker">Unspent to ${money(ceiling)} plan</span><strong>${money(remaining)}</strong><p>Includes everything still to buy and retained reserves; not spare feature budget.</p></div><div><span class="plan-kicker">Not covered by recorded wheel orders</span><strong>${escape(quantities.needed)}</strong><p>${escape(quantities.detail)}</p></div></div>
      <div class="table-wrap"><table><caption class="sr-only">Recorded orders and incoming components</caption><thead><tr><th scope="col">Order / incoming parts</th><th scope="col">Goods</th><th scope="col">Shipping</th><th scope="col">Tax</th><th scope="col">Order total / status</th></tr></thead><tbody>${orders.map((order) => `<tr><td><strong>${escape(order.vendor)}</strong><small>${list(order.items).map((item) => `${quantity(item.quantity)} × ${escape(item.name)} · ${money(item.unitCost)} each`).join('<br>')}</small><small>${order.paidOn ? `Paid ${escape(order.paidOn)}` : order.orderedOn ? `Ordered ${escape(order.orderedOn)}` : "Date not recorded"}</small></td><td class="money">${money(order.merchandiseCost)}</td><td class="money">${money(order.shippingCost)}</td><td class="money">${money(order.taxCost)}</td><td><strong class="money">${money(order.paidTotal)}</strong><br>${status(order.status)}<small>${escape(order.deliveryNote)}</small></td></tr>`).join('')}</tbody><tfoot><tr><td colspan="4">Total recorded spend</td><td>${money(paid)}</td></tr></tfoot></table></div>
      <p class="small">Receipt coverage and received inventory are recorded separately. Confirm the total received driver count before buying another driver. Servo 12 V variant comes from the user’s confirmation; inspect labels on arrival.</p>${sources(['docs/purchases.md', 'docs/parts-on-hand.md'])}${shoppingList(version)}`;
  }

  function milestones(version) {
    return `<div class="plan-block-head"><div><p class="plan-kicker">Finish lines, with evidence</p><h3>${version.role === 'archive' ? 'Historical planning gates' : 'Earn each next step.'}</h3><p class="plan-description">These are published project gates. Browser notes do not change their status.</p></div></div><div class="plan-milestones">${list(version.milestones).map((milestone, index) => `<article class="plan-milestone"><span class="plan-milestone-number">${String(index + 1).padStart(2, '0')}</span><div><div class="plan-item-heading"><h4>${escape(milestone.title)}</h4>${status(milestone.status)}</div><p>${escape(milestone.summary)}</p><ul>${list(milestone.criteria).map((criterion) => `<li>${escape(criterion)}</li>`).join('')}</ul>${sources(milestone.sourcePaths)}</div></article>`).join('')}</div>`;
  }

  function updates(version, data) {
    return `<div class="plan-block-head"><div><p class="plan-kicker">Published project history</p><h3>What changed, and why.</h3><p class="plan-description">Last published update: ${escape(data.updatedAt)}. Local session records appear only in your notebook.</p></div></div><ol class="plan-updates">${list(version.updates).map((update) => `<li><time datetime="${escape(update.date)}">${escape(update.date)}</time><div><h4>${escape(update.title)}</h4><p>${escape(update.summary)}</p>${sources(update.sourcePaths)}</div></li>`).join('')}</ol>`;
  }

  function documents(version) {
    return `<div class="plan-block-head"><div><p class="plan-kicker">The working reference</p><h3>${escape(version.id)} library</h3><p class="plan-description">Plans, checklists and evidence, with a page for every document.</p></div></div><div class="plan-documents">${list(version.documents).map((doc) => {
      const url = sourceURL(doc.path, scriptBase);
      return url ? `<a class="plan-document" href="${escape(url)}"><span><small>${escape(doc.kind || 'Reference')}</small><strong>${escape(doc.title)}</strong></span><span aria-hidden="true">↗</span></a>` : '';
    }).join('')}</div>`;
  }

  function notebookMarkup(notebook) {
    return `<details class="plan-notebook"><summary><span><span class="plan-kicker">Your browser / private draft</span><strong>Session notebook</strong></span><span class="plan-notebook-count">${notebook.records.length} record${notebook.records.length === 1 ? '' : 's'}</span></summary><div class="plan-notebook-body"><p class="plan-local-notice">Record work as it happens. These notes save only in this browser on this device. They do not update the published plan or mark a project milestone complete. Export records to keep a copy and use the evidence when updating the project.</p><p class="plan-storage-warning" ${notebook.warning ? '' : 'hidden'} role="status">${escape(notebook.warning)}</p><form class="plan-record-form"><div class="plan-form-row"><label>Plan item<select name="targetId">${notebook.targets.map((target) => `<option value="${escape(target.id)}">${escape(target.title)}</option>`).join('')}</select></label><label>Session date<input name="date" type="date" required value="${localDate()}"></label><label>Outcome<select name="outcome">${Object.entries(OUTCOMES).map(([value, name]) => `<option value="${value}">${escape(name)}</option>`).join('')}</select></label></div><label>What happened?<textarea name="notes" rows="3" maxlength="8000" required placeholder="Setup, measurements, failures, and the next thing to try."></textarea></label><label>Evidence <span class="plan-evidence-required">(required for a pass)</span><textarea name="evidence" rows="2" maxlength="8000" placeholder="Measured result, tested criteria, and a photo, log, or session record reference." aria-describedby="plan-evidence-help"></textarea></label><p class="plan-form-help" id="plan-evidence-help">Record enough detail to review the outcome later. A note is a draft; it is not independent validation.</p><div class="plan-form-actions"><button type="submit" class="plan-button plan-button--primary">Save local record</button><button type="button" class="plan-button" data-export>Export notebook · JSON</button></div><p class="plan-form-message" role="status" aria-live="polite"></p></form><div class="plan-local-records"></div></div></details>`;
  }

  function renderRecords(container, notebook) {
    container.querySelector('.plan-notebook-count').textContent = `${notebook.records.length} record${notebook.records.length === 1 ? '' : 's'}`;
    const warning = container.querySelector('.plan-storage-warning');
    warning.hidden = !notebook.warning;
    warning.textContent = notebook.warning;
    container.querySelector('[data-export]').disabled = !notebook.records.length;
    container.querySelector('.plan-local-records').innerHTML = notebook.records.length ? `<h4>Local session records</h4>${notebook.records.map((record) => `<article class="plan-local-record"><div class="plan-item-heading"><div><span class="plan-kicker">${escape(record.date)} · ${escape(OUTCOMES[record.outcome])}</span><h5>${escape(record.targetTitle)}</h5></div><button type="button" class="plan-remove" data-remove="${escape(record.id)}" aria-label="Remove local record for ${escape(record.targetTitle)} on ${escape(record.date)}">Remove</button></div><p>${escape(record.notes)}</p>${record.evidence ? `<p class="plan-record-evidence"><strong>Evidence:</strong> ${escape(record.evidence)}</p>` : ''}</article>`).join('')}` : '<p class="plan-empty">No session records yet. The published project status remains visible above.</p>';
  }

  function attachNotebook(container, notebook) {
    const form = container.querySelector('.plan-record-form');
    const message = form.querySelector('.plan-form-message');
    form.elements.outcome.addEventListener('change', () => { form.elements.evidence.required = form.elements.outcome.value === 'passed'; });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        notebook.add(Object.fromEntries(new FormData(form)));
        form.elements.notes.value = '';
        form.elements.evidence.value = '';
        message.textContent = notebook.canPersist ? 'Saved in this browser. Published project status is unchanged.' : 'Added to this tab. Export the notebook to preserve this record.';
        message.classList.remove('is-error');
        renderRecords(container, notebook);
      } catch (error) {
        message.textContent = error.message;
        message.classList.add('is-error');
      }
    });
    container.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-remove]');
      if (remove) {
        notebook.remove(remove.dataset.remove);
        renderRecords(container, notebook);
        message.textContent = 'Local record removed. Published project status is unchanged.';
        form.querySelector('button[type="submit"]').focus();
      }
      if (event.target.closest('[data-export]')) {
        const payload = { ...notebook.snapshot(), exportedAt: new Date().toISOString() };
        const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `hux-${notebook.version.slug}-local-notebook-${localDate()}.json`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        message.textContent = 'Notebook exported as a local draft. It has not been published.';
      }
    });
    renderRecords(container, notebook);
  }

  function render(container, data, version) {
    statusLabels = data.statusLabels || {};
    let storage;
    try { storage = root.localStorage; } catch (error) { storage = null; }
    const notebook = new Notebook(storage, version, data.updatedAt);
    const tabs = [
      ['workbench', version.role === 'archive' ? 'Overview' : 'Workbench', workbench(version)],
      ['parts', 'Parts', parts(version)],
      ['milestones', 'Milestones', milestones(version)],
      ['updates', 'Updates', updates(version, data)],
      ['library', 'Library', documents(version)],
    ];
    container.classList.add('living-plan');
    container.innerHTML = `<div class="plan-meta"><span><span class="plan-live-dot" aria-hidden="true"></span>${escape(version.id)} · ${escape(version.role === 'archive' ? 'Archived planning record' : 'Working plan')}</span><span>Published ${escape(data.updatedAt)}</span></div><div class="plan-tabs" role="tablist" aria-label="${escape(version.id)} project plan">${tabs.map(([id, name], index) => `<button type="button" role="tab" id="plan-tab-${id}" aria-controls="plan-panel-${id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-plan-tab="${id}">${name}</button>`).join('')}</div>${tabs.map(([id, name, content], index) => `<section class="plan-panel" id="plan-panel-${id}" role="tabpanel" aria-labelledby="plan-tab-${id}" tabindex="0"${index === 0 ? '' : ' hidden'}>${content}</section>`).join('')}${version.role === 'current' ? notebookMarkup(notebook) : ''}`;
    const buttons = [...container.querySelectorAll('[role="tab"]')];
    function activate(button, focus) {
      buttons.forEach((item) => {
        const selected = item === button;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        container.querySelector(`#${item.getAttribute('aria-controls')}`).hidden = !selected;
      });
      if (focus) button.focus();
    }
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(button, false));
      button.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (next !== undefined) { event.preventDefault(); activate(buttons[next], true); }
      });
    });
    if (version.role === 'current') attachNotebook(container, notebook);
  }

  async function boot() {
    const container = document.getElementById('living-plan');
    if (!container) return;
    container.innerHTML = '<p class="plan-loading" role="status">Loading the working plan…</p>';
    try {
      const response = await fetch(new URL('plan-data.json', scriptBase), { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Plan request failed: ${response.status}`);
      const data = await response.json();
      if (data.schemaVersion !== 1) throw new Error('Unsupported plan format.');
      const versions = Array.isArray(data.versions) ? data.versions : Object.values(data.versions || {});
      const version = versions.find((item) => item.slug === container.dataset.version);
      if (!version) throw new Error('Version not found.');
      render(container, data, version);
      purchaseLedger(version);
      // The asynchronous board changes section positions after native hash
      // navigation. Land deep links on their section after the content exists.
      if (root.location.hash) {
        const anchor = document.getElementById(root.location.hash.slice(1));
        if (anchor) anchor.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    } catch (error) {
      const path = container.dataset.version === 'v0-genesis' ? 'docs/archive/stair-v1/README.md' : 'docs/v1-proof.md';
      container.innerHTML = `<p class="plan-error" role="alert">The working plan could not load. <a href="${escape(sourceURL(path, scriptBase))}">Read the published plan</a> or reload this page.</p>`;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(typeof globalThis !== 'undefined' ? globalThis : this);
