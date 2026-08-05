import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getSignInList, createSignIn, getSignInDetail,
  manualSignIn, endSignIn, exportSignInList,
  deleteSignIn, batchDeleteSignIn,
} from '@/api/signin'
import {
  formatTime, pick, readStorage, writeStorage,
  createDeletedIdsManager, parseListResponse, extractClassName, cnClassToArabic,
} from '@/utils/common'

const deletedCheckinIds = createDeletedIdsManager('deletedCheckinIds')

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

const STATUS_MAP: Record<number | string, 'signed' | 'late' | 'absent'> = {
  0: 'signed', 1: 'late', 2: 'absent',
  signed: 'signed', late: 'late', absent: 'absent',
  正常: 'signed', 迟到: 'late', 缺席: 'absent',
  已签到: 'signed', 未签到: 'absent',
}

const mapSession = (item: any): SignInSession => {
  // 获取后端返回的班级字段，可能是 className、groupName 或 groups
  const rawClassName = pick(item, 'className', 'class_name', 'groupName', 'group_name', 'groups', '') as string
  // 统一转换为中文数字格式（如 "一班"、"二班"）
  const displayClassName = extractClassName(rawClassName)

  return {
    id: pick(item, 'checkinId', 'checkin_id', 'id', 0) as number,
    courseId: pick(item, 'courseId', 'course_id', 0) as number,
    courseName: pick(item, 'courseName', 'course_name', '') as string,
    title: pick(item, 'title', 'courseName', 'course_name', '签到') as string,
    department: pick(item, 'department', '') as string,
    className: displayClassName,  // 存储转换后的班级名（中文数字格式）
    checkinCode: pick(item, 'checkinCode', 'checkin_code', '') as string,
    startTime: pick(item, 'createTime', 'create_time', '') as string,
    endTime: formatTime(pick(item, 'endTime', 'end_time', '') as string),
    status: pick(item, 'status', 0) === 0 ? 'ended' : 'ongoing',
    signinCount: pick(item, 'signedCount', 'checkinCount', 'checkin_count', 0) as number,
    totalCount: pick(item, 'totalCount', 'total_count', 0) as number,
    createTime: pick(item, 'createTime', 'create_time', '') as string,
  }
}

