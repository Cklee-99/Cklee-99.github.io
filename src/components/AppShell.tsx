import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { PrimaryNav, BottomNav } from '../components/Nav'
import { Footer } from '../components/Footer'
import { Overview } from '../views/Overview'
import { BacktestView } from '../views/BacktestView'
import { Analysis } from '../views/Analysis'
import { More } from '../views/More'
import { currentRoute } from '../router'
import type { Route } from '../router'
import { loadPrefs, savePrefs } from '../state/prefs'
import type { Theme, Locale } from '../state/prefs'

export function AppShell() {
  const prefs = loadPrefs()

  const [theme, setTheme] = useState<Theme>(prefs.theme)
  const [locale, setLocale] = useState<Locale>(prefs.locale)
  const [route, setRoute] = useState<Route>(currentRoute())

  useEffect(() => {
    const onHashChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const updateTheme = (next: Theme) => {
    setTheme(next)
    savePrefs({ theme: next, locale })
  }
  const updateLocale = (next: Locale) => {
    setLocale(next)
    savePrefs({ theme, locale: next })
  }

  return (
    <div className="app" data-theme={theme}>
      <Header theme={theme} locale={locale} onTheme={updateTheme} onLocale={updateLocale} />
      <PrimaryNav active={route} locale={locale} />
      <main className="app-main">
        {route === 'overview' && <Overview locale={locale} />}
        {route === 'backtest' && <BacktestView locale={locale} />}
        {route === 'analysis' && <Analysis locale={locale} />}
        {route === 'more' && <More locale={locale} />}
      </main>
      <BottomNav active={route} locale={locale} />
      <Footer locale={locale} />
    </div>
  )
}
