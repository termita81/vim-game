import { RANKS, runRank } from '../game/scoring.js';
import { element } from './dom.js';

/** Mount the mission HUD once; update text without replacing the editor. */
export function mountHud(parent) {
  const hud = element('div', 'hud');
  const fields = {};
  for (const [id, label] of [
    ['cost', 'KEY COST'],
    ['rank', 'RUN RANK'],
    ['mode', 'VIM MODE'],
  ]) {
    const cell = element('div', 'hud-cell');
    fields[id] = element('strong');
    cell.append(element('span', 'label', label), fields[id]);
    hud.append(cell);
  }
  hud.append(element('span', 'briefing-badge', 'UNSCORED BRIEFING'));
  parent.append(hud);
  return (run) => {
    fields.cost.textContent = String(run.cost);
    fields.rank.textContent = RANKS[runRank(run.cost, run.level.par.keys, run.level.type)];
    fields.mode.textContent = run.mode.replace('-', ' ').toUpperCase();
  };
}
