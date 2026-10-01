## 1. Purpose

**Ghost Protocol** is a browser game that teaches Vim/Neovim through play. The player is a freelance intruder inside a corporation's servers. The only tool they have is a Vim prompt, and every mission is a text-editing problem. A sarcastic handler named **`:wq`** guides them.

The target player knows VSCode, has only basic Vim knowledge, and needs **muscle memory**, not trivia. If the game isn't fun, the player goes back to VSCode, so fun is a hard requirement.

## 2. Pillars

1. **Learn by doing.** The handler explains in one or two sentences, then the player acts. Nothing is a multiple-choice quiz.
2. **Muscle memory.** Drills repeat motions under light pressure, and Audits bring old skills back (spaced repetition).
3. **The text is alive.** Buffers are terrain, enemies, and puzzles. They change while the player works.
4. **Failure is funny, never humiliating.** Insults target keystrokes and decisions, never the person.
5. **Silent.** No audio, ever. A ghost is silent. No flashing effects either.
6. **Fidelity.** What the game teaches must work the same in real Neovim (section 8).
7. **Fundamentals before flourish.** Structure comes first, because a solid engine makes creative levels cheap.

## 3. Glossary

| Term | Meaning |
|---|---|
| **Handler** | The narrator, `:wq`. He talks in the dialogue panel |
| **Run** | One attempt at a level |
| **Cost** | Weighted keystroke total (section 5.1) |
| **Points** | Cost, plus seconds ÷ 2 on live levels |
| **Par** | The points a skilled player needs (section 5.2) |
| **Run rank** | Rating for the current run, decaying from Ghost |
| **Career rank** | The player's overall title, starting at Intern |
| **Briefing / Drill / Job / Audit** | Level types (section 4) |
| **Live level** | A level with timers, and rules that change the text over time |
| **Rule** | A scripted behavior that reacts to changes, keys, or time |
| **Toolkit** | The panel listing unlocked commands |
| **Extraction** | Finishing a level by `:wq` (or automatically) |
| **Pack** | A bundle of levels plus its command unlocks |
| **Dead drop** | A register preloaded with content |
| **Beacon** | A mark |

