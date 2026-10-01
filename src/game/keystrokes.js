const modifiers = new Set(['Control', 'Shift', 'Alt', 'Meta', 'AltGraph']);

/** Cost of one physical key, classified BEFORE Vim changes its mode. */
export function keyCost(event, mode) {
  if (modifiers.has(event.key) || event.metaKey) return 0;
  const printable = event.key.length === 1 && !event.ctrlKey && !event.altKey;
  if (mode === 'insert' && (printable || ['Enter', 'Backspace'].includes(event.key))) return 0.5;
  if (mode === 'command-line' && (printable || ['Backspace', 'Delete'].includes(event.key))) return 0.5;
  return 1;
}

/** Format a physical key for the overlay; modifier-only presses have no keycap. */
export function keyLabel(event) {
  if (modifiers.has(event.key) || event.metaKey) return null;
  if (event.ctrlKey) return `^${event.key.toUpperCase()}`;
  if (event.altKey) return `Alt+${event.key}`;
  return ({ ' ': 'Space', Escape: 'Esc', Enter: '↵', Backspace: '⌫' })[event.key] || event.key;
}
