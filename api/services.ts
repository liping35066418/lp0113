/**
 * 业务逻辑服务层 (Services)
 * 包含分支管理、发布管理、权限管理三大核心服务
 */

import {
  store,
  setCurrentOperator,
  type User,
  type Branch,
  type Permission,
  type OperationLogType,
} from './store.js'
import type { ApiResponse } from '../shared/types.js'

export interface CheckUniqueParams {
  componentId: string
  branchName: string
}

export interface CheckUniqueResult {
  unique: boolean
  exists: boolean
  message: string
}

export interface CreateBranchParams {
  componentId: string
  branchName: string
  version: string
  lastCommitMessage: string
  operatorId: string
}

export interface PublishParams {
  branchId: string
  operatorId: string
}

export interface CompatibilityCheckResult {
  passed: boolean
  branch: Branch | undefined
  issues: string[]
  details: string
}

export interface PublishResult {
  success: boolean
  record: ReturnType<typeof store.publishRecords.create> | null
  compatibilityCheck?: CompatibilityCheckResult
  message: string
}

export interface CheckPermissionParams {
  userId: string
  componentId: string
  permission: 'canRead' | 'canWrite' | 'canPublish'
}

export interface CheckPermissionResult {
  allowed: boolean
  user: User | undefined
  permission: Permission | undefined
  message: string
}

export interface UpdatePermissionsParams {
  groupId: string
  componentId: string
  canRead: boolean
  canWrite: boolean
  canPublish: boolean
  operatorId: string
}

function addLog(
  type: OperationLogType,
  target: string,
  detail: string,
  success: boolean,
  operatorId?: string,
) {
  if (operatorId) {
    const user = store.users.get(operatorId)
    setCurrentOperator(user ?? null)
  }
  return store.logs.add(type, target, detail, success)
}

const branchService = {
  checkUnique(params: CheckUniqueParams): ApiResponse<CheckUniqueResult> {
    const { componentId, branchName } = params

    const component = store.components.get(componentId)
    if (!component) {
      return {
        code: 404,
        message: '组件不存在',
        data: {
          unique: false,
          exists: false,
          message: '组件不存在',
        },
      }
    }

    const existingBranch = store.branches.findByComponentAndName(componentId, branchName)
    const unique = !existingBranch

    return {
      code: 200,
      message: unique ? '分支名唯一' : '分支名已存在',
      data: {
        unique,
        exists: !unique,
        message: unique
          ? `组件 ${component.name} 下分支名 ${branchName} 可用`
          : `组件 ${component.name} 下已存在分支 ${branchName}`,
      },
    }
  },

  createBranch(params: CreateBranchParams): ApiResponse<Branch | null> {
    const { componentId, branchName, version, lastCommitMessage, operatorId } = params

    const operator = store.users.get(operatorId)
    const operatorName = operator?.name ?? operatorId

    const component = store.components.get(componentId)
    if (!component) {
      addLog(
        'create_branch',
        `${componentId}/${branchName}`,
        `创建分支失败: 组件 ${componentId} 不存在`,
        false,
        operatorId,
      )
      return {
        code: 404,
        message: '组件不存在',
        data: null,
      }
    }

    const uniqueCheck = this.checkUnique({ componentId, branchName })
    if (!uniqueCheck.data.unique) {
      addLog(
        'duplicate_branch',
        `${component.name}/${branchName}`,
        `创建分支拦截: 分支名 ${branchName} 已存在于组件 ${component.name}`,
        false,
        operatorId,
      )
      return {
        code: 409,
        message: `分支名 ${branchName} 已存在`,
        data: null,
      }
    }

    const permCheck = permissionService.checkPermission({
      userId: operatorId,
      componentId,
      permission: 'canWrite',
    })
    if (!permCheck.data.allowed) {
      addLog(
        'permission_denied',
        `${component.name}/${branchName}`,
        `创建分支拦截: 用户 ${operatorName} 对组件 ${component.name} 无写入权限`,
        false,
        operatorId,
      )
      return {
        code: 403,
        message: permCheck.data.message,
        data: null,
      }
    }

    const newBranch = store.branches.create({
      componentId,
      componentName: component.name,
      name: branchName,
      version,
      createdBy: operatorId,
      status: 'developing',
      compatibilityChecked: false,
      lastCommitMessage,
    })

    addLog(
      'create_branch',
      `${component.name}/${branchName}`,
      `创建分支成功: 版本 ${version}, 初始提交: ${lastCommitMessage}`,
      true,
      operatorId,
    )

    return {
      code: 201,
      message: '分支创建成功',
      data: newBranch,
    }
  },
}

