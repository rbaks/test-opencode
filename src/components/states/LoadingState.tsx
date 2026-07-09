import type { ReactNode } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  label?: string
  children?: ReactNode
  className?: string
}

/**
 * A loading panel shown while data is being prepared. Never leaves the user
 * staring at a blank area (FR-012). Includes an accessible status role.
 */
export function LoadingState({ label = 'Loading…', children, className }: LoadingStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center gap-4 py-12', className)}
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-6 text-muted-foreground" />
      <span className="sr-only">{label}</span>
      {children ?? (
        <div className="w-full max-w-md space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
    </div>
  )
}
