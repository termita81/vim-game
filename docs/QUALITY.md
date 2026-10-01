# Testing and linting

## Policy

On 2026-10-01 the owner approved replacing the no-automated-tests policy with targeted automated tests plus manual playtests. The roadmap, tech stack, and constitution decision log reflect that decision.

Automate deterministic behavior and important regressions. Keep manual playtests for fun, teaching clarity, visuals, Vim/Neovim fidelity, and physical browser shortcuts. Automated checks cannot establish Windows Ctrl-w delivery. The owner's report of getting stuck in insert mode remains open in `SPIKE-FINDINGS.md`; this tooling change does not fix it.

## Commands

Use Node `^22.13.0 || >=24` and npm:

```sh
npm ci
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

Add tests as those systems are implemented; do not invent an engine just to populate a suite. **There are currently no committed automated tests.** A successful `npm test` with zero tests only confirms the command runs, not that game behavior is verified.

A small browser integration suite is appropriate later for mode transitions, synchronization, undo, and marks. Choose its runner when needed; no browser test package is installed now. Do not treat a mocked DOM or synthetic shortcut as proof of real browser/OS behavior.

No coverage percentage target, broad UI snapshots, or tests that merely duplicate private implementation steps. Test changes where they can prevent a meaningful regression. Every phase retains its owner playtest and exit criteria.

## Linting assessment and configuration

**ESLint is useful now.** It checks JavaScript syntax and common mistakes without requiring a bundler or changing CDN imports. The flat config uses `@eslint/js` recommended rules with ES2022 module syntax. Browser globals apply to `src/` and tool JavaScript; Node globals apply to tests and the ESLint config. Additional rules require strict equality, prohibit `var`, and prefer `const` when bindings never change. `npm run lint` fails on errors or warnings.

Tooling versions are pinned in `package.json` and its lockfile: ESLint 10.11.0, `@eslint/js` 10.0.1, and `globals` 17.13.0. Node's built-in runner needs no third-party test package.

The current setup lints JavaScript only. It does not validate HTML, CSS, import-map resolution, browser compatibility, or third-party Vim APIs. Recommended lint rules will not catch a misspelled property on an untyped editor object. Keep the editor playtests and dependency checks.

Formatting remains the repository's existing conventions; no formatter or stylistic plugin is added. HTML/CSS linters can be considered if defects there become frequent, but adding them now would mostly increase configuration. No import-resolution plugin is needed: browser import maps resolve CDN package names independently of local npm installs.

Vendored dependencies, generated output, and coverage are excluded. Tool source is checked so the diagnostic pages remain maintainable. Do not suppress genuine errors merely to get a clean run.

## Sources

- [ESLint setup and recommended rules](https://eslint.org/docs/latest/use/getting-started)
- [ESLint language options and environment globals](https://eslint.org/docs/latest/use/configure/language-options)
- [Node built-in test runner](https://nodejs.org/api/test.html)
