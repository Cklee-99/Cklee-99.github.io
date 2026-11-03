/* Wilder's RSI with initial average gain/loss over the first complete period.
   The first RSI value is available at index `period` (needs period+1 closes). */

import { assertPeriod, type AlignedSeries } from './series'

function toRSI(avgGain: number, avgLoss: number): number {
  if (avgGain === 0 && avgLoss === 0) return 50
  if (avgLoss === 0) return 100
  if (avgGain === 0) return 0
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export function rsi(closePrices: readonly number[], period: number): AlignedSeries {
  assertPeriod(period)
  const n = closePrices.length
  const out: AlignedSeries = new Array(n).fill(null) as AlignedSeries
  if (n < period + 1) return out

  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const change = closePrices[i] - closePrices[i - 1]
    if (change > 0) avgGain += change
    else avgLoss += -change
  }
  avgGain /= period
  avgLoss /= period
  out[period] = toRSI(avgGain, avgLoss)

  for (let i = period + 1; i < n; i++) {
    const change = closePrices[i] - closePrices[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? -change : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    out[i] = toRSI(avgGain, avgLoss)
  }
  return out
}
