export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function bindOnce(element, key, binder) {
  if (!element) return;
  const attr = `bound${key}`;
  if (element.dataset && element.dataset[attr] === 'true') return;
  if (element.dataset) element.dataset[attr] = 'true';
  binder(element);
}
