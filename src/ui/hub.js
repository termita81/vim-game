import { cloneTemplate } from './dom.js';
import { RANKS } from '../game/scoring.js';

/** Render the hub for the currently available pack; Briefings don't promote career rank. */
export function renderHub(parent, pack, save, start, reset) {
  const hub = cloneTemplate('hub-template');
  hub.querySelector('[data-action="reset-journey"]').addEventListener('click', reset);
  const assignments = hub.querySelector('[data-field="assignments"]');
  for (const level of pack.levels) {
    const progress = save.progress[level.id];
    const card = cloneTemplate('mission-card-template');
    card.querySelector('[data-field="number"]').textContent = level.id;
    card.querySelector('[data-field="title"]').textContent = level.title;
    card.querySelector('[data-field="completion"]').textContent = progress?.completed
      ? `✓ Completed · best ${RANKS[progress.bestRank]} · ${progress.bestPoints} keys`
      : '◆ Unlocked';
    const launch = card.querySelector('[data-action="launch"]');
    launch.textContent = progress?.completed ? 'Replay briefing →' : 'Start briefing →';
    launch.addEventListener('click', () => start(level.id));
    assignments.append(card);
  }
  parent.replaceChildren(hub);
}
