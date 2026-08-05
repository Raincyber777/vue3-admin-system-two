import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createCourse, updateCourseApi, deleteCourseApi, getCourseList, getCourseDetail, updateCourseStatus, type ApiCourseItem, type CourseDetail } from '@/api/course'
import { pick, readStorage, writeStorage, createDeletedIdsManager, parseListResponse, now, generateTempId } from '@/utils/common'

const deletedCourseNames = createDeletedIdsManager('deletedCourseNames')

export type CourseStatus = 'draft' | 'pending' | 'published' | 'ended'
export type RegistrationStatus = 'not_started' | 'ongoing' | 'ended'

export interface CourseChapter {
  id: string
  order: number
  name: string
  date: string
}

export interface Course {
  id: string
  name: string
  department?: 'software'
  className?: string
  status: CourseStatus
  registrationStatus: RegistrationStatus
  trainingTargets: string[]
  maxParticipants: number
  currentParticipants: number
  startTime: string
  endTime: string
  timeType?: 'fixed' | 'flexible'
  flexibleTime?: { startDate: string; endDate: string; weekdays: number[]; startTime: string; endTime: string }
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

export const COURSE_TAG_OPTIONS = ['入门基础', '进阶提升', '实战项目', '算法专题', '前端开发', '后端开发', '数据分析', '人工智能', '新生必读', '考核课程']

const STATUS_TEXT: Record<CourseStatus, string> = { draft: '草稿', pending: '待发布', published: '已发布', ended: '已结束' }
const REGISTRATION_STATUS_TEXT: Record<RegistrationStatus, string> = { not_started: '未开始', ongoing: '报名中', ended: '已结束' }

const DEFAULT_COURSES: Course[] = []

export const useTrainingCourseStore = defineStore('trainingCourse', () => {
  const courses = ref<Course[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const useApi = ref(false)

  const activeFilter = ref('all')
  const searchKeyword = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)

  const stats = computed(() => ({
    all: courses.value.length,
    draft: courses.value.filter(c => c.status === 'draft').length,
    pending: courses.value.filter(c => c.status === 'pending').length,
    published: courses.value.filter(c => c.status === 'published').length,
    ended: courses.value.filter(c => c.status === 'ended').length
  }))

  const filteredCourses = computed(() => {
    let result = [...courses.value]
    if (activeFilter.value !== 'all') result = result.filter(c => c.status === activeFilter.value)
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(keyword) ||
        c.instructor.toLowerCase().includes(keyword) ||
        c.trainingTargets.some(t => TRAINING_TARGET_OPTIONS.find(o => o.value === t)?.label.toLowerCase().includes(keyword)) ||
        c.courseTags.some(tag => tag.toLowerCase().includes(keyword))
      )
    }
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  })

  const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const formatFlexibleTimeForApi = (ft?: any): string => {
    if (!ft) return ''
    const parts: string[] = []
    if (ft.startDate && ft.endDate) {
      const s = ft.startDate, e = ft.endDate
      parts.push(s.substring(0, 7) === e.substring(0, 7) ? `${s.substring(0, 4)}年${s.substring(5, 7)}月` : `${s.substring(0, 4)}年${s.substring(5, 7)}月-${e.substring(5, 7)}月`)
    }
    if (ft.weekdays?.length) parts.push(`每周${ft.weekdays.sort().map((w: number) => WEEKDAY_NAMES[w]).join('、')}`)
    if (ft.startTime && ft.endTime) parts.push(`${ft.startTime}-${ft.endTime}`)
    return parts.join(' ')
  }

  const getStatusText = (status: CourseStatus) => STATUS_TEXT[status] || status
  const getStatusType = (status: CourseStatus) => ({ draft: 'info', pending: 'warning', published: 'success', ended: '' }[status] || 'default')
  const getRegistrationStatusText = (status: RegistrationStatus) => REGISTRATION_STATUS_TEXT[status] || status
  const getRegistrationStatusType = (status: RegistrationStatus) => ({ not_started: 'info', ongoing: 'success', ended: 'warning' }[status] || 'default')
  const getTrainingTargetsLabel = (values: string[]) => values.map(v => TRAINING_TARGET_OPTIONS.find(o => o.value === v)?.label || v).join('、')
  const formatTimeRange = (start: string, end: string) => {
    if (start === '待定' && end === '待定') return '待定'
    if (start === '待定') return `待定 ～ ${end}`
    if (end === '待定') return `${start} ～ 待定`
    return `${start} ～ ${end}`
  }

