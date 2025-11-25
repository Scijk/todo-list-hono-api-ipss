import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createTodoSchema, updateTodoSchema, patchTodoSchema } from '../schemas/todo.schema'
import { authMiddleware } from '../middleware/auth.middleware'
import { listTodosController } from '../controllers/todo/list.controller'
import { getTodoController } from '../controllers/todo/get.controller'
import { createTodoController } from '../controllers/todo/create.controller'
import { updateTodoController } from '../controllers/todo/update.controller'
import { patchTodoController } from '../controllers/todo/patch.controller'
import { deleteTodoController } from '../controllers/todo/delete.controller'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  IMAGES: R2Bucket
}

type Variables = {
  userId: string
}

const todoRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Aplicar middleware de autenticación a todas las rutas
todoRouter.use('/*', authMiddleware)

// GET /todos - Listar todos
todoRouter.get('/', listTodosController)

// GET /todos/:id - Obtener un todo por ID
todoRouter.get('/:id', getTodoController)

// POST /todos - Crear un nuevo todo
todoRouter.post('/', zValidator('json', createTodoSchema), createTodoController)

// PUT /todos/:id - Actualizar un todo completamente
todoRouter.put('/:id', zValidator('json', updateTodoSchema), updateTodoController)

// PATCH /todos/:id - Actualizar parcialmente un todo
todoRouter.patch('/:id', zValidator('json', patchTodoSchema), patchTodoController)

// DELETE /todos/:id - Eliminar un todo
todoRouter.delete('/:id', deleteTodoController)

export default todoRouter
