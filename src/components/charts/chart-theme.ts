/* Chart theme mapping for Lightweight Charts v5. Exactly follows the chart
   palette in UI_UX_SPEC.md section 3.3 and the design tokens in tokens.css.
   No competing palette: the same semantic colors are preserved in both themes
   with luminance adjustments only where the spec requires them. */

import { ColorType, CrosshairMode, LineStyle } from 'lightweight-charts'
import type { ChartOptions, DeepPartial } from 'lightweight-charts'

export type ChartTheme = 'light' | 'dark'

export interface ChartPalette {
  up: string
  down: string
  ma5: string
  ma20: string
  ma60: string
  bollUpper: string
  bollLower: string
  bollMiddle: string
  rsi: string
  benchmark: string
  equity: string
  drawdown: string
  layoutBackground: string
  layoutText: string
  gridColor: string
}

export const CHART_PALETTES: Record<ChartTheme, ChartPalette> = {
  light: {
    up: '#16a34a',
    down: '#dc2626',
    ma5: '#7c3aed',
    ma20: '#2563eb',
    ma60: '#ea580c',
    bollUpper: '#94a3b8',
    bollLower: '#94a3b8',
    bollMiddle: '#64748b',
    rsi: '#8b5cf6',
    benchmark: '#475569',
    equity: '#0d9488',
    drawdown: '#dc2626',
    layoutBackground: '#ffffff',
    layoutText: '#475569',
    gridColor: '#e4e7ec',
  },
  dark: {
    up: '#4ade80',
    down: '#f87171',
    ma5: '#c4b5fd',
    ma20: '#60a5fa',
    ma60: '#fb923c',
    bollUpper: '#64748b',
    bollLower: '#64748b',
    bollMiddle: '#cbd5e1',
    rsi: '#a78bfa',
    benchmark: '#94a3b8',
    equity: '#2dd4bf',
    drawdown: '#f87171',
    layoutBackground: '#111827',
    layoutText: '#a3adbe',
    gridColor: '#2b374b',
  },
}

/** Chart host options for the current theme (background, axis text, grid). The
    result is a DeepPartial chart-options overlay; every unspecified option keeps
    the library default. */
export function chartHostOptions(theme: ChartTheme): DeepPartial<ChartOptions> {
  const palette = CHART_PALETTES[theme]
  return {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: palette.layoutBackground },
      textColor: palette.layoutText,
      fontSize: 12,
      panes: { enableResize: false, separatorColor: palette.gridColor, separatorHoverColor: 'rgba(178,181,189,0.2)' },
      attributionLogo: false,
    },
    grid: {
      vertLines: { visible: true, color: palette.gridColor, style: LineStyle.Solid },
      horzLines: { visible: true, color: palette.gridColor, style: LineStyle.Solid },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { visible: true, color: palette.layoutText, style: LineStyle.Solid, width: 1, labelVisible: false, labelBackgroundColor: palette.layoutBackground },
      horzLine: { visible: true, color: palette.layoutText, style: LineStyle.Solid, width: 1, labelVisible: false, labelBackgroundColor: palette.layoutBackground },
    },
    timeScale: {
      rightOffset: 4,
      barSpacing: 6,
      minBarSpacing: 0.5,
    },
    localization: {
      locale: 'en-US',
      priceFormatter: (price: number) => price.toFixed(2),
    },
    handleScroll: true,
    handleScale: true,
    defaultVisiblePriceScaleId: 'right',
  }
}

/** Base series options shared by every price-chart series. */
export function seriesCommon(visible: boolean): Record<string, unknown> {
  return { title: '', lastValueVisible: true, priceLineVisible: false, visible }
}
