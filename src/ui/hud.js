import { RANKS, runRank } from '../game/scoring.js';
import { cloneTemplate } from './dom.js';

/** Mount the mission HUD once; update text without replacing the editor. */
export function mountHud(parent) {
  const hud = cloneTemplate('hud-template');
  const fields = Object.fromEntries(
    ['cost', 'rank', 'mode'].map((id) => [id, hud.querySelector(`[data-field="${id}"]`)]),
  );
  parent.append(hud);
  return (run) => {
    fields.cost.textContent = String(run.cost);
    fields.rank.textContent = RANKS[runRank(run.cost, run.level.par.keys, run.level.type)];
    fields.mode.textContent = run.mode.replace('-', ' ').toUpperCase();
  };
}
