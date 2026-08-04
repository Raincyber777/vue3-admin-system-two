import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { getUserList, getUserDetail, updateUserStatus, createUser, deleteUserApi, batchDeleteUsersApi } from '@/api/user'

export interface User {
  id: number
  username: string
  name: string
  email: string
  role: 'admin' | 'normal'
  status: 'active' | 'disabled'
  studentNo: string
  password: string
  phone: string
  department: 'software' | 'ai'
  className: string
  createdAt: string
  updatedAt: string
}

// 默认用户数据（本地假数据）
const defaultUsers: User[] = [
  { id: 1, username: 'admin', name: '管理员', email: 'admin@lab.edu.cn', role: 'admin', status: 'active', studentNo: '-', password: 'Admin@123', phone: '13800000000', department: 'software', className: '-', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 2, username: 'zhangsan', name: '张三', email: 'zhangsan@lab.edu.cn', role: 'normal', status: 'active', studentNo: '20241450101', password: 'abc123456', phone: '13812345678', department: 'software', className: '1班', createdAt: '2024-03-15 10:30:00', updatedAt: '2024-06-20 14:00:00' },
  { id: 3, username: 'lisi', name: '李四', email: 'lisi@lab.edu.cn', role: 'normal', status: 'active', studentNo: '20241450102', password: 'xyz789012', phone: '13998765432', department: 'software', className: '2班', createdAt: '2024-03-20 09:00:00', updatedAt: '2024-05-10 16:30:00' },
  { id: 4, username: 'wangwu', name: '王五', email: 'wangwu@lab.edu.cn', role: 'normal', status: 'disabled', studentNo: '20241450103', password: 'pass11111', phone: '13611223344', department: 'software', className: '3班', createdAt: '2024-04-01 11:00:00', updatedAt: '2024-07-01 08:00:00' },
  { id: 5, username: 'zhaoliu', name: '赵六', email: 'zhaoliu@lab.edu.cn', role: 'normal', status: 'active', studentNo: '20241450104', password: 'pwd222222', phone: '15088997766', department: 'software', className: '1班', createdAt: '2024-04-10 15:20:00', updatedAt: '2024-06-28 10:00:00' },
]

