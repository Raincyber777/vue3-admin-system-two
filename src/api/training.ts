/**
 * 培训模块 API 接口封装
 * BaseURL: http://121.40.163.49:8001/api
 */

import request from '@/utils/request'
import type {
  // 原有类型
  TrainingStatisticsRes,
  CourseListParams,
  CourseListRes,
  CourseDetail,
  NotificationListParams,
  NotificationListRes,
  AdminCourseListParams,
  AdminCourseListRes,
  AdminCourseFormData,
  AdminCourseStatsRes,
  // Admin-Training 新接口类型
  CourseEnrollmentListRes,
  ReviewEnrollmentParams,
  TaskListRes,
  CreateTaskParams,
  TaskSubmissionListRes,
  TrainingCourseListRes,
  TrainingCourseItem,
  TrainingCourseFormData,
  TrainingNotificationListRes,
  CreateNotificationParams
} from '@/types/training'

// ==================== 接口1：查看培训统计（首页大盘数据） ====================

/**
 * 获取培训统计信息
 * GET /v1/training/statistics
 */
const getTrainingStatistics = async (): Promise<TrainingStatisticsRes> => {
  return request.get('/v1/training/statistics')
}

// ==================== 接口2：获取我的培训课程列表（分页） ====================

/**
 * 获取课程列表（分页）
 * GET /v1/training/courses
 */
const getCourseList = async (params?: CourseListParams): Promise<CourseListRes> => {
  return request.get('/v1/training/courses', {
    params: {
      page: 1,
      per_page: 20,
      ...params
    }
  })
}

// ==================== 接口3：获取课程详情 ====================

/**
 * 获取课程详情
 * GET /v1/training/courses/{course_id}
 */
const getCourseDetail = async (courseId: number): Promise<CourseDetail> => {
  return request.get(`/v1/training/courses/${courseId}`)
}

// ==================== 接口4：获取培训通知列表（分页） ====================

/**
 * 获取培训通知列表（分页）
 * GET /v1/training/notifications
 */
const getNotificationList = async (
  params?: NotificationListParams
): Promise<NotificationListRes> => {
  return request.get('/v1/training/notifications', {
    params: {
      page: 1,
      per_page: 20,
      ...params
    }
  })
}

// ==================== 管理员端课程管理接口 ====================

/**
 * 获取课程列表（管理员端）
 * GET /v1/admin/training/courses
 */
const getAdminCourseList = async (
  params?: AdminCourseListParams
): Promise<AdminCourseListRes> => {
  return request.get('/v1/admin/training/courses', {
    params: {
      page: 1,
      per_page: 10,
      ...params
    }
  })
}

/**
 * 获取课程详情（管理员端）
 * GET /v1/admin/training/courses/{id}
 */
const getAdminCourseDetail = async (id: number) => {
  return request.get(`/v1/admin/training/courses/${id}`)
}

/**
 * 创建课程（管理员端）
 * POST /v1/admin/training/courses
 */
const createAdminCourse = async (data: AdminCourseFormData) => {
  return request.post('/v1/admin/training/courses', data)
}

/**
 * 更新课程（管理员端）
 * PUT /v1/admin/training/courses/{id}
 */
const updateAdminCourse = async (id: number, data: AdminCourseFormData) => {
  return request.put(`/v1/admin/training/courses/${id}`, data)
}

/**
 * 删除课程（管理员端）
 * DELETE /v1/admin/training/courses/{id}
 */
const deleteAdminCourse = async (id: number) => {
  return request.delete(`/v1/admin/training/courses/${id}`)
}

/**
 * 发布课程（管理员端）
 * POST /v1/admin/training/courses/{id}/publish
 */
const publishAdminCourse = async (id: number) => {
  return request.post(`/v1/admin/training/courses/${id}/publish`)
}

/**
 * 下架课程（管理员端）
 * POST /v1/admin/training/courses/{id}/unpublish
 */
const unpublishAdminCourse = async (id: number) => {
  return request.post(`/v1/admin/training/courses/${id}/unpublish`)
}

/**
 * 结束课程（管理员端）
 * POST /v1/admin/training/courses/{id}/end
 */
const endAdminCourse = async (id: number) => {
  return request.post(`/v1/admin/training/courses/${id}/end`)
}

