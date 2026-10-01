/** Build UI nodes with textContent rather than interpreting content as HTML. */
export function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** Create a native, keyboard-accessible button. */
export function button(text, onClick, className = '') {
  const node = element('button', className, text);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}
