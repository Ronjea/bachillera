export type Theme = 'light';

// The site has a single light theme (dark mode was removed by request).
// This module is an inert shim kept only while the map port is in flight;
// it will be deleted once no module imports it.

export const getCurrentTheme = (): Theme => 'light';

export const applyTheme = (): void => {};

export const initTheme = (): Theme => 'light';

export const onThemeChange = (_callback: (theme: Theme) => void): (() => void) => () => {};
