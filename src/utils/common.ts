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

/**
 * 班级名称转换：中文数字 ↔ 阿拉伯数字
 * 后端返回格式：一班、二班、三班
 * 前端使用格式：1班、2班、3班
 */
const CN_NUM_MAP: Record<string, string> = {
  '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
  '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
}

const ARABIC_TO_CN: Record<string, string> = {
  '1': '一', '2': '二', '3': '三', '4': '四', '5': '五',
  '6': '六', '7': '七', '8': '八', '9': '九', '10': '十',
}

/** 从后端返回的groups字段中提取班级名（保留中文数字格式）
 *  支持多种格式：
 *  - "一班" -> "一班"
 *  - "一班、二班" -> "二班"  (提取最后一个班级)
 *  - "一班、二班、三班" -> "三班"  (提取最后一个班级)
 */
export const extractClassName = (className: string): string => {
  if (!className) return ''

  // 如果包含分隔符（顿号、逗号），说明是多个班级，提取最后一个
  const separators = ['、', ',', '，', '；', ';']
  let lastClass = className
  for (const sep of separators) {
    if (className.includes(sep)) {
      const parts = className.split(sep).filter(p => p.trim())
      lastClass = parts[parts.length - 1].trim()
      break
    }
  }

  // 匹配 "一班"、"二班" 等格式，直接返回（保留中文数字）
  const match = lastClass.match(/([一二三四五六七八九十]+)(班|组|级)/)
  if (match) {
    return lastClass
  }

  // 匹配 "1班"、"2班" 等格式，转换为中文数字
  const arabicMatch = lastClass.match(/(\d+)(班|组|级)/)
  if (arabicMatch) {
    const arabicNum = arabicMatch[1]
    const suffix = arabicMatch[2]
    const cnNum = ARABIC_TO_CN[arabicNum] || arabicNum
    return `${cnNum}${suffix}`
  }

  return className
}

/** 将中文数字班级名转为阿拉伯数字 (一班 -> 1班)
 *  支持多种格式：
 *  - "一班" -> "1班"
 *  - "一班、二班" -> "2班"  (提取最后一个班级)
 *  - "一班、二班、三班" -> "3班"  (提取最后一个班级)
 */
export const cnClassToArabic = (className: string): string => {
  if (!className) return ''

  // 如果包含分隔符（顿号、逗号），说明是多个班级，提取最后一个
  const separators = ['、', ',', '，', '；', ';']
  let lastClass = className
  for (const sep of separators) {
    if (className.includes(sep)) {
      const parts = className.split(sep).filter(p => p.trim())
      lastClass = parts[parts.length - 1].trim()
      break
    }
  }

  // 匹配 "一班"、"二班" 等格式
  const match = lastClass.match(/([一二三四五六七八九十]+)(班|组|级)/)
  if (match) {
    const cnNum = match[1]
    const suffix = match[2]
    const arabicNum = CN_NUM_MAP[cnNum] || cnNum
    return `${arabicNum}${suffix}`
  }
  return className
}

/** 将阿拉伯数字班级名转为中文数字 (1班 -> 一班) */
export const arabicClassToCn = (className: string): string => {
  if (!className) return ''
  // 匹配 "1班"、"2班" 等格式
  const match = className.match(/^(\d+)(班|组|级)$/)
  if (match) {
    const arabicNum = match[1]
    const suffix = match[2]
    const cnNum = ARABIC_TO_CN[arabicNum] || arabicNum
    return `${cnNum}${suffix}`
  }
  return className
}

/** 将班级名转为数字 (1班 -> 1, 一班 -> 1) */
export const classToCount = (className: string): number | undefined => {
  if (!className) return undefined
  // 匹配 "1班"、"2班" 等阿拉伯数字格式
  const arabicMatch = className.match(/^(\d+)(班|组|级)$/)
  if (arabicMatch) return parseInt(arabicMatch[1])
  // 匹配 "一班"、"二班" 等中文数字格式
  const cnMatch = className.match(/^([一二三四五六七八九十]+)(班|组|级)$/)
  if (cnMatch) {
    const cnNum = cnMatch[1]
    const arabicNum = CN_NUM_MAP[cnNum]
    return arabicNum ? parseInt(arabicNum) : undefined
  }
  return undefined
}
