/* Aggregated zh-TW translation resource (bundled locally, no runtime fetch). */

import { common } from './common'
import { dashboard } from './dashboard'
import { backtest } from './backtest'
import { analysis } from './analysis'
import { data } from './data'
import { settings } from './settings'

export const zhTW: Record<string, string> = {
  ...common,
  ...dashboard,
  ...backtest,
  ...analysis,
  ...data,
  ...settings,
}
