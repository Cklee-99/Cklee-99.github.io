/* Small local preferences persisted in localStorage.
   Tolerates missing or malformed storage. Never stores secrets. */

export type Theme = 'light' | 'dark'
export type Locale = 'zh-TW' | 'en'

export interface UserPrefs {
  theme: Theme
  locale: Locale
}

const PREFS_KEY = 'ql.prefs'

export const DEFAULT_PREFS: UserPrefs = { theme: 'light', locale: 'zh-TW' }

export function loadPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFS
    const theme = parsed.theme === 'dark' ? 'dark' : 'light'
    const locale = parsed.locale === 'en' ? 'en' : 'zh-TW'
    return { theme, locale }
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs: UserPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Storage may be unavailable or full; the app keeps running in-memory.
  }
}