/**
 * 获取课程统计（管理员端）
 * GET /v1/admin/training/courses/stats
 */
const getAdminCourseStats = async (): Promise<AdminCourseStatsRes> => {
  return request.get('/v1/admin/training/courses/stats')
}

// ==================== Admin-Training 新接口 ====================

// --- 培训报名相关接口 ---

/**
 * 获取培训报名列表
 * GET /api/admin/training/course-enrollments
 */
const getCourseEnrollments = async (params?: {
  course_id?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<CourseEnrollmentListRes> => {
  return request.get('/admin/training/course-enrollments', { params })
}

/**
 * 获取培训报名通过名单
 * GET /api/admin/training/course-enrollments/pass-list
 */
const getEnrollmentPassList = async (courseId?: string) => {
  return request.get('/admin/training/course-enrollments/pass-list', {
    params: { course_id: courseId }
  })
}

/**
 * 审核培训报名
 * POST /api/admin/training/course-enrollments/review
 */
const reviewEnrollment = async (data: ReviewEnrollmentParams) => {
  return request.post('/admin/training/course-enrollments/review', data)
}

// --- 作业相关接口 ---

/**
 * 获取作业列表
 * GET /api/admin/tasks
 */
const getTaskList = async (params?: {
  course_id?: string
  limit?: number
  offset?: number
}): Promise<TaskListRes> => {
  return request.get('/admin/tasks', { params })
}

/**
 * 发布作业
 * POST /api/admin/tasks
 */
const createTask = async (data: CreateTaskParams) => {
  return request.post('/admin/tasks', data)
}

/**
 * 获取作业提交列表
 * GET /api/admin/tasks/{task_id}/submissions
 */
const getTaskSubmissions = async (
  taskId: number,
  params?: { limit?: number; offset?: number }
): Promise<TaskSubmissionListRes> => {
  return request.get(`/admin/tasks/${taskId}/submissions`, { params })
}

// --- 培训课程管理接口（新版） ---

/**
 * 获取培训课程列表
 * GET /api/admin/training-courses
 */
const getTrainingCourseList = async (params?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<TrainingCourseListRes> => {
  return request.get('/admin/training-courses', { params })
}

/**
 * 获取培训课程详情
 * GET /api/admin/training-courses/{course_id}
 */
const getTrainingCourseDetail = async (courseId: number): Promise<TrainingCourseItem> => {
  return request.get(`/admin/training-courses/${courseId}`)
}

/**
 * 创建培训课程
 * POST /api/admin/training-courses
 */
const createTrainingCourse = async (data: TrainingCourseFormData) => {
  return request.post('/admin/training-courses', data)
}

/**
 * 更新培训课程
 * PUT /api/admin/training-courses/{course_id}
 */
const updateTrainingCourse = async (courseId: number, data: TrainingCourseFormData) => {
  return request.put(`/admin/training-courses/${courseId}`, data)
}

/**
 * 删除培训课程
 * DELETE /api/admin/training-courses/{course_id}
 */
const deleteTrainingCourse = async (courseId: number) => {
  return request.delete(`/admin/training-courses/${courseId}`)
}

// --- 培训通知接口 ---

/**
 * 获取培训通知列表
 * GET /api/admin/training-notifications
 */
const getTrainingNotificationList = async (params?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<TrainingNotificationListRes> => {
  return request.get('/admin/training-notifications', { params })
}

/**
 * 发布培训通知
 * POST /api/admin/training-notifications
 */
const createTrainingNotification = async (data: CreateNotificationParams) => {
  return request.post('/admin/training-notifications', data)
}

// 统一导出
export {
  getTrainingStatistics,
  getCourseList,
  getCourseDetail,
  getNotificationList,
  // 管理员端
  getAdminCourseList,
  getAdminCourseDetail,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  publishAdminCourse,
  unpublishAdminCourse,
  endAdminCourse,
  getAdminCourseStats,
  // Admin-Training 新接口
  getCourseEnrollments,
  getEnrollmentPassList,
  reviewEnrollment,
  getTaskList,
  createTask,
  getTaskSubmissions,
  getTrainingCourseList,
  getTrainingCourseDetail,
  createTrainingCourse,
  updateTrainingCourse,
  deleteTrainingCourse,
  getTrainingNotificationList,
  createTrainingNotification
}
