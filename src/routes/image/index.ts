/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIHono } from '@hono/zod-openapi'
import { authMiddleware } from '@/middleware/auth.middleware'
import { uploadImageController } from '@/controllers/image/upload.controller'
import { getImageController } from '@/controllers/image/get.controller'
import { deleteImageController } from '@/controllers/image/delete.controller'
import { uploadImageRoute } from './upload.route'
import { getImageRoute } from './get.route'
import { deleteImageRoute } from './delete.route'

type Bindings = {
  IMAGES: R2Bucket
}

type Variables = {
  userId: string
}

// TODO: Fix any types in controllers. This requires updating hono/zod-openapi to support generics in controllers.

const imageRouter = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>()

// GET /:userId/:imageId - Obtener imagen (público)
imageRouter.openapi(getImageRoute, async (c) => {
  return (await getImageController(c as any)) as any
})

// Middleware de autenticación para rutas protegidas
imageRouter.use('/*', authMiddleware)

// POST / - Subir imagen (protegido)
imageRouter.openapi(uploadImageRoute, async (c) => {
  return (await uploadImageController(c)) as any
})

// DELETE /:userId/:imageId - Eliminar imagen (protegido)
imageRouter.openapi(deleteImageRoute, async (c) => {
  return (await deleteImageController(c)) as any
})

export default imageRouter
