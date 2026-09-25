import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ImportExportButtons } from './ImportExportButtons'
import { Logo } from './Logo'
import { SettingsMenu } from './SettingsMenu'
import { UndoRedoButtons } from './UndoRedoButtons'
import { HistoryPanel, HistoryPanelButton } from './history/HistoryPanel'
import { AiPanel, AiPanelButton } from './ai/AiPanel'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUndoShortcut } from '../store/useHistory'
import { useSaveShortcut } from '../store/usePanel'
import { useAutosave } from '../store/useSaves'
import { useStartPage } from '../store/useStartPage'
import { useAi } from '../store/useAi'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    buttonVariants({ variant: isActive ? 'default' : 'ghost' }),
    // Full-width tap targets on the wrapped mobile nav row, natural size above.
    'h-9 flex-1 sm:h-8 sm:flex-none',
  )

export function Layout() {
  const headerRef = useRef<HTMLElement>(null)
  const aiOpen = useAi((s) => s.open)

  // One document-wide set of listeners for every page: Ctrl+Z / Ctrl+Shift+Z,
  // Ctrl+S, and the autosave timer.
  useUndoShortcut()
  useSaveShortcut()
  useAutosave()

  // Fuel for the "start on: last" setting.
  const { pathname } = useLocation()
  const remember = useStartPage((s) => s.remember)
  useEffect(() => remember(pathname), [pathname, remember])

  // Pages that pin their own toolbars right below this header need its
  // rendered height (it wraps to two rows on mobile), so publish it as a
  // CSS variable instead of hardcoding breakpoint-specific offsets.
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const update = () =>
      document.documentElement.style.setProperty(
        '--app-header-h',
        `${el.offsetHeight}px`,
      )
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex min-h-full flex-col bg-muted/40">
      <header
        ref={headerRef}
        className="no-print sticky top-0 z-10 border-b bg-background/90 backdrop-blur"
      >
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-6 sm:py-3">
          <Logo />
          {/* Actions sit beside the logo on mobile; the nav wraps below them. */}
          <div className="order-2 ml-auto flex min-w-0 items-center gap-1 sm:order-3 sm:gap-2">
            <UndoRedoButtons />
            <HistoryPanelButton />
            <AiPanelButton />
            <ImportExportButtons />
            <SettingsMenu />
          </div>
          <nav className="order-3 flex w-full items-center gap-1 sm:order-2 sm:w-auto">
            <NavLink to="/profile" className={navLinkClass}>
              Master Profile
            </NavLink>
            <NavLink to="/variants" className={navLinkClass}>
              Variants
            </NavLink>
          </nav>
        </div>
      </header>
      <main
        className={cn(
          'w-full flex-1 px-3 py-4 sm:px-6 sm:py-6',
          // Room for the docked assistant, so it never covers the preview.
          aiOpen && 'lg:pr-[calc(24rem+1.5rem)]',
        )}
      >
        <Outlet />
      </main>
      <HistoryPanel />
      <AiPanel />
    </div>
  )
}