**Rule on metaphor:** story names may decorate, but the real Vim term must appear at first mention (\"a second terminal, that is, a *split*\"). Metaphor never replaces the real term.

## 4. Game Structure

### 4.1 Level types

| Type | Purpose | Rules |
|---|---|---|
| **Briefing** | Introduces 1-2 commands | Guided, hints free, **unscored** (shows a rank but awards no career points), **can't be terminated**, no failure events |
| **Drill** | Muscle memory | Short, par-scored, can be terminated |
| **Job** | Story mission with a twist | Mixes new and old skills. Often a live level |
| **Audit** | Spaced repetition in disguise (\"Mandatory Compliance Training\") | Mixed skills, requires `:wq` extraction |

### 4.2 Acts and length

The full game is 40 levels in 9 acts (Appendix A), about 2 hours of play, with levels of 1-3 minutes. We ship in slices (Roadmap). New content arrives as **packs** (section 13).

### 4.3 Level flow

1. Level loads, handler intro plays (skippable).
2. The player plays: objectives, HUD, keystroke counting.
3. When all objectives are true at once:
   - `extract: \"auto\"`: the level ends after a short grace delay.
   - `extract: \"wq\"` (Act 0, Audits, the boss): the handler says \"extraction ready\" and the level ends when the player runs `:wq`. This deliberately teaches the habit.
4. Outro plays, the result screen shows cost, par, rank, and the handler's reaction. Next level or hub.

### 4.4 Escape hatches (always present)

| Command | Effect |
|---|---|
| `:q!` | **Abort mission** to the hub. No penalty. Permanently shown in the footer and explained in Level 0.1 |
| `:e!` | **Restart** the level voluntarily (fresh state). Not a failure; the handler says \"fresh start\" |
| `:hint` | Next hint (section 9) |
| `:q` | Behaves as in Vim: refuses if the buffer has unsaved changes (\"E37: No write since last change\"). On the last window it ends the level if objectives are met, otherwise acts as `:q!` after the handler warns once |

## 5. Scoring, Ranks, Failure

### 5.1 Cost (weighted keystrokes)

| Input | Cost |
|---|---|
| Any normal/visual-mode key, `Esc`, `Enter`, `:`/`/`/`?` to open a command line | **1.0** |
| Printable characters typed in **insert mode**, plus `Enter`/`Backspace` in insert | **0.5** each |
| Text typed on the command line or search line (after the opening `:`/`/`) | **0.5** each, with the closing `Enter` costing 1.0 |
| Modifier-only presses (`Ctrl`, `Shift`, `Alt`) | 0 |
| Keys replayed by a macro or `.` | 0 (only the keys you actually pressed count, which is why macros are rewarded) |
| Hint tier 2 or 3 used (Drills/Jobs/Audits) | +5 |
| **Spam penalty** (Drills/Jobs/Audits; configurable per level) | +2 for each repeat of the same motion key beyond 5 in a row (default keys: `h j k l`). A count prefix (`5j`) resets the streak |

Cost is displayed with at most one decimal.

### 5.2 Par

`par` is authored from a **reference solution** (a key sequence in `solution`, Appendix B). The Level Lab computes its cost, and par = reference cost + slack (default slack 2). Par represents a fluent player, so the rank thresholds below are generous to learners.

Live levels have `par.keys` and `par.seconds`, with `parPoints = par.keys + par.seconds / 2`.

### 5.3 Run rank

`ratio = points / parPoints`

| Ratio | Tier |
|---|---|
| ≤ 1× | **Ghost** |
| ≤ 2× | **Shadow** |
| ≤ 3× | **Contractor** |
| ≤ 4× | **Intern** |
| > 4× | **Cautionary Tale** |

The run rank starts at Ghost and decays as points accumulate. It's displayed live.

**Failure events** (level-defined: alarm tripped, vase cracked, Watchdog wiped unsaved work, trace meter full, a protected line destroyed) each push the rank **one tier down**, with a 1.5 s cooldown to prevent cascades:

`rankIndex = tier(ratio) + failureCount`   (Ghost=0 … Intern=3, Cautionary Tale ≥ 4)

### 5.4 Termination

In Drills, Jobs, and Audits, reaching Cautionary Tale means **TERMINATED**: the handler delivers an insult (section 6), the `:e!` command types itself on screen, and the level restarts from its initial state. Attempts are counted.

Briefings cannot terminate (rank clamps at Intern).

**Mercy rule:** after 3 consecutive terminations on a level the handler offers `:hint`. After 5 he offers to skip to the matching Drill and return later. Snark never blocks learning.

### 5.5 Career rank

The hub shows the player's **career rank**, starting at **Intern**.

Each scored level (Drill/Job/Audit) contributes its *best* run rank: Ghost 4, Shadow 3, Contractor 2, Intern 1, Cautionary Tale 0 (not completed = no contribution). The career average is:

| Average | Career rank |
|---|---|
| fewer than 3 scored levels completed | Intern (\"probationary\") |
| ≥ 3.5 | Ghost |
| ≥ 2.75 | Shadow |
| ≥ 1.75 | Contractor |
| otherwise | Intern |

Promotions and demotions are announced by the handler in the hub.

## 6. The Handler and the Insults

### 6.1 Character

Dry, tired, sardonic. A disappointed mentor who is secretly invested. Running gags: **Gary from HR**, the **shredder**, the **predecessor** (40 keystrokes, now \"reassigned\"), the intern's **houseplant**.

### 6.2 Style rules (non-negotiable)

**Allowed:** mockery of actions, keystrokes, and decisions. Absurd comparisons. Bureaucratic dread. Fictional corporate atrocities (the Incident of 2019). Black humor about *fictional* firings and reassignments.

**Forbidden:** appearance, intelligence-as-a-trait, identity, real tragedies, anything about self-harm or suicide, slurs, and profanity stronger than \"hell\". Every line should leave the player smirking, not stung. Harsher tiers get *funnier and more absurd*, not meaner.

**Writing rules for dialogue:** a bubble is at most 2 sentences with one joke. Name the real Vim term at first mention. Never blame the player for not knowing something the game hasn't taught yet.

### 6.3 How insults are produced

A **composer** combines templates with slot pools (object, quality, ability, dept, doc, fate, person, and live numbers like keycount), filtered by escalation tier and failure context, with constraints to block unwanted combinations. Full specification in **Appendix C**.

Tier by consecutive failures on a level: 1 = dry disappointment, 2 = weary sarcasm, 3 = theatrical bureaucracy, 4+ = absurd office comedy plus a gentle hint offer.

## 7. Input Decisions

### 7.1 Disabled inputs
Arrow keys, Home/End, PageUp/PageDown, and the mouse are disabled inside the editor. The first attempt triggers a handler line. The editor captures focus and refocuses on any click.

### 7.2 Escape alternatives
`Ctrl-[` is Escape natively (taught in Level 0.1). Optional setting `escAlias: \"jk\"` (off by default, labelled as non-standard) helps tablet keyboards that lack an Esc key.

### 7.3 The `Ctrl-w` problem and its solution

On **Windows/Linux** browsers, `Ctrl-w` closes the tab and pages cannot block it. `Ctrl-w` is the window prefix for all of Act 6. macOS is unaffected (browser uses `Cmd-w`). Strategy:

| Environment | Behavior |
|---|---|
| macOS, any browser | Native `Ctrl-w` works |
| Windows/Linux **Chromium** (Chrome/Edge) | Offer a **Full-screen mode** button (default prompt on Act 6 entry). In full screen, call `navigator.keyboard.lock([\"KeyW\"])` so `Ctrl-w` reaches the page |
| Windows/Linux **Firefox/Safari**, or a player who declines full screen | Use the **leader alias**: `<Space>w` + the same key (`<Space>wv` = `Ctrl-w v`). A HUD note explains \"Your browser reserves Ctrl-w. Use Space w instead\" |
| All non-Mac environments | A `beforeunload` confirmation is active while any level with multiple windows is loaded, so an accidental tab-close is recoverable |

The same behavior is implemented behind one function, `windowPrefix()`, so it stays in one place. **This must be tested in Phase 0**, not at the end (Roadmap).

### 7.4 Leader key
`<Space>` is the leader (as in LazyVim). The core game uses it only for the `<Space>w` window alias. It is reserved now so future packs (fuzzy finder, LSP actions) can use it without a retrofit. A small keymap module exposes `mapLeader(sequence, handler)`.

### 7.5 Other keys
`Ctrl-^` and `Ctrl-6` are both accepted (keyboard layouts differ). The game calls `preventDefault` for Vim-relevant browser shortcuts (`Ctrl-o/r/u/d/f/v`, etc.).

## 8. Vim Fidelity Policy

The editor is an **emulation** (a Vim mode for CodeMirror), not Neovim. Rules:

1. **Teach only what behaves like real Neovim.** If the emulation diverges and can't be patched, change the level or drop the command. Never teach wrong behavior.
2. **Neovim wins over Vim** where they differ in defaults (for example `Y` = `y$`, `hidden` is on, `:set relativenumber` spelling and `rnu` alias).
3. Features implemented by us (windows, buffers, global marks if needed, `:ls`, `:reg`, `:marks`, `:jumps`, `Ctrl-w` family) mimic Neovim's output and error messages closely (`E37`, `E162`, `E20: Mark not set`).
4. Divergences are logged in `docs/FIDELITY.md` (maintained from Phase 0 onward). Anything emulated but not faithful gets an \"(approx.)\" tag in the Toolkit.

## 9. Hints and Learning Aids

- **Three-tier hints** via `:hint`: (1) nudge, (2) command name, (3) exact keystrokes (taken from `solution`). Free in Briefings. Tier 2-3 cost +5 elsewhere.
- **Toolkit panel:** commands appear when unlocked. Each shows keys, a one-line explanation, and an example.
- **Mastery fade:** a newly unlocked command glows. A best-effort matcher recognizes command use in the key stream. Each recognized use dims the glow, and after 5 uses it displays normally (\"mastered\"). Imperfect detection is acceptable.
- **Key overlay:** the last few keystrokes appear as keycaps bottom-right and **fade after about 2 seconds** (`^W` notation for Ctrl combos). Toggle in settings.
- **Post-level replay:** shows the reference solution beside the player's cost with a one-line explanation.

## 10. Splits and Buffers

### 10.1 Core decisions
- **Buffer** = an open file's text in memory (may have no window). **Window** = a viewport onto a buffer. The game teaches this difference explicitly.
- `:sp` splits horizontally (stacked windows). `:vsp` splits vertically (side by side). The handler jokes that the names feel backwards.
- New windows appear above/left of the current one and receive focus (Neovim default, `nosplitbelow`/`nosplitright`).
- Maximum 6 windows.
- Hidden buffers are allowed (Neovim default). A modified hidden buffer blocks quitting with the real error message.

### 10.2 Window commands in scope

| Action | Commands |
|---|---|
| Create | `:sp`, `:vsp`, `:new`, `:vnew`, `:sp file`, `:vsp file`, `Ctrl-w s`, `Ctrl-w v`, `Ctrl-w n` |
| Navigate | `Ctrl-w h/j/k/l`, `w`, `W`, `p`, `t`, `b` |
| Resize | `Ctrl-w + - < >` (count-aware), `Ctrl-w =`, `Ctrl-w _`, `Ctrl-w \\|`, `:resize N`, `:vertical resize N` |
| Close | `:q`, `:close`, `:only`, `Ctrl-w c`, `Ctrl-w q`, `Ctrl-w o` |
| Rearrange (optional content) | `Ctrl-w H/J/K/L`, `Ctrl-w x`, `Ctrl-w r` |

### 10.3 Buffer commands in scope
`:ls` (with `%`, `#`, `+`, `h` flags), `:b N`, `:b name`, `:bn`, `:bp`, `:e file`, `:e #`, `Ctrl-^`, `:bd`, `:w`, `:wa`, `:wq`, `:wqa`, `:qa`, `:qa!`.

### 10.4 Known limits
If one buffer is shown in two windows, text is synced, but **undo history may be per window**. Levels must not rely on `u` across duplicated windows unless Phase 6 proves otherwise.

## 11. UI and Experience

- **Themes:** `green` (classic hacker), `amber`, `grey`, all on black, implemented as CSS variables on `<html data-theme>`. Theme switch in settings, persisted.
- **Responsive:** minimum supported viewport **1280×720 (HD)** with the full layout. Wider screens scale typography (CSS `clamp()`), with a maximum content width on very large screens. **768-1279 px wide** (tablets with keyboards, landscape or portrait) collapses the side panel into tabs under the editor, with the dialogue line always visible. Below 768 px wide or 600 px high, show a polite \"needs a larger screen\" message. The compact layout requires at least **768×600**; **1280×720 or larger** is recommended. No phone layout.
- **Accessibility:** respects `prefers-reduced-motion` (no scanline animation or typewriter delays), strong contrast in all themes, and a font-size setting (S/M/L).
- **Visual effects:** subtle scanlines only. No flashing, no sound.
- **Line numbers:** absolute numbers are on from Level 0.1. Relative numbers are introduced in Level 1.2 (the player types `:set relativenumber`). After that the preference persists (`:set rnu`, `:set nornu`, `:set nu` all work).

## 12. Persistence

`localStorage` key `ghostprotocol.v1` holds a versioned JSON object (Appendix D): settings, per-level best rank/cost/attempts, Toolkit use counts, recent insult history, and which dialogue has been seen. The schema carries a `version` field with migration functions. There are no accounts and no network calls beyond the CDN libraries.

## 13. Content Authoring Rules

Every level must satisfy this checklist (a reviewer signs off before merge):

1. Teaches at most **two** new commands (Briefings) or none (Drills/Audits).
2. Requires **no command not yet unlocked**, except via an explicit hint.
3. Has an unambiguous objective text. The player always knows what \"done\" means.
4. Has a `solution` that the Level Lab runs to completion. Par is derived from it.
5. Cannot be completed by an unintended trivial path (for example, typing the final text by hand when the level wants `ci\"`). Prevent this with cost, `protected` regions, or objective design.
6. Has a useful 3-tier hint set.
7. Has dialogue following the style rules in section 6.2.
8. Works with all three themes and at minimum viewport size (no horizontal scroll in the editor for its own text).
9. Live-level rules are deterministic in timing and have a documented failure reason.

## 14. Future Packs (not built, but kept in mind)

The level loader takes **packs**: `{ id, title, acts[], toolkit[] }`. Planned ideas: **LSP pack** (go-to-definition, rename, diagnostics), **Plugins pack** (Telescope-style finder, surround, comment toggling, which-key, file explorer, all under `<Space>`), **Lua pack** (config and keymap snippets), **Power pack** (`:norm`, folds, quickfix, `:argdo`, terminal buffers, `gn`). The engine must not assume that \"core\" is the only pack.

## 15. Non-goals
Audio. Phone layout. Multiplayer. Accounts or servers. Teaching Neovim config from scratch in the core game. Perfect emulation of every Vim edge case.

## 16. Decision Log

| Decision | Reason |
|---|---|
| Career rank starts at Intern; run rank starts at Ghost | New players shouldn't feel elite at the start, but an in-level \"par\" meter needs a simple top rank |
| Briefings unscored | Learning shouldn't be penalized |
| Insert typing costs 0.5 | Typing isn't the skill, but yanking should still beat retyping |
| Macro/`.` replays cost 0 | Rewards the efficiency we're teaching |
| Ctrl-w: Keyboard Lock + leader alias + beforeunload | No single solution works in all browsers |
| `<Space>` reserved as leader | Cheap now, costly to retrofit |
| Neovim behavior over Vim | The player's goal is Neovim |
| Targeted automated tests plus manual playtests | Owner revised the policy: automate deterministic logic and regression checks; retain playtests and dev-mode labs for fun, teaching, fidelity, and browser behavior |
| Levels as data | Creativity and variety come cheap once the engine is solid |
| Tag-based insult constraints | Allow absurdity, block the specific bad combinations |
| No build step | Simplicity; revisit only if forced |

---

## Appendix A: Level List (40)

**B** = Briefing, **D** = Drill, **J** = Job, **A** = Audit, ⚡ = live. `wq` = requires `:wq` extraction.

| ID | Type | Title | Teaches / Mechanic |
|---|---|---|---|
| **Act 0: Onboarding** | | | |
| 0.1 | B wq | Day One | `hjkl`, `Esc`/`Ctrl-[`. Handler explains `:wq` and `:q!`. Score-as-golf intro |
| 0.2 | B wq | Typing Is for Amateurs | `i a o O Esc`, fill in a visitor log |
| 0.3 | B wq | Sign Here | Fix a typo, `:w`, `:wq`. Dark joke in the emergency-contact field |
| **Act 1: Lockpicking** | | | |
| 1.1 | B | Word Salad | `w b e` |
| 1.2 | B | Line Dancing | `0 ^ $ gg G { }`, counts; **player types `:set relativenumber`**, then `5j`/`12k` |
| 1.3 | D | Speed Lockpick | 8 targets, par scoring |
| 1.4 | B | Precision Work | `f t ; , %` |
| 1.5 | J | The Vault Keypad | `/ n N *`, `:noh`. 200-line file. First spam penalty |
| **Act 2: Sabotage** | | | |
| 2.1 | B | Cleanup Crew | `x dd dw D`, `u Ctrl-r` |
| 2.2 | B | Intern's Mistake | `cw cc C r s` |
| 2.3 | B | Dot and Paste | `. yy p P` |
| 2.4 | D | Clean Sweep | Mixed delete/change |
| 2.5 | J | The Shredder Room | **Watchdog:** unsaved edits revert. Objective requires `:w` |
| A1 | A wq | Mandatory Compliance Training | Acts 0-2 |
| **Act 3: Social Engineering** | | | |
| 3.1 | B | Inside Job | `ciw di\" ci\" ci(` |
| 3.2 | B | Around and About | `a` objects, `ci{ cit dap da\"` |
| 3.3 | D | Phishing Madlibs | Email rewriting |
| 3.4 | J⚡ | Sleepy Bots | **Tripwire:** silence bots (`ci\"`) before they wake again |
| **Act 4: Forgery** | | | |
| 4.1 | B | Select and Conquer | `v V viw vip` + operators |
| 4.2 | B | Column Thinking | `Ctrl-v I A $A` |
| 4.3 | B | Find and Replace | `:s`, `:%s///g`, `:g`, `:v` |
| 4.4 | J⚡ | The Paper Trail | **Sysadmin** NPC edits the file, line numbers drift |
| A2 | A wq | Quarterly Review | Acts 0-4 |
| **Act 5: Automation** | | | |
| 5.1 | B | Copy-Paste Employee | `q @ @@` |
| 5.2 | B | Scale Up | `20@a`, macros aborting on failure |
| 5.3 | B | Dead Drops | `:reg`, `\"fp`, `\"fyy`, `\"Ayy`. Handler speaks via register `f` |
| 5.4 | D | Assembly Line | Macro sprints |
| 5.5 | J | Borrowed Spell | Register `m` holds an almost-right macro; paste, fix, yank back, run |
| **Act 6: Dual Terminals** | | | |
| 6.1 | B | Two Windows | Create and navigate; yank across windows |
| 6.2 | B | Tidy Desk | Resize and close |
| 6.3 | D | Cockpit | Build target layouts quickly, navigate to marked cells |
| 6.4 | J⚡ | The Copy Job | Scrambling password; cross-split yank; close all extras before extraction |
| **Act 7: Lateral Movement** | | | |
| 7.1 | B | The Network | `:ls :b :bn :bp Ctrl-^ :e`, buffer ≠ window |
| 7.2 | D | Server Hopping | Hidden buffers, `:bd`, `:wa`, E37/E162 errors |
| 7.3 | J⚡ | Chain Reaction | Cross-buffer rule consequences; buffers + splits |
| **Act 8: Beacons** | | | |
| 8.1 | B | Plant the Flag | `ma 'a \\`a`. Marks follow their text through Sysadmin edits |
| 8.2 | B | Breadcrumbs | `Ctrl-o Ctrl-i ''`, `:marks`, `:jumps`, uppercase (global) marks |
| 8.3 | J⚡ | Needle in 5000 | Huge file, drifting lines, marks required |
| **Finale** | | | |
| F.1 | A wq | Exit Interview | Gauntlet of everything |
| F.2 | J⚡ wq | The Compliance Dragon | Multi-phase boss; registers `a`-`e` contain the handler's last instructions; extraction by `:wqa` |

---

## Appendix B: Level and Rule Contracts

### B.1 Level object

```js
export default {
  id: \"2.5\", act: 2, order: 5,
  type: \"job\",               // briefing | drill | job | audit
  live: false,               // true: timer + trace meter shown; points include seconds
  title: \"The Shredder Room\",
  extract: \"auto\",           // \"auto\" | \"wq\"
  par: { keys: 24, seconds: null },     // filled from Level Lab after solution is verified
  solution: \"/DECOY<CR>dd...:w<CR>\",    // Vim key notation; used by Level Lab and hint tier 3
  toolkit: { introduces: [\"dd\", \"dw\"], recalls: [\"w\", \"b\"] },
  settings: {
    spamPenalty: { keys: [\"h\",\"j\",\"k\",\"l\"], threshold: 5, penalty: 2 },  // null to disable
    failCooldownMs: 1500,
    relativeNumber: null     // null = player preference; true/false = force
  },
  buffers: [
    { name: \"roster.txt\", text: `...`, cursor: [1, 0],
      protected: [ { lines: [1, 3] } ] }       // destroying protected text → failure event
  ],
  windows: null,             // or a layout spec for levels that start with splits
  registers: { f: { text: \"plan...\", linewise: false } },   // dead drops
  marks: {},
  dialogue: {
    intro: [\"...\"], outro: [\"...\"],
    lines: { watchdog: [\"...\"] }             // named lines rules can trigger via s.say(\"watchdog\")
  },
  objectives: [
    { id: \"clean\", text: \"Remove every DECOY line\",
      check: s => !s.buf(\"roster.txt\").matches(/DECOY/) },
    { id: \"saved\", text: \"Write the file\",
      check: s => !s.buf(\"roster.txt\").modified }
  ],
  rules: [ /* B.2 */ ],
  hints: [\"Nudge\", \"Name the command\", \"Exact keystrokes\"],
  failureReasons: { watchdog: \"forgot_save\" }   // map to insult context ids
};
```

Authoring note: a level is declarative data plus small pure functions. No level file imports engine internals, and it only touches the engine through the `s` context.

### B.2 Rules

```js
{ id: \"watchdog\",
  on: { every: { keys: 30 } },    // or { change: \"roster.txt\" } | { tick: 1000 } | { after: { seconds: 20 } } | { event: \"objective:clean\" } | { mode: \"insert\" }
  when: s => s.buf(\"roster.txt\").modified,     // optional guard
  do: s => { s.buf(\"roster.txt\").revert(); s.say(\"watchdog\"); s.fail(\"watchdog\"); },
  once: false }
```

### B.3 The `s` context (engine-provided API)

| Area | Members |
|---|---|
| Buffers | `s.buf(name)` → `{ text, lines, line(n), matches(re), setText, replaceLine, insertLine, deleteLine, replaceRange, modified, revert() }`. All mutations made by rules are **non-undoable and not counted as keystrokes** (transaction annotated `userEvent: \"rule\"`, excluded from history), and CodeMirror maps marks/cursors through them |
| Cursor/marks | `s.cursor()`, `s.marks()` |
| Windows | `s.windows()` → layout tree, `s.focused()` |
| Registers | `s.reg(name)` |
| Flow | `s.say(lineId \\| text)`, `s.fail(reason)`, `s.complete()`, `s.flash(range)` (theme-colored highlight, no strobing), `s.after({ keys \\| seconds }, fn)` |
| Stats | `s.keys`, `s.cost`, `s.seconds`, `s.mode` |

### B.4 Objective semantics
`check` is evaluated after every document change, cursor move, window change, or rule action (debounced 50 ms). A level completes when **all objectives are true at the same time**. Optional `sticky: true` latches an objective the first time it's true.

### B.5 Protected content
Regions of a buffer marked protected. If the player damages them, the engine fires `fail(\"protected\")`, and the handler comments. This prevents \"delete everything and retype\" shortcuts.

---

## Appendix C: The Insult Composer

### C.1 Goals
Hundreds of distinct, funny lines from a modest amount of writing, with **no repeats in close succession**, **tier-aware escalation**, **context awareness**, and **guardrails against unwanted combinations**. The same composer produces failure lines, praise lines, and mercy/hint offers (`kind`).

### C.2 Slots and pools

| Slot | Description | Seeds |
|---|---|---|
| `object` | An absurd comparison | a stapler, a lanyard, a houseplant, the office fern, a toaster, a filing cabinet, a Roomba, a rubber duck, a damp sock, mud, sentient lint, a sleepy tortoise, a sheep, a swivel chair, a screensaver, a spreadsheet with opinions |
| `quality` | Adjective phrase usable after \"looks\" | livelier, more decisive, positively athletic, better at this, more motivated, dangerously competent |
| `ability` | Phrase after \"could have\" | pressed fewer keys, shown more initiative, hit fewer walls, moved with more purpose, finished before lunch |
| `dept` | Company department or location | Accounts Payable, HR, the third floor, Facilities, Legal, the mailroom, the basement archive, IT Support, Compliance |
| `doc` | A lasting record | an incident report, a cautionary poster, an anecdote, company folklore, a laminated memo, a slide in the all-hands, a post-mortem, a footnote in the handbook |
| `fate` | What happened to someone/something; a verb phrase | is now a plant, has been promoted to a closet, now runs the mailroom, was reassigned to the third floor, is on an indefinite sabbatical, has been merged with Accounts Payable, is still waiting for an approval |
| `person` | A recurring character | Gary from HR, your predecessor, the intern, Brenda from Facilities, the night guard |
| Live numbers | `{keys}`, `{par}`, `{over}`, `{attempt}`, `{seconds}`, `{level}`, `{rank}`, and `{n}` (random 3-19, for absurd counts) | |

**Release targets:** 40 objects, 25 qualities, 25 abilities, 15 depts, 15 docs, 25 fates, 10 persons, 40 templates (10 per tier), 60 hand-written context lines.

### C.3 Data shapes

```js
// pool entry
{ id: \"stapler\", text: \"stapler\", art: \"a\",      // art: \"a\" | \"an\" | \"\" (none; for mass nouns/proper names), default auto
  tags: [\"office\"], tiers: [1, 4] }               // tiers: min/max tier this entry may appear in

// template
{ id: \"cmp-02\", kind: \"fail\", tiers: [2, 3], context: \"any\",   // or \"spam_motion\" | \"forgot_save\" | ...
  text: \"Next to that run, {object.the} looks {quality}.\",
  slots: { object: { forbids: [\"person\"] } },
  weight: 1 }

// global constraints
const incompatible = [ [\"plant\", \"becomes-plant\"], [\"furniture\", \"becomes-furniture\"] ];
```

### C.4 Template syntax
- `{slot}`: bare text. `{slot.a}`: with indefinite article. `{slot.the}`: with \"the\".
- Capital letter (`{Slot.a}`) capitalizes the first letter of the result.
- Live numbers are always plain: `{keys}`, `{par}`, etc.
- **All pool entries are singular** (mass nouns are fine). This avoids agreement logic entirely.

### C.5 Constraints (blocking unwanted combinations)
1. **Slot filters:** `needs` (all listed tags required) and `forbids` (none allowed) per slot in a template.
2. **Global incompatibility pairs:** after all slots are chosen, if any two chosen entries carry tags that form a pair in `incompatible`, the draw is rejected.
3. **Tier ranges** on every entry and template.
4. On rejection, redraw (up to 20 tries), then try another template, and finally fall back to a safe hand-written line.
5. **Review tool:** `tools/insult-lab.html` lists every pool and template, lets the reviewer generate 100 samples for any tier/context, and flags slots that have zero candidates. This is the maintainers' manual quality gate. Adding an entry that could read badly means adding a tag and a constraint.

### C.6 Selection algorithm
1. Determine `tier = clamp(consecutiveFailuresOnLevel, 1, 4)`. Context lines from non-failure events use the event's default tier.
2. Candidate templates = kind matches, tier matches, context matches. With a specific context available, choose a context template 70% of the time, else a generic one.
3. Weight each by `template.weight`, reduced by a recency penalty if its id or any slot entry is in the last 30 uses (persisted).
4. Fill slots (rule 5 above), then post-process: articles, capitalization, whitespace.
5. Append mercy text when appropriate (3+ failures: hint offer; 5+: skip offer).
6. Record the template id and slot entries in history.

### C.7 Sample templates and outputs

| Tier | Template | Output |
|---|---|---|
| 1 | `Not ideal. {Object.a} might have {ability}, but let's not dwell.` | *Not ideal. A stapler might have pressed fewer keys, but let's not dwell.* |
| 2 | `Next to that run, {object.the} looks {quality}.` | *Next to that run, the office fern looks positively athletic.* |
| 2 | `{keys} keystrokes against a par of {par}. {Dept} is asking questions.` | *31 keystrokes against a par of 12. Accounts Payable is asking questions.* |
| 3 | `This will be filed as {doc.a} in {dept}. {Person} has been notified. {Person} {fate}.` | *This will be filed as a cautionary poster in the mailroom. Gary from HR has been notified. Gary from HR has been promoted to a closet.* |
| 3 | `Attempt {attempt}. {Dept} is holding a meeting about you. {Object.a} was invited. You weren't.` | *Attempt 4. Legal is holding a meeting about you. A lanyard was invited. You weren't.* |
| 4 | `By now you're {doc.a} in {dept}. {Person} recites it at parties. {Object.the} {fate}, and frankly it's the best outcome in this story.` | *By now you're company folklore in IT Support. The intern recites it at parties. The Roomba is now a plant, and frankly it's the best outcome in this story.* |

(`fate` and `object` tags such as `becomes-plant` vs `plant` would prevent \"The houseplant is now a plant\".)

### C.8 Context lines (hand-written, by id)
`spam_motion`, `forgot_save`, `used_arrows`, `wrong_delete`, `tripwire_woke`, `timeout`, `protected_damaged`, `watchdog_revert`, `trace_full`, `quit_unsaved`, `idle_too_long`. Each has 3-6 variants at each relevant tier. Examples:
- `spam_motion`: *\"That's eleven presses of `l`. The intern's houseplant is also doing nothing, but with dignity.\"*
- `forgot_save`: *\"Unsaved changes are like workplace injuries. The company will say they never happened.\"*
- `timeout`: *\"The guard came back on schedule. He's been on schedule for eleven years. He has a trophy.\"*

### C.9 Content safety checklist (per new entry)
Does it target the action rather than the person? No appearance/intelligence/identity? No real tragedy or self-harm? Fate lines describe fictional corporate absurdity only (\"promoted to a closet\"), never death. Would the player smirk? If unsure, leave it out.

---

## Appendix D: Save Data Schema

```json
{
  \"version\": 1,
  \"settings\": { \"theme\": \"green\", \"fontSize\": \"M\", \"keyOverlay\": true,
                \"relativeNumber\": false, \"escAlias\": \"none\", \"windowPrefix\": \"auto\" },
  \"progress\": { \"2.5\": { \"bestRank\": 2, \"bestPoints\": 31.5, \"attempts\": 4, \"completed\": true } },
  \"toolkit\": { \"dd\": { \"uses\": 7 } },
  \"insultHistory\": [\"cmp-02|stapler|...\"],
  \"seen\": { \"0.1.intro\": true }
}
```
Migration: a `migrations[version]` function per version bump. Corrupt or unknown data resets with a confirmation, never silently.

