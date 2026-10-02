import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultSave,
  readSave,
  writeSave,
  SAVE_KEY,
  migrations,
  resetJourney,
} from '../src/save.js';
function storage(initial = null) {
  let value = initial;
  return {
    getItem: (key) => {
      assert.equal(key, SAVE_KEY);
      return value;
    },
    setItem: (key, next) => {
      assert.equal(key, SAVE_KEY);
      value = next;
    },
    value: () => value,
  };
}

test('settings, completion, attempts and dialogue survive a save round-trip', () => {
  const data = defaultSave();
  data.settings.theme = 'amber';
  data.settings.fontSize = 'L';
  data.progress['0.1'] = { completed: true, attempts: 3, bestRank: 1, bestPoints: 21.5 };
  data.seen['0.1.intro'] = true;
  const target = storage();
  assert.equal(writeSave(target, data), true);
  assert.deepEqual(readSave(target), { status: 'ready', data });
});

test('corrupt, invalid and newer saves require confirmation and preserve their original bytes', () => {
  const invalidSettings = defaultSave();
  invalidSettings.settings.theme = 'invisible';
  for (const raw of [
    '{oops',
    'null',
    JSON.stringify({ version: 100 }),
    JSON.stringify(invalidSettings),
  ]) {
    const target = storage(raw);
    assert.equal(readSave(target).status, 'reset-required');
    assert.equal(target.value(), raw);
  }
});

test('storage access/quota failures leave usable in-memory defaults', () => {
  assert.equal(readSave(undefined).status, 'unavailable');
  const denied = {
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('quota');
    },
  };
  const loaded = readSave(denied);
  assert.equal(loaded.data.settings.theme, 'green');
  assert.equal(writeSave(denied, loaded.data), false);
});

test('migration applies exactly one version step and refuses malformed migration results', () => {
  const old = { ...defaultSave(), version: 0 };
  const target = storage(JSON.stringify(old));
  try {
    migrations[0] = (data) => ({ ...data, version: 1 });
    assert.equal(readSave(target).status, 'ready');
    assert.equal(JSON.parse(target.value()).version, 0);
    migrations[0] = (data) => data;
    assert.equal(readSave(target).status, 'reset-required');
  } finally {
    delete migrations[0];
  }
});

test('save defaults are independent and invalid writes do not overwrite storage', () => {
  const first = defaultSave();
  first.settings.theme = 'grey';
  assert.equal(defaultSave().settings.theme, 'green');
  const target = storage('retained');
  assert.equal(writeSave(target, {}), false);
  assert.equal(target.value(), 'retained');
});

test('journey reset clears all history, keeps preferences, and persists across reload', () => {
  const original = defaultSave();
  original.settings.theme = 'amber';
  original.settings.escAlias = 'jk';
  original.progress['0.1'] = { completed: true, attempts: 3, bestRank: 0, bestPoints: 16 };
  original.toolkit.hjkl = { uses: 5 };
  original.insultHistory = ['old'];
  original.seen['0.1.intro'] = true;
  const target = storage(JSON.stringify(original));
  const result = resetJourney(target, original);
  assert.equal(result.persisted, true);
  assert.deepEqual(result.data, { ...defaultSave(), settings: original.settings });
  assert.deepEqual(readSave(target).data, result.data);
  assert.equal(original.progress['0.1'].completed, true);
  result.data.settings.theme = 'grey';
  assert.equal(original.settings.theme, 'amber');
});

test('failed journey reset persistence preserves old storage and returns fresh session data', () => {
  const original = defaultSave();
  original.seen['0.1.intro'] = true;
  const raw = JSON.stringify(original);
  const target = {
    getItem: () => raw,
    setItem() {
      throw new Error('quota');
    },
  };
  const result = resetJourney(target, original);
  assert.equal(result.persisted, false);
  assert.deepEqual(result.data.seen, {});
  assert.equal(target.getItem(SAVE_KEY), raw);
  assert.equal(resetJourney(undefined, original).persisted, false);
});
