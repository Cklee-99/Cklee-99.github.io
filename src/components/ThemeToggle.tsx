import type { Theme, Locale } from '../state/prefs'
import { translate } from '../i18n/index'

export function ThemeToggle({
  theme,
  locale,
  onTheme,
}: {
  theme: Theme
  locale: Locale
  onTheme: (next: Theme) => void
}) {
  const t = (key: string) => translate(locale, key)
  const next = theme === 'light' ? 'dark' : 'light'
  const label = theme === 'light' ? 'common.theme.light' : 'common.theme.dark'
  return (
    <button
      type="button"
      className="control-button"
      aria-label={t('common.theme.label')}
      onClick={() => onTheme(next)}
    >
      {t(label)}
    </button>
  )
}


