/**
 * 签到管理 API
 * 对应后端 /api/v1/admin/checkin/*
 */
import request from '@/utils/request'

/** 签到活动项 */
export interface ApiSignInItem {
  checkin_id: number
  course_id: number
  course_name: string
  title: string
  department: string
  class_name: string
  checkin_code: string
  start_time: string
  end_time: string
  status: number           // 0=进行中 1=已结束
  checkin_count: number
  total_count: number
  create_time: string
}

/** 签到列表响应 */
export interface SignInListRes {
  total: number
  list: ApiSignInItem[]
}

/** 签到列表查询参数 */
export interface SignInListParams {
  page?: number
  pageSize?: number
  course_id?: number | string
  status?: number
}

/**
 * 获取签到列表
 * GET /v1/admin/checkin/list
 */
export const getSignInList = async (params?: SignInListParams): Promise<SignInListRes> => {
  return request.get('/v1/admin/checkin/list', { params })
}

/** 创建签到请求体 */
export interface CreateSignInParams {
  courseId: number | string
  title: string
  department: string
  className: string
  endTime: string
}

/**
 * 发起签到
 * POST /v1/admin/checkin/create
 */
export const createSignIn = async (data: CreateSignInParams) => {
  return request.post('/v1/admin/checkin/create', data)
}

/** 签到明细项 */
export interface ApiSignInRecord {
  record_id: number
  checkin_id: number
  user_id: number
  real_name: string
  student_no: string
  department: string
  class_name: string
  checkin_time: string
  status: number        // 0=已签到 1=迟到 2=未签到
  method: string        // scan / manual
}

/** 签到明细响应 */
export interface SignInDetailRes {
  total: number
  list: ApiSignInRecord[]
}

/** 签到明细查询参数 */
export interface SignInDetailParams {
  page?: number
  pageSize?: number
  checkinId?: number | string
  checkin_id?: number | string
  id?: number | string
}

/**
 * 获取签到明细
 * GET /v1/admin/checkin/records
 */
export const getSignInDetail = async (checkinId: number, params?: { page?: number; pageSize?: number }): Promise<SignInDetailRes> => {
  // 同时支持多种参数名，确保后端能接收到
  return request.get('/v1/admin/checkin/records', {
    params: {
      ...params,
      checkinId,
      checkin_id: checkinId,
      id: checkinId,
    }
  })
}

/**
 * 手动签到
 * POST /v1/admin/checkin/manual
 */
export const manualSignIn = async (data: { checkinId: number; studentNo: string }) => {
  return request.put('/v1/admin/checkin/manual', data)
}

/**
 * 结束签到
 * PUT /v1/admin/checkin/close
 */
export const endSignIn = async (checkinId: number) => {
  return request.put('/v1/admin/checkin/close', { checkinId })
}

/**
 * 导出签到名单（Blob）
 * GET /v1/admin/checkin/export
 */
export const exportSignInList = async (checkinId: number): Promise<Blob> => {
  const response = await request.get('/v1/admin/checkin/export', {
    params: { checkinId },
    responseType: 'blob',
  })
  return response as unknown as Blob
}

/**
 * 删除单个签到
 * DELETE /v1/admin/checkin/delete
 */
export const deleteSignIn = async (checkinId: number) => {
  return request.delete('/v1/admin/checkin/delete', { params: { checkinId } })
}

/**
 * 批量删除签到
 */
export const batchDeleteSignIn = async (checkinIds: number[]) => {
  // 逐个删除
  for (const id of checkinIds) {
    await deleteSignIn(id)
  }
}
