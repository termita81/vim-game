**Method:** targeted automated tests complement owner playtests. Use Node's built-in test runner for deterministic game logic; add a small browser integration suite when needed for editor regressions. After each phase the owner plays through the **Playtest Script** and ticks the **Exit Criteria**. Every phase starts by running the **Smoke Test**. Run lint and the relevant automated tests before phase signoff; passing checks never replace the owner's assessment of fun, fidelity, or physical browser shortcuts. See `docs/QUALITY.md` for scope and commands.

**Automated checks by phase:**

- Phase 0: lint the developer tools; preserve the manual browser matrix and the open insert-mode report. Add an editor regression test when the failure can be reproduced.
- Phase 1: test objective completion and extraction gating, abort/restart state transitions, and save round-trips/corrupt data handling.
- Phase 2: test weighted costs, replay exclusion, spam resets, rank thresholds, hints, and failure/termination boundaries.
- Phases 3-5: test rule triggers, cooldowns, non-undoable rule edits, and register/macro regressions as those systems arrive.
- Phases 6-8: test buffer/window state, synchronization, modified-buffer guards, undo persistence, and mapped marks. Physical Ctrl-w delivery stays manual.
- Phases 9-10: run the accumulated checks alongside the full playtest and cross-platform matrix.

No coverage percentage target. Test observable behavior and edge cases, not private implementation details or every panel.

**Smoke Test (5 min, every phase):**

1. Start the dev server and load the game. No console errors.
2. Play the earliest level available. Move, edit, finish.
3. Switch all three themes. Nothing illegible.
4. Type `:q!`, confirm it returns to the hub. Re-enter, type `:e!`, confirm the restart.
5. Reload the page. Progress and settings persist.

**Cross-platform matrix (run at Phases 0, 6, and 10):**

| Environment                                                                                                 | Check                                             |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| macOS Chrome/Safari/Firefox                                                                                 | Everything works, `Ctrl-w` native                 |
| Windows or Linux Chrome/Edge                                                                                | Fullscreen + Keyboard Lock makes `Ctrl-w` work    |
| Windows or Linux Firefox                                                                                    | Leader alias works, `beforeunload` prompt appears |
| Screens: 1280×720, 1920×1080, 2560×1440, 1024×768 and 820×1180 (tablet sizes via devtools or a real tablet) | Layout usable, no clipped editor                  |

---

## Phase 0: Spike and Risk Retirement

**Goal:** prove the foundations, and find what the emulation can't do before designing around it.

**Deliverables:** a minimal page with a vim-enabled editor; `tools/keylab.html`; `docs/SPIKE-FINDINGS.md`; a pinned import map.

**Tasks**

1. Load CodeMirror 6 and the vim module from esm.sh with a single copy of each `@codemirror/*` package.
2. Register a custom ex command (`:ping`) that shows a message.
3. Drive keys programmatically with `Vim.handleKey`.
4. Preload a register and read it with `\"fp`. Check whether `:reg` exists.
5. Test marks: set one, edit above it, confirm the jump follows the text. Repeat after `setState` (buffer swap). Test uppercase marks across two buffers.
6. Build a relative line-number gutter toggled by `:set rnu`/`:set nornu`.
7. Show two views on one document with changes synced. Observe undo behavior.
8. Capture keydown events in a capture-phase listener and classify by mode.
9. **Key Lab:** log `Ctrl-w`, `Ctrl-o`, `Ctrl-r`, `Ctrl-u`, `Ctrl-d`, `Ctrl-f`, `Ctrl-^`, `Ctrl-6`, `Ctrl-[`, `Ctrl-v`. Try fullscreen + `navigator.keyboard.lock([\"KeyW\"])`.
10. Check that `:sp`-style custom commands, `:q`, `:e`, and `:w` can be overridden by our own.

**Playtest script**

