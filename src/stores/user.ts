import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export interface LoginRecord {
  time: string
  ip: string
  device: string
  location: string
}

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const userInfo = reactive({
    username: 'admin',
    email: 'admin@lab.edu.cn'
  })

  // 当前密码
  const currentPassword = ref('Admin@123')

  // 登录历史记录
  const loginHistory = ref<LoginRecord[]>([
    { time: '2024-05-30 09:30:22', ip: '192.168.1.100', device: 'Chrome/Windows 11', location: '本地' },
    { time: '2024-05-29 14:20:15', ip: '192.168.1.105', device: 'Safari/MacOS', location: '本地' },
    { time: '2024-05-28 10:05:33', ip: '192.168.1.110', device: 'Firefox/Windows 10', location: '本地' },
    { time: '2024-05-27 16:42:18', ip: '192.168.1.115', device: 'Chrome/Android', location: '本地' },
    { time: '2024-05-26 08:15:44', ip: '192.168.1.120', device: 'Edge/Windows 11', location: '本地' },
    { time: '2024-05-25 22:30:07', ip: '192.168.1.125', device: 'Chrome/iOS', location: '本地' },
    { time: '2024-05-24 11:18:55', ip: '192.168.1.130', device: 'Opera/Linux', location: '本地' },
    { time: '2024-05-23 19:45:32', ip: '192.168.1.135', device: 'Chrome/Windows 11', location: '本地' },
    { time: '2024-05-22 13:22:41', ip: '192.168.1.140', device: 'Firefox/MacOS', location: '本地' },
    { time: '2024-05-21 08:05:19', ip: '192.168.1.145', device: 'Safari/iOS', location: '本地' }
  ])

  // 获取用户信息（从localStorage）
  const loadUserInfo = () => {
    const stored = localStorage.getItem('adminUserInfo')
    if (stored) {
      const data = JSON.parse(stored)
      userInfo.username = data.username || userInfo.username
      userInfo.email = data.email || userInfo.email
    }

    const storedPassword = localStorage.getItem('adminPassword')
    if (storedPassword) {
      currentPassword.value = storedPassword
    }

    const storedLoginHistory = localStorage.getItem('loginHistory')
    if (storedLoginHistory) {
      const parsed = JSON.parse(storedLoginHistory)
      if (Array.isArray(parsed) && parsed.length > 0) {
        loginHistory.value = parsed
      }
    }
  }

  // 保存用户信息
  const saveUserInfo = () => {
    localStorage.setItem('adminUserInfo', JSON.stringify({
      username: userInfo.username,
      email: userInfo.email
    }))
  }

  // 更新用户名
  const updateUsername = (username: string) => {
    userInfo.username = username
    saveUserInfo()
  }

  // 更新邮箱
  const updateEmail = (email: string) => {
    userInfo.email = email
    saveUserInfo()
  }

  // 更新密码
  const updatePassword = (password: string) => {
    currentPassword.value = password
    localStorage.setItem('adminPassword', password)
  }

  // 添加登录记录
  const addLoginRecord = (record: LoginRecord) => {
    loginHistory.value.unshift(record)
    if (loginHistory.value.length > 10) {
      loginHistory.value.pop()
    }
    localStorage.setItem('loginHistory', JSON.stringify(loginHistory.value))
  }

  // 获取上次登录时间
  const getLastLoginTime = () => {
    return loginHistory.value.length > 0 ? loginHistory.value[1]?.time || '无' : '无'
  }

  return {
    userInfo,
    currentPassword,
    loginHistory,
    loadUserInfo,
    saveUserInfo,
    updateUsername,
    updateEmail,
    updatePassword,
    addLoginRecord,
    getLastLoginTime
  }
})
