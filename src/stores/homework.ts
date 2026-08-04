import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createHomework as createHomeworkApi, updateHomeworkApi, deleteHomeworkApi, getHomeworkList, getSubmitList, getSubmitDetail, submitScore, deleteSubmit, batchDeleteSubmit } from '@/api/homework'
import type { Homework, Question } from '@/types/homework'

/** 模拟作业假数据 */
const MOCK_HOMEWORKS: Homework[] = [
  {
    id: 1,
    title: '前端基础知识测验',
    department: 'software',
    publishDate: '2026-07-20 08:00',
    deadline: '2026-08-05 23:59',
    totalScore: 35,
    status: 'published',
    createdAt: '2026-07-19 10:00:00',
    createdBy: '管理员',
    questions: [
      {
        id: 1, order: 1, type: 'judge',
        title: 'HTML 是一种编程语言。',
        score: 5,
        answer: '错误',
      },
      {
        id: 2, order: 2, type: 'choice',
        title: '以下哪个是 CSS 中设置背景色的正确属性？',
        score: 10,
        options: [
          'A. color',
          'B. background-color',
          'C. font-size',
          'D. border',
        ],
        answer: 'B',
      },
      {
        id: 3, order: 3, type: 'choice',
        title: '在 JavaScript 中，以下哪个方法用于将 JSON 字符串转换为对象？',
        score: 10,
        options: [
          'A. JSON.stringify()',
          'B. JSON.parse()',
          'C. JSON.convert()',
          'D. JSON.object()',
        ],
        answer: 'B',
      },
      {
        id: 4, order: 4, type: 'essay',
        title: '请简述 CSS 盒模型的概念及其组成部分。',
        score: 10,
        answer: 'CSS 盒模型是网页布局的基础，每个元素都被看作一个矩形盒子。盒模型从内到外由四个部分组成：内容区域（content）、内边距（padding）、边框（border）和外边距（margin）。内容区域是元素实际显示内容的区域；内边距是内容到边框之间的空白；边框围绕在内边距外围；外边距是元素与其他元素之间的间距。',
      },
    ],
  },
  {
    id: 2,
    title: '人工智能导论测试',
    department: 'software',
    publishDate: '2026-07-22 08:00',
    deadline: '2026-08-10 23:59',
    totalScore: 40,
    status: 'published',
    createdAt: '2026-07-21 14:00:00',
    createdBy: '管理员',
    questions: [
      {
        id: 1, order: 1, type: 'judge',
        title: '监督学习需要带有标签的训练数据。',
        score: 5,
        answer: '正确',
      },
      {
        id: 2, order: 2, type: 'choice',
        title: '以下哪种算法属于无监督学习？',
        score: 10,
        options: [
          'A. 线性回归',
          'B. K-means 聚类',
          'C. 决策树分类',
          'D. 支持向量机（SVM）',
        ],
        answer: 'B',
      },
      {
        id: 3, order: 3, type: 'essay',
        title: '请简述过拟合的概念以及常用的防止过拟合的方法。',
        score: 15,
        answer: '过拟合是指模型在训练数据上表现得很好，但在测试数据或新数据上表现较差的现象。常用的防止过拟合方法包括：1）增加训练数据量；2）使用正则化（L1/L2正则化）；3）Dropout（随机丢弃神经元）；4）早停（Early Stopping）；5）交叉验证；6）简化模型结构，减少参数数量。',
      },
      {
        id: 4, order: 4, type: 'choice',
        title: '以下哪个激活函数可以输出负数？',
        score: 10,
        options: [
          'A. Sigmoid',
          'B. ReLU',
          'C. tanh',
          'D. Softmax',
        ],
        answer: 'C',
      },
    ],
  },
]

/** 单题作答 */
export interface QuestionAnswer {
  questionId: number
  questionOrder: number
  questionType: string
  questionTitle: string
  questionScore: number
  /** 学生答案 */
  studentAnswer: string
  /** 得分（未批改为 -1） */
  score: number
  /** 评语 */
  comment: string
}

/** 学生作业提交记录 */
export interface HomeworkSubmission {
  id: number
  homeworkId: number
  homeworkTitle: string
  courseName: string
  studentId: number
  studentName: string
  studentNo: string
  department: 'software'
  className: string
  /** 手机号 */
  phone: string
  submitTime: string
  /** 提交内容原始字符串（可能为 JSON） */
  submitContent: string
  /** 提交文件 URL */
  submitFile: string
  /** 各题作答 */
  answers: QuestionAnswer[]
  totalScore: number
  /** 教师评语 */
  remark: string
  /** 'ungraded' | 'graded' */
  gradingStatus: 'ungraded' | 'graded'
  gradedAt?: string
}

