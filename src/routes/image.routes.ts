import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.middleware'
import { uploadImageSchema } from '../schemas/image.schema'
import { nanoid } from 'nanoid'

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
imageRouter.post('/', zValidator('form', uploadImageSchema), async (c) => {
  try {
    const { image } = c.req.valid('form')
    const userId = c.get('userId')

    // Validar que sea una imagen
    if (!image.type.startsWith('image/')) {
      return c.json({
        success: false,
        error: 'El archivo debe ser una imagen',
      }, 400)
    }

    // Generar nombre único para la imagen
    const extension = image.name.split('.').pop()
    const imageKey = `${userId}/${nanoid()}.${extension}`

    // Subir a R2
    await c.env.IMAGES.put(imageKey, image.stream(), {
      httpMetadata: {
        contentType: image.type,
      },
    })

    // URL pública de la imagen
    const imageUrl = `/images/${imageKey}`

    return c.json({
      success: true,
      data: {
        url: imageUrl,
        key: imageKey,
        size: image.size,
        contentType: image.type,
      },
    }, 201)
  } catch (error) {
    console.error('Error uploading image:', error)
    return c.json({
      success: false,
      error: 'Error al subir la imagen',
    }, 500)
  }
})

// Obtener imagen
imageRouter.get('/:userId/:imageId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const imageId = c.req.param('imageId')
    const imageKey = `${userId}/${imageId}`

    const object = await c.env.IMAGES.get(imageKey)

    if (!object) {
      return c.json({
        success: false,
        error: 'Imagen no encontrada',
      }, 404)
    }

    // Retornar la imagen con sus headers correctos
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000',
        'ETag': object.etag,
      },
    })
  } catch (error) {
    console.error('Error getting image:', error)
    return c.json({
      success: false,
      error: 'Error al obtener la imagen',
    }, 500)
  }
})

// Eliminar imagen
imageRouter.delete('/:userId/:imageId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const imageId = c.req.param('imageId')
    const currentUserId = c.get('userId')

    // Verificar que el usuario sea dueño de la imagen
    if (userId !== currentUserId) {
      return c.json({
        success: false,
        error: 'No tienes permisos para eliminar esta imagen',
      }, 403)
    }

    const imageKey = `${userId}/${imageId}`

    // Verificar que la imagen existe
    const exists = await c.env.IMAGES.head(imageKey)
    if (!exists) {
      return c.json({
        success: false,
        error: 'Imagen no encontrada',
      }, 404)
    }

    // Eliminar de R2
    await c.env.IMAGES.delete(imageKey)

    return c.json({
      success: true,
      data: {
        message: 'Imagen eliminada exitosamente',
      },
    })
  } catch (error) {
    console.error('Error deleting image:', error)
    return c.json({
      success: false,
      error: 'Error al eliminar la imagen',
    }, 500)
  }
})

export default imageRouter
