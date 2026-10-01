import { createStore } from './store.js';
import { readSave, writeSave } from './save.js';
import { createLevelRunner } from './game/level-runner.js';
import { loadLevel } from './game/level-loader.js';
import core from './content/packs/core/index.js';
import { element } from './ui/dom.js';
import { renderHub } from './ui/hub.js';
import { mountHud } from './ui/hud.js';
import { mountDialogue } from './ui/dialogue.js';
import { mountObjectives } from './ui/objectives-panel.js';
import { keyOverlay } from './ui/key-overlay.js';
import { mountSettings } from './ui/settings.js';
import { renderResult } from './ui/result-screen.js';

const stage = document.getElementById('stage');
const notice = document.getElementById('notice');
let storage;
try {
  storage = window.localStorage;
} catch {
  /* Unavailable storage is handled below. */
}
const saved = readSave(storage);
let persist = saved.status === 'ready';
let message =
  saved.status === 'unavailable'
    ? 'Storage is unavailable. You can play, but this session’s progress and settings won’t persist.'
    : '';
if (saved.status === 'reset-required') {
  persist = window.confirm(
    'Your saved Ghost Protocol data is corrupt or uses an unsupported version. Reset it? Cancel keeps the original data and plays without saving.',
  );
  if (persist) {
    persist = writeSave(storage, saved.data);
    message = persist
      ? 'Saved data was reset with your confirmation.'
      : 'Storage could not be written. This session won’t be saved.';
  } else message = 'Original save retained. You’re playing without saving this session.';
}
const store = createStore({
  screen: 'hub',
  save: saved.data,
  run: null,
  result: null,
  notice: message,
  loading: false,
});
const runner = createLevelRunner(store);
let editor;
let editorFactory;
let missionUI;
let screen;
let mountedSession;
let phase;
let previousSave = saved.data;
let previousSettings;
let loadRequest = 0;

function cleanupMission() {
  editor?.destroy();
  missionUI?.overlay.destroy();
  editor = null;
  missionUI = null;
  mountedSession = null;
  phase = null;
}
async function start(id) {
  if (store.getState().loading) return;
  const request = ++loadRequest;
  store.update((state) => ({ ...state, loading: true, notice: persist ? '' : state.notice }));
  try {
    const [level, module] = await Promise.all([
      loadLevel([core], id),
      import('./editor/vim-setup.js'),
    ]);
    if (request !== loadRequest) return;
    editorFactory = module.createGameEditor;
    store.update((state) => ({ ...state, loading: false }));
    runner.start(level);
  } catch (error) {
    store.update((state) => ({
      ...state,
      loading: false,
      notice:
        'The mission editor couldn’t load. Check your connection to esm.sh, then reload this page.',
    }));
    console.error('Mission load failed', error);
  }
}
function mountMission(run) {
  cleanupMission();
  mountedSession = run.session;
  const mission = element('section', 'mission');
  mission.setAttribute('aria-label', `${run.level.title} mission`);
  const grid = element('div', 'mission-grid');
  const hud = mountHud(grid);
  const workspace = element('section', 'editor-shell');
  const chrome = element('div', 'editor-chrome');
  chrome.append(
    element('span', '', run.buffers[0].name),
    element('span', 'file-status', 'VIM / CONNECTED'),
  );
  const mount = element('div', 'editor-mount');
  const status = element('div', 'editor-status');
  workspace.append(chrome, mount, status);
  grid.append(workspace);
  const objectives = mountObjectives(grid, run.level);
  const dialogue = mountDialogue(grid, {
    next: () =>
      store.getState().run?.phase === 'outro' ? runner.showResult() : runner.advanceIntro(),
    skip: () => runner.advanceIntro(true),
  });
  const overlay = keyOverlay(workspace);
  mission.append(grid);
  stage.replaceChildren(mission);
  missionUI = { hud, objectives, dialogue, overlay, status };
  const initialSettings = {
    ...store.getState().save.settings,
    relativeNumber:
      run.level.settings.relativeNumber ?? store.getState().save.settings.relativeNumber,
  };
  editor = editorFactory(
    mount,
    run.buffers[0],
    {
      active: () => store.getState().run?.phase !== 'outro',
      snapshot: runner.snapshot,
      input(cost, label, mode) {
        if (store.getState().run?.phase === 'intro') runner.advanceIntro(true);
        runner.input(cost, mode);
        if (store.getState().save.settings.keyOverlay) overlay.push(label);
      },
      blocked: runner.blocked,
      command: runner.command,
      say: runner.say,
      mode(mode) {
        store.update((state) => (state.run ? { ...state, run: { ...state.run, mode } } : state));
      },
      relative(value) {
        store.update((state) => ({
          ...state,
          save: { ...state.save, settings: { ...state.save.settings, relativeNumber: value } },
        }));
      },
    },
    initialSettings,
  );
}
function render(state) {
  if (state.save !== previousSave) {
    previousSave = state.save;
    if (persist && !writeSave(storage, state.save)) {
      persist = false;
      queueMicrotask(() =>
        store.update((current) => ({
          ...current,
          notice:
            'Saving failed. You can keep playing, but new progress and settings won’t persist.',
        })),
      );
    }
  }
  if (state.save.settings !== previousSettings) {
    previousSettings = state.save.settings;
    document.documentElement.dataset.theme = previousSettings.theme;
    document.documentElement.dataset.fontSize = previousSettings.fontSize;
    editor?.settings(previousSettings);
    if (!previousSettings.keyOverlay) missionUI?.overlay.clear();
  }
  notice.textContent = state.notice;
  notice.hidden = !state.notice;
  document.getElementById('connection').textContent = state.loading
    ? 'CONNECTING…'
    : 'SECURE CHANNEL';
  const missionHeading = document.getElementById('mission-heading');
  missionHeading.hidden = state.screen !== 'mission';
  if (state.screen === 'mission') {
    document.getElementById('mission-act').textContent = `ACT ${state.run.level.act} / ONBOARDING`;
    document.getElementById('mission-title').textContent =
      `${state.run.level.id} / ${state.run.level.title}`;
  }
  if (state.screen === 'hub') {
    if (screen !== 'hub') cleanupMission();
    renderHub(stage, core, state.save, start);
    stage.querySelector('.primary-button').disabled = state.loading;
  } else if (state.screen === 'mission') {
    if (mountedSession !== state.run.session) mountMission(state.run);
    missionUI.hud(state.run);
    missionUI.objectives(state.run);
    missionUI.dialogue.update(state.run);
    const modified = state.run.buffers[0].text !== state.run.buffers[0].savedText;
    missionUI.status.textContent = `${state.run.mode.toUpperCase()}${modified ? ' · MODIFIED' : ''}  /  ${state.run.cursor.line}:${state.run.cursor.column + 1}`;
    if (phase !== state.run.phase) {
      phase = state.run.phase;
      if (phase === 'outro') editor.freeze();
      if (phase === 'playing') editor.focus();
      else missionUI.dialogue.focus();
    }
  } else if (state.screen === 'result' && screen !== 'result') {
    cleanupMission();
    renderResult(stage, state.result, {
      hub: runner.abort,
      replay: () => start(state.result.levelId),
    });
  }
  screen = state.screen;
}
store.subscribe(render);
const openSettings = mountSettings(document.getElementById('settings'), store, () => {
  if (store.getState().run?.phase === 'playing') editor?.focus();
});
document.getElementById('open-settings').addEventListener('click', openSettings);
render(store.getState());
