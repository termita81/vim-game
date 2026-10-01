## 1. Summary

| Concern       | Choice                                                                           | Notes                                                                                                            |
| ------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Language      | JavaScript (ES2022), ES modules                                                  | No TypeScript, no transpiler                                                                                     |
| Markup/styles | One `index.html`, a few CSS files                                                | CSS custom properties for themes, CSS Grid/Flexbox for layout                                                    |
| Editor        | **CodeMirror 6** (`@codemirror/state`, `view`, `commands`, `language`, `search`) | One `EditorView` per window                                                                                      |
| Vim emulation | **`@replit/codemirror-vim`**                                                     | Provides motions, operators, text objects, registers, marks, macros, `:s`, `:g`, `Vim.handleKey`, `Vim.defineEx` |
| Delivery      | CDN via **esm.sh**, with a pinned **import map**                                 | Pinned import maps in `index.html` and the developer spike `tools/spike.html`                                    |
| Dev server    | `python3 -m http.server` (or `npx serve`)                                        | Needed because ES modules don't load from `file://`                                                              |
| Persistence   | `localStorage`                                                                   | Schema in Constitution Appendix D                                                                                |
| Audio         | None                                                                             | By design                                                                                                        |
| Tests         | Node built-in `node:test` + `node:assert/strict` for pure logic                  | Targeted behavior/regression tests; small browser suite when needed. Owner playtests and labs remain required    |
| Lint          | ESLint, flat config, recommended correctness rules                               | ES2022 modules, browser/Node globals by directory; development dependency only                                   |

## 2. Dependency rules

- **One copy of each `@codemirror/*` package.** Use an import map, and load the vim module with all `@codemirror/*` packages marked external (esm.sh `?external=...`), otherwise CodeMirror throws \"multiple instances of @codemirror/state\". Verify in Phase 0.
- Pin exact versions. No `@latest`. Phase 0 pins: `@replit/codemirror-vim` 6.4.0 and core 0.1.0; CodeMirror state 6.7.6, view 6.43.13, commands 6.11.1, language 6.12.4, search 6.7.2. The complete pinned transitive map lives in `index.html` and `tools/spike.html`; update both together.
- Phase 0 uses `?external=*&target=es2022` on **every** mapped package, not only the vim module. All external imports resolve through the same map, including Lezer and `@marijn/find-cluster-break`; this prevents transitive modules from importing another copy of CodeMirror. CDN graph verification is pending owner browser playtest; see `docs/SPIKE-FINDINGS.md`.
- If the CDN becomes a problem, vendor the files into `vendor/` and adjust the import map. No other code changes should be needed.
- No other runtime dependencies. Helpers are hand-written.
- Development tooling is allowed without changing browser delivery: Node `^22.13.0 || >=24`, npm, and pinned ESLint packages in `package.json` / `package-lock.json`. `npm ci` installs tooling only; the game still runs through a static server without a build or npm installation.

## 3. File layout

```
index.html                 shell, import map, theme attribute
css/
  base.css                 reset, layout grid, responsive rules
  themes.css               --fg, --bg, --dim, --accent, --warn per theme
  components.css           HUD, panels, keycaps, editor chrome
src/
  main.js                  bootstrap: load save, mount UI, show hub
  store.js                 single state object + subscribe(); emits events
  save.js                  localStorage, versioning, migrations
  editor/
    vim-setup.js           creates views, registers ex commands/actions, compat patches
    compat.js              Neovim-over-Vim behavior fixes (Y = y$, etc.)
    windows.js             layout tree, split/close/resize/focus, Ctrl-w family
    buffers.js             buffer list, hidden buffers, :ls/:b/:e/:bd, modified tracking
    marks.js               (only if the vim module's marks are insufficient)
    keys.js                keydown capture, cost counting, spam detection, disabled keys,
                           Ctrl-w handling, leader/alias (windowPrefix()), Keyboard Lock
    registers.js           preload registers, :reg
  game/
    level-runner.js        loads a level, runs the flow in Constitution 4.3
    objectives.js          evaluation and completion
    rules.js               rules engine (triggers, timers, s-context)
    scoring.js             cost, points, tiers, failure events, termination
    career.js              career rank
    hints.js               hint tiers and costs
    toolkit.js             unlock tracking and mastery matcher
  content/
    packs/core/            one file per level: act0/0.1.js ... plus index.js manifest
    dialogue/
      handler.js           generic handler lines
      insults/             pools.js, templates.js, contexts.js, composer.js
  ui/
    hud.js  dialogue.js  objectives-panel.js  toolkit-panel.js
    key-overlay.js  hub.js  settings.js  result-screen.js  layout.js
tools/
  spike.html               Phase 0 editor sandbox, retained for developer diagnostics
  keylab.html              prints raw key events (Ctrl-w, fullscreen lock tests)
  insult-lab.html          generates/reviews insults (Constitution App. C.5)
  (dev mode)               ?dev=1 overlay inside the game, see below
tests/                     targeted Node tests (*.test.js), added with game logic
  browser/                 editor integration tests, when justified
eslint.config.js           scoped correctness rules and environment globals
package.json               development scripts and pinned dev dependencies
package-lock.json          reproducible development tooling install
docs/
  FIDELITY.md
  SPIKE-FINDINGS.md
  CONTENT-GUIDE.md
  QUALITY.md
README.md
```

