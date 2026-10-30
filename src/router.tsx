/* Static-safe hash routing for GitHub Pages (no server rewrite required). */

export type Route = 'overview' | 'backtest' | 'analysis' | 'more'

export const ROUTES: Route[] = ['overview', 'backtest', 'analysis', 'more']

export function currentRoute(): Route {
  const hash = window.location.hash.trim().replace(/^#\/?,?/, '').toLowerCase()
  const match = ROUTES.find((route) => route === hash)
  return match ?? 'overview'
}

export function navigate(route: Route): void {
  window.location.hash = `/${route}`
}