1. Load the spike page. Try `hjkl`, `ciw`, `ci\"`, `dap`, `Ctrl-v` + `I`, `qa…q@a`, `.`, `:%s/a/b/g`. Note anything broken.
2. Run `:ping`. Expect the message.
3. Trigger the programmatic replay button. Expect the text to appear.
4. `\"fp` pastes the preloaded text. `:reg f` shows it.
5. `ma`, add lines above, `'a`. Expect the mark to follow. Repeat after the buffer-swap button.
6. `:set rnu` shows relative numbers, `:set nornu` removes them.
7. On **macOS**, open Key Lab and press `Ctrl-w`. Expect it to be received. **On a Windows or Linux machine** (Chrome and Firefox), press `Ctrl-w` in Key Lab, normal then fullscreen + lock. Record: does the tab close? Is the event delivered?
8. Split-view test: type in one view, expect the other to update.

**Exit criteria:** `SPIKE-FINDINGS.md` lists each item as ✅ works, 🔧 needs our own implementation, or ❌ drop, with the chosen approach. Tech Stack sections 2 and 4 are updated with final versions and decisions. **If `Ctrl-w` behaves differently than assumed, Constitution 7.3 is amended before anything else.**

---

## Phase 1: Shell and Core Loop

**Goal:** a playable frame with one real level.

**Deliverables:** `index.html`, CSS (three themes, responsive), `store`, `save`, hub, HUD, dialogue panel, objectives panel, level loader, objective checker, keystroke counter, key overlay, settings. Level **0.1** playable.

**Tasks:** layout grid and themes; responsive breakpoints; level loader and runner; objective evaluation; cost counting (Constitution 5.1); disabled arrows/mouse and the handler's first reaction; key overlay with fade; `:q!` and `:e!`; `localStorage` save; footer shows `:q! = abort mission`.

**Playtest script**

1. Hub shows career rank **Intern** and Level 0.1 unlocked.
2. Start 0.1. The handler explains `:wq` and `:q!`. Move to the ◆ with `hjkl`.
3. Press an arrow key. Expect it ignored plus a handler quip. Click in the editor. Expect focus retained.
4. Watch the key overlay. Keycaps appear and fade in about 2 s.
5. Complete the level. Result screen shows cost and rank.
6. Change theme and font size. Resize the window to 1280×720, 1024×768, and 820×1180. Layout adapts, and at under 768 px the \"larger screen\" message shows.
7. Reload. Settings and completion persist.

**Exit criteria:** the smoke test passes, no layout breakage at any tested size, all three themes are acceptable.

---

## Phase 2: Scoring, Ranks, Failure, Insults, Labs

**Goal:** the full feedback loop.

**Deliverables:** scoring module, run rank, failure events, termination and restart flow, career rank, hint system, the insult composer (pools, templates, contexts, constraints, history), `tools/insult-lab.html`, dev mode (`?dev=1`), Level Lab (run `solution`, compute par), Levels **0.2 and 0.3** (with `:wq` extraction).

**Playtest script**

