import { Router, type Request, type Response } from 'express'
import { publishService } from '../services.js'
import { store } from '../store.js'
import { authMiddleware } from '../middleware.js'

const router = Router()

router.get('/records', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { environment, branchId, status } = req.query
  let records = store.publishRecords.list()

  if (environment) {
    records = records.filter((r) => r.environment === environment)
  }
  if (branchId) {
    records = records.filter((r) => r.branchId === branchId)
  }
  if (status) {
    records = records.filter((r) => r.status === status)
  }

  res.status(200).json({
    code: 200,
    message: '获取发布记录成功',
    data: records,
  })
})

router.post('/compatibility-check', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { branchId } = req.body
  if (!branchId) {
    res.status(400).json({
      code: 400,
      message: '缺少必要参数: branchId',
      data: null,
    })
    return
  }
  const result = publishService.runCompatibilityCheck(branchId)
  res.status(200).json({
    code: 200,
    message: result.details,
    data: result,
  })
})

router.post('/test', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { branchId } = req.body
  const userId = req.user?.id ?? ''
  const result = publishService.publishTest({ branchId, operatorId: userId })
  res.status(result.code).json(result)
})

router.post('/prod', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { branchId } = req.body
  const userId = req.user?.id ?? ''
  const result = publishService.publishProd({ branchId, operatorId: userId })
  res.status(result.code).json(result)
})

export default router
