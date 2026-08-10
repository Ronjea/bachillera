import i18next from 'i18next';
import esCommon from './locales/es/common.json';

// The site is Spanish-only by request. The i18n plumbing stays so a new
// language is just an extra locale folder + registering its bundles.
export type Locale = 'es';

export const SUPPORTED_LOCALES: readonly Locale[] = ['es'];
const LOCALE: Locale = 'es';

export type ResourceBundle = {
  locale: Locale;
  namespace: string;
  resources: Record<string, unknown>;
};

/**
 * Initializes i18next with the shared "common" namespace. Each page entry
 * registers its own namespaces via `bundles` so unrelated pages don't ship
 * each other's strings.
 */
export const initI18n = async (bundles: ResourceBundle[] = []): Promise<void> => {
  await i18next.init({
    lng: LOCALE,
    fallbackLng: LOCALE,
    defaultNS: 'common',
    ns: ['common'],
    resources: {
      es: { common: esCommon },
    },
    interpolation: { escapeValue: false },
  });

  bundles.forEach(({ locale, namespace, resources }) => {
    i18next.addResourceBundle(locale, namespace, resources, true, true);
  });

  document.documentElement.lang = LOCALE;
};

export const t = (key: string, options?: Record<string, unknown>): string =>
  i18next.t(key, options);

export const currentLocale = (): Locale => LOCALE;

/** Kept for API compatibility; with a single locale it never fires. */
export const onLocaleChange = (callback: (locale: Locale) => void): void => {
  i18next.on('languageChanged', () => callback(LOCALE));
};

/**
 * Applies translations to static markup:
 * - `data-i18n="ns:key"` sets textContent
 * - `data-i18n-html="ns:key"` sets innerHTML (for strings with safe inline markup)
 * - `data-i18n-attr="attr:ns:key;attr2:ns:key2"` sets attributes
 */
export const translateDom = (root: ParentNode = document): void => {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.dataset.i18nHtml;
    if (key) el.innerHTML = t(key);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    const spec = el.dataset.i18nAttr;
    if (!spec) return;
    spec.split(';').forEach((pair) => {
      const [attr, ...keyParts] = pair.split(':');
      const key = keyParts.join(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
};
