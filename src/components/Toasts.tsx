import { useAppStore } from '../lib/store'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const colorMap = {
  success: 'from-emerald-500/20 border-emerald-500/30 text-emerald-400',
  error: 'from-red-500/20 border-red-500/30 text-red-400',
  info: 'from-blue-500/20 border-blue-500/30 text-blue-400',
  warning: 'from-amber-500/20 border-amber-500/30 text-amber-400',
}

export default function Toasts() {
  const { toasts, removeToast } = useAppStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type]
        const colors = colorMap[toast.type]
        return (
          <div
            key={toast.id}
            className={['flex items-center gap-3 px-4 py-3 rounded-lg border bg-gradient-to-r shadow-lg animate-slide-in min-w-[280px]', colors].join(' ')}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm text-white flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
