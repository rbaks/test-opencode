import { WifiOff } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface OfflineStateProps {
  className?: string
}

/**
 * Shown when the app cannot reach assets it needs. Because the dataset is
 * bundled, the core flow still works offline after first load — this is the
 * fallback message if something network-dependent is unavailable, so the user
 * is never left with a blank screen (FR-012).
 */
export function OfflineState({ className }: OfflineStateProps) {
  return (
    <Alert className={cn(className)} role="status">
      <WifiOff className="size-4" aria-hidden="true" />
      <AlertTitle>You appear to be offline</AlertTitle>
      <AlertDescription>
        The bundled strategy data is still available — you can keep exploring and running backtests.
        Some features that need a connection will retry automatically once you’re back online.
      </AlertDescription>
    </Alert>
  )
}
