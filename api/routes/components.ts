import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'
import { authMiddleware } from '../middleware.js'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { status, ownerGroupId } = req.query
  const filter: Record<string, unknown> = {}
  if (status) filter.status = status
  if (ownerGroupId) filter.ownerGroupId = ownerGroupId
  const components = Object.keys(filter).length > 0
    ? store.components.list((c) => {
        let match = true
        if (filter.status) match = match && c.status === filter.status
        if (filter.ownerGroupId) match = match && c.ownerGroupId === filter.ownerGroupId
        return match
      })
    : store.components.list()

  res.status(200).json({
    code: 200,
    message: '获取组件列表成功',
    data: components,
  })
})

router.get('/stats', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const components = store.components.list()
  const branches = store.branches.list()
  const publishRecords = store.publishRecords.list()

  const stats = {
    totalComponents: components.length,
    activeComponents: components.filter((c) => c.status === 'active').length,
    totalBranches: branches.length,
    developingBranches: branches.filter((b) => b.status === 'developing').length,
    testingBranches: branches.filter((b) => b.status === 'testing').length,
    publishedBranches: branches.filter((b) => b.status === 'published').length,
    totalPublishRecords: publishRecords.length,
    testPublishCount: publishRecords.filter((p) => p.environment === 'test').length,
    prodPublishCount: publishRecords.filter((p) => p.environment === 'prod').length,
  }

  res.status(200).json({
    code: 200,
    message: '获取统计数据成功',
    data: stats,
  })
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const component = store.components.get(req.params.id)
  if (!component) {
    res.status(404).json({
      code: 404,
      message: '组件不存在',
      data: null,
    })
    return
  }
  res.status(200).json({
    code: 200,
    message: '获取组件成功',
    data: component,
  })
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { name, description, ownerGroupId, latestVersion, status } = req.body

  if (!name || !ownerGroupId) {
    res.status(400).json({
      code: 400,
      message: '缺少必要参数: name, ownerGroupId',
      data: null,
    })
    return
  }

  const group = store.groups.get(ownerGroupId)
  if (!group) {
    res.status(404).json({
      code: 404,
      message: '所属开发组不存在',
      data: null,
    })
    return
  }

  const component = store.components.create({
    name,
    description: description ?? '',
    ownerGroupId,
    latestVersion: latestVersion ?? '1.0.0',
    status: status ?? 'active',
  })

  store.permissions.set({
    groupId: ownerGroupId,
    componentId: component.id,
    canRead: true,
    canWrite: true,
    canPublish: true,
  })

  res.status(201).json({
    code: 201,
    message: '组件创建成功',
    data: component,
  })
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { name, description, status, latestVersion } = req.body
  const component = store.components.update(req.params.id, {
    name,
    description,
    status,
    latestVersion,
  })
  if (!component) {
    res.status(404).json({
      code: 404,
      message: '组件不存在',
      data: null,
    })
    return
  }
  res.status(200).json({
    code: 200,
    message: '组件更新成功',
    data: component,
  })
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const success = store.components.remove(req.params.id)
  if (!success) {
    res.status(404).json({
      code: 404,
      message: '组件不存在',
      data: null,
    })
    return
  }
  res.status(200).json({
    code: 200,
    message: '组件删除成功',
    data: null,
  })
})

export default router
