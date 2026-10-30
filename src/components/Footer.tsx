import type { Locale } from '../state/prefs'
import { translate } from '../i18n/index'

export function Footer({ locale }: { locale: Locale }) {
  const t = (key: string) => translate(locale, key)
  return (
    <footer className="app-footer">
      <p>{t('common.footer.disclaimer')}</p>
      <p>{t('common.footer.attribution')}</p>
      <p>{t('common.footer.license')}</p>
    </footer>
  )
}

