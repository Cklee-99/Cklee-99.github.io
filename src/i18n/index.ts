/* Localization foundation: bundled zh-TW and en resources with no runtime fetch.
   Selection is driven by the current locale; translation is a plain key lookup. */

import { zhTW } from './locales/zh-TW/resources'
import { en } from './locales/en/resources'
import type { Locale } from '../state/prefs'

export const RESOURCES: Record<Locale, Record<string, string>> = {
  'zh-TW': zhTW,
  en: en,
}

export function translate(locale: Locale, key: string): string {
  const table = RESOURCES[locale]
  const value = table ? table[key] : undefined
  return value ?? RESOURCES.en[key] ?? key
}

