import { Locale, TranslationKeys } from './types';

// Lazy load translations
const translations: Record<Locale, TranslationKeys> = {
  ko: require('./locales/ko.json'),
  en: require('./locales/en.json'),
};

/**
 * Get translation for a key
 * @param key - Translation key path (e.g., 'states.CREATED')
 * @param locale - Current locale
 * @param params - Optional parameters for string interpolation
 * @returns Localized string or canonical key as fallback
 */
export function t(
  key: string,
  locale: Locale = 'ko',
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations[locale] || translations.ko;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to canonical key if translation not found
      console.warn(`Translation missing for key: ${key} in locale: ${locale}`);
      return key;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Simple parameter substitution
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}

/**
 * Get localized label for a canonical key
 * @param canonicalKey - Canonical key (e.g., 'INSPECTION')
 * @param category - Category of the key ('states', 'timers', 'reasonCodes', etc.)
 * @param locale - Current locale
 * @returns Localized label
 */
export function getLocalizedLabel(
  canonicalKey: string,
  category: 'states' | 'timers' | 'reasonCodes' | 'ledgerTypes',
  locale: Locale = 'ko'
): string {
  return t(`${category}.${canonicalKey}`, locale) || canonicalKey;
}

/**
 * Format currency amount
 * @param amount - Amount to format
 * @param currency - Currency code (e.g., 'USD', 'KRW')
 * @param locale - Locale for formatting
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: Locale = 'ko'
): string {
  const localeCode = locale === 'ko' ? 'ko-KR' : 'en-US';
  
  try {
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format timer duration
 * @param durationMs - Duration in milliseconds
 * @param locale - Locale for formatting
 * @returns Formatted duration string (e.g., "7 days", "7일")
 */
export function formatTimer(
  durationMs: number,
  locale: Locale = 'ko'
): string {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (locale === 'ko') {
    if (days > 0) return `${days}일`;
    if (hours > 0) return `${hours}시간`;
    if (minutes > 0) return `${minutes}분`;
    return `${seconds}초`;
  } else {
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

/**
 * Get current locale from cookie or default
 */
export function getLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'ko'; // Server-side default
  }

  // Check cookie first
  const cookieLocale = document.cookie
    .split('; ')
    .find(row => row.startsWith('locale='))
    ?.split('=')[1] as Locale | undefined;

  if (cookieLocale && (cookieLocale === 'ko' || cookieLocale === 'en')) {
    return cookieLocale;
  }

  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlLocale = urlParams.get('locale') as Locale | null;
  if (urlLocale && (urlLocale === 'ko' || urlLocale === 'en')) {
    return urlLocale;
  }

  return 'ko'; // Default
}

/**
 * Set locale in cookie
 */
export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }

  document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year
}
