import { cn } from '@/lib/utils'

/**
 * The anyCV mark: a rounded tile where the V of "CV" ends in a check - a CV
 * that is ready to send. Letters are strokes, not text, so the mark never
 * depends on a font. Keep in sync with public/favicon.svg.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="15"
        className="fill-[#2563eb] dark:fill-[#3b82f6]"
      />
      <g
        transform="translate(-6.5 -1) scale(1.2) translate(-4.5 -4.5)"
        fill="none"
        stroke="#fff"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M31.5 27.6 A7 7 0 1 0 31.5 38.4" />
        <path d="M35.5 33 L39.5 39.5 L48 24" />
      </g>
    </svg>
  )
}

/** Mark plus the "anyCV" wordmark, as used in the app header. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark className="size-7 shrink-0" />
      <span className="text-lg leading-none tracking-tight sm:text-xl">
        <span className="font-medium">any</span>
        <span className="font-extrabold text-[#2563eb] dark:text-[#60a5fa]">
          CV
        </span>
      </span>
    </span>
  )
}
