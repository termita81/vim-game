# Phase 1 — shell and core loop

Implemented on 2026-10-01. Ready for owner playtest; owner exit-criteria signoff is pending.

## What is playable

`index.html` is now the game. Developer pages remain under `tools/` and are not linked from the player's interface.

The hub shows career rank **Intern** and an unlocked **0.1 — Day One**. The level introduces hjkl and Escape/Ctrl-[, explains extraction and abort, and supplies a three-part, skippable handler briefing. Using the editor keyboard also skips the intro. Seen intros are skipped on replay.

The player starts on line 4, column 8 (one-based display), reaches the ◆ on line 7, column 18, and extracts with `:wq` and Enter. The document must match the original map, so editing the marker closer cannot bypass the objective. Objective changes are evaluated after editor changes/movement with a 50 ms debounce; ex commands flush the current snapshot before checking extraction.

The reference route `jjjllllllllll:wq<CR>` costs **16**; par is **18** (two keys of slack). The updated route and cost are covered by the Node tests; the earlier spaced map was checked through physical-key dispatch in Chromium. The level is a Briefing: run rank clamps at Intern, termination is disabled, and completion awards no career points. Full failure/scoring progression remains Phase 2.

- `:q!`: abort without completion or a penalty.
- `:e!`: fresh document, cursor, Vim state/registers, cost, overlay, and run flags. It counts as another run attempt, not a failure.
- `:w`: updates the in-memory saved document; no filesystem writes.
- `:q`: E37 for unsaved changes; otherwise completes if objectives are met, or warns once before a second `:q` aborts.
- `:hint`: basic free Briefing hints. The complete scored hint system arrives in Phase 2.

Arrows, Home/End, PageUp/PageDown, mouse cursor placement, drops, and clipboard paste are blocked inside the mission editor. Ignored navigation keys do not add cost. The first keyboard/mouse attempt in play gets a handler reaction. Buttons and settings outside the editor remain usable with mouse and normal keyboard navigation.

The HUD shows cost, rank, and Vim mode. Recent physical keys appear as keycaps for about two seconds. Replay-generated keys do not enter the physical counter. The result screen records cost, reference par, rank, and the reference route; best completion values survive replay and reload.

## UI and persistence

Green, amber, and grey themes use CSS variables. Font size, theme, key overlay, and optional non-standard jk Escape alias persist. Absolute line numbers start enabled in Day One; the existing relative-number option is supported, and its preference is stored for future levels.

At 1280+ pixels, objectives and controls sit beside the editor. At 768–1279 pixels, they become tabs beneath the editor and handler dialogue. Below 768 pixels wide or 600 pixels high, a larger-screen message appears. The compact minimum is 768×600; 1280×720 or larger is recommended. The shell keeps the footer/abort command visible while long content scrolls. Reduced motion disables animations.

Save data uses `ghostprotocol.v1` and the constitution's versioned schema. Corrupt/unsupported data is preserved until reset is confirmed. Declining reset or encountering unavailable/quota-limited storage keeps the session playable without overwriting the original data. Missions load through a pack manifest; level files import no engine internals.

## Verification performed

`npm run check`: ESLint passes and **22 Node tests pass**. Tests cover extraction gating, simultaneous/sticky objectives, restart/abort, unsaved quit guards, Briefing rank limits, reference-route cost, automatic extraction grace/cancellation, save round-trips/validation/migrations, and capture/bubble shortcut ordering.

A temporary Playwright harness exercised **Chromium 153 on Linux ARM64** against the static app. No browser-test dependencies or downloaded binaries were added to the repository. This environment blocks esm.sh, so the harness supplied the exact pinned npm package source for those URLs; this verifies app/editor integration but **does not verify CDN delivery**. A temporary monospace font was supplied for the otherwise fontless headless environment.

Observed in Chromium:

- Hub → intro → navigation → extraction → outro → result → replay.
- Original spaced-map reference route cost 16; objectives remain uncompleted until extraction.
- Disabled navigation and mouse placement leave the cursor/cost unchanged; focus remains in the editor.
- Escape and Ctrl-[ recover normal mode from insert, visual, command, and search input.
- Ctrl-r redo and Ctrl-v visual block work.
- Macro replay adds only the physical `@a` cost (2); dot adds only its physical key cost (1).
- `:e!` resets cost/state; `:q!` returns to hub; unsaved `:q` reports E37.
- Keycaps disappear after two seconds; the optional jk alias works; reduced motion removes keycap animation.
- Theme, font size, completion, and best run values survive reload.
- Corrupt-save rejection preserves the original bytes even after settings changes; acceptance resets after confirmation; inaccessible localStorage still permits play.
- Green/amber/grey rendered and line-number gutters align with document lines. Relative-number refresh, `:set nu`, and `:set nornu` were also checked.
- Viewports 1280×720, 1024×768, 820×1180, 1920×1080, and 2560×1440 showed no horizontal page overflow; sidebar tabs appeared below 1280. All S/M/L fonts were also checked at the first three sizes: no horizontal editor overflow, and the footer remained within the viewport. The smaller-screen message appeared at 767 pixels.
- No page JavaScript errors in those successful-flow checks.

## Owner playtest / pending checks

Run `python3 -m http.server 8000` and open `http://localhost:8000/` with normal internet access.

- [ ] Follow the Phase 1 playtest and smoke test in `specs/roadmap.md` using the real CDN imports.
- [ ] Confirm the handler instructions and first mission are clear and enjoyable.
- [ ] Judge all three themes and S/M/L font settings at the required sizes, including scrolling longer panels.
- [ ] Recheck the previously reported insert-mode symptom with your keyboard/browser.
- [ ] Check macOS Safari/Firefox and other supported environments; Chromium results are not a cross-browser guarantee.

Windows Ctrl-w remains deferred to the owner's later Key Lab test, as requested. Phase 1 does not implement the window manager or claim to settle that Phase 0 risk.

### Height guard follow-up

The owner reported that 922×412 was unusable. The larger-screen guard now checks height as well as width: either width below 768 or height below 600 displays the message. This is a provisional minimum for the compact layout, not a claim that 768×600 is optimal; 1280×720 or larger remains recommended. Further compression can be assessed during polish without exposing a cramped editor now.
