import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../public/whatsapp.js", import.meta.url), "utf8");
function setup({ reduced = false, hover = true, service = "" } = {}) {
  let now = 0,
    id = 0,
    mowerFrames = 0,
    clippings = 0,
    toolSrc = "";
  const frames = new Map(),
    timers = new Map(),
    events = {};
  const classes = new Set(["button"]);
  let transform = { x: 0, angle: 0 };
  const stack = [],
    toolMotion = [];
  const ctx = {
    save() {
      stack.push({ ...transform });
    },
    restore() {
      transform = stack.pop();
    },
    translate(x) {
      transform.x += x;
    },
    rotate(angle) {
      transform.angle += angle;
    },
    closePath() {},
    clearRect() {},
    fillRect() {},
    setTransform() {},
    beginPath() {},
    moveTo() {},
    quadraticCurveTo() {},
    lineTo() {},
    ellipse() {},
    fill() {},
    stroke() {
      if (this.strokeStyle?.startsWith("rgba(170") || this.strokeStyle?.startsWith("rgba(194"))
        clippings++;
    },
    drawImage() {
      mowerFrames++;
      toolMotion.push({ ...transform });
    },
  };
  const link = {
    classList: { contains: (value) => classes.has(value), add: (value) => classes.add(value) },
    querySelector: () => null,
    closest: () => (service ? { id: service } : null),
    dataset: {},
    clientWidth: 240,
    clientHeight: 52,
    append(canvas) {
      this.canvas = canvas;
    },
    addEventListener(name, handler) {
      events[name] = handler;
    },
    matches: () => true,
  };
  const window = {
    devicePixelRatio: 1,
    matchMedia: (query) => ({
      matches: query.includes("reduced") ? reduced : hover,
      addEventListener() {},
    }),
  };
  vm.runInNewContext(source, {
    window,
    document: { createElement: () => ({ getContext: () => ctx, setAttribute() {} }) },
    Image: class {
      complete = true;
      naturalWidth = 70;
      set src(value) {
        toolSrc = value;
      }
    },
    ResizeObserver: class {
      observe() {}
    },
    performance: { now: () => now },
    requestAnimationFrame: (callback) => {
      frames.set(++id, callback);
      return id;
    },
    cancelAnimationFrame: (key) => frames.delete(key),
    setTimeout: (callback, delay) => {
      timers.set(++id, { at: now + delay, callback });
      return id;
    },
    clearTimeout: (key) => timers.delete(key),
  });
  window.GroenWhatsApp.enhance(link);
  return {
    link,
    frames,
    timers,
    toolMotion,
    get toolSrc() {
      return toolSrc;
    },
    get mowerFrames() {
      return mowerFrames;
    },
    get clippings() {
      return clippings;
    },
    fire(name, event = {}) {
      events[name](event);
    },
    advance(duration) {
      const end = now + duration;
      while (now < end) {
        now = Math.min(now + 16, end);
        for (const [key, timer] of [...timers])
          if (timer.at <= now) {
            timers.delete(key);
            timer.callback();
          }
        const callbacks = [...frames.values()];
        frames.clear();
        callbacks.forEach((callback) => callback(now));
      }
    },
  };
}

test("bovenaanzicht en snippers tijdens maaien; sneller teruggroeien na één seconde", () => {
  const button = setup();
  assert.equal(button.link.dataset.grassState, "ready");
  button.fire("pointerenter", { pointerType: "mouse" });
  button.advance(700);
  assert.equal(button.link.dataset.grassState, "mowing");
  assert.ok(button.mowerFrames > 0);
  assert.ok(button.clippings > 0);
  button.advance(800);
  assert.equal(button.link.dataset.grassState, "mown");
  button.fire("pointerleave");
  button.advance(999);
  assert.equal(button.link.dataset.grassState, "mown");
  button.advance(17);
  assert.equal(button.link.dataset.grassState, "growing");
  button.advance(2100);
  assert.equal(button.link.dataset.grassState, "ready");
  assert.equal(button.frames.size, 0, "geen doorlopende animatielus");
});

test("teruggaan naar de knop annuleert groei en laat gedeeltelijk gegroeid gras opnieuw maaien", () => {
  const button = setup();
  button.fire("pointerenter", { pointerType: "mouse" });
  button.advance(1500);
  button.fire("pointerleave");
  button.advance(500);
  button.fire("pointerenter", { pointerType: "mouse" });
  button.advance(5000);
  assert.equal(button.link.dataset.grassState, "mown");
  button.fire("pointerleave");
  button.advance(2600);
  assert.equal(button.link.dataset.grassState, "growing");
  button.fire("pointerenter", { pointerType: "mouse" });
  button.advance(1500);
  assert.equal(button.link.dataset.grassState, "mown");
});

test("toetsenbordfocus maait en blur start dezelfde groeitimer", () => {
  const button = setup();
  button.fire("focus");
  button.advance(1500);
  assert.equal(button.link.dataset.grassState, "mown");
  button.fire("blur");
  button.advance(2200);
  assert.equal(button.link.dataset.grassState, "growing");
});

test("touch en verminderde beweging laten de knop rustig", () => {
  const touch = setup({ hover: false });
  touch.fire("pointerenter", { pointerType: "touch" });
  touch.advance(5000);
  assert.equal(touch.link.dataset.grassState, "ready");
  const reduced = setup({ reduced: true });
  reduced.fire("pointerenter", { pointerType: "mouse" });
  reduced.fire("focus");
  reduced.advance(5000);
  assert.equal(reduced.link.dataset.grassState, "ready");
  assert.equal(reduced.frames.size, 0);
  assert.equal(reduced.mowerFrames, 0);
});

for (const [service, effect, tool] of [
  ["grasmaaien", "grass", "mower-top"],
  ["snoeien", "hedge", "electric-trimmer-top"],
  ["onkruid", "weeds", "weeder-top"],
  ["bladeren", "leaves", "rake-top"],
  ["tuinonderhoud", "care", "garden-tools-top"],
  ["buitenklussen", "sweep", "broom-top"],
]) {
  test(service + ": eigen achtergrond, gereedschap, snippers en snel herstel", async () => {
    const button = setup({ service });
    assert.equal(button.link.dataset.gardenEffect, effect);
    assert.equal(button.toolSrc, "/images/" + tool + ".svg");
    assert.match(
      await readFile(new URL("../public" + button.toolSrc, import.meta.url), "utf8"),
      /<svg/,
    );
    button.fire("pointerenter", { pointerType: "mouse" });
    button.advance(700);
    assert.ok(button.mowerFrames > 0);
    assert.ok(button.clippings > 0);
    button.advance(2200);
    assert.equal(button.link.dataset.grassState, "mown");
    if (!["grass", "hedge"].includes(effect)) {
      assert.ok(
        button.toolMotion.some((pose, i, poses) => i && pose.x < poses[i - 1].x),
        "gereedschap trekt echt terug",
      );
      assert.ok(button.toolMotion.some((pose) => pose.angle > 0.1));
      assert.ok(button.toolMotion.some((pose) => pose.angle < -0.1));
    } else {
      assert.ok(
        button.toolMotion.every((pose) => pose.angle === 0),
        "machine maakt een rechte baan",
      );
    }
    button.fire("pointerleave");
    button.advance(1100);
    assert.equal(button.link.dataset.grassState, "growing");
    button.advance(2100);
    assert.equal(button.link.dataset.grassState, "ready");
    assert.equal(button.frames.size, 0);
  });
}
