import { useCallback } from 'react'
import type { Locale } from '../state/prefs'
import { navigate } from '../router'
import type { Route } from '../router'
import { translate } from '../i18n/index'
import { NAV_ROUTES } from '../nav-data'

export function PrimaryNav({ active, locale }: { active: Route; locale: Locale }) {
  const t = (key: string) => translate(locale, key)
  const select = useCallback((route: Route) => navigate(route), [])
  return (
    <nav className="primary-nav">
      {NAV_ROUTES.map(({ route, key }) => (
        <button
          type="button"
          className="nav-link"
          aria-current={route === active ? 'page' : undefined}
          onClick={() => select(route)}
        >
          {t(key)}
        </button>
      ))}
    </nav>
  )
}

export function BottomNav({ active, locale }: { active: Route; locale: Locale }) {
  const t = (key: string) => translate(locale, key)
  const select = useCallback((route: Route) => navigate(route), [])
  return (
    <nav className="bottom-nav">
      {NAV_ROUTES.map(({ route, key }) => (
        <button
          type="button"
          className="nav-link"
          aria-current={route === active ? 'page' : undefined}
          onClick={() => select(route)}
        >
          {t(key)}
        </button>
      ))}
    </nav>
  )
}

