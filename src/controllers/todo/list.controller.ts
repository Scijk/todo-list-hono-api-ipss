import { Context } from 'hono'
import type { Todo } from '../../types/todo.types'

type Bindings = {
  DB: D1Database
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

export const listTodosController = async (c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
  try {
    const userId = c.get('userId')
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC',
    ).bind(userId).all()

    const todoList = results.map(rowToTodo)

    return c.json({
      success: true,
      data: todoList,
      count: todoList.length,
    })
  } catch {
    return c.json({
      success: false,
      error: 'Failed to fetch todos',
    }, 500)
  }
}
