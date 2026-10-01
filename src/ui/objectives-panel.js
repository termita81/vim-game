import { element, button } from './dom.js';

/** Render mission objectives and its currently taught controls, with tablet tabs. */
export function mountObjectives(parent, level) {
  const panel = element('aside', 'side-panel');
  const tabs = element('div', 'side-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Mission reference');
  const objectives = element('section', 'objectives-section'); objectives.id = 'objectives-tabpanel';
  const controls = element('section', 'controls-section'); controls.id = 'controls-tabpanel';
  const sections = [objectives, controls];
  let selected = 0;
  const tabButtons = ['Objectives', 'Controls'].map((title, index) => {
    const tab = button(title, () => select(index), 'side-tab');
    tab.id = `side-tab-${index}`; tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', sections[index].id);
    sections[index].setAttribute('role', 'tabpanel'); sections[index].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); select(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - selected); tabButtons[selected].focus();
      }
    });
    tabs.append(tab); return tab;
  });
  function select(index) {
    selected = index; panel.dataset.tab = String(index);
    tabButtons.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
  }
  select(0);
  objectives.append(element('h2', 'section-heading', 'Mission objectives'));
  const items = level.objectives.map((objective) => {
    const row = element('div', 'objective');
    const mark = element('span', 'objective-mark', '○'); mark.setAttribute('aria-hidden', 'true');
    const text = element('p', '', objective.text); row.append(mark, text); objectives.append(row);
    return { row, mark, objective };
  });
  const extraction = element('p', 'extraction-note', 'Reach the terminal, then :wq ↵ to extract.');
  objectives.append(extraction, element('p', 'muted objective-help', 'Keep the map intact. If you accidentally edit it, :e! restores a fresh copy.'));
  controls.append(element('h2', 'section-heading', 'Field reference'));
  const motions = element('div', 'motion-grid');
  for (const [keys, description] of level.controls.slice(0, 4)) {
    const motion = element('div'); motion.append(element('kbd', '', keys), element('span', '', description)); motions.append(motion);
  }
  controls.append(motions);
  const list = element('dl', 'controls-list');
  for (const [keys, description] of level.controls.slice(4)) {
    list.append(element('dt', '', keys), element('dd', '', description));
  }
  controls.append(list); panel.append(tabs, objectives, controls); parent.append(panel);
  return (run) => {
    for (const { row, mark, objective } of items) {
      const complete = Boolean(run.objectives[objective.id]);
      row.classList.toggle('is-complete', complete); mark.textContent = complete ? '✓' : '○';
      row.setAttribute('aria-label', `${complete ? 'Complete' : 'Incomplete'}: ${objective.text}`);
    }
    extraction.textContent = run.ready ? '◆ Extraction ready — :wq ↵' : 'Reach the terminal, then :wq ↵ to extract.';
    extraction.classList.toggle('is-ready', run.ready);
  };
}
