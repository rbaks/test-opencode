import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * A friendly error panel for when something goes wrong. Uses the destructive
 * Alert variant. Always offers a plain-language message and (when possible) an
 * action to recover — never a raw error or blank screen (FR-012).
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again. If the problem persists, refreshing the page usually helps.',
  action,
  className,
}: ErrorStateProps) {
  return (
    <Alert variant="destructive" className={cn('items-start', className)} role="alert">
      <AlertCircle className="size-4 mt-0.5" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {action ? <div className="mt-3">{action}</div> : null}
    </Alert>
  )
}
