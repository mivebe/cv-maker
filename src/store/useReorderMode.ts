import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * How list items are reordered app-wide: dedicated up/down arrow buttons, or
 * grab-anywhere drag & drop. One global preference (toggled in the header) so
 * every list behaves the same; in drag mode the arrows disappear.
 *
 * A per-device preference, like appearance: it lives outside the profile store
 * and never rides along in import/export.
 */

export type ReorderMode = 'arrows' | 'drag'

interface ReorderModeState {
  mode: ReorderMode
  setMode: (mode: ReorderMode) => void
}

export const useReorderMode = create<ReorderModeState>()(
  persist((set) => ({ mode: 'arrows', setMode: (mode) => set({ mode }) }), {
    name: 'cv-maker:reorder-mode:v1',
    version: 1,
  }),
)
