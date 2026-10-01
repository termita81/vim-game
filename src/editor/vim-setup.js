import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, drawSelection, highlightActiveLineGutter, keymap } from '@codemirror/view';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { vim, Vim, getCM } from '@replit/codemirror-vim';
import { relativeNumbers } from './relative-numbers.js';
import { gameInput } from './game-input.js';
import { inputMode } from './keys.js';

const editors = new WeakMap();
for (const [name, prefix] of [
  ['write', 'w'],
  ['quit', 'q'],
  ['edit', 'e'],
  ['wq', 'wq'],
  ['hint', 'hint'],
]) {
  Vim.defineEx(name, prefix, (cm, params) => {
    const owner = editors.get(cm.cm6);
    if (!owner) return;
    const argument = (params.argString || '').trim();
    if (argument && argument !== '!') {
      owner.say('This mission uses its assigned file; omit the filename.');
      return;
    }
    owner.command(name, argument === '!');
  });
}
Vim.defineOption('relativenumber', false, 'boolean', ['rnu'], (value, cm) => {
  const owner = cm && editors.get(cm.cm6);
  if (value === undefined) return owner?.relative ?? false;
  owner?.setRelative(value);
});
Vim.defineOption('number', true, 'boolean', ['nu'], (value, cm) => {
  const owner = cm && editors.get(cm.cm6);
  if (value === undefined) return owner?.number ?? true;
  owner?.setNumber(value);
});
Vim.map('Y', 'y$', 'normal');

/** Mount a Vim editor; return a small adapter with explicit lifecycle cleanup. */
export function createGameEditor(parent, buffer, callbacks, settings) {
  Vim.resetVimGlobalState_();
  const numbers = relativeNumbers();
  const editable = new Compartment();
  const [line, column] = buffer.cursor;
  const offset =
    buffer.text
      .split('\n')
      .slice(0, line - 1)
      .reduce((sum, text) => sum + text.length + 1, 0) + column;
  let timer;
  let destroyed = false;
  let relative = settings.relativeNumber;
  let number = true;
  function snapshot() {
    const pos = view.state.selection.main.head;
    const currentLine = view.state.doc.lineAt(pos);
    return {
      text: view.state.doc.toString(),
      cursor: { offset: pos, line: currentLine.number, column: pos - currentLine.from },
      mode: inputMode(getCM(view), document.activeElement),
    };
  }
  function changed() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!destroyed) callbacks.snapshot(snapshot());
    }, 50);
  }
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: buffer.text,
      selection: { anchor: offset },
      extensions: [
        vim(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        history(),
        drawSelection(),
        EditorView.darkTheme.of(true),
        EditorState.allowMultipleSelections.of(true),
        highlightActiveLineGutter(),
        numbers.extension,
        editable.of(EditorView.editable.of(true)),
        EditorView.contentAttributes.of({
          'aria-label': `${buffer.name} — Vim mission editor`,
          spellcheck: 'false',
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged || update.selectionSet) changed();
          if (update.selectionSet && numbers.enabled)
            queueMicrotask(() => {
              if (!destroyed) numbers.set(view, true);
            });
        }),
      ],
    }),
  });
  const cm = getCM(view);
  const modeChanged = () => {
    callbacks.mode(inputMode(cm, document.activeElement));
    changed();
  };
  cm.on('vim-mode-change', modeChanged);
  const cleanupInput = gameInput(view, cm, { ...callbacks, changed });
  const owner = {
    command(name, force) {
      // Ex callbacks execute while Vim is closing its prompt; destroy after that unwinds.
      queueMicrotask(() => {
        if (!destroyed) {
          callbacks.snapshot(snapshot());
          callbacks.command(name, force);
        }
      });
    },
    say: callbacks.say,
    get relative() {
      return relative;
    },
    get number() {
      return number;
    },
    setRelative(value) {
      relative = value;
      numbers.set(view, value);
      callbacks.relative(value);
    },
    setNumber(value) {
      number = value;
      numbers.show(view, value);
    },
  };
  editors.set(view, owner);
  numbers.set(view, relative);
  function applySettings(next) {
    if (next.escAlias === 'jk') Vim.map('jk', '<Esc>', 'insert');
    else Vim.unmap('jk', 'insert');
  }
  applySettings(settings);
  return {
    snapshot,
    focus() {
      (cm.state.dialog?.querySelector('input') || view.contentDOM).focus();
    },
    settings: applySettings,
    freeze() {
      view.dispatch({ effects: editable.reconfigure(EditorView.editable.of(false)) });
    },
    destroy() {
      destroyed = true;
      clearTimeout(timer);
      cleanupInput();
      cm.off('vim-mode-change', modeChanged);
      editors.delete(view);
      view.destroy();
    },
  };
}
