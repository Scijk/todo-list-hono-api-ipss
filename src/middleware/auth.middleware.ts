import type { Context, Next } from 'hono'
import { verifyToken } from '../utils/jwt'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

type Variables = {
  userId: string
  userEmail: string
}

export const authMiddleware = async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: 'Missing or invalid authorization header',
    }, 401)
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token, c.env.JWT_SECRET)

  if (!payload) {
    return c.json({
      success: false,
      error: 'Invalid or expired token',
    }, 401)
  }

  // Guardar el userId y email en el contexto para usar en los handlers
  c.set('userId', payload.userId)
  c.set('userEmail', payload.email)

  await next()
}
