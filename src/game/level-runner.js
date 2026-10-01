import { evaluateObjectives, objectivesMet } from './objectives.js';
import { runRank, RANKS } from './scoring.js';

/** Run one mission, publishing all flow, progress, and cost changes through the store. */
export function createLevelRunner(store, { schedule = setTimeout, cancel = clearTimeout } = {}) {
  let session = 0;
  let autoTimer = null;
  function cancelAuto() {
    if (autoTimer !== null) cancel(autoTimer);
    autoTimer = null;
  }
  function checkAuto() {
    const { run } = store.getState();
    if (!run || run.phase !== 'playing' || run.level.extract !== 'auto' || !run.ready) {
      cancelAuto();
      return;
    }
    if (autoTimer !== null) return;
    const expectedSession = run.session;
    autoTimer = schedule(() => {
      autoTimer = null;
      const current = store.getState().run;
      if (current?.session === expectedSession && current.phase === 'playing') complete();
    }, 150);
  }
  function context(run) {
    return {
      buf(name) {
        const buffer = run.buffers.find((item) => item.name === name);
        if (!buffer) throw new Error(`Unknown buffer: ${name}`);
        return {
          text: buffer.text,
          modified: buffer.text !== buffer.savedText,
          lines: buffer.text.split('\n'),
          line: (n) => buffer.text.split('\n')[n - 1],
          matches: (re) => new RegExp(re.source, re.flags).test(buffer.text),
        };
      },
      cursor: () => run.cursor,
      mode: run.mode,
      cost: run.cost,
      keys: run.keys,
      seconds: 0,
    };
  }
  function evaluate(run) {
    const objectives = evaluateObjectives(run.level.objectives, context(run), run.objectives);
    const ready = objectivesMet(run.level.objectives, objectives);
    const message =
      ready && !run.ready
        ? run.level.extract === 'auto'
          ? 'Extraction ready. Hold position.'
          : 'Extraction ready. Type :wq and press Enter; try to keep the paperwork brief.'
        : !ready && run.ready
          ? 'You’ve moved off the terminal. Put the cursor back on ◆ before extracting.'
          : run.message;
    return { ...run, objectives, ready, message };
  }
  function updateRun(change) {
    store.update((state) => (state.run ? { ...state, run: change(state.run) } : state));
  }
  function start(level, restart = false) {
    cancelAuto();
    const state = store.getState();
    const entry = state.save.progress[level.id] || {
      attempts: 0,
      completed: false,
      bestRank: null,
      bestPoints: null,
    };
    const buffers = level.buffers.map((buffer) => ({ ...buffer, savedText: buffer.text }));
    const [line, column] = buffers[0].cursor;
    const offset =
      buffers[0].text
        .split('\n')
        .slice(0, line - 1)
        .reduce((sum, value) => sum + value.length + 1, 0) + column;
    const skip = restart || state.save.seen[`${level.id}.intro`];
    const run = evaluate({
      session: ++session,
      level,
      phase: skip ? 'playing' : 'intro',
      dialogueIndex: 0,
      buffers,
      cursor: { line, column, offset },
      mode: 'normal',
      keys: 0,
      cost: 0,
      objectives: {},
      ready: false,
      hintIndex: 0,
      quitWarned: false,
      blockedSeen: {},
      message: restart
        ? 'Fresh start. The paperwork has been discreetly replaced.'
        : level.dialogue.intro[0],
    });
    if (skip && !restart)
      run.message = 'Back at reception. Reach the ◆, then :wq and Enter to extract.';
    store.update((current) => ({
      ...current,
      screen: 'mission',
      result: null,
      run,
      save: {
        ...current.save,
        progress: {
          ...current.save.progress,
          [level.id]: { ...entry, attempts: entry.attempts + 1 },
        },
      },
    }));
    checkAuto();
  }
  function advanceIntro(skip = false) {
    const { run } = store.getState();
    if (!run || run.phase !== 'intro') return;
    if (!skip && run.dialogueIndex + 1 < run.level.dialogue.intro.length) {
      updateRun((current) => ({
        ...current,
        dialogueIndex: current.dialogueIndex + 1,
        message: current.level.dialogue.intro[current.dialogueIndex + 1],
      }));
      return;
    }
    store.update((state) => ({
      ...state,
      run: {
        ...state.run,
        phase: 'playing',
        message: 'Reach the ◆ using hjkl. :wq and Enter extracts; :q! and Enter aborts.',
      },
      save: { ...state.save, seen: { ...state.save.seen, [`${run.level.id}.intro`]: true } },
    }));
    checkAuto();
  }
  function snapshot(value) {
    const { run } = store.getState();
    if (!run || run.phase !== 'playing') return;
    updateRun((current) =>
      evaluate({
        ...current,
        cursor: value.cursor,
        mode: value.mode,
        buffers: current.buffers.map((buffer, i) =>
          i === 0 ? { ...buffer, text: value.text } : buffer,
        ),
      }),
    );
    checkAuto();
  }
  function input(cost, mode) {
    if (store.getState().run?.phase !== 'playing') return;
    updateRun((run) => ({
      ...run,
      mode: mode || run.mode,
      cost: run.cost + cost,
      keys: run.keys + (cost > 0 ? 1 : 0),
    }));
  }
  function say(message) {
    updateRun((run) => ({ ...run, message }));
  }
  function blocked(kind) {
    const { run } = store.getState();
    if (!run || run.phase !== 'playing' || run.blockedSeen[kind]) return;
    updateRun((current) => ({
      ...current,
      blockedSeen: { ...current.blockedSeen, [kind]: true },
      message:
        kind === 'mouse'
          ? 'The mouse isn’t on the payroll. Keep your hands on hjkl.'
          : 'Arrow keys leave a trail. Use hjkl; the office fern is watching.',
    }));
  }
  function abort() {
    cancelAuto();
    store.update((state) => ({ ...state, screen: 'hub', run: null, result: null }));
  }
  function complete() {
    const state = store.getState();
    if (!state.run || state.run.phase !== 'playing') return false;
    cancelAuto();
    const run = evaluate(state.run);
    if (!run.ready) {
      say('The terminal is still waiting. Reach the ◆ with the map intact, then :wq and Enter.');
      return false;
    }
    const rankIndex = runRank(run.cost, run.level.par.keys, run.level.type);
    const result = {
      levelId: run.level.id,
      title: run.level.title,
      cost: run.cost,
      par: run.level.par.keys,
      rankIndex,
      rank: RANKS[rankIndex],
      unscored: run.level.type === 'briefing',
      solution: run.level.solution,
    };
    const previous = state.save.progress[run.level.id];
    store.update((current) => ({
      ...current,
      result,
      run: { ...run, phase: 'outro', message: run.level.dialogue.outro[0] },
      save: {
        ...current.save,
        progress: {
          ...current.save.progress,
          [run.level.id]: {
            ...previous,
            completed: true,
            bestRank:
              previous.bestRank === null ? rankIndex : Math.min(previous.bestRank, rankIndex),
            bestPoints:
              previous.bestPoints === null ? run.cost : Math.min(previous.bestPoints, run.cost),
          },
        },
      },
    }));
    return true;
  }
  function command(name, force = false) {
    const { run } = store.getState();
    if (!run || run.phase !== 'playing') return;
    if (name === 'quit' && force) {
      abort();
      return;
    }
    if (name === 'edit' && force) {
      start(run.level, true);
      return;
    }
    if (name === 'hint') {
      say(run.level.hints[Math.min(run.hintIndex, 2)]);
      updateRun((current) => ({ ...current, hintIndex: current.hintIndex + 1 }));
      return;
    }
    if (name === 'write' || name === 'wq') {
      updateRun((current) =>
        evaluate({
          ...current,
          buffers: current.buffers.map((buffer) => ({ ...buffer, savedText: buffer.text })),
        }),
      );
      if (name === 'wq') complete();
      else say(`"${run.buffers[0].name}" written. The filing cabinet sends its regards.`);
      return;
    }
    if (name === 'quit') {
      if (run.buffers.some((buffer) => buffer.text !== buffer.savedText)) {
        say('E37: No write since last change (add ! to override)');
        return;
      }
      if (evaluate(run).ready) {
        complete();
        return;
      }
      if (!run.quitWarned) {
        updateRun((current) => ({
          ...current,
          quitWarned: true,
          message:
            'Objectives aren’t complete; :q again will abort. :q! aborts immediately, with no penalty.',
        }));
      } else abort();
      return;
    }
    if (name === 'edit') say('Use :e! to restart this mission from a fresh state.');
  }
  function showResult() {
    if (store.getState().run?.phase === 'outro')
      store.update((state) => ({ ...state, screen: 'result', run: null }));
  }
  return { start, advanceIntro, snapshot, input, blocked, command, abort, showResult, say };
}
