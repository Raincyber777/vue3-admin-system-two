import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getSignInList, createSignIn, getSignInDetail,
  manualSignIn, endSignIn, exportSignInList,
  deleteSignIn, batchDeleteSignIn,
  type ApiSignInItem, type ApiSignInRecord,
} from '@/api/signin'

/** 签到活动 */
export interface SignInSession {
  id: number
  courseId: number
  courseName: string
  title: string
  department: string
  className: string
  checkinCode: string
  startTime: string
  endTime: string
  status: 'ongoing' | 'ended'
  signinCount: number
  totalCount: number
  createTime: string
}

/** 签到记录 */
export interface SignInRecord {
  id: number
  signinId: number
  userId: number
  studentName: string
  studentNo: string
  department: string
  className: string
  signinTime: string
  status: 'signed' | 'late' | 'absent'
  method: string
}

/** 将 ISO 时间字符串转为可读格式 "YYYY-MM-DD HH:mm:ss" */
const formatTime = (iso: string): string => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso // 已经是格式化过的，直接返回
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch { return iso }
}

const mapSession = (item: any): SignInSession => ({
  id: item.checkinId ?? item.checkin_id ?? item.id ?? 0,
  courseId: item.courseId ?? item.course_id ?? 0,
  courseName: item.courseName || item.course_name || '',
  title: item.title || item.courseName || item.course_name || '签到',
  department: item.department || '',
  className: item.className || item.class_name || '',
  checkinCode: item.checkinCode || item.checkin_code || '',
  startTime: item.createTime || item.create_time || '',
  endTime: formatTime(item.endTime || item.end_time || ''),
  status: item.status === 0 ? 'ended' : 'ongoing',
  signinCount: item.signedCount ?? item.checkinCount ?? item.checkin_count ?? 0,
  totalCount: item.totalCount ?? item.total_count ?? 0,
  createTime: item.createTime || item.create_time || '',
})

const mapRecord = (item: any): SignInRecord => {
  const statusMap: Record<number, 'signed' | 'late' | 'absent'> = { 0: 'signed', 1: 'late', 2: 'absent' }
  return {
    id: item.record_id ?? item.recordId ?? item.id ?? 0,
    signinId: item.checkin_id ?? item.checkinId ?? 0,
    userId: item.user_id ?? item.userId ?? 0,
    studentName: item.real_name || item.name || item.studentName || item.student_name || '',
    studentNo: item.student_no || item.studentNo || item.studentId || '',
    department: item.department || '',
    className: item.class_name || item.className || '',
    signinTime: item.checkin_time || item.checkinTime || item.signTime || '',
    status: statusMap[item.status] || 'signed',
    method: item.method || item.sign_method || '',
  }
}

const MOCK_SESSIONS: SignInSession[] = [
  {
    id: 1, courseId: 1, courseName: 'Python 基础入门', title: '第1次课堂签到',
    department: 'ai', className: '1班', checkinCode: '412991',
    startTime: '2026-07-30 09:00', endTime: '2026-07-30 09:30',
    status: 'ended', signinCount: 25, totalCount: 30, createTime: '2026-07-30 08:50',
  },
  {
    id: 2, courseId: 2, courseName: 'Web 前端开发实战', title: '第1次课堂签到',
    department: 'software', className: '1班', checkinCode: '512883',
    startTime: '2026-07-31 09:00', endTime: '',
    status: 'ongoing', signinCount: 18, totalCount: 22, createTime: '2026-07-31 08:55',
  },
]

