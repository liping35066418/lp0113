import { useEffect } from 'react'
import {
  Boxes,
  GitBranch,
  TestTube,
  Rocket,
  FlaskConical,
  Server,
  Clock,
} from 'lucide-react'
import { useAppStore } from '../lib/store'
import { cn } from '../lib/utils'
import type { Component as ComponentType, Stats } from '../../shared/types'

interface StatCardProps {
  title: string
  value: number
  icon: typeof Boxes
  gradient: string
  glow: string
  delay: number
}

function StatCard({ title, value, icon: Icon, gradient, glow, delay }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl p-5 overflow-hidden group transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-in',
        gradient,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          glow,
        )}
        style={{ filter: 'blur(20px)' }}
      />
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
          <p className="text-sm text-white/70 mt-1">{title}</p>
        </div>
      </div>
      <div className="absolute inset-0 rounded-xl p-px pointer-events-none">
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  )
}

const statConfigs: Omit<StatCardProps, 'value'>[] = [
  {
    title: '组件总数',
    icon: Boxes,
    gradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
    glow: 'bg-blue-500/30',
    delay: 0,
  },
  {
    title: '活跃分支',
    icon: GitBranch,
    gradient: 'bg-gradient-to-br from-cyan-600 to-cyan-800',
    glow: 'bg-cyan-500/30',
    delay: 80,
  },
  {
    title: '测试中',
    icon: TestTube,
    gradient: 'bg-gradient-to-br from-amber-600 to-amber-800',
    glow: 'bg-amber-500/30',
    delay: 160,
  },
  {
    title: '已发布',
    icon: Rocket,
    gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-800',
    glow: 'bg-emerald-500/30',
    delay: 240,
  },
  {
    title: '测试发布数',
    icon: FlaskConical,
    gradient: 'bg-gradient-to-br from-violet-600 to-violet-800',
    glow: 'bg-violet-500/30',
    delay: 320,
  },
  {
    title: '生产发布数',
    icon: Server,
    gradient: 'bg-gradient-to-br from-rose-600 to-rose-800',
    glow: 'bg-rose-500/30',
    delay: 400,
  },
]

function getStatsValues(stats: Stats | null): number[] {
  if (!stats) return [0, 0, 0, 0, 0, 0]
  return [
    stats.totalComponents,
    stats.developingBranches,
    stats.testingBranches,
    stats.publishedBranches,
    stats.testPublishCount,
    stats.prodPublishCount,
  ]
}

const statusConfig: Record<ComponentType['status'], { label: string; color: string; dot: string }> = {
  active: { label: '活跃', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  deprecated: { label: '已弃用', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  archived: { label: '已归档', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', dot: 'bg-slate-400' },
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function getGroupName(groupId: string, groups: { id: string; name: string }[]): string {
  const group = groups.find((g) => g.id === groupId)
  return group?.name ?? '未分组'
}

export default function Dashboard() {
  const { components, groups, stats, loading, loadAll } = useAppStore()

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const statsValues = getStatsValues(stats)
  const isLoadingComponents = loading.components ?? false
  const isLoadingStats = loading.stats ?? false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">组件总览</h1>
          <p className="text-sm text-slate-400 mt-1">查看所有组件的状态和统计信息</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statConfigs.map((config, index) => (
          <StatCard
            key={config.title}
            {...config}
            value={statsValues[index]}
          />
        ))}
      </div>

      <div className="rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-800 overflow-hidden animate-fade-in" style={{ animationDelay: '480ms' }}>
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Boxes className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">组件列表</h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 border border-slate-700">
              共 {components.length} 个
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  组件名称
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  描述
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  所属组
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  最新版本
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoadingComponents || isLoadingStats ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-slate-400">加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : components.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Boxes className="w-10 h-10 text-slate-600" />
                      <span className="text-sm text-slate-400">暂无组件数据</span>
                    </div>
                  </td>
                </tr>
              ) : (
                components.map((component, index) => {
                  const status = statusConfig[component.status]
                  return (
                    <tr
                      key={component.id}
                      className={cn(
                        'border-b border-slate-800/50 transition-colors hover:bg-slate-800/30',
                        index % 2 === 1 ? 'bg-slate-900/30' : '',
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                            <Boxes className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="font-medium text-white">{component.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400 line-clamp-1 max-w-xs">
                          {component.description}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">
                          {getGroupName(component.ownerGroupId, groups)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md text-xs font-mono bg-slate-800 text-cyan-400 border border-slate-700">
                          v{component.latestVersion}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border',
                          status.color,
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(component.createdAt)}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
