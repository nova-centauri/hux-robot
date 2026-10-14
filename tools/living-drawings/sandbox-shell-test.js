const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

global.HUX_SANDBOX_SHELL_TEST = true;
const S = require("./sandbox-shell");

test("parseRobot reads ?robot= and aliases", () => {
  assert.equal(S.parseRobot(""), S.DEFAULT_ROBOT);
  assert.equal(S.parseRobot("?"), "v1-proof");
  assert.equal(S.parseRobot("?robot=v1-proof"), "v1-proof");
  assert.equal(S.parseRobot("?robot=proof"), "v1-proof");
  assert.equal(S.parseRobot("?robot=v1"), "v1-proof");
  assert.equal(S.parseRobot("?robot=v0-genesis"), "v0-genesis");
  assert.equal(S.parseRobot("?robot=v0"), "v0-genesis");
  assert.equal(S.parseRobot("?robot=sim"), "v0-genesis");
  assert.equal(S.parseRobot("?robot=stair"), "v0-genesis");
  assert.equal(S.parseRobot("robot=V0-GENESIS"), "v0-genesis");
  assert.equal(S.parseRobot("?camera=orbit"), "v1-proof");
  assert.equal(S.parseRobot("?robot=unknown"), "v1-proof");
});

test("robotSearch writes ?robot= and keeps other params", () => {
  assert.equal(S.robotSearch("v0-genesis", ""), "?robot=v0-genesis");
  assert.equal(S.robotSearch("v1-proof", "?camera=orbit"), "?camera=orbit&robot=v1-proof");
  assert.equal(S.robotSearch("nope", "?robot=v0-genesis"), "?robot=v1-proof");
});

test("panel state reads, writes and ignores bad storage", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value)
  };
  assert.deepEqual(S.readPanels(null), S.defaultPanels());
  assert.deepEqual(S.readPanels(storage), S.defaultPanels());
  S.writePanels(storage, { intro: false, hud: true, charts: false, notes: true });
  assert.deepEqual(S.readPanels(storage), { intro: false, hud: true, charts: false, notes: true });
  values.set(S.STORAGE_KEY, "{");
  assert.deepEqual(S.readPanels(storage), S.defaultPanels());
  values.set(S.STORAGE_KEY, JSON.stringify({ intro: "no", hud: false }));
  assert.deepEqual(S.readPanels(storage), { intro: true, hud: false, charts: true, notes: true });
});

test("merged page keeps both robots and the old URL", () => {
  const page = fs.readFileSync(path.join(__dirname, "proof-sandbox.html"), "utf8");
  const redirect = fs.readFileSync(path.join(__dirname, "sim.html"), "utf8");
  assert.match(page, /id="robot"/);
  assert.match(page, /id="tpl-v1-proof"/);
  assert.match(page, /id="tpl-v0-genesis"/);
  assert.match(page, /data-panel-toggle="hud"/);
  assert.match(page, /sandbox-shell\.js/);
  assert.match(page, /proof-sandbox\.js/);
  assert.match(page, /sim-view\.js/);
  assert.match(redirect, /proof-sandbox\.html\?robot=v0-genesis/);
  assert.match(redirect, /http-equiv="refresh"/);
});
