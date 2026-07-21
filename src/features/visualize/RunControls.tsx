import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DATA_START_MONTH, DATA_END_MONTH } from '@/data/returns'
import { cn } from '@/lib/utils'

/**
 * RunControls (T037) — the inputs that drive a single backtest run.
 *
 * Three values: starting amount (USD, with a `$` addon) and a month range
 * (start → end). The months use the native HTML5 `<input type="month">`
 * control, which gives us:
 *
 *   - A real month picker UI (no custom calendar widget to build or test).
 *   - Constrained min/max (the bundled dataset span) so the user can't pick a
 *     month with no data and never see an error.
 *   - Built-in keyboard accessibility (the constraint-and-input pattern is
 *     what shadcn/ui's `react-day-picker` Calendar offers, but for "month
 *     only" the native control is the simpler, more accessible choice).
 *
 * The "Run backtest" button commits the values to the parent. Edits before
 * the commit are local state, so the user can type freely without each
 * keystroke triggering a recompute.
 */

const MIN_AMOUNT = 1
const MAX_AMOUNT = 1_000_000_000

function sanitizeAmount(raw: string): string {
  // Allow only digits (no decimals, no negatives, no thousands separators —
  // keep the input simple, the backtest engine wants an integer USD anyway).
  return raw.replace(/[^0-9]/g, '').slice(0, 12)
}

function toAmountNumber(raw: string): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < MIN_AMOUNT) return 0
  if (n > MAX_AMOUNT) return MAX_AMOUNT
  return n
}

interface RunControlsProps {
  /** Initial amount (USD). */
  initialAmount: number
  /** Initial start month 'YYYY-MM'. */
  initialStartMonth: string
  /** Initial end month 'YYYY-MM'. */
  initialEndMonth: string
  /** Minimum selectable month (defaults to the bundled data start). */
  minMonth?: string
  /** Maximum selectable month (defaults to the bundled data end). */
  maxMonth?: string
  /** Invoked when the user commits a run. */
  onRun: (input: {
    amount: number
    startMonth: string
    endMonth: string
  }) => void
  /** Invoked when the user resets to defaults. */
  onReset?: () => void
  /** Disable the controls (e.g. while a run is in flight). */
  disabled?: boolean
  className?: string
}

export function RunControls({
  initialAmount,
  initialStartMonth,
  initialEndMonth,
  minMonth = DATA_START_MONTH,
  maxMonth = DATA_END_MONTH,
  onRun,
  onReset,
  disabled = false,
  className,
}: RunControlsProps) {
  const [amount, setAmount] = useState<string>(String(initialAmount))
  const [startMonth, setStartMonth] = useState<string>(initialStartMonth)
  const [endMonth, setEndMonth] = useState<string>(initialEndMonth)

  // If the parent's initial values change (e.g. via URL sync), reflect them.
  useEffect(() => {
    setAmount(String(initialAmount))
  }, [initialAmount])
  useEffect(() => {
    setStartMonth(initialStartMonth)
  }, [initialStartMonth])
  useEffect(() => {
    setEndMonth(initialEndMonth)
  }, [initialEndMonth])

  const amountNum = toAmountNumber(amount)
  const amountValid = amountNum >= MIN_AMOUNT
  const rangeValid = startMonth <= endMonth

  const handleRun = () => {
    if (!amountValid || !rangeValid) return
    onRun({ amount: amountNum, startMonth, endMonth })
  }

  const handleReset = () => {
    setAmount(String(initialAmount))
    setStartMonth(initialStartMonth)
    setEndMonth(initialEndMonth)
    onReset?.()
  }

  return (
    <section
      className={cn('space-y-4', className)}
      aria-label="Backtest inputs"
      data-testid="run-controls"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Starting amount with `$` addon */}
        <div className="space-y-1.5">
          <label htmlFor="run-amount" className="text-sm font-medium">
            Starting amount
          </label>
          <div className="flex">
            <span
              className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground"
              aria-hidden="true"
            >
              $
            </span>
            <Input
              id="run-amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRun()
              }}
              className="rounded-l-none"
              aria-invalid={!amountValid}
              aria-describedby={!amountValid ? 'run-amount-error' : undefined}
              disabled={disabled}
            />
          </div>
          {!amountValid && (
            <p id="run-amount-error" className="text-xs text-destructive" role="alert">
              Enter an amount greater than zero.
            </p>
          )}
        </div>

        {/* Start month */}
        <div className="space-y-1.5">
          <label htmlFor="run-start-month" className="text-sm font-medium">
            Start month
          </label>
          <Input
            id="run-start-month"
            type="month"
            value={startMonth}
            min={minMonth}
            max={maxMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="[&::-webkit-calendar-picker-indicator]:cursor-pointer"
            disabled={disabled}
          />
        </div>

        {/* End month */}
        <div className="space-y-1.5">
          <label htmlFor="run-end-month" className="text-sm font-medium">
            End month
          </label>
          <Input
            id="run-end-month"
            type="month"
            value={endMonth}
            min={minMonth}
            max={maxMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="[&::-webkit-calendar-picker-indicator]:cursor-pointer"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleRun} disabled={disabled || !amountValid || !rangeValid}>
          Run backtest
        </Button>
        {onReset && (
          <Button variant="outline" onClick={handleReset} disabled={disabled}>
            Reset
          </Button>
        )}
      </div>
      {!rangeValid && (
        <p className="text-xs text-destructive" role="alert">
          Start month must be before the end month.
        </p>
      )}
    </section>
  )
}
