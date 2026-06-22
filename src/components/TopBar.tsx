import { useEffect, useState } from 'react'
import { User, ChevronDown, Bell, Search } from 'lucide-react'
import { useAppStore } from '../lib/store'
import { api } from '../lib/api'
import { cn } from '../lib/utils'
import type { User as UserType } from '../../shared/types'

const mockUsers: UserType[] = [
  { id: 'u1', name: '张三', role: 'admin', groupId: 'g1' },
  { id: 'u2', name: '李四', role: 'developer', groupId: 'g1' },
  { id: 'u3', name: '王五', role: 'leader', groupId: 'g2' },
  { id: 'u4', name: '赵六', role: 'developer', groupId: 'g3' },
]

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: '管理员', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
  leader: { label: '开发组长', color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30' },
  developer: { label: '开发人员', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
}

export default function TopBar() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { currentUser, setCurrentUser, setUserId } = useAppStore()

  useEffect(() => {
    if (!currentUser) {
      const user = mockUsers[0]
      setCurrentUser(user)
      setUserId(user.id)
      api.setUserId(user.id)
    }
  }, [currentUser, setCurrentUser, setUserId])

  const handleUserChange = (user: UserType) => {
    setCurrentUser(user)
    setUserId(user.id)
    api.setUserId(user.id)
    setShowUserMenu(false)
  }

  const roleInfo = currentUser ? roleLabels[currentUser.role] : roleLabels.developer

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索组件、分支..."
            className="input-field rounded-lg pl-9 pr-4 py-2 text-sm w-72"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">{currentUser?.name}</p>
              <p className={cn('text-xs', roleInfo.color)}>
                <span className={cn('px-1.5 py-0.5 rounded text-xs border', roleInfo.color)}>
                  {roleInfo.label}
                </span>
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-700 bg-slate-800 shadow-xl animate-fade-in z-50">
              <div className="p-2">
                <p className="px-3 py-1.5 text-xs text-slate-400 text-sm">切换用户身份</p>
                {mockUsers.map((user) => {
                  const rl = roleLabels[user.role]
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserChange(user)}
                      className={['w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors',
                        currentUser?.id === user.id
                          ? 'bg-blue-600/20 text-white'
                          : 'text-slate-300 hover:bg-slate-700/50'
                      ].join(' ')}
                    >
                      <div className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className={cn('text-xs', rl.color)}>{rl.label}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
