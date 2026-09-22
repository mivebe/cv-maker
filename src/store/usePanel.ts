import { useEffect } from 'react'
import { create } from 'zustand'
import { useSaves } from './useSaves'

/**
 * The right-hand panel's own state. It starts closed and only the header
 * button (or Ctrl+S with no save yet) opens it, so it never competes with the
 * editors for space.
 */

export type PanelTab = 'history' | 'saves'

interface PanelState {
  open: boolean
  tab: PanelTab
  /** The "Save as..." prompt, which Ctrl+S raises when no save is active. */
  saveAsOpen: boolean
  openPanel: (tab?: PanelTab) => void
  setOpen: (open: boolean) => void
  setTab: (tab: PanelTab) => void
  setSaveAsOpen: (open: boolean) => void
}

export const usePanel = create<PanelState>((set) => ({
  open: false,
  tab: 'history',
  saveAsOpen: false,
  openPanel: (tab) => set((s) => ({ open: true, tab: tab ?? s.tab })),
  setOpen: (open) => set({ open }),
  setTab: (tab) => set({ tab }),
  setSaveAsOpen: (saveAsOpen) => set({ saveAsOpen }),
}))

/**
 * Ctrl+S saves into the active save. With none yet, it opens the panel on the
 * Saves tab and asks for a name instead of inventing one behind your back.
 */
export function useSaveShortcut() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return
      if (e.key.toLowerCase() !== 's') return
      e.preventDefault()
      const { activeId, save } = useSaves.getState()
      if (activeId) {
        // Silent success: the header shows the confirmation, so saving does
        // not yank the panel open over whatever you were editing.
        save()
      } else {
        usePanel.setState({ open: true, tab: 'saves', saveAsOpen: true })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
