import test from 'node:test';
import assert from 'node:assert/strict';
import { keyCost, keyLabel } from '../src/game/keystrokes.js';
import { runRank } from '../src/game/scoring.js';
const key = (value, extra = {}) => ({
  key: value,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...extra,
});

test('a physical navigation route and :wq cost 16, with two keys of par slack', () => {
  let cost = [...'jjjllllllllll:'].reduce(
    (total, value) => total + keyCost(key(value), 'normal'),
    0,
  );
  cost += [...'wq'].reduce((total, value) => total + keyCost(key(value), 'command-line'), 0);
  cost += keyCost(key('Enter'), 'command-line');
  assert.equal(cost, 16);
});

test('insert text, enter and backspace are half-cost; escaping and control commands cost one', () => {
  for (const value of ['x', ' ', 'Enter', 'Backspace'])
    assert.equal(keyCost(key(value), 'insert'), 0.5);
  assert.equal(keyCost(key('Escape'), 'insert'), 1);
  assert.equal(keyCost(key('[', { ctrlKey: true }), 'insert'), 1);
  assert.equal(keyCost(key('r', { ctrlKey: true }), 'normal'), 1);
  assert.equal(keyCost(key('v', { ctrlKey: true }), 'visual'), 1);
});

test('command/search text differs from shortcuts and submission', () => {
  assert.equal(keyCost(key('a'), 'command-line'), 0.5);
  assert.equal(keyCost(key('Backspace'), 'command-line'), 0.5);
  assert.equal(keyCost(key('Enter'), 'command-line'), 1);
  assert.equal(keyCost(key('Escape'), 'command-line'), 1);
  assert.equal(keyCost(key('[', { ctrlKey: true }), 'command-line'), 1);
});

test('modifier-only presses and operating-system Meta shortcuts add no cost or overlay cap', () => {
  for (const value of ['Control', 'Shift', 'Alt', 'Meta', 'AltGraph']) {
    assert.equal(keyCost(key(value), 'normal'), 0);
    assert.equal(keyLabel(key(value)), null);
  }
  assert.equal(keyCost(key('s', { metaKey: true }), 'insert'), 0);
  assert.equal(keyLabel(key('s', { metaKey: true })), null);
  assert.equal(keyLabel(key('w', { ctrlKey: true })), '^W');
  assert.equal(keyLabel(key('Escape')), 'Esc');
});

test('Briefing rank clamps at Intern while exact ratio boundaries remain inclusive', () => {
  assert.deepEqual(
    [18, 36, 54, 72, 72.5].map((cost) => runRank(cost, 18)),
    [0, 1, 2, 3, 3],
  );
});
