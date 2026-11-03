/* Technical indicator core: shared period validation and simple moving averages.
   Pure deterministic functions; output is aligned to the input array length. */

export type AlignedSeries = (number | null)[]

/** Rejects invalid periods (zero, negative, non-integer) with a clear error. */
export function assertPeriod(period: number): void {
  if (!Number.isFinite(period) || period <= 0 || Math.floor(period) !== period) {
    throw new RangeError(`invalid period: ${period}`)
  }
}

/** Simple moving average of the last `period` closes. null until a complete
    window exists. Never mutates the input. */
export function sma(closePrices: readonly number[], period: number): AlignedSeries {
  assertPeriod(period)
  const n = closePrices.length
  const out: AlignedSeries = new Array(n).fill(null) as AlignedSeries
  if (n < period) return out
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += closePrices[i]
    if (i >= period) sum -= closePrices[i - period]
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}
