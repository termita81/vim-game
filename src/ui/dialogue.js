import { cloneTemplate } from './dom.js';

/** Mount the handler panel with explicit intro/outro progression. */
export function mountDialogue(parent, actions) {
  const panel = cloneTemplate('dialogue-template');
  const message = panel.querySelector('[data-field="message"]');
  const controls = panel.querySelector('.dialogue-actions');
  const next = panel.querySelector('[data-action="next"]');
  const skip = panel.querySelector('[data-action="skip"]');
  const position = panel.querySelector('[data-field="position"]');
  next.addEventListener('click', actions.next);
  skip.addEventListener('click', actions.skip);
  parent.append(panel);
  return {
    update(run) {
      message.textContent = run.message;
      controls.hidden = run.phase === 'playing';
      skip.hidden = run.phase !== 'intro';
      next.textContent =
        run.phase === 'outro'
          ? 'View debrief →'
          : run.dialogueIndex === run.level.dialogue.intro.length - 1
            ? 'Begin mission →'
            : 'Continue →';
      position.textContent =
        run.phase === 'intro'
          ? `${run.dialogueIndex + 1} / ${run.level.dialogue.intro.length}`
          : 'EXTRACTION CONFIRMED';
    },
    focus: () => next.focus({ preventScroll: true }),
  };
}
