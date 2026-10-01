import test from 'node:test';
import assert from 'node:assert/strict';
import { captureKeys } from '../src/editor/keys.js';

// Minimal event-root adapter: capture observes input, then the editor handles it,
// then the event bubbles. No editor or DOM behavior is emulated here.
function eventRoot() {
  const listeners = [];
  return {
    addEventListener(type, handler, capture = false) {
      listeners.push({ type, handler, capture });
    },
    removeEventListener(type, handler, capture = false) {
      const index = listeners.findIndex(
        (entry) => entry.type === type && entry.handler === handler && entry.capture === capture,
      );
      if (index >= 0) listeners.splice(index, 1);
    },
    dispatch(event, editorHandler) {
      for (const entry of listeners.filter((entry) => entry.capture)) entry.handler(event);
      editorHandler(event);
      for (const entry of listeners.filter((entry) => !entry.capture)) entry.handler(event);
    },
  };
}
function event(key) {
  return {
    key,
    ctrlKey: true,
    altKey: false,
    metaKey: false,
    target: { closest: () => null },
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
}

test('Ctrl-[ is counted in insert mode, reaches Vim uncancelled, then its browser default is prevented', () => {
  const root = eventRoot();
  const cm = { state: { vim: { insertMode: true } } };
  const log = [];
  const dispose = captureKeys(
    root,
    () => cm,
    (line) => log.push(line),
  );
  const input = event('[');
  root.dispatch(input, (delivered) => {
    assert.equal(delivered.defaultPrevented, false);
    assert.match(log[0], /^insert\s+Ctrl-\[ → 1$/);
    cm.state.vim.insertMode = false;
  });
  assert.equal(input.defaultPrevented, true);
  dispose();
  const next = event('[');
  root.dispatch(next, () => {});
  assert.equal(next.defaultPrevented, false);
  assert.equal(log.length, 1);
});

test('Ctrl-r and Ctrl-v reach editor handlers before shortcut prevention', () => {
  for (const key of ['r', 'v']) {
    const root = eventRoot();
    const dispose = captureKeys(
      root,
      () => ({ state: { vim: {} } }),
      () => {},
    );
    const input = event(key);
    let handled = false;
    root.dispatch(input, (delivered) => {
      assert.equal(delivered.defaultPrevented, false);
      handled = true;
    });
    assert.equal(handled, true);
    assert.equal(input.defaultPrevented, true);
    dispose();
  }
});
