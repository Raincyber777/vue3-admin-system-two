import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSignList, getSignDetail, approveSign, rejectSign, getSignSwitch, updateSignSwitch, type SignDetail } from '@/api/sign'
import type { CourseEnrollmentItem } from '@/types/training'

/** 后端状态码 → 前端状态 */
const mapStatus = (status: number): 'pending' | 'approved' | 'rejected' => {
  if (status === 1) return 'approved'
  if (status === 2) return 'rejected'
  return 'pending'
}

/** 学院名 → 中文显示（中文直接透传，英文码查表翻译，查不到原样返回） */
const collegeLabel = (val: string): string => {
  if (!val) return ''
  // 包含中文则直接返回
  if (/[一-鿿]/.test(val)) return val
  // 英文码 → 中文名
  const map: Record<string, string> = {
    software: '软件开发实验室',
    ai: '人工智能实验室',
    software_engineering: '软件工程学院',
    computer_science: '计算机学院',
  }
  return map[val] || val
}

/** 将后端 SignItem 映射为前端 CourseEnrollmentItem */
const mapSignItem = (s: any): CourseEnrollmentItem => ({
  id: s.sign_id ?? s.id ?? 0,
  course_id: s.course_id ?? s.courseId ?? 0,
  course_title: s.course_name ?? s.courseName ?? '',
  student_id: s.student_id ?? s.studentId ?? '',
  student_name: s.real_name ?? s.realName ?? s.student_name ?? s.name ?? s.user_name ?? s.username ?? '',
  department: collegeLabel(s.department ?? ''),
  college: collegeLabel(s.college) || '',
  major: s.major || '',
  class_name: s.class_name ?? s.className ?? '',
  phone: s.phone ?? s.user_phone ?? '',
  self_intro: s.selfIntroduction || s.auditRemark || s.sign_info || s.self_intro || s.intro || s.introduction || s.description || s.content || s.remark || s.text || s.bio || '',
  status: mapStatus(s.status),
  enrollment_time: s.sign_time ?? s.create_time ?? s.enrollment_time ?? '',
})

/** 将后端详情响应映射为前端 CourseEnrollmentItem（匹配实际响应格式） */
const mapSignDetail = (d: any): CourseEnrollmentItem => ({
  id: d.id ?? d.sign_id ?? 0,
  course_id: 0, // 后端详情不返回课程信息
  course_title: '', // 后端详情不返回课程信息
  student_id: d.studentId || d.student_id || '',
  student_name: d.name || d.user_real_name || d.real_name || '',
  department: d.departmentText || collegeLabel(String(d.department || '')),
  college: collegeLabel(d.college || ''),
  major: d.major || '',
  class_name: d.className || d.class_name || '',
  phone: d.phone || d.user_phone || '',
  self_intro: d.selfIntroduction || d.self_intro || d.sign_info || '',
  status: d.auditStatus != null ? mapStatus(d.auditStatus) : mapStatus(d.status),
  enrollment_time: d.submitTime || d.sign_time || '',
  review_remark: d.auditRemark || d.review_remark || '',
  review_time: d.auditTime || d.review_time || '',
})

