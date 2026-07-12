import { NavLink, Outlet } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { AppearanceToggle } from './AppearanceToggle'
import { ImportExportButtons } from './ImportExportButtons'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    buttonVariants({ variant: isActive ? 'default' : 'ghost' }),
    // Full-width tap targets on the wrapped mobile nav row, natural size above.
    'h-9 flex-1 sm:h-8 sm:flex-none',
  )

export function Layout() {
  return (
    <div className="flex min-h-full flex-col bg-muted/40">
      <header className="no-print sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[100rem] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2">
            <FileText className="size-5 shrink-0 text-primary" />
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              CV Maker
            </span>
          </div>
          {/* Actions sit beside the logo on mobile; the nav wraps below them. */}
          <div className="order-2 ml-auto flex min-w-0 items-center gap-1 sm:order-3 sm:gap-2">
            <ImportExportButtons />
            <AppearanceToggle />
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
      <main className="mx-auto w-full max-w-[100rem] flex-1 px-3 py-4 sm:px-6 sm:py-6">
        <Outlet />
      </main>
    </div>
  )
}
