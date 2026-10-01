# GHOST PROTOCOL — Project Specification

Three documents follow: **Constitution**, **Tech Stack**, **Roadmap**. The Constitution is the source of truth for design decisions; the Tech Stack describes how it's built; the Roadmap describes in what order and how each phase is tested.

---

# Document 1: CONSTITUTION

## 1. Purpose

Ghost Protocol is a browser game that teaches Vim/Neovim by making the player edit text under mission pressure. The player is an intruder inside a corporate network. The only tool is a Vim prompt. A sardonic handler named `:wq` gives instructions, commentary, and insults. The game is silent, text-only, and runs from static files.

The target player: knows Vim exists, has maybe done `vimtutor` once, still reaches for the mouse. The game must get that person to real muscle memory for motions, operators, text objects, visual mode, search/replace, macros, registers, windows, buffers, and marks.

## 2. Principles (non-negotiable)

1. **Teach by doing.** A level introduces at most two new commands. The handler explains in one or two lines, then the player acts.
2. **Muscle memory over trivia.** Every Briefing is followed by a Drill that repeats the same motions. Audits recycle earlier skills.
3. **The text is alive.** Levels may change their text while the player works (tripwires, watchdogs, rival editors, respawns, phases). The engine supports this from the start, even if early levels don't use it.
4. **Failure is funny, never cruel.** Insults target keystrokes and decisions, never the person. See §10.
5. **Silent.** No audio of any kind. A ghost is silent. This is not negotiable, not even for a toggle.
6. **Real Vim, not a Vim-flavored game.** Commands behave as they do in Neovim. Where the emulation layer differs, we fix the emulation, not the lesson. No fake commands are taught.
7. **The escape hatch is always visible.** `:q!` aborts to the hub with no penalty, and the footer always says so.
8. **No build step, no backend.** Static HTML/CSS/JS served from any web server. Progress lives in `localStorage`.
9. **Structure first.** Engine, level schema, and dialogue system are generic. Fun comes from level data, not engine special cases.

## 3. Glossary

| Term | Meaning |
|---|---|
| **Handler** | The NPC `:wq`. All dialogue is in his voice unless attributed to `SECURITY` or `HR`. |
| **Level** | One mission: buffers + objectives + rules + dialogue + par. |
| **Level type** | `briefing`, `drill`, `job`, `audit`, `finale`. |
| **Live level** | A level scored on keystrokes *and* time, usually with rules that mutate text. |
| **Cover** | The per-level stealth state, shown in the HUD. Starts at GHOST and degrades. |
| **Rank** | The grade awarded on completing a level: the Cover you finished with. |
| **Career rank** | The player's profile rank, derived from best ranks across all levels. Starts at INTERN and climbs. |
| **Par** | The level's target keystroke cost (and seconds, for live levels). |
| **Failure event** | A level-defined mistake (alarm, watchdog wipe, timeout, protected line destroyed). Drops Cover one step. |
| **Termination** | Cover dropped past INTERN. Level restarts with an insult. |
| **Rule** | A level script that watches state and mutates it (see §8). |
| **Objective** | A checkable goal shown in the side panel. |
| **Dead drop** | A register preloaded by the level with text or a macro. |
| **Toolkit** | The side panel listing unlocked commands; the player's earned cheat sheet. |
| **Pack** | A set of acts/levels plus the commands it unlocks. The core game is one pack. |

## 4. Player-Facing Structure

### 4.1 Acts and level types

Each act follows: **Briefing(s) → Drill → Job**, with **Audits** after Acts 2 and 4, and a two-level **Finale**. Forty levels total, 1–3 minutes each.

| Type | Purpose | Scoring behavior |
|---|---|---|
| **Briefing** | Introduces new commands with hand-holding. | Cover can degrade to INTERN but **never terminates**. Hints are free. |
| **Drill** | Same commands, no hand-holding, speed. | Full scoring. |
| **Job** | Story mission combining new and old skills, often live. | Full scoring. Failure events possible. |
| **Audit** | \"HR compliance training\": remix of all prior skills. | Full scoring. Requires `:wq` to extract. |
| **Finale** | Gauntlet + boss. | Full scoring, live. |

### 4.2 Extraction (completing a level)

A level is complete when all objectives are satisfied, **and**:
- In Act 0 and in Audits, the player must type `:wq` (teaches the habit).
- Elsewhere, completion is automatic when objectives are met. The HUD shows `OBJECTIVES COMPLETE — :wq to extract (or Enter)`. Both work.

Completion shows: rank, keystroke cost vs par (and time vs par for live levels), the handler's outro line, and a \"Ghost line\" (the shortest known solution with a one-line explanation).

### 4.3 Level select (the hub)

A terminal-styled list of acts and levels with best rank per level. Levels unlock in order; a completed level at any rank unlocks the next. Any completed level can be replayed. `:q!` from inside a level returns here.

## 5. Input Rules

- **Disabled:** arrow keys, Home, End, PageUp, PageDown, mouse clicks/drags inside the editor, mouse wheel scrolling the editor. First use of each produces a handler line; repeated use is silently ignored.
- **Leader key:** `<Space>` is reserved as leader from day one. The core pack maps nothing to it. Packs may. (Cheap to reserve now, hard to retrofit.)
- **Browser shortcuts:** all `Ctrl-*` combinations used by Vim are `preventDefault`ed (`Ctrl-r`, `Ctrl-o`, `Ctrl-u`, `Ctrl-d`, `Ctrl-f`, `Ctrl-b`, `Ctrl-v`, `Ctrl-^`, `Ctrl-i`). `Ctrl-w` is special; see §12.
- **Focus:** the active editor window always has keyboard focus while a level is running. Clicking anywhere returns focus to it.

## 6. Keystroke Accounting

A **keystroke** is any `keydown` whose `key` is not a pure modifier (`Shift`, `Control`, `Alt`, `Meta`, `CapsLock`).

| Situation | Cost |
|---|---|
| Normal, Visual, Operator-pending, Command-line key | 1.0 |
| `Esc` (any mode) | 1.0 |
| Printable character typed in Insert/Replace mode | **0.5** |
| `Enter`/`Backspace`/`Tab` in Insert mode | 0.5 |
| Same motion key pressed 6+ times consecutively (`h j k l w b e x`) | each press from the 6th on costs 2.0, and triggers a `spam_motion` handler line once per level |
| Disabled key (arrow, mouse) | 0, but counts for handler commentary |
| Hint tier 2 or 3 in a non-Briefing level | +5.0 each |