/** 模拟学生提交 */
const MOCK_SUBMISSIONS: HomeworkSubmission[] = [
  {
    id: 1, homeworkId: 1, homeworkTitle: '前端基础知识测验', courseName: 'Web 前端开发实训',
    studentId: 101, studentName: '张伟', studentNo: '2024010001',
    department: 'software', className: '1班', phone: '', submitContent: '', submitFile: '', remark: '',
    submitTime: '2026-07-25 14:30:00',
    answers: [
      { questionId: 1, questionOrder: 1, questionType: 'judge', questionTitle: 'HTML 是一种编程语言。', questionScore: 5, studentAnswer: '错误', score: 5, comment: '' },
      { questionId: 2, questionOrder: 2, questionType: 'choice', questionTitle: '以下哪个是 CSS 中设置背景色的正确属性？', questionScore: 10, studentAnswer: 'B', score: 10, comment: '' },
      { questionId: 3, questionOrder: 3, questionType: 'choice', questionTitle: '在 JavaScript 中，以下哪个方法用于将 JSON 字符串转换为对象？', questionScore: 10, studentAnswer: 'B', score: 10, comment: '' },
      { questionId: 4, questionOrder: 4, questionType: 'essay', questionTitle: '请简述 CSS 盒模型的概念及其组成部分。', questionScore: 10, studentAnswer: '盒模型是CSS布局的基础，包含内容(content)、内边距(padding)、边框(border)和外边距(margin)。', score: 8, comment: '回答正确但不够完整' },
    ],
    totalScore: 33, gradingStatus: 'graded', gradedAt: '2026-07-26 10:00:00',
  },
  {
    id: 2, homeworkId: 1, homeworkTitle: '前端基础知识测验', courseName: 'Web 前端开发实训',
    studentId: 102, studentName: '李娜', studentNo: '2024010002',
    department: 'software', className: '2班', phone: '', submitContent: '', submitFile: '', remark: '',
    submitTime: '2026-07-26 09:00:00',
    answers: [
      { questionId: 1, questionOrder: 1, questionType: 'judge', questionTitle: 'HTML 是一种编程语言。', questionScore: 5, studentAnswer: '正确', score: 0, comment: '' },
      { questionId: 2, questionOrder: 2, questionType: 'choice', questionTitle: '以下哪个是 CSS 中设置背景色的正确属性？', questionScore: 10, studentAnswer: 'D', score: 0, comment: '' },
      { questionId: 3, questionOrder: 3, questionType: 'choice', questionTitle: '在 JavaScript 中，以下哪个方法用于将 JSON 字符串转换为对象？', questionScore: 10, studentAnswer: 'B', score: 10, comment: '' },
      { questionId: 4, questionOrder: 4, questionType: 'essay', questionTitle: '请简述 CSS 盒模型的概念及其组成部分。', questionScore: 10, studentAnswer: 'CSS盒模型就是每个HTML元素都是一个盒子。', score: -1, comment: '' },
    ],
    totalScore: 10, gradingStatus: 'ungraded',
  },
  {
    id: 3, homeworkId: 1, homeworkTitle: '前端基础知识测验', courseName: 'Web 前端开发实训',
    studentId: 103, studentName: '刘洋', studentNo: '2024010004',
    department: 'software', className: '1班', phone: '', submitContent: '', submitFile: '', remark: '',
    submitTime: '2026-07-27 16:00:00',
    answers: [
      { questionId: 1, questionOrder: 1, questionType: 'judge', questionTitle: 'HTML 是一种编程语言。', questionScore: 5, studentAnswer: '错误', score: -1, comment: '' },
      { questionId: 2, questionOrder: 2, questionType: 'choice', questionTitle: '以下哪个是 CSS 中设置背景色的正确属性？', questionScore: 10, studentAnswer: 'B', score: -1, comment: '' },
      { questionId: 3, questionOrder: 3, questionType: 'choice', questionTitle: '在 JavaScript 中，以下哪个方法用于将 JSON 字符串转换为对象？', questionScore: 10, studentAnswer: 'A', score: -1, comment: '' },
      { questionId: 4, questionOrder: 4, questionType: 'essay', questionTitle: '请简述 CSS 盒模型的概念及其组成部分。', questionScore: 10, studentAnswer: '盒模型由内边距、边框和外边距构成。内容区是文字显示的区域，内边距是内容到边框的距离。', score: -1, comment: '' },
    ],
    totalScore: 0, gradingStatus: 'ungraded',
  },
  {
    id: 4, homeworkId: 2, homeworkTitle: '人工智能导论测试', courseName: 'AI 算法入门培训',
    studentId: 201, studentName: '陈静', studentNo: '2024010005',
    department: 'software', className: '1班', phone: '', submitContent: '', submitFile: '', remark: '',
    submitTime: '2026-07-27 11:00:00',
    answers: [
      { questionId: 1, questionOrder: 1, questionType: 'judge', questionTitle: '监督学习需要带有标签的训练数据。', questionScore: 5, studentAnswer: '正确', score: 5, comment: '' },
      { questionId: 2, questionOrder: 2, questionType: 'choice', questionTitle: '以下哪种算法属于无监督学习？', questionScore: 10, studentAnswer: 'B', score: 10, comment: '' },
      { questionId: 3, questionOrder: 3, questionType: 'essay', questionTitle: '请简述过拟合的概念以及常用的防止过拟合的方法。', questionScore: 15, studentAnswer: '过拟合是模型过于复杂导致在训练集上表现很好但在测试集上差。方法有正则化、增加数据、Dropout。', score: 12, comment: '基本正确，可补充交叉验证' },
      { questionId: 4, questionOrder: 4, questionType: 'choice', questionTitle: '以下哪个激活函数可以输出负数？', questionScore: 10, studentAnswer: 'C', score: 10, comment: '' },
    ],
    totalScore: 37, gradingStatus: 'graded', gradedAt: '2026-07-28 09:00:00',
  },
  {
    id: 5, homeworkId: 2, homeworkTitle: '人工智能导论测试', courseName: 'AI 算法入门培训',
    studentId: 202, studentName: '赵磊', studentNo: '2024010006',
    department: 'software', className: '2班', phone: '', submitContent: '', submitFile: '', remark: '',
    submitTime: '2026-07-28 15:00:00',
    answers: [
      { questionId: 1, questionOrder: 1, questionType: 'judge', questionTitle: '监督学习需要带有标签的训练数据。', questionScore: 5, studentAnswer: '正确', score: -1, comment: '' },
      { questionId: 2, questionOrder: 2, questionType: 'choice', questionTitle: '以下哪种算法属于无监督学习？', questionScore: 10, studentAnswer: 'B', score: -1, comment: '' },
      { questionId: 3, questionOrder: 3, questionType: 'essay', questionTitle: '请简述过拟合的概念以及常用的防止过拟合的方法。', questionScore: 15, studentAnswer: '过拟合是模型学习到了训练数据中的噪声而非一般规律。解决过拟合的方法：1.增加训练数据 2.使用正则化技术 3.交叉验证 4.减少模型复杂度。', score: -1, comment: '' },
      { questionId: 4, questionOrder: 4, questionType: 'choice', questionTitle: '以下哪个激活函数可以输出负数？', questionScore: 10, studentAnswer: 'A', score: -1, comment: '' },
    ],
    totalScore: 0, gradingStatus: 'ungraded',
  },
]