export const useSignInStore = defineStore('signin', () => {
  const sessions = ref<SignInSession[]>([])
  const loading = ref(false)

  const fetchSessions = async () => {
    loading.value = true
    // 先从本地缓存加载，并格式化时间字段
    if (sessions.value.length === 0) {
      const cached = localStorage.getItem('signinSessions')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          sessions.value = parsed.map((s: any) => ({ ...s, endTime: formatTime(s.endTime) }))
        } catch { /* */ }
      }
    }
    try {
      const res: any = await getSignInList({ page: 1, pageSize: 200 })
      const list = res.data?.list || res.list || []
      if (list.length > 0) {
        const apiSessions = list.map(mapSession)
        // 只按唯一 ID 匹配，不使用 courseId（多个签到可能共享同一课程）
        const apiIds = new Set(apiSessions.map(s => s.id))
        // 保留本地有但 API 没有的签到
        const localOnly = sessions.value.filter(s => !apiIds.has(s.id))
        // 合并时保留本地的标题、状态、结束时间（API 可能返回旧数据）
        const merged = apiSessions.map(api => {
          const local = sessions.value.find(s => s.id === api.id)
          if (local) {
            return {
              ...api,
              title: local.title || api.title,
              status: local.status,
              endTime: local.endTime || api.endTime,
              className: local.className || api.className,
              startTime: local.startTime || api.startTime,
            }
          }
          return api
        })
        sessions.value = [...merged, ...localOnly]
        // 过滤已删除的签到
        const deletedIds = getDeletedCheckinIds()
        if (deletedIds.size > 0) {
          sessions.value = sessions.value.filter(s => !deletedIds.has(s.id))
        }
        saveSessions()
        loading.value = false
        return
      }
    } catch (error) {
      console.warn('获取签到列表失败，使用本地数据:', error)
    }
    // 过滤已删除的签到
    const deletedIds = getDeletedCheckinIds()
    if (deletedIds.size > 0) {
      sessions.value = sessions.value.filter(s => !deletedIds.has(s.id))
    }
    if (sessions.value.length === 0) {
      sessions.value = [...MOCK_SESSIONS]
      localStorage.setItem('signinSessions', JSON.stringify(sessions.value))
    }
    loading.value = false
  }

  const saveSessions = () => {
    localStorage.setItem('signinSessions', JSON.stringify(sessions.value))
  }

  const addSession = async (data: Omit<SignInSession, 'id' | 'signinCount' | 'totalCount' | 'createTime'>) => {
    let backendId: number | null = null
    let checkinCode: string = ''
    let apiEndTime: string = ''
    let apiError: Error | null = null
    try {
      const res: any = await createSignIn({
        courseId: data.courseId,
        title: data.title,
        department: data.department || '',
        className: data.className,
        endTime: data.endTime,
      })
      // 从响应获取后端 checkinId、checkinCode、endTime
      const d = res?.data || res
      backendId = d?.checkinId ?? d?.checkin_id ?? d?.id ?? null
      checkinCode = d?.checkinCode ?? d?.checkin_code ?? ''
      apiEndTime = d?.endTime ?? d?.end_time ?? ''
    } catch (error: any) {
      console.warn('发起签到接口失败，本地降级:', error)
      apiError = error
    }
    const newId = backendId ?? (Math.max(0, ...sessions.value.map(s => s.id)) + 1)
    const session: SignInSession = {
      ...data,
      id: newId,
      checkinCode: checkinCode || data.checkinCode || '',
      endTime: formatTime(apiEndTime || data.endTime),
      signinCount: 0,
      totalCount: 0,
      createTime: new Date().toLocaleString('zh-CN'),
    }
    sessions.value.unshift(session)
    saveSessions()
    // 如果 API 失败，抛出错误让调用方显示提示
    if (apiError) {
      throw apiError
    }
  }

  const fetchDetail = async (signinId: number): Promise<SignInRecord[]> => {
    try {
      const res: any = await getSignInDetail(signinId, { pageSize: 500 })
      const list = res.data?.list || res.list || []
      if (list.length > 0) return list.map(mapRecord)
    } catch (error) {
      console.warn('获取签到明细失败:', error)
    }
    return []
  }

  const doManualSign = async (signinId: number, studentNo: string, studentName?: string) => {
    try {
      await manualSignIn({ checkinId: signinId, studentNo: studentNo })
    } catch (error) {
      console.warn('手动签到接口失败:', error)
      throw error
    }
  }

  const doEndSignIn = async (signinId: number) => {
    try {
      await endSignIn(signinId)
      const s = sessions.value.find(s => s.id === signinId)
      if (s) { s.status = 'ended'; s.endTime = new Date().toLocaleString('zh-CN'); saveSessions() }
    } catch (error) {
      console.warn('结束签到接口失败，本地降级:', error)
      const s = sessions.value.find(s => s.id === signinId)
      if (s) { s.status = 'ended'; s.endTime = new Date().toLocaleString('zh-CN'); saveSessions() }
    }
  }

  const doExport = async (signinId: number) => {
    const blob = await exportSignInList(signinId)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const session = sessions.value.find(s => s.id === signinId)
    link.download = `签到名单_${session?.title || signinId}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // 已删除的签到 ID 集合（localStorage 持久化）
  const getDeletedCheckinIds = (): Set<number> => {
    try {
      const stored = localStorage.getItem('deletedCheckinIds')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  }
  const saveDeletedCheckinId = (id: number) => {
    const ids = getDeletedCheckinIds()
    ids.add(id)
    localStorage.setItem('deletedCheckinIds', JSON.stringify([...ids]))
  }
  const saveDeletedCheckinIds = (newIds: number[]) => {
    const ids = getDeletedCheckinIds()
    newIds.forEach(id => ids.add(id))
    localStorage.setItem('deletedCheckinIds', JSON.stringify([...ids]))
  }

  /** 删除单个签到 */
  const doDelete = async (signinId: number) => {
    try {
      await deleteSignIn(signinId)
    } catch (error) {
      console.warn('删除签到接口失败:', error)
    }
    saveDeletedCheckinId(signinId)
    sessions.value = sessions.value.filter(s => s.id !== signinId)
    saveSessions()
  }

  /** 批量删除签到 */
  const doBatchDelete = async (ids: number[]) => {
    try {
      await batchDeleteSignIn(ids)
    } catch (error) {
      console.warn('批量删除签到接口失败:', error)
    }
    saveDeletedCheckinIds(ids)
    const idSet = new Set(ids)
    sessions.value = sessions.value.filter(s => !idSet.has(s.id))
    saveSessions()
  }

  /** 自动结束已到期的签到（不调用后端，仅更新本地状态） */
  const autoEndExpiredSessions = () => {
    const now = new Date()
    let changed = false
    for (const s of sessions.value) {
      if (s.status !== 'ongoing') continue
      if (!s.endTime) continue
      const end = new Date(s.endTime)
      if (isNaN(end.getTime())) continue
      if (now >= end) {
        s.status = 'ended'
        changed = true
      }
    }
    if (changed) saveSessions()
  }

  return {
    sessions, loading,
    fetchSessions, addSession, fetchDetail,
    doManualSign, doEndSignIn, doExport,
    doDelete, doBatchDelete,
    autoEndExpiredSessions,
  }
})
