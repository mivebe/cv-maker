import { z } from 'zod'
import { masterProfileSchema } from './profile'
import { variantSchema } from './variant'

export * from './profile'
export * from './variant'

/**
 * The complete persisted/exported document. `version` guards migrations:
 * v1 was the fixed-shape profile (named arrays per section); v2 is the
 * one-ordered-sections-array shape. There is no v1 -> v2 migration - io.ts
 * rejects v1 files with a clear message instead of silently importing an
 * empty profile.
 */
export const appDataSchema = z.object({
  version: z.literal(2),
  profile: masterProfileSchema,
  variants: z.array(variantSchema),
})

export type AppData = z.infer<typeof appDataSchema>
export const APP_DATA_VERSION = 2 as const
