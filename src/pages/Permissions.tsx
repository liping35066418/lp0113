import { useEffect, useState, useCallback } from 'react'
import {
  Shield,
  Users,
  Boxes,
  Eye,
  Pencil,
  Rocket,
  Loader2,
  RefreshCw,
  Crown,
} from 'lucide-react'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'
import { cn } from '../lib/utils'
import type {
  PermissionMatrixData,
  PermissionType,
  DevGroup,
  Component,
} from '../../shared/types'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  loading?: boolean
  icon: React.ElementType
  label: string
  activeColor: string
}

function PermissionSwitch({
  checked,
  onChange,
  disabled,
  loading,
  icon: Icon,
  label,
  activeColor,
}: SwitchProps) {
  return (
    <button
      onClick={() => !disabled && !loading && onChange(!checked)}
      disabled={disabled || loading}
      title={label}
      className={cn(
        'relative w-9 h-5 rounded-full transition-all duration-200 flex items-center',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-105',
        checked ? activeColor : 'bg-slate-700',
      )}
    >
      <div
        className={cn(
          'absolute w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 flex items-center justify-center',
          checked ? 'left-4' : 'left-0.5',
        )}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />
        ) : (
          <Icon className={cn('w-2.5 h-2.5', checked ? 'text-slate-900' : 'text-slate-500')} />
        )}
      </div>
    </button>
  )
}

