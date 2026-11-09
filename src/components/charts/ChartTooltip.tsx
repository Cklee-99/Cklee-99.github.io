/* Small crosshair tooltip overlay that lists exact session values in tabular
   form. It is supplemental to the chart and never the only representation of
   important financial results. Reduces to a compact row on its own. */

export interface TooltipEntry {
  label: string
  value: string
}

export function ChartTooltip({ title, entries, visible }: { title: string; entries: TooltipEntry[]; visible: boolean }) {
  if (!visible) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-title">{title}</p>
      <ul className="chart-tooltip-list">
        {entries.map((entry) => (
          <li key={entry.label}>
            <span className="chart-tooltip-label">{entry.label}</span>
            <span className="chart-tooltip-value">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