const publishService = {
  runCompatibilityCheck(branchId: string): CompatibilityCheckResult {
    const branch = store.branches.get(branchId)
    const issues: string[] = []

    if (!branch) {
      return {
        passed: false,
        branch: undefined,
        issues: ['分支不存在'],
        details: '未找到指定的分支',
      }
    }

    if (branch.status === 'published') {
      issues.push('该分支已发布过，不可重复发布')
    }

    if (branch.status === 'developing') {
      issues.push('分支仍处于开发状态，请先标记为就绪')
    }

    if (!branch.lastCommitMessage || branch.lastCommitMessage.trim().length === 0) {
      issues.push('缺少提交信息，请补充最后一次提交的说明')
    }

    if (branch.version.includes('dev') || branch.version.includes('alpha')) {
      issues.push('版本号包含开发标签 (dev/alpha)，不建议发布生产环境')
    }

    const component = store.components.get(branch.componentId)
    if (component?.status === 'deprecated') {
      issues.push(`所属组件 ${component.name} 已标记为弃用状态`)
    }

    const passed = issues.length === 0

    return {
      passed,
      branch,
      issues,
      details: passed
        ? `分支 ${branch.name} 兼容性校验通过，所有检查项均满足`
        : `分支 ${branch.name} 兼容性校验未通过，共发现 ${issues.length} 个问题`,
    }
  },

  publishTest(params: PublishParams): ApiResponse<PublishResult> {
    const { branchId, operatorId } = params

    const operator = store.users.get(operatorId)
    const operatorName = operator?.name ?? operatorId

    const branch = store.branches.get(branchId)
    if (!branch) {
      addLog(
        'publish_test',
        `branch:${branchId}`,
        '测试环境发布失败: 分支不存在',
        false,
        operatorId,
      )
      return {
        code: 404,
        message: '分支不存在',
        data: {
          success: false,
          record: null,
          message: '分支不存在',
        },
      }
    }

    const permCheck = permissionService.checkPermission({
      userId: operatorId,
      componentId: branch.componentId,
      permission: 'canPublish',
    })
    if (!permCheck.data.allowed) {
      addLog(
        'permission_denied',
        `${branch.componentName}/${branch.name}`,
        `测试发布拦截: 用户 ${operatorName} 对组件 ${branch.componentName} 无发布权限`,
        false,
        operatorId,
      )
      return {
        code: 403,
        message: permCheck.data.message,
        data: {
          success: false,
          record: null,
          message: permCheck.data.message,
        },
      }
    }

    const publishRecord = store.publishRecords.create({
      branchId,
      componentName: branch.componentName,
      branchName: branch.name,
      environment: 'test',
      status: 'success',
      operator: operatorId,
      message: `测试环境发布成功，分支版本 ${branch.version}`,
    })

    store.branches.update(branchId, { status: 'testing' })

    addLog(
      'publish_test',
      `${branch.componentName}/${branch.name}`,
      `测试环境发布成功: 版本 ${branch.version}`,
      true,
      operatorId,
    )

    return {
      code: 200,
      message: '测试环境发布成功',
      data: {
        success: true,
        record: publishRecord,
        message: '测试环境发布成功',
      },
    }
  },

  publishProd(params: PublishParams): ApiResponse<PublishResult> {
    const { branchId, operatorId } = params

    const operator = store.users.get(operatorId)
    const operatorName = operator?.name ?? operatorId

    const branch = store.branches.get(branchId)
    if (!branch) {
      addLog(
        'publish_prod',
        `branch:${branchId}`,
        '生产环境发布失败: 分支不存在',
        false,
        operatorId,
      )
      return {
        code: 404,
        message: '分支不存在',
        data: {
          success: false,
          record: null,
          message: '分支不存在',
        },
      }
    }

    const permCheck = permissionService.checkPermission({
      userId: operatorId,
      componentId: branch.componentId,
      permission: 'canPublish',
    })
    if (!permCheck.data.allowed) {
      addLog(
        'permission_denied',
        `${branch.componentName}/${branch.name}`,
        `生产发布拦截: 用户 ${operatorName} 对组件 ${branch.componentName} 无发布权限`,
        false,
        operatorId,
      )
      return {
        code: 403,
        message: permCheck.data.message,
        data: {
          success: false,
          record: null,
          message: permCheck.data.message,
        },
      }
    }

    if (operator && operator.role === 'developer') {
      addLog(
        'permission_denied',
        `${branch.componentName}/${branch.name}`,
        `生产发布拦截: 开发人员 ${operatorName} 无生产发布权限，需组长或管理员审批`,
        false,
        operatorId,
      )
      return {
        code: 403,
        message: '开发人员无生产发布权限，需组长或管理员审批',
        data: {
          success: false,
          record: null,
          message: '开发人员无生产发布权限，需组长或管理员审批',
        },
      }
    }

    const compatibilityCheck = this.runCompatibilityCheck(branchId)
    if (!compatibilityCheck.passed) {
      addLog(
        'publish_prod',
        `${branch.componentName}/${branch.name}`,
        `生产发布拦截: 兼容性校验未通过 - ${compatibilityCheck.issues.join('; ')}`,
        false,
        operatorId,
      )
      return {
        code: 422,
        message: `兼容性校验未通过: ${compatibilityCheck.issues[0]}`,
        data: {
          success: false,
          record: null,
          compatibilityCheck,
          message: compatibilityCheck.details,
        },
      }
    }

    const publishRecord = store.publishRecords.create({
      branchId,
      componentName: branch.componentName,
      branchName: branch.name,
      environment: 'prod',
      status: 'success',
      operator: operatorId,
      message: `生产环境发布成功，分支版本 ${branch.version}`,
    })

    store.branches.update(branchId, {
      status: 'published',
      compatibilityChecked: true,
    })

    const component = store.components.get(branch.componentId)
    if (component) {
      store.components.update(component.id, { latestVersion: branch.version })
    }

    addLog(
      'publish_prod',
      `${branch.componentName}/${branch.name}`,
      `生产环境发布成功: 版本 ${branch.version}，兼容性校验已通过`,
      true,
      operatorId,
    )

    return {
      code: 200,
      message: '生产环境发布成功',
      data: {
        success: true,
        record: publishRecord,
        compatibilityCheck,
        message: '生产环境发布成功',
      },
    }
  },
}