export default function Permissions() {
  const { addToast } = useAppStore()
  const [matrixData, setMatrixData] = useState<PermissionMatrixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())

  const loadMatrix = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const res = await api.getPermissionMatrix()
      if (res.code === 200) {
        setMatrixData(res.data)
        if (showRefreshToast) {
          addToast('success', '权限矩阵已刷新')
        }
      } else {
        addToast('error', res.message || '加载权限矩阵失败')
      }
    } catch {
      addToast('error', '加载权限矩阵失败，请稍后重试')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [addToast])

  useEffect(() => {
    loadMatrix()
  }, [loadMatrix])

  const getSaveKey = (groupId: string, componentId: string, type: PermissionType) =>
    `${groupId}-${componentId}-${type}`

  const handlePermissionChange = async (
    group: DevGroup,
    component: Component,
    currentPermission: { canRead: boolean; canWrite: boolean; canPublish: boolean },
    type: PermissionType,
    newValue: boolean,
  ) => {
    const key = getSaveKey(group.id, component.id, type)
    setSavingKeys((prev) => new Set(prev).add(key))

    const updatedPermission = {
      ...currentPermission,
      [type]: newValue,
    }

    try {
      const res = await api.updatePermission({
        groupId: group.id,
        componentId: component.id,
        ...updatedPermission,
      })
      if (res.code === 200) {
        setMatrixData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            matrix: prev.matrix.map((mg) => {
              if (mg.group.id !== group.id) return mg
              return {
                ...mg,
                components: mg.components.map((row) => {
                  if (row.component.id !== component.id) return row
                  return {
                    ...row,
                    permission: {
                      ...row.permission,
                      [type]: newValue,
                    },
                  }
                }),
              }
            }),
          }
        })
        addToast(
          'success',
          `已更新【${group.name}】对【${component.name}】的${type === 'canRead' ? '读' : type === 'canWrite' ? '写' : '发布'}权限`,
        )
      } else {
        addToast('error', res.message || '更新权限失败')
      }
    } catch {
      addToast('error', '更新权限失败，请稍后重试')
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  if (loading || !matrixData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-400">加载权限矩阵中...</p>
        </div>
      </div>
    )
  }

  const { groups, components, matrix } = matrixData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">权限管理</h1>
            <p className="text-sm text-slate-400">管理各开发组对组件的访问权限</p>
          </div>
        </div>
        <button
          onClick={() => loadMatrix(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          <span className="text-sm">{refreshing ? '刷新中...' : '刷新'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-gradient rounded-xl p-5 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">开发组数量</p>
              <p className="text-2xl font-bold text-white">{groups.length}</p>
            </div>
          </div>
        </div>
        <div className="card-gradient rounded-xl p-5 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">组件数量</p>
              <p className="text-2xl font-bold text-white">{components.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-gradient rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">权限矩阵</h2>
            <p className="text-xs text-slate-500 mt-0.5">行为开发组，列为组件，每个单元格包含读/写/发布三个开关</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
              <span>所属组（禁用编辑）</span>
            </div>
          </div>
        </div>

        <div className="overflow-auto max-h-[calc(100vh-320px)]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm">
              <tr>
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3 border-b border-slate-800 bg-slate-900/80 sticky left-0 z-20 min-w-[160px]">
                  开发组 \ 组件
                </th>
                {components.map((component) => {
                  const ownerGroup = groups.find((g) => g.id === component.ownerGroupId)
                  return (
                    <th
                      key={component.id}
                      className="text-center text-xs font-medium text-slate-300 px-3 py-3 border-b border-slate-800 min-w-[140px] whitespace-nowrap"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium text-white">{component.name}</span>
                        {ownerGroup && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            {ownerGroup.name}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {matrix.map((groupMatrix, rowIdx) => {
                const rowBg = rowIdx % 2 === 0 ? 'bg-slate-950/30' : 'bg-transparent'
                return (
                  <tr key={groupMatrix.group.id} className={cn(rowBg, 'hover:bg-slate-800/30 transition-colors')}>
                    <td className="px-4 py-3 border-b border-slate-800/50 sticky left-0 z-10 bg-inherit">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{groupMatrix.group.name}</p>
                          <p className="text-xs text-slate-500">{groupMatrix.group.memberCount} 人</p>
                        </div>
                      </div>
                    </td>
                    {groupMatrix.components.map((row) => (
                      <td
                        key={row.component.id}
                        className={cn(
                          'px-3 py-3 border-b border-slate-800/50 text-center',
                          row.isOwner && 'bg-amber-500/10 border-l border-r border-amber-500/20',
                        )}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {row.isOwner && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-400">
                              <Crown className="w-3 h-3" />
                              <span>所有者</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <PermissionSwitch
                              checked={row.permission.canRead}
                              onChange={(v) =>
                                handlePermissionChange(
                                  groupMatrix.group,
                                  row.component,
                                  row.permission,
                                  'canRead',
                                  v,
                                )
                              }
                              disabled={row.isOwner}
                              loading={savingKeys.has(getSaveKey(groupMatrix.group.id, row.component.id, 'canRead'))}
                              icon={Eye}
                              label="读权限"
                              activeColor="bg-emerald-500"
                            />
                            <PermissionSwitch
                              checked={row.permission.canWrite}
                              onChange={(v) =>
                                handlePermissionChange(
                                  groupMatrix.group,
                                  row.component,
                                  row.permission,
                                  'canWrite',
                                  v,
                                )
                              }
                              disabled={row.isOwner}
                              loading={savingKeys.has(getSaveKey(groupMatrix.group.id, row.component.id, 'canWrite'))}
                              icon={Pencil}
                              label="写权限"
                              activeColor="bg-blue-500"
                            />
                            <PermissionSwitch
                              checked={row.permission.canPublish}
                              onChange={(v) =>
                                handlePermissionChange(
                                  groupMatrix.group,
                                  row.component,
                                  row.permission,
                                  'canPublish',
                                  v,
                                )
                              }
                              disabled={row.isOwner}
                              loading={savingKeys.has(getSaveKey(groupMatrix.group.id, row.component.id, 'canPublish'))}
                              icon={Rocket}
                              label="发布权限"
                              activeColor="bg-purple-500"
                            />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-9 h-5 rounded-full bg-emerald-500 flex items-center">
            <div className="w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center ml-4">
              <Eye className="w-2.5 h-2.5 text-slate-900" />
            </div>
          </div>
          <span>读权限</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-9 h-5 rounded-full bg-blue-500 flex items-center">
            <div className="w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center ml-4">
              <Pencil className="w-2.5 h-2.5 text-slate-900" />
            </div>
          </div>
          <span>写权限</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-9 h-5 rounded-full bg-purple-500 flex items-center">
            <div className="w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center ml-4">
              <Rocket className="w-2.5 h-2.5 text-slate-900" />
            </div>
          </div>
          <span>发布权限</span>
        </div>
      </div>
    </div>
  )
}
