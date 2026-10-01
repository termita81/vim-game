import { Compartment } from '@codemirror/state';
import { lineNumbers } from '@codemirror/view';

/** A per-view gutter controller; Vim's option callback selects its configuration. */
export function relativeNumbers() {
  const compartment = new Compartment();
  let enabled = false;
  const gutter = () => lineNumbers({
    formatNumber(number, state) {
      if (!enabled) return String(number);
      const current = state.doc.lineAt(state.selection.main.head).number;
      return String(number === current ? number : Math.abs(number - current));
    },
    // Cursor movement must redraw the gutter, even when the document is unchanged.
    domEventHandlers: {},
  });
  return {
    extension: compartment.of(gutter()),
    set(view, value) {
      enabled = value;
      view.dispatch({ effects: compartment.reconfigure(gutter()) });
    },
    get enabled() { return enabled; },
  };
}
