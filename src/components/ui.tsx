import type { ReactNode } from 'react'

/** Small shared UI primitives for the app chrome (Tailwind-styled). */

export function Button({
  children,
  variant = 'default',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
}) {
  const styles: Record<string, string> = {
    default:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    danger:
      'border border-red-200 bg-white text-red-600 hover:bg-red-50',
    ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
  }
  return (
    <button
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={`${inputClass} min-h-[72px] resize-y ${props.className ?? ''}`}
    />
  )
}

/** Up/down/remove control cluster used on every list item. */
export function ItemControls({
  onUp,
  onDown,
  onRemove,
  disableUp,
  disableDown,
}: {
  onUp: () => void
  onDown: () => void
  onRemove: () => void
  disableUp?: boolean
  disableDown?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onUp}
        disabled={disableUp}
        title="Move up"
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
      >
        ↑
      </button>
      <button
        onClick={onDown}
        disabled={disableDown}
        title="Move down"
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
      >
        ↓
      </button>
      <button
        onClick={onRemove}
        title="Remove"
        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
      >
        ✕
      </button>
    </div>
  )
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">
      {children}
    </p>
  )
}
