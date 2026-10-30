import type { Route } from './router'

export interface NavData {
  route: Route
  key: string
}

export const NAV_ROUTES: NavData[] = [
  { route: 'overview', key: 'common.nav.overview' },
  { route: 'backtest', key: 'common.nav.backtest' },
  { route: 'analysis', key: 'common.nav.analysis' },
  { route: 'more', key: 'common.nav.more' },
]
