import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

/**
 * A friendly "nothing here yet" panel. Used whenever a view has no content to
 * show (no strategy selected, empty comparison, etc.) so the user never sees a
 * blank screen (FR-012).
 */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center gap-3 border-dashed py-12 text-center',
        className,
      )}
      role="status"
    >
      <CardContent className="flex flex-col items-center gap-3">
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
        <div className="space-y-1">
          <p className="text-base font-medium">{title}</p>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </CardContent>
    </Card>
  )
}
