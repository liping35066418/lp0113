import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Branch, CompatibilityCheckResult } from '../../shared/types'
import {
  Rocket,
  Beaker,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  GitBranch,
  Package,
  Tag,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react'

const statusLabels: Record<Branch['status'], string> = {
  developing: '开发中',
  testing: '测试中',
  ready: '待发布',
  published: '已发布',
}

const statusColors: Record<Branch['status'], string> = {
  developing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  testing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  published: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

interface BranchCardProps {
  branch: Branch
  environment: 'test' | 'prod'
  onPublish: (branch: Branch) => Promise<void>
  publishing: boolean
  lastTestPublishTime?: string
}

function BranchCard({ branch, environment, onPublish, publishing, lastTestPublishTime }: BranchCardProps) {
  const [compatResult, setCompatResult] = useState<CompatibilityCheckResult | null>(null)
  const [checkingCompat, setCheckingCompat] = useState(false)
  const [showIssues, setShowIssues] = useState(false)
  const { addToast } = useAppStore()

  const isProd = environment === 'prod'
  const canPublishProd = isProd && lastTestPublishTime

  const handlePublish = async () => {
    if (environment === 'prod') {
      setCheckingCompat(true)
      try {
        const res = await api.runCompatibilityCheck(branch.id)
        if (res.code === 200) {
          setCompatResult(res.data)
          if (!res.data.passed) {
            setShowIssues(true)
            addToast('warning', '兼容性校验未通过，请查看问题列表')
            return
          }
        } else {
          addToast('error', res.message || '兼容性校验失败')
          return
        }
      } finally {
        setCheckingCompat(false)
      }
    }
    await onPublish(branch)
  }

  const isTest = environment === 'test'
  const gradientFrom = isTest ? 'from-blue-500/10' : 'from-purple-500/10'
  const gradientTo = isTest ? 'to-cyan-500/5' : 'to-fuchsia-500/5'
  const borderColor = isTest ? 'border-blue-500/20' : 'border-purple-500/20'
  const hoverBorderColor = isTest ? 'hover:border-blue-500/40' : 'hover:border-purple-500/40'
  const btnBg = isTest ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'

  return (
    <div
      className={cn(
        'rounded-xl border bg-gradient-to-br p-4 transition-all duration-200',
        gradientFrom,
        gradientTo,
        borderColor,
        hoverBorderColor,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Package className={cn('w-4 h-4', isTest ? 'text-blue-400' : 'text-purple-400')} />
            <h3 className="text-sm font-semibold text-white truncate">{branch.componentName}</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-300 font-mono truncate">{branch.name}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-300 font-mono">{branch.version}</span>
            </div>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border', statusColors[branch.status])}>
              {statusLabels[branch.status]}
            </span>
          </div>
          {isProd && (
            <div className="flex items-center gap-1.5 mb-3">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">
                最近测试发布：
                {lastTestPublishTime
                  ? new Date(lastTestPublishTime).toLocaleString('zh-CN')
                  : '未发布过测试环境'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {branch.compatibilityChecked ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                已校验
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <XCircle className="w-3.5 h-3.5" />
                未校验
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handlePublish}
          disabled={publishing || checkingCompat || (isProd && !canPublishProd)}
          title={isProd && !canPublishProd ? '请先在测试环境发布' : ''}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg',
            btnBg,
          )}
        >
          {publishing || checkingCompat ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Rocket className="w-3.5 h-3.5" />
          )}
          {publishing ? '发布中...' : checkingCompat ? '校验中...' : '发布'}
        </button>
      </div>

      {environment === 'prod' && compatResult && !compatResult.passed && showIssues && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <button
            onClick={() => setShowIssues(!showIssues)}
            className="flex items-center justify-between w-full mb-2"
          >
            <span className="flex items-center gap-2 text-xs font-medium text-red-400">
              <AlertCircle className="w-4 h-4" />
              兼容性问题 ({compatResult.issues.length})
            </span>
            {showIssues ? (
              <ChevronUp className="w-4 h-4 text-red-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-red-400" />
            )}
          </button>
          <ul className="space-y-1.5">
            {compatResult.issues.map((issue, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-red-300/90">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface EnvironmentColumnProps {
  title: string
  subtitle: string
  environment: 'test' | 'prod'
  branches: Branch[]
  onPublish: (branch: Branch) => Promise<void>
  publishingId: string | null
  isLoading: boolean
  lastTestPublishTimes?: Record<string, string>
}

function EnvironmentColumn({
  title,
  subtitle,
  environment,
  branches,
  onPublish,
  publishingId,
  isLoading,
  lastTestPublishTimes,
}: EnvironmentColumnProps) {
  const isTest = environment === 'test'
  const iconBg = isTest ? 'bg-blue-500/20' : 'bg-purple-500/20'
  const iconColor = isTest ? 'text-blue-400' : 'text-purple-400'
  const borderColor = isTest ? 'border-blue-500/20' : 'border-purple-500/20'
  const headerGradient = isTest
    ? 'from-blue-500/20 to-cyan-500/10'
    : 'from-purple-500/20 to-fuchsia-500/10'

  return (
    <div className={cn('flex-1 flex flex-col rounded-2xl border overflow-hidden', borderColor)}>
      <div className={cn('px-5 py-4 bg-gradient-to-r border-b', headerGradient, borderColor)}>
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
            {isTest ? (
              <Beaker className={cn('w-5 h-5', iconColor)} />
            ) : (
              <Rocket className={cn('w-5 h-5', iconColor)} />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{title}</h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
          <div className="ml-auto">
            <span className={cn(
              'text-xs px-2.5 py-1 rounded-full font-medium',
              isTest
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
            )}>
              {branches.length} 个待发布
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-slate-900/30">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mb-2" />
            <p className="text-sm text-slate-500">暂无待发布分支</p>
            <p className="text-xs text-slate-600 mt-1">所有分支均已发布</p>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                environment={environment}
                onPublish={onPublish}
                publishing={publishingId === branch.id}
                lastTestPublishTime={lastTestPublishTimes?.[branch.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Publish() {
  const { branches, publishRecords, loadBranches, loadPublishRecords, addToast, loading } = useAppStore()
  const [publishingId, setPublishingId] = useState<string | null>(null)

  useEffect(() => {
    loadBranches()
    loadPublishRecords()
  }, [loadBranches, loadPublishRecords])

  const testBranches = useMemo(() => {
    return branches.filter((b) => b.status === 'developing' || b.status === 'testing')
  }, [branches])

  const prodBranches = useMemo(() => {
    return branches.filter((b) => b.status === 'ready')
  }, [branches])

  const lastTestPublishTimes = useMemo(() => {
    const result: Record<string, string> = {}
    publishRecords.forEach((record) => {
      if (record.environment === 'test' && record.status === 'success') {
        if (!result[record.branchId] || record.operatedAt > result[record.branchId]) {
          result[record.branchId] = record.operatedAt
        }
      }
    })
    return result
  }, [publishRecords])

  const handleRefresh = () => {
    loadBranches()
    loadPublishRecords()
  }

  const handlePublishTest = async (branch: Branch) => {
    setPublishingId(branch.id)
    try {
      const res = await api.publishTest(branch.id)
      if (res.code === 200 && res.data.success) {
        addToast('success', `${branch.componentName} 已成功发布到测试环境`)
        await loadBranches()
        await loadPublishRecords()
      } else {
        addToast('error', res.data.message || '发布失败')
      }
    } finally {
      setPublishingId(null)
    }
  }

  const handlePublishProd = async (branch: Branch) => {
    setPublishingId(branch.id)
    try {
      const res = await api.publishProd(branch.id)
      if (res.code === 200 && res.data.success) {
        addToast('success', `${branch.componentName} 已成功发布到生产环境`)
        await loadBranches()
        await loadPublishRecords()
      } else {
        if (res.data.compatibilityCheck && !res.data.compatibilityCheck.passed) {
          addToast('error', '兼容性校验未通过，无法发布')
        } else {
          addToast('error', res.data.message || '发布失败')
        }
      }
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">发布中心</h1>
          <p className="text-sm text-slate-400 mt-1">管理组件分支在测试和生产环境的发布</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700"
        >
          <RefreshCw className={cn('w-4 h-4', loading.branches && 'animate-spin')} />
          刷新
        </button>
      </div>

      <div className="flex-1 flex gap-5 min-h-0">
        <EnvironmentColumn
          title="测试环境"
          subtitle="Test Environment"
          environment="test"
          branches={testBranches}
          onPublish={handlePublishTest}
          publishingId={publishingId}
          isLoading={!!loading.branches || !!loading.publishRecords}
        />
        <EnvironmentColumn
          title="生产环境"
          subtitle="Production Environment"
          environment="prod"
          branches={prodBranches}
          onPublish={handlePublishProd}
          publishingId={publishingId}
          isLoading={!!loading.branches || !!loading.publishRecords}
          lastTestPublishTimes={lastTestPublishTimes}
        />
      </div>
    </div>
  )
}
