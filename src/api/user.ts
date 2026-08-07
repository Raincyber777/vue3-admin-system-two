/**
 * 用户管理 API
 * 对应后端 /api/v1/admin/user/*
 */
import request from '@/utils/request'

/** 用户列表查询参数 */
export interface UserListParams {
  page?: number
  size?: number
  search?: string
  department?: string
  className?: string
}

/** 后端用户项 */
export interface ApiUserItem {
  user_id: number
  username: string
  real_name: string
  email: string
  role: string
  status: string
  student_no: string
  phone: string
  department: string
  class_name: string
  create_time: string
}

/** 用户列表响应 */
export interface UserListRes {
  total: number
  list: ApiUserItem[]
}

/**
 * 获取用户列表
 * GET /v1/admin/user/list
 */
export const getUserList = async (params?: UserListParams): Promise<UserListRes> => {
  return request.get('/v1/admin/user/list', { params })
}

/** 用户详情（后端返回） */
export interface ApiUserDetail {
  user_id: number
  username: string
  real_name: string
  email: string
  role: string
  status: string
  student_no: string
  phone: string
  department: string
  class_name: string
  create_time: string
  updated_at?: string
}

/**
 * 获取用户详情
 * GET /v1/admin/user/detail/{userId}
 */
export const getUserDetail = async (userId: number): Promise<ApiUserDetail | null> => {
  try {
    return await request.get(`/v1/admin/user/detail/${userId}`)
  } catch {
    // 降级：尝试 info 端点
    try {
      return await request.get(`/v1/admin/user/info/${userId}`)
    } catch {
      // 再降级：用 list 接口按 userId 过滤
      const res: any = await request.get('/v1/admin/user/list', { params: { userId } })
      const list = res.data?.list || res.list || res.data?.records || []
      return list.length > 0 ? list[0] : null
    }
  }
}

/**
 * 启用/禁用用户
 * PUT /v1/admin/user/status/{userId}
 * @param userId 用户ID
 * @param status 'active' | 'disabled'
 */
export const updateUserStatus = async (userId: number, status: 'active' | 'disabled') => {
  // 后端期望数字状态: 1=启用, 0=禁用
  return request.put(`/v1/admin/user/status/${userId}`, { status: status === 'active' ? 1 : 0 })
}

/**
 * 删除单个用户
 * DELETE /v1/admin/user/delete
 */
export const deleteUserApi = async (userId: number) => {
  return request.delete('/v1/admin/user/delete', { params: { userId } })
}

/**
 * 批量删除用户
 * DELETE /v1/admin/user/delete
 */
export const batchDeleteUsersApi = async (userIds: number[]) => {
  return request.delete('/v1/admin/user/delete', { data: { userIds } })
}

/** 创建用户请求体（与后端实际接受的字段一致，驼峰命名） */
export interface CreateUserParams {
  username: string
  realName: string
  phone?: string
  email: string
  role?: string
  grade?: string
  major?: string
  college?: string
  studentId?: string
  labId?: string
  lab_id?: string
}

/**
 * 创建学员账号
 * POST /v1/admin/user/create
 */
export const createUser = async (data: CreateUserParams) => {
  return request.post('/v1/admin/user/create', data)
}