1. Play 0.2 and 0.3. Extraction happens only after `:wq`.
2. In a Drill-type test level (dev mode can force one), waste keystrokes. Watch the run rank decay Ghost → Shadow → Contractor → Intern → Cautionary Tale. At the last step, expect termination with an insult, a typed `:e!`, and a restart.
3. Verify typing in insert mode costs 0.5, a macro replay costs 0, `5j` resets the spam streak, and `jjjjjjjj` adds penalties.
4. Fail 5 times in a row. Expect escalating tiers, and hint and skip offers at failure 3 and 5.
5. Open the **Insult Lab**. Generate 100 samples for each tier. Read them. Check that no pair appears that breaks the style rules or the constraints (for example \"the houseplant is now a plant\"). Fix by tagging.
6. Use `:hint` three times. Expect tier 1 to 3 with cost noted (non-Briefing).
7. In dev mode, run the reference solution of a level. Expect it to finish, and par to be computed.
8. Check career rank: complete scored levels and confirm promotion text in the hub.

**Exit criteria:** ratings and costs match the Constitution table for hand-checked cases. Insult variety is acceptable (no repeat in 15 consecutive generations). Nothing in the insult pools violates section 6.2.

---

## Phase 3: Acts 1-2 (First Playable, v0.1)

**Goal:** a complete beginning of the game that's fun.

**Deliverables:** Levels **1.1-1.5, 2.1-2.5, A1**. Relative numbers (Level 1.2). Search highlighting and `:noh`. The **Watchdog** rule (first rule type, minimal rules engine core). Toolkit panel with mastery fade.

**Playtest script**

1. Play 1.1-1.5 in order. Note confusing instructions or unfair par.
2. In 1.2 the handler asks for `:set relativenumber`. Type it. Numbers switch. `5j` works using the relative numbers.
3. In 1.5 search `/`, `n`, `N`, `*`, `:noh`.
4. In 2.5 edit without saving. Expect the Watchdog to revert and the rank to drop with a handler line. Then `:w` and confirm it survives.
5. Toolkit: new commands glow, and after 5 uses dim to normal.
6. Complete Audit 1 with `:wq`. Confirm extraction.
7. Run every level's reference solution via Level Lab.
8. Try to cheat: retype text manually instead of using the taught command. Expect cost or protected regions to make it unrewarding.

**Exit criteria:** all 15 levels completed by the owner. **Owner signs off on \"fun\"**. If not fun, fix before building more. All level reference solutions run. Content checklist (Constitution 13) signed for each level.

---

## Phase 4: Rules Engine and Live Levels (Acts 3-4)

**Goal:** the text comes alive.

**Deliverables:** full rules engine (`every`/`change`/`tick`/`after`/`event`/`mode` triggers, `s` context, non-undoable rule edits), trace meter, timers and time-based scoring, tripwires, the Sysadmin NPC pattern, phases, respawn. Levels **3.1-3.4, 4.1-4.4, A2**.

**Playtest script**

1. 3.4: silence bots. Let them wake by waiting. Check that the failure event rank-drops once, not repeatedly (cooldown). Note that the wake-up edit can't be undone with `u`.
2. Confirm rule edits don't count as keystrokes and don't corrupt undo history.
3. 4.4: the Sysadmin inserts lines while you work. The cursor and marks should stay with their text.
4. Live levels show timer and trace meter. Points combine keystrokes and seconds.
5. The timer doesn't run while the intro dialogue shows.
6. Visual mode, block insert, `:s`, `:g` all behave as in Neovim (compare with real nvim if available).
7. Audit 2 extraction.

**Exit criteria:** a rule can be written in under 15 lines from the contract. No rule fires twice unintentionally. Owner signs off on the \"living text\" feel.

---

## Phase 5: Macros and Registers (Act 5)

**Deliverables:** register preloading, `:reg`, macro-in-register levels, append-to-register support. Levels **5.1-5.5**.

**Playtest script**

1. Record and replay macros with counts. A failing motion aborts the macro.
2. Handler's register `f`: `:reg f` shows it, `\"fp` pastes it.
3. `\"Ayy` appends. `:reg a` shows the accumulated text.
4. 5.5: paste the macro from `m`, edit it, yank it back with `\"myy`, run `@m`.
5. Confirm registers reset on level restart.

**Exit criteria:** all five levels playable and solvable by reference solution. Dead-drop dialogue reads naturally.

---

## Phase 6: Window Manager (Act 6)

**Deliverables:** layout tree, the full Constitution 10.2 command set, per-window status lines, Keyboard Lock and alias handling, `beforeunload` guard, layout objective checks. Levels **6.1-6.4**.

**Playtest script**

1. `:sp`, `:vsp`, `Ctrl-w s/v/n`. Verify placement (new window above/left, focused).
2. Navigate with `Ctrl-w hjkl wWptb`.
3. Resize with `Ctrl-w + - < >` (with counts), `=`, `_`, `|`, `:resize`, `:vertical resize`.
4. Close with `:q`, `:close`, `:only`, `Ctrl-w c/o`. Closing the last window follows the quit rules.
5. Window cap at 6 gives a Neovim-style error.
6. Yank in one window, paste in another.
7. **Run the Cross-platform matrix**: on Windows/Linux Chrome use fullscreen lock. On Firefox use `<Space>w…`. Confirm `beforeunload` prompts if you attempt to close the tab.
8. Check behavior at 1024×768: window status lines remain readable.

**Exit criteria:** Act 6 is playable on every matrix environment. Known undo limitation is documented (or solved).

---

## Phase 7: Buffer Manager (Act 7)

**Deliverables:** buffer list, hidden buffers, `:ls` flags, `:b`, `:bn`, `:bp`, `:e`, `:e #`, `Ctrl-^`/`Ctrl-6`, `:bd`, `:w`, `:wa`, `:wqa`, `:qa`, E37/E162 errors, cross-buffer rules. Levels **7.1-7.3**.

**Playtest script**

1. `:ls` output matches Neovim's format (flags `%`, `#`, `+`, `h`).
2. Hop between buffers. Edits persist in hidden buffers, and undo history persists per buffer.
3. `:q` with a modified hidden buffer gives E162 naming the buffer.
4. `:bd` on a modified buffer refuses, and `:bd!` forces.
5. 7.3: editing buffer A changes buffer B. The handler comments at the right moment.
6. Mixed test: buffers plus splits together.

**Exit criteria:** the buffer versus window distinction is clear in play. Owner confirms the error messages and `:ls` feel authentic.

---

## Phase 8: Marks and Jumps (Act 8)

**Deliverables:** marks that follow text, global marks across buffers, `:marks`, `:jumps`, `Ctrl-o`/`Ctrl-i`, `''`. Levels **8.1-8.3**.

**Playtest script**

1. `ma`, `'a`, `` `a ``: line versus exact position.
2. Sysadmin inserts lines above: marks follow.
3. `mA` in one buffer, `'A` from another buffer jumps across buffers.
4. `Ctrl-o`/`Ctrl-i` retrace a chain of jumps. `:jumps` lists them.
5. `'z` on an unset mark gives E20.
6. 8.3 on a 5000-line file stays smooth (no typing lag).

**Exit criteria:** performance OK on the largest level. Marks survive all rule edits and buffer swaps.

---

## Phase 9: Finale

**Deliverables:** Levels **F.1 and F.2**. The multi-phase boss, the handler's last instructions in registers `a`-`e`, and the ending sequence.

**Playtest script**

1. F.1: gauntlet requires skills from every act.
2. F.2: play through all phases: windows, buffers, marks, macros, registers. Read registers `a`-`e` in order.
3. Finish with `:wqa`. Watch the ending. Confirm the tone lands (dry, dark, a little warm).
4. Confirm career rank reacts to the final result.

**Exit criteria:** the full game is completable start to finish by the owner without dev mode.

---

## Phase 10: Polish and Release

**Tasks:** responsive and theme pass on every level; content edit for tone and typos; expand insult pools to the Appendix C targets and review them in the Insult Lab; accessibility pass (`prefers-reduced-motion`, contrast); README (how to run, how to add a level, how to add a pack); `FIDELITY.md` and `CONTENT-GUIDE.md` finalized; optional vendoring of CDN files.

**Playtest script**

1. Run the Cross-platform matrix completely.
2. Fresh-profile playthrough of Acts 0-2 by someone who knows only basic Vim (ideally not the author). Watch where they get stuck, and don't help.
3. Read all handler dialogue aloud once for tone.
4. Load with `prefers-reduced-motion` on. No animation.

**Exit criteria:** a newcomer finishes Act 2 without outside help and says it was fun. No unresolved items in `FIDELITY.md` marked \"blocking\".

---

## Risk Register

| Risk                                        | Mitigation                                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Vim module lacks a command we want to teach | Phase 0 finds it. Implement ourselves (`compat.js`), or cut it from the curriculum                       |
| `Ctrl-w` can't be captured in some browsers | Leader alias and `beforeunload` guard (Constitution 7.3)                                                 |
| Marks don't survive buffer swaps            | Own `marks.js`                                                                                           |
| Shared undo across windows is hard          | Accept per-window history, keep levels from depending on it                                              |
| Insult pool reads as repetitive or off-tone | Insult Lab review, tags/constraints, recency history, pool growth in Phase 10                            |
| CDN outage or version drift                 | Pinned versions, option to vendor                                                                        |
| Levels too hard or too easy                 | Par derived from reference solutions, generous 4× termination, mercy rule, owner playtest at every phase |
