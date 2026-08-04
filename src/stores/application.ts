import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSignList, getSignDetail, approveSign, rejectSign, getSignSwitch, updateSignSwitch, type SignDetail } from '@/api/sign'
import type { CourseEnrollmentItem } from '@/types/training'

/** 后端状态码 → 前端状态（0=待审核, 1=已通过, 2=已驳回，其他=待审核） */
const mapStatus = (status: number): 'pending' | 'approved' | 'rejected' => {
  if (status === 1) return 'approved'
  if (status === 2) return 'rejected'
  return 'pending'
}

/** 将后端 SignItem 映射为前端 CourseEnrollmentItem（匹配列表接口实际字段） */
const mapSignItem = (s: any): CourseEnrollmentItem => ({
  id: s.signId ?? s.sign_id ?? s.id ?? 0,
  course_id: s.courseId ?? s.course_id ?? 0,
  course_title: s.courseName ?? s.course_name ?? '',
  student_id: s.studentId ?? s.student_id ?? '',
  student_name: s.realName ?? s.real_name ?? s.name ?? '',
  department: s.departmentName || s.department || '',
  college: s.college || '',
  major: s.major || '',
  class_name: s.className ?? s.class_name ?? '',
  phone: s.phone ?? s.user_phone ?? '',
  self_intro: s.selfIntroduction ?? s.signInfo ?? s.sign_info ?? '',
  status: mapStatus(s.status ?? 0),
  enrollment_time: s.signTime ?? s.submitTime ?? s.sign_time ?? s.create_time ?? '',
})

/** 将后端详情响应映射为前端 CourseEnrollmentItem（匹配实际响应格式） */
const mapSignDetail = (d: any): CourseEnrollmentItem => ({
  id: d.id ?? d.sign_id ?? 0,
  course_id: 0, // 后端详情不返回课程信息
  course_title: '', // 后端详情不返回课程信息
  student_id: d.studentId || d.student_id || '',
  student_name: d.name || d.user_real_name || d.real_name || '',
  department: d.departmentText || d.department || '',
  college: d.college || '',
  major: d.major || '',
  class_name: d.className || d.class_name || '',
  phone: d.phone || d.user_phone || '',
  self_intro: d.selfIntroduction || d.self_intro || d.sign_info || '',
  status: d.auditStatus != null ? mapStatus(d.auditStatus) : mapStatus(d.status),
  enrollment_time: d.submitTime || d.sign_time || '',
  review_remark: d.auditRemark || d.review_remark || '',
  review_time: d.auditTime || d.review_time || '',
})