const permissionService = {
  checkPermission(params: CheckPermissionParams): ApiResponse<CheckPermissionResult> {
    const { userId, componentId, permission } = params

    const user = store.users.get(userId)
    if (!user) {
      return {
        code: 401,
        message: '用户不存在',
        data: {
          allowed: false,
          user: undefined,
          permission: undefined,
          message: '用户不存在，请先登录',
        },
      }
    }

    if (user.role === 'admin') {
      return {
        code: 200,
        message: '管理员权限通过',
        data: {
          allowed: true,
          user,
          permission: {
            groupId: user.groupId,
            componentId,
            canRead: true,
            canWrite: true,
            canPublish: true,
          },
          message: '管理员拥有全部权限',
        },
      }
    }

    const component = store.components.get(componentId)
    if (component && component.ownerGroupId === user.groupId) {
      return {
        code: 200,
        message: '组件所属组权限通过',
        data: {
          allowed: true,
          user,
          permission: {
            groupId: user.groupId,
            componentId,
            canRead: true,
            canWrite: true,
            canPublish: true,
          },
          message: '组件所属开发组拥有全部权限',
        },
      }
    }

    const perm = store.permissions.get(user.groupId, componentId)

    const permissionNames: Record<string, string> = {
      canRead: '读取',
      canWrite: '写入',
      canPublish: '发布',
    }

    if (!perm) {
      return {
        code: 403,
        message: '未配置权限',
        data: {
          allowed: false,
          user,
          permission: undefined,
          message: `用户所在开发组未配置对该组件的${permissionNames[permission]}权限`,
        },
      }
    }

    const allowed = perm[permission]

    return {
      code: allowed ? 200 : 403,
      message: allowed ? '权限校验通过' : '权限不足',
      data: {
        allowed,
        user,
        permission: perm,
        message: allowed
          ? `拥有${permissionNames[permission]}权限`
          : `无${permissionNames[permission]}权限，请联系管理员配置`,
      },
    }
  },

  getGroupPermissions(groupId: string): ApiResponse<Permission[]> {
    const group = store.groups.get(groupId)
    if (!group) {
      return {
        code: 404,
        message: '开发组不存在',
        data: [],
      }
    }

    const permissions = store.permissions.list({ groupId })
    const components = store.components.list()

    const fullPermissions: Permission[] = components.map((c) => {
      const existing = permissions.find((p) => p.componentId === c.id)
      return (
        existing ?? {
          groupId,
          componentId: c.id,
          canRead: false,
          canWrite: false,
          canPublish: false,
        }
      )
    })

    return {
      code: 200,
      message: '获取权限配置成功',
      data: fullPermissions,
    }
  },

  updatePermissions(params: UpdatePermissionsParams): ApiResponse<Permission | null> {
    const { groupId, componentId, canRead, canWrite, canPublish, operatorId } = params

    const operator = store.users.get(operatorId)
    const operatorName = operator?.name ?? operatorId

    if (operator?.role !== 'admin') {
      addLog(
        'permission_denied',
        `permissions:${groupId}/${componentId}`,
        `更新权限拦截: 用户 ${operatorName} 不是管理员，无权修改权限配置`,
        false,
        operatorId,
      )
      return {
        code: 403,
        message: '仅管理员可修改权限配置',
        data: null,
      }
    }

    const group = store.groups.get(groupId)
    if (!group) {
      addLog(
        'update_permission',
        `permissions:${groupId}/${componentId}`,
        `更新权限失败: 开发组 ${groupId} 不存在`,
        false,
        operatorId,
      )
      return {
        code: 404,
        message: '开发组不存在',
        data: null,
      }
    }

    const component = store.components.get(componentId)
    if (!component) {
      addLog(
        'update_permission',
        `permissions:${groupId}/${componentId}`,
        `更新权限失败: 组件 ${componentId} 不存在`,
        false,
        operatorId,
      )
      return {
        code: 404,
        message: '组件不存在',
        data: null,
      }
    }

    const updatedPerm: Permission = {
      groupId,
      componentId,
      canRead,
      canWrite,
      canPublish,
    }

    const result = store.permissions.set(updatedPerm)

    const permissionDesc = [
      canRead ? '读' : '',
      canWrite ? '写' : '',
      canPublish ? '发布' : '',
    ]
      .filter(Boolean)
      .join('/') || '无权限'

    addLog(
      'update_permission',
      `${group.name}/${component.name}`,
      `更新权限配置: ${permissionDesc}`,
      true,
      operatorId,
    )

    return {
      code: 200,
      message: '权限配置更新成功',
      data: result,
    }
  },
}

export { branchService, publishService, permissionService }
