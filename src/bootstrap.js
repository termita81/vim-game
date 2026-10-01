// Keep a useful error on the page even when CDN imports cannot be fetched.
import('./spike.js').catch((error) => {
  document.getElementById('status').textContent = `Editor failed to load: ${error.message}. Check CDN access and the browser console.`;
  document.querySelectorAll('.toolbar button').forEach((button) => { button.disabled = true; });
  console.error('Spike initialization failed', error);
});
