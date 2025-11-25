import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { registerSchema, loginSchema } from '../schemas/auth.schema'
import { registerController } from '../controllers/auth/register.controller'
import { loginController } from '../controllers/auth/login.controller'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  PASSWORD_SALT: string
}

const authRouter = new Hono<{ Bindings: Bindings }>()

// POST /auth/register - Registrar nuevo usuario
authRouter.post('/register', zValidator('json', registerSchema), registerController)

// POST /auth/login - Iniciar sesión
authRouter.post('/login', zValidator('json', loginSchema), loginController)

export default authRouter
