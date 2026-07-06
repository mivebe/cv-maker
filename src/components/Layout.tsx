import { NavLink, Outlet } from 'react-router-dom'
import { ImportExportButtons } from './ImportExportButtons'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

export function Layout() {
  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900">
      <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/vite.svg" alt="" className="h-6 w-6" />
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
            <NavLink to="/list" className={navLinkClass}>
              List
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
