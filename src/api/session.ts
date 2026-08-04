/**
 * 课程安排 API
 * 对应后端 /api/v1/admin/session/*
 */
import request from '@/utils/request'

/** 创建课程安排请求体 */
export interface CreateSessionParams {
  courseId: number
  title: string
  sessionDate: string
  startTime: string
  endTime: string
  location?: string
  instructor?: string
  description?: string
}

/** 后端课程安排项 */
export interface ApiSessionItem {
  session_id: number
  course_id: number
  session_name: string
  session_date: string
  start_time: string
  end_time: string
  location: string
  instructor: string
  description: string
  create_time: string
}

/** 课程安排列表响应 */
export interface SessionListRes {
  total: number
  list: ApiSessionItem[]
}

/** 课程安排列表查询参数 */
export interface SessionListParams {
  page?: number
  size?: number
  courseId?: number | string
}

/**
 * 获取课程安排列表
 * GET /v1/admin/session/list
 */
export const getSessionList = async (params?: SessionListParams): Promise<SessionListRes> => {
  // 同时发 camelCase 和 snake_case 参数名
  const query: any = {}
  if (params?.courseId) {
    query.courseId = params.courseId
    query.course_id = params.courseId
  }
  if (params?.page) query.page = params.page
  if (params?.size) query.size = params.size
  return request.get('/v1/admin/session/list', { params: query })
}

/**
 * 创建课程安排
 * POST /v1/admin/session/create
 */
export const createSession = async (data: CreateSessionParams) => {
  // 所有字段同时发 camelCase / snake_case / 常见别名
  const body: any = {
    courseId: data.courseId,
    course_id: data.courseId,
    title: data.title,
    sessionName: data.title,
    session_name: data.title,
    sessionDate: data.sessionDate,
    session_date: data.sessionDate,
    startTime: data.startTime,
    start_time: data.startTime,
    endTime: data.endTime,
    end_time: data.endTime,
  }
  // 可选字段有值才发，避免空字符串导致后端校验问题
  if (data.location) { body.location = data.location }
  if (data.instructor) { body.instructor = data.instructor }
  if (data.description) { body.description = data.description }
  return request.post('/v1/admin/session/create', body)
}
