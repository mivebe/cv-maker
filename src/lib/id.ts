/** Short, collision-resistant id for items and variants. */
export function newId(prefix = 'id'): string {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
  return `${prefix}_${rand}`
}
