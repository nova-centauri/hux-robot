/* Shared 3D sandbox shell: robot picker, hideable panels and script load.
   The two robots keep their own view/physics files. This file only selects
   one robot, clones its markup and starts its scripts. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HuxSandboxShell = api;
}(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  const DEFAULT_ROBOT = "v1-proof";
  const STORAGE_KEY = "hux-sandbox-panels";
  const PANELS = ["intro", "hud", "charts", "notes"];
  const ALIASES = {
    "v1-proof": "v1-proof",
    proof: "v1-proof",
    v1: "v1-proof",
    "v0-genesis": "v0-genesis",
    v0: "v0-genesis",
    stair: "v0-genesis",
    sim: "v0-genesis"
  };
  const ROBOTS = {
    "v1-proof": {
      id: "v1-proof",
      label: "V1-PROOF",
      title: "V1-PROOF · 3D sandbox",
      template: "tpl-v1-proof"
    },
    "v0-genesis": {
      id: "v0-genesis",
      label: "V0-GENESIS",
      title: "V0-GENESIS · 3D sandbox",
      template: "tpl-v0-genesis"
    }
  };

  function parseRobot(search) {
    const raw = String(search || "");
    const query = raw.charAt(0) === "?" ? raw.slice(1) : raw;
    const params = new URLSearchParams(query);
    const key = String(params.get("robot") || "").trim().toLowerCase();
    return ALIASES[key] || DEFAULT_ROBOT;
  }

  function robotSearch(id, search) {
    const raw = String(search || "");
    const query = raw.charAt(0) === "?" ? raw.slice(1) : raw;
    const params = new URLSearchParams(query);
    params.set("robot", ROBOTS[id] ? id : DEFAULT_ROBOT);
    return "?" + params.toString();
  }

  function defaultPanels() {
    return { intro: true, hud: true, charts: true, notes: true };
  }

  function readPanels(storage) {
    const state = defaultPanels();
    if (!storage) return state;
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "");
      if (!parsed || typeof parsed !== "object") return state;
      PANELS.forEach(function (id) {
        if (typeof parsed[id] === "boolean") state[id] = parsed[id];
      });
    } catch (err) {
      return state;
    }
    return state;
  }

  function writePanels(storage, state) {
    if (!storage) return;
    try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) { /* private mode */ }
  }

  function applyPanels(root, state) {
    const doc = root.ownerDocument || root;
    PANELS.forEach(function (id) {
      const show = !!state[id];
      (root.querySelectorAll ? root : doc).querySelectorAll('[data-panel="' + id + '"]').forEach(function (el) {
        el.hidden = !show;
      });
      doc.querySelectorAll('[data-panel-toggle="' + id + '"]').forEach(function (btn) {
        btn.setAttribute("aria-pressed", show ? "true" : "false");
      });
    });
    const compact = !state.intro && !state.charts && !state.notes;
    const body = doc.body;
    if (body) body.classList.toggle("sbx-focus", compact);
  }

  function loadScripts(doc, nodes) {
    return nodes.reduce(function (prev, old) {
      return prev.then(function () {
        return new Promise(function (resolve, reject) {
          const script = doc.createElement("script");
          script.src = old.src || old.getAttribute("src");
          script.onload = function () { resolve(); };
          script.onerror = function () { reject(new Error("Could not load " + script.src)); };
          doc.body.appendChild(script);
        });
      });
    }, Promise.resolve());
  }

  function mount(doc, search, storage) {
    const robot = parseRobot(search);
    const spec = ROBOTS[robot];
    const host = doc.getElementById("sandbox-host");
    const template = doc.getElementById(spec.template);
    const picker = doc.getElementById("robot");
    if (!host || !template) return Promise.reject(new Error("Sandbox markup is missing."));
    if (picker) picker.value = robot;
    if (doc.title !== undefined) doc.title = spec.title;
    host.replaceChildren();
    const fragment = template.content.cloneNode(true);
    const scripts = Array.prototype.slice.call(fragment.querySelectorAll("script[data-sandbox-script]"));
    scripts.forEach(function (node) { node.remove(); });
    host.appendChild(fragment);
    const state = readPanels(storage);
    applyPanels(doc, state);
    if (picker) {
      picker.addEventListener("change", function () {
        const next = robotSearch(picker.value, search);
        if (doc.defaultView && doc.defaultView.location) {
          doc.defaultView.location.assign(next + (doc.defaultView.location.hash || ""));
        }
      });
    }
    doc.querySelectorAll("[data-panel-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-panel-toggle");
        if (PANELS.indexOf(id) < 0) return;
        state[id] = !state[id];
        writePanels(storage, state);
        applyPanels(doc, state);
      });
    });
    return loadScripts(doc, scripts);
  }

  function boot(doc) {
    const storage = (function () {
      try { return doc.defaultView && doc.defaultView.localStorage; } catch (err) { return null; }
    }());
    const search = doc.defaultView && doc.defaultView.location ? doc.defaultView.location.search : "";
    return mount(doc, search, storage).catch(function (err) {
      const host = doc.getElementById("sandbox-host");
      if (host) host.textContent = err && err.message ? err.message : "The sandbox failed to start.";
    });
  }

  return {
    DEFAULT_ROBOT: DEFAULT_ROBOT,
    STORAGE_KEY: STORAGE_KEY,
    PANELS: PANELS,
    ROBOTS: ROBOTS,
    parseRobot: parseRobot,
    robotSearch: robotSearch,
    defaultPanels: defaultPanels,
    readPanels: readPanels,
    writePanels: writePanels,
    applyPanels: applyPanels,
    mount: mount,
    boot: boot
  };
}));

if (typeof window !== "undefined" && window.document && !window.HUX_SANDBOX_SHELL_TEST) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { window.HuxSandboxShell.boot(document); });
  } else {
    window.HuxSandboxShell.boot(document);
  }
}
