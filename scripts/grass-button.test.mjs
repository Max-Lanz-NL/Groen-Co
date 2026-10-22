import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../public/whatsapp.js", import.meta.url), "utf8");
function setup({ reduced = false, hover = true } = {}) {
  let now = 0,
    id = 0,
    mowerFrames = 0,
    clippings = 0;
  const frames = new Map(),
    timers = new Map(),
    events = {};
  const classes = new Set(["button"]);
  const ctx = {
    clearRect() {},
    fillRect() {},
    setTransform() {},
    beginPath() {},
    moveTo() {},
    quadraticCurveTo() {},
    lineTo() {},
    stroke() {
      if (this.strokeStyle?.startsWith("rgba")) clippings++;
    },
    drawImage() {
      mowerFrames++;
    },
  };
  const link = {
    classList: { contains: (value) => classes.has(value), add: (value) => classes.add(value) },
    querySelector: () => null,
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

test("bovenaanzicht en snippers tijdens maaien; gras groeit pas na twee seconden terug", () => {
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
  button.advance(1999);
  assert.equal(button.link.dataset.grassState, "mown");
  button.advance(17);
  assert.equal(button.link.dataset.grassState, "growing");
  button.advance(3300);
  assert.equal(button.link.dataset.grassState, "ready");
  assert.equal(button.frames.size, 0, "geen doorlopende animatielus");
});

test("teruggaan naar de knop annuleert groei en laat gedeeltelijk gegroeid gras opnieuw maaien", () => {
  const button = setup();
  button.fire("pointerenter", { pointerType: "mouse" });
  button.advance(1500);
  button.fire("pointerleave");
  button.advance(1000);
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
