import { useEffect } from 'react'
import { History } from 'lucide-react'
import { usePanel, type PanelTab } from '../../store/usePanel'
import { useSaves, useUnsavedChanges } from '../../store/useSaves'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { HistoryTab } from './HistoryTab'
import { SavesTab } from './SavesTab'

/**
 * The right-hand panel: what changed (History) and what is kept (Saves). It is
 * closed until the header button opens it, so neither editors nor the live
 * preview lose any width to it.
 */

/** Header trigger, with a dot while the document is ahead of the last save. */
export function HistoryPanelButton() {
  const openPanel = usePanel((s) => s.openPanel)
  const notice = useSaves((s) => s.notice)
  const error = useSaves((s) => s.error)
  const clearMessages = useSaves((s) => s.clearMessages)
  const dirty = useUnsavedChanges()

  // Confirmations are transient - Ctrl+S should not leave a banner behind.
  useEffect(() => {
    if (!notice && !error) return
    const timer = window.setTimeout(clearMessages, 4000)
    return () => window.clearTimeout(timer)
  }, [notice, error, clearMessages])

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {(notice || error) && (
        <span
          className={cn(
            'max-w-[38vw] truncate text-xs font-medium sm:max-w-xs',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
          title={error ?? notice ?? ''}
        >
          {error ?? notice}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => openPanel()}
        aria-label="History and saves"
        title="History and saves"
      >
        <History />
        {dirty && (
          <span
            aria-hidden
            className="absolute top-1 right-1 size-1.5 rounded-full bg-primary"
          />
        )}
      </Button>
    </div>
  )
}

export function HistoryPanel() {
  const open = usePanel((s) => s.open)
  const setOpen = usePanel((s) => s.setOpen)
  const tab = usePanel((s) => s.tab)
  const setTab = usePanel((s) => s.setTab)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="no-print" aria-describedby="history-panel-desc">
        <SheetHeader>
          <div className="min-w-0 flex-1">
            <SheetTitle>History &amp; saves</SheetTitle>
            <SheetDescription id="history-panel-desc">
              Every change you made, and the copies kept in this browser.
            </SheetDescription>
          </div>
          <SheetClose />
        </SheetHeader>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as PanelTab)}
          className="min-h-0 flex-1 gap-0"
        >
          <TabsList className="mx-3 mt-2.5 w-auto sm:mx-4">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="saves">Saves</TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="mt-2.5 flex min-h-0 flex-col">
            <HistoryTab />
          </TabsContent>
          <TabsContent value="saves" className="mt-2.5 flex min-h-0 flex-col">
            <SavesTab />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