/** 模拟报名数据 —— 后端接口未就绪时用于前端开发预览 */
const MOCK_APPLICANTS: CourseEnrollmentItem[] = [
  {
    id: 1,
    course_id: 101,
    course_title: 'Web 前端开发培训',
    student_id: '20241450101',
    student_name: '张三',
    department: '软件开发实验室',
    college: '计算机与信息工程学院',
    major: '软件工程',
    class_name: '软件2401班',
    phone: '13812345678',
    self_intro: '热爱前端开发，熟悉 Vue 和 React 框架，参加过多次编程竞赛并获得省级奖项，希望能加入实验室进一步提升技术水平。',
    status: 'pending',
    enrollment_time: '2026-07-20T10:30:00',
  },
  {
    id: 2,
    course_id: 102,
    course_title: 'AI 算法入门培训',
    student_id: '20241450102',
    student_name: '李四',
    department: '软件开发实验室',
    college: '计算机与信息工程学院',
    major: '软件工程',
    class_name: '软件2402班',
    phone: '13998765432',
    self_intro: '对前端开发方向非常感兴趣，自学过 Vue 和 React，希望能有机会参与实验室的项目开发。',
    status: 'pending',
    enrollment_time: '2026-07-21T14:20:00',
  },
  {
    id: 3,
    course_id: 101,
    course_title: 'Web 前端开发培训',
    student_id: '20241450103',
    student_name: '王五',
    department: '软件开发实验室',
    college: '信息与通信工程学院',
    major: '计算机科学与技术',
    class_name: '计科2402班',
    phone: '13611223344',
    self_intro: '具备扎实的编程基础，熟悉 JavaScript 和 TypeScript，对项目开发流程有一定了解，希望在实践中锻炼自己。',
    status: 'approved',
    enrollment_time: '2026-07-19T09:15:00',
    review_time: '2026-07-22T16:30:00',
    review_remark: '条件优秀，予以通过',
  },
  {
    id: 4,
    course_id: 102,
    course_title: 'AI 算法入门培训',
    student_id: '20241450104',
    student_name: '赵六',
    department: '软件开发实验室',
    college: '计算机与信息工程学院',
    major: '软件工程',
    class_name: '软件2403班',
    phone: '15088997766',
    self_intro: '对项目开发有浓厚兴趣，熟悉 JavaScript 和 SQL，希望能系统学习前端开发相关知识。',
    status: 'rejected',
    enrollment_time: '2026-07-18T11:00:00',
    review_time: '2026-07-22T10:00:00',
    review_remark: '下学期课业较多，建议参加下期培训',
  },
  {
    id: 5,
    course_id: 101,
    course_title: 'Web 前端开发培训',
    student_id: '20241450105',
    student_name: '孙七',
    department: '软件开发实验室',
    college: '计算机与信息工程学院',
    major: '软件工程',
    class_name: '软件2403班',
    phone: '18755667788',
    self_intro: '对 UI/UX 设计有兴趣，同时也想学习前端开发技术，做一名既懂设计又懂开发的全栈设计师。',
    status: 'pending',
    enrollment_time: '2026-07-22T08:45:00',
  },
  {
    id: 6,
    course_id: 102,
    course_title: 'AI 算法入门培训',
    student_id: '20241450106',
    student_name: '周八',
    department: '软件开发实验室',
    college: '信息与通信工程学院',
    major: '计算机科学与技术',
    class_name: '计科2403班',
    phone: '15233445566',
    self_intro: '跨专业对软件开发产生兴趣，有一定编程基础，希望能通过培训快速入门前端开发领域。',
    status: 'pending',
    enrollment_time: '2026-07-23T15:30:00',
  },
]

export const useApplicationStore = defineStore('application', () => {
  const applicants = ref<CourseEnrollmentItem[]>([])
  const loading = ref(false)
  /** 是否使用模拟数据（后端不可用时自动降级） */
  const usingMockData = ref(false)
  /** 报名开关状态 */
  const signSwitchEnabled = ref(true)
  const switchLoading = ref(false)

  // 已取消报名的 ID 集合（localStorage 持久化，刷新不丢失）
  const getCancelledIds = (): Set<number> => {
    try {
      const stored = localStorage.getItem('cancelledSignIds')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  }
  const saveCancelledId = (signId: number) => {
    const ids = getCancelledIds()
    ids.add(signId)
    localStorage.setItem('cancelledSignIds', JSON.stringify([...ids]))
  }

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
      // 兼容多种响应格式：{ data: { list } } / { data: [...] } / { list } / [...]
      const list = res.data?.list || res.data?.records || res.data || res.list || res
      const arr = Array.isArray(list) ? list : (list?.list || list?.records || [])
      if (arr.length > 0) {
        applicants.value = arr.map(mapSignItem)
        usingMockData.value = false
      } else {
        // 接口返回空数据时使用 mock
        applicants.value = [...MOCK_APPLICANTS]
        usingMockData.value = true
      }
      // 过滤掉已取消的报名（localStorage 持久化）
      const cancelledIds = getCancelledIds()
      if (cancelledIds.size > 0) {
        applicants.value = applicants.value.filter(a => !cancelledIds.has(a.id))
      }
      // 应用本地保存的审核状态覆盖（持久化，刷新不丢失）
      const localStatus = getLocalReviewStatus()
      for (const a of applicants.value) {
        if (localStatus[a.id]) {
          a.status = localStatus[a.id]
        }
      }
      // 逐条请求详情填充自我介绍（间隔限流）
      fetchDetailsForIntro()
      return applicants.value
    } catch (error) {
      console.warn('获取报名列表失败，使用模拟数据:', error)
      applicants.value = [...MOCK_APPLICANTS]
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

  /** 取消报名（纯前端，localStorage 持久化） */
  async function cancelApplication(signId: number): Promise<boolean> {
    // 存到 localStorage，刷新页面也不会恢复
    saveCancelledId(signId)
    // 从列表中移除
    applicants.value = applicants.value.filter(a => a.id !== signId)
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
    cancelApplication,
  }
})
