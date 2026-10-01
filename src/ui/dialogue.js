import { element, button } from './dom.js';

/** Mount the handler panel with explicit intro/outro progression. */
export function mountDialogue(parent, actions) {
  const panel = element('section', 'dialogue-panel');
  panel.setAttribute('aria-label', 'Handler dialogue');
  const identity = element('span', 'handler-label', ':wq / HANDLER');
  const message = element('p'); message.setAttribute('role', 'status');
  const controls = element('div', 'dialogue-actions');
  const next = button('Continue →', actions.next, 'primary-button');
  const skip = button('Skip briefing', actions.skip, 'text-button');
  const position = element('span', 'muted');
  controls.append(position, skip, next); panel.append(identity, message, controls); parent.append(panel);
  return {
    update(run) {
      message.textContent = run.message;
      controls.hidden = run.phase === 'playing';
      skip.hidden = run.phase !== 'intro';
      next.textContent = run.phase === 'outro' ? 'View debrief →' :
        run.dialogueIndex === run.level.dialogue.intro.length - 1 ? 'Begin mission →' : 'Continue →';
      position.textContent = run.phase === 'intro' ? `${run.dialogueIndex + 1} / ${run.level.dialogue.intro.length}` : 'EXTRACTION CONFIRMED';
    },
    focus: () => next.focus({ preventScroll: true }),
  };
}
