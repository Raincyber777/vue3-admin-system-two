import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getUserProfile, changePassword as changePasswordApi, type UserInfo, type LoginParams, type ChangePasswordParams } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  const userInfo = ref<UserInfo | null>(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  const setToken = (newToken: string, newRefreshToken?: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    if (newRefreshToken) {
      refreshToken.value = newRefreshToken
      localStorage.setItem('refreshToken', newRefreshToken)
    }
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
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
    if (payload?.accessToken) {
      setToken(payload.accessToken, payload.refreshToken || payload.refresh_token)
      const info = payload.user || payload.userInfo || payload.user_info
      if (info) setUserInfo(info)
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
  }

  const fetchUserInfo = async () => {
    if (!token.value) return
    try {
      const res = await getUserProfile()
      const payload = (res as any).data || res
      if (payload) {
        setUserInfo(payload as UserInfo)
      }
      return true
    } catch {
      console.error('获取用户信息失败')
      return false
    }
  }

  const changePassword = async (params: ChangePasswordParams) => {
    const res = await changePasswordApi(params)
    return res
  }

  return {
    token,
    userInfo,
    isAuthenticated,
    setToken,
    setUserInfo,
    clearAuth,
    login,
    logout,
    fetchUserInfo,
    changePassword
  }
})
