import { NavLink, Outlet } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { ImportExportButtons } from './ImportExportButtons'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(buttonVariants({ variant: isActive ? 'default' : 'ghost' }))

export function Layout() {
  return (
    <div className="flex min-h-full flex-col bg-muted/40">
      <header className="no-print sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <span className="text-lg font-semibold tracking-tight">
              CV Maker
            </span>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/profile" className={navLinkClass}>
              Master Profile
            </NavLink>
            <NavLink to="/variants" className={navLinkClass}>
              Variants
            </NavLink>
          </nav>
          <div className="ml-auto">
            <ImportExportButtons />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
