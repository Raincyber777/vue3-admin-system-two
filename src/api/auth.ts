import request from '@/utils/request'
import type { AxiosResponse } from 'axios'

// 登录参数
export interface LoginParams {
  adminName: string
  password: string
}

// 用户信息
export interface UserInfo {
  id?: number
  account?: string
  name?: string
  email?: string
  avatar?: string
  phone?: string
  role?: string
  student_id?: string
  college?: string
  major?: string
  class_name?: string
  // 多实验室支持
  labId?: number | string
  labName?: string
  lab_id?: number | string
  lab_name?: string
  // 权限控制
  roles?: string[]
  permissions?: string[]
  menus?: string[]
}

// 登录响应数据
export interface LoginResponseData {
  token: string
  refresh_token?: string
  user?: UserInfo
  user_info?: UserInfo
}

// 修改密码参数
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

// 用户登录
export const login = (data: LoginParams): Promise<AxiosResponse<{ code: number; message?: string; data: LoginResponseData }>> => {
  return request.post('/v1/admin/auth/login', data)
}

// 获取用户信息
export const getUserProfile = (): Promise<AxiosResponse<{ code: number; data: UserInfo }>> => {
  return request.get('/v1/admin/auth/info')
}

// 修改密码
export const changePassword = (data: ChangePasswordParams) => {
  return request.post('/v1/admin/auth/update_pwd', {
    oldPwd: data.oldPassword,
    newPwd: data.newPassword,
  })
}

// 发送验证码（管理员找回密码）
export const sendCode = (email: string) => {
  return request.post('/v1/admin/auth/send_code', { email, adminEmail: email })
}

// 重置密码参数
export interface ResetPasswordParams {
  email: string
  code: string
  new_password: string
}

// 重置密码（JSON 格式，兼容 camelCase / snake_case）
export const resetPassword = (data: ResetPasswordParams) => {
  return request.post('/v1/admin/auth/reset_pwd', {
    email: data.email,
    code: data.code,
    newPassword: data.new_password,
    new_password: data.new_password,
  })
}

// 用户登出
export const logout = () => {
  const refreshToken = localStorage.getItem('refreshToken')
  const headers: Record<string, string> = {}
  if (refreshToken) {
    headers['refresh-token'] = refreshToken
  }
  return request.post('/v1/admin/auth/logout', undefined, { headers })
}
