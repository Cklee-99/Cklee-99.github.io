/* Portfolio equity curve with the strategy equity, the buy-and-hold benchmark
   equity (when available), and an initial-capital reference line. Uses actual
   daily snapshot and benchmark account values; never recalculates performance.
   Instances are created per dataset/theme and removed on teardown. */

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, LineSeries, type IChartApi, type ISeriesApi, type MouseEventParams, type BusinessDay, type LineData } from 'lightweight-charts'
import { translate } from '../../i18n/index'
import type { Locale } from '../../state/prefs'
import type { ChartTheme } from './chart-theme'
import { CHART_PALETTES, chartHostOptions } from './chart-theme'
import type { PerformanceSeriesSet } from './chart-types'
import { businessDayToIso, formatMoney, formatPercent } from './chart-utils'
import { ChartTooltip, type TooltipEntry } from './ChartTooltip'

function sameDay(time: BusinessDay, bd: BusinessDay): boolean {
  return time.year === bd.year && time.month === bd.month && time.day === bd.day
}

function findValue(points: readonly LineData[], bd: BusinessDay): number | null {
  for (const point of points) {
    if (typeof point.time !== 'number' && typeof point.time !== 'string' && sameDay(point.time, bd) && typeof point.value === 'number') return point.value
  }
  return null
}

export function EquityCurveChart({
  id,
  locale,
  theme,
  perf,
  dataKey,
}: {
  id: string
  locale: Locale
  theme: ChartTheme
  perf: PerformanceSeriesSet
  dataKey: string
}) {
  const t = useCallback((key: string) => translate(locale, key), [locale])
  const chartRef = useRef<IChartApi | null>(null)
  const benchmarkRef = useRef<ISeriesApi<'Line'> | null>(null)
  const [tooltip, setTooltip] = useState<{ iso: string | null; entries: TooltipEntry[] }>({ iso: null, entries: [] })
  const palette = CHART_PALETTES[theme]

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }
    benchmarkRef.current = null
    const frame = document.getElementById(id)
    if (!frame) return
    const chart = createChart(frame, chartHostOptions(theme))
    chartRef.current = chart
    const equity = chart.addSeries(LineSeries, {
      color: palette.equity,
      lineWidth: 2,
      title: t('analysis.equity.strategy'),
    })
    equity.setData(perf.equity)
    equity.createPriceLine({
      price: perf.initialCapital,
      color: palette.layoutText,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: t('analysis.equity.initialCapital'),
    })
    if (perf.benchmarkAvailable) {
      const benchmark = chart.addSeries(LineSeries, {
        color: palette.benchmark,
        lineWidth: 2,
        lineStyle: 2,
        title: t('analysis.equity.benchmark'),
      })
      benchmark.setData(perf.benchmark)
      benchmarkRef.current = benchmark
    }
    chart.timeScale().fitContent()
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      const time = param.time
      if (!time || typeof time === 'number' || typeof time === 'string') {
        setTooltip({ iso: null, entries: [] })
        return
      }
      const iso = businessDayToIso(time)
      const value = findValue(perf.equity, time)
      if (value === null) {
        setTooltip({ iso: null, entries: [] })
        return
      }
      const ret = perf.initialCapital > 0 ? value / perf.initialCapital - 1 : null
      const entries: TooltipEntry[] = [
        { label: t('analysis.equity.equity'), value: formatMoney(value, locale === 'zh-TW' ? 'zh-TW' : 'en-US') },
        { label: t('analysis.equity.return'), value: ret === null ? t('simulation.value.unavailable') : formatPercent(ret, locale === 'zh-TW' ? 'zh-TW' : 'en-US') },
      ]
      const bench = benchmarkRef.current && findValue(perf.benchmark, time)
      if (bench !== null && bench !== undefined) entries.push({ label: t('analysis.equity.benchmark'), value: formatMoney(bench, locale === 'zh-TW' ? 'zh-TW' : 'en-US') })
      setTooltip({ iso, entries })
    })
    return () => {
      chart.remove()
      chartRef.current = null
      benchmarkRef.current = null
    }
  }, [dataKey, theme, id, perf, palette, t, locale])

  return (
    <section className="chart-section">
      <div id={id} className="chart-frame" />
      <ChartTooltip title={tooltip.iso ?? ''} entries={tooltip.entries} visible={tooltip.iso !== null} />
    </section>
  )
}
