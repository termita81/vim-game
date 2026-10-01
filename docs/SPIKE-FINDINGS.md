# Phase 0 — spike findings

Implementation ready for owner playtest. **Phase 0 is not signed off:** CDN loading, real browser input, appearance, and the cross-platform matrix remain pending.

## Run

From the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/tools/spike.html` and `http://localhost:8000/tools/keylab.html`. Internet access to esm.sh is required. Key Lab has no CDN dependencies. No build, npm installation, or automated test suite is required.

## Evidence and limits

On 2026-10-01, ad hoc API probes ran against the exact pinned npm packages in a temporary directory using Node 22 and JSDOM 27. They mounted the spike code, dispatched document changes, invoked Vim commands, and inspected text, cursors, gutters, and dialogs. These are implementation checks, **not browser playtest results**; the probes and their dependencies are not part of this repository.

This execution environment is Linux ARM64 despite the workspace's macOS-style path. esm.sh requests and the Playwright browser download received network-policy 403 responses. Browser loading, native key routing, fullscreen, Keyboard Lock, layout, and Safari/Firefox behavior could not be verified here. JSDOM does not lay out text, so `hjkl` needs real-browser verification; line-address motions (`G`, `gg`) were used for API probes.

## Task decisions

✅ = observed working in the API probes; 🔧 = our implementation required; ❌ = removed from scope. Browser confirmation remains pending unless explicitly stated. No curriculum feature has been dropped.

| Roadmap task                     | Status / evidence                                                                                                                       | Chosen approach                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. CodeMirror + Vim dependencies | 🔧 Import map built and dependency closure inspected; CDN loading pending                                                               | Exact versions, `external=*` on every esm.sh module; map all transitive packages as well as CodeMirror and Vim. Mounted npm packages use one state instance. Confirm the CDN graph in browser Network tools.                                                                                                                             |
| 2. Custom `:ping`                | ✅ Returned `pong`                                                                                                                      | `Vim.defineEx('ping', 'ping', handler)`.                                                                                                                                                                                                                                                                                                 |
| 3. Programmatic keys             | ✅ Demo inserted `Programmatic replay landed.` without keydown events                                                                   | `Vim.handleKey` for commands; when an insert key is unhandled, `cm.replaceSelection` supplies text. Bare `handleKey` does not insert printable text. The demo is normal/insert only; a full command/search-line solution runner belongs in Phase 2.                                                                                      |
| 4. Registers / `:reg`            | ✅ `"fp` pasted the preloaded line; native `:reg f` displayed it                                                                        | `Vim.getRegisterController().getRegister('f').setText(text, linewise)`. Keep native `:reg`; inspection button reads the same register.                                                                                                                                                                                                   |
| 5. Marks                         | ✅ Lowercase mark followed insertion strictly above it; 🔧 mark lost after `setState`, uppercase jump from beta did not switch to alpha | Implement `src/editor/marks.js` when mark/buffer support is built. Store positions per buffer, map changes, and switch buffers for global marks. Do not rely on retained EditorState to preserve Vim plugin state. Insertion exactly at a mark's offset keeps it before inserted text; include boundary behavior in the fidelity review. |
| 6. Relative gutter               | 🔧 Implemented and observed toggling/redrawing                                                                                          | `Vim.defineOption` registers `relativenumber` / `rnu`; a per-view Compartment controls `lineNumbers`. Current line is absolute; other lines show distance. Cursor changes refresh the gutter. `:set nornu` restored absolute numbers.                                                                                                    |
| 7. Two views / undo              | ✅ Edits and undo from either view reached the other                                                                                    | Separate EditorStates; forward ChangeSets with a synchronization annotation and `addToHistory(false)`. No recursive forwarding. Each view owns its undo history; a newly opened view cannot undo another view's earlier work. Full mixed-edit stress playtest pending.                                                                   |
| 8. Capture and mode              | ✅ Capture observed normal key cost 1 and insert printable cost 0.5; 🔧 own classifier                                                  | Capture listener on workspace, classify via Vim flags or command/search input target. Physical shortcut routing and every mode transition still need browser checks. This is a diagnostic cost log, not the game scoring module.                                                                                                         |
| 9. Key Lab / Ctrl shortcuts      | 🔧 Standalone lab implemented; all physical browser results pending                                                                     | Capture raw key/code/modifiers/default prevention, attempt fullscreen + `keyboard.lock(['KeyW'])`, optional beforeunload guard, downloadable observations. A resolved lock promise alone is not proof of Ctrl-w delivery.                                                                                                                |
| 10. Ex overrides                 | ✅ `:q`, `:q!`, `:e`, `:e!`, `:w`, `:sp` dispatched to our handlers                                                                     | `defineEx` with full names and Vim abbreviations. `:sp`/`:vsp` expose the duplicate-view experiment; other commands only report interception. Mission flow and authentic quit/save semantics come later.                                                                                                                                 |

