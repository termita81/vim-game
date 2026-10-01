# Ghost Protocol

A browser game for learning Vim through play. The current implementation is the Phase 0 editor spike.

Run from this directory:

```sh
python3 -m http.server 8000
```

Open [the spike](http://localhost:8000/tools/spike.html) or [Key Lab](http://localhost:8000/tools/keylab.html). The editor loads pinned ES modules from esm.sh and needs internet access; there is no build step. Use a desktop browser and keyboard.

The spike includes Vim editing, programmatic replay, a preloaded register, relative numbers, buffer-swap and synchronized-view experiments, custom ex commands, and a mode/input log. Quit/edit/write commands report interception only; there is no playable level yet.

See [spike findings](docs/SPIKE-FINDINGS.md) for decisions and pending manual checks, [fidelity notes](docs/FIDELITY.md), and [the roadmap](specs/roadmap.md). Verification combines targeted automated tests with the roadmap's manual playtests. See [quality checks](docs/QUALITY.md).


For development checks, use Node 22.13+ on the 22.x line or Node 24+:

```sh
npm ci
npm run lint
npm test
```

`npm run check` runs both commands. ESLint is development-only; serving the game still needs no npm install or build step. There are currently no committed automated tests; they will be added with game logic from Phase 1 onward.
