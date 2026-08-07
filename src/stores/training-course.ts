import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createCourse, updateCourseApi, deleteCourseApi, getCourseList, getCourseDetail, updateCourseStatus, type CourseDetail } from '@/api/course'
import { parseListResponse, extractClassName, cnClassToArabic, classToCount } from '@/utils/common'
import { useAuthStore } from '@/stores/auth'

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
  className?: string  // 存储格式："1班"、"2班"、"3班"（用于表单绑定和提交）
  displayClassName?: string  // 显示格式："一班"、"二班"、"三班"（用于列表显示）
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

export const useTrainingCourseStore = defineStore('trainingCourse', () => {
  const courses = ref<Course[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref('')

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

  /** 将 API 返回的课程项映射为前端 Course（API 字段为驼峰） */
  const mapCourseItem = (item: any): Course => {
    const rawGroups = item.groups || item.groupName || item.group_name || item.className || item.class_name || ''
    const className = cnClassToArabic(rawGroups)
    const displayClassName = extractClassName(rawGroups)

    // 从用户信息中获取当前实验室 ID
    let currentLabId: string | number | undefined
    try {
      const userInfoStr = localStorage.getItem('userInfo')
      if (userInfoStr) {
        const parsed = JSON.parse(userInfoStr)
        currentLabId = parsed.labId || parsed.lab_id
      }
    } catch { /* ignore */ }

    return {
      id: String(item.courseId ?? item.course_id ?? item.id ?? ''),
      name: item.courseName ?? item.course_name ?? '',
      status: (item.status === 1 ? 'published' : 'draft') as CourseStatus,
      registrationStatus: 'ongoing' as RegistrationStatus,
      trainingTargets: [],
      maxParticipants: item.maxSign ?? item.max_sign ?? 50,
      currentParticipants: item.signCount ?? item.sign_count ?? 0,
      timeType: 'fixed' as const,
      startTime: item.startTime ?? item.start_time ?? '待定',
      endTime: item.endTime ?? item.end_time ?? '待定',
      flexibleTime: undefined,
      trainingLocation: item.location ?? '待定',
      instructor: item.instructor ?? '待定',
      className,
      displayClassName,
      prerequisites: '',
      courseTags: [],
      description: item.courseDesc ?? item.course_desc ?? item.description ?? '',
      coverImg: item.coverImg ?? item.cover_img ?? '',
      chapters: [],
      linkedAttendance: false,
      linkedScore: false,
      linkedAnnouncement: false,
      createdAt: item.createTime ?? item.create_time ?? '',
      updatedAt: item.createTime ?? item.create_time ?? '',
      publishedAt: item.status === 1 ? (item.createTime ?? item.create_time) : undefined,
      department: item.department ?? (currentLabId === 'ai' ? 'ai' : 'software'),
    }
  }

  const fetchCourses = async () => {
    loading.value = true
    error.value = ''
    try {
      const authStore = useAuthStore()
      const labId = authStore.currentLabId

      const params: any = { page: 1, size: 100 }
      if (labId) {
        params.lab_id = labId
      }

      const res: any = await getCourseList(params)
      const list = parseListResponse(res)
      courses.value = list.map(mapCourseItem)
      total.value = courses.value.length
    } catch (err: any) {
      console.warn('获取课程列表失败:', err)
      error.value = err.message || '获取课程列表失败'
    } finally {
      loading.value = false
    }
  }

  const addCourse = async (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true
    error.value = ''
    try {
      const authStore = useAuthStore()
      const labId = authStore.currentLabId
      const labName = authStore.currentLabName

      const groupCount = classToCount(data.className || '')
      const payload: any = {
        courseName: data.name,
        courseDesc: data.description,
        coverImg: (data as any).coverImg || undefined,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        maxSign: data.maxParticipants || 50,
        instructor: data.instructor || undefined,
        location: data.trainingLocation || undefined,
        groupCount,
        timeType: data.timeType,
        flexibleTime: data.flexibleTime,
        courseDate: data.timeType === 'flexible' ? formatFlexibleTimeForApi(data.flexibleTime) : undefined,
        status: data.status === 'published' ? 1 : 0,
      }

      if (labId) {
        payload.lab_id = labId
      }
      if (labName) {
        payload.labName = labName
        payload.lab_name = labName
      }
      payload.department = labId === 'ai' ? 'ai' : 'software'

      await createCourse(payload)
      await fetchCourses()

      return true
    } catch (err: any) {
      console.error('❌ 创建课程失败:', err)
      error.value = err.message || '创建课程失败'
      ElMessage.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  const updateCourse = async (id: string, data: Partial<Course>) => {
    loading.value = true
    error.value = ''
    try {
      const groupCount = classToCount(data.className || '')
      await updateCourseApi(id, {
        courseName: data.name,
        courseDesc: data.description,
        coverImg: (data as any).coverImg || undefined,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        maxSign: data.maxParticipants,
        instructor: data.instructor || undefined,
        location: data.trainingLocation || undefined,
        groupCount,
        timeType: data.timeType,
        flexibleTime: data.flexibleTime,
        courseDate: data.timeType === 'flexible' ? formatFlexibleTimeForApi(data.flexibleTime) : undefined,
      })
      // 同步更新本地缓存
      await fetchCourses()
      ElMessage.success('课程已更新')
      return true
    } catch (err: any) {
      console.warn('更新课程失败:', err)
      error.value = err.message || '更新课程失败'
      ElMessage.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteCourse = async (id: string) => {
    loading.value = true
    error.value = ''
    try {
      await deleteCourseApi(id)
      // 从本地缓存删除

      await fetchCourses()
      ElMessage.success('课程已删除')
    } catch (err: any) {
      console.warn('删除课程失败:', err)
      error.value = err.message || '删除失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
    return true
  }

  const publishCourse = async (id: string) => {
    loading.value = true
    error.value = ''
    try {
      await updateCourseStatus(id, 1)
      const c = courses.value.find(c => c.id === id)
      if (c) c.status = 'published'
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
    error.value = ''
    try {
      await updateCourseStatus(id, 0)
      const c = courses.value.find(c => c.id === id)
      if (c) c.status = 'draft'
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
    error.value = ''
    try {
      const course = courses.value.find(c => c.id === id)
      if (!course) return false
      if (course.status !== 'published') { ElMessage.warning('只能结束已发布的课程'); return false }
      await updateCourseStatus(id, 0)
      const c = courses.value.find(c => c.id === id)
      if (c) c.status = 'ended'
      await fetchCourses()
      return true
    } catch (err: any) {
      console.warn('结束课程失败:', err)
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
        const rawGroups = (d as any).groups || (d as any).groupName || (d as any).group_name || (d as any).className || (d as any).class_name || ''
        const className = cnClassToArabic(rawGroups)
        const displayClassName = extractClassName(rawGroups)

        let currentLabId: string | number | undefined
        try {
          const userInfoStr = localStorage.getItem('userInfo')
          if (userInfoStr) {
            const parsed = JSON.parse(userInfoStr)
            currentLabId = parsed.labId || parsed.lab_id
          }
        } catch { /* ignore */ }

        return {
          id: String(d.course_id || (d as any).courseId || ''),
          name: d.course_name || (d as any).courseName || '',
          status: (d.status === 1 ? 'published' : 'draft') as CourseStatus,
          registrationStatus: 'ongoing' as RegistrationStatus,
          trainingTargets: [],
          maxParticipants: d.max_sign || (d as any).maxSign || 50,
          currentParticipants: d.sign_count || (d as any).signCount || 0,
          timeType: 'fixed' as const,
          startTime: d.start_time || (d as any).startTime || '待定',
          endTime: d.end_time || (d as any).endTime || '待定',
          flexibleTime: undefined,
          trainingLocation: (d as any).location || '待定',
          instructor: (d as any).instructor || '待定',
          className,
          displayClassName,
          prerequisites: '',
          courseTags: [],
          description: d.course_desc || (d as any).courseDesc || '',
          coverImg: (d as any).coverImg || '',
          chapters: [],
          linkedAttendance: false, linkedScore: false, linkedAnnouncement: false,
          createdAt: d.create_time || (d as any).createTime || '',
          updatedAt: d.create_time || (d as any).createTime || '',
          publishedAt: d.status === 1 ? (d.create_time || (d as any).createTime) : undefined,
          department: (d as any).department ?? (currentLabId === 'ai' ? 'ai' : 'software'),
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
    courses, total, loading, error,
    activeFilter, searchKeyword, currentPage, pageSize,
    stats, filteredCourses,
    TRAINING_TARGET_OPTIONS, COURSE_TAG_OPTIONS,
    fetchCourses, addCourse, updateCourse, deleteCourse,
    publishCourse, unpublishCourse, endCourse,
    getCourseById, fetchCourseDetail,
    getStatusText, getStatusType, getRegistrationStatusText, getRegistrationStatusType,
    getTrainingTargetsLabel, formatTimeRange,
    setActiveFilter, setSearchKeyword, setPage, setPageSize
  }
})
