import { useSyncExternalStore } from 'react'

/**
 * Column count for the master-profile grid, chosen from viewport width *and*
 * aspect ratio: a short-but-wide laptop (1440x900) reads better in two columns
 * than three, so the third column only appears once the viewport is both wide
 * and at least 3:2. Portrait and tablet widths collapse to a single column.
 */
const THREE_COLUMNS = '(min-width: 1500px) and (min-aspect-ratio: 3/2)'
const TWO_COLUMNS = '(min-width: 1024px)'

export type ColumnCount = 1 | 2 | 3

function subscribe(onChange: () => void) {
  const queries = [
    window.matchMedia(THREE_COLUMNS),
    window.matchMedia(TWO_COLUMNS),
  ]
  queries.forEach((q) => q.addEventListener('change', onChange))
  return () => queries.forEach((q) => q.removeEventListener('change', onChange))
}

function getColumns(): ColumnCount {
  if (window.matchMedia(THREE_COLUMNS).matches) return 3
  if (window.matchMedia(TWO_COLUMNS).matches) return 2
  return 1
}

export function useResponsiveColumns(): ColumnCount {
  return useSyncExternalStore(subscribe, getColumns)
}
