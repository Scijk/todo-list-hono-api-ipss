import { Context } from 'hono'

type Bindings = {
  IMAGES: R2Bucket
}

export const getImageController = async (c: Context<{ Bindings: Bindings }>) => {
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
}
