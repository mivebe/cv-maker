import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type MouseEvent,
} from 'react'

/**
 * Links the two halves of the variant editor: hovering a control on the left
 * highlights the part of the document it produces, and hovering a block of the
 * document highlights the control responsible for it. Both sides simply tag
 * their nodes with the same id - a section key ("experience", "custom:abc") or
 * a master item id - and the pair lights up together.
 *
 * Outside a provider (the master profile preview, the print clone) every hook
 * here is inert, so the document stays a plain renderer.
 */
interface Highlight {
  id: string | null
  set: (id: string | null) => void
}

const HighlightContext = createContext<Highlight | null>(null)

/** The id shared by the document header and the variant details card. */
export const BASICS_ID = 'basics'

export function HighlightProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string | null>(null)
  const value = useMemo(() => ({ id, set: setId }), [id])
  return (
    <HighlightContext.Provider value={value}>
      {children}
    </HighlightContext.Provider>
  )
}

/**
 * Returns a tagger: spread `hl(id)` onto any node to link it to its twin on the
 * other side. Hover is resolved by delegation on the pane (see
 * `useHighlightSurface`) rather than per-node enter/leave handlers, so a nested
 * pair - an item inside a section - always resolves to the innermost node the
 * pointer is actually over.
 */
export function useHighlightNode() {
  const ctx = useContext(HighlightContext)
  const active = ctx?.id
  return useCallback(
    (id: string | undefined) =>
      id
        ? {
            'data-hl-id': id,
            'data-hl': active === id ? 'true' : undefined,
          }
        : {},
    [active],
  )
}

/**
 * Handlers for a pane that contains hover-linked nodes. The pane must also
 * carry the `hl-surface` class: the highlight styles are scoped to it, which is
 * what keeps them out of the print clone (whose root is the document itself).
 */
export function useHighlightSurface() {
  const ctx = useContext(HighlightContext)
  const set = ctx?.set

  const onMouseOver = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (!set) return
      const node = (e.target as HTMLElement).closest('[data-hl-id]')
      set(node?.getAttribute('data-hl-id') ?? null)
    },
    [set],
  )
  const onMouseLeave = useCallback(() => set?.(null), [set])

  return { onMouseOver, onMouseLeave }
}
