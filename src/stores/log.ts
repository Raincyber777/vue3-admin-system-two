import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export interface Log {
  id: number
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  message: string
  module: string
  operator: string
  ip: string
  createTime: string
}

const DEFAULT_LOGS: Log[] = [
  {
    id: 1,
    level: 'INFO',
    message: '系统启动成功',
    module: '系统',
    operator: '系统',
    ip: '127.0.0.1',
    createTime: '2024-05-20 10:00:00'
  },
  {
    id: 2,
    level: 'WARN',
    message: '用户登录失败尝试',
    module: '认证',
    operator: '未知用户',
    ip: '192.168.1.100',
    createTime: '2024-05-20 10:30:00'
  }
]

export const useLogStore = defineStore('log', () => {
  // 从 localStorage 恢复数据
  const loadLogs = (): Log[] => {
    try {
      const stored = localStorage.getItem('adminLogs')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return [...DEFAULT_LOGS]
  }
  const saveLogs = () => {
    localStorage.setItem('adminLogs', JSON.stringify(logs.value))
  }

  const logs = ref<Log[]>(loadLogs())

  let nextId = Math.max(0, ...logs.value.map(l => l.id)) + 1

  const stats = computed(() => {
    const total = logs.value.length
    const infoCount = logs.value.filter(log => log.level === 'INFO').length
    const warnCount = logs.value.filter(log => log.level === 'WARN').length
    const errorCount = logs.value.filter(log => log.level === 'ERROR').length
    return {
      total,
      infoCount,
      warnCount,
      errorCount
    }
  })

  const addLog = (level: Log['level'], message: string, module: string) => {
    const authStore = useAuthStore()
    const newLog: Log = {
      id: nextId++,
      level,
      message,
      module,
      operator: authStore.userInfo?.name || '未知',
      ip: '127.0.0.1',
      createTime: new Date().toLocaleString('zh-CN')
    }
    logs.value.unshift(newLog)
    saveLogs()
  }

  const deleteLog = (id: number) => {
    const index = logs.value.findIndex(log => log.id === id)
    if (index !== -1) {
      logs.value.splice(index, 1)
      saveLogs()
    }
  }

  const deleteLogs = (ids: number[]) => {
    logs.value = logs.value.filter(log => !ids.includes(log.id))
    saveLogs()
  }

  return {
    logs,
    stats,
    addLog,
    deleteLog,
    deleteLogs
  }
})
