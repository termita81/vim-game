import { cloneTemplate } from './dom.js';

/** Render mission objectives and its currently taught controls, with tablet tabs. */
export function mountObjectives(parent, level) {
  const panel = cloneTemplate('objectives-template').firstElementChild;
  const objectives = panel.querySelector('.objectives-section');
  const controls = panel.querySelector('.controls-section');
  let selected = 0;
  const tabButtons = [...panel.querySelectorAll('.side-tab')];
  tabButtons.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        select(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - selected);
        tabButtons[selected].focus();
      }
    });
  });
  function select(index) {
    selected = index;
    panel.dataset.tab = String(index);
    tabButtons.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
  }
  select(0);
  const objectiveList = objectives.querySelector('.objectives-list');
  const extractionItem = objectiveList.querySelector('.extraction-item');
  const extraction = extractionItem.querySelector('.extraction-note');
  const items = level.objectives.map((objective) => {
    const row = cloneTemplate('objective-template').firstElementChild;
    const mark = row.querySelector('.objective-mark');
    row.querySelector('[data-field="text"]').textContent = objective.text;
    objectiveList.insertBefore(row, extractionItem);
    return { row, mark, objective };
  });
  const list = controls.querySelector('.controls-list');
  let escapeShortcut;
  for (const [keys, description] of level.controls) {
    const entry = cloneTemplate('reference-template');
    const shortcut = entry.querySelector('[data-field="keys"]');
    shortcut.textContent = keys;
    if (keys === 'Esc / Ctrl-[') escapeShortcut = shortcut;
    entry.querySelector('[data-field="description"]').textContent = description;
    list.append(entry);
  }
  parent.append(panel);
  return (run, settings = {}) => {
    if (escapeShortcut) {
      escapeShortcut.textContent = settings.escAlias === 'jk' ? 'jk' : 'Esc / Ctrl-[';
    }
    for (const { row, mark, objective } of items) {
      const complete = Boolean(run.objectives[objective.id]);
      row.classList.toggle('is-complete', complete);
      mark.textContent = complete ? '✓' : '○';
      row.setAttribute('aria-label', `${complete ? 'Complete' : 'Incomplete'}: ${objective.text}`);
    }
    extraction.textContent = run.ready
      ? 'Extraction ready — :wq ↵'
      : 'Reach the terminal, then :wq ↵ to extract.';
    extractionItem.classList.toggle('is-ready', run.ready);
  };
}
