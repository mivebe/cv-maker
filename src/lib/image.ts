/**
 * Avatar uploads are kept as data URLs so they survive a JSON export and a
 * reload, which means they also have to fit in localStorage next to the rest of
 * the profile. A phone photo base64s to several megabytes and blows the ~5MB
 * quota - the write then fails and the whole profile silently stops saving. So
 * every upload is re-encoded down to something a CV actually needs first.
 */

/** Longest edge we keep. The avatar prints at ~30mm, so 512px is already 2x. */
export const AVATAR_MAX_PX = 512

/** Formats that can carry transparency - a cutout avatar must not lose it. */
const ALPHA_TYPES = /^image\/(png|gif|webp|svg\+xml)$/

let webpOk: boolean | null = null

/** WebP keeps alpha at a fraction of PNG's size, but only if we can encode it. */
function canEncodeWebp(): boolean {
  if (webpOk === null) {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    webpOk = c.toDataURL('image/webp').startsWith('data:image/webp')
  }
  return webpOk
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Unreadable image'))
    reader.onerror = () => reject(reader.error ?? new Error('Unreadable image'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unsupported image'))
    img.src = src
  })
}

/**
 * Read an uploaded image into a data URL no larger than `maxPx` on its longest
 * edge. Rejects if the file isn't a decodable image.
 */
export async function fileToAvatarDataUrl(
  file: File,
  maxPx = AVATAR_MAX_PX,
): Promise<string> {
  const original = await readAsDataUrl(file)
  const img = await loadImage(original)

  const longest = Math.max(img.naturalWidth, img.naturalHeight)
  // An SVG reports no intrinsic size in some browsers; leave it as-is rather
  // than rasterising it to a guessed box - it is tiny anyway.
  if (!longest) return original

  const scale = Math.min(1, maxPx / longest)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) return original
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const type = canEncodeWebp()
    ? 'image/webp'
    : ALPHA_TYPES.test(file.type)
      ? 'image/png'
      : 'image/jpeg'
  const encoded = canvas.toDataURL(type, 0.9)

  // Re-encoding a small, already-lean file can make it bigger; keep the winner.
  return encoded.length < original.length ? encoded : original
}
