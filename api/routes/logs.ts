import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'
import { authMiddleware } from '../middleware.js'
import { branchService, publishService, permissionService } from '../services.js'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { type, operator, success, limit } = req.query
  let logs = store.logs.list()

  if (type) {
    logs = logs.filter((l) => l.type === type)
  }
  if (operator) {
    logs = logs.filter((l) => l.operator === operator)
  }
  if (success !== undefined) {
    logs = logs.filter((l) => l.success === (success === 'true'))
  }
  if (limit) {
    logs = logs.slice(0, Number(limit))
  }

  res.status(200).json({
    code: 200,
    message: '获取操作日志成功',
    data: logs,
  })
})

router.post('/simulate/duplicate-branch', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const operatorId = 'u2'
  const result1 = branchService.createBranch({
    componentId: 'c1',
    branchName: 'feature-test-sim',
    version: '1.0.0',
    lastCommitMessage: '模拟测试：第一次创建',
    operatorId,
  })

  const result2 = branchService.createBranch({
    componentId: 'c1',
    branchName: 'feature-test-sim',
    version: '1.0.1',
    lastCommitMessage: '模拟测试：重复创建',
    operatorId,
  })

  const logs = store.logs.list().slice(0, 10)

  res.status(200).json({
    code: 200,
    message: '重复创建分支场景模拟完成',
    data: {
      firstCreate: result1,
      duplicateCreate: result2,
      recentLogs: logs,
    },
  })
})

router.post('/simulate/permission-denied', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const operatorId = 'u4'

  const createResult = branchService.createBranch({
    componentId: 'c2',
    branchName: 'feature-perm-test',
    version: '1.0.0',
    lastCommitMessage: '模拟测试：无权限创建',
    operatorId,
  })

  const permCheck = permissionService.checkPermission({
    userId: operatorId,
    componentId: 'c2',
    permission: 'canWrite',
  })

  const logs = store.logs.list().slice(0, 10)

  res.status(200).json({
    code: 200,
    message: '无权限提交场景模拟完成',
    data: {
      createResult,
      permissionCheck: permCheck,
      recentLogs: logs,
    },
  })
})

router.post('/simulate/publish-without-compat', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const operatorId = 'u3'

  const checkResult = publishService.runCompatibilityCheck('b1')

  const publishResult = publishService.publishProd({
    branchId: 'b1',
    operatorId,
  })

  const logs = store.logs.list().slice(0, 10)

  res.status(200).json({
    code: 200,
    message: '未通过兼容性校验发布场景模拟完成',
    data: {
      compatibilityCheck: checkResult,
      publishResult,
      recentLogs: logs,
    },
  })
})

export default router
