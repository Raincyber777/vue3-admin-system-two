/**
 * 作业管理 API
 * 对应后端 /api/v1/admin/homework/*
 */
import request from '@/utils/request'

/** 布置作业请求体 */
export interface CreateHomeworkParams {
  courseId: number | string
  homeworkTitle: string
  homeworkContent: string
  questions?: Array<{
    id: string
    type: string
    score: number
    title: string
    answer: string | boolean
    options?: string[]
  }>
  deadline?: string
  /** 班级（一班/二班/三班） */
  groupName?: string
}

/**
 * 布置作业
 * POST /v1/admin/homework/create
 */
export const createHomework = async (data: CreateHomeworkParams) => {
  return request.post('/v1/admin/homework/create', data)
}

/**
 * 编辑作业
 * PUT /v1/admin/homework/update/{homeworkId}
 */
export const updateHomeworkApi = async (homeworkId: number | string, data: CreateHomeworkParams) => {
  return request.put(`/v1/admin/homework/update/${homeworkId}`, data)
}

/**
 * 删除作业
 * DELETE /v1/admin/homework/delete/{homeworkId}
 */
export const deleteHomeworkApi = async (homeworkId: number | string) => {
  return request.delete(`/v1/admin/homework/delete/${homeworkId}`)
}

/** 作业列表查询参数 */
export interface HomeworkListParams {
  page?: number
  size?: number
  courseId?: number | string
}

/** 后端作业项 */
export interface ApiHomeworkItem {
  homework_id: number
  course_id: number
  course_name: string
  homework_title: string
  deadline: string
  submit_count: number
  create_time: string
  groupName?: string
  group_name?: string
}

/** 作业列表响应 */
export interface HomeworkListRes {
  total: number
  list: ApiHomeworkItem[]
}

/**
 * 获取作业列表
 * GET /v1/admin/homework/list
 */
export const getHomeworkList = async (params?: HomeworkListParams): Promise<HomeworkListRes> => {
  return request.get('/v1/admin/homework/list', { params })
}

/** 作业详情（后端实际返回字段） */
export interface HomeworkDetail {
  homeworkId: number
  courseId: number
  courseName: string
  homeworkTitle: string
  homeworkContent: string
  questions: Array<{
    id: string
    type: string
    score: number
    title: string
    answer: string | boolean
    options?: string[]
  }>
  groupName: string
  deadline: string
  submitCount: number
  createTime: string
}

/**
 * 获取单个作业详情
 * GET /v1/admin/homework/detail/{homeworkId}
 */
export const getHomeworkDetail = async (homeworkId: number | string): Promise<HomeworkDetail> => {
  return request.get(`/v1/admin/homework/detail/${homeworkId}`)
}

/** 提交列表查询参数 */
export interface SubmitListParams {
  page?: number
  size?: number
  homeworkId?: number | string
  courseId?: number | string
  groupName?: string
}

/** 后端提交项 */
export interface ApiSubmitItem {
  submit_id: number
  user_id: number
  real_name: string
  homework_id: number
  homework_title: string
  course_name: string
  group_name?: string
  groupName?: string
  submit_time: string
  score: number | null
  status_text: string
}

/** 提交列表响应 */
export interface SubmitListRes {
  total: number
  list: ApiSubmitItem[]
}

/**
 * 获取学员提交列表
 * GET /v1/admin/homework/submit/list
 */
export const getSubmitList = async (params?: SubmitListParams): Promise<SubmitListRes> => {
  return request.get('/v1/admin/homework/submit/list', { params })
}

/** 提交详情（后端实际响应字段，以 camelCase 为主，同时也兼容 snake_case） */
export interface SubmitDetail {
  submitId?: number
  submit_id?: number
  userId?: number
  user_id?: number
  userName?: string
  user_real_name?: string
  userPhone?: string
  user_phone?: string
  homeworkId?: number
  homework_id?: number
  homeworkTitle?: string
  homework_title?: string
  courseName?: string
  course_name?: string
  submitContent?: string
  submit_content?: string
  submitFile?: string
  submit_file?: string
  submitTime?: string
  submit_time?: string
  score?: number | null
  remark?: string | null
  className?: string
  class_name?: string
  studentNo?: string
  student_no?: string
  studentId?: string
  student_id?: string
}

/**
 * 获取提交详情
 * GET /v1/admin/homework/submit/detail/{submitId}
 */
export const getSubmitDetail = async (submitId: number): Promise<SubmitDetail> => {
  return request.get(`/v1/admin/homework/submit/detail/${submitId}`)
}

/** 删除作业提交参数 */
export interface DeleteSubmitParams {
  submitId?: number
  submitIds?: number[]
}

/**
 * 删除作业提交（单个）
 * DELETE /v1/admin/homework/submit/delete
 */
export const deleteSubmit = async (submitId: number) => {
  return request.delete('/v1/admin/homework/submit/delete', { params: { submitId } })
}

/**
 * 批量删除作业提交
 * DELETE /v1/admin/homework/submit/delete
 */
export const batchDeleteSubmit = async (submitIds: number[]) => {
  return request.delete('/v1/admin/homework/submit/delete', { data: { submitIds } })
}

/** 评分请求体 */
export interface ScoreSubmitParams {
  /** 总分 */
  score: number
  /** 评语 */
  remark?: string
}

/**
 * 提交作业评分
 * POST /v1/admin/homework/submit/score/{submitId}
 */
export const submitScore = async (submitId: number, data: ScoreSubmitParams) => {
  return request.post(`/v1/admin/homework/submit/score/${submitId}`, data)
}
