import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { Allocation } from '@/types'
import { getAssetClass } from '@/data/asset-classes'
import { cn } from '@/lib/utils'

/**
 * Resolves a Tailwind `--chart-N` token to a usable SVG color string. The chart
 * color CSS variables hold a raw HSL triplet (e.g. `221.2 83.2% 53.3%`), so they
 * must be wrapped in `hsl(...)` to form a real color. Index wraps for >5 slices
 * (no strategy has more than 4, so every slice gets a distinct color).
 */
const CHART_FILLS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]
const LEGEND_DOTS = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

interface AllocationDonutProps {
  allocations: Allocation[]
  className?: string
}

/**
 * The at-a-glance allocation breakdown (FR-002): a donut showing each asset
 * class's percentage, paired with a plain-text legend. This is the single
 * justified categorical exception to the "all charts use TradingView
 * Lightweight Charts" mandate — a donut is categorical, not a series over an
 * axis (research.md §R-6).
 *
 * The legend is intentionally plain DOM text (not buried in SVG) so it is
 * reliably readable by screen readers and by tests. The visual donut carries
 * role="img" with a summary label.
 */
export function AllocationDonut({ allocations, className }: AllocationDonutProps) {
  const data = allocations.map((a, i) => ({
    name: getAssetClass(a.assetId).name,
    value: Math.round(a.weight * 100),
    fill: CHART_FILLS[i % CHART_FILLS.length],
    dot: LEGEND_DOTS[i % LEGEND_DOTS.length],
  }))

  const summary = data.map((d) => `${d.name} ${d.value}%`).join(', ')

  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center', className)}>
      <div
        className="relative mx-auto h-44 w-44 shrink-0 sm:mx-0"
        role="img"
        aria-label={`Allocation donut: ${summary}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={76}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center gap-2 text-sm">
            <span className={cn('h-3 w-3 shrink-0 rounded-sm', entry.dot)} aria-hidden="true" />
            <span className="flex-1">{entry.name}</span>
            <span className="font-medium tabular-nums">{entry.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
