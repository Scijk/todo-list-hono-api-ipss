import { z } from '@hono/zod-openapi'

// Response Schemas
export const imageSuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    url: z.string(),
    key: z.string(),
    size: z.number(),
    contentType: z.string(),
  }),
})

export const imageDeleteSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
})
