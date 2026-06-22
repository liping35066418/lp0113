import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import componentsRoutes from './routes/components.js'
import branchesRoutes from './routes/branches.js'
import groupsRoutes from './routes/groups.js'
import permissionsRoutes from './routes/permissions.js'
import publishRoutes from './routes/publish.js'
import logsRoutes from './routes/logs.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/components', componentsRoutes)
app.use('/api/branches', branchesRoutes)
app.use('/api/groups', groupsRoutes)
app.use('/api/permissions', permissionsRoutes)
app.use('/api/publish', publishRoutes)
app.use('/api/logs', logsRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      code: 200,
      message: 'ok',
      data: { status: 'running' },
    })
  },
)

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'API not found',
    data: null,
  })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  void _next
  console.error('Server error:', error)
  res.status(500).json({
    code: 500,
    message: 'Server internal error',
    data: null,
  })
})

export default app