export const useApplicationStore = defineStore('application', () => {
  const applicants = ref<CourseEnrollmentItem[]>([])
  const loading = ref(false)
  /** 是否使用模拟数据（后端不可用时自动降级） */
  const usingMockData = ref(false)
  /** 报名开关状态 */
  const signSwitchEnabled = ref(true)
  const switchLoading = ref(false)

  // 本地审核状态（localStorage 持久化，刷新不丢失）
  // 格式：{ [signId]: 'approved' | 'rejected' }
  const getLocalReviewStatus = (): Record<number, 'approved' | 'rejected'> => {
    try {
      const stored = localStorage.getItem('localReviewStatus')
      return stored ? JSON.parse(stored) : {}
    } catch { return {} }
  }
  const setLocalReviewStatus = (signId: number, status: 'approved' | 'rejected') => {
    const map = getLocalReviewStatus()
    map[signId] = status
    localStorage.setItem('localReviewStatus', JSON.stringify(map))
  }

  /** 逐条请求详情填充自我介绍（间隔 300ms，避免限流 429） */
  const fetchDetailsForIntro = async () => {
    for (const a of applicants.value) {
      try {
        const res: any = await getSignDetail(a.id)
        const detail = res.data || res
        if (detail) {
          a.self_intro = (detail as any).selfIntroduction || (detail as any).auditRemark || detail.sign_info || (detail as any).self_intro || ''
        }
      } catch { /* ignore */ }
      // 每条间隔 300ms，防止触发限流
      await new Promise(r => setTimeout(r, 300))
    }
  }

  // 计算属性
  const approvedApplicants = computed(() => {
    return applicants.value.filter(app => app.status === 'approved')
  })

  const pendingApplicants = computed(() => {
    return applicants.value.filter(app => app.status === 'pending')
  })

  // 获取申请列表
  async function fetchApplications(): Promise<CourseEnrollmentItem[]> {
    loading.value = true
    try {
      const res: any = await getSignList()
      // 后端返回 { total, list: [...] }
      const list = res?.list || res?.data?.list || []
      const arr = Array.isArray(list) ? list : []
      applicants.value = arr.map(mapSignItem)
      usingMockData.value = arr.length === 0
      // 应用本地保存的审核状态覆盖（持久化，刷新不丢失）
      const localStatus = getLocalReviewStatus()
      for (const a of applicants.value) {
        if (localStatus[a.id]) {
          a.status = localStatus[a.id]
        }
      }
      // 逐条请求详情填充手机号、部门、班级、自我介绍等列表不返回的字段
      fetchDetailsForIntro()
      return applicants.value
    } catch (error) {
      console.warn('获取报名列表失败:', error)
      applicants.value = []
      usingMockData.value = true
      return applicants.value
    } finally {
      loading.value = false
    }
  }

  // 获取通过名单（本地筛选）
  async function fetchPassList(courseId?: string): Promise<CourseEnrollmentItem[]> {
    return applicants.value.filter(a => a.status === 'approved')
  }

  /** 获取报名详情（含完整手机号、自我介绍等） */
  async function fetchSignDetail(signId: number): Promise<CourseEnrollmentItem | null> {
    try {
      const res: any = await getSignDetail(signId)
      const detail = res.data || res
      if (detail) return mapSignDetail(detail)
    } catch (error) {
      console.warn('获取报名详情失败:', error)
    }
    // 降级：从本地列表中查找
    return applicants.value.find(a => a.id === signId) || null
  }

  /** 查询报名开关状态 */
  async function fetchSignSwitch(): Promise<boolean> {
    switchLoading.value = true
    try {
      const res: any = await getSignSwitch()
      const data = res.data || res
      // 后端返回 { value: 1 | 0 }，1=开启 0=关闭
      const switchVal = data.value ?? data.switch ?? data.status ?? data.enabled ?? data.is_open
      signSwitchEnabled.value = switchVal === 1 || switchVal === true || switchVal === '开' || switchVal === 'open'
    } catch (error) {
      console.warn('获取报名开关状态失败，默认开启:', error)
      signSwitchEnabled.value = true
    } finally {
      switchLoading.value = false
    }
    return signSwitchEnabled.value
  }

  /** 切换报名开关 */
  async function toggleSignSwitch(): Promise<boolean> {
    const newVal = !signSwitchEnabled.value
    switchLoading.value = true
    try {
      await updateSignSwitch(newVal)
      signSwitchEnabled.value = newVal
    } catch (error) {
      console.warn('更新报名开关失败:', error)
      throw error
    } finally {
      switchLoading.value = false
    }
    return signSwitchEnabled.value
  }

  /** 审核通过 */
  async function approveApplication(signId: number): Promise<boolean> {
    try {
      await approveSign(signId)
    } catch (error) {
      console.warn('审核通过接口失败，本地降级:', error)
    }
    // 无论 API 是否成功，都更新本地状态并持久化
    const item = applicants.value.find(a => a.id === signId)
    if (item) {
      item.status = 'approved'
      item.review_time = new Date().toLocaleString('zh-CN')
    }
    setLocalReviewStatus(signId, 'approved')
    return true
  }

  /** 审核驳回 */
  async function rejectApplication(signId: number): Promise<boolean> {
    try {
      await rejectSign(signId)
    } catch (error) {
      console.warn('审核驳回接口失败，本地降级:', error)
    }
    // 无论 API 是否成功，都更新本地状态并持久化
    const item = applicants.value.find(a => a.id === signId)
    if (item) {
      item.status = 'rejected'
      item.review_time = new Date().toLocaleString('zh-CN')
    }
    setLocalReviewStatus(signId, 'rejected')
    return true
  }

  return {
    applicants,
    loading,
    usingMockData,
    signSwitchEnabled,
    switchLoading,
    approvedApplicants,
    pendingApplicants,
    fetchApplications,
    fetchPassList,
    fetchSignDetail,
    fetchSignSwitch,
    toggleSignSwitch,
    approveApplication,
    rejectApplication,
  }
})