  const saveToStorage = () => writeStorage('training_courses', courses.value)
  const loadFromStorage = () => {
    try {
      const stored = readStorage<any[]>('training_courses', [])
      if (Array.isArray(stored) && stored.length > 0) courses.value = stored
    } catch (error) { console.error('Failed to load courses from localStorage:', error) }
  }

  const fetchCourses = async () => {
    loading.value = true
    error.value = null
    try {
      const res: any = await getCourseList()
      const list = parseListResponse(res)
      courses.value = list.map((item: any) => ({
        id: String(pick(item, 'course_id', '') as string),
        name: pick(item, 'course_name', '') as string,
        status: (pick(item, 'status', 0) === 1 ? 'published' : 'draft') as CourseStatus,
        registrationStatus: 'ongoing' as RegistrationStatus,
        trainingTargets: [],
        maxParticipants: pick(item, 'max_sign', 50) as number,
        currentParticipants: pick(item, 'sign_count', 0) as number,
        timeType: (pick(item, 'course_date', 'courseDate') ? 'flexible' : 'fixed') as 'fixed' | 'flexible',
        startTime: pick(item, 'start_time', '待定') as string,
        endTime: pick(item, 'end_time', '待定') as string,
        flexibleTime: pick(item, 'course_date', 'courseDate') ? { startDate: pick(item, 'start_time', '') as string, endDate: pick(item, 'end_time', '') as string, weekdays: [], startTime: '', endTime: '' } : undefined,
        trainingLocation: pick(item, 'location', '待定') as string,
        instructor: pick(item, 'instructor', '待定') as string,
        className: (pick(item, 'class_name', '') || pick(item, 'className', '')) as string,
        prerequisites: '',
        courseTags: [],
        description: pick(item, 'course_desc', '') as string,
        chapters: [],
        linkedAttendance: false,
        linkedScore: false,
        linkedAnnouncement: false,
        createdAt: pick(item, 'create_time', '') as string,
        updatedAt: pick(item, 'create_time', '') as string,
        publishedAt: pick(item, 'status', 0) === 1 ? pick(item, 'create_time', '') as string : undefined,
      } as Course))
    } catch (err: any) {
      console.warn('获取课程列表失败:', err)
      error.value = err.message || '获取课程列表失败'
    } finally {
      total.value = courses.value.length
      loading.value = false
    }
  }

  const addCourse = async (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true
    error.value = null

    try {
      const res: any = await createCourse({
        courseName: data.name,
        courseDesc: data.description,
        coverImg: (data as any).coverImg || undefined,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        maxSign: data.maxParticipants || 50,
        timeType: data.timeType,
        flexibleTime: data.flexibleTime,
        courseDate: data.timeType === 'flexible' ? formatFlexibleTimeForApi(data.flexibleTime) : undefined,
      })

      const backendId = pick(res?.data, 'courseId', 'course_id', 'id', null) ?? pick(res, 'courseId', 'id', null)
      const course: Course = { ...data, id: String(backendId || ''), createdAt: now(), updatedAt: now() }
      courses.value.unshift(course)
      await fetchCourses()
      return true
    } catch (err: any) {
      console.error('创建课程失败:', err)
      error.value = err.message || '创建课程失败'
    } finally {
      loading.value = false
    }
  }

