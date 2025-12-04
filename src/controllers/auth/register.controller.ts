import { Context } from 'hono'
import { nanoid } from 'nanoid'
import type { User } from '../../types/user.types'
import type { RegisterInput } from '../../schemas/auth.schema'
import { hashPassword } from '../../utils/crypto'
import { generateToken } from '../../utils/jwt'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  PASSWORD_SALT: string
}

export const registerController = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const body = await c.req.json() as RegisterInput

    // Verificar si el email ya existe
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?',
    ).bind(body.email.toLowerCase()).first()

    if (existingUser) {
      return c.json({
        success: false,
        error: 'Email already registered',
      }, 409)
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(body.password, c.env.PASSWORD_SALT)

    // Crear usuario
    const now = new Date().toISOString()
    const id = nanoid()

    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(
      id,
      body.email.toLowerCase(),
      passwordHash,
      now,
      now,
    ).run()

    const user: User = {
      id,
      email: body.email.toLowerCase(),
      createdAt: now,
      updatedAt: now,
    }

    // Generar token
    const token = await generateToken(id, user.email, c.env.JWT_SECRET)

    return c.json({
      success: true,
      data: {
        user,
        token,
      },
    }, 201)
  } catch {
    return c.json({
      success: false,
      error: 'Registration failed',
    }, 500)
  }
}