const mapRecord = (item: any): SignInRecord => {
  const record: SignInRecord = {
    id: pick(item, 'record_id', 'recordId', 'id', 0) as number,
    signinId: pick(item, 'checkin_id', 'checkinId', 'signinId', 0) as number,
    userId: pick(item, 'user_id', 'userId', 0) as number,
    studentName: pick(item, 'realName', 'real_name', 'userRealName', 'name', 'userName', 'username', 'studentName', 'student_name', 'nickname', '') as string,
    studentNo: pick(item, 'studentId', 'student_no', 'studentNo', 'sno', 'student_id', 'account', 'user_no', '') as string,
    department: pick(item, 'college', 'department', 'dept_name', 'deptName', '') as string,
    className: pick(item, 'major', 'class_name', 'className', 'cls_name', 'clsName', '') as string,
    signinTime: pick(item, 'checkinTime', 'checkin_time', 'signTime', 'sign_time', 'createTime', 'create_time', 'created_at', 'submitTime', '') as string,
    status: (() => {
      // 优先使用 isSigned 布尔值判断签到状态
      if (item.isSigned !== undefined && item.isSigned !== null) {
        return item.isSigned ? 'signed' : 'absent'
      }
      // 兼容旧的 status 字段
      const s = pick(item, 'status')
      return STATUS_MAP[s as keyof typeof STATUS_MAP] || STATUS_MAP[String(s) as keyof typeof STATUS_MAP] || 'absent'
    })(),
    method: pick(item, 'method', 'sign_method', 'signMethod', 'type', 'signin_method', '') as string,
  }
  return record
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
  const detailCache = ref<Map<number, SignInRecord[]>>(new Map())

  const saveSessions = () => writeStorage('signinSessions', sessions.value)

  const loadDetailCache = (checkinId: number): SignInRecord[] =>
    readStorage(`signinDetail_${checkinId}`, [] as SignInRecord[])

  const saveDetailCache = (checkinId: number, records: SignInRecord[]) =>
    writeStorage(`signinDetail_${checkinId}`, records)

  const fetchSessions = async () => {
    loading.value = true

    // 先从本地缓存加载
    if (sessions.value.length === 0) {
      const cached = readStorage<any[]>('signinSessions', [])
      if (cached.length > 0) {
        sessions.value = cached.map(s => ({ ...s, endTime: formatTime(s.endTime) }))
      }
    }

    try {
      const res: any = await getSignInList({ page: 1, pageSize: 200 })
      const list = parseListResponse(res)
      if (list.length > 0) {
        const apiSessions = list.map(mapSession)
        const apiIds = new Set(apiSessions.map(s => s.id))

        // 保留本地有但 API 没有的签到
        const localOnly = sessions.value.filter(s => !apiIds.has(s.id))

        // 合并时保留本地的标题、状态、结束时间
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

        // 过滤已删除的
        sessions.value = [...merged, ...localOnly].filter(s => !deletedCheckinIds.has(s.id))
        saveSessions()
        loading.value = false
        return
      }
    } catch (error) {
      console.warn('获取签到列表失败，使用本地数据:', error)
    }

    // 过滤已删除的
    sessions.value = sessions.value.filter(s => !deletedCheckinIds.has(s.id))

    if (sessions.value.length === 0) {
      sessions.value = [...MOCK_SESSIONS]
      saveSessions()
    }
    loading.value = false
  }

  const addSession = async (data: Omit<SignInSession, 'id' | 'signinCount' | 'totalCount' | 'createTime'>) => {
    let backendId: number | null = null
    let checkinCode: string = ''
    let apiEndTime: string = ''
    let apiError: Error | null = null

    // 统一转换班级格式为中文数字格式
    const normalizedClassName = extractClassName(data.className || '')

    try {
      const res: any = await createSignIn({
        courseId: data.courseId,
        title: data.title,
        department: data.department || '',
        className: normalizedClassName,  // 使用转换后的班级名
        endTime: data.endTime,
      })
      const d = res?.data || res
      backendId = pick(d, 'checkinId', 'checkin_id', 'id', null) as number | null
      checkinCode = pick(d, 'checkinCode', 'checkin_code', '') as string
      apiEndTime = pick(d, 'endTime', 'end_time', '') as string
    } catch (error: any) {
      console.warn('发起签到接口失败，本地降级:', error)
      apiError = error
    }

    const newId = backendId ?? (Math.max(0, ...sessions.value.map(s => s.id)) + 1)
    const session: SignInSession = {
      ...data,
      className: normalizedClassName,  // 使用转换后的班级名
      id: newId,
      checkinCode: checkinCode || data.checkinCode || '',
      endTime: formatTime(apiEndTime || data.endTime),
      signinCount: 0,
      totalCount: 0,
      createTime: new Date().toLocaleString('zh-CN'),
    }
    sessions.value.unshift(session)
    saveSessions()

    if (apiError) throw apiError
  }

  const fetchDetail = async (signinId: number): Promise<SignInRecord[]> => {
    const cachedRecords = loadDetailCache(signinId)
    if (cachedRecords.length > 0) {
      detailCache.value.set(signinId, cachedRecords)
    }

    try {
      const res: any = await getSignInDetail(signinId, { pageSize: 100 })

      const list = parseListResponse(res)

      if (list.length > 0) {
        const mappedRecords = list.map(mapRecord)
        saveDetailCache(signinId, mappedRecords)
        detailCache.value.set(signinId, mappedRecords)
        return mappedRecords
      }
    } catch (error) {
      console.warn('获取签到明细失败，使用本地缓存:', error)
    }

    return cachedRecords
  }

  const doManualSign = async (signinId: number, studentNo: string, _studentName?: string) => {
    try {
      await manualSignIn({ checkinId: signinId, studentNo })
    } catch (error) {
      console.warn('手动签到接口失败:', error)
      throw error
    }
  }

  const doEndSignIn = async (signinId: number) => {
    try {
      await endSignIn(signinId)
      const s = sessions.value.find(s => s.id === signinId)
      if (s) {
        s.status = 'ended'
        s.endTime = new Date().toLocaleString('zh-CN')
        saveSessions()
      }
    } catch (error) {
      console.warn('结束签到接口失败，本地降级:', error)
      const s = sessions.value.find(s => s.id === signinId)
      if (s) {
        s.status = 'ended'
        s.endTime = new Date().toLocaleString('zh-CN')
        saveSessions()
      }
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

  const doDelete = async (signinId: number) => {
    try { await deleteSignIn(signinId) } catch (error) {
      console.warn('删除签到接口失败:', error)
    }
    deletedCheckinIds.add(signinId)
    sessions.value = sessions.value.filter(s => s.id !== signinId)
    saveSessions()
  }

  const doBatchDelete = async (ids: number[]) => {
    try { await batchDeleteSignIn(ids) } catch (error) {
      console.warn('批量删除签到接口失败:', error)
    }
    deletedCheckinIds.addMany(ids)
    const idSet = new Set(ids)
    sessions.value = sessions.value.filter(s => !idSet.has(s.id))
    saveSessions()
  }

  const autoEndExpiredSessions = () => {
    const now = new Date()
    let changed = false
    for (const s of sessions.value) {
      if (s.status !== 'ongoing' || !s.endTime) continue
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
