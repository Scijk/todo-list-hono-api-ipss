import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.middleware'
import { uploadImageSchema } from '../schemas/image.schema'
import { uploadImageController } from '../controllers/image/upload.controller'
import { getImageController } from '../controllers/image/get.controller'
import { deleteImageController } from '../controllers/image/delete.controller'

type Bindings = {
  IMAGES: R2Bucket
}

type Variables = {
  userId: string
}

const imageRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware de autenticación para todas las rutas
imageRouter.use('/*', authMiddleware)

// Subir imagen
imageRouter.post('/', zValidator('form', uploadImageSchema), uploadImageController)

// Obtener imagen
imageRouter.get('/:userId/:imageId', getImageController)

// Eliminar imagen
imageRouter.delete('/:userId/:imageId', deleteImageController)

export default imageRouter
