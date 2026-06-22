import { Router, type Request, type Response } from 'express'
import { branchService } from '../services.js'
import { store } from '../store.js'
import { authMiddleware } from '../middleware.js'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { componentId, status } = req.query
  let branches = store.branches.list()
  if (componentId) {
    branches = branches.filter((b) => b.componentId === componentId)
  }
  if (status) {
    branches = branches.filter((b) => b.status === status)
  }
  res.status(200).json({
    code: 200,
    message: '获取分支列表成功',
    data: branches,
  })
})

router.post('/check', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { componentId, branchName } = req.body
  const result = branchService.checkUnique({ componentId, branchName })
  res.status(result.code).json(result)
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const branch = store.branches.get(req.params.id)
  if (!branch) {
    res.status(404).json({
      code: 404,
      message: '分支不存在',
      data: null,
    })
    return
  }
  res.status(200).json({
    code: 200,
    message: '获取分支成功',
    data: branch,
  })
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { componentId, branchName, version, lastCommitMessage } = req.body
  const userId = req.user?.id ?? ''
  const result = branchService.createBranch({
    componentId,
    branchName,
    version,
    lastCommitMessage,
    operatorId: userId,
  })
  res.status(result.code).json(result)
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { status, lastCommitMessage, version, compatibilityChecked } = req.body
  const branch = store.branches.update(req.params.id, {
    status,
    lastCommitMessage,
    version,
    compatibilityChecked,
  })
  if (!branch) {
    res.status(404).json({
      code: 404,
      message: '分支不存在',
      data: null,
    })
    return
  }
  res.status(200).json({
    code: 200,
    message: '分支更新成功',
    data: branch,
  })
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const success = store.branches.remove(req.params.id)
  if (!success) {
    res.status(404).json({
      code: 404,
      message: '分支不存在',
      data: null,
    })
    return
  }
  res.status(200).json({
    code: 200,
    message: '分支删除成功',
    data: null,
  })
})

export default router