Additional probes: `ciw`, `ci"`, `dap`, `.`, macro recording/replay (`qaA!<Esc>q2G@a`), substitution, and block insertion succeeded. Block insertion required `EditorState.allowMultipleSelections.of(true)`; a three-line block received the prefix on all three lines. Buffer text and CodeMirror undo history survived swapping away and back, independently of the lost Vim marks.

## Owner playtest

- [ ] Page loads with no console errors; Network shows one version of every `@codemirror/*` module.
- [ ] Follow all eight Phase 0 playtest steps in `specs/roadmap.md`; inspect macros, repeat, text objects, block insertion, substitution, and native `:reg` using physical input.
- [ ] Mark a line, move above it, insert a line using the button, jump back; reproduce mark loss after swapping away/back. Test uppercase jump across buffers.
- [ ] Relative numbers update when moving the cursor and toggle with both short/full option names.
- [ ] Edit/undo in both views; confirm text synchronization and acceptable per-view history.
- [ ] Confirm command/search-line capture classification and modifier-only cost 0.
- [ ] All three themes readable; editor unclipped at each screen size below.

| Environment                  | Physical Ctrl-w / other shortcuts | Fullscreen + KeyW lock | beforeunload / fallback | Result  |
| ---------------------------- | --------------------------------- | ---------------------- | ----------------------- | ------- |
| macOS Chrome                 | pending                           | n/a                    | n/a                     | pending |
| macOS Safari                 | pending                           | n/a                    | n/a                     | pending |
| macOS Firefox                | pending                           | n/a                    | n/a                     | pending |
| Windows/Linux Chrome or Edge | pending                           | pending                | pending                 | pending |
| Windows/Linux Firefox        | pending                           | unsupported / confirm  | pending                 | pending |

Screen checks: 1280×720, 1920×1080, 2560×1440, 1024×768, 820×1180 — all pending. This spike wraps controls and stacks views at narrow widths; the game's final responsive shell belongs to Phase 1.

Record Key Lab observations using its notes field and download button. The Space-w alias is a game/window-manager implementation in Phase 6, not implemented in this raw input lab. Constitution 7.3 remains an **unverified strategy**; do not claim its assumptions are confirmed. If physical tests contradict it, amend that section before proceeding.

The generic game smoke test's hub, real level, progress, persistence, and abort/restart checks apply from Phase 1 onward. Here `:q!` and `:e!` intentionally report interception only.

## References

- [Vim module source and API](https://github.com/replit/codemirror-vim/tree/master/packages/codemirror-vim)
- [esm.sh import maps and external dependencies](https://esm.sh/#import-maps)
- [CodeMirror reference](https://codemirror.net/docs/ref/)

## Owner playtest feedback — 2026-10-01

The owner reports that the spike otherwise looks fine, with two outstanding items:

- **Windows Ctrl-w check deferred:** the owner will test physical Ctrl-w on Windows later. Browser shortcut behavior remains unverified there.
- **Possible insert-mode lock:** at one point the owner could not return to normal mode and appeared stuck in insert mode. The triggering sequence is unknown, so this is an open issue without a reliable reproduction. On recurrence, record the preceding commands, browser/OS, focused view or command input, and whether Escape or Ctrl-[ restores normal mode.

This feedback does not establish completion of every checkbox or environment in the matrix above. Phase 0 signoff remains pending the outstanding checks and investigation of the mode issue.

### Insert-mode investigation during Phase 1

A reproducible case was found in Chromium 153: enter insert mode in the spike, type text, then press **Ctrl-[**. The capture listener called `preventDefault()` before CodeMirror's event handlers, and CodeMirror consequently skipped Vim's Escape handling. The editor remained in insert mode.

Fixed by counting/classifying in capture but preventing browser shortcut defaults in bubble, after Vim processes them. The same correction allows Ctrl-r and Ctrl-v through. Two Node regression tests cover the ordering/cleanup contract; a Chromium check confirmed Ctrl-[ now returns the spike to normal mode. The game separately checked Escape/Ctrl-[ from insert, visual, command, and search input.

This provides a plausible explanation for the owner's symptom, but its original triggering sequence was unknown. Owner confirmation is still welcome; Windows Ctrl-w remains pending.
