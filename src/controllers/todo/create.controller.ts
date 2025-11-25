import { Context } from 'hono'
import { nanoid } from 'nanoid'
import type { Todo } from '../../types/todo.types'
import type { CreateTodoInput } from '../../schemas/todo.schema'

type Bindings = {
  DB: D1Database
}

type Variables = {
  userId: string
}

export const createTodoController = async (c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
  try {
    const body = await c.req.json() as CreateTodoInput
    const userId = c.get('userId')

    const now = new Date().toISOString()
    const id = nanoid()

    await c.env.DB.prepare(
      `INSERT INTO todos (id, user_id, title, completed, latitude, longitude, photo_uri, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      userId,
      body.title,
      body.completed ? 1 : 0,
      body.location?.latitude || null,
      body.location?.longitude || null,
      body.photoUri || null,
      now,
      now,
    ).run()

    const newTodo: Todo = {
      id,
      userId,
      title: body.title,
      completed: body.completed ?? false,
      location: body.location,
      photoUri: body.photoUri,
      createdAt: now,
      updatedAt: now,
    }

    return c.json({
      success: true,
      data: newTodo,
    }, 201)
  } catch {
    return c.json({
      success: false,
      error: 'Invalid request body',
    }, 400)
  }
}
