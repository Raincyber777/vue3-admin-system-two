/**
 * 通用工具函数
 * 用于简化各个 store 中的重复逻辑
 */

/** 将 ISO 时间字符串转为可读格式 "YYYY-MM-DD HH:mm:ss" */
export const formatTime = (iso: string): string => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch {
    return iso
  }
}

/**
 * 从对象中按优先级取多个可能的字段值
 * 例如 pick(item, 'studentNo', 'student_no', 'sno') 会依次尝试这些字段
 */
export const pick = (obj: any, ...keys: string[]): any => {
  for (const key of keys) {
    const val = obj?.[key]
    if (val !== undefined && val !== null && val !== '') return val
  }
  return undefined
}

/**
 * 安全读取 localStorage
 */
export const readStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

/**
 * 安全写入 localStorage
 */
export const writeStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

/**
 * 通用的已删除 ID 管理
 */
export const createDeletedIdsManager = (storageKey: string) => ({
  get(): Set<number> {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  },
  add(id: number): void {
    const ids = this.get()
    ids.add(id)
    writeStorage(storageKey, [...ids])
  },
  addMany(ids: number[]): void {
    const set = this.get()
    ids.forEach(id => set.add(id))
    writeStorage(storageKey, [...set])
  },
  has(id: number): boolean {
    return this.get().has(id)
  },
})

/**
 * 解析 API 列表响应，兼容多种响应结构
 * 支持: {list: [...]}, {records: [...]}, {data: [...]}, {data: {list: [...]}}, {data: {records: [...]}}
 */
export const parseListResponse = (res: any): any[] => {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (res.data) {
    const d = res.data
    if (Array.isArray(d)) return d
    return d.list || d.records || d.items || []
  }
  if (res.list) return res.list
  if (res.records) return res.records
  return []
}

/**
 * 解析 API 详情响应
 * 支持: {data: {...}}, {...}
 */
export const parseDetailResponse = (res: any): any => {
  if (!res) return null
  if (res.data) return res.data
  return res
}

/**
 * 生成临时 ID（基于时间戳）
 */
export const generateTempId = (): number => Date.now()

/**
 * 获取当前时间的本地化字符串
 */
export const now = (): string => new Date().toLocaleString('zh-CN')

/**
 * 将对象转为查询参数（过滤 undefined/null）
 */
export const toQueryParams = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value
    }
  }
  return result
}
