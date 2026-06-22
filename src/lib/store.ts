import { create } from 'zustand'
import type {
  User,
  Component,
  Branch,
  DevGroup,
  Permission,
  PublishRecord,
  OperationLog,
  Stats,
} from '../../shared/types'
import { api } from './api'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface AppState {
  currentUser: User | null
  users: User[]
  components: Component[]
  branches: Branch[]
  groups: DevGroup[]
  permissions: Permission[]
  publishRecords: PublishRecord[]
  logs: OperationLog[]
  stats: Stats | null
  toasts: Toast[]
  loading: Record<string, boolean>
  setCurrentUser: (user: User | null) => void
  setUserId: (userId: string) => void
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
  loadAll: () => Promise<void>
  loadUsers: () => Promise<void>
  loadComponents: () => Promise<void>
  loadStats: () => Promise<void>
  loadBranches: (params?: { componentId?: string; status?: string }) => Promise<void>
  loadGroups: () => Promise<void>
  loadPermissions: () => Promise<void>
  loadPublishRecords: () => Promise<void>
  loadLogs: (params?: { limit?: number }) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  components: [],
  branches: [],
  groups: [],
  permissions: [],
  publishRecords: [],
  logs: [],
  stats: null,
  toasts: [],
  loading: {},

  setCurrentUser: (user) => set({ currentUser: user }),

  setUserId: (userId) => {
    api.setUserId(userId)
  },

  addToast: (type, message) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  loadAll: async () => {
    await Promise.all([
      get().loadComponents(),
      get().loadBranches(),
      get().loadGroups(),
      get().loadStats(),
      get().loadLogs({ limit: 50 }),
    ])
  },

  loadUsers: async () => {
    set({ loading: { ...get().loading, users: true } })
    try {
      const res = await api.getUsers()
      if (res.code === 200) {
        set({ users: res.data })
      }
    } finally {
      set({ loading: { ...get().loading, users: false } })
    }
  },

  loadComponents: async () => {
    set({ loading: { ...get().loading, components: true } })
    try {
      const res = await api.getComponents()
      if (res.code === 200) {
        set({ components: res.data })
      }
    } finally {
      set({ loading: { ...get().loading, components: false } })
    }
  },

  loadStats: async () => {
    set({ loading: { ...get().loading, stats: true } })
    try {
      const res = await api.getComponentStats()
      if (res.code === 200) {
        set({ stats: res.data })
      }
    } finally {
      set({ loading: { ...get().loading, stats: false } })
    }
  },

  loadBranches: async (params) => {
    set({ loading: { ...get().loading, branches: true } })
    try {
      const res = await api.getBranches(params)
      if (res.code === 200) {
        set({ branches: res.data })
      }
    } finally {
      set({ loading: { ...get().loading, branches: false } })
    }
  },

  loadGroups: async () => {
    set({ loading: { ...get().loading, groups: true } })
    try {
      const res = await api.getGroups()
      if (res.code === 200) {
        set({ groups: res.data })
      }
    } finally {
      set({ loading: { ...get().loading, groups: false } })
    }
  },

  loadPermissions: async () => {
    set({ loading: { ...get().loading, permissions: true } })
    try {
      const res = await api.getPermissions()
      if (res.code === 200) {
        set({ permissions: res.data })
      }
    } finally {
      set({ loading: { ...get().loading, permissions: false } })
    }
  },

  loadPublishRecords: async () => {
    set({ loading: { ...get().loading, publishRecords: true } })
    try {
      const res = await api.getPublishRecords()
      if (res.code === 200) {
        set({ publishRecords: res.data })
      }
    } finally {
      set({ loading: { ...get().loading, publishRecords: false } })
    }
  },

  loadLogs: async (params) => {
    set({ loading: { ...get().loading, logs: true } })
    try {
      const res = await api.getLogs(params)
      if (res.code === 200) {
        set({ logs: res.data })
      }
    } finally {
      set({ loading: { ...get().loading, logs: false } })
    }
  },
}))
