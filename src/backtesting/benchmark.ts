/* Buy-and-hold benchmark over the configured inclusive date range.
   Documented assumption: buy at the first eligible session's close and value the
   position at the last eligible session's close. */

import type { DailyBar } from '../data/market'

export type DateRange = { startDate: string; endDate: string }

export function buyAndHoldReturn(bars: readonly DailyBar[], range: DateRange): number | null {
  const inRange = bars.filter((b) => b.date >= range.startDate && b.date <= range.endDate)
  if (inRange.length < 2) return null
  const first = inRange[0].close
  const last = inRange[inRange.length - 1].close
  if (first <= 0) return null
  return last / first - 1
}
