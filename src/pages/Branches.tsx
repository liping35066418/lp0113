import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Branch, Component } from '../../shared/types'
import {
  GitBranch,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  Package,
  User,
  Clock,
  MessageSquare,
  Tag,
  AlertCircle,
} from 'lucide-react'

const statusMap: Record<Branch['status'], { label: string; color: string }> = {
  developing: { label: '开发中', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  testing: { label: '测试中', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  ready: { label: '待发布', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  published: { label: '已发布', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}

export default function Branches() {
  const { components, branches, loadComponents, loadBranches, addToast } = useAppStore()

  const [selectedComponentId, setSelectedComponentId] = useState('')
  const [branchName, setBranchName] = useState('')
  const [version, setVersion] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [filterComponentId, setFilterComponentId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [uniqueStatus, setUniqueStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [uniqueMessage, setUniqueMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [shakeBranchName, setShakeBranchName] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    loadComponents()
    loadBranches()
  }, [loadComponents, loadBranches])

  const checkUnique = useCallback(
    async (compId: string, name: string) => {
      if (!compId || !name.trim()) {
        setUniqueStatus('idle')
        setUniqueMessage('')
        return
      }
      setUniqueStatus('checking')
      try {
        const res = await api.checkBranchUnique(compId, name.trim())
        if (res.code === 200) {
          if (res.data.unique) {
            setUniqueStatus('valid')
            setUniqueMessage('分支名可用')
          } else {
            setUniqueStatus('invalid')
            setUniqueMessage(res.data.message || '分支名已存在')
          }
        } else {
          setUniqueStatus('invalid')
          setUniqueMessage(res.message || '校验失败')
        }
      } catch {
        setUniqueStatus('invalid')
        setUniqueMessage('网络错误，请重试')
      } finally {
        setUniqueStatus((prev) => prev === 'checking' ? 'idle' : prev)
      }
    },
    [],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (branchName.trim() && selectedComponentId) {
      debounceRef.current = setTimeout(() => {
        checkUnique(selectedComponentId, branchName)
      }, 400)
    } else {
      setUniqueStatus('idle')
      setUniqueMessage('')
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [branchName, selectedComponentId, checkUnique])

  const triggerShake = () => {
    setShakeBranchName(true)
    setTimeout(() => setShakeBranchName(false), 400)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedComponentId) {
      newErrors.componentId = '请选择组件'
    }
    if (!branchName.trim()) {
      newErrors.branchName = '请输入分支名'
      triggerShake()
    } else if (uniqueStatus === 'invalid') {
      newErrors.branchName = uniqueMessage || '分支名不可用'
      triggerShake()
    }
    if (!version.trim()) {
      newErrors.version = '请输入版本号'
    }
    if (!commitMessage.trim()) {
      newErrors.commitMessage = '请输入提交信息'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateBranch = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const res = await api.createBranch({
        componentId: selectedComponentId,
        branchName: branchName.trim(),
        version: version.trim(),
        lastCommitMessage: commitMessage.trim(),
      })
      if (res.code === 200 && res.data) {
        addToast('success', `分支 "${branchName}" 创建成功`)
        setSelectedComponentId('')
        setBranchName('')
        setVersion('')
        setCommitMessage('')
        setUniqueStatus('idle')
        setUniqueMessage('')
        setErrors({})
        loadBranches()
      } else {
        addToast('error', res.message || '创建失败')
      }
    } catch {
      addToast('error', '网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredBranches = branches.filter((b) => {
    if (filterComponentId && b.componentId !== filterComponentId) return false
    if (filterStatus && b.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        b.name.toLowerCase().includes(q) ||
        b.componentName.toLowerCase().includes(q) ||
        b.createdBy.toLowerCase().includes(q) ||
        b.lastCommitMessage.toLowerCase().includes(q)
      )
    }
    return true
  })

  const componentById = (id: string): Component | undefined => components.find((c) => c.id === id)

  return (
    <div className="h-full flex gap-6 animate-fade-in">
      <div className="w-96 flex-shrink-0">
        <div className="card-gradient rounded-2xl border border-slate-800 p-6 glow-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">创建分支</h2>
              <p className="text-xs text-slate-400">为组件创建新的开发分支</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Package className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                选择组件
              </label>
              <select
                value={selectedComponentId}
                onChange={(e) => {
                  setSelectedComponentId(e.target.value)
                  setErrors((prev) => ({ ...prev, componentId: '' }))
                }}
                className={cn(
                  'input-field w-full h-11 px-4 rounded-lg text-sm',
                  errors.componentId && 'error animate-shake',
                )}
              >
                <option value="">请选择组件...</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.latestVersion})
                  </option>
                ))}
              </select>
              {errors.componentId && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.componentId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <GitBranch className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                分支名称
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => {
                    setBranchName(e.target.value)
                    setErrors((prev) => ({ ...prev, branchName: '' }))
                  }}
                  placeholder="例如 feature/user-login"
                  className={cn(
                    'input-field w-full h-11 px-4 pr-10 rounded-lg text-sm',
                    (errors.branchName || uniqueStatus === 'invalid') && 'error',
                    shakeBranchName && 'animate-shake',
                    uniqueStatus === 'valid' && 'success',
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {uniqueStatus === 'checking' && (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  )}
                  {uniqueStatus === 'valid' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {uniqueStatus === 'invalid' && (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
              {(errors.branchName || uniqueMessage) && (
                <p
                  className={cn(
                    'mt-1.5 text-xs flex items-center gap-1',
                    uniqueStatus === 'valid' ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {uniqueStatus === 'valid' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  {errors.branchName || uniqueMessage}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Tag className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                版本号
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => {
                  setVersion(e.target.value)
                  setErrors((prev) => ({ ...prev, version: '' }))
                }}
                placeholder="例如 1.2.0"
                className={cn(
                  'input-field w-full h-11 px-4 rounded-lg text-sm',
                  errors.version && 'error animate-shake',
                )}
              />
              {errors.version && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.version}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                提交信息
              </label>
              <textarea
                value={commitMessage}
                onChange={(e) => {
                  setCommitMessage(e.target.value)
                  setErrors((prev) => ({ ...prev, commitMessage: '' }))
                }}
                placeholder="描述本次分支的主要变更..."
                rows={3}
                className={cn(
                  'input-field w-full px-4 py-3 rounded-lg text-sm resize-none',
                  errors.commitMessage && 'error animate-shake',
                )}
              />
              {errors.commitMessage && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.commitMessage}
                </p>
              )}
            </div>

            <button
              onClick={handleCreateBranch}
              disabled={submitting}
              className="btn-primary w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  创建分支
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="card-gradient rounded-2xl border border-slate-800 p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">分支列表</h2>
                <p className="text-xs text-slate-400">共 {filteredBranches.length} 个分支</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索分支名、创建者..."
                  className="input-field w-64 h-10 pl-10 pr-4 rounded-lg text-sm"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={filterComponentId}
                  onChange={(e) => setFilterComponentId(e.target.value)}
                  className="input-field h-10 pl-10 pr-8 rounded-lg text-sm appearance-none cursor-pointer"
                >
                  <option value="">全部组件</option>
                  {components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field h-10 pl-10 pr-8 rounded-lg text-sm appearance-none cursor-pointer"
                >
                  <option value="">全部状态</option>
                  {Object.entries(statusMap).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto -mx-2 px-2">
            {filteredBranches.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <GitBranch className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm">暂无分支数据</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBranches.map((branch, idx) => {
                  const comp = componentById(branch.componentId)
                  const status = statusMap[branch.status]
                  return (
                    <div
                      key={branch.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-all duration-200 animate-slide-in"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <span
                              className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                                status.color,
                              )}
                            >
                              {status.label}
                            </span>
                            <h3 className="text-base font-semibold text-white truncate">
                              {branch.name}
                            </h3>
                            <span className="text-slate-600">·</span>
                            <span className="text-sm text-slate-400 flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5" />
                              v{branch.version}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Package className="w-4 h-4 text-slate-500" />
                              <span className="text-slate-300">{branch.componentName}</span>
                              {comp && (
                                <span className="text-xs text-slate-500">
                                  (v{comp.latestVersion})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <User className="w-4 h-4 text-slate-500" />
                              <span className="text-slate-300">{branch.createdBy}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 col-span-2">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <span>{new Date(branch.createdAt).toLocaleString('zh-CN')}</span>
                            </div>
                          </div>

                          {branch.lastCommitMessage && (
                            <div className="mt-3 pt-3 border-t border-slate-800/50">
                              <p className="text-sm text-slate-400 flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{branch.lastCommitMessage}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
