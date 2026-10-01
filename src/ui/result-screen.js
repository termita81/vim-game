import { element, button } from './dom.js';

/** Render the completed run without awarding career points for a Briefing. */
export function renderResult(parent, result, actions) {
  const section = element('section', 'result-screen');
  section.setAttribute('aria-labelledby', 'result-title');
  section.append(element('p', 'eyebrow', `EXTRACTION CONFIRMED / MISSION ${result.levelId}`));
  const title = element('h1', '', 'You’re in.'); title.id = 'result-title';
  section.append(title, element('p', 'muted', `${result.title} · Reception access confirmed.`));
  const stats = element('div', 'result-stats');
  for (const [label, value] of [['KEY COST', result.cost], ['REFERENCE PAR', result.par], ['RUN RANK', result.rank]]) {
    const cell = element('div'); cell.append(element('span', 'label', label), element('strong', '', String(value))); stats.append(cell);
  }
  section.append(stats, element('p', 'result-note', 'This was an unscored briefing. Your career rank stays Intern; practice as often as you like.'));
  const solution = element('details', 'solution');
  solution.append(element('summary', '', 'See the reference route'), element('code', '', result.solution),
    element('p', 'muted', 'From the starting position: three steps down, ten right, then save and quit.'));
  const controls = element('div', 'result-actions');
  controls.append(button('Back to assignments →', actions.hub, 'primary-button'), button('Replay briefing', actions.replay, 'text-button'));
  section.append(solution, controls); parent.replaceChildren(section); controls.firstChild.focus({ preventScroll: true });
}
