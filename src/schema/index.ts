import { z } from 'zod'
import { masterProfileSchema } from './profile'
import { variantSchema } from './variant'

export * from './profile'
export * from './variant'

/** The complete persisted/exported document. `version` guards future migrations. */
export const appDataSchema = z.object({
  version: z.literal(1),
  profile: masterProfileSchema,
  variants: z.array(variantSchema),
})

export type AppData = z.infer<typeof appDataSchema>
export const APP_DATA_VERSION = 1 as const