The running cost is shown in the HUD as `KEYS: 14.5 / par 12`.

**Par** is authored per level as the cost of a clean, idiomatic solution (not the theoretical VimGolf minimum), computed with the same weights. The \"Ghost line\" shown at completion is the par solution.

## 7. Cover, Rank, Career Rank

### 7.1 Cover (per level, live in the HUD)

Narrative: when the level starts, nobody knows you're there. You are a **GHOST**. Every inefficiency and mistake makes you more visible. This is a *stealth state*, not a skill grade, which is why it starts at the top.

Ladder: `GHOST → SHADOW → CONTRACTOR → INTERN → CAUTIONARY TALE`

```
efficiencyTier:
  GHOST        cost ≤ 1×par
  SHADOW       cost ≤ 2×par
  CONTRACTOR   cost ≤ 3×par
  INTERN       cost ≤ 4×par
  CAUTIONARY   cost >  4×par

coverIndex = efficiencyTier + failureCount
Cover      = ladder[min(coverIndex, 4)]
```

- In **live levels**, `cost = keys + ceil(seconds / 2)` for tier computation; keys and time are also displayed separately.
- `failureCount` increments on each failure event (§8.4).
- If `coverIndex ≥ 4` in a Drill, Job, Audit, or Finale: **TERMINATION** (§7.3).
- In a Briefing, Cover floors at INTERN; termination never occurs.

### 7.2 Rank (per level, on completion)

Rank = Cover at the moment of extraction. Stored as the level's best if higher than the previous best.

### 7.3 Termination

1. Editor freezes. A red-bordered `SECURITY` overlay slides in with the termination insult (§10).
2. Footer reads `Press Enter to reload (:e!)`.
3. On Enter, the ex line animates `:e!`, the level resets to its initial state, the per-level attempt counter increments (drives insult tier), and play resumes with a short handler line.
4. The attempt counter resets when the level is completed.

### 7.4 Career rank (profile)

Each level's best rank is worth points: GHOST 4, SHADOW 3, CONTRACTOR 2, INTERN 1, none 0. Career rank is based on `earned / (4 × levelsUnlocked)`:

| Ratio | Career rank |
|---|---|
| < 0.35 | INTERN |
| < 0.60 | CONTRACTOR |
| < 0.85 | SHADOW |
| ≥ 0.85 | GHOST |

Career rank is shown in the hub header. It only ever reflects best results, so it climbs. The handler comments on promotions.

## 8. Levels and the Living-Level Engine

### 8.1 Level schema

Levels are plain JS objects. Check and rule functions receive a state facade `s` (§8.3). Everything else is data.

```js
{
  id: \"2.5\",                    // \"act.level\", strings; audits \"A1\", finale \"F1\"
  act: 2,
  title: \"The Shredder Room\",
  type: \"job\",                  // briefing | drill | job | audit | finale
  live: false,                  // true => time is scored and shown
  extract: \"auto\",              // \"auto\" | \"wq\"
  unlocks: [\"x\", \"dd\"],         // command ids added to the Toolkit on start
  options: { relativenumber: true }, // editor options for this level

  buffers: [
    { name: \"roster.txt\", text: \"...\", readonly: false, protectedLines: [] }
  ],
  focus: \"roster.txt\",          // buffer shown in the initial window
  layout: null,                 // optional initial window layout (see §9.1); null = single window
  registers: { f: { text: \"...\", linewise: false } },   // dead drops
  marks: {},                    // optional preset marks { a: { buffer, line, col } }
  targets: [ { buffer: \"roster.txt\", line: 3, col: 14, id: \"t1\" } ], // cursor targets, rendered, not in text

  intro:  [\"line\", \"line\"],     // handler lines before play, advanced with Enter
  outro:  [\"line\"],
  banter: { spam_motion: \"optional level-specific override\" },

  objectives: [
    { id: \"clean\", text: \"Remove all DECOY lines\",
      check: s => !s.buf(\"roster.txt\").matches(/DECOY/),
      volatile: false }         // volatile: can become unchecked again
  ],

  rules: [ /* see §8.2 */ ],

  par: { keys: 24, seconds: null },   // seconds required when live
  hints: [\"nudge\", \"command name\", \"exact keys\"],
  ghostLine: { keys: \"gg/DECOY<CR>dd n . n . :w<CR>\", note: \"Search then repeat with dot.\" }
}
```

**Cursor targets** are *not* characters in the text. They are rendered as highlighted cells via editor decorations, so the text stays clean and checks are exact. Terrain (`~~~~`, `#####`) *is* literal text.

### 8.2 Rules

A rule is `{ id, trigger, do, once }`. Triggers:

| Trigger | Fires when |
|---|---|
| `when: s => boolean` | Evaluated after every change, keystroke, and timer tick; fires on false→true transition |
| `every: { keystrokes: N }` | Every N counted keystrokes |
| `every: { seconds: N }` | Every N seconds of level time |
| `after: { keystrokes: N }` / `after: { seconds: N }` | Once |
| `onObjective: \"id\"` | When that objective becomes satisfied |
| `onPhase: \"name\"` | When `s.phase(name)` is called |

Canonical rule patterns (all expressible with the above):

1. **Tripwire:** `when` a pattern appears/disappears → mutate text (vase cracks back into goblin).
2. **Watchdog:** `every` N keystrokes → `s.revertUnsaved(buf)` + `s.fail(\"forgot_save\")`.
3. **Sysadmin:** `every` N seconds → `s.insertLine(buf, randomLine)` / `s.deleteLine(...)`. Marks and search survive; hard-coded line numbers don't.
4. **Respawn:** `every` N seconds → reinsert decoy lines that were deleted.
5. **Phase:** `onObjective` → rewrite buffer, `s.say(...)`, `s.addObjective(...)`.
6. **Cross-buffer:** `when` buffer A matches X → mutate buffer B, `s.say(...)`.

Rules must be deterministic given the level seed; any randomness uses `s.rng()` so replays are reproducible.

### 8.3 State facade `s`

