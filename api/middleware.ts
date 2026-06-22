import type { Request, Response, NextFunction } from 'express'
import { store, setCurrentOperator } from './store.js'
import type { PermissionType, User } from '../shared/types.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: User
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const userId = req.headers['x-user-id'] as string

  if (!userId) {
    res.status(401).json({
      code: 401,
      message: '未授权：缺少 x-user-id 请求头',
      data: null,
    })
    return
  }

  const user = store.users.get(userId)
  if (!user) {
    res.status(401).json({
      code: 401,
      message: '未授权：用户不存在',
      data: null,
    })
    return
  }

  req.user = user
  setCurrentOperator(user)
  next()
}

export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const userId = req.headers['x-user-id'] as string
  if (userId) {
    const user = store.users.get(userId)
    if (user) {
      req.user = user
      setCurrentOperator(user)
    }
  }
  next()
}

interface PermissionMiddlewareOptions {
  permissionType?: PermissionType
  required?: boolean
}

export const permissionMiddleware = (
  options: PermissionMiddlewareOptions = {},
) => {
  const { permissionType, required = true } = options

  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user
    if (!user) {
      res.status(401).json({
        code: 401,
        message: '未授权：请先进行身份认证',
        data: null,
      })
      return
    }

    if (user.role === 'admin') {
      next()
      return
    }

    let componentId: string | null = null

    if (req.params.componentId) {
      componentId = req.params.componentId
    } else if (req.query.componentId && typeof req.query.componentId === 'string') {
      componentId = req.query.componentId
    } else if (req.body && req.body.componentId) {
      componentId = req.body.componentId
    } else if (req.params.branchId) {
      const branch = store.branches.get(req.params.branchId)
      componentId = branch?.componentId ?? null
    } else if (req.query.branchId && typeof req.query.branchId === 'string') {
      const branch = store.branches.get(req.query.branchId)
      componentId = branch?.componentId ?? null
    } else if (req.body && req.body.branchId) {
      const branch = store.branches.get(req.body.branchId)
      componentId = branch?.componentId ?? null
    }

    if (!componentId) {
      if (!required) {
        next()
        return
      }
      res.status(400).json({
        code: 400,
        message: '无法解析目标组件ID',
        data: null,
      })
      return
    }

    const component = store.components.get(componentId)
    if (!component) {
      if (!required) {
        next()
        return
      }
      res.status(404).json({
        code: 404,
        message: `组件 ${componentId} 不存在`,
        data: null,
      })
      return
    }

    if (component.ownerGroupId === user.groupId) {
      next()
      return
    }

    const actualType =
      permissionType ||
      (req.url.includes('/publish')
        ? 'canPublish'
        : req.method === 'GET'
          ? 'canRead'
          : 'canWrite')

    const perm = store.permissions.get(user.groupId, componentId)
    if (!perm || !perm[actualType]) {
      res.status(403).json({
        code: 403,
        message: `无权限：缺少对组件 ${component.name} 的 ${actualType} 权限`,
        data: null,
      })
      return
    }

    next()
  }
}
