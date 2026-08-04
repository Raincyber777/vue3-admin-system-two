import request from '@/utils/request'
import type { AxiosResponse } from 'axios'

// 审计日志参数
export interface AuditLogParams {
  offset?: number
  limit?: number
  start_date?: string
  end_date?: string
  action?: string
}

// 审计日志数据
export interface AuditLog {
  id: number
  action: string
  operator: string
  description: string
  ip: string
  created_at: string
  method?: string
  path?: string
  status?: number
  user_id?: number
}

// 获取审计日志列表
export const fetchAuditLogs = (params?: AuditLogParams): Promise<AxiosResponse<{
  code: number
  message?: string
  data: AuditLog[]
}>> => {
  return request.get('/admin/audit-logs', { params })
}
