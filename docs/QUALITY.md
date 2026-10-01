# Testing and linting

## Policy

On 2026-10-01 the owner approved replacing the no-automated-tests policy with targeted automated tests plus manual playtests. The roadmap, tech stack, and constitution decision log reflect that decision.

Automate deterministic behavior and important regressions. Keep manual playtests for fun, teaching clarity, visuals, Vim/Neovim fidelity, and physical browser shortcuts. Automated checks cannot establish Windows Ctrl-w delivery. The owner's insert-mode report was investigated during Phase 1: a Ctrl-[ capture-order bug was reproduced and fixed; original-sequence/owner confirmation remains pending in `SPIKE-FINDINGS.md`.

## Commands

Use Node `^22.13.0 || >=24` and npm:

```sh
npm ci
npm run format
npm run format:check
npm run lint
npm test
npm run check
```

The browser app still uses pinned CDN modules and a static server. Node and npm are development tools only. No build step or new runtime dependency is introduced.

## Automated tests

Use `node:test` and `node:assert/strict`; files live under `tests/` and end in `.test.js`. Import pure ES modules directly. Keep game logic independent of DOM/editor adapters so scoring, rules, objectives, and saves can be tested without a browser.

Prioritize:

- Weighted keystrokes, zero-cost replay, spam streak resets, and rank/termination boundaries.
- Objectives becoming true together, sticky objectives, and extraction requiring the correct command.
- Rule scheduling, guards, cooldowns, and prevention of duplicate firing.
- Save round-trips, migrations, corrupt data, and unknown versions.
- Buffer/window state, modified-buffer guards, synchronization, and undo/mark regressions.

Add tests as those systems are implemented; do not invent an engine just to populate a suite. **Phase 1 now includes 22 Node tests** for core flow, objectives, cost, persistence, and input-capture ordering. See `PHASE-1.md` for coverage and browser verification. A successful command with zero tests must never be presented as verification of game behavior.

A small browser integration suite is appropriate later for mode transitions, synchronization, undo, and marks. Choose its runner when needed; no browser test package is installed now. Do not treat a mocked DOM or synthetic shortcut as proof of real browser/OS behavior.

No coverage percentage target, broad UI snapshots, or tests that merely duplicate private implementation steps. Test changes where they can prevent a meaningful regression. Every phase retains its owner playtest and exit criteria.

## Linting assessment and configuration

**ESLint is useful now.** It checks JavaScript syntax and common mistakes without requiring a bundler or changing CDN imports. The flat config uses `@eslint/js` recommended rules with ES2022 module syntax. Browser globals apply to `src/` and tool JavaScript; Node globals apply to tests and the ESLint config. Additional rules require strict equality, prohibit `var`, and prefer `const` when bindings never change. `npm run lint` fails on errors or warnings.

Tooling versions are pinned in `package.json` and its lockfile: ESLint 10.11.0, `@eslint/js` 10.0.1, and `globals` 17.13.0. Node's built-in runner needs no third-party test package.

The current setup lints JavaScript only. It does not validate HTML, CSS, import-map resolution, browser compatibility, or third-party Vim APIs. Recommended lint rules will not catch a misspelled property on an untyped editor object. Keep the editor playtests and dependency checks.

Prettier 3.9.9 is pinned as a development dependency and runs separately from ESLint. `.prettierrc.json` sets two-space indentation, single quotes, semicolons, trailing commas, and a 100-character target width. `npm run format` formats supported project files, including JavaScript, HTML, CSS, JSON, and Markdown; `npm run format:check` checks without writing. `npm run check` requires formatting, lint, and tests to pass. `.prettierignore` excludes dependencies, vendored/generated files, the npm-managed lockfile, and brainstorming archives. Keep meaningful names and clear function structure: a formatter only enforces layout. HTML/CSS linters can be considered if defects there become frequent, but adding them now would mostly increase configuration. No import-resolution plugin is needed: browser import maps resolve CDN package names independently of local npm installs.

Vendored dependencies, generated output, and coverage are excluded. Tool source is checked so the diagnostic pages remain maintainable. Do not suppress genuine errors merely to get a clean run.

## Template refactor verification — 2026-10-01

The player UI now clones native HTML templates. Formatting, ESLint, and all 22 existing Node tests pass. A temporary DOM harness outside the repository checked template cloning (including multi-element fragments), missing-template errors, launch/result actions, HUD bindings, safe text rendering, objective completion, reference tab selection, dialogue visibility, and keycap expiry/cleanup. No test dependency was added to the project. These DOM checks do not establish browser rendering, keyboard focus, or CodeMirror integration.

Pending browser checks: hub → briefing → play → extraction → result → replay; abort and restart; settings persistence; header visibility; keyboard reference-tab navigation and focus restoration; desktop/compact layouts in all three themes; and repeated navigation with no extra editors or keycaps. No browser executable or browser connector was available during this refactor.

## Sources

- [ESLint setup and recommended rules](https://eslint.org/docs/latest/use/getting-started)
- [ESLint language options and environment globals](https://eslint.org/docs/latest/use/configure/language-options)
- [Node built-in test runner](https://nodejs.org/api/test.html)