Guidelines: each file has one job. Modules communicate through `store` events and plain function calls, with no circular imports. Level files never import engine code (Constitution Appendix B).

## 4. Key technical approaches

| Topic                  | Approach                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Keystroke counting** | A capture-phase `keydown` listener on the editor root classifies physical input by the current Vim mode (normal/visual/insert/command line) and adds the weight from Constitution 5.1. Browser-default prevention runs at bubble time after Vim: preventing earlier causes CodeMirror to skip the command handler (Phase 1 reproduced the Ctrl-[ bug). Macro/`.` replays don't trigger `keydown`, so they naturally cost 0 |
| **Rule-made edits**    | Dispatched as transactions annotated `userEvent: \"rule\"` with `Transaction.addToHistory.of(false)`, ignored by the counter                                                                                                                                                                                                                                                                                               |
| **Windows**            | A tree of `{type: \"split\", dir, children, sizes}` and `{type: \"leaf\", bufferId}` nodes rendered with flexbox. Sizes in character cells (measured) so `Ctrl-w +` adjusts by one line/column                                                                                                                                                                                                                             |
| **Buffers**            | `{ id, name, text, modified, ... }` in a manager. A hidden buffer keeps its `EditorState` (including history) in memory. The same buffer in two windows is synced. Phase 0 synchronizes ChangeSets with an annotation preventing loops and excludes mirrored edits from recipient history. Accept per-window history (Constitution 10.4); local edits/undo from either view synchronized in API probes                     |
| **Marks**              | Phase 0 API probes found that local marks track edits but are lost after `setState`; uppercase marks did not switch buffers. Implement `marks.js` with per-buffer mapped positions and global buffer identities. Browser/Neovim comparison remains pending                                                                                                                                                                 |
| **Programmatic keys**  | `Vim.handleKey(cm, key)` handles one Vim command key at a time. Phase 0 demo falls back to `cm.replaceSelection` for unhandled insert text. Phase 2 Level Lab must additionally drive command/search prompts and preserve macro recording; bare `handleKey` does not type printable insert text                                                                                                                            |
| **Relative numbers**   | Phase 0: per-view Compartment and custom `lineNumbers` formatter; `Vim.defineOption` supplies `relativenumber` / `rnu`. Refresh on cursor movement; current line shows its absolute number                                                                                                                                                                                                                                 |
| **Visual block**       | Enable `EditorState.allowMultipleSelections.of(true)`; otherwise block insertion only edits one row                                                                                                                                                                                                                                                                                                                        |
| **Themes**             | `<html data-theme=\"green                                                                                                                                                                                                                                                                                                                                                                                                  | amber | grey\">` switches CSS variables. Editor styling uses variables only, with no hard-coded colors |
| **Responsive**         | `clamp()` font sizing, CSS Grid with named areas. `@media (max-width: 1279px)` tabs the side panel. `@media (max-width: 767px), (max-height: 599px)` shows the \"larger screen\" message                                                                                                                                                                                                                                   |
| **Dev mode**           | `?dev=1` adds a panel: jump to any level, show cost breakdown, force-complete/fail, run the reference solution, log rule events, reset save                                                                                                                                                                                                                                                                                |

## 5. Browser support

Latest Chrome, Edge, Firefox, and Safari on desktop. iPad Safari/Chrome with a hardware keyboard is best-effort. Fullscreen Keyboard Lock is Chromium-only, so the alias path must work everywhere (Constitution 7.3).

## 6. Conventions

2-space indent, Use single quotes consistently. JSDoc on exported functions, no `var`, no globals except the import map. Every exported function that changes state goes through `store`.

## 7. Verification

`npm run lint` checks JavaScript for common errors; `npm test` runs Node's built-in test runner; `npm run check` runs both. Tests import pure ES modules directly, so there is no transpiler, bundler, or DOM simulator required for game-logic tests. Keep pure logic separate from DOM/CodeMirror adapters.

Use deterministic cases for scoring, objectives, rules, saves/migrations, and buffer/window state. Add browser integration coverage only where actual editor behavior matters, including mode transitions and undo/mark regressions. Select and configure a browser runner when that coverage is introduced; no browser test dependency is installed yet. Native OS-reserved shortcuts, visual quality, teaching clarity, and fun remain manual checks. See `docs/QUALITY.md`.
