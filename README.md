# Ghost Protocol

A silent browser game for learning Vim through play. Phase 1 includes the mission hub and the playable **0.1 — Day One** briefing.

Run from this directory:

```sh
python3 -m http.server 8000
```

Open [the game](http://localhost:8000/). Use a desktop browser or tablet with a hardware keyboard and a viewport at least 768×600; 1280×720 or larger is recommended. The editor loads pinned ES modules from esm.sh; internet access is required. There is no build step or npm installation needed to play.

Start Day One, read or skip the handler's briefing, and use `hjkl` to put your cursor on the ◆. Type `:wq` and Enter to extract. `:q!` aborts to the hub; `:e!` restarts. Escape or Ctrl-[ returns to normal mode. Keep the map intact; this first briefing is unscored and cannot terminate you.

Settings offer green, amber, and grey themes; S/M/L editor fonts; a keystroke overlay; and an optional, non-standard `jk` Escape alias. Settings and completed-run records persist in localStorage. Corrupt or unsupported saves require confirmation before resetting; declining keeps the original save and plays without persistence.

Developer tools remain separate: [editor spike](http://localhost:8000/tools/spike.html) and [Key Lab](http://localhost:8000/tools/keylab.html).

For development checks, use Node 22.13+ on the 22.x line or Node 24+:

```sh
npm ci
npm run check
```

This runs ESLint and targeted Node tests. Tests cover core flow, objectives, cost, persistence, and shortcut handling order. No bundler or transpiler is used.

See [Phase 1 verification and owner playtest](docs/PHASE-1.md), [quality policy](docs/QUALITY.md), [spike findings](docs/SPIKE-FINDINGS.md), [fidelity notes](docs/FIDELITY.md), and [the roadmap](specs/roadmap.md).
