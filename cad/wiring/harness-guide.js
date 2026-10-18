/* Progressive enhancement: all build cards remain readable without JavaScript. */
(() => {
  const cards = [...document.querySelectorAll('.harness-card')];
  const links = [...document.querySelectorAll('[data-harness]')];
  const status = document.getElementById('selected-harness');
  const input = document.getElementById('harness-filter');
  const count = document.getElementById('harness-count');
  const print = document.getElementById('print-harness');
  if (!cards.length || !input || !print) return;
  function select(id, focus = false) {
    const selected = cards.find(card => card.id === id);
    if (!selected) return;
    cards.forEach(card => { card.hidden = card !== selected; });
    links.forEach(link => {
      if (link.dataset.harness === id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    status.textContent = `${id} / ${selected.querySelector('h2').textContent}`;
    if (focus) selected.focus({ preventScroll: true });
  }
  const initial = location.hash.slice(1);
  select(cards.some(card => card.id === initial) ? initial : 'H6');
  function revealAnchor() {
    const target = document.getElementById(location.hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
    if (target?.classList.contains('harness-card')) target.scrollIntoView({ block: 'start' });
  }
  // The browser can jump before enhancement hides the preceding cards.
  requestAnimationFrame(revealAnchor);
  addEventListener('load', revealAnchor, { once: true });
  addEventListener('hashchange', () => {
    select(location.hash.slice(1), true);
    revealAnchor();
  });
  document.querySelectorAll('.guide-links a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    const target = document.getElementById(link.hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  }));
  // Reveal before the native anchor jump, including clicks on the current hash.
  links.forEach(link => link.addEventListener('click', () => select(link.dataset.harness, true)));
  input.addEventListener('input', () => {
    const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    links.forEach(link => {
      link.hidden = !terms.every(term => link.dataset.search.toLowerCase().includes(term));
      if (!link.hidden) shown++;
    });
    count.textContent = `${shown} of ${links.length} harnesses`;
    document.getElementById('no-harnesses').hidden = shown > 0;
  });
  // Each connector retains all views and positions in the static document.
  // Hidden attributes only select the active view when scripting is available.
  cards.forEach(card => {
    const connectors = [...card.querySelectorAll('.plug-card')];
    const choices = [...card.querySelectorAll('[data-connector-button]')];
    const chooseConnector = key => {
      connectors.forEach(plug => { plug.hidden = plug.dataset.connector !== key; });
      choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.connectorButton === key)));
    };
    card.querySelector('.connector-picker').hidden = false;
    choices.forEach(button => button.addEventListener('click', () => chooseConnector(button.dataset.connectorButton)));
    if (choices.length) chooseConnector(choices[0].dataset.connectorButton);
    connectors.forEach(plug => {
      const views = [...plug.querySelectorAll('[data-view-panel]')];
      const viewButtons = [...plug.querySelectorAll('[data-view-button]')];
      const chooseView = name => {
        views.forEach(view => { view.hidden = view.dataset.viewPanel !== name; });
        viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.viewButton === name)));
      };
      if (viewButtons.length) {
        plug.querySelector('.view-controls').hidden = false;
        viewButtons.forEach(button => button.addEventListener('click', () => chooseView(button.dataset.viewButton)));
        chooseView('3d');
        plug.querySelector('.pin-instruction').hidden = false;
      }
      const pinButtons = [...plug.querySelectorAll('[data-pin-button]')];
      const reset = plug.querySelector('.show-all-pins');
      const choosePin = position => {
        plug.classList.toggle('has-selected-pin', Boolean(position));
        plug.querySelectorAll('.render-pin').forEach(pin => pin.classList.toggle('is-selected', pin.dataset.position === position));
        pinButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pinButton === position)));
        reset.hidden = !position;
      };
      pinButtons.forEach(button => {
        button.disabled = !views.length;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => choosePin(button.getAttribute('aria-pressed') === 'true' ? null : button.dataset.pinButton));
      });
      reset.addEventListener('click', () => {
        const selected = pinButtons.find(button => button.getAttribute('aria-pressed') === 'true');
        choosePin(null);
        selected?.focus({ preventScroll: true });
      });
    });
  });
  print.hidden = false;
  print.addEventListener('click', () => window.print());
})();