  const updateCourse = async (id: string, data: Partial<Course>) => {
    loading.value = true
    error.value = null
    try {
      await updateCourseApi(id, {
        courseName: data.name,
        courseDesc: data.description,
        coverImg: (data as any).coverImg || undefined,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        maxSign: data.maxParticipants,
        timeType: data.timeType,
        flexibleTime: data.flexibleTime,
        courseDate: data.timeType === 'flexible' ? formatFlexibleTimeForApi(data.flexibleTime) : undefined,
      })
      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        courses.value[index] = { ...courses.value[index], ...data, updatedAt: now() }
        if (data.status === 'published' && !courses.value[index].publishedAt) courses.value[index].publishedAt = now()
    
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
    try {
      await deleteCourseApi(id)
      courses.value = courses.value.filter(c => c.id !== id)
    } catch (err: any) {
      console.warn('删除课程失败:', err)
      error.value = err.message || '删除失败'
    } finally {
      loading.value = false
    }
    return true
  }

  const publishCourse = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await updateCourseStatus(id, 1)
      await fetchCourses()
      ElMessage.success('课程已发布')
    } catch (err: any) {
      error.value = err.message || '发布失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  const unpublishCourse = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await updateCourseStatus(id, 0)
      await fetchCourses()
      ElMessage.success('课程已下架')
    } catch (err: any) {
      error.value = err.message || '下架失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  const endCourse = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const course = courses.value.find(c => c.id === id)
      if (!course) return false
      if (course.status !== 'published') { ElMessage.warning('只能结束已发布的课程'); return false }

      const numericId = /^\d+$/.test(id) ? id : null
      if (numericId) { try { await updateCourseStatus(id, 0) } catch (err) { console.warn('结束课程 API 失败:', err) } }

      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        courses.value[index] = { ...courses.value[index], status: 'ended', registrationStatus: 'ended', updatedAt: now() }
    
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

  const getCourseById = (id: string) => courses.value.find(c => c.id === id)

  const fetchCourseDetail = async (id: string): Promise<Course | null> => {
    try {
      const res: any = await getCourseDetail(id)
      const d: CourseDetail = res.data || res
      if (d) {
        const local = getCourseById(id)
        const hasFlexibleTime = (d as any).course_date || (d as any).courseDate
        return {
          id: String(d.course_id),
          name: d.course_name,
          status: d.status === 1 ? 'published' : 'draft',
          registrationStatus: 'ongoing',
          trainingTargets: local?.trainingTargets || [],
          maxParticipants: d.max_sign || 50,
          currentParticipants: d.sign_count || 0,
          timeType: hasFlexibleTime ? 'flexible' : (local?.timeType || 'fixed'),
          startTime: d.start_time || local?.startTime || '待定',
          endTime: d.end_time || local?.endTime || '待定',
          flexibleTime: local?.flexibleTime,
          trainingLocation: local?.trainingLocation || '待定',
          instructor: local?.instructor || '待定',
          prerequisites: local?.prerequisites || '',
          courseTags: local?.courseTags || [],
          description: d.course_desc || local?.description || '',
          chapters: local?.chapters || [],
          linkedAttendance: local?.linkedAttendance ?? false,
          linkedScore: local?.linkedScore ?? false,
          linkedAnnouncement: local?.linkedAnnouncement ?? false,
          createdAt: d.create_time || '',
          updatedAt: d.create_time || '',
          publishedAt: d.status === 1 ? d.create_time : undefined,
        }
      }
    } catch (error) { console.warn('获取课程详情失败:', error) }
    return getCourseById(id) || null
  }

  const setActiveFilter = (filter: string) => { activeFilter.value = filter; currentPage.value = 1 }
  const setSearchKeyword = (keyword: string) => { searchKeyword.value = keyword; currentPage.value = 1 }
  const setPage = (page: number) => { currentPage.value = page }
  const setPageSize = (size: number) => { pageSize.value = size; currentPage.value = 1 }

  return {
    courses, total, loading, error, useApi,
    activeFilter, searchKeyword, currentPage, pageSize,
    stats, filteredCourses,
    TRAINING_TARGET_OPTIONS, COURSE_TAG_OPTIONS,
    fetchCourses, addCourse, updateCourse, deleteCourse,
    publishCourse, unpublishCourse, endCourse,
    getCourseById, fetchCourseDetail,
    getStatusText, getStatusType, getRegistrationStatusText, getRegistrationStatusType,
    getTrainingTargetsLabel, formatTimeRange,
    loadFromStorage, setActiveFilter, setSearchKeyword, setPage, setPageSize
  }
})
