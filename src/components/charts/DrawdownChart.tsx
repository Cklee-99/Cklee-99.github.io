/* Peak-to-trough drawdown chart from actual daily equity snapshots (negative
   percentages), with a zero reference line and an exact per-day tooltip. */

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, LineSeries, type IChartApi, type MouseEventParams, type BusinessDay } from 'lightweight-charts'
import { translate } from '../../i18n/index'
import type { Locale } from '../../state/prefs'
import type { ChartTheme } from './chart-theme'
import { CHART_PALETTES, chartHostOptions } from './chart-theme'
import type { PerformanceSeriesSet } from './chart-types'
import { businessDayToIso, formatPercent } from './chart-utils'
import { ChartTooltip, type TooltipEntry } from './ChartTooltip'

function sameDay(time: BusinessDay, bd: BusinessDay): boolean {
  return time.year === bd.year && time.month === bd.month && time.day === bd.day
}

export function DrawdownChart({
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
  const [tooltip, setTooltip] = useState<{ iso: string | null; entries: TooltipEntry[] }>({ iso: null, entries: [] })
  const palette = CHART_PALETTES[theme]

  useEffect(() => {
    if (chartRef.current) chartRef.current.remove()
    chartRef.current = null
    const frame = document.getElementById(id)
    if (!frame) return
    const chart = createChart(frame, chartHostOptions(theme))
    chartRef.current = chart
    const dd = chart.addSeries(LineSeries, {
      color: palette.drawdown,
      lineWidth: 2,
      title: t('analysis.drawdown.title'),
    })
    dd.setData(perf.drawdown)
    dd.createPriceLine({ price: 0, color: palette.layoutText, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: t('analysis.drawdown.zero') })
    chart.timeScale().fitContent()
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      const time = param.time
      if (!time || typeof time === 'number' || typeof time === 'string') {
        setTooltip({ iso: null, entries: [] })
        return
      }
      const iso = businessDayToIso(time)
      let value = null
      for (const point of perf.drawdown) {
        if (typeof point.time !== 'number' && typeof point.time !== 'string' && sameDay(point.time, time)) value = point.value
      }
      if (value === null) {
        setTooltip({ iso: null, entries: [] })
        return
      }
      setTooltip({
        iso,
        entries: [{ label: t('analysis.drawdown.current'), value: formatPercent(value, 'en-US') }],
      })
    })
    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [dataKey, theme, id, perf, palette, t])

  return (
    <section className="chart-section">
      <div id={id} className="chart-frame" />
      <ChartTooltip title={tooltip.iso ?? ''} entries={tooltip.entries} visible={tooltip.iso !== null} />
    </section>
  )
}