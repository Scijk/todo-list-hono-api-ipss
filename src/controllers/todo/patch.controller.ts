import { Context } from 'hono'
import type { Todo } from '../../types/todo.types'
import type { PatchTodoInput } from '../../schemas/todo.schema'
import { deleteImageFromR2 } from '../../utils/r2'

type Bindings = {
  DB: D1Database
  IMAGES: R2Bucket
}

type Variables = {
  userId: string
}

// Helper para convertir row de D1 a Todo
const rowToTodo = (row: unknown): Todo => {
  const r = row as Record<string, unknown>
  return {
    id: r.id as string,
    userId: r.user_id as string,
    title: r.title as string,
    completed: r.completed === 1,
    location: r.latitude && r.longitude
      ? { latitude: r.latitude as number, longitude: r.longitude as number }
      : undefined,
    photoUri: r.photo_uri ? r.photo_uri as string : undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

export const patchTodoController = async (c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
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

    const body = await c.req.json() as PatchTodoInput

    // Si se actualiza la imagen, eliminar la anterior de R2
    if (body.photoUri !== undefined) {
      const oldPhotoUri = existing.photo_uri as string | undefined
      if (oldPhotoUri && oldPhotoUri !== body.photoUri) {
        await deleteImageFromR2(c.env.IMAGES, oldPhotoUri)
      }
    }

    const now = new Date().toISOString()
    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (body.title !== undefined) {
      updates.push('title = ?')
      values.push(body.title)
    }
    if (body.completed !== undefined) {
      updates.push('completed = ?')
      values.push(body.completed ? 1 : 0)
    }
    if (body.location !== undefined) {
      updates.push('latitude = ?', 'longitude = ?')
      values.push(body.location?.latitude || null, body.location?.longitude || null)
    }
    if (body.photoUri !== undefined) {
      updates.push('photo_uri = ?')
      values.push(body.photoUri || null)
    }

    updates.push('updated_at = ?')
    values.push(now)
    values.push(id)
    values.push(userId)

    await c.env.DB.prepare(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    ).bind(...values).run()

    const updated = await c.env.DB.prepare(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?',
    ).bind(id, userId).first()

    return c.json({
      success: true,
      data: rowToTodo(updated),
    })
  } catch {
    return c.json({
      success: false,
      error: 'Invalid request body',
    }, 400)
  }
}
