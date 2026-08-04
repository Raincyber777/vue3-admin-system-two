/**
 * 课程管理 API
 * 对应后端 /api/v1/admin/course/*
 */
import request from '@/utils/request'

/** 创建课程请求体 */
export interface CreateCourseParams {
  courseName: string
  courseDesc?: string
  coverImg?: string
  startTime?: string
  endTime?: string
  maxSign?: number
  className?: string
  department?: string
  instructor?: string
  trainingLocation?: string
  /** 时间类型：fixed=起始时间，flexible=弹性时间 */
  timeType?: 'fixed' | 'flexible'
  /** 弹性时间配置 */
  flexibleTime?: {
    startDate: string
    endDate: string
    weekdays: number[]
    startTime: string
    endTime: string
  }
  /** 弹性时间的文本描述，如 "2026年8月-9月 每周一三五" */
  courseDate?: string
}

/** 上传封面响应 */
export interface UploadCoverRes {
  url: string
}

/**
 * 创建课程
 * POST /v1/admin/course/create
 */
export const createCourse = async (data: CreateCourseParams) => {
  return request.post('/v1/admin/course/create', data)
}

/**
 * 编辑课程
 * PUT /v1/admin/course/update/{courseId}
 */
export const updateCourseApi = async (courseId: number | string, data: CreateCourseParams) => {
  return request.put(`/v1/admin/course/update/${courseId}`, data)
}

/**
 * 删除课程
 * DELETE /v1/admin/course/delete/{courseId}
 */
export const deleteCourseApi = async (courseId: number | string) => {
  return request.delete(`/v1/admin/course/delete/${courseId}`)
}

/** 课程列表查询参数 */
export interface CourseListParams {
  page?: number
  size?: number
  courseName?: string
  status?: number
}

/** 课程列表项（后端返回） */
export interface ApiCourseItem {
  course_id: number
  course_name: string
  course_desc?: string
  cover_img?: string
  start_time?: string
  end_time?: string
  max_sign?: number
  status: number
  sign_count?: number
  create_time?: string
  /** 弹性时间描述文本，如 "2026年8月-9月 每周一三五" */
  course_date?: string
  courseDate?: string
  /** 上课地点 */
  location?: string
  /** 主讲人 */
  instructor?: string
  /** 班级 */
  class_name?: string
  className?: string
}

/** 课程列表响应 */
export interface CourseListRes {
  total: number
  list: ApiCourseItem[]
}

/**
 * 获取课程列表
 * GET /v1/admin/course/list
 */
export const getCourseList = async (params?: CourseListParams): Promise<CourseListRes> => {
  return request.get('/v1/admin/course/list', { params })
}

/** 课程详情（后端返回完整字段） */
export interface CourseDetail {
  course_id: number
  course_name: string
  course_desc: string
  cover_img: string
  start_time: string
  end_time: string
  max_sign: number
  status: number
  sign_count: number
  homework_count: number
  create_time: string
}

/**
 * 获取课程详情
 * GET /v1/admin/course/detail/{courseId}
 */
export const getCourseDetail = async (courseId: number | string): Promise<CourseDetail> => {
  return request.get(`/v1/admin/course/detail/${courseId}`)
}

/**
 * 上下架课程
 * PUT /v1/admin/course/status/{courseId}
 * @param status 1=上架(发布) 0=下架(变草稿)
 */
export const updateCourseStatus = async (courseId: number | string, status: number) => {
  return request.put(`/v1/admin/course/status/${courseId}`, { status })
}

/**
 * 上传课程封面图片
 * POST /v1/admin/course/upload_cover
 */
export const uploadCover = async (file: File): Promise<UploadCoverRes> => {
  const formData = new FormData()
  formData.append('cover', file)
  return request.post('/v1/admin/course/upload_cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
