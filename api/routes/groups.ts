import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'
import { authMiddleware } from '../middleware.js'

const router = Router()

router.get('/', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    code: 200,
    message: '获取开发组列表成功',
    data: store.groups.list(),
  })
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const group = store.groups.get(req.params.id)
  if (!group) {
    res.status(404).json({
      code: 404,
      message: '开发组不存在',
      data: null,
    })
    return
  }
  const members = store.users.list().filter((u) => group.memberIds.includes(u.id))
  res.status(200).json({
    code: 200,
    message: '获取开发组成功',
    data: { ...group, members },
  })
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { name, memberIds } = req.body
  if (!name) {
    res.status(400).json({
      code: 400,
      message: '缺少必要参数: name',
      data: null,
    })
    return
  }
  const group = store.groups.create({ name, memberIds: memberIds ?? [] })
  res.status(201).json({
    code: 201,
    message: '开发组创建成功',
    data: group,
  })
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { name, memberIds } = req.body
  const group = store.groups.update(req.params.id, { name, memberIds })
  if (!group) {
    res.status(404).json({
      code: 404,
      message: '开发组不存在',
      data: null,
    })
    return
  }
  res.status(200).json({
    code: 200,
    message: '开发组更新成功',
    data: group,
  })
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const success = store.groups.remove(req.params.id)
  if (!success) {
    res.status(404).json({
      code: 404,
      message: '开发组不存在',
      data: null,
    })
    return
  }
  res.status(200).json({
    code: 200,
    message: '开发组删除成功',
    data: null,
  })
})

export default router
