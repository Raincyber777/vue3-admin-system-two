//  未对接：发送面试通知 批量发送面试通知 通知记录查询 面试通知列表/发布

import request from '@/utils/request'

// ==================== 部门管理 ====================
export interface DepartmentItem {
  id: number
  name: string
  parent_id?: number | null
  code?: string
}

export interface DepartmentListRes {
  code: number
  message?: string
  data: DepartmentItem[]
}

/**
 * 获取部门列表
 * GET /api/admin/departments
 */
export const getDepartmentList = (): Promise<DepartmentListRes> => {
  return request.get('/admin/departments')
}

// ==================== 用户管理 ====================


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
  code: number
  message?: string
  data: {
    list?: UserItem[]
    items?: UserItem[]
    total?: number
  } | UserItem[]
}

/**
 * 获取用户列表
 * GET /api/admin/users
 * @param params - 可选筛选参数
 */
export const getUserList = (params?: {
  page?: number
  per_page?: number
  keyword?: string
}): Promise<UserListRes> => {
  return request.get('/admin/users', { params })
}

// ==================== 培训报名通过名单 ====================

/**
 * 报名通过项
 */
export interface PassListItem {
  id: number
  user_id: number
  user_name?: string
  name?: string
  student_id?: string
  studentNo?: string
  department_id?: number
  department?: string
  course_id?: number
  course_title?: string
  approved_at?: string
  created_at?: string
}

export interface PassListRes {
  code: number
  message?: string
  data: PassListItem[]
}

/**
 * 获取培训报名通过名单
 * GET /api/admin/training/course-enrollments/pass-list
 */
export const getPassList = (params?: {
  department?: string
  course_id?: number
}): Promise<PassListRes> => {
  return request.get('/admin/training/course-enrollments/pass-list', { params })
}

// ==================== 数据适配工具 ====================

/**
 * 将后端返回的部门数据转换为前端展示格式
 * @param dept 后端部门项
 * @param index 序号（兜底使用）
 */
export const formatDepartment = (
  dept: DepartmentItem,
  index = 0
): { label: string; value: string } => {
  return {
    label: dept.name || `部门${dept.id}`,
    value: String(dept.id ?? index)
  }
}

/**
 * 将后端返回的报名通过名单转换为前端学生格式
 */
export const formatPassListToStudent = (
  item: PassListItem
): {
  id: number
  name: string
  studentNo: string
  department: string
  departmentId: number | null
  notified: boolean
  notifyRecords: any[]
  courseId?: number
  courseTitle?: string
} => {
  return {
    id: item.user_id || item.id,
    name: item.user_name || item.name || '--',
    studentNo: item.student_id || item.studentNo || '--',
    department: item.department || '',
    departmentId: item.department_id ?? null,
    notified: false,
    notifyRecords: [],
    courseId: item.course_id,
    courseTitle: item.course_title
  }
}

/**
 * 将后端返回的用户列表转换为前端学生格式（备选方案）
 */
export const formatUserToStudent = (
  user: UserItem
): {
  id: number
  name: string
  studentNo: string
  department: string
  departmentId: number | null
  notified: boolean
  notifyRecords: any[]
} => {
  return {
    id: user.id,
    name: user.name || user.username || user.account || '--',
    studentNo: user.student_id || user.account || '--',
    department: user.department || '',
    departmentId: user.department_id ?? null,
    notified: false,
    notifyRecords: []
  }
}