```
s.buf(name)           -> { text(), lines(), matches(re), count(re), modified, line(n), setText(), replaceLine(n,t), insertLine(n,t), deleteLine(n) }
s.cursor()            -> { buffer, line, col }          // 1-based, like Vim
s.mode()              -> \"normal\" | \"insert\" | \"visual\" | \"visual-block\" | \"visual-line\" | \"replace\" | \"cmdline\"
s.reg(name)           -> { text, linewise }
s.setReg(name, text, opts)
s.mark(name)          -> { buffer, line, col } | null
s.windows()           -> layout tree snapshot (§9.1)
s.buffers()           -> [{ name, modified, hidden, current, alternate }]
s.keys()              -> cost so far;  s.keyCount() -> raw count;  s.lastKeys(n)
s.seconds()
s.revertUnsaved(name)
s.fail(contextId)     // failure event: coverIndex++ and handler line from context pool
s.say(text)           // handler line now
s.addObjective(obj); s.completeObjective(id); s.phase(name)
s.rng()               // seeded PRNG in [0,1)
s.once(key, fn)       // run fn at most once per level attempt
```

### 8.4 Failure events

Only `s.fail(context)` creates a failure event. Engine-level automatic failures: trace meter full (live levels, see §8.5), editing a `protectedLines` line (context `protected_line`), and timer expiry when `par.seconds` is set and the level declares `hardTimeout: true`.

### 8.5 Trace meter (live levels)

Fills linearly over `par.seconds × 1.5`. When full: `s.fail(\"timeout\")`, then resets to empty. Shown as a bar in the HUD. Calm levels hide it.

## 9. Windows, Buffers, Marks

### 9.1 Windows

Model: a layout tree. Nodes are `{ type: \"split\", dir: \"row\"|\"col\", sizes: [fractions], children }` or `{ type: \"win\", id, buffer, view }`. `dir:\"col\"` = children stacked top/bottom (created by `:sp`); `dir:\"row\"` = side by side (created by `:vsp`). Rendered with flexbox; sizes are fractions of the parent.

Terminology is Vim's, which is counter-intuitive and the handler jokes about it once: `:split` stacks, `:vsplit` places side by side.

Supported commands (all must behave as in Neovim):

| Action | Commands |
|---|---|
| Create | `:sp[lit]`, `Ctrl-w s`, `:vs[plit]`, `Ctrl-w v`, `:new`, `:vnew`, `:sp file`, `:vsp file` |
| Navigate | `Ctrl-w h/j/k/l`, `Ctrl-w w`, `Ctrl-w W`, `Ctrl-w p`, `Ctrl-w t`, `Ctrl-w b`, `:wincmd {x}` |
| Resize | `Ctrl-w +/-`, `Ctrl-w >/<`, counts (`5 Ctrl-w >`), `Ctrl-w =`, `Ctrl-w _`, `Ctrl-w \\|`, `:res[ize] [+-]N`, `:vert[ical] res[ize] [+-]N` |
| Close | `:q`, `:clo[se]`, `Ctrl-w c`, `Ctrl-w q`, `:on[ly]`, `Ctrl-w o` |
| Rearrange | `Ctrl-w H/J/K/L`, `Ctrl-w x`, `Ctrl-w r` |

Resize units: one step = one text row (height) or one text column (width), converted to fractions. `Ctrl-w =` equalizes siblings recursively. Minimum window size: 1 row / 10 columns, as in Vim.

Two windows may show the same buffer. Text changes are mirrored to every view of that buffer. **Undo history is per view**; levels must not require `u` on a buffer shown in two windows (documented limitation).

`:q` on the **last** window: if any buffer is modified, refuse with `E37: No write since last change (add ! to override)` (and `E162` for hidden modified buffers). Otherwise the level ends as if `:wq` was typed only if objectives are complete; if not, the handler says the level isn't done and nothing happens.

### 9.2 Buffers

