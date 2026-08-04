import request from '@/utils/request'

// ==================== 学员表现 ====================

/** 表现列表查询参数 */
export interface PerformanceListParams {
  page?: number
  size?: number
  department?: string
  className?: string
  search?: string
  sort?: 'asc' | 'desc'
}

/** 出勤记录（后端） */
export interface ApiAttendanceRecord {
  course_name: string
  attended: number
  total: number
}

/** 成绩记录（后端） */
export interface ApiScoreRecord {
  title: string
  score: number
  full_score: number
}

/** 后端表现项（与列表接口实际返回字段一致） */
export interface ApiPerformanceItem {
  userId: number
  realName: string
  studentId: string
  courseName?: string
  homeworkCount?: number
  submitCount?: number
  avgScore?: number | null
  submitRate?: string
  // 以下仅详情接口返回
  onTimeRate?: string
  homeworkList?: { title?: string; score?: number; fullScore?: number }[]
}

/** 表现列表响应 */
export interface PerformanceListRes {
  total: number
  list: ApiPerformanceItem[]
}

/**
 * 获取学员表现汇总列表
 * GET /v1/admin/performance/list
 */
export const getPerformanceList = async (params?: PerformanceListParams): Promise<PerformanceListRes> => {
  return request.get('/v1/admin/performance/list', { params })
}

/**
 * 获取学员表现详情
 * GET /v1/admin/performance/detail/{userId}
 */
export const getPerformanceDetail = async (userId: number): Promise<ApiPerformanceItem | null> => {
  // 优先使用独立的 detail 接口
  try {
    return await request.get(`/v1/admin/performance/detail/${userId}`)
  } catch {
    // 降级：复用 list 接口按 userId 过滤
    const res: any = await request.get('/v1/admin/performance/list', { params: { userId } })
    const list = res.data?.list || res.list || res.data?.records || []
    return list.length > 0 ? list[0] : null
  }
}

// ==================== 以下为旧接口（保留兼容） ====================

type AnyParams = Record<string, unknown> | undefined
type AnyFn = (...args: any[]) => any


export interface DepartmentItem {
  id: number
  name: string
  parent_id?: number | null
  code?: string
}

export interface DepartmentListRes {
  code?: number
  message?: string
  data: DepartmentItem[]
}

export interface TrainingCourseItem {
  id: number
  name?: string
  title?: string
  description?: string
  instructor_id?: number | null
  is_published?: boolean
  start_date?: string
  end_date?: string
  duration_hours?: number
}

export interface TrainingCourseListRes {
  code?: number
  message?: string
  data: TrainingCourseItem[]
}

export interface UserItem {
  id: number
  account?: string
  username?: string
  name?: string
  student_id?: string
  email?: string
  phone?: string
  department_id?: number
  department?: string
  is_banned?: boolean
}

export interface UserListRes {
  code?: number
  message?: string
  data: UserItem[] | { list: UserItem[]; items: UserItem[] }
}

export interface PassListItem {
  id: number
  user_id?: number
  user_name?: string
  name?: string
  username?: string
  student_id?: string
  department?: string
  department_id?: number
  course_id?: number
  course_name?: string
  status?: string
  created_at?: string
}

export interface PassListRes {
  code?: number
  message?: string
  data: PassListItem[]
}

/* -------- 1. 部门列表 -------- */
export const getDepartmentList: AnyFn = () => {
  return request.get('/admin/departments')
}

/* -------- 2. 培训课程列表 -------- */
export const getTrainingCourseList: AnyFn = (params?: AnyParams) => {
  return request.get('/admin/training/training-courses', { params })
}

/* -------- 3. 通过名单（学生） -------- */
export const getPassList: AnyFn = (params?: AnyParams) => {
  return request.get('/admin/training/course-enrollments/pass-list', { params })
}

/* -------- 4. 用户列表（兜底） -------- */
export const getUserList: AnyFn = (params?: AnyParams) => {
  return request.get('/admin/users', { params })
}

export const formatPassListToStudent = (item: PassListItem) => {
  return {
    studentId: item.user_id || item.id,
    studentName: item.user_name || item.name || item.username || '',
    studentNo: item.student_id || '',
    department: item.department || (item as any).department_name || '',
    departmentId: item.department_id || null,
    courseId: item.course_id || null,
    courseName: item.course_name || '',
    enrolledAt: item.created_at || ''
  }
}


export const formatUserToStudent = (user: UserItem) => {
  return {
    studentId: user.id,
    studentName: user.name || user.username || user.account || '',
    studentNo: user.student_id || user.account || '',
    department: user.department || '',
    departmentId: user.department_id || null,
    courseId: null,
    courseName: '',
    enrolledAt: ''
  }
}


export const formatTrainingCourse = (item: TrainingCourseItem) => {
  return {
    courseId: item.id,
    courseName: item.name || item.title || '',
    description: item.description || '',
    instructorId: item.instructor_id || null,
    isPublished: !!item.is_published,
    startDate: item.start_date || '',
    endDate: item.end_date || '',
    durationHours: item.duration_hours || 0
  }
}

/** 后端 → 前端 部门选项（el-radio-button 用） */
export const formatDepartment = (item: DepartmentItem, index: number) => {
  // 优先使用 code，没有则用 id 字符串
  const value = item.code || String(item.id)
  return {
    label: item.name,
    value: value
  }
}


export const getDepartmentName = (deptValue: string, departmentList: any[] = []) => {
  if (!deptValue) return '未分配'
  const found = departmentList.find(d => d.value === deptValue || d.label === deptValue)
  if (found) return found.label
  // 兜底：原样返回（可能是后端直接返回的中文名）
  return deptValue
}


export const getDepartmentTagType = (deptValue: string) => {
  const v = String(deptValue || '').toLowerCase()
  if (v === 'software' || v.includes('软件')) return ''
  return 'info'
}

