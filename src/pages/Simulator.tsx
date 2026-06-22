import { useState } from 'react'
import { FlaskConical, AlertTriangle, ShieldX, Rocket, Copy, Check, Loader2 } from 'lucide-react'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'
import { cn } from '../lib/utils'

interface Scenario {
  id: string
  title: string
  description: string
  icon: typeof AlertTriangle
  color: string
  borderColor: string
  bgColor: string
  action: () => Promise<unknown>
}

const scenarios: Scenario[] = [
  {
    id: 'duplicate',
    title: '重复分支创建',
    description: '模拟在同一组件下创建已存在的分支名称，系统应返回重复错误提示',
    icon: AlertTriangle,
    color: 'text-orange-400',
    borderColor: 'border-orange-500/30 hover:border-orange-500/50',
    bgColor: 'from-orange-500/10 to-transparent',
    action: () => api.simulateDuplicateBranch(),
  },
  {
    id: 'permission',
    title: '无权限提交',
    description: '模拟开发者尝试提交没有写入权限的组件分支，触发权限校验拦截',
    icon: ShieldX,
    color: 'text-red-400',
    borderColor: 'border-red-500/30 hover:border-red-500/50',
    bgColor: 'from-red-500/10 to-transparent',
    action: () => api.simulatePermissionDenied(),
  },
  {
    id: 'publish',
    title: '未校验发布生产',
    description: '模拟分支未通过兼容性检查就发布到生产环境，验证发布防护机制',
    icon: Rocket,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30 hover:border-purple-500/50',
    bgColor: 'from-purple-500/10 to-transparent',
    action: () => api.simulatePublishWithoutCompat(),
  },
]

export default function Simulator() {
  const { addToast } = useAppStore()
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, unknown>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleRun = async (scenario: Scenario) => {
    setActiveScenario(scenario.id)
    try {
      const result = await scenario.action()
      setResults((prev) => ({ ...prev, [scenario.id]: result }))
      addToast('info', `场景 "${scenario.title}" 执行完成`)
    } catch (error) {
      const errorResult = { code: 500, message: '请求失败', data: error }
      setResults((prev) => ({ ...prev, [scenario.id]: errorResult }))
      addToast('error', `场景 "${scenario.title}" 执行异常`)
    } finally {
      setActiveScenario(null)
    }
  }

  const handleCopy = async (id: string) => {
    const json = JSON.stringify(results[id], null, 2)
    await navigator.clipboard.writeText(json)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-purple-400" />
          场景模拟
        </h1>
        <p className="text-sm text-slate-400 mt-1">模拟异常场景，验证系统的错误处理与防护机制</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon
          const isLoading = activeScenario === scenario.id
          const hasResult = results[scenario.id] !== undefined

          return (
            <div
              key={scenario.id}
              className={cn(
                'rounded-xl border overflow-hidden transition-all duration-300',
                'bg-gradient-to-br card-gradient',
                scenario.borderColor,
              )}
            >
              <div className={cn('p-5 bg-gradient-to-br', scenario.bgColor)}>
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                      'bg-slate-800/80 border border-slate-700/50',
                    )}
                  >
                    <Icon className={cn('w-5 h-5', scenario.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white">{scenario.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{scenario.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRun(scenario)}
                  disabled={isLoading}
                  className={cn(
                    'w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    'flex items-center justify-center gap-2',
                    isLoading
                      ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                      : 'btn-primary',
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      执行中...
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-4 h-4" />
                      运行场景
                    </>
                  )}
                </button>
              </div>

              {hasResult && (
                <div className="border-t border-slate-700/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">执行结果</span>
                    <button
                      onClick={() => handleCopy(scenario.id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedId === scenario.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-950/80 rounded-lg p-3 overflow-x-auto text-xs leading-relaxed border border-slate-800">
                    <code className="text-slate-300 font-mono">
                      {JSON.stringify(results[scenario.id], null, 2)}
                    </code>
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="card-gradient rounded-xl border border-slate-700/50 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">使用说明</h4>
            <ul className="text-xs text-slate-400 mt-2 space-y-1.5 list-disc list-inside">
              <li>每个场景会独立调用对应的后端 API 接口，模拟真实业务异常</li>
              <li>执行结果会以 JSON 格式展示，包含响应码、消息和详细数据</li>
              <li>运行场景后可在「操作日志」页面查看对应的系统日志记录</li>
              <li>点击结果区域右上角的复制按钮可快速复制 JSON 内容</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
