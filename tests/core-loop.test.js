import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { defaultSave } from '../src/save.js';
import { createLevelRunner } from '../src/game/level-runner.js';
import { evaluateObjectives, objectivesMet } from '../src/game/objectives.js';
import { loadLevel } from '../src/game/level-loader.js';
import core from '../src/content/packs/core/index.js';
import dayOne from '../src/content/packs/core/act0/0.1.js';
function setup() {
  const store = createStore({ save: defaultSave(), screen: 'hub', run: null, result: null });
  const runner = createLevelRunner(store);
  runner.start(dayOne);
  runner.advanceIntro(true);
  return { store, runner };
}
function target(runner, text = dayOne.buffers[0].text) {
  const offset = text.indexOf('◆');
  runner.snapshot({ text, mode: 'normal', cursor: { offset, line: 7, column: 17 } });
}

test('reference route reaches the intended target without requiring an untaught count', () => {
  const lines = dayOne.buffers[0].text.split('\n');
  let [line, column] = dayOne.buffers[0].cursor;
  for (const key of dayOne.solution.split(':')[0]) {
    if (key === 'j') line += 1;
    else if (key === 'l') column += 1;
    else assert.fail(`Unexpected motion: ${key}`);
  }
  assert.equal(lines[line - 1][column], '◆');
});

test('arrival does not finish a wq level; completion persists only after extraction', () => {
  const { store, runner } = setup();
  runner.command('wq');
  assert.equal(store.getState().run.phase, 'playing');
  target(runner);
  assert.equal(store.getState().run.ready, true);
  assert.equal(store.getState().save.progress['0.1'].completed, false);
  runner.input(16);
  runner.command('wq');
  const state = store.getState();
  assert.equal(state.run.phase, 'outro');
  assert.equal(state.result.unscored, true);
  assert.equal(state.result.rank, 'Ghost');
  assert.equal(state.save.progress['0.1'].completed, true);
  runner.showResult();
  assert.equal(store.getState().screen, 'result');
  assert.equal(store.getState().run, null);
});

test('moving off the terminal or modifying the map prevents extraction', () => {
  const { store, runner } = setup();
  target(runner);
  runner.snapshot({
    text: dayOne.buffers[0].text,
    mode: 'normal',
    cursor: { line: 7, column: 18, offset: 1 },
  });
  assert.equal(store.getState().run.ready, false);
  runner.command('wq');
  assert.equal(store.getState().run.phase, 'playing');
  target(runner, dayOne.buffers[0].text.replace('MERIDIAN', 'ALTERED!'));
  assert.equal(store.getState().run.ready, false);
});

test('forced restart clears run state and forced quit returns to the hub without completing', () => {
  const { store, runner } = setup();
  const session = store.getState().run.session;
  runner.input(50);
  target(runner);
  runner.blocked('keys');
  runner.command('edit', true);
  const run = store.getState().run;
  assert.notEqual(run.session, session);
  assert.equal(run.phase, 'playing');
  assert.equal(run.cost, 0);
  assert.equal(run.ready, false);
  assert.deepEqual(run.blockedSeen, {});
  assert.equal(run.buffers[0].text, dayOne.buffers[0].text);
  runner.command('quit', true);
  assert.equal(store.getState().screen, 'hub');
  assert.equal(store.getState().save.progress['0.1'].completed, false);
});

test('unforced quit protects unsaved changes, then warns once before aborting', () => {
  const { store, runner } = setup();
  target(runner, `${dayOne.buffers[0].text}oops`);
  runner.command('quit');
  assert.match(store.getState().run.message, /E37/);
  runner.command('write');
  runner.command('quit');
  assert.equal(store.getState().run.quitWarned, true);
  runner.command('quit');
  assert.equal(store.getState().screen, 'hub');
});

test('Briefing cannot terminate and replay preserves the better result', () => {
  const { store, runner } = setup();
  runner.input(1000);
  target(runner);
  runner.command('wq');
  assert.equal(store.getState().result.rank, 'Intern');
  runner.start(dayOne);
  runner.input(16);
  target(runner);
  runner.command('wq');
  runner.start(dayOne);
  runner.input(50);
  target(runner);
  runner.command('wq');
  const progress = store.getState().save.progress['0.1'];
  assert.equal(progress.bestPoints, 16);
  assert.equal(progress.bestRank, 0);
});

test('all nonsticky conditions must be true together; sticky objectives latch independently', () => {
  const objectives = [
    { id: 'a', check: (s) => s.a },
    { id: 'b', check: (s) => s.b },
    { id: 'c', sticky: true, check: (s) => s.c },
  ];
  const first = evaluateObjectives(objectives, { a: true, b: false, c: true });
  const second = evaluateObjectives(objectives, { a: false, b: true, c: false }, first);
  assert.equal(objectivesMet(objectives, second), false);
  assert.equal(second.c, true);
  assert.equal(
    objectivesMet(objectives, evaluateObjectives(objectives, { a: true, b: true }, second)),
    true,
  );
  assert.equal(objectivesMet([], {}), false);
});

test('level loading uses the pack manifest and refuses unknown ids', async () => {
  assert.equal(await loadLevel([core], '0.1'), dayOne);
  await assert.rejects(loadLevel([core], 'missing'), /Unknown mission/);
});

test('automatic extraction waits for its grace period and cancels when objectives stop being true', () => {
  const callbacks = new Map();
  let nextTimer = 0;
  const store = createStore({ save: defaultSave(), screen: 'hub', run: null, result: null });
  const runner = createLevelRunner(store, {
    schedule(callback, delay) {
      assert.equal(delay, 150);
      const id = ++nextTimer;
      callbacks.set(id, callback);
      return id;
    },
    cancel(id) {
      callbacks.delete(id);
    },
  });
  const level = { ...dayOne, extract: 'auto' };
  runner.start(level);
  runner.advanceIntro(true);
  target(runner);
  assert.equal(store.getState().run.phase, 'playing');
  assert.equal(callbacks.size, 1);
  runner.snapshot({
    text: level.buffers[0].text,
    mode: 'normal',
    cursor: { offset: 0, line: 1, column: 0 },
  });
  assert.equal(callbacks.size, 0);
  target(runner);
  const timer = [...callbacks.values()][0];
  callbacks.clear();
  timer();
  assert.equal(store.getState().run.phase, 'outro');
});

test('a stale automatic extraction callback cannot complete a restarted or aborted run', () => {
  let callback;
  const store = createStore({ save: defaultSave(), screen: 'hub', run: null, result: null });
  const runner = createLevelRunner(store, {
    schedule(fn) {
      callback = fn;
      return 1;
    },
    cancel() {},
  });
  runner.start({ ...dayOne, extract: 'auto' });
  runner.advanceIntro(true);
  target(runner);
  const stale = callback;
  runner.command('edit', true);
  stale();
  assert.equal(store.getState().run.phase, 'playing');
  target(runner);
  const aborted = callback;
  runner.abort();
  aborted();
  assert.equal(store.getState().screen, 'hub');
  assert.equal(store.getState().save.progress['0.1'].completed, false);
});
