import { element } from './dom.js';

/** Show recent physical keys; remove them after two seconds and clean up timers. */
export function keyOverlay(parent) {
  const host = element('div', 'key-overlay');
  host.setAttribute('aria-hidden', 'true');
  parent.append(host);
  const timers = new Map();
  function clear() {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    host.replaceChildren();
  }
  return {
    push(label) {
      const cap = element('kbd', 'keycap', label);
      host.append(cap);
      timers.set(
        cap,
        setTimeout(() => {
          cap.remove();
          timers.delete(cap);
        }, 2000),
      );
      if (host.children.length > 8) {
        const oldest = host.firstChild;
        clearTimeout(timers.get(oldest));
        timers.delete(oldest);
        oldest.remove();
      }
    },
    clear,
    destroy() {
      clear();
      host.remove();
    },
  };
}
