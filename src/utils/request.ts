import axios from 'axios'
import { ElMessage } from 'element-plus'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 自动给所有请求加上实验室 ID（数据隔离）
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo)
        const labId = parsed.labId || parsed.lab_id
        if (labId) {
          config.headers['X-Lab-Id'] = String(labId)
          // 同时作为 query 参数兜底
          if (config.method === 'get' || config.method === 'delete') {
            config.params = { ...config.params, labId: String(labId) }
          }
        }
      } catch { /* ignore */ }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 兼容后端 { detail: "..." } 错误格式，转换为统一结构
    if (res.detail && res.code === undefined) {
      res.code = res.status || 400
      res.message = res.detail
    }
    if (res.code !== 200 && res.code !== 0 && res.code !== undefined) {
      // 不弹窗，让调用方自行决定是否提示
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response) {
      const { status } = error.response
      if (status === 401) {
        // 修改密码接口的 401 是"原密码错误"，不要跳登录，交给调用方处理
        const isUpdatePwd = error.config?.url?.includes('/auth/update_pwd')
        if (!isUpdatePwd) {
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          window.location.href = '/login'
        }
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
