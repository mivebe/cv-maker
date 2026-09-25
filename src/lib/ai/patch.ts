/**
 * A small RFC 6902 JSON Patch applier - the format the assistant writes its
 * edits in. Models know JSON Patch well, it addresses any spot in the document
 * (so the whole app is editable without one tool per feature), and an edit is
 * a few lines instead of the whole document echoed back, which matters on free
 * tiers where output is slow and requests are rationed.
 *
 * Every operation works on a deep copy; the input is never mutated. Errors are
 * thrown with the failing op's index and path so they can be fed back to the
 * model verbatim.
 */

export type PatchOp =
  | { op: 'add' | 'replace' | 'test'; path: string; value: unknown }
  | { op: 'remove'; path: string }
  | { op: 'move' | 'copy'; from: string; path: string }

export class PatchError extends Error {}

function parsePointer(path: string): string[] {
  if (path === '') return []
  if (!path.startsWith('/'))
    throw new PatchError(`path "${path}" must start with "/"`)
  return path
    .slice(1)
    .split('/')
    .map((t) => t.replace(/~1/g, '/').replace(/~0/g, '~'))
}

type Container = Record<string, unknown> | unknown[]

function isContainer(v: unknown): v is Container {
  return typeof v === 'object' && v !== null
}

/** Resolve all but the last token: the container the op acts inside. */
function parentOf(doc: unknown, tokens: string[], path: string): Container {
  let node = doc
  for (const t of tokens.slice(0, -1)) {
    if (!isContainer(node)) break
    node = Array.isArray(node) ? node[Number(t)] : node[t]
  }
  if (!isContainer(node))
    throw new PatchError(`path "${path}" does not exist in the document`)
  return node
}

function arrayIndex(
  arr: unknown[],
  token: string,
  path: string,
  forAdd: boolean,
) {
  if (forAdd && token === '-') return arr.length
  if (!/^(0|[1-9]\d*)$/.test(token))
    throw new PatchError(`"${token}" in "${path}" is not an array index`)
  const i = Number(token)
  const max = forAdd ? arr.length : arr.length - 1
  if (i > max)
    throw new PatchError(
      `index ${i} in "${path}" is out of range (array length ${arr.length})`,
    )
  return i
}

function get(doc: unknown, path: string): unknown {
  let node = doc
  for (const t of parsePointer(path)) {
    if (!isContainer(node))
      throw new PatchError(`path "${path}" does not exist in the document`)
    if (Array.isArray(node)) node = node[arrayIndex(node, t, path, false)]
    else {
      if (!(t in node))
        throw new PatchError(`path "${path}" does not exist in the document`)
      node = node[t]
    }
  }
  return node
}

/** Returns the new root (a root-level add/replace swaps the whole document). */
function add(doc: unknown, path: string, value: unknown): unknown {
  const tokens = parsePointer(path)
  if (!tokens.length) return value
  const parent = parentOf(doc, tokens, path)
  const last = tokens[tokens.length - 1]
  if (Array.isArray(parent))
    parent.splice(arrayIndex(parent, last, path, true), 0, value)
  else parent[last] = value
  return doc
}

function remove(doc: unknown, path: string): unknown {
  const tokens = parsePointer(path)
  if (!tokens.length) throw new PatchError('cannot remove the whole document')
  const parent = parentOf(doc, tokens, path)
  const last = tokens[tokens.length - 1]
  if (Array.isArray(parent))
    parent.splice(arrayIndex(parent, last, path, false), 1)
  else {
    if (!(last in parent))
      throw new PatchError(`path "${path}" does not exist in the document`)
    delete parent[last]
  }
  return doc
}

function replace(doc: unknown, path: string, value: unknown): unknown {
  const tokens = parsePointer(path)
  if (!tokens.length) return value
  get(doc, path) // must exist
  const parent = parentOf(doc, tokens, path)
  const last = tokens[tokens.length - 1]
  if (Array.isArray(parent))
    parent[arrayIndex(parent, last, path, false)] = value
  else parent[last] = value
  return doc
}

export function applyPatch(input: unknown, ops: PatchOp[]): unknown {
  let doc: unknown = structuredClone(input)
  ops.forEach((op, i) => {
    try {
      switch (op.op) {
        case 'add':
          doc = add(doc, op.path, structuredClone(op.value))
          break
        case 'remove':
          doc = remove(doc, op.path)
          break
        case 'replace':
          doc = replace(doc, op.path, structuredClone(op.value))
          break
        case 'move': {
          const value = get(doc, op.from)
          doc = add(remove(doc, op.from), op.path, value)
          break
        }
        case 'copy':
          doc = add(doc, op.path, structuredClone(get(doc, op.from)))
          break
        case 'test':
          if (JSON.stringify(get(doc, op.path)) !== JSON.stringify(op.value))
            throw new PatchError(`test failed at "${op.path}"`)
          break
        default:
          throw new PatchError(
            `unknown op "${(op as { op?: unknown }).op}" (use add, remove, replace, move, copy)`,
          )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new PatchError(`operation #${i} (${op.op} ${op.path}): ${msg}`)
    }
  })
  return doc
}

/** Loose shape check before applying: models sometimes emit near-misses. */
export function asPatchOps(value: unknown): PatchOp[] {
  const list = Array.isArray(value) ? value : [value]
  return list.map((raw, i) => {
    if (typeof raw !== 'object' || raw === null)
      throw new PatchError(`operation #${i} is not an object`)
    const op = raw as Record<string, unknown>
    if (typeof op.op !== 'string' || typeof op.path !== 'string')
      throw new PatchError(`operation #${i} needs string "op" and "path"`)
    if ((op.op === 'move' || op.op === 'copy') && typeof op.from !== 'string')
      throw new PatchError(`operation #${i} (${op.op}) needs a "from" path`)
    if (
      (op.op === 'add' || op.op === 'replace' || op.op === 'test') &&
      !('value' in op)
    )
      throw new PatchError(`operation #${i} (${op.op}) needs a "value"`)
    return op as unknown as PatchOp
  })
}
