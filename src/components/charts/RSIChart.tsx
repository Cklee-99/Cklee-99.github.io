/* RSI14 panel below the price chart with a fixed 0–100 scale, dashed 30/70
   reference lines, and crosshair time synchronization with the price chart.
   The RSI values are the engine's verified RSI14 output; no reimplementation.
   Instances are created per dataset/theme and removed on teardown. */

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, LineSeries, type IChartApi, type ISeriesApi, type MouseEventParams, type BusinessDay, type LineData, type AutoscaleInfo } from 'lightweight-charts'
import { translate } from '../../i18n/index'
import type { Locale } from '../../state/prefs'
import type { ChartTheme } from './chart-theme'
import { CHART_PALETTES, chartHostOptions } from './chart-theme'
import type { ChartSeriesSet } from './chart-types'
import { businessDayToIso, isoToBusinessDay } from './chart-utils'
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

export function RSIChart({
  id,
  locale,
  theme,
  series,
  dataKey,
  hoverDate,
}: {
  id: string
  locale: Locale
  theme: ChartTheme
  series: ChartSeriesSet
  dataKey: string
  hoverDate: string | null
}) {
  const t = useCallback((key: string) => translate(locale, key), [locale])
  const chartRef = useRef<IChartApi | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const palette = CHART_PALETTES[theme]
  const [tooltip, setTooltip] = useState<{ iso: string | null; entries: TooltipEntry[] }>({ iso: null, entries: [] })

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }
    rsiSeriesRef.current = null
    const frame = document.getElementById(id)
    if (!frame) return
    const chart = createChart(frame, chartHostOptions(theme))
    chartRef.current = chart
    const rsi = chart.addSeries(LineSeries, {
      color: palette.rsi,
      lineWidth: 2,
      title: t('analysis.chart.rsi'),
      autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) as AutoscaleInfo,
    })
    rsi.setData(series.rsi)
    rsiSeriesRef.current = rsi
    rsi.createPriceLine({ price: 30, color: palette.layoutText, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: t('analysis.chart.rsiOversold') })
    rsi.createPriceLine({ price: 70, color: palette.layoutText, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: t('analysis.chart.rsiOverbought') })
    chart.timeScale().fitContent()
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      const time = param.time
      if (!time || typeof time === 'number' || typeof time === 'string') {
        setTooltip({ iso: null, entries: [] })
        return
      }
      const iso = businessDayToIso(time)
      const value = findValue(series.rsi, time)
      if (value === null) {
        setTooltip({ iso: null, entries: [] })
        return
      }
      setTooltip({ iso, entries: [{ label: t('analysis.tooltip.rsi'), value: value.toFixed(2) }] })
    })
    return () => {
      chart.remove()
      chartRef.current = null
      rsiSeriesRef.current = null
    }
  }, [dataKey, theme, id, series, palette, t])

  useEffect(() => {
    const chart = chartRef.current
    const rsi = rsiSeriesRef.current
    if (!chart || !rsi || !hoverDate) return
    const bd = isoToBusinessDay(hoverDate)
    const value = findValue(series.rsi, bd)
    if (value !== null) chart.setCrosshairPosition(value, bd, rsi)
  }, [hoverDate, dataKey, series])

  return (
    <section className="chart-section">
      <div id={id} className="chart-frame" />
      <ChartTooltip title={tooltip.iso ?? ''} entries={tooltip.entries} visible={tooltip.iso !== null} />
    </section>
  )
}