/* Bollinger Bands using population standard deviation (divide by N).
   Aligned to the input price array; null until a complete window exists. */

import { assertPeriod, type AlignedSeries } from './series'

export interface BollingerBands {
  upper: AlignedSeries
  middle: AlignedSeries
  lower: AlignedSeries
}

function windowMean(values: readonly number[], start: number, period: number): number {
  let sum = 0
  for (let i = start; i < start + period; i++) sum += values[i]
  return sum / period
}

/** Population (N) standard deviation of a period-sized window. */
function windowStd(values: readonly number[], start: number, period: number): number {
  const mean = windowMean(values, start, period)
  let variance = 0
  for (let i = start; i < start + period; i++) {
    const diff = values[i] - mean
    variance += diff * diff
  }
  return Math.sqrt(variance / period)
}

export function bollingerBands(
  closePrices: readonly number[],
  period: number,
  standardDeviationMultiplier: number,
): BollingerBands {
  assertPeriod(period)
  const n = closePrices.length
  if (!Number.isFinite(standardDeviationMultiplier)) {
    throw new RangeError(`invalid multiplier: ${standardDeviationMultiplier}`)
  }
  const upper: AlignedSeries = new Array(n).fill(null) as AlignedSeries
  const middle: AlignedSeries = new Array(n).fill(null) as AlignedSeries
  const lower: AlignedSeries = new Array(n).fill(null) as AlignedSeries

  if (n >= period) {
    for (let i = period - 1; i < n; i++) {
      const start = i - period + 1
      const mid = windowMean(closePrices, start, period)
      const std = windowStd(closePrices, start, period)
      middle[i] = mid
      upper[i] = mid + standardDeviationMultiplier * std
      lower[i] = mid - standardDeviationMultiplier * std
    }
  }
  return { upper, middle, lower }
}
