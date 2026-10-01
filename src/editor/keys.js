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
    const modifier = ['Control', 'Shift', 'Alt', 'Meta'].includes(event.key);
    const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    const cost = modifier ? 0 :
      mode === 'insert' && (printable || ['Enter', 'Backspace'].includes(event.key)) ? 0.5 :
      mode === 'command-line' && event.key !== 'Enter' && event.key !== 'Escape' ? 0.5 : 1;
    log(`${mode.padEnd(13)} ${event.ctrlKey ? 'Ctrl-' : ''}${event.altKey ? 'Alt-' : ''}${event.metaKey ? 'Meta-' : ''}${event.key} → ${cost}`);
    if (event.ctrlKey && ['o', 'r', 'u', 'd', 'f', '[', 'v', '6', '^'].includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
  };
  root.addEventListener('keydown', listener, true);
  return () => root.removeEventListener('keydown', listener, true);
}
