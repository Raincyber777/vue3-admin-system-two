import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getUserProfile, changePassword as changePasswordApi, type UserInfo, type LoginParams, type ChangePasswordParams } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  const userInfo = ref<UserInfo | null>(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  // 当前实验室名称（兼容 camelCase 和 snake_case）
  const currentLabName = computed(() => {
    return userInfo.value?.labName || userInfo.value?.lab_name || ''
  })

  // 当前实验室 ID
  const currentLabId = computed(() => {
    return userInfo.value?.labId || userInfo.value?.lab_id
  })

  // 当前角色列表
  const roles = computed<string[]>(() => {
    if (userInfo.value?.roles) return userInfo.value.roles
    // 兼容单个 role 字段
    if (userInfo.value?.role) return [userInfo.value.role]
    return []
  })

  // 当前权限列表
  const permissions = computed<string[]>(() => {
    return userInfo.value?.permissions || []
  })

  // 当前菜单权限列表
  const menus = computed<string[]>(() => {
    return userInfo.value?.menus || []
  })

  // 规范化用户信息（处理 camelCase / snake_case 混用）
  const normalizeUserInfo = (info: any): UserInfo => {
    return {
      ...info,
      labId: info.labId ?? info.lab_id,
      labName: info.labName ?? info.lab_name,
      role: info.role || 'admin',
      roles: info.roles ?? (info.role ? [info.role] : (info.adminId ? ['admin'] : [])),
      name: info.realName || info.name || info.adminName || '',
      phone: info.phone || '',
      email: info.email || '',
      permissions: info.permissions ?? [],
      menus: info.menus ?? [],
    }
  }

  const setToken = (newToken: string, newRefreshToken?: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    if (newRefreshToken) {
      refreshToken.value = newRefreshToken
      localStorage.setItem('refreshToken', newRefreshToken)
    }
  }

  const setUserInfo = (info: UserInfo) => {
    const normalized = normalizeUserInfo(info)
    userInfo.value = normalized
    localStorage.setItem('userInfo', JSON.stringify(normalized))
  }

  const clearAuth = () => {
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userInfo')
  }

  const login = async (params: LoginParams) => {
    const res = await loginApi(params)
    // 拦截器已解包 response.data，此处 res = { code, msg, data: { accessToken, ... } }
    const payload = (res as any).data
    console.log('🔍 [登录] 后端返回 payload:', { labId: payload?.labId, lab_id: payload?.lab_id, labName: payload?.labName, adminName: payload?.adminName, realName: payload?.realName })
    if (payload?.accessToken) {
      setToken(payload.accessToken, payload.refreshToken || payload.refresh_token)
      const info = payload.adminInfo || payload.user || payload.userInfo || payload.user_info || payload
      if (info) {
        const newLabId = info.labId || info.lab_id
        const oldLabInfo = userInfo.value
        const oldLabId = oldLabInfo?.labId || oldLabInfo?.lab_id

        // 首次登录或实验室发生变化时，清除旧实验室的本地缓存数据
        if (!oldLabId || (newLabId && String(oldLabId) !== String(newLabId))) {
          clearLabDataCache()
        }

        setUserInfo(info as UserInfo)
      }
      return { success: true }
    }
    return { success: false, message: (res as any).message || '登录失败' }
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch {
      // 忽略错误
    }
    clearAuth()
    clearLabDataCache()  // 登出时也清除实验室数据缓存
  }

  const fetchUserInfo = async () => {
    if (!token.value) return
    try {
      const res = await getUserProfile()
      const payload = (res as any).data || (res as any).adminInfo || res
      if (payload) {
        // 确保兼容各种后端字段格式
        const oldInfo = userInfo.value as any
        const normalizedInfo: any = {
          ...payload,
          // labId/labName 优先从 API 取，取不到用旧值（防止 info 接口覆盖登录时的值）
          labId: payload.labId ?? payload.lab_id ?? payload.labID ?? oldInfo?.labId ?? oldInfo?.lab_id,
          labName: payload.labName ?? payload.lab_name ?? payload.labNameCn ?? payload.lab ?? oldInfo?.labName ?? oldInfo?.lab_name,
          // 权限字段同理，防止被覆盖为空
          roles: payload.roles ?? (payload.role ? [payload.role] : []) ?? oldInfo?.roles,
          // 个人中心字段
          role: payload.role || 'admin',
          name: payload.realName || payload.name || payload.adminName || '',
          phone: payload.phone || '',
          email: payload.email || '',
          permissions: payload.permissions ?? oldInfo?.permissions ?? [],
          menus: payload.menus ?? [],
        }

        console.log('[Auth] ✅ labName:', normalizedInfo.labName, '| labId:', normalizedInfo.labId, '| roles:', normalizedInfo.roles, '| permissions:', normalizedInfo.permissions)
        setUserInfo(normalizedInfo as UserInfo)
      }
      return true
    } catch (error) {
      console.error('[Auth] 获取用户信息失败:', error)
      return false
    }
  }

  const changePassword = async (params: ChangePasswordParams) => {
    const res = await changePasswordApi(params)
    return res
  }

  // 清除实验室相关的本地缓存数据（切换实验室时调用）
  const clearLabDataCache = () => {
    // 需要清除的本地缓存 key 列表
    const cacheKeys = [
      'adminUsers',
      'studentRecords',
      'localReviewStatus',
      'courseList',
      'signinList',
      'homeworkList',
      'trainingCourses',
      'signinSessions',
      'deletedCheckinIds',
      'localHomeworks',
      'gradingSubmissions',
      'deletedHomeworkIds',
      'deletedSubmitIds',
      'training_courses',
      'deletedCourseNames',
      'studentRecords',
    ]
    cacheKeys.forEach(key => {
      localStorage.removeItem(key)
    })
  }

  // 权限判断方法
  const hasRole = (role: string): boolean => {
    return roles.value.includes(role)
  }

  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.some(role => roles.value.includes(role))
  }

  const hasPermission = (permission: string): boolean => {
    // 如果 permissions 为空，默认放行（向后兼容）
    if (permissions.value.length === 0) return true
    return permissions.value.includes(permission)
  }

  const hasAnyPermission = (permissionList: string[]): boolean => {
    // 如果 permissions 为空，默认放行
    if (permissions.value.length === 0) return true
    return permissionList.some(perm => permissions.value.includes(perm))
  }

  const hasMenu = (menuPath: string): boolean => {
    // 如果 menus 为空，默认显示所有菜单（向后兼容）
    if (menus.value.length === 0) return true
    return menus.value.includes(menuPath)
  }

  return {
    token,
    userInfo,
    isAuthenticated,
    currentLabName,
    currentLabId,
    roles,
    permissions,
    menus,
    setToken,
    setUserInfo,
    clearAuth,
    clearLabDataCache,
    login,
    logout,
    fetchUserInfo,
    changePassword,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasMenu,
  }
})
