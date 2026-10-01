import { EditorState, Annotation, Transaction } from '@codemirror/state';
import { EditorView, drawSelection, highlightActiveLineGutter } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { vim, Vim, getCM } from '@replit/codemirror-vim';
import { relativeNumbers } from './editor/relative-numbers.js';
import { captureKeys } from './editor/keys.js';

const fixture =
  'alpha bravo charlie\naccess = "pending"\nzone = (internal)\n\nA paragraph for deletion.\nIt has two lines.\n\ncolumn one\ncolumn two\ncolumn three\n';
const buffers = [
  { name: 'alpha.txt', initial: fixture, state: null },
  {
    name: 'beta.txt',
    initial:
      'beta server\nUppercase marks should cross buffers.\nDifferent text, independent history.\n',
    state: null,
  },
];
const synced = Annotation.define();
const controllers = new Map();
let active = 0;
let second = null;
const $ = (id) => document.getElementById(id);
const logLines = [];
function log(message) {
  logLines.unshift(`${new Date().toLocaleTimeString()} ${message}`);
  $('events').textContent = logLines.slice(0, 100).join('\n');
}
function say(message) {
  $('status').textContent = message;
  log(message);
}

function makeState(text, numbers) {
  return EditorState.create({
    doc: text,
    extensions: [
      vim(),
      history(),
      EditorView.darkTheme.of(true),
      EditorState.allowMultipleSelections.of(true),
      drawSelection(),
      highlightActiveLineGutter(),
      numbers.extension,
      EditorView.updateListener.of((update) => {
        if (update.selectionSet) {
          // lineNumbers caches markers; explicitly reconfigure for relative cursor changes.
          if (numbers.enabled)
            queueMicrotask(() => {
              if (controllers.has(update.view)) numbers.set(update.view, true);
            });
        }
        if (!update.docChanged) return;
        if (update.transactions.some((tr) => tr.annotation(synced))) return;
        const other = update.view === primary ? second : primary;
        if (other)
          other.dispatch({
            changes: update.changes,
            annotations: [synced.of(true), Transaction.addToHistory.of(false)],
          });
        log(`Document changed in ${update.view === primary ? 'primary' : 'secondary'} view`);
      }),
    ],
  });
}

Vim.defineOption('relativenumber', false, 'boolean', ['rnu'], (value, cm) => {
  if (!cm) return false;
  const numbers = controllers.get(cm.cm6);
  if (value === undefined) return numbers?.enabled ?? false;
  numbers?.set(cm.cm6, value);
});
Vim.defineEx('ping', 'ping', () => say('pong — custom ex command received'));
for (const [name, prefix] of [
  ['write', 'w'],
  ['quit', 'q'],
  ['edit', 'e'],
]) {
  Vim.defineEx(name, prefix, (cm, params) =>
    say(`Intercepted :${name}${params.argString || ''} (spike only)`),
  );
}
Vim.defineEx('split', 'sp', () => showSecond());
Vim.defineEx('vsplit', 'vsp', () => showSecond());

function observeMode(view) {
  getCM(view).on('vim-mode-change', (event) => say(`Mode: ${event.mode}`));
}

function createView(parent, state, numbers) {
  const view = new EditorView({ state, parent });
  controllers.set(view, numbers);
  observeMode(view);
  return view;
}
const numbers = relativeNumbers();
const primary = createView($('editor'), makeState(fixture, numbers), numbers);
buffers[0].state = primary.state;

function hideSecond() {
  if (!second) return;
  controllers.delete(second);
  second.destroy();
  second = null;
  $('secondary').remove();
  $('split').textContent = 'Show second view';
}
function showSecond() {
  if (second) {
    hideSecond();
    primary.focus();
    return;
  }
  const host = document.createElement('article');
  host.id = 'secondary';
  const title = document.createElement('h2');
  title.textContent = `${buffers[active].name} · second view`;
  const mount = document.createElement('div');
  host.append(title, mount);
  $('workspace').append(host);
  const otherNumbers = relativeNumbers();
  second = createView(mount, makeState(primary.state.doc.toString(), otherNumbers), otherNumbers);
  $('split').textContent = 'Hide second view';
  say('Shared text; each view has its own history. Try editing and undoing in each.');
  second.focus();
}
function preloadRegister() {
  Vim.getRegisterController().getRegister('f').setText('Dead drop: the ghost is silent.\n', true);
}
/** Replay Vim notation one key at a time; this deliberately bypasses physical key counting. */
function replay(keys) {
  const cm = getCM(primary);
  for (const key of keys.match(/<[^>]+>|[\s\S]/g) || []) {
    const wasInsert = cm.state.vim?.insertMode;
    const handled = Vim.handleKey(cm, key);
    if (!handled && wasInsert && cm.state.vim?.insertMode) {
      if (key.length === 1) cm.replaceSelection(key);
      else if (key === '<Space>') cm.replaceSelection(' ');
      else if (key === '<CR>') cm.replaceSelection('\n');
    }
  }
  primary.focus();
}
$('replay').onclick = () => {
  replay('<Esc>GoProgrammatic replay landed.<Esc>');
  say('Replay complete. No physical keydown events were generated.');
};
$('swap').onclick = () => {
  hideSecond();
  buffers[active].state = primary.state;
  active = 1 - active;
  primary.setState(buffers[active].state || makeState(buffers[active].initial, numbers));
  observeMode(primary);
  $('buffer-label').textContent = buffers[active].name;
  say(`setState → ${buffers[active].name}; test marks and undo after swapping back`);
  primary.focus();
};
$('split').onclick = showSecond;
$('above').onclick = () => {
  const from = primary.state.doc.lineAt(primary.state.selection.main.head).from;
  primary.dispatch({ changes: { from, insert: 'Inserted above the cursor.\n' } });
  primary.focus();
};
$('register').onclick = () => {
  say(`Register f: ${JSON.stringify(Vim.getRegisterController().getRegister('f').toString())}`);
  primary.focus();
};
$('reset').onclick = () => {
  hideSecond();
  Vim.resetVimGlobalState_();
  buffers.forEach((buffer) => {
    buffer.state = null;
  });
  active = 0;
  primary.setState(makeState(fixture, numbers));
  observeMode(primary);
  numbers.set(primary, false);
  $('buffer-label').textContent = buffers[active].name;
  preloadRegister();
  say('Fixtures, history, marks, and registers reset.');
  primary.focus();
};
$('clear').onclick = () => {
  logLines.length = 0;
  $('events').textContent = '';
};
$('theme').onchange = (event) => {
  document.documentElement.dataset.theme = event.target.value;
};
captureKeys(
  $('workspace'),
  (target) => {
    const view = [...controllers.keys()].find((item) => item.dom.contains(target));
    return view ? getCM(view) : null;
  },
  log,
);
preloadRegister();
say('Ready — Vim enabled. Register f preloaded.');
primary.focus();