export const useAccountStore = defineStore('account', () => {
  // 规范化用户数据，防止旧数据缺少字段导致 undefined 报错
  const normalizeUser = (u: any): User => ({
    id: u.id ?? 0,
    username: u.username || '',
    name: u.name || u.real_name || u.realName || '',
    email: u.email || '',
    role: u.role === 'admin' ? 'admin' : 'normal',
    status: u.status === 'disabled' ? 'disabled' : 'active',
    studentNo: u.studentNo || u.student_no || u.studentId || u.student_id || '',
    password: u.password || '',
    phone: u.phone || '',
    department: u.department === 'ai' ? 'ai' : 'software',
    className: u.className || u.class_name || u.class || '',
    createdAt: u.createdAt || u.createTime || u.created_at || u.create_time || '',
    updatedAt: u.updatedAt || u.updateTime || u.updated_at || u.update_time || '',
  })

  const storedUsers = localStorage.getItem('adminUsers')
  const rawUsers: any[] = storedUsers ? JSON.parse(storedUsers) : defaultUsers
  const storedUsersArray: User[] = rawUsers.map(normalizeUser)
  storedUsersArray.sort((a: User, b: User) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1
    if (a.role !== 'admin' && b.role === 'admin') return 1
    return a.id - b.id
  })
  const users = ref<User[]>(storedUsersArray)

  const total = computed(() => users.value.length)

  const saveUsers = () => {
    localStorage.setItem('adminUsers', JSON.stringify(users.value))
  }

  /** 将后端用户字段映射为前端 User
   *  后端实际字段：userId, username, realName, studentId, college, major, grade, phone, email, status(1/0), createTime */
  const mapUserItem = (item: any): User => ({
    id: item.userId ?? item.user_id ?? item.id ?? 0,
    username: item.username || item.userName || '',
    name: item.realName || item.real_name || item.name || '',
    email: item.email || '',
    role: (item.role === 'admin' ? 'admin' : 'normal') as 'admin' | 'normal',
    // 后端 status: 1=启用, 0=禁用
    status: (item.status === 'disabled' || item.status === 0 ? 'disabled' : 'active') as 'active' | 'disabled',
    // 后端用 studentId（不是 studentNo）
    studentNo: item.studentId || item.studentNo || item.student_no || item.student_id || '',
    password: '',
    phone: item.phone || item.mobile || '',
    department: (item.department === 'ai' ? 'ai' : 'software') as 'software' | 'ai',
    // 后端不返回 className，用 college/major/grade 替代展示
    className: item.className || item.class_name || item.class || item.grade || '',
    createdAt: item.createTime || item.createdAt || item.create_time || item.created_at || item.registerTime || '',
    updatedAt: item.updateTime || item.updatedAt || item.updated_at || item.update_time || '',
  })

  /** 获取用户列表（API 优先，失败降级本地） */
  async function fetchUsers(params?: {
    academy?: string
    major?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<User[]> {
    // 优先调用后端 API
    try {
      const res: any = await getUserList()
      const data = res.data || res
      const list = data?.list || data?.records || (Array.isArray(data) ? data : [])
      if (list.length > 0) {
        const mapped: User[] = list.map(mapUserItem)
        // 合并：API 数据优先，仅保留本地特有的 password 字段
        const merged = mapped.map((u: User) => {
          const existing = users.value.find(e =>
            e.id === u.id || e.email === u.email || e.username === u.username
          )
          if (existing) {
            return {
              ...u,
              password: existing.password || u.password,
              // API 有值就用 API，否则保留本地
              name: u.name || existing.name,
              className: u.className || existing.className,
              createdAt: u.createdAt || existing.createdAt,
              studentNo: u.studentNo || existing.studentNo,
              phone: u.phone || existing.phone,
            }
          }
          return u
        })
        users.value = merged
        saveUsers()
        return merged
      }
    } catch (error) {
      console.warn('获取用户列表接口失败，使用本地数据:', error)
    }

    // 降级：本地数据筛选
    let data = [...users.value]
    if (params?.search) {
      const keyword = params.search.toLowerCase()
      data = data.filter(u =>
        u.username.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword)
      )
    }
    data.sort((a: User, b: User) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1
      if (a.role !== 'admin' && b.role === 'admin') return 1
      return a.id - b.id
    })
    if (params?.offset !== undefined) {
      const offset = params.offset
      const limit = params.limit ?? data.length
      data = data.slice(offset, offset + limit)
    }
    return data
  }

  /** 获取用户详情（API 优先，失败降级本地查找） */
  async function fetchUserDetail(userId: number): Promise<User | null> {
    try {
      const res: any = await getUserDetail(userId)
      if (!res) throw new Error('empty response')
      const d: any = res.data || res
      // 只要有 id 字段就认为是有效数据
      const hasId = d && (d.userId || d.user_id || d.id)
      if (hasId) {
        return mapUserItem(d)
      }
    } catch (error) {
      console.warn('获取用户详情接口失败，使用本地数据:', error)
    }
    // 降级：本地查找
    return users.value.find(u => u.id === userId) || null
  }

  /** 删除用户（API + 本地） */
  async function deleteUser(id: number): Promise<boolean> {
    try { await deleteUserApi(id) } catch { console.warn('删除用户接口失败') }
    const index = users.value.findIndex(u => u.id === id)
    if (index !== -1) {
      users.value.splice(index, 1)
      saveUsers()
      return true
    }
    return false
  }

  /** 批量删除用户 */
  async function batchDeleteUsers(ids: number[]): Promise<boolean> {
    try { await batchDeleteUsersApi(ids) } catch { console.warn('批量删除用户接口失败') }
    const idSet = new Set(ids)
    users.value = users.value.filter(u => !idSet.has(u.id))
    saveUsers()
    return true
  }

  /** 发送重置密码验证码（模拟） */
  async function sendResetPasswordCode(email: string): Promise<boolean> {
    console.log(`[模拟] 已向 ${email} 发送验证码`)
    return true
  }

  /** 重置用户密码（本地模拟） */
  async function resetPassword(data: { email: string; code: string; newPassword: string }): Promise<boolean> {
    console.log(`[模拟] 已重置 ${data.email} 的密码`)
    return true
  }

  /** 导出用户为 Excel（本地生成） */
  async function exportUsers(): Promise<void> {
    const exportData = users.value.map((u, i) => ({
      '序号': i + 1,
      '姓名': u.name,
      '邮箱': u.email,
      '角色': u.role === 'admin' ? '管理员' : '普通用户',
      '所属部门': '软件开发实验室',
      '班级': u.className,
      '注册时间': u.createdAt,
      '学号': u.studentNo,
      '密码': u.password,
      '电话号码': u.phone,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '用户列表')

    const ts = new Date().toLocaleString('zh-CN').replace(/[/: ]/g, '-')
    XLSX.writeFile(workbook, `用户列表_${ts}.xlsx`)
  }

  /** 下载导入模板（本地生成） */
  function downloadTemplate() {
    const header = [['用户名', '邮箱', '角色', '状态']]
    const ws = XLSX.utils.aoa_to_sheet(header)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '模板')
    XLSX.writeFile(wb, '用户导入模板.xlsx')
  }

  /** 批量导入用户（本地解析 Excel） */
  async function importUsers(file: File): Promise<boolean> {
    try {
      const data = await new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const wb = XLSX.read(e.target?.result, { type: 'array' })
            const ws = wb.Sheets[wb.SheetNames[0]]
            const rows = XLSX.utils.sheet_to_json<any>(ws, { header: 0 })
            resolve(rows)
          } catch (err) { reject(err) }
        }
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })

      const newId = Math.max(...users.value.map(u => u.id), 0) + 1
      const now = new Date().toLocaleString('zh-CN')
      data.forEach((row: any, i: number) => {
        const username = row['用户名'] || row['username'] || `imported_${i}`
        const name = row['姓名'] || row['name'] || username
        const email = row['邮箱'] || row['email'] || `${username}@lab.edu.cn`
        const role = (row['角色'] === '管理员' || row['role'] === 'admin') ? 'admin' as const : 'normal' as const
        const status = (row['状态'] === '已禁用' || row['status'] === 'disabled') ? 'disabled' as const : 'active' as const
        users.value.push({
          id: newId + i, username, name, email, role, status,
          studentNo: row['学号'] || row['studentNo'] || '',
          password: row['密码'] || row['password'] || '123456',
          phone: row['电话'] || row['phone'] || '',
          department: 'software',
          className: row['班级'] || row['className'] || '',
          createdAt: now, updatedAt: now,
        })
      })
      saveUsers()
      return true
    } catch (error) {
      console.error('导入用户失败:', error)
      return false
    }
  }

  /** 添加用户（API 优先，失败降级本地） */
  async function addUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toLocaleString('zh-CN')
    let backendId: number | null = null

    // 调用后端 API
    try {
      const res: any = await createUser({
        username: user.username || user.email,
        realName: user.name,
        email: user.email,
        role: user.role || 'normal',
        phone: user.phone || undefined,
        studentId: user.studentNo || undefined,
        grade: user.className || undefined,
        major: undefined,
        college: undefined,
      })
      // 尝试从响应中获取后端 ID（兼容多种响应格式）
      backendId = res?.data?.userId ?? res?.data?.user_id ?? res?.userId ?? res?.user_id ?? res?.data?.id ?? res?.id ?? null
    } catch (error: any) {
      // 422 校验错误（如账号已存在）直接抛出，不降级本地
      if (error?.response?.status === 422) {
        const detail = error?.response?.data?.detail || error?.response?.data?.message || '创建失败，请检查填写信息'
        throw new Error(typeof detail === 'string' ? detail : '创建失败，请检查填写信息')
      }
      console.warn('创建用户接口失败，本地降级:', error)
    }

    // 优先用后端 ID，否则生成本地 ID
    const newId = backendId ?? (Math.max(...users.value.map(u => u.id), 0) + 1)
    users.value.unshift({ ...user, id: newId, createdAt: now, updatedAt: now })
    saveUsers()
  }

  /** 更新用户（本地） */
  function updateUser(id: number, updates: Partial<User>) {
    const index = users.value.findIndex(u => u.id === id)
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...updates, updatedAt: new Date().toLocaleString('zh-CN') }
      saveUsers()
    }
  }

  /** 切换用户状态（API 优先） */
  async function toggleUserStatus(id: number) {
    const user = users.value.find(u => u.id === id)
    if (!user) return
    const newStatus = user.status === 'active' ? 'disabled' : 'active'

    // 调用后端 API
    try {
      await updateUserStatus(id, newStatus)
    } catch (error) {
      console.warn('更新用户状态接口失败，本地降级:', error)
    }

    user.status = newStatus
    user.updatedAt = new Date().toLocaleString('zh-CN')
    saveUsers()
  }

  return {
    users,
    total,
    fetchUsers,
    fetchUserDetail,
    deleteUser,
    batchDeleteUsers,
    resetPassword,
    sendResetPasswordCode,
    exportUsers,
    downloadTemplate,
    importUsers,
    addUser,
    updateUser,
    toggleUserStatus,
  }
})
