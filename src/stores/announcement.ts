import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Announcement {
  id: string
  title: string
  content: string
  author: string
  category: string
  status: 'published' | 'draft' | 'scheduled' | 'deleted'
  publishTime: string
  scheduledTime?: string
  scheduledDeleteTime?: string
  views: number
  isPinned: boolean
  createdAt: string
}

export const useAnnouncementStore = defineStore('announcement', () => {
  // 公告列表
  const announcements = ref<Announcement[]>([
    {
      id: '1',
      title: '关于2024年实验室开放日活动通知',
      content: '为展示实验室研究成果，促进学术交流，我校将于5月20日举办实验室开放日活动，欢迎各位同学积极参与。活动期间将有精彩的实验演示、学术报告和互动环节，期待您的到来！',
      author: '张老师',
      category: '通知',
      status: 'published',
      publishTime: '2024-05-15 10:30',
      views: 1256,
      isPinned: true,
      createdAt: '2024-05-15 10:00'
    },
    {
      id: '2',
      title: '实验室新服务器上线公告',
      content: '为满足科研计算需求，实验室新购置的高性能计算服务器已完成部署，现已正式投入使用。服务器配置为：Intel Xeon Gold 6330 CPU，128GB DDR4内存，2TB NVMe SSD，配备NVIDIA RTX A6000显卡。请各位研究人员合理安排使用。',
      author: '管理员',
      category: '公告',
      status: 'published',
      publishTime: '2024-05-14 16:20',
      views: 832,
      isPinned: false,
      createdAt: '2024-05-14 16:00'
    },
    {
      id: '3',
      title: '端午节放假安排',
      content: '根据学校安排，端午节放假时间为6月10日至6月12日，共3天。请各位同学提前做好实验安排，放假期间实验室将关闭，请注意安全。',
      author: '李老师',
      category: '通知',
      status: 'published',
      publishTime: '2024-05-13 09:00',
      views: 2341,
      isPinned: false,
      createdAt: '2024-05-13 08:30'
    },
    {
      id: '4',
      title: '暑期科研项目申报通知',
      content: '2024年暑期科研项目申报工作即将开始，有意向的同学请于6月1日前提交申请书。详情请见教务处通知。',
      author: '王老师',
      category: '通知',
      status: 'draft',
      publishTime: '',
      views: 0,
      isPinned: false,
      createdAt: '2024-05-12 14:00'
    },
    {
      id: '5',
      title: '学术讲座预告',
      content: '本周六下午2点，将邀请清华大学教授来我校做学术报告，主题为"人工智能在科学研究中的应用"。欢迎广大师生参加。',
      author: '学术部',
      category: '公告',
      status: 'scheduled',
      publishTime: '',
      scheduledTime: '2024-05-25 14:00',
      views: 0,
      isPinned: false,
      createdAt: '2024-05-11 10:00'
    }
  ])

  // 当前筛选状态
  const activeStatus = ref<'all' | 'published' | 'draft' | 'scheduled' | 'deleted'>('all')

  // 筛选后的公告列表
  const filteredAnnouncements = computed(() => {
    let result = [...announcements.value]

    if (activeStatus.value !== 'all') {
      result = result.filter(item => item.status === activeStatus.value)
    } else {
      // 全部视图不显示已删除的公告
      result = result.filter(item => item.status !== 'deleted')
    }

    // 置顶优先，然后按发布时间降序
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.publishTime || b.scheduledTime || b.createdAt).getTime() -
             new Date(a.publishTime || b.scheduledTime || a.createdAt).getTime()
    })
  })

  // 统计数量
  const stats = computed(() => ({
    all: announcements.value.filter(a => a.status !== 'deleted').length,
    published: announcements.value.filter(a => a.status === 'published').length,
    draft: announcements.value.filter(a => a.status === 'draft').length,
    scheduled: announcements.value.filter(a => a.status === 'scheduled').length,
    deleted: announcements.value.filter(a => a.status === 'deleted').length
  }))

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 添加公告
  const addAnnouncement = (data: Omit<Announcement, 'id' | 'views' | 'createdAt'>) => {
    const now = new Date()
    const announcement: Announcement = {
      ...data,
      id: generateId(),
      views: 0,
      createdAt: now.toLocaleString('zh-CN')
    }
    announcements.value.unshift(announcement)
    saveToStorage()
  }

  // 更新公告
  const updateAnnouncement = (id: string, data: Partial<Announcement>) => {
    const index = announcements.value.findIndex(a => a.id === id)
    if (index !== -1) {
      announcements.value[index] = { ...announcements.value[index], ...data }
      saveToStorage()
    }
  }

  // 软删除公告（移至已删除）
  const deleteAnnouncement = (id: string) => {
    const index = announcements.value.findIndex(a => a.id === id)
    if (index !== -1) {
      announcements.value[index].status = 'deleted'
      saveToStorage()
    }
  }

  // 恢复公告（从已删除恢复到草稿）
  const restoreAnnouncement = (id: string) => {
    const index = announcements.value.findIndex(a => a.id === id)
    if (index !== -1) {
      announcements.value[index].status = 'draft'
      announcements.value[index].scheduledDeleteTime = undefined
      saveToStorage()
    }
  }

  // 发布公告
  const publishAnnouncement = (id: string) => {
    const index = announcements.value.findIndex(a => a.id === id)
    if (index !== -1) {
      announcements.value[index].status = 'published'
      announcements.value[index].publishTime = new Date().toLocaleString('zh-CN')
      saveToStorage()
    }
  }

  // 定时发布公告
  const scheduleAnnouncement = (id: string, scheduledTime: string) => {
    const index = announcements.value.findIndex(a => a.id === id)
    if (index !== -1) {
      announcements.value[index].status = 'scheduled'
      announcements.value[index].scheduledTime = scheduledTime
      saveToStorage()
    }
  }

  // 永久删除公告（彻底移除）
  const permanentDelete = (id: string) => {
    announcements.value = announcements.value.filter(a => a.id !== id)
    saveToStorage()
  }

  // 保存到localStorage
  const saveToStorage = () => {
    localStorage.setItem('announcements', JSON.stringify(announcements.value))
  }

  // 从localStorage加载
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('announcements')
      if (stored) {
        const parsed = JSON.parse(stored)
        // 验证数据格式是否正确
        if (Array.isArray(parsed)) {
          // 如果localStorage中有数据（即使是空数组），也使用它
          // 只有当localStorage完全没有数据时，才使用默认数据
          announcements.value = parsed
        }
      }
    } catch (error) {
      console.error('Failed to load announcements from localStorage:', error)
      // 如果加载失败，保持默认数据
    }
  }

  // 设置筛选状态
  const setActiveStatus = (status: 'all' | 'published' | 'draft' | 'scheduled' | 'deleted') => {
    activeStatus.value = status
  }

  // 初始化时自动从 localStorage 加载数据
  loadFromStorage()

  return {
    announcements,
    activeStatus,
    filteredAnnouncements,
    stats,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    restoreAnnouncement,
    permanentDelete,
    publishAnnouncement,
    scheduleAnnouncement,
    loadFromStorage,
    setActiveStatus
  }
})
