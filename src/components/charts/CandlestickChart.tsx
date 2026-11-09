/* Professional candlestick chart with MA5/20/60, Bollinger Bands, volume, and
   BUY/SELL execution markers. Uses Lightweight Charts v5 only; series are typed
   and already filtered in chart-utils (null/NaN/Infinity are never passed).
   Chart lifecycle: instances are created once per dataset/theme and removed on
   unmount or on an explicit recreate; overlay visibility changes applyOptions
   on existing series instead of recreating the chart. */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type BusinessDay,
  type LineData,
} from 'lightweight-charts'
import { translate } from '../../i18n/index'
import type { Locale } from '../../state/prefs'
import type { ChartTheme } from './chart-theme'
import { CHART_PALETTES, chartHostOptions } from './chart-theme'
import type { ChartSeriesSet } from './chart-types'
import { businessDayToIso } from './chart-utils'
import { ChartLegend } from './ChartLegend'
import { ChartTooltip, type TooltipEntry } from './ChartTooltip'

export interface CandleToggles {
  ma5: boolean
  ma20: boolean
  ma60: boolean
  boll: boolean
  volume: boolean
}

function sameDay(time: BusinessDay, bd: BusinessDay): boolean {
  return time.year === bd.year && time.month === bd.month && time.day === bd.day
}

function findAt(points: readonly LineData[], bd: BusinessDay): number | null {
  for (const point of points) {
    if (typeof point.time !== 'number' && typeof point.time !== 'string' && sameDay(point.time, bd)) return point.value
  }
  return null
}

function fmt(value: number | null): string {
  return value === null ? '—' : value.toFixed(2)
}

type SeriesRefs = {
  ma5: ISeriesApi<'Line'>
  ma20: ISeriesApi<'Line'>
  ma60: ISeriesApi<'Line'>
  bollUpper: ISeriesApi<'Line'>
  bollMiddle: ISeriesApi<'Line'>
  bollLower: ISeriesApi<'Line'>
  volume: ISeriesApi<'Histogram'>
}

