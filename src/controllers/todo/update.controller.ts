import { Context } from 'hono'
import type { Todo } from '../../types/todo.types'
import type { UpdateTodoInput } from '../../schemas/todo.schema'
import { deleteImageFromR2 } from '../../utils/r2'

type Bindings = {
  DB: D1Database
  IMAGES: R2Bucket
}

type Variables = {
  userId: string
}

export const updateTodoController = async (c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
  try {
    const id = c.req.param('id')
    const userId = c.get('userId')
    const existing = await c.env.DB.prepare(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?',
    ).bind(id, userId).first()

    if (!existing) {
      return c.json({
        success: false,
        error: 'Todo not found',
      }, 404)
    }

    const body = await c.req.json() as UpdateTodoInput

    // Si la imagen cambió, eliminar la anterior de R2
    const oldPhotoUri = existing.photo_uri as string | undefined
    if (oldPhotoUri && oldPhotoUri !== body.photoUri) {
      await deleteImageFromR2(c.env.IMAGES, oldPhotoUri)
    }

    const now = new Date().toISOString()

    await c.env.DB.prepare(
      `UPDATE todos 
       SET title = ?, completed = ?, latitude = ?, longitude = ?, photo_uri = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    ).bind(
      body.title,
      body.completed ? 1 : 0,
      body.location?.latitude || null,
      body.location?.longitude || null,
      body.photoUri || null,
      now,
      id,
      userId,
    ).run()

    const updatedTodo: Todo = {
      id,
      userId,
      title: body.title,
      completed: body.completed ?? false,
      location: body.location,
      photoUri: body.photoUri,
      createdAt: existing.created_at as string,
      updatedAt: now,
    }

    return c.json({
      success: true,
      data: updatedTodo,
    })
  } catch {
    return c.json({
      success: false,
      error: 'Invalid request body',
    }, 400)
  }
}
