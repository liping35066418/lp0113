import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'
import { authMiddleware } from '../middleware.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body
  if (!userId) {
    res.status(400).json({
      code: 400,
      message: '缺少 userId 参数',
      data: null,
    })
    return
  }
  const user = store.users.get(userId)
  if (!user) {
    res.status(401).json({
      code: 401,
      message: '用户不存在',
      data: null,
    })
    return
  }
  res.status(200).json({
    code: 200,
    message: '登录成功',
    data: user,
  })
})

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    code: 200,
    message: '获取当前用户成功',
    data: req.user ?? null,
  })
})

router.get('/users', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    code: 200,
    message: '获取用户列表成功',
    data: store.users.list(),
  })
})

export default router
