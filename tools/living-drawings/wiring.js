/* Progressive enhancement: every preview is a normal SVG link without JS. */
(() => {
  'use strict';
  const dialog = document.getElementById('wiring-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const canvas = dialog.querySelector('.atlas-viewer-canvas');
  const drawing = document.getElementById('wiring-viewer-image');
  const title = document.getElementById('wiring-viewer-title');
  const original = document.getElementById('wiring-vector-link');
  const zoomReadout = document.getElementById('wiring-zoom');
  const zoomIn = dialog.querySelector('[data-zoom="in"]');
  const zoomOut = dialog.querySelector('[data-zoom="out"]');
  const maximumZoom = 12;
  let zoom = 1;
  let drag = null;

  function fittedWidth() {
    const padding = parseFloat(getComputedStyle(canvas).paddingLeft) * 2;
    const aspect = drawing.naturalWidth / drawing.naturalHeight || Math.SQRT2;
    return Math.max(1, Math.min(canvas.clientWidth - padding, (canvas.clientHeight - padding) * aspect));
  }

  function sizeDrawing(nextZoom, preserveCenter = true) {
    const padding = parseFloat(getComputedStyle(canvas).paddingLeft) * 2;
    const oldRect = drawing.getBoundingClientRect();
    const frame = canvas.getBoundingClientRect();
    const centerX = frame.left + canvas.clientWidth / 2;
    const centerY = frame.top + canvas.clientHeight / 2;
    // A fitted image has auto margins; use its visible position, not scrollLeft,
    // to preserve the same part of the drawing when those margins disappear.
    const focusX = oldRect.width <= canvas.clientWidth - padding ? .5 : (centerX - oldRect.left) / oldRect.width;
    const focusY = oldRect.height <= canvas.clientHeight - padding ? .5 : (centerY - oldRect.top) / oldRect.height;
    zoom = Math.max(1, Math.min(maximumZoom, nextZoom));
    const newWidth = fittedWidth() * zoom;
    drawing.style.width = `${newWidth}px`;
    zoomReadout.value = `${Math.round(zoom * 100)}%`;
    zoomReadout.textContent = zoomReadout.value;
    zoomIn.disabled = zoom >= maximumZoom;
    zoomOut.disabled = zoom <= 1;
    if (preserveCenter) {
      const newRect = drawing.getBoundingClientRect();
      canvas.scrollLeft += newRect.left + newRect.width * focusX - centerX;
      canvas.scrollTop += newRect.top + newRect.height * focusY - centerY;
    } else {
      canvas.scrollLeft = canvas.scrollTop = 0;
    }
  }

  document.querySelectorAll('[data-wiring-viewer]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      title.textContent = link.dataset.title;
      drawing.alt = link.querySelector('img').alt;
      drawing.src = link.href;
      original.href = link.href;
      dialog.showModal();
      sizeDrawing(1, false);
    });
  });
  dialog.querySelector('.atlas-viewer-close').addEventListener('click', () => dialog.close());
  drawing.addEventListener('load', () => { if (dialog.open) sizeDrawing(zoom, false); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.querySelectorAll('[data-zoom]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.zoom === 'fit') sizeDrawing(1, false);
      else if (button.dataset.zoom === 'actual') sizeDrawing(drawing.naturalWidth / fittedWidth());
      else sizeDrawing(zoom + (button.dataset.zoom === 'in' ? .5 : -.5));
    });
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); sizeDrawing(zoom + .5); }
    else if (event.key === '-') { event.preventDefault(); sizeDrawing(zoom - .5); }
    else if (event.key === '0') { event.preventDefault(); sizeDrawing(1, false); }
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = {x: event.clientX, y: event.clientY, left: canvas.scrollLeft, top: canvas.scrollTop};
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-panning');
    canvas.focus({preventScroll: true});
    event.preventDefault();
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag) return;
    canvas.scrollLeft = drag.left + drag.x - event.clientX;
    canvas.scrollTop = drag.top + drag.y - event.clientY;
  });
  function endDrag() { drag = null; canvas.classList.remove('is-panning'); }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);
  dialog.addEventListener('close', endDrag);
  window.addEventListener('resize', () => { if (dialog.open) sizeDrawing(zoom, false); });
})();
