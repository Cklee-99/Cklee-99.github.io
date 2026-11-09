/* Reusable chart overlay legend with keyboard-accessible toggle buttons.
   Presentational only; chart series state stays in the owning view. */

export interface ChartLegendToggle {
  id: string
  label: string
  active: boolean
}

export function ChartLegend({
  toggles,
  onToggle,
}: {
  toggles: ChartLegendToggle[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="chart-legend">
      {toggles.map((toggle) => (
        <button
          key={toggle.id}
          type="button"
          className={toggle.active ? 'option-button active' : 'option-button'}
          aria-pressed={toggle.active}
          onClick={() => onToggle(toggle.id)}
        >
          {toggle.label}
        </button>
      ))}
    </div>
  )
}
