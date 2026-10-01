import { Vim } from '@replit/codemirror-vim';
import { inputMode } from './keys.js';
import { keyCost, keyLabel } from '../game/keystrokes.js';

const disabled = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

/** Capture player input without changing Vim's normal text/command handling. */
export function gameInput(view, cm, callbacks) {
  const root = view.dom;
  const generatedEscapes = new WeakSet();
  function focus() {
    const prompt = cm.state.dialog?.querySelector('input');
    if (prompt) prompt.focus();
    else view.focus();
  }
  function keydown(event) {
    if (generatedEscapes.has(event)) return;
    if (!callbacks.active()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (disabled.has(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      callbacks.blocked('keys');
      return;
    }
    const mode = inputMode(cm, event.target);
    const label = keyLabel(event);
    if (label) callbacks.input(keyCost(event, mode), label, mode);
    const escape = event.key === 'Escape' || (event.ctrlKey && event.key === '[');
    if (escape) {
      event.preventDefault();
      event.stopPropagation();
      const prompt = cm.state.dialog?.querySelector('input');
      if (prompt) {
        const replacement = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          bubbles: true,
        });
        generatedEscapes.add(replacement);
        prompt.dispatchEvent(replacement);
      } else {
        Vim.handleKey(cm, '<Esc>');
        focus();
      }
      callbacks.changed();
      return;
    }
    callbacks.changed();
  }
  // Prevent browser defaults at bubble time, after CodeMirror's input handlers.
  function preventShortcuts(event) {
    if (event.ctrlKey && ['o', 'r', 'u', 'd', 'f', 'v', '6', '^'].includes(event.key.toLowerCase()))
      event.preventDefault();
  }
  function pointer(event) {
    event.preventDefault();
    event.stopPropagation();
    if (callbacks.active()) callbacks.blocked('mouse');
    focus();
  }
  function prevent(event) {
    event.preventDefault();
  }
  root.addEventListener('keydown', keydown, true);
  root.addEventListener('keydown', preventShortcuts);
  root.addEventListener('pointerdown', pointer, true);
  root.addEventListener('mousedown', pointer, true);
  root.addEventListener('contextmenu', prevent);
  root.addEventListener('drop', prevent);
  root.addEventListener('paste', prevent);
  return () => {
    root.removeEventListener('keydown', keydown, true);
    root.removeEventListener('keydown', preventShortcuts);
    root.removeEventListener('pointerdown', pointer, true);
    root.removeEventListener('mousedown', pointer, true);
    root.removeEventListener('contextmenu', prevent);
    root.removeEventListener('drop', prevent);
    root.removeEventListener('paste', prevent);
  };
}
