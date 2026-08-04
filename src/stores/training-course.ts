import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createCourse, updateCourseApi, deleteCourseApi, getCourseList, getCourseDetail, updateCourseStatus, type ApiCourseItem, type CourseDetail } from '@/api/course'

export type CourseStatus = 'draft' | 'pending' | 'published' | 'ended'
export type RegistrationStatus = 'not_started' | 'ongoing' | 'ended'

export interface CourseChapter {
  id: string
  order: number
  name: string
  date: string
}

/**
 * 前端课程数据类型（内部使用）
 * 字段名更符合前端展示习惯
 */
export interface Course {
  id: string
  name: string
  /** 部门：software */
  department?: 'software'
  /** 培训班级：1班/2班/3班 */
  className?: string
  status: CourseStatus
  registrationStatus: RegistrationStatus
  trainingTargets: string[]
  maxParticipants: number
  currentParticipants: number
  startTime: string
  endTime: string
  trainingLocation: string
  instructor: string
  instructorId?: string
  prerequisites: string
  courseTags: string[]
  description: string
  coverImg?: string
  chapters: CourseChapter[]
  linkedAttendance: boolean
  linkedScore: boolean
  linkedAnnouncement: boolean
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export const TRAINING_TARGET_OPTIONS = [
  { label: '软件开发实验室', value: 'software' }
]

export const COURSE_TAG_OPTIONS = [
  '入门基础',
  '进阶提升',
  '实战项目',
  '算法专题',
  '前端开发',
  '后端开发',
  '数据分析',
  '人工智能',
  '新生必读',
  '考核课程'
]

const STATUS_TEXT: Record<CourseStatus, string> = {
  draft: '草稿',
  pending: '待发布',
  published: '已发布',
  ended: '已结束'
}

const REGISTRATION_STATUS_TEXT: Record<RegistrationStatus, string> = {
  not_started: '未开始',
  ongoing: '报名中',
  ended: '已结束'
}

// 默认数据（API 未连接时使用，清空避免干扰后端数据）
const DEFAULT_COURSES: Course[] = []

export const useTrainingCourseStore = defineStore('trainingCourse', () => {
  // 数据状态
  const courses = ref<Course[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const useApi = ref(false)

  // 筛选状态
  const activeFilter = ref('all')
  const searchKeyword = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)

  // 统计数据
  const stats = computed(() => ({
    all: courses.value.length,
    draft: courses.value.filter(c => c.status === 'draft').length,
    pending: courses.value.filter(c => c.status === 'pending').length,
    published: courses.value.filter(c => c.status === 'published').length,
    ended: courses.value.filter(c => c.status === 'ended').length
  }))

  const filteredCourses = computed(() => {
    let result = [...courses.value]

    if (activeFilter.value !== 'all') {
      result = result.filter(c => c.status === activeFilter.value)
    }

    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(keyword) ||
        c.instructor.toLowerCase().includes(keyword) ||
        c.trainingTargets.some(t => {
          const option = TRAINING_TARGET_OPTIONS.find(o => o.value === t)
          return option?.label.toLowerCase().includes(keyword)
        }) ||
        c.courseTags.some(tag => tag.toLowerCase().includes(keyword))
      )
    }

    return result.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  const getStatusText = (status: CourseStatus) => STATUS_TEXT[status] || status

  const getStatusType = (status: CourseStatus) => {
    const typeMap: Record<CourseStatus, string> = {
      draft: 'info',
      pending: 'warning',
      published: 'success',
      ended: ''
    }
    return typeMap[status] || 'default'
  }

  const getRegistrationStatusText = (status: RegistrationStatus) => REGISTRATION_STATUS_TEXT[status] || status

  const getRegistrationStatusType = (status: RegistrationStatus) => {
    const typeMap: Record<RegistrationStatus, string> = {
      not_started: 'info',
      ongoing: 'success',
      ended: 'warning'
    }
    return typeMap[status] || 'default'
  }

  const getTrainingTargetsLabel = (values: string[]) => {
    return values.map(v => {
      const option = TRAINING_TARGET_OPTIONS.find(o => o.value === v)
      return option?.label || v
    }).join('、')
  }

  const formatTimeRange = (start: string, end: string) => {
    if (start === '待定' && end === '待定') return '待定'
    if (start === '待定') return `待定 ～ ${end}`
    if (end === '待定') return `${start} ～ 待定`
    return `${start} ～ ${end}`
  }

  // 加载课程列表（本地为主，API 只用来同步 ID 和状态）
  const fetchCourses = async () => {
    loading.value = true
    error.value = null

    // 先从本地缓存加载
    if (courses.value.length === 0) {
      loadFromStorage()
    }
    if (courses.value.length === 0) {
      courses.value = [...DEFAULT_COURSES]
      saveToStorage()
    }

    // 尝试用 API 数据更新 ID 和状态（不替换整个列表）
    try {
      const res: any = await getCourseList()
      const list = res.data?.list || res.list || []
      if (list.length > 0) {
        // 先读取已删除课程名，在最外层就过滤掉
        const deletedNames: string[] = (() => {
          try { return JSON.parse(localStorage.getItem('deletedCourseNames') || '[]') } catch { return [] }
        })()
        const nameToApi = new Map<string, ApiCourseItem>()
        for (const item of list) {
          // 跳过已被用户删除的课程
          if (deletedNames.includes(item.course_name)) continue
          nameToApi.set(item.course_name, item)
        }
        // 用 API 数据更新已有课程的后端 ID 和状态
        for (const c of courses.value) {
          const apiItem = nameToApi.get(c.name)
          if (apiItem) {
            c.id = String(apiItem.course_id)
            c.status = apiItem.status === 1 ? 'published' as CourseStatus : 'draft' as CourseStatus
            c.description = apiItem.course_desc || c.description
            c.coverImg = apiItem.cover_img || c.coverImg
            c.startTime = apiItem.start_time || c.startTime
            c.endTime = apiItem.end_time || c.endTime
            c.maxParticipants = apiItem.max_sign || c.maxParticipants
            c.currentParticipants = apiItem.sign_count || 0
            c.createdAt = apiItem.create_time || c.createdAt
            c.updatedAt = apiItem.create_time || c.updatedAt
            apiItem.create_time && (c.publishedAt = apiItem.create_time)
            nameToApi.delete(c.name)
          }
        }
        // API 中有但本地没有的课程 → 自动添加到本地列表
        const remaining = [...nameToApi.values()]
        if (remaining.length > 0) {
          const deleted: string[] = (() => {
            try { return JSON.parse(localStorage.getItem('deletedCourseNames') || '[]') } catch { return [] }
          })()
          for (const item of remaining) {
            // 跳过已被用户主动删除的课程
            if (deleted.includes(item.course_name)) continue
            courses.value.push({
              id: String(item.course_id),
              name: item.course_name,
              status: item.status === 1 ? 'published' as CourseStatus : 'draft' as CourseStatus,
              registrationStatus: 'ongoing' as RegistrationStatus,
              trainingTargets: [],
              maxParticipants: item.max_sign || 50,
              currentParticipants: item.sign_count || 0,
              startTime: item.start_time || '待定',
              endTime: item.end_time || '待定',
              trainingLocation: '待定',
              instructor: '待定',
              prerequisites: '',
              courseTags: [],
              description: item.course_desc || '',
              chapters: [],
              linkedAttendance: false,
              linkedScore: false,
              linkedAnnouncement: false,
              createdAt: item.create_time || '',
              updatedAt: item.create_time || '',
              publishedAt: item.status === 1 ? item.create_time : undefined,
            } as Course)
          }
        }
        saveToStorage()
      }
    } catch (err: any) {
      console.warn('获取课程列表失败，使用本地数据:', err)
    } finally {
      total.value = courses.value.length
      loading.value = false
    }
  }

  const addCourse = async (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true
    error.value = null

    // 先用临时 ID 添加到列表，确保用户立即看到
    const tempId = generateId()
    const now = new Date().toLocaleString('zh-CN')
    const course: Course = { ...data, id: tempId, createdAt: now, updatedAt: now }
    courses.value.unshift(course)
    saveToStorage()

    try {
      const res: any = await createCourse({
        courseName: data.name,
        courseDesc: data.description,
        coverImg: (data as any).coverImg || undefined,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        maxSign: data.maxParticipants || 50,
      })

      // 从创建响应获取后端 ID（兼容 courseId / course_id / id）
      const backendData = res.data || res
      const backendId = backendData?.courseId ?? backendData?.course_id ?? backendData?.id
      if (backendId) {
        course.id = String(backendId)
        saveToStorage()
      } else {
        // 创建响应没带 ID，从列表 API 反查
        try {
          const listRes: any = await getCourseList()
          const list = listRes.data?.list || listRes.list || []
          const match = list.find((c: any) => (c.course_name || c.courseName) === data.name)
          if (match) {
            const id = match.course_id ?? match.courseId ?? match.id
            if (id) { course.id = String(id); saveToStorage() }
          }
        } catch { /* ignore */ }
      }
      return true
    } catch (err: any) {
      console.error('创建课程失败:', err)
      return true
    } finally {
      loading.value = false
    }
  }

  const updateCourse = async (id: string, data: Partial<Course>) => {
    loading.value = true
    error.value = null

    try {
      // 调用真实 API
      await updateCourseApi(id, {
        courseName: data.name,
        courseDesc: data.description,
        coverImg: (data as any).coverImg || undefined,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        maxSign: data.maxParticipants,
      })

      // 同步更新本地数据
      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        const now = new Date().toLocaleString('zh-CN')
        courses.value[index] = { ...courses.value[index], ...data, updatedAt: now }
        if (data.status === 'published' && !courses.value[index].publishedAt) {
          courses.value[index].publishedAt = now
        }
        saveToStorage()
      }
      return true
    } catch (err: any) {
      console.error('更新课程失败:', err)
      error.value = err.message || '更新课程失败'
      ElMessage.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteCourse = async (id: string) => {
    loading.value = true
    error.value = null

    const course = courses.value.find(c => c.id === id)
    // 调删除 API：优先用传入的 ID（纯数字），否则尝试从 API 反查
    const numericId = /^\d+$/.test(id) ? id : null
    if (numericId) {
      try { await deleteCourseApi(numericId) } catch (err) {
        console.warn('删除课程 API 失败:', err)
      }
    } else if (course?.name) {
      // 非数字 ID：通过 API 列表反查真实 course_id 再删除
      try {
        const res: any = await getCourseList()
        const list = res.data?.list || res.list || []
        const match = list.find((c: any) => c.course_name === course.name)
        if (match?.course_id) {
          await deleteCourseApi(String(match.course_id))
        }
      } catch (err) {
        console.warn('反查删除课程失败:', err)
      }
    }
    // 记录已删除的课程名到 localStorage（用 name 或 id 兜底）
    const deleteKey = course?.name || id
    if (deleteKey) {
      try {
        const deleted: string[] = JSON.parse(localStorage.getItem('deletedCourseNames') || '[]')
        if (!deleted.includes(deleteKey)) {
          deleted.push(deleteKey)
          localStorage.setItem('deletedCourseNames', JSON.stringify(deleted))
        }
      } catch { /* ignore */ }
    }

    courses.value = courses.value.filter(c => c.id !== id)
    saveToStorage()
    loading.value = false
    return true
  }

  const publishCourse = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await updateCourseStatus(id, 1)
      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        const now = new Date().toLocaleString('zh-CN')
        courses.value[index] = { ...courses.value[index], status: 'published', publishedAt: now, updatedAt: now }
        saveToStorage()
      }
      ElMessage.success('课程已发布')
    } catch (err: any) {
      error.value = err.message || '发布失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 下架课程：已发布 → 变草稿 */
  const unpublishCourse = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await updateCourseStatus(id, 0)
      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        const now = new Date().toLocaleString('zh-CN')
        courses.value[index] = { ...courses.value[index], status: 'draft', updatedAt: now }
        saveToStorage()
      }
      ElMessage.success('课程已下架')
    } catch (err: any) {
      error.value = err.message || '下架失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const endCourse = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      if (useApi.value) {
        // 通过更新接口设置结束状态
        await updateCourseApi(id, { is_published: false } as any)
        await fetchCourses()
      } else {
        const course = courses.value.find(c => c.id === id)
        if (!course) return false

        if (course.status !== 'published') {
          ElMessage.warning('只能结束已发布的课程')
          return false
        }

        const index = courses.value.findIndex(c => c.id === id)
        const now = new Date().toLocaleString('zh-CN')
        courses.value[index] = {
          ...courses.value[index],
          status: 'ended',
          registrationStatus: 'ended',
          updatedAt: now
        }
        saveToStorage()
      }
      return true
    } catch (err: any) {
      console.error('结束课程失败:', err)
      error.value = err.message || '结束课程失败'
      ElMessage.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  const getCourseById = (id: string) => {
    return courses.value.find(c => c.id === id)
  }

  /** 通过 API 获取课程完整详情 */
  const fetchCourseDetail = async (id: string): Promise<Course | null> => {
    try {
      const res: any = await getCourseDetail(id)
      const d: CourseDetail = res.data || res
      if (d) {
        return {
          id: String(d.course_id),
          name: d.course_name,
          status: d.status === 1 ? 'published' : 'draft',
          registrationStatus: 'ongoing',
          trainingTargets: [],
          maxParticipants: d.max_sign || 50,
          currentParticipants: d.sign_count || 0,
          startTime: d.start_time || '待定',
          endTime: d.end_time || '待定',
          trainingLocation: '待定',
          instructor: '待定',
          prerequisites: '',
          courseTags: [],
          description: d.course_desc || '',
          chapters: [],
          linkedAttendance: false,
          linkedScore: false,
          linkedAnnouncement: false,
          createdAt: d.create_time || '',
          updatedAt: d.create_time || '',
          publishedAt: d.status === 1 ? d.create_time : undefined,
        }
      }
    } catch (error) {
      console.warn('获取课程详情失败:', error)
    }
    return getCourseById(id) || null
  }

  const saveToStorage = () => {
    localStorage.setItem('training_courses', JSON.stringify(courses.value))
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('training_courses')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          courses.value = parsed
        }
      }
    } catch (error) {
      console.error('Failed to load courses from localStorage:', error)
    }
  }

  const setActiveFilter = (filter: string) => {
    activeFilter.value = filter
    currentPage.value = 1
  }

  const setSearchKeyword = (keyword: string) => {
    searchKeyword.value = keyword
    currentPage.value = 1
  }

  const setPage = (page: number) => {
    currentPage.value = page
  }

  const setPageSize = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
  }

  return {
    // 状态
    courses,
    total,
    loading,
    error,
    useApi,
    activeFilter,
    searchKeyword,
    currentPage,
    pageSize,
    stats,
    filteredCourses,
    TRAINING_TARGET_OPTIONS,
    COURSE_TAG_OPTIONS,
    // 方法
    fetchCourses,
    addCourse,
    updateCourse,
    deleteCourse,
    publishCourse,
    unpublishCourse,
    endCourse,
    getCourseById,
    fetchCourseDetail,
    getStatusText,
    getStatusType,
    getRegistrationStatusText,
    getRegistrationStatusType,
    getTrainingTargetsLabel,
    formatTimeRange,
    loadFromStorage,
    setActiveFilter,
    setSearchKeyword,
    setPage,
    setPageSize
  }
})
