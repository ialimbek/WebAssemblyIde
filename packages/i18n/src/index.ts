/**
 * @webassembly-ide/i18n
 *
 * Minimal internationalization runtime — locale registry, message lookup,
 * pluralization, and ICU-style placeholder substitution. The library is
 * dependency-free and works equally well in the browser and Node tests.
 *
 * Locales are registered up-front as plain message maps:
 *
 *   const en = { "menu.file": "File", "tabs.count": "{count} open tabs" };
 *   const tr = { "menu.file": "Dosya", "tabs.count": "{count} açık sekme" };
 *
 *   const i18n = new I18n({ defaultLocale: "en", fallbackLocale: "en" });
 *   i18n.registerLocale("en", en);
 *   i18n.registerLocale("tr", tr);
 *
 *   i18n.t("menu.file");                         // "File"
 *   i18n.setLocale("tr");
 *   i18n.t("tabs.count", { count: 4 });         // "4 açık sekme"
 *   i18n.t("missing.key", undefined, "Fallback"); // "Fallback"
 */

export type LocaleCode = string;

export type MessageMap = Record<string, string>;

export interface I18nConfig {
  /** Active locale on construction (defaults to "en"). */
  defaultLocale?: LocaleCode;
  /** Fallback locale used when a key is missing from the active locale. */
  fallbackLocale?: LocaleCode;
}

export type LocaleChangeListener = (locale: LocaleCode) => void;

const DEFAULT_LOCALE: LocaleCode = "en";

/**
 * Lightweight i18n service used by the shell and panels.
 */
export class I18n {
  private locales = new Map<LocaleCode, MessageMap>();
  private activeLocale: LocaleCode;
  private fallbackLocale: LocaleCode;
  private listeners = new Set<LocaleChangeListener>();

  constructor(config: I18nConfig = {}) {
    this.activeLocale = config.defaultLocale ?? DEFAULT_LOCALE;
    this.fallbackLocale = config.fallbackLocale ?? DEFAULT_LOCALE;
  }

  /** Register or merge a locale's message map. */
  registerLocale(locale: LocaleCode, messages: MessageMap): void {
    const existing = this.locales.get(locale) ?? {};
    this.locales.set(locale, { ...existing, ...messages });
  }

  /** Remove a locale entirely. Does not touch the fallback. */
  unregisterLocale(locale: LocaleCode): void {
    this.locales.delete(locale);
  }

  /** Return all registered locales in registration order. */
  listLocales(): LocaleCode[] {
    return Array.from(this.locales.keys());
  }

  /** True when the locale has been registered. */
  hasLocale(locale: LocaleCode): boolean {
    return this.locales.has(locale);
  }

  /** Active locale code. */
  getLocale(): LocaleCode {
    return this.activeLocale;
  }

  /** Switch the active locale. Notifies listeners. */
  setLocale(locale: LocaleCode): void {
    if (this.activeLocale === locale) return;
    this.activeLocale = locale;
    for (const listener of this.listeners) {
      try {
        listener(locale);
      } catch {
        /* ignore listener errors */
      }
    }
  }

  onLocaleChange(listener: LocaleChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Look up a message by key, substituting `{placeholder}` tokens.
   * Falls back to the configured fallback locale, then to the explicit
   * `fallback` argument, then to the key itself.
   */
  t(
    key: string,
    values?: Record<string, string | number>,
    fallback?: string,
  ): string {
    const raw = this.lookup(key, this.activeLocale)
      ?? this.lookup(key, this.fallbackLocale)
      ?? fallback
      ?? key;
    return substitute(raw, values);
  }

  /**
   * Pick a plural form using English-style rules (one / other). For full
   * CLDR coverage callers should provide explicit message keys per locale,
   * but this covers the common ASCII/Western pluralization case.
   */
  plural(
    key: string,
    count: number,
    values?: Record<string, string | number>,
  ): string {
    const variantKey = count === 1 ? `${key}.one` : `${key}.other`;
    const variant = this.lookup(variantKey, this.activeLocale)
      ?? this.lookup(variantKey, this.fallbackLocale);
    if (variant !== undefined) {
      return substitute(variant, { ...values, count });
    }
    return this.t(key, { ...values, count });
  }

  /** Format a date using the active locale's `Intl.DateTimeFormat`. */
  formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.activeLocale, options).format(value);
    } catch {
      return new Intl.DateTimeFormat(this.fallbackLocale, options).format(value);
    }
  }

  /** Format a number using the active locale's `Intl.NumberFormat`. */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(this.activeLocale, options).format(value);
    } catch {
      return new Intl.NumberFormat(this.fallbackLocale, options).format(value);
    }
  }

  private lookup(key: string, locale: LocaleCode): string | undefined {
    const map = this.locales.get(locale);
    return map ? map[key] : undefined;
  }
}

/**
 * Substitute `{name}` tokens in `raw` using the provided values. Missing
 * tokens are left in place — callers can spot unprovided values during
 * development.
 */
export function substitute(
  raw: string,
  values?: Record<string, string | number>,
): string {
  if (!values) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined || value === null ? match : String(value);
  });
}

/**
 * Built-in starter locale map. Apps are encouraged to extend this with their
 * own keys via `registerLocale`.
 */
export const BUILTIN_LOCALES: Record<LocaleCode, MessageMap> = {
  en: {
    "menu.file": "File",
    "menu.edit": "Edit",
    "menu.view": "View",
    "menu.go": "Go",
    "menu.run": "Run",
    "menu.terminal": "Terminal",
    "menu.help": "Help",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.save": "Save",
    "common.open": "Open",
  },
  tr: {
    "menu.file": "Dosya",
    "menu.edit": "Düzen",
    "menu.view": "Görünüm",
    "menu.go": "Git",
    "menu.run": "Çalıştır",
    "menu.terminal": "Terminal",
    "menu.help": "Yardım",
    "common.cancel": "Vazgeç",
    "common.close": "Kapat",
    "common.save": "Kaydet",
    "common.open": "Aç",
  },
};

/**
 * Convenience: create an `I18n` instance prewired with the built-in
 * locales.
 */
export function createDefaultI18n(config?: I18nConfig): I18n {
  const i18n = new I18n(config);
  for (const [code, map] of Object.entries(BUILTIN_LOCALES)) {
    i18n.registerLocale(code, map);
  }
  return i18n;
}
