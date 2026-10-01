const $ = (id) => document.getElementById(id);
const entries = [];
const environment = {
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  keyboardLockAvailable: typeof navigator.keyboard?.lock === 'function',
};
function log(entry) {
  entries.unshift({ time: new Date().toISOString(), ...entry });
  $('events').textContent = entries
    .slice(0, 100)
    .map((item) => JSON.stringify(item))
    .join('\n');
}
function status(message) {
  $('status').textContent = message;
  log({ message });
}
log({ environment });
document.addEventListener(
  'keydown',
  (event) => {
    const entry = {
      key: event.key,
      code: event.code,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
      repeat: event.repeat,
      fullscreen: !!document.fullscreenElement,
      defaultPreventedAtCapture: event.defaultPrevented,
    };
    if (
      event.ctrlKey &&
      ['w', 'o', 'r', 'u', 'd', 'f', '^', '6', '[', 'v'].includes(event.key.toLowerCase())
    )
      event.preventDefault();
    log({ ...entry, defaultPreventedAfterHandler: event.defaultPrevented });
  },
  true,
);
$('fullscreen').onclick = async () => {
  try {
    await document.documentElement.requestFullscreen();
    if (typeof navigator.keyboard?.lock === 'function') {
      await navigator.keyboard.lock(['KeyW']);
      status('Fullscreen entered; KeyW lock promise resolved. Test a physical Ctrl-w now.');
    } else
      status(
        'Fullscreen entered; Keyboard Lock is unavailable. Test delivery and record the result.',
      );
    $('target').focus();
  } catch (error) {
    status(`Fullscreen / lock failed: ${error.message}`);
  }
};
$('exit').onclick = async () => {
  navigator.keyboard?.unlock?.();
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch (error) {
    status(`Exit failed: ${error.message}`);
  }
};
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    navigator.keyboard?.unlock?.();
    status('Normal browser mode; keyboard unlocked.');
  }
});
window.addEventListener('beforeunload', (event) => {
  if (!$('guard').checked) return;
  event.preventDefault();
  event.returnValue = '';
});
$('clear').onclick = () => {
  entries.length = 0;
  $('events').textContent = '';
};
$('download').onclick = () => {
  const file = new Blob(
    [JSON.stringify({ environment, notes: $('notes').value, entries }, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'keylab-observations.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
