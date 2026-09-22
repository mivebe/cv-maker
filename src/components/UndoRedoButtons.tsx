import { Redo2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  REDO_HINT,
  selectCanRedo,
  selectCanUndo,
  UNDO_HINT,
  useHistory,
} from '../store/useHistory'

/** Header controls for the document history; the keyboard shortcut is global. */
export function UndoRedoButtons() {
  const canUndo = useHistory(selectCanUndo)
  const canRedo = useHistory(selectCanRedo)
  const undo = useHistory((s) => s.undo)
  const redo = useHistory((s) => s.redo)

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        disabled={!canUndo}
        onClick={undo}
        aria-label={`Undo (${UNDO_HINT})`}
        title={`Undo (${UNDO_HINT})`}
      >
        <Undo2 />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!canRedo}
        onClick={redo}
        aria-label={`Redo (${REDO_HINT})`}
        title={`Redo (${REDO_HINT})`}
      >
        <Redo2 />
      </Button>
    </div>
  )
}
