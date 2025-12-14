import { Context } from 'hono'
import type { User } from '../../types/user.types'
import type { LoginInput } from '../../schemas/auth.schema'
import { verifyPassword } from '../../utils/crypto'
import { generateToken } from '../../utils/jwt'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  PASSWORD_SALT: string
}

export const loginController = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const body = await c.req.json() as LoginInput

    // Buscar usuario
    const userRow = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?',
    ).bind(body.email.toLowerCase()).first()

    if (!userRow) {
      return c.json({
        success: false,
        error: 'Invalid credentials',
      }, 401)
    }

    const userData = userRow as Record<string, unknown>

    // Verificar contraseña
    const isValidPassword = await verifyPassword(
      body.password,
      userData.password_hash as string,
      c.env.PASSWORD_SALT,
    )

    if (!isValidPassword) {
      return c.json({
        success: false,
        error: 'Invalid credentials',
      }, 401)
    }

    const user: User = {
      id: userData.id as string,
      email: userData.email as string,
      createdAt: userData.created_at as string,
      updatedAt: userData.updated_at as string,
    }

    // Generar token
    const token = await generateToken(user.id, user.email, c.env.JWT_SECRET)

    console.log('Generated token:', token)
    return c.json({
      success: true,
      data: {
        user,
        token,
      },
    })
  } catch {
    return c.json({
      success: false,
      error: 'Login failed',
    }, 500)
  }
}
