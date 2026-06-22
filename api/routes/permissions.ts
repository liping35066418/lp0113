import { Router, type Request, type Response } from 'express'
import { permissionService } from '../services.js'
import { store } from '../store.js'
import { authMiddleware } from '../middleware.js'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { groupId, componentId } = req.query
  let permissions = store.permissions.list()

  if (groupId) {
    permissions = permissions.filter((p) => p.groupId === groupId)
  }
  if (componentId) {
    permissions = permissions.filter((p) => p.componentId === componentId)
  }

  res.status(200).json({
    code: 200,
    message: '获取权限配置成功',
    data: permissions,
  })
})

router.get('/matrix', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const groups = store.groups.list()
  const components = store.components.list()
  const permissions = store.permissions.list()

  const matrix = groups.map((group) => ({
    group,
    components: components.map((component) => {
      const perm = permissions.find(
        (p) => p.groupId === group.id && p.componentId === component.id,
      )
      if (component.ownerGroupId === group.id) {
        return {
          component,
          permission: {
            groupId: group.id,
            componentId: component.id,
            canRead: true,
            canWrite: true,
            canPublish: true,
          },
          isOwner: true,
        }
      }
      return {
        component,
        permission:
          perm ?? {
            groupId: group.id,
            componentId: component.id,
            canRead: false,
            canWrite: false,
            canPublish: false,
          },
        isOwner: false,
      }
    }),
  }))

  res.status(200).json({
    code: 200,
    message: '获取权限矩阵成功',
    data: { groups, components, matrix },
  })
})

router.get('/group/:groupId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const result = permissionService.getGroupPermissions(req.params.groupId)
  res.status(result.code).json(result)
})

router.put('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { groupId, componentId, canRead, canWrite, canPublish } = req.body
  const userId = req.user?.id ?? ''
  const result = permissionService.updatePermissions({
    groupId,
    componentId,
    canRead,
    canWrite,
    canPublish,
    operatorId: userId,
  })
  res.status(result.code).json(result)
})

router.post('/bulk', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { permissions } = req.body
  if (!Array.isArray(permissions)) {
    res.status(400).json({
      code: 400,
      message: 'permissions 必须是数组',
      data: null,
    })
    return
  }
  const result = store.permissions.bulkUpdate(permissions)
  res.status(200).json({
    code: 200,
    message: '批量更新权限成功',
    data: result,
  })
})

export default router
