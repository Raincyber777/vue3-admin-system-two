/**
 * 报名管理 API
 * 对应后端 /api/v1/admin/sign/*
 */
import request from '@/utils/request'

/** 报名列表查询参数 */
export interface SignListParams {
  page?: number
  size?: number
  courseId?: number | string
}

/** 报名记录（后端返回） */
export interface SignItem {
  sign_id: number
  user_id: number
  real_name: string
  student_id: string
  college: string
  major: string
  course_id: number
  course_name: string
  sign_info: string
  status: number
  sign_time: string
}

/** 报名列表响应 */
export interface SignListRes {
  total: number
  list: SignItem[]
}

/**
 * 获取报名列表
 * GET /v1/admin/sign/list
 */
export const getSignList = async (params?: SignListParams): Promise<SignListRes> => {
  return request.get('/v1/admin/sign/list', { params })
}

/** 报名详情（后端返回） */
export interface SignDetail {
  sign_id: number
  user_real_name: string
  user_phone: string
  user_email: string
  student_id: string
  college: string
  major: string
  class_name?: string
  department?: string
  course_name: string
  sign_info: string
  status: number
  sign_time: string
}

/**
 * 获取报名详情
 * GET /v1/admin/sign/detail/{signId}
 */
export const getSignDetail = async (signId: number): Promise<SignDetail> => {
  return request.get(`/v1/admin/sign/detail/${signId}`)
}


/**
 * 审核通过
 * PUT /v1/admin/sign/approve/{id}
 */
export const approveSign = async (signId: number): Promise<void> => {
  return request.put(`/v1/admin/sign/approve/${signId}`, {})
}

/**
 * 审核驳回
 * PUT /v1/admin/sign/reject/{id}
 */
export const rejectSign = async (signId: number): Promise<void> => {
  return request.put(`/v1/admin/sign/reject/${signId}`, {})
}

/**
 * 导出报名表（返回 Excel 文件流）
 * GET /v1/admin/sign/export
 */
export const exportSignList = async (params?: { courseId?: string }): Promise<Blob> => {
  const response = await request.post('/v1/admin/sign/export', params || {}, {
    responseType: 'blob',
  })
  return response as unknown as Blob
}

/** 报名开关状态（后端返回） */
export interface SignSwitchStatus {
  enabled: boolean
  /** 报名开启时间等额外信息 */
  start_time?: string
  end_time?: string
}

/**
 * 查询报名开关状态
 * GET /v1/admin/sign_switch/get
 */
export const getSignSwitch = async (): Promise<SignSwitchStatus> => {
  return request.get('/v1/admin/sign_switch/get')
}

/**
 * 修改报名开关状态
 * PUT /v1/admin/sign_switch/update
 */
export const updateSignSwitch = async (enabled: boolean): Promise<void> => {
  return request.put('/v1/admin/sign_switch/update', { value: enabled ? 1 : 0 })
}

/**
 * 前台查询报名开关状态
 * GET /v1/admin/sign_switch/front/get
 */
export const getFrontSignSwitch = async (): Promise<SignSwitchStatus> => {
  return request.get('/v1/admin/sign_switch/front/get')
}

/**
 * 导入报名名单（Excel）
 * POST /v1/admin/sign/import
 */
export const importSignList = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/v1/admin/sign/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
