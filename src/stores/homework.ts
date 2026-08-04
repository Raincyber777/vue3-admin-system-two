import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createHomework as createHomeworkApi, updateHomeworkApi, deleteHomeworkApi, getHomeworkList, getSubmitList, getSubmitDetail, submitScore, deleteSubmit, batchDeleteSubmit, type ApiHomeworkItem, type ApiSubmitItem, type SubmitDetail } from '@/api/homework'
import type { Homework, Question, QuestionType } from '@/types/homework'

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

  // ==================== 数据加载 ====================
  const fetchHomeworks = async () => {
    try {
      const res: any = await getHomeworkList()
      const data = res.data || res
      const list = data?.list || (Array.isArray(data) ? data : [])
      homeworks.value = list.map((item: any) => ({
        id: item.homeworkId ?? item.homework_id ?? 0,
        title: item.homeworkTitle ?? item.homework_title ?? '',
        department: 'software' as const,
        publishDate: item.createTime ?? item.create_time ?? '',
        deadline: item.deadline || '',
        questions: [],
        courseId: item.courseId ?? item.course_id ?? 0,
        courseName: item.courseName ?? item.course_name ?? '',
        className: item.groupName || item.group_name || '',
        totalScore: 0,
        status: 'published' as const,
        createdAt: item.createTime ?? item.create_time ?? '',
        createdBy: '管理员',
      }))
    } catch (error) {
      console.warn('获取作业列表失败:', error)
      homeworks.value = []
    }
  }

  // ==================== CRUD ====================
  const createHomework = async (data: Omit<Homework, 'id' | 'totalScore' | 'createdAt'>, courseId?: number | string) => {
    try {
      await createHomeworkApi({
        homeworkTitle: data.title,
        homeworkContent: data.questions.map(q => q.title).join('；') || data.title,
        deadline: data.deadline || '',
        courseId: courseId || 0,
        groupName: (data as any).className || '',
      })
      await fetchHomeworks()
    } catch (error) {
      console.warn('布置作业接口失败:', error)
      throw error
    }
  }

  const updateHomework = async (id: number, data: Partial<Omit<Homework, 'id' | 'createdAt'>>, courseId?: number | string) => {
    try {
      await updateHomeworkApi(id, {
        homeworkTitle: data.title,
        homeworkContent: data.questions ? JSON.stringify(data.questions) : undefined,
        deadline: data.deadline,
        courseId: courseId || 0,
        groupName: (data as any).className || '',
      })
      await fetchHomeworks()
    } catch (error) {
      console.warn('编辑作业接口失败:', error)
      throw error
    }
  }

  const deleteHomework = async (id: number) => {
    try {
      await deleteHomeworkApi(id)
    } catch (error) {
      console.warn('删除作业接口失败:', error)
    }
    homeworks.value = homeworks.value.filter(h => h.id !== id)
  }

  const publishHomework = (id: number) => {
    const hw = homeworks.value.find(h => h.id === id)
    if (hw) {
      hw.status = 'published'
      hw.publishDate = new Date().toLocaleString('zh-CN')
    }
  }

  const endHomework = (id: number) => {
    const hw = homeworks.value.find(h => h.id === id)
    if (hw) {
      hw.status = 'ended'
      saveToStorage()
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
    try {
      const res: any = await getSubmitList(params)
      const data = res.data || res
      const list = data?.list || data?.records || (Array.isArray(data) ? data : [])
      if (list.length > 0) {
        const hwMap = new Map<number, Homework>()
        for (const hw of homeworks.value) { hwMap.set(hw.id, hw) }

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
            studentNo: item.studentNo || item.student_no || String(item.userId ?? ''),
            department: 'software' as const,
            className: item.groupName || item.group_name || item.className || item.class_name || '',
            phone: item.userPhone || item.user_phone || '',
            submitTime: item.submitTime || item.submit_time || item.createTime || '',
            submitContent: item.submitContent || item.submit_content || '',
            submitFile: item.submitFile || item.submit_file || '',
            answers: [] as QuestionAnswer[],
            totalScore: score ?? 0,
            remark: item.remark || '',
            gradingStatus: (score !== null && score !== undefined ? 'graded' : 'ungraded') as 'graded' | 'ungraded',
          }
        })

        // 合并：保留本地已有的批改数据（answers、score、remark 等）
        const mergedSubmissions = apiSubmissions.map(api => {
          const local = submissions.value.find(s => s.id === api.id)
          if (local) {
            return {
              ...api,
              answers: local.answers.length > 0 ? local.answers : api.answers,
              totalScore: local.gradingStatus === 'graded' ? local.totalScore : api.totalScore,
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
        return
      }
    } catch (error) {
      console.warn('获取提交列表失败:', error)
    }
    submissions.value = []
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
      console.log('📝 submitContent 为非 JSON 文本，长度:', content.length)
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

    try {
      const res: any = await getSubmitDetail(submitId)
      const d: any = res.data || res
      console.log('🔍 提交详情 API 原始响应:', JSON.stringify(res))
      if (d) {
        // 可能 d.data 还有一层嵌套
        const detail = d.data || d
        // 打印所有 key 方便排查
        console.log('🔍 详情 data 所有 key:', Object.keys(detail))
        console.log('🔍 详情 data 完整内容:', JSON.stringify(detail))

        // ID 兼容多种字段名
        const detailId = detail.submitId ?? detail.submit_id ?? detail.id ?? submitId
        const score = detail.score ?? detail.totalScore ?? null
        const hwId = detail.homeworkId ?? detail.homework_id ?? 0
        const localHw = hwMap.get(hwId)

        // 提交内容：可能已经被 axios 自动解析为对象/数组
        const rawContent = detail.submitContent ?? detail.submit_content ?? detail.content ?? detail.answerContent ?? detail.answers ?? ''
        const answers = typeof rawContent === 'string' ? parseSubmitContent(rawContent) : parseSubmitContent(JSON.stringify(rawContent))

        // 构建返回数据
        // 后端详情实际字段: submitId, userRealName, userPhone, homeworkTitle, courseName, submitContent, submitFile, submitTime, score, remark
        const result: HomeworkSubmission = {
          id: detailId,
          homeworkId: hwId,
          homeworkTitle: localHw?.title || detail.homeworkTitle || detail.homework_title || detail.title || (hwId ? `作业#${hwId}` : ''),
          courseName: detail.courseName || detail.course_name || '',
          studentId: detail.userId ?? detail.user_id ?? 0,
          studentName: detail.userRealName || detail.user_real_name || detail.userName || detail.realName || detail.real_name || detail.name || '',
          studentNo: detail.studentNo || detail.student_no || String(detail.userId ?? ''),
          department: 'software' as const,
          className: detail.className || detail.class_name || detail.userClass || '',
          phone: detail.userPhone || detail.user_phone || detail.phone || detail.mobile || '',
          submitTime: detail.submitTime || detail.submit_time || detail.createTime || '',
          submitContent: typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent),
          submitFile: detail.submitFile || detail.submit_file || detail.fileUrl || '',
          answers,
          totalScore: score ?? 0,
          remark: detail.remark || detail.comment || '',
          gradingStatus: (score !== null && score !== undefined ? 'graded' : 'ungraded') as 'graded' | 'ungraded',
        }

        // 回写 className 到列表行（列表接口不返回班级）
        if (result.className) {
          const listRow = submissions.value.find(s => s.id === detailId)
          if (listRow && !listRow.className) {
            listRow.className = result.className
            listRow.studentNo = listRow.studentNo || result.studentNo
            listRow.phone = listRow.phone || result.phone
                  }
        }

        return result
      }
    } catch (error) {
      console.warn('获取提交详情失败:', error)
    }
    return getSubmissionById(submitId) || null
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
    deleteSubmission,
    batchDeleteSubmissions,
  }
})
