import { useEffect, useMemo, useState } from 'react'
import { Clock, CheckCircle2, XCircle, Filter, RefreshCw, User, Target, FileText } from 'lucide-react'
import type { OperationLog } from '../../shared/types'
import { useAppStore } from '../lib/store'
import { cn } from '../lib/utils'

const typeConfig: Record<OperationLog['type'], { label: string; color: string; bg: string; border: string }> = {
  create_branch: { label: '创建分支', color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  commit: { label: '代码提交', color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
  publish_test: { label: '测试发布', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  publish_prod: { label: '生产发布', color: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  update_permission: { label: '更新权限', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  create_group: { label: '创建组', color: 'text-pink-300', bg: 'bg-pink-500/15', border: 'border-pink-500/30' },
  permission_denied: { label: '权限拒绝', color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  duplicate_branch: { label: '重复分支', color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
}

export default function Logs() {
  const { logs, users, loadLogs, loadUsers, loading } = useAppStore()
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSuccess, setFilterSuccess] = useState<string>('all')
  const [filterOperator, setFilterOperator] = useState<string>('all')

  useEffect(() => {
    loadLogs({ limit: 100 })
    loadUsers()
  }, [loadLogs, loadUsers])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterType !== 'all' && log.type !== filterType) return false
      if (filterOperator !== 'all' && log.operator !== filterOperator) return false
      if (filterSuccess !== 'all') {
        const success = filterSuccess === 'true'
        if (log.success !== success) return false
      }
      return true
    })
  }, [logs, filterType, filterSuccess, filterOperator])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const handleRefresh = async () => {
    await loadLogs({ limit: 100 })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            操作日志
          </h1>
          <p className="text-sm text-slate-400 mt-1">查看系统全部操作记录与状态追踪</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading.logs}
          className="btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading.logs && 'animate-spin')} />
          刷新日志
        </button>
      </div>

      <div className="card-gradient rounded-xl border border-slate-700/50 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300 font-medium">筛选条件</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">操作类型:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field px-3 py-1.5 rounded-lg text-sm"
            >
              <option value="all">全部类型</option>
              {Object.entries(typeConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">操作人:</label>
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="input-field px-3 py-1.5 rounded-lg text-sm"
            >
              <option value="all">全部操作人</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">执行状态:</label>
            <select
              value={filterSuccess}
              onChange={(e) => setFilterSuccess(e.target.value)}
              className="input-field px-3 py-1.5 rounded-lg text-sm"
            >
              <option value="all">全部状态</option>
              <option value="true">成功</option>
              <option value="false">失败</option>
            </select>
          </div>
          <div className="ml-auto text-sm text-slate-400">
            共 <span className="text-white font-semibold">{filteredLogs.length}</span> 条记录
          </div>
        </div>
      </div>

      <div className="card-gradient rounded-xl border border-slate-700/50 p-6">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">暂无日志记录</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/50 via-slate-600 to-slate-700" />
            <div className="space-y-6">
              {filteredLogs.map((log, index) => {
                const config = typeConfig[log.type]
                return (
                  <div
                    key={log.id}
                    className="relative pl-10 animate-slide-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div
                      className={cn(
                        'absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-slate-950 z-10',
                        log.success ? 'border-emerald-500/50' : 'border-red-500/50',
                      )}
                    >
                      {log.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                    <div className={cn(
                      'rounded-xl p-5 border transition-all duration-200',
                      'bg-slate-900/50 border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-900/70',
                    )}>
                      <div className="flex flex-wrap items-start gap-3 mb-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                            config.bg,
                            config.color,
                            config.border,
                          )}
                        >
                          {config.label}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                            log.success
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-red-500/15 text-red-300 border-red-500/30',
                          )}
                        >
                          {log.success ? '执行成功' : '执行失败'}
                        </span>
                        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(log.timestamp)}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-slate-400 text-xs">操作人</span>
                            <p className="text-white font-medium">
                              {log.operator}
                              <span className="ml-2 text-xs text-slate-500">({log.operatorRole})</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-slate-400 text-xs">操作目标</span>
                            <p className="text-white font-medium">{log.target}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-700/40">
                        <span className="text-slate-400 text-xs">详情</span>
                        <p className="text-slate-200 text-sm mt-1 leading-relaxed">{log.detail}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
