import { cloneTemplate } from './dom.js';

/** Render the completed run without awarding career points for a Briefing. */
export function renderResult(parent, result, actions) {
  const section = cloneTemplate('result-template');
  const values = {
    mission: `EXTRACTION CONFIRMED / MISSION ${result.levelId}`,
    summary: `${result.title} · Reception access confirmed.`,
    cost: result.cost,
    par: result.par,
    rank: result.rank,
    solution: result.solution,
  };
  for (const [field, value] of Object.entries(values)) {
    section.querySelector(`[data-field="${field}"]`).textContent = String(value);
  }
  const hub = section.querySelector('[data-action="hub"]');
  hub.addEventListener('click', actions.hub);
  section.querySelector('[data-action="replay"]').addEventListener('click', actions.replay);
  parent.replaceChildren(section);
  hub.focus({ preventScroll: true });
}
