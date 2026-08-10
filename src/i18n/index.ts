import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import esCommon from './locales/es/common.json';
import enCommon from './locales/en/common.json';

export type Locale = 'es' | 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['es', 'en'];
const FALLBACK_LOCALE: Locale = 'es';
const STORAGE_KEY = 'bachillera:lang';

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
  await i18next.use(LanguageDetector).init({
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    nonExplicitSupportedLngs: true,
    defaultNS: 'common',
    ns: ['common'],
    resources: {
      es: { common: esCommon },
      en: { common: enCommon },
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: STORAGE_KEY,
    },
  });

  bundles.forEach(({ locale, namespace, resources }) => {
    i18next.addResourceBundle(locale, namespace, resources, true, true);
  });

  syncDocumentLanguage();
  i18next.on('languageChanged', () => {
    syncDocumentLanguage();
    translateDom();
  });
};

export const t = (key: string, options?: Record<string, unknown>): string =>
  i18next.t(key, options);

export const currentLocale = (): Locale => {
  const resolved = i18next.resolvedLanguage;
  return SUPPORTED_LOCALES.includes(resolved as Locale) ? (resolved as Locale) : FALLBACK_LOCALE;
};

export const setLocale = async (locale: Locale): Promise<void> => {
  await i18next.changeLanguage(locale);
};

export const onLocaleChange = (callback: (locale: Locale) => void): void => {
  i18next.on('languageChanged', () => callback(currentLocale()));
};

const syncDocumentLanguage = (): void => {
  document.documentElement.lang = currentLocale();
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
