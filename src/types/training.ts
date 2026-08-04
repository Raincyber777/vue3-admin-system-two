/**
 * 培训模块 TypeScript 类型定义
 * 对应后端 API 接口规范
 */

// ==================== 通用类型 ====================

/** 分页响应基础结构 */
export interface PaginationRes {
  total: number
  page: number
  page_size: number
}

/** 分页请求参数 */
export interface PaginationParams {
  page?: number
  per_page?: number
}

// ==================== 接口1：培训统计 ====================

/** 培训统计响应数据类型 */
export interface TrainingStatisticsRes {
  total_courses: number // 课程总数
  completed_courses: number // 已完成课程数量
  in_progress_courses: number // 进行中课程数量
  total_learning_hours: number // 总学习时长（浮点）
  total_assignments: number // 总作业数
  completed_assignments: number // 已完成作业数
  pending_assignments: number // 待完成作业数
  average_score: number | null // 平均分，可为null
}

// ==================== 接口2：课程列表 ====================

/** 课程项数据类型 */
export interface CourseItem {
  id: number
  title: string // 课程名称
  description: string // 课程简介
  cover_image: string // 课程封面图，空字符串代表无图
  instructor_name: string // 讲师名称
  status: string // 课程状态，例：published
  start_date: string | null // 开课时间，空为null
  end_date: string | null // 结课时间，空为null
  duration_hours: number // 课程总学时
  enrolled_count: number // 已报名人数
  enrolled_at: string // 用户报名时间（ISO时间格式）
}

/** 课程列表响应数据类型 */
export interface CourseListRes extends PaginationRes {
  items: CourseItem[]
}

/** 课程列表查询参数 */
export interface CourseListParams extends PaginationParams {
  status?: string // 课程状态筛选，可选不传
}

// ==================== 接口3：课程详情 ====================

/** 课程详情响应数据类型（沿用之前定义，可扩展） */
export interface CourseDetail {
  id: number
  title: string
  description: string
  cover_image: string
  instructor_name: string
  status: string
  start_date: string | null
  end_date: string | null
  duration_hours: number
  enrolled_count: number
  enrolled_at: string
  // 可扩展更多字段...
}

// ==================== 接口4：培训通知 ====================

/** 通知项数据类型 */
export interface NotificationItem {
  id: number // 通知ID
  course_id: number // 关联课程ID
  course_title: string // 关联课程名称
  title: string // 通知标题
  content: string // 通知详情
  priority: string // 通知优先级（例：normal）
  is_published: boolean // 是否发布
  published_at: string | null // 发布时间，无则null
  created_at: string // 通知创建时间（ISO格式）
}

/** 通知列表响应数据类型 */
export interface NotificationListRes extends PaginationRes {
  items: NotificationItem[]
}

/** 通知列表查询参数 */
export interface NotificationListParams extends PaginationParams {}

// ==================== 前端本地存储类型（兼容原有逻辑） ====================

/** 课程状态枚举 */
export type CourseStatus = 'draft' | 'pending' | 'published' | 'ended'

/** 报名状态枚举 */
export type RegistrationStatus = 'not_started' | 'ongoing' | 'ended'

/** 课程章节 */
export interface CourseChapter {
  id: string
  order: number
  name: string
  date: string
}