export function CandlestickChart({
  id,
  locale,
  theme,
  series,
  dataKey,
  toggles,
  onToggle,
  onHover,
}: {
  id: string
  locale: Locale
  theme: ChartTheme
  series: ChartSeriesSet
  dataKey: string
  toggles: CandleToggles
  onToggle: (id: string) => void
  onHover: (iso: string | null) => void
}) {
  const t = useCallback((key: string) => translate(locale, key), [locale])
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<SeriesRefs | null>(null)
  const [tooltip, setTooltip] = useState<{ iso: string | null; entries: TooltipEntry[] }>({ iso: null, entries: [] })
  const palette = CHART_PALETTES[theme]
  const toggleKey = `${toggles.ma5}|${toggles.ma20}|${toggles.ma60}|${toggles.boll}|${toggles.volume}`

  useEffect(() => {
    const refs = seriesRef.current
    if (!refs) return
    refs.ma5.applyOptions({ visible: toggles.ma5 })
    refs.ma20.applyOptions({ visible: toggles.ma20 })
    refs.ma60.applyOptions({ visible: toggles.ma60 })
    refs.bollUpper.applyOptions({ visible: toggles.boll })
    refs.bollMiddle.applyOptions({ visible: toggles.boll })
    refs.bollLower.applyOptions({ visible: toggles.boll })
    refs.volume.applyOptions({ visible: toggles.volume })
  }, [toggleKey, dataKey, toggles.ma5, toggles.ma20, toggles.ma60, toggles.boll, toggles.volume])

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }
    seriesRef.current = null
    const frame = document.getElementById(id)
    if (!frame) return

    const chart = createChart(frame, chartHostOptions(theme))
    chartRef.current = chart

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: palette.up,
      downColor: palette.down,
      borderUpColor: palette.up,
      borderDownColor: palette.down,
      wickUpColor: palette.up,
      wickDownColor: palette.down,
      title: '',
    })
    candle.setData(series.candles)
    createSeriesMarkers(candle, series.markers)

    const ma5 = chart.addSeries(LineSeries, { color: palette.ma5, lineWidth: 1, visible: toggles.ma5, title: t('analysis.chart.ma5') })
    ma5.setData(toggles.ma5 ? series.ma5 : [])
    const ma20 = chart.addSeries(LineSeries, { color: palette.ma20, lineWidth: 1, visible: toggles.ma20, title: t('analysis.chart.ma20') })
    ma20.setData(toggles.ma20 ? series.ma20 : [])
    const ma60 = chart.addSeries(LineSeries, { color: palette.ma60, lineWidth: 1, visible: toggles.ma60, title: t('analysis.chart.ma60') })
    ma60.setData(toggles.ma60 ? series.ma60 : [])

    const bollUpper = chart.addSeries(LineSeries, {
      color: palette.bollUpper,
      lineWidth: 1,
      lineStyle: 2,
      visible: toggles.boll,
      title: t('analysis.chart.bollUpper'),
    })
    bollUpper.setData(toggles.boll ? series.bollUpper : [])
    const bollMiddle = chart.addSeries(LineSeries, {
      color: palette.bollMiddle,
      lineWidth: 1,
      visible: toggles.boll,
      title: t('analysis.chart.bollMiddle'),
    })
    bollMiddle.setData(toggles.boll ? series.bollMiddle : [])
    const bollLower = chart.addSeries(LineSeries, {
      color: palette.bollLower,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      visible: toggles.boll,
      title: t('analysis.chart.bollLower'),
    })
    bollLower.setData(toggles.boll ? series.bollLower : [])

    const volume = chart.addSeries(HistogramSeries, {
      priceScaleId: 'volume',
      priceFormat: { type: 'volume' },
      priceLineVisible: false,
      lastValueVisible: false,
      visible: toggles.volume,
    })
    volume.setData(toggles.volume ? series.volume : [])
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
    seriesRef.current = { ma5, ma20, ma60, bollUpper, bollMiddle, bollLower, volume }

    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      const time = param.time
      if (!time || typeof time === 'number' || typeof time === 'string') {
        onHover(null)
        setTooltip({ iso: null, entries: [] })
        return
      }
      const iso = businessDayToIso(time)
      const candlePoint = series.candles.find((c) => sameDay(c.time, time as BusinessDay))
      if (!candlePoint) {
        onHover(null)
        setTooltip({ iso: null, entries: [] })
        return
      }
      const entries: TooltipEntry[] = [
        { label: t('analysis.tooltip.open'), value: candlePoint.open.toFixed(2) },
        { label: t('analysis.tooltip.high'), value: candlePoint.high.toFixed(2) },
        { label: t('analysis.tooltip.low'), value: candlePoint.low.toFixed(2) },
        { label: t('analysis.tooltip.close'), value: candlePoint.close.toFixed(2) },
      ]
      if (toggles.ma5) entries.push({ label: t('analysis.tooltip.ma5'), value: fmt(findAt(series.ma5, time)) })
      if (toggles.ma20) entries.push({ label: t('analysis.tooltip.ma20'), value: fmt(findAt(series.ma20, time)) })
      if (toggles.ma60) entries.push({ label: t('analysis.tooltip.ma60'), value: fmt(findAt(series.ma60, time)) })
      if (toggles.boll) {
        entries.push({ label: t('analysis.tooltip.bollUpper'), value: fmt(findAt(series.bollUpper, time)) })
        entries.push({ label: t('analysis.tooltip.bollMiddle'), value: fmt(findAt(series.bollMiddle, time)) })
        entries.push({ label: t('analysis.tooltip.bollLower'), value: fmt(findAt(series.bollLower, time)) })
      }
      if (toggles.volume) {
        const volumePoint = series.volume.find(
          (v) => typeof v.time !== 'number' && typeof v.time !== 'string' && sameDay(v.time, time),
        )
        if (volumePoint) entries.push({ label: t('analysis.tooltip.volume'), value: volumePoint.value.toLocaleString('en-US') })
      }
      setTooltip({ iso, entries })
      onHover(iso)
    })

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [dataKey, theme, id, series, palette, t, toggles, onHover])

  const legendToggles = [
    { id: 'ma5', label: t('analysis.chart.ma5'), active: toggles.ma5 },
    { id: 'ma20', label: t('analysis.chart.ma20'), active: toggles.ma20 },
    { id: 'ma60', label: t('analysis.chart.ma60'), active: toggles.ma60 },
    { id: 'boll', label: t('analysis.chart.boll'), active: toggles.boll },
    { id: 'volume', label: t('analysis.chart.volume'), active: toggles.volume },
  ]

  return (
    <section className="chart-section">
      <div id={id} className="chart-frame" />
      <ChartLegend toggles={legendToggles} onToggle={onToggle} />
      <ChartTooltip title={tooltip.iso ?? ''} entries={tooltip.entries} visible={tooltip.iso !== null} />
    </section>
  )
}