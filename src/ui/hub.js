import { element, button } from './dom.js';
import { RANKS } from '../game/scoring.js';

/** Render the hub for the currently available pack; Briefings don't promote career rank. */
export function renderHub(parent, pack, save, start) {
  const hub = element('section', 'hub');
  hub.setAttribute('aria-labelledby', 'hub-title');
  const welcome = element('div', 'hub-welcome');
  welcome.append(element('p', 'eyebrow', 'FREELANCE OPERATIONS / MERIDIAN CORPORATION'));
  const title = element('h1', '', 'Every keystroke\nleaves a trace.'); title.id = 'hub-title';
  welcome.append(title, element('p', 'hub-summary', 'Your cover is an employee badge. Your only tool is Vim. Try to look like you belong here.'));
  const career = element('div', 'career');
  career.append(element('span', 'label', 'CAREER RANK'), element('strong', '', 'Intern'), element('span', 'muted', 'Probationary. Naturally.'));
  welcome.append(career);
  const assignments = element('section', 'assignments');
  assignments.append(element('h2', 'section-heading', 'Available assignments'), element('span', 'assignment-count', '01'));
  for (const level of pack.levels) {
    const progress = save.progress[level.id];
    const card = element('article', 'mission-card');
    const number = element('span', 'mission-number', level.id);
    const body = element('div', 'mission-card-body');
    body.append(element('p', 'eyebrow', 'ACT 0 / ONBOARDING'), element('h3', '', level.title),
      element('p', 'muted', 'Find reception. Learn to move without leaving fingerprints.'),
      element('p', 'mission-meta', 'BRIEFING · UNSCORED · NO TERMINATION'));
    if (progress?.completed) body.append(element('p', 'completion', `✓ Completed · best ${RANKS[progress.bestRank]} · ${progress.bestPoints} keys`));
    else body.append(element('p', 'completion', '◆ Unlocked'));
    const launch = button(progress?.completed ? 'Replay briefing →' : 'Start briefing →', () => start(level.id), 'primary-button');
    card.append(number, body, launch); assignments.append(card);
  }
  const handler = element('aside', 'hub-handler');
  handler.append(element('span', 'handler-label', ':wq / YOUR HANDLER'),
    element('p', '', '“Your predecessor used forty keystrokes to find reception. He now works somewhere with fewer doors.”'));
  hub.append(welcome, assignments, handler); parent.replaceChildren(hub);
}