A buffer is `{ id (1-based, stable), name, doc, modified, marks, lastCursor, hidden }`. Buffers survive without windows (`hidden` is always on, like Neovim's default in many configs; the handler explains it).

| Action | Commands |
|---|---|
| List | `:ls` / `:buffers` with flags `%` current, `#` alternate, `+` modified, `h` hidden, `a` active |
| Switch | `:b N`, `:b name` (unique prefix), `:bn`, `:bp`, `Ctrl-^` (alternate) |
| Open | `:e name` (existing level buffer; unknown names create an empty buffer) |
| Close | `:bd [N]` refuses on modified (`E89`), `:bd!` forces |
| Save | `:w`, `:w name` (alias), `:wa`, `:wq`, `:wqa`, `:qa` (refuses on modified), `:qa!` |

`:ls` output is printed in the message area exactly in Vim format:
```
  1 %a + \"roster.txt\"    line 3
  2 #h   \"vault.cfg\"     line 1
```

### 9.3 Marks and jumps

- Lowercase marks are per buffer. Uppercase marks are global and switch buffer when jumped to.
- `m{a-zA-Z}`, `'{m}` (line), `` `{m} `` (exact), `''` / ``` `` ``` (before last jump), `:marks`, `:delm`.
- Marks move with their line when text above is inserted/deleted (the Sysadmin rule relies on this).
- Jumplist: `Ctrl-o`, `Ctrl-i` (Tab), `:jumps`, across buffers. Jumps are recorded by `G`, `gg`, `/`, `n`, `%`, `'m`, `{`, `}`, buffer switches.

## 10. Dialogue and Insults

### 10.1 Voice

`:wq` is dry, weary, precise, and secretly on the player's side. Black humor is about the *fictional* company: the shredder, HR, \"the Incident\", people \"reassigned to a closet\". Running gags (use sparingly, max once per act): **Gary from HR**, **the predecessor**, **the intern's houseplant**, **the third floor**, **the Incident of 2019**.

### 10.2 Content rules

**Allowed:** mocking keystrokes, choices, speed, hesitation. Absurd comparisons. Fictional corporate dread. Dark jokes about fictional employment and fictional disappearances.

**Forbidden:** appearance, intelligence as a trait, identity, nationality, disability, real events, real people, self-harm or suicide, profanity beyond \"hell\"/\"damn\". Tiers escalate in *absurdity*, not in *meanness*.

Every line must pass: \"Would this make a tired adult smirk at their own keystrokes?\" If it could make someone feel stupid rather than caught, it's out.

### 10.3 Line selection

Order of preference when a line is needed:

1. **Level override** (`level.banter[context]`) if present.
2. **Context pool** (`dialogue.context[context]`, hand-written) filtered by tier ≤ current tier.
3. **Generated** from the grammar (§10.4) at the current tier.

Anti-repetition: each pool is a shuffle bag (no repeat until exhausted). The last 20 spoken line ids/rendered strings are stored; a candidate matching one is re-rolled up to 5 times.

**Tier** = `min(4, consecutive attempts on this level)` for termination insults; for in-level banter, tier is 1 unless the same context has already fired this attempt, then 2.

### 10.4 Grammar

Templates are strings with `{slot}` placeholders. Capitalised `{Slot}` capitalises the first letter. Pools are keyed by slot and tier; a pick at tier T draws from tiers ≤ T with weight favoring T. No exclusion logic: absurd combinations are accepted by design.

Slots:

| Slot | Examples (tier 1 → tier 4) |
|---|---|
| `object` | a sheep, a toaster, a houseplant → a damp sock, a sleepy tortoise → a stapler with ambitions, a lanyard, sentient lint → the office fern (posthumously), a Roomba that has given up |
| `quality` | livelier, more decisive, better at this, more purposeful → positively athletic, a credible threat |
| `ability` | pressed fewer keys, shown more initiative, hit fewer walls, found the line faster |
| `dept` | HR, Accounts Payable, the third floor, Facilities, Compliance, the mailroom |
| `doc` | an incident report, a cautionary poster, an anecdote, company folklore, a laminated memo, a training video nobody finishes |
| `fate` | is now a plant, has been promoted to a closet, was reassigned to the stairwell, is quietly a legend in {dept}, is on a poster |
| `keys` | the player's actual cost, rounded |
| `par` | the level's par |
| `attempt` | attempt number |
| `level` | level title |

Template examples:

```
\"{Object} could have {ability}.\"
\"Next to that run, {object} looks {quality}.\"
\"That was {keys} keystrokes. Par is {par}. {Dept} has been informed.\"
\"Attempt {attempt}. {Dept} is drafting {doc}. You're the subject. You're also the audience.\"
\"Your predecessor tried that exact thing. He {fate}.\"
\"I've seen {object} {ability}. Once. Under sedation.\"
\"This is going in {doc}. Not the good kind. There is no good kind.\"
\"{Keys} keys. I've stopped counting. {Dept} hasn't.\"
```

Pools target: 8+ entries per slot per tier where tiers apply, 15+ templates, 40+ context lines. Authoring lives entirely in `dialogue.js`; adding a line never touches engine code.

### 10.5 Mercy

- After the 3rd consecutive termination on a level, the termination insult is followed by: *\"Type `:hint`. It's not surrender. It's a memo.\"*
- After the 5th, an extra option appears: *\"Or `:skip` to the Drill and come back. I won't tell {dept}.\"* `:skip` marks the level as skipped (no rank), unlocks the next, and the hub flags it for return.

### 10.6 Praise

Completion lines exist per rank (pooled), plus a small \"grudging warmth\" pool used at most once per act at GHOST rank: *\"...That was good. Don't get used to me saying it.\"*

## 11. UI

### 11.1 Layout

```
┌─ header ──────────────────────────────────────────────────────────┐
│ GHOST PROTOCOL ▸ Act 2 ▸ 2.5 The Shredder Room   CAREER: CONTRACTOR│
│ COVER: SHADOW  TRACE ▓▓░░░░  KEYS 14.5/24  T 0:42                   │
├─ editor area (windows) ───────────────┬─ side panel ───────────────┤
│                                       │ OBJECTIVES                 │
│                                       │ [x] ...   [ ] ...          │
│                                       ├────────────────────────────┤
│                                       │ :wq ▸ dialogue (scrollable)│
│                                       ├────────────────────────────┤
│                                       │ TOOLKIT (unlocked cmds)    │
├─ status line ─────────────────────────┴────────────────────────────┤
│ -- NORMAL --   roster.txt [+]   buf 1/3   3:14   :q! = abort        │
├─ message / ex line ────────────────────────────────────────────────┤
│ :                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                                  ┌ key overlay: d d  j  . ┐
```

- Every window has its own mini status line (buffer name, `[+]`), as in Vim.
- The message area shows Vim errors (`E37`), `:ls`, `:reg`, `:marks` output, and engine notices.
- **Key overlay:** last 6 keystrokes, newest brightest, fading. Toggle with `:keys`.
- **Toolkit:** newly unlocked commands appear highlighted with a one-line example. Each use dims the highlight by 20%; after 5 uses it settles to normal. The panel is the player's living cheat sheet and is always visible.
- **Dialogue box:** handler lines render with a typewriter effect (skippable with any key; disabled if `prefers-reduced-motion`). Intro lines are advanced with Enter.

### 11.2 Themes

Three themes via CSS custom properties, switchable from the hub or `:theme green|amber|grey`:

| Theme | fg | accent | bg |
|---|---|---|---|
| `green` (default) | `#9eff9e` | `#33ff33` | `#0a0f0a` |
| `amber` | `#ffcc66` | `#ffaa00` | `#100c04` |
| `grey` | `#d0d0d0` | `#ffffff` | `#0c0c0c` |

Shared: error red `#ff5555`, target highlight = accent at 35% alpha, subtle scanline overlay (disabled under `prefers-reduced-motion`). No flashing animations anywhere (accessibility).

### 11.3 Responsiveness

- Minimum supported viewport: 1280×720. Above 1600px wide, the editor area grows; the side panel caps at 380px.
- Between 1024 and 1280px wide, the side panel collapses to a 30% bottom drawer (objectives + last dialogue line); Toolkit is accessible via `:toolkit`.
- Below 1024px: a full-screen notice (\"Ghost Protocol needs a wider terminal\") with the hub still reachable.
- Tablets with external keyboards are supported through the above. Without a physical keyboard the game shows a notice; no on-screen keyboard is provided.
- Font: system monospace stack (`ui-monospace, \"SF Mono\", Menlo, Consolas, \"DejaVu Sans Mono\", monospace`). No web fonts (no external dependencies beyond the editor).
- `:fontsize N` adjusts editor font size (12–24, persisted).

## 12. `Ctrl-w` Policy

`Ctrl-w` is the window prefix in Vim and closes the tab in most desktop browsers on Windows/Linux. Pages cannot cancel that in Chrome/Firefox/Edge. Decisions:

1. **macOS:** no issue (browser uses `Cmd-w`). Nothing special.
2. **Chromium on Windows/Linux:** the hub offers **Focus Mode** (button and `:focus`), which requests fullscreen and calls `navigator.keyboard.lock([\"KeyW\"])`. While locked, `Ctrl-w` reaches the page. Exiting fullscreen releases the lock. Act 6's first level tells non-Mac players to enable it.
3. **Firefox / others without Keyboard Lock:** a `beforeunload` handler is registered while a level is running, so an accidental `Ctrl-w` produces a \"Leave site?\" dialog instead of silent loss. The game teaches `:wincmd {x}` as the real-Vim fallback (it *is* a real command) and additionally maps `<leader>w {x}` (Space, w, then the usual letter) as a game-only alias, clearly labelled as such in the Toolkit.
4. **Detection:** at startup, detect platform (`navigator.platform` / `userAgentData`) and Keyboard Lock availability; store `ctrlWMode: \"native\" | \"lock\" | \"fallback\"`. The Act 6 intro adapts its wording to the mode.
5. **Testing:** this is verified in Phase 0 (Roadmap) on Windows or Linux Chromium and Firefox before any window code is written.

## 13. Persistence

Single key `ghostprotocol.v1` in `localStorage`:

```js
{
  version: 1,
  theme: \"green\", fontSize: 14, keyOverlay: true,
  ctrlWMode: \"native\",
  levels: { \"2.5\": { best: \"SHADOW\", bestCost: 31, attempts: 0, completed: true, skipped: false } },
  unlockedCommands: [\"h\",\"j\",\"k\",\"l\", ...],
  recentLines: [\"id or text\", ...],   // last 20 handler lines, for anti-repetition
  stats: { totalKeys: 0, terminations: 0, playSeconds: 0 }
}
```

Schema changes bump `version` and run a migration in `storage.js`. `:reset` (with confirmation) wipes progress. `:export` prints the JSON to the message area for copy-out; `:import` reads from a prompt.

## 14. Packs

The level loader takes an array of packs. A pack is:

```js
{ id: \"core\", title: \"Ghost Protocol\", version: 1,
  commands: { \"dd\": { label: \"dd\", example: \"delete line\", group: \"operators\" }, ... },
  acts: [ { n: 0, title: \"Onboarding\", levels: [ ...level objects... ] } ] }
```

The core pack is `levels.js`. Future packs (LSP, plugins, Lua, power-user) add files and register themselves in `index.html`. The engine never references level ids or act numbers directly. Commands unlocked by a pack appear in the Toolkit under the pack's group.

## 15. Documented Limitations

- Undo history is per window view (§9.1).
- The Vim emulation is `@replit/codemirror-vim`; behaviors it doesn't support are either implemented in `vimext.js` or not taught. Levels must not rely on untested commands (each command taught is listed in the pack's `commands` map, which doubles as the supported-command registry).
- No `:help`. The Toolkit is the in-game reference. `:help` prints \"Help is a Toolkit away.\"

---

# Document 2: TECH STACK

## 1. Summary

Vanilla JavaScript (ES2020+ modules), HTML, CSS. No framework, no bundler, no transpiler, no backend, no package manager at runtime. One third-party dependency family (CodeMirror 6 and its Vim mode) loaded from a CDN as ES modules.

## 2. Files

```
index.html        shell, loads style.css and game.js (type=\"module\")
style.css         layout, themes (CSS variables), editor overrides
game.js           entry: boot, hub, level runner, HUD
editor.js         CodeMirror setup, keystroke capture/costing, cursor targets
vimext.js         custom ex commands, Ctrl-w family, buffers/windows/marks glue
windows.js        layout tree + rendering + resize math
buffers.js        buffer registry, :ls formatting, alternate buffer, jumplist
rules.js          rules engine, state facade `s`, timers, seeded RNG
scoring.js        cost weights, par tiers, cover/rank/career computations
dialogue.js       handler voice: context lines, grammar pools, templates, praise
dialogue-engine.js selection, shuffle bags, anti-repetition, templating
levels.js         the core pack (acts and levels)
storage.js        localStorage schema + migrations
README.md         how to run, how to add a level, how to add a line
```

Each module exports plain functions/classes; no global state outside `game.js` and `storage.js`.

## 3. Dependencies

| Package | Purpose | Why |
|---|---|---|
| `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/language` | Editor core | Mature, decoration API for targets, per-state docs for buffers |
| `@replit/codemirror-vim` | Vim emulation | Most complete Vim layer for CM6: motions, operators, text objects, visual/block, registers, marks, macros, `:s`, `:g`, `.`, `Vim.defineEx`, `Vim.defineAction`, register controller access |

Loaded via `https://esm.sh/` with **pinned versions** in an import map in `index.html`, so a CDN update can't break the game:

```html
<script type=\"importmap\">
{ \"imports\": {
  \"@codemirror/state\": \"https://esm.sh/@codemirror/state@6.x.y\",
  \"@codemirror/view\":  \"https://esm.sh/@codemirror/view@6.x.y\",
  \"@replit/codemirror-vim\": \"https://esm.sh/@replit/codemirror-vim@6.x.y\"
} }
</script>
```
(Exact versions fixed in Phase 0 and recorded in README.)

If CDN dependence becomes a problem, the same ESM files can be vendored into `vendor/` with the import map pointed at them. No other change is needed.

## 4. Running

Module scripts don't load over `file://`, so the game runs from any static server:

```
python3 -m http.server 8000      # then open http://localhost:8000
```
Deployment is copying the directory to any static host (GitHub Pages works).

## 5. Conventions

- ES modules, `const`/`let`, no classes where a closure will do, no external utility libraries.
- Line numbers and columns in level data and the `s` facade are **1-based** (Vim convention); conversion to CodeMirror's 0-based offsets happens only inside `editor.js`.
- Level check/rule functions are pure with respect to `s`; they never touch DOM or storage.
- Dialogue strings live only in `dialogue.js` and `levels.js`. Engine code contains no player-facing text except Vim's own error messages.
- CSS: one file, custom properties for theme, BEM-ish class names (`hud__cover`, `panel--collapsed`).
- Browser support: current Chrome, Edge, Firefox, Safari. No polyfills.

## 6. Key technical approaches

- **Keystroke capture:** a capturing `keydown` listener on `document` classifies each key using the current Vim mode (read from the vim module's state), assigns cost (Constitution §6), and forwards it. Disabled keys are `preventDefault`ed and logged.
- **Cursor targets:** CodeMirror `Decoration.mark`/widget at computed offsets; positions are re-mapped through document changes so targets survive edits.
- **Buffers:** one `EditorState` per buffer kept in `buffers.js`. A window's `EditorView` displays a buffer's state; switching buffers swaps state (`view.setState`) after saving the outgoing state. Mirrored editing: when a buffer is shown in several windows, transactions from one view are re-dispatched to the others with `userEvent` tagged to prevent echo.
- **Windows:** `windows.js` owns the layout tree and a flexbox DOM; resize changes fractions; the focused window gets a highlighted border.
- **Ex commands:** all custom commands registered through `Vim.defineEx` in `vimext.js`, including `:q`, `:w`, `:wq`, `:e`, which override the module's defaults to route through `buffers.js`/level logic.
- **Rules timers:** a single `requestAnimationFrame` loop drives level time, trace meter, and `every.seconds` triggers; it pauses when the tab is hidden (`visibilitychange`).
- **Seeded RNG:** mulberry32 seeded with `levelId + attempt`.

---

# Document 3: ROADMAP

Each phase lists **deliverables**, then a **manual test script**. A phase is done when every test step passes on macOS (primary) and, where marked ⊞, on Windows or Linux too. No automated tests; the test scripts are the acceptance criteria and should be re-run as regression checks in later phases.

## Phase 0: Spike (risk retirement)

**Deliverables**
- `index.html` with import map, a single CodeMirror editor with Vim mode, a hard-coded buffer.
- Keystroke listener printing each key, mode, and cost to the console.
- `Vim.defineEx` smoke test: a `:hello` command printing to a message div.
- Register preloading test: set register `f` programmatically, confirm `\"fp` pastes it and `:reg` shows it.
- Mark survival test: set `ma`, insert lines above programmatically, confirm `'a` lands on the right line.
- `Ctrl-w` test page: detects platform, offers Focus Mode (fullscreen + Keyboard Lock), registers `beforeunload`; logs whether `Ctrl-w` reached the page.
- README with run instructions and pinned versions.

**Test script**
1. Serve the directory; the editor renders; typing `ihello<Esc>` inserts text and mode switches.
2. `dd`, `ciw`, `ci\"`, `Ctrl-v` + `I`, `qa...q` + `@a`, `:%s/a/b/g`, `.` all behave as in Vim.
3. Console shows costs: `dd` = 2.0, typed `hello` = 2.5, `Esc` = 1.0, 6th consecutive `l` = 2.0.
4. `:hello` prints in the message div.
5. `\"fp` pastes preloaded text; `:reg f` lists it.
6. Mark test passes.
7. ⊞ On Chromium (Windows/Linux): without Focus Mode `Ctrl-w` closes the tab (expected); with Focus Mode it is logged by the page.
8. ⊞ On Firefox: `Ctrl-w` triggers the \"Leave site?\" dialog; Cancel keeps the page.
9. Arrow keys and mouse clicks do nothing in the editor.

## Phase 1: Shell and level runner

**Deliverables**
- Full UI layout (header/HUD, editor area, side panel, status line, message line, key overlay), default green theme, responsive breakpoints per Constitution §11.3.
- Level schema loader; `levels.js` with two placeholder levels.
- Objectives evaluation after every transaction; checkboxes update.
- Cursor target rendering and `cursorAt` check.
- Extraction flow (`auto` and `wq`), completion screen with cost vs par and Ghost line.
- Hub (level select) with lock/unlock and best rank; `:q!` abort.
- `storage.js` with schema v1.
- Cost accounting and HUD `KEYS` readout; Cover computation (no failure events yet).

**Test script**
1. Open hub; only level 1 is unlocked; clicking/selecting it starts the level with intro lines advanced by Enter.
2. Move to the target; the objective checks; level auto-completes and shows rank and Ghost line.
3. A level with `extract: \"wq\"` does not complete until `:wq` is typed.
4. `:q!` mid-level returns to the hub; no progress recorded.
5. Reload the page; best rank persisted; next level unlocked.
6. Resize the browser to 1100px wide: side panel becomes a bottom drawer. At 900px: the \"wider terminal\" notice appears.
7. Key overlay shows the last 6 keys; `:keys` toggles it.
8. Cover label changes as cost passes 1×, 2×, 3×, 4× par.

## Phase 2: Acts 0–2, first playable

**Deliverables**
- All levels for Act 0, Act 1, Act 2, and Audit 1 (Constitution level list, Appendix A) with par, hints, Ghost lines, intro/outro dialogue.
- Relative line numbers introduced in 1.2 with a handler explanation; `options.relativenumber` per level.
- Toolkit panel with unlock highlighting and fade-on-use.
- `:hint` (three tiers, costs per §6), `:skip` (after 5 terminations).
- Termination flow (`SECURITY` overlay, `:e!` reload, attempt counter).
- Watchdog rule (2.5) via the rules engine: `every.keystrokes`, `s.revertUnsaved`, `s.fail`.
- Minimal dialogue engine: context pools for `spam_motion`, `used_arrows`, `used_mouse`, `forgot_save`, `protected_line`, `timeout`; termination insults tier 1–2 (hand-written only); praise per rank.

**Test script**
1. Play Act 0 through Audit 1 start to finish without reading code. Every level is completable in under 3 minutes by a player who knows only what prior levels taught.
2. 0.1: handler explains `:wq` and `:q!`; pressing an arrow key produces the arrow line once.
3. 1.2: relative numbers are on and explained; `5j` lands correctly.
4. 1.5: pressing `l` ten times produces the spam line and costs 2.0 from the 6th press.
5. 2.5: after 30 keystrokes without `:w`, unsaved edits revert, Cover drops one step, the `forgot_save` line appears. Saving prevents the revert.
6. Force termination on a Drill (exceed 4× par): overlay appears, Enter reloads, attempt counter increments, second termination shows a different (tier 2) insult.
7. Briefing levels never terminate, even at 10× par.
8. Toolkit shows newly unlocked commands highlighted; after 5 uses the highlight is gone.
9. `:hint` tiers escalate; tiers 2–3 add +5 cost in Drills but not Briefings.
10. Audit 1 requires `:wq`; rank is stored; career rank in the hub header updates.

## Phase 3: Dialogue system, full

**Deliverables**
- Grammar engine: slots, tiered pools, templates, `{Slot}` capitalisation, `{keys}/{par}/{attempt}/{level}` substitution.
- Shuffle bags, 20-line recent history persisted, re-roll on repeat.
- Selection order: level override → context pool → generated.
- Full pools: ≥8 entries per slot per applicable tier, ≥15 templates, ≥40 context lines, mercy lines, grudging-warmth pool, career-promotion lines.
- Content review pass against Constitution §10.2 (a checklist in `dialogue.js` header comment).

**Test script**
1. Terminate the same level 6 times: insults escalate in absurdity tier 1→4; mercy line after the 3rd; `:skip` offered after the 5th; no line repeats across the 6.
2. Generate 50 lines from the grammar (a `:debug insults 50` command exists for this); none violate §10.2; each reads as a sentence; capitalisation is correct.
3. Numbers in generated lines match the HUD (`{keys}`, `{par}`, `{attempt}`).
4. A level with a `banter.spam_motion` override uses it instead of the pool.
5. Reload the page: the recent-line history still prevents immediate repeats.
6. Typewriter effect is skippable with any key and absent under `prefers-reduced-motion`.

## Phase 4: Living-level engine and Acts 3–5

**Deliverables**
- Rules engine complete: all trigger types, `s` facade complete, seeded RNG, phases, `addObjective`, `volatile` objectives, trace meter, live scoring (`keys + ceil(seconds/2)`), tab-hidden pause.
- Act 3 (text objects) with the Sleepy Bots tripwire level.
- Act 4 (visual, `:s`, `:g`) with the Sysadmin level; `protectedLines`.
- Audit 2.
- Act 5 (macros, registers): dead drops, `:reg` display, uppercase-register append, editable macro level (paste `\"mp`, edit, `\"myy`, `@m`).

**Test script**
1. 3.4: silencing a bot then idling 25 keystrokes wakes it (text reverts, handler line, failure event). Silencing all bots in the right order completes the level.
2. 4.4: every 8 seconds a line is inserted above the cursor; marks are not yet taught, but `/` search still finds targets; editing a protected line fires `protected_line`.
3. Trace meter fills at `par.seconds × 1.5`, fires `timeout`, resets.
4. Live level completion shows keys and time separately; tier uses combined cost.
5. Switching browser tabs pauses time; returning resumes.
6. 5.3: `:reg f` shows the dead drop; `\"fp` pastes it. `\"Ayy` appends across lines; final objective checks the register contents.
7. 5.5: the preloaded macro fails when run as-is (stops mid-line as Vim would); paste, fix, yank back, run with count completes the level.
8. Replaying a live level produces identical Sysadmin/respawn behavior (seeded).

## Phase 5: Windows and Act 6

**Deliverables**
- `windows.js`: layout tree, flexbox rendering, per-window status lines, focus highlight.
- All window commands in Constitution §9.1, including counts, `:wincmd`, `<leader>w` alias (shown only in fallback mode), rearrange commands.
- Mirrored editing across views of the same buffer.
- `:q` semantics on last window; `E37`.
- Layout check helpers for objectives (`s.windows()` snapshot: count, dirs, fractions, focused id, buffer per window).
- Focus Mode (`:focus`, hub button), `beforeunload` guard while a level runs, `ctrlWMode` detection, Act 6 intro wording per mode.
- Act 6 levels 6.1–6.4 (6.4 includes the scrambling password rule and the \"close all windows before `:wq`\" objective).

**Test script**
1. `:sp` stacks, `:vsp` sides; status lines show names; `Ctrl-w hjkl` moves focus; `Ctrl-w w` cycles; `Ctrl-w p` returns.
2. `5 Ctrl-w >` widens by 5 columns; `Ctrl-w =` equalizes; `Ctrl-w _` maximizes; `:resize 5` sets height; minimum sizes hold.
3. `Ctrl-w c` closes the current window; `:only` leaves one; `Ctrl-w x` swaps; `Ctrl-w H` moves to the far left.
4. Same buffer in two windows: typing in one updates the other; undo is per window (documented).
5. `:q` on the last window with unsaved changes shows `E37`.
6. 6.3: the layout objective checks \"one tall left, two stacked right\".
7. 6.4: the password changes every 10 s; yank → `Ctrl-w l` → paste completes the objective; extraction refused while more than one window is open.
8. ⊞ Chromium Windows/Linux: Focus Mode enables `Ctrl-w`; leaving fullscreen shows the handler's warning.
9. ⊞ Firefox: `Ctrl-w` prompts \"Leave site?\"; `:wincmd l` and `<Space>wl` work; Toolkit labels the alias as game-only.

## Phase 6: Buffers, marks, Acts 7–8

**Deliverables**
- `buffers.js`: registry, `:ls` formatting with flags, `:b`/`:bn`/`:bp`/`Ctrl-^`/`:e`/`:bd`/`:wa`/`:wqa`/`:qa`, `E89`, `E162`, hidden buffers, alternate tracking, per-buffer last cursor.
- Marks: lowercase per buffer, uppercase global, `:marks`, `:delm`, mark mapping through edits; jumplist with `Ctrl-o`/`Ctrl-i`/`:jumps` across buffers.
- Cross-buffer rules.
- Act 7 (7.1–7.3) and Act 8 (8.1–8.3).

**Test script**
1. `:ls` output matches Vim's format and flags after switching, editing, and hiding.
2. `:b 2`, `:b vau<Tab>`-free prefix (`:b vau`), `Ctrl-^` toggles between the last two.
3. `:bd` on a modified buffer shows `E89`; `:bd!` works; `:qa` with a hidden modified buffer shows `E162`.
4. `ma` in buffer 1, `mB` in buffer 2; `'B` from buffer 1 switches buffer and lands on the line.
5. Sysadmin inserts lines above a mark; `'a` still lands on the same text.
6. `Ctrl-o` after `G`, `/foo`, `:b 2` walks back through buffers; `Ctrl-i` forward.
7. 7.3: editing the door config in buffer 2 rewrites the roster in buffer 3 with a handler line.
8. 8.3: completable only by using marks (no target reachable by line number within the time budget).

## Phase 7: Audits, Finale, content polish

**Deliverables**
- Finale F.1 (gauntlet) and F.2 (multi-phase boss using splits, buffers, marks, macros, registers `a`–`e`).
- Pass over all 40 levels: par values validated by playing each Ghost line and confirming its cost equals par; hints and Ghost lines present for every level.
- Career promotion lines; end-of-game screen with stats.
- `:export`/`:import`/`:reset`.

**Test script**
1. Play the whole game start to finish in one sitting (target: under 2.5 hours for a competent player).
2. Every level's Ghost line, typed exactly, yields GHOST rank.
3. F.2 phases advance in order; the register instructions are readable with `:reg a`…`:reg e`; the ending screen shows stats.
4. `:export` output pasted into `:import` on a fresh profile restores progress.
5. No level can be completed by accident (e.g. objectives already satisfied at start).

## Phase 8: Themes, responsiveness, accessibility, hardening

**Deliverables**
- Amber and grey themes; `:theme`; hub theme switcher; `:fontsize`.
- Responsive pass per Constitution §11.3 at 1280×720, 1440×900, 1920×1080, 2560×1440, and iPad landscape with external keyboard.
- `prefers-reduced-motion` honored (no typewriter, no scanlines).
- Error boundary: an exception inside a level rule shows a handler line (\"Something broke. Not you. Probably.\") and keeps the editor usable; `:q!` still works.
- README: adding a level, adding dialogue, pack structure.

**Test script**
1. Each theme renders all UI states (normal, error, target, focused window, SECURITY overlay) legibly.
2. All listed resolutions show the full HUD without overlap; drawer mode works at 1100px.
3. iPad with keyboard: all modes work, `Esc` works, no on-screen keyboard pops up during play.
4. Throw inside a rule (debug command): game continues; `:q!` returns to the hub.
5. Reduced-motion setting removes typewriter and scanlines.

## Phase 9: Pack loader

**Deliverables**
- Multi-pack loading; Toolkit grouping by pack; hub sections per pack; unlock rules per pack (core completion not required, but recommended note shown).
- A one-level sample pack (`packs/sample.js`) demonstrating the structure.

**Test script**
1. Adding `packs/sample.js` to `index.html` shows a new section in the hub; its level runs; its commands appear in the Toolkit under its group.
2. Removing it leaves core progress intact.

---

## Appendix A: Level List (core pack)

B = Briefing, D = Drill, J = Job, A = Audit, ⚡ = live, `wq` = requires `:wq`.

| Id | Title | Type | Teaches / twist |
|---|---|---|---|
| 0.1 | Day One | B `wq` | `hjkl`; handler name; `:q!` escape hatch |
| 0.2 | Typing Is for Amateurs | B `wq` | `i a o O Esc` |
| 0.3 | Sign Here | B `wq` | `:w`, `:wq`, fix a typo |
| 1.1 | Word Salad | B | `w b e` |
| 1.2 | Line Dancing | B | `0 ^ $ gg G { }`, counts; relative line numbers |
| 1.3 | Speed Lockpick | D | 8 targets |
| 1.4 | Precision Work | B | `f t ; , %` |
| 1.5 | The Vault Keypad | J | `/ n N *` in 200 lines; spam penalty introduced |
| 2.1 | Cleanup Crew | B | `x dd dw D u Ctrl-r` |
| 2.2 | Intern's Mistake | B | `cw cc C r s` |
| 2.3 | Dot and Paste | B | `. yy p P` |
| 2.4 | Clean Sweep | D | mixed |
| 2.5 | The Shredder Room | J | Watchdog: unsaved edits revert |
| A1 | Mandatory Compliance Training | A `wq` | Acts 0–2 |
| 3.1 | Inside Job | B | `ciw di\" ci\" ci(` |
| 3.2 | Around and About | B | `a` objects, `ci{ cit dap da\"` |
| 3.3 | Phishing Madlibs | D | speed |
| 3.4 | Sleepy Bots | J ⚡ | tripwire: bots wake after N keystrokes |
| 4.1 | Select and Conquer | B | `v V viw vip` + operators |
| 4.2 | Column Thinking | B | `Ctrl-v I A $A` |
| 4.3 | Find and Replace | B | `:s :%s///g :g :v` |
| 4.4 | The Paper Trail | J ⚡ | Sysadmin shifts lines; protected lines |
| A2 | Quarterly Review | A `wq` | Acts 0–4 |
| 5.1 | Copy-Paste Employee | B | `q @ @@` |
| 5.2 | Scale Up | B | `20@a`; macros stop on failure |
| 5.3 | Dead Drops | B | `:reg \"fp \"fyy \"Ayy` |
| 5.4 | Assembly Line | D | macro sprints |
| 5.5 | Borrowed Spell | J | fix a preloaded macro as text |
| 6.1 | Two Windows | B | `:sp :vsp Ctrl-w s v h j k l w p` |
| 6.2 | Tidy Desk | B | resize, close, `=`, `_`, `\\|`, `:only` |
| 6.3 | Cockpit | D | build layouts |
| 6.4 | The Copy Job | J ⚡ | scrambling password, cross-window yank, close all |
| 7.1 | The Network | B | `:ls :b :bn :bp Ctrl-^ :e` |
| 7.2 | Server Hopping | D | hidden/modified buffers, `:bd :wa E89 E162` |
| 7.3 | Chain Reaction | J ⚡ | cross-buffer consequences |
| 8.1 | Plant the Flag | B | `ma 'a \\`a`; marks follow text |
| 8.2 | Breadcrumbs | B | `Ctrl-o Ctrl-i '' :marks :jumps`, uppercase marks |
| 8.3 | Needle in 5000 | J ⚡ | huge drifting file |
| F1 | Exit Interview | A ⚡ `wq` | everything |
| F2 | The Compliance Dragon | J ⚡ | multi-phase boss; instructions in registers `a`–`e` |

## Appendix B: Supported command registry (core pack `commands`)

Groups: `motions`, `operators`, `textobjects`, `visual`, `search`, `exline`, `macros`, `registers`, `windows`, `buffers`, `marks`, `game`.

`game` group (always unlocked, shown dimmed): `:q!`, `:hint`, `:skip`, `:keys`, `:theme`, `:fontsize`, `:focus`, `:toolkit`, `:export`, `:import`, `:reset`.

Every command taught by a level must exist in this registry; the level loader warns in the console if a level's `unlocks` references an unknown id.