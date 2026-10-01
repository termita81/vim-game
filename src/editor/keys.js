import { keyCost } from '../game/keystrokes.js';

/** Classify physical input before Vim handles it, including its command-line panel. */
export function inputMode(cm, target) {
  if (target.closest?.('.cm-panel input')) return 'command-line';
  const state = cm.state.vim;
  if (state?.insertMode) return 'insert';
  if (state?.visualMode) return state.visualBlock ? 'visual-block' : 'visual';
  return 'normal';
}

/** Observe physical keys. Replayed keys never produce browser keydown events. */
export function captureKeys(root, getEditor, log) {
  const listener = (event) => {
    const cm = getEditor(event.target);
    if (!cm) return;
    const mode = inputMode(cm, event.target);
    const cost = keyCost(event, mode);
    log(`${mode.padEnd(13)} ${event.ctrlKey ? 'Ctrl-' : ''}${event.altKey ? 'Alt-' : ''}${event.metaKey ? 'Meta-' : ''}${event.key} → ${cost}`);
  };
  // CodeMirror skips its handlers when defaultPrevented is already true.
  // Count before Vim, but cancel browser defaults only after Vim has run.
  const preventShortcuts = (event) => {
    if (getEditor(event.target) && event.ctrlKey && ['o', 'r', 'u', 'd', 'f', '[', 'v', '6', '^'].includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
  };
  root.addEventListener('keydown', listener, true);
  root.addEventListener('keydown', preventShortcuts);
  return () => {
    root.removeEventListener('keydown', listener, true);
    root.removeEventListener('keydown', preventShortcuts);
  };
}
