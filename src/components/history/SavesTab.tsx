import { useEffect, useState } from 'react'
import {
  Check,
  Download,
  HardDriveDownload,
  Pencil,
  Save,
  X,
} from 'lucide-react'
import { SAVE_HINT } from '../../store/useHistory'
import { usePanel } from '../../store/usePanel'
import {
  AUTOSAVE_CHOICES,
  useSavePrefs,
  useSaves,
  useUnsavedChanges,
} from '../../store/useSaves'
import { useStore } from '../../store/useStore'
import { downloadJson } from '../../lib/io'
import { readSave, MAX_SAVES, STORAGE_BUDGET } from '../../lib/saveStore'
import type { SaveMeta } from '../../lib/saveStore'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatBytes, relativeTime } from './relativeTime'

/**
 * Saves kept in the browser, so downloading JSON is not the only way to keep a
 * version of a CV around. One save is active: Ctrl+S and autosave both write
 * into it, and loading another makes that one active instead.
 */

function SaveRow({ meta, active }: { meta: SaveMeta; active: boolean }) {
  const load = useSaves((s) => s.load)
  const rename = useSaves((s) => s.rename)
  const remove = useSaves((s) => s.remove)
  const dirty = useUnsavedChanges()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(meta.name)

  const commit = () => {
    rename(meta.id, draft)
    setEditing(false)
  }

  // Loading the active save is how you throw away changes and go back to it,
  // so it stays available. It is undoable either way, but silently discarding
  // visible work is not worth the surprise.
  const onLoad = () => {
    if (
      dirty &&
      !confirm(
        active
          ? `Discard the changes made since "${meta.name}" was saved?`
          : 'The document has changes that are not in any save. Load this one anyway?',
      )
    )
      return
    load(meta.id)
  }

  const onExport = () => {
    const data = readSave(meta.id)
    if (data) downloadJson(data, `${meta.name.replace(/[^\w.-]+/g, '-')}.json`)
  }

  return (
    <div
      className={cn(
        'flex items-start gap-1.5 rounded-md px-2 py-1.5',
        active ? 'bg-accent/60' : 'hover:bg-accent/40',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-1.5 size-1.5 shrink-0 rounded-full',
          active ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      />
      <div className="min-w-0 flex-1">
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(meta.name)
                setEditing(false)
              }
            }}
            className="h-7"
          />
        ) : (
          <button
            type="button"
            onClick={onLoad}
            title={active ? 'Go back to this save' : 'Load this save'}
            className="block w-full truncate text-left text-sm"
          >
            {meta.name}
          </button>
        )}
        <span className="block truncate text-xs text-muted-foreground">
          {relativeTime(meta.updatedAt)}
          {meta.auto && ' · auto'} {'·'} {formatBytes(meta.bytes)}
        </span>
      </div>
      {!editing && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onLoad}
            title={
              active
                ? 'Go back to this save, discarding changes'
                : 'Load this save'
            }
          >
            <HardDriveDownload />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setDraft(meta.name)
              setEditing(true)
            }}
            title="Rename"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onExport}
            title="Download as JSON"
          >
            <Download />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (confirm(`Delete the save "${meta.name}"?`)) remove(meta.id)
            }}
            title="Delete"
          >
            <X />
          </Button>
        </>
      )}
    </div>
  )
}

function SaveAsRow() {
  const save = useSaves((s) => s.save)
  const open = usePanel((s) => s.saveAsOpen)
  const setOpen = usePanel((s) => s.setSaveAsOpen)
  const suggested = useStore((s) => s.profile.basics.name)
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName(suggested.trim() || 'Untitled CV')
  }, [open, suggested])

  if (!open)
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Save as new
      </Button>
    )

  const commit = () => {
    save({ name: name.trim() || 'Untitled CV' })
    setOpen(false)
  }

  return (
    <div className="flex flex-1 items-center gap-1.5">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Name this save"
        className="h-8"
      />
      <Button size="sm" onClick={commit} title="Create the save">
        <Check />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
        <X />
      </Button>
    </div>
  )
}

export function SavesTab() {
  const saves = useSaves((s) => s.saves)
  const activeId = useSaves((s) => s.activeId)
  const save = useSaves((s) => s.save)
  const used = useSaves((s) => s.used)
  const dirty = useUnsavedChanges()
  const autosave = useSavePrefs((s) => s.autosave)
  const setAutosave = useSavePrefs((s) => s.setAutosave)
  const intervalMinutes = useSavePrefs((s) => s.intervalMinutes)
  const setIntervalMinutes = useSavePrefs((s) => s.setIntervalMinutes)
  const saveAsOpen = usePanel((s) => s.saveAsOpen)

  const active = saves.find((s) => s.id === activeId)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1.5 border-b px-3 py-2 sm:px-4">
        {!saveAsOpen && (
          <Button
            size="sm"
            disabled={!activeId || !dirty}
            onClick={() => save()}
            title={
              activeId
                ? `Save into "${active?.name ?? ''}" (${SAVE_HINT})`
                : 'Create a save first'
            }
          >
            <Save />
            {dirty || !activeId ? 'Save' : 'Saved'}
          </Button>
        )}
        <SaveAsRow />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5 sm:p-2">
        {saves.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            No saves yet. {SAVE_HINT} keeps a copy of the document here, in this
            browser.
          </p>
        ) : (
          saves.map((meta) => (
            <SaveRow key={meta.id} meta={meta} active={meta.id === activeId} />
          ))
        )}
      </div>

      <div className="space-y-2 border-t px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="autosave"
            checked={autosave}
            onCheckedChange={(v) => setAutosave(v === true)}
          />
          <label htmlFor="autosave" className="text-xs">
            Autosave every
          </label>
          <Select
            value={String(intervalMinutes)}
            onValueChange={(v) => setIntervalMinutes(Number(v))}
            disabled={!autosave}
          >
            <SelectTrigger size="sm" className="h-7 w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTOSAVE_CHOICES.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {saves.length} of {MAX_SAVES} saves {'·'} {formatBytes(used)} of about{' '}
          {formatBytes(STORAGE_BUDGET)} used. The oldest autosave is dropped to
          make room; saves you make by hand are never deleted for you.
        </p>
      </div>
    </div>
  )
}