export const useHomeworkStore = defineStore('homework', () => {
  const homeworks = ref<Homework[]>([])

  /** 计算题目总分 */
  const calcTotalScore = (questions: Question[]) =>
    questions.reduce((sum, q) => sum + q.score, 0)

  // ==================== 已删除追踪 ====================
  const getDeletedHomeworkIds = (): Set<number> => {
    try {
      const stored = localStorage.getItem('deletedHomeworkIds')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  }
  const saveDeletedHomeworkId = (id: number) => {
    const ids = getDeletedHomeworkIds()
    ids.add(id)
    localStorage.setItem('deletedHomeworkIds', JSON.stringify([...ids]))
  }

  // ==================== 本地持久化 ====================
  const saveHomeworks = () => {
    localStorage.setItem('localHomeworks', JSON.stringify(homeworks.value))
  }

  const loadLocalHomeworks = (): Homework[] => {
    try {
      const cached = localStorage.getItem('localHomeworks')
      return cached ? JSON.parse(cached) : []
    } catch { return [] }
  }

  // ==================== 数据加载 ====================
  const fetchHomeworks = async () => {
    // 从本地缓存加载（保留题目数据），作为基础数据
    const cached = loadLocalHomeworks()
    if (cached.length > 0 && homeworks.value.length === 0) {
      homeworks.value = cached
    }

    // 读取已删除记录，用于后续过滤
    const deletedIds = getDeletedHomeworkIds()

    try {
      const res: any = await getHomeworkList({ page: 1, size: 100 })
      const data = res.data || res
      const list = data?.list || (Array.isArray(data) ? data : [])
      const localList = [...homeworks.value]
      console.log('fetchHomeworks - 本地数据量:', localList.length, 'API返回量:', list.length, 'API total:', data?.total)

      // 找出哪些本地数据已被 API 匹配（优先用 ID 匹配，找不到再用标题）
      const matchedLocalIds = new Set<number>()
      const findLocal = (apiId: number, apiTitle: string): Homework | undefined => {
        // 优先用 ID 精确匹配（包括真实 ID 和临时 ID）
        const byId = localList.find(l => l.id === apiId)
        if (byId) {
          matchedLocalIds.add(byId.id)
          return byId
        }
        // 如果 API 有返回但 ID 不匹配（说明是新建的），用标题匹配临时 ID 数据
        if (apiId > 0) {
          const byTitle = localList.find(l => l.title === apiTitle && l.id > 1000000)
          if (byTitle) {
            matchedLocalIds.add(byTitle.id)
            return byTitle
          }
        }
        return undefined
      }

      const mappedList = list
        .filter((item: any) => {
          const id = item.homeworkId ?? item.homework_id ?? 0
          return !deletedIds.has(id)
        })
        .map((item: any) => {
          const id = item.homeworkId ?? item.homework_id ?? 0
          const title = item.homeworkTitle ?? item.homework_title ?? ''
          const local = findLocal(id, title)

          // 字段优先级：本地 > API（本地包含用户选择的 className、完整题目等信息）
          const apiClassName = item.groupName || item.group_name || ''
          const finalClassName = local?.className || apiClassName || ''

          return {
            id,
            title: local?.title || title,  // 用本地标题（可能包含格式化内容）
            department: local?.department || 'software' as const,
            publishDate: local?.publishDate || (item.createTime ?? item.create_time ?? ''),
            deadline: local?.deadline || item.deadline || '',
            questions: local?.questions || [],  // 保留本地题目数据
            courseId: local?.courseId ?? item.courseId ?? item.course_id ?? 0,
            courseName: local?.courseName || (item.courseName ?? item.course_name ?? ''),
            className: finalClassName,
            totalScore: local?.totalScore || calcTotalScore(local?.questions || []),
            status: local?.status || 'published' as const,
            createdAt: local?.createdAt || (item.createTime ?? item.create_time ?? ''),
            createdBy: local?.createdBy || '管理员',
          }
        })

      // 保留本地有但 API 还没有的新建作业（临时 ID 数据）
      const notYetInApi = localList.filter(l => {
        const isTempId = l.id > 1000000
        const notMatched = !matchedLocalIds.has(l.id)
        const notDeleted = !deletedIds.has(l.id)
        return isTempId && notMatched && notDeleted
      })
      console.log('fetchHomeworks - 已匹配:', matchedLocalIds.size, '保留本地:', notYetInApi.length)

      // 合并：临时 ID 数据 + API 返回的数据
      homeworks.value = [...notYetInApi, ...mappedList]
      console.log('fetchHomeworks - 最终数据量:', homeworks.value.length)

      saveHomeworks()
    } catch (error) {
      console.warn('获取作业列表失败:', error)
      // 即使 API 失败，也要从本地缓存中过滤已删除的
      homeworks.value = homeworks.value.filter(h => !deletedIds.has(h.id))
      if (homeworks.value.length === 0) {
        homeworks.value = [...MOCK_HOMEWORKS]
        localStorage.setItem('localHomeworks', JSON.stringify(homeworks.value))
      }
    }
  }

  // ==================== CRUD ====================
  const createHomework = async (data: Omit<Homework, 'id' | 'totalScore' | 'createdAt'>, courseId?: number | string) => {
    // 先存本地（保留完整题目数据），再调 API
    const tempId = Date.now()
    const localHw: Homework = {
      ...data,
      id: tempId,
      totalScore: calcTotalScore(data.questions || []),
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    homeworks.value.unshift(localHw)
    saveHomeworks()

    try {
      const numericCourseId = Number(courseId) || 0
      const className = (data as any).className || ''
      const apiParams = {
        homeworkTitle: data.title,
        homeworkContent: data.questions.map(q => q.title).join('；') || data.title,
        deadline: data.deadline || '',
        courseId: numericCourseId,
        groupName: (className && className !== '全部班级') ? className : undefined,
      }
      console.log('创建作业 API 参数:', apiParams)
      const res: any = await createHomeworkApi(apiParams)
      console.log('创建作业 API 响应:', res)

      // 从响应中提取真实 ID
      const backendId = res?.data?.homeworkId ?? res?.data?.homework_id ?? res?.data?.id ?? res?.homeworkId ?? res?.id ?? null

      if (backendId) {
        // 用真实 ID 更新本地数据
        const idx = homeworks.value.findIndex(h => h.id === tempId)
        if (idx !== -1) {
          homeworks.value[idx] = {
            ...homeworks.value[idx],
            id: backendId,
          }
          saveHomeworks()
          console.log('已用真实 ID', backendId, '替换临时 ID', tempId)
        }
      }

      await fetchHomeworks()
    } catch (error: any) {
      console.warn('布置作业接口失败:', error)
      if (error.response?.data) {
        console.error('后端错误详情:', error.response.data)
      }
      throw error
    }
  }

  const updateHomework = async (id: number, data: Partial<Omit<Homework, 'id' | 'createdAt'>>, courseId?: number | string) => {
    // 先更新本地数据保留题目，再调 API
    const localIdx = homeworks.value.findIndex(h => h.id === id)
    if (localIdx !== -1) {
      homeworks.value[localIdx] = {
        ...homeworks.value[localIdx],
        ...data,
        totalScore: data.questions ? calcTotalScore(data.questions) : homeworks.value[localIdx].totalScore,
      }
      saveHomeworks()
    }

    try {
      const numericCourseId = Number(courseId) || 0
      const className = (data as any).className || ''
      await updateHomeworkApi(id, {
        homeworkTitle: data.title || homeworks.value[localIdx]?.title || '',
        homeworkContent: data.questions ? JSON.stringify(data.questions) : undefined,
        deadline: data.deadline || homeworks.value[localIdx]?.deadline,
        courseId: numericCourseId,
        groupName: (className && className !== '全部班级') ? className : undefined,
      })
      await fetchHomeworks()
    } catch (error: any) {
      console.warn('编辑作业接口失败:', error)
      if (error.response?.data) {
        console.error('后端错误详情:', error.response.data)
      }
      throw error
    }
  }

  const deleteHomework = async (id: number) => {
    // 临时 ID（Date.now() 生成）说明作业未同步到后端，直接删除本地即可
    if (id <= 1000000) {
      try {
        await deleteHomeworkApi(id)
      } catch (error) {
        console.warn('删除作业接口失败:', error)
      }
    }
    // 保存删除记录，防止刷新后从 API / 本地缓存重新拉回
    saveDeletedHomeworkId(id)
    homeworks.value = homeworks.value.filter(h => h.id !== id)
    saveHomeworks()
  }

  const publishHomework = (id: number) => {
    const hw = homeworks.value.find(h => h.id === id)
    if (hw) {
      hw.status = 'published'
      hw.publishDate = new Date().toLocaleString('zh-CN')
      saveHomeworks()
    }
  }

  const endHomework = (id: number) => {
    const hw = homeworks.value.find(h => h.id === id)
    if (hw) {
      hw.status = 'ended'
      saveHomeworks()
    }
  }

  // ==================== 题目辅助 ====================
  const newQuestionId = (hwId: number) => {
    const hw = homeworks.value.find(h => h.id === hwId)
    if (!hw) return 1
    return Math.max(0, ...hw.questions.map(q => q.id)) + 1
  }

  // ==================== 计算属性 ====================
  const softwareHomeworks = computed(() =>
    homeworks.value.filter(h => h.department === 'software')
  )

  const stats = computed(() => ({
    total: homeworks.value.length,
    published: homeworks.value.filter(h => h.status === 'published').length,
    draft: homeworks.value.filter(h => h.status === 'draft').length,
    ended: homeworks.value.filter(h => h.status === 'ended').length,
  }))

  // ==================== 学生提交 ====================
  const submissions = ref<HomeworkSubmission[]>([])

  const fetchSubmissions = async (params?: { groupName?: string; homeworkId?: number | string; courseId?: number | string }) => {
    // 先加载 localStorage 缓存作为基础
    const cachedSubs = loadSubmissionsFromStorage()
    if (cachedSubs.length > 0) {
      submissions.value = cachedSubs
    }

    try {
      const res: any = await getSubmitList(params)
      const data = res.data || res
      const list = data?.list || data?.records || (Array.isArray(data) ? data : [])
      if (list.length > 0) {
        const hwMap = new Map<number, Homework>()
        for (const hw of homeworks.value) { hwMap.set(hw.id, hw) }

        const deletedIds = getDeletedSubmitIds()

        const apiSubmissions = list.map((item: any) => {
          const score = item.score ?? null
          const hwId = item.homeworkId ?? item.homework_id ?? 0
          const localHw = hwMap.get(hwId)
          return {
            id: item.submitId ?? item.submit_id ?? item.id ?? 0,
            homeworkId: hwId,
            homeworkTitle: localHw?.title || item.homeworkTitle || item.homework_title || item.title || (hwId ? `作业#${hwId}` : ''),
            courseName: item.courseName || item.course_name || '',
            studentId: item.userId ?? item.user_id ?? 0,
            studentName: item.realName || item.userRealName || item.real_name || item.studentName || item.name || '',
            studentNo: item.studentNo || item.student_no || item.sno || String(item.userId ?? ''),
            department: 'software' as const,
            className: item.groupName || item.group_name || item.className || item.class_name || '',
            phone: item.userPhone || item.user_phone || item.phone || '',
            submitTime: item.submitTime || item.submit_time || item.createTime || '',
            submitContent: item.submitContent || item.submit_content || '',
            submitFile: item.submitFile || item.submit_file || '',
            answers: [] as QuestionAnswer[],
            totalScore: score ?? 0,
            remark: item.remark || '',
            gradingStatus: (score !== null && score !== undefined ? 'graded' : 'ungraded') as 'graded' | 'ungraded',
          }
        })

        // 过滤已删除的
        const filteredApi = apiSubmissions.filter(s => !deletedIds.has(s.id))

        // 合并：保留本地已有的批改数据（answers、score、remark 等）
        const mergedSubmissions = filteredApi.map(api => {
          const local = submissions.value.find(s => s.id === api.id)
          if (local) {
            return {
              ...api,
              answers: local.answers.length > 0 ? local.answers : api.answers,
              totalScore: (local.totalScore > 0 || local.remark) ? local.totalScore : api.totalScore,
              remark: local.remark || api.remark,
              gradingStatus: local.gradingStatus === 'graded' ? 'graded' : api.gradingStatus,
              gradedAt: local.gradedAt,
              className: local.className || api.className,
              studentNo: local.studentNo || api.studentNo,
              phone: local.phone || api.phone,
            }
          }
          return api
        })
        submissions.value = mergedSubmissions
        saveSubmissionsToStorage()
        return
      }
    } catch (error) {
      console.warn('获取提交列表失败:', error)
    }
    // API 失败时保留 localStorage 数据
    if (cachedSubs.length === 0) {
      submissions.value = []
    }
  }

  const getSubmissionById = (id: number) => submissions.value.find(s => s.id === id)

  /** 解析 submit_content 为答案列表 */
  const parseSubmitContent = (content: string): QuestionAnswer[] => {
    if (!content) return []
    // 如果已经是对象/数组（可能 axios 自动解析了 JSON）
    if (typeof content !== 'string') {
      const arr = Array.isArray(content) ? content : (content.answers || content.list || content.questions || [])
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((item: any, idx: number) => mapAnswerItem(item, idx))
      }
      return []
    }
    // 字符串：尝试 JSON 解析
    try {
      const parsed = JSON.parse(content)
      const arr = Array.isArray(parsed) ? parsed : (parsed.answers || parsed.list || parsed.questions || parsed.data || [])
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((item: any, idx: number) => mapAnswerItem(item, idx))
      }
    } catch {
      // 非 JSON 字符串，当作纯文本答案
      return [{
        questionId: 0,
        questionOrder: 1,
        questionType: 'essay',
        questionTitle: '提交内容',
        questionScore: 0,
        studentAnswer: content,
        score: -1,
        comment: '',
      }]
    }
    return []
  }

  /** 单条答案字段映射 */
  const mapAnswerItem = (item: any, idx: number): QuestionAnswer => ({
    questionId: item.questionId ?? item.question_id ?? item.id ?? idx,
    questionOrder: item.questionOrder ?? item.question_order ?? item.order ?? item.seq ?? (idx + 1),
    questionType: item.questionType || item.question_type || item.type || item.qtype || 'essay',
    questionTitle: item.questionTitle || item.question_title || item.title || item.content || item.question || item.name || '',
    questionScore: item.questionScore ?? item.question_score ?? item.maxScore ?? item.max_score ?? item.points ?? 0,
    studentAnswer: item.studentAnswer || item.student_answer || item.answer || item.userAnswer || item.user_answer || item.value || '',
    score: item.teacherScore ?? item.teacher_score ?? item.grade ?? item.gotScore ?? item.got_score ?? -1,
    comment: item.comment || item.teacherComment || item.teacher_comment || item.remark || item.feedback || '',
  })

  /** 通过 API 获取提交详情 */
  const fetchSubmissionDetail = async (submitId: number) => {
    // 确保作业列表已加载
    if (homeworks.value.length === 0) {
      await fetchHomeworks()
    }
    const hwMap = new Map<number, Homework>()
    for (const hw of homeworks.value) {
      hwMap.set(hw.id, hw)
    }

    // 先从本地查找（保留本地批改数据）
    let localSub = submissions.value.find(s => s.id === submitId)
    // 若内存中没找到，尝试从 localStorage 加载（防止 submissions 被刷新清空）
    if (!localSub) {
      const cachedList = loadSubmissionsFromStorage()
      localSub = cachedList.find(s => s.id === submitId)
      if (localSub) {
        // 回填到内存 submissions，使后续操作生效
        const existsInStore = submissions.value.some(s => s.id === submitId)
        if (!existsInStore) {
          submissions.value.push({ ...localSub })
        }
      }
    }

    try {
      const res: any = await getSubmitDetail(submitId)
      const d: any = res.data || res
      if (d) {
        const detail = d.data || d

        // ID 兼容多种字段名
        const detailId = detail.submitId ?? detail.submit_id ?? detail.id ?? submitId
        const score = detail.score ?? detail.totalScore ?? null
        const hwId = detail.homeworkId ?? detail.homework_id ?? 0
        const localHw = hwMap.get(hwId)

        // 提交内容：可能已经被 axios 自动解析为对象/数组
        const rawContent = detail.submitContent ?? detail.submit_content ?? detail.content ?? detail.answerContent ?? detail.answers ?? ''
        const answers = typeof rawContent === 'string' ? parseSubmitContent(rawContent) : parseSubmitContent(JSON.stringify(rawContent))

        // 从本地读取已保存的批改数据
        // 注意：localSub?.totalScore 可能为 0（有效分数），也可能为 undefined（未保存过）
        const localScore = localSub ? localSub.totalScore : undefined
        const localRemark = localSub?.remark
        const savedRemark = localRemark ?? ''
        const savedStatus = localSub?.gradingStatus

        // 构建返回数据
        // 后端详情实际字段: submitId, userRealName, userPhone, homeworkTitle, courseName, submitContent, submitFile, submitTime, score, remark
        // 学号：兼容多种字段名 + 本地已保存值，兜底为 '-'
        const studentNoValue =
          detail.studentNo ?? detail.student_no ?? detail.userStudentNo ?? detail.user_student_no ??
          detail.sno ?? detail.studentSn ?? detail.student_id ?? detail.studentId ??
          localSub?.studentNo ?? localSub?.studentId ??
          (detail.userId != null ? String(detail.userId) : '')
        // 手机号：兼容多种字段名 + 本地已保存值
        const phoneValue =
          detail.userPhone ?? detail.user_phone ?? detail.phone ?? detail.mobile ??
          detail.userMobile ?? detail.user_mobile ?? localSub?.phone ?? ''

        const result: HomeworkSubmission = {
          id: detailId,
          homeworkId: hwId,
          homeworkTitle: localHw?.title || detail.homeworkTitle || detail.homework_title || detail.title || (hwId ? `作业#${hwId}` : ''),
          courseName: detail.courseName || detail.course_name || '',
          studentId: detail.userId ?? detail.user_id ?? 0,
          studentName: detail.userRealName || detail.user_real_name || detail.userName || detail.realName || detail.real_name || detail.name || '',
          studentNo: (studentNoValue !== '' && studentNoValue != null) ? String(studentNoValue) : '-',
          department: 'software' as const,
          className: detail.className || detail.class_name || detail.userClass || localSub?.className || '',
          phone: String(phoneValue || ''),
          submitTime: detail.submitTime || detail.submit_time || detail.createTime || '',
          submitContent: typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent),
          submitFile: detail.submitFile || detail.submit_file || detail.fileUrl || '',
          answers: localSub?.answers?.length ? localSub.answers : answers,
          // 批改数据优先用本地已保存的值
          totalScore: (localScore !== undefined && localScore !== null) ? localScore : (score ?? 0),
          remark: savedRemark || detail.remark || detail.comment || '',
          gradingStatus: savedStatus || (score !== null && score !== undefined ? 'graded' : 'ungraded') as 'graded' | 'ungraded',
        }

        // 回写 className/studentNo/phone 到列表行（列表接口不返回这些字段）
        const listRow = submissions.value.find(s => s.id === detailId)
        if (listRow) {
          listRow.className = result.className || listRow.className
          listRow.studentNo = result.studentNo || listRow.studentNo
          listRow.phone = result.phone || listRow.phone
          saveSubmissionsToStorage()
        }

        return result
      }
    } catch (error) {
      console.warn('获取提交详情失败:', error)
    }
    return localSub || loadSubmissionsFromStorage().find(s => s.id === submitId) || null
  }

  /** 保存某道题的批改分数 */
  const saveAnswerGrade = (submissionId: number, questionId: number, score: number, comment: string) => {
    const sub = submissions.value.find(s => s.id === submissionId)
    if (!sub) return
    const ans = sub.answers.find(a => a.questionId === questionId)
    if (ans) {
      ans.score = score
      ans.comment = comment
    }
  }

  /** 完成批改：提交总分和评语，标记状态 */
  const completeGrading = async (submissionId: number, totalScore?: number, remark?: string) => {
    const sub = submissions.value.find(s => s.id === submissionId)
    if (!sub) return false

    // 如果传入了 totalScore 直接用；否则从 answers 计算
    const finalScore = totalScore !== undefined ? totalScore : sub.answers.reduce((s, a) => s + (a.score >= 0 ? a.score : 0), 0)

    // 调用后端评分接口
    try {
      await submitScore(submissionId, {
        score: finalScore,
        remark: remark || sub.remark || undefined,
      })
    } catch (error) {
      console.warn('提交评分接口失败，本地降级:', error)
    }

    sub.totalScore = finalScore
    sub.gradingStatus = 'graded'
    if (remark !== undefined) sub.remark = remark
    sub.gradedAt = new Date().toLocaleString('zh-CN')
    return true
  }

  /** 检查未批改的题目数 */
  const getUngradedCount = (submissionId: number) => {
    const sub = submissions.value.find(s => s.id === submissionId)
    if (!sub) return 0
    return sub.answers.filter(a => a.score < 0).length
  }

  // 已删除的提交 ID（localStorage 持久化）
  const getDeletedSubmitIds = (): Set<number> => {
    try {
      const stored = localStorage.getItem('deletedSubmitIds')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  }
  const saveDeletedSubmitId = (id: number) => {
    const ids = getDeletedSubmitIds()
    ids.add(id)
    localStorage.setItem('deletedSubmitIds', JSON.stringify([...ids]))
  }
  const saveDeletedSubmitIds = (newIds: number[]) => {
    const ids = getDeletedSubmitIds()
    newIds.forEach(id => ids.add(id))
    localStorage.setItem('deletedSubmitIds', JSON.stringify([...ids]))
  }

  // 提交数据 localStorage 持久化
  const saveSubmissionsToStorage = () => {
    try {
      localStorage.setItem('gradingSubmissions', JSON.stringify(submissions.value))
    } catch { /* ignore */ }
  }
  const loadSubmissionsFromStorage = (): HomeworkSubmission[] => {
    try {
      const cached = localStorage.getItem('gradingSubmissions')
      return cached ? JSON.parse(cached) : []
    } catch { return [] }
  }

  /** 保存单条提交的批改进度（分数+评语）到本地和 localStorage */
  const saveGradingProgress = (submitId: number, score: number, remark: string) => {
    const sub = submissions.value.find(s => s.id === submitId)
    if (sub) {
      sub.totalScore = score
      sub.remark = remark
      saveSubmissionsToStorage()
    }
  }

  /** 删除单个提交 */
  const deleteSubmission = async (submitId: number) => {
    try { await deleteSubmit(submitId) } catch { console.warn('删除提交接口失败') }
    saveDeletedSubmitId(submitId)
    submissions.value = submissions.value.filter(s => s.id !== submitId)
  }

  /** 批量删除提交 */
  const batchDeleteSubmissions = async (ids: number[]) => {
    try { await batchDeleteSubmit(ids) } catch { console.warn('批量删除提交接口失败') }
    saveDeletedSubmitIds(ids)
    const idSet = new Set(ids)
    submissions.value = submissions.value.filter(s => !idSet.has(s.id))
  }

  return {
    homeworks,
    fetchHomeworks,
    createHomework,
    updateHomework,
    deleteHomework,
    publishHomework,
    endHomework,
    newQuestionId,
    softwareHomeworks,
    stats,
    // 提交/批改
    submissions,
    fetchSubmissions,
    getSubmissionById,
    fetchSubmissionDetail,
    saveAnswerGrade,
    completeGrading,
    getUngradedCount,
    saveGradingProgress,
    deleteSubmission,
    batchDeleteSubmissions,
  }
})
