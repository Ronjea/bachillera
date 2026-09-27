/** Reads a layer-toggle checkbox, falling back to `fallback` (the
 *  checkbox's default in mapa.html) if the element is missing. */
export const isChecked = (selector: string, fallback: boolean): boolean =>
  document.querySelector<HTMLInputElement>(selector)?.checked ?? fallback;
