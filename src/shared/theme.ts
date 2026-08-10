export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'bachillera:theme';
const listeners = new Set<(theme: Theme) => void>();

const isTheme = (value: string | null): value is Theme =>
  value === 'dark' || value === 'light';

export const getCurrentTheme = (): Theme => {
  const attr = document.documentElement.getAttribute('data-theme');
  return isTheme(attr) ? attr : 'dark';
};

const preferredTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isTheme(stored)) return stored;
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const applyTheme = (theme: Theme, options: { persist?: boolean } = {}): void => {
  document.documentElement.setAttribute('data-theme', theme);
  if (options.persist) localStorage.setItem(STORAGE_KEY, theme);
  listeners.forEach((listener) => listener(theme));
};

export const toggleTheme = (): Theme => {
  const next: Theme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next, { persist: true });
  return next;
};

/** Applies the stored or OS-preferred theme. Call once per page entry. */
export const initTheme = (): Theme => {
  const theme = preferredTheme();
  applyTheme(theme);
  return theme;
};

export const onThemeChange = (callback: (theme: Theme) => void): (() => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
