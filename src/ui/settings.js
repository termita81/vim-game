/** Connect native settings controls to the shared store; changes persist immediately. */
export function mountSettings(dialog, store, onClose) {
  const controls = [...dialog.querySelectorAll('[name]')];
  function sync(settings) {
    for (const input of controls) {
      if (input.type === 'checkbox') input.checked = settings[input.name];
      else input.value = settings[input.name];
    }
  }
  for (const input of controls) input.addEventListener('change', () => {
    const value = input.type === 'checkbox' ? input.checked : input.value;
    store.update((state) => ({ ...state, save: { ...state.save,
      settings: { ...state.save.settings, [input.name]: value } } }));
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', onClose);
  return () => { sync(store.getState().save.settings); dialog.showModal(); };
}