/** 课程完整数据类型（前端本地存储用） */
export interface Course {
  id: string
  name: string
  status: CourseStatus
  registrationStatus: RegistrationStatus
  trainingTargets: string[]
  maxParticipants: number
  currentParticipants: number
  startTime: string
  endTime: string
  trainingLocation: string
  instructor: string
  prerequisites: string
  courseTags: string[]
  description: string
  chapters: CourseChapter[]
  linkedAttendance: boolean
  linkedScore: boolean
  linkedAnnouncement: boolean
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

// ==================== 管理员端课程管理 API 类型 ====================

/** 管理员 - 课程列表查询参数 */
export interface AdminCourseListParams extends PaginationParams {
  keyword?: string // 搜索关键词
  status?: CourseStatus // 课程状态筛选
}

/** 管理员 - 课程项数据类型 */
export interface AdminCourseItem {
  id: number
  name: string
  status: CourseStatus
  registration_status: RegistrationStatus
  training_targets: string[]
  max_participants: number
  current_participants: number
  start_time: string | null
  end_time: string | null
  training_location: string
  instructor: string
  prerequisites: string
  course_tags: string[]
  description: string
  chapters: AdminChapter[]
  linked_attendance: boolean
  linked_score: boolean
  linked_announcement: boolean
  created_at: string
  updated_at: string
  published_at: string | null
}

/** 管理员 - 课程章节 */
export interface AdminChapter {
  id: number
  order: number
  name: string
  date: string
}

/** 管理员 - 课程列表响应 */
export interface AdminCourseListRes extends PaginationRes {
  items: AdminCourseItem[]
  stats: {
    all: number
    draft: number
    pending: number
    published: number
    ended: number
  }
}

/** 管理员 - 创建/更新课程请求体 */
export interface AdminCourseFormData {
  name: string
  status: CourseStatus
  registration_status: RegistrationStatus
  training_targets: string[]
  max_participants: number
  start_time: string | null
  end_time: string | null
  training_location: string
  instructor: string
  prerequisites: string
  course_tags: string[]
  description: string
  chapters: Omit<AdminChapter, 'id'>[]
  linked_attendance: boolean
  linked_score: boolean
  linked_announcement: boolean
}

/** 管理员 - 课程统计响应 */
export interface AdminCourseStatsRes {
  all: number
  draft: number
  pending: number
  published: number
  ended: number
}

// ==================== Admin-Training 新接口类型 ====================

/** 培训报名记录 */
export interface CourseEnrollmentItem {
  id: number
  course_id: number
  course_title: string
  student_id: string
  student_name: string
  /** 报名部门：软件开发实验室 */
  department: string
  /** 学院 */
  college: string
  /** 专业 */
  major: string
  /** 班级 */
  class_name: string
  /** 手机号 */
  phone: string
  /** 自我介绍 */
  self_intro: string
  status: 'pending' | 'approved' | 'rejected'
  enrollment_time: string
  review_time?: string
  review_remark?: string
}

/** 培训报名列表响应 */
export interface CourseEnrollmentListRes {
  items: CourseEnrollmentItem[]
  count: number
}

/** 审核报名请求参数 */
export interface ReviewEnrollmentParams {
  enrollment_id: number
  status: 'approved' | 'rejected'
  remark?: string
}

/** 作业任务 */
export interface TaskItem {
  id: number
  title: string
  description?: string
  course_id: number
  course_title: string
  deadline: string
  created_at: string
  submission_count: number
  graded_count: number
}

/** 作业列表响应 */
export interface TaskListRes {
  items: TaskItem[]
  count: number
}

/** 创建作业请求参数 */
export interface CreateTaskParams {
  title: string
  description?: string
  course_id: number
  deadline: string
}

/** 作业提交记录 */
export interface TaskSubmissionItem {
  id: number
  task_id: number
  student_id: string
  student_name: string
  submitted_at: string
  content?: string
  grade?: number
  graded_at?: string
  graded_by?: string
}

/** 作业提交列表响应 */
export interface TaskSubmissionListRes {
  items: TaskSubmissionItem[]
  count: number
}

/** 培训课程（管理员端完整信息） */
export interface TrainingCourseItem {
  id: number
  title: string
  description: string
  cover_image?: string
  instructor_id?: string
  instructor_name?: string
  status: string
  start_date?: string
  end_date?: string
  duration_hours?: number
  is_published?: boolean
  created_at: string
  enrolled_count?: number
}

/** 培训课程列表响应 */
export interface TrainingCourseListRes {
  items: TrainingCourseItem[]
  count: number
}

/** 创建/更新培训课程请求参数 */
export interface TrainingCourseFormData {
  title: string
  description: string
  instructor_id?: string
  is_published?: boolean
  start_date?: string
  end_date?: string
  duration_hours?: number
}

/** 培训通知 */
export interface TrainingNotificationItem {
  id: number
  title: string
  content: string
  course_id?: string
  course_title?: string
  send_time_type: string
  scheduled_time?: string
  status: string
  created_at: string
  published_at?: string
}

/** 培训通知列表响应 */
export interface TrainingNotificationListRes {
  items: TrainingNotificationItem[]
  count: number
}

/** 创建培训通知请求参数 */
export interface CreateNotificationParams {
  title: string
  content: string
  course_id?: string
  send_time_type?: string
  scheduled_time?: string
}
