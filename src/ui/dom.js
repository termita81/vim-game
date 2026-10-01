/** Clone inert HTML markup; callers bind data and actions within the fragment. */
export function cloneTemplate(id) {
  const template = document.getElementById(id);
  if (!(template instanceof HTMLTemplateElement)) {
    throw new Error(`Missing HTML template: ${id}`);
  }
  return template.content.cloneNode(true);
}
