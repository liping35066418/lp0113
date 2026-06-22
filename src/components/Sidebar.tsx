import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  GitBranch,
  Shield,
  Rocket,
  FileText,
  FlaskConical,
  Boxes,
} from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '组件总览' },
  { path: '/branches', icon: GitBranch, label: '分支管理' },
  { path: '/permissions', icon: Shield, label: '权限管理' },
  { path: '/publish', icon: Rocket, label: '发布中心' },
  { path: '/logs', icon: FileText, label: '操作日志' },
  { path: '/simulator', icon: FlaskConical, label: '场景模拟' },
]

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'w-60 bg-slate-900/80 border-r border-slate-800 flex flex-col h-screen sticky top-0',
        className,
      )}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">组件管理平台</h1>
            <p className="text-xs text-slate-400">Component Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-white shadow-lg shadow-blue-500/10 border border-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50',
                )}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="rounded-lg bg-slate-800/50 p-3">
          <p className="text-xs text-slate-500">API 服务</p>
          <p className="text-xs text-emerald-400 mt-1">● 8913 端口运行中</p>
        </div>
      </div>
    </aside>
  )
}
