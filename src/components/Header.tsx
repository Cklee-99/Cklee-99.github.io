import type { Theme, Locale } from '../state/prefs'
import { ThemeToggle } from './ThemeToggle'
import { LangSwitcher } from './LangSwitcher'
import { translate } from '../i18n/index'

export function Header({
  theme,
  locale,
  onTheme,
  onLocale,
}: {
  theme: Theme
  locale: Locale
  onTheme: (next: Theme) => void
  onLocale: (next: Locale) => void
}) {
  const t = (key: string) => translate(locale, key)
  return (
    <header className="app-header">
      <span className="wordmark">{t('common.app.name')}</span>
      <span className="ticker-summary">{t('common.data.none')}</span>
      <ThemeToggle theme={theme} locale={locale} onTheme={onTheme} />
      <LangSwitcher locale={locale} onLocale={onLocale} />
    </header>
  )
}

