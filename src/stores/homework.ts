import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createHomework as createHomeworkApi, updateHomeworkApi, deleteHomeworkApi, getHomeworkList, getSubmitList, getSubmitDetail, submitScore, deleteSubmit, batchDeleteSubmit } from '@/api/homework'
import type { Homework, Question } from '@/types/homework'
import { pick, readStorage, writeStorage, createDeletedIdsManager, parseListResponse, now, generateTempId } from '@/utils/common'

const deletedHomeworkIds = createDeletedIdsManager('deletedHomeworkIds')
const deletedSubmitIds = createDeletedIdsManager('deletedSubmitIds')

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
      { id: 1, order: 1, type: 'judge', title: 'HTML 是一种编程语言。', score: 5, answer: '错误' },
      { id: 2, order: 2, type: 'choice', title: '以下哪个是 CSS 中设置背景色的正确属性？', score: 10, options: ['A. color', 'B. background-color', 'C. font-size', 'D. border'], answer: 'B' },
      { id: 3, order: 3, type: 'choice', title: '在 JavaScript 中，以下哪个方法用于将 JSON 字符串转换为对象？', score: 10, options: ['A. JSON.stringify()', 'B. JSON.parse()', 'C. JSON.convert()', 'D. JSON.object()'], answer: 'B' },
      { id: 4, order: 4, type: 'essay', title: '请简述 CSS 盒模型的概念及其组成部分。', score: 10, answer: 'CSS 盒模型是网页布局的基础，每个元素都被看作一个矩形盒子。盒模型从内到外由四个部分组成：内容区域（content）、内边距（padding）、边框（border）和外边距（margin）。' },
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
      { id: 1, order: 1, type: 'judge', title: '监督学习需要带有标签的训练数据。', score: 5, answer: '正确' },
      { id: 2, order: 2, type: 'choice', title: '以下哪种算法属于无监督学习？', score: 10, options: ['A. 线性回归', 'B. K-means 聚类', 'C. 决策树分类', 'D. 支持向量机（SVM）'], answer: 'B' },
      { id: 3, order: 3, type: 'essay', title: '请简述过拟合的概念以及常用的防止过拟合的方法。', score: 15, answer: '过拟合是指模型在训练数据上表现得很好，但在测试数据或新数据上表现较差的现象。常用的防止过拟合方法包括：增加训练数据量、使用正则化、Dropout、早停、交叉验证、简化模型结构。' },
      { id: 4, order: 4, type: 'choice', title: '以下哪个激活函数可以输出负数？', score: 10, options: ['A. Sigmoid', 'B. ReLU', 'C. tanh', 'D. Softmax'], answer: 'C' },
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
  studentAnswer: string
  score: number
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
  phone: string
  submitTime: string
  submitContent: string
  submitFile: string
  answers: QuestionAnswer[]
  totalScore: number
  remark: string
  gradingStatus: 'ungraded' | 'graded'
  gradedAt?: string
}

export const useHomeworkStore = defineStore('homework', () => {
  const homeworks = ref<Homework[]>([])
  const submissions = ref<HomeworkSubmission[]>([])

  const calcTotalScore = (questions: Question[]) => questions.reduce((sum, q) => sum + q.score, 0)

  const saveHomeworks = () => writeStorage('localHomeworks', homeworks.value)
  const loadLocalHomeworks = (): Homework[] => readStorage('localHomeworks', [] as Homework[])

  const saveSubmissionsToStorage = () => writeStorage('gradingSubmissions', submissions.value)
  const loadSubmissionsFromStorage = (): HomeworkSubmission[] => readStorage('gradingSubmissions', [] as HomeworkSubmission[])

  // ==================== 作业列表 ====================
  const fetchHomeworks = async () => {
    try {
      const res: any = await getHomeworkList({ page: 1, size: 100 })
      const list = parseListResponse(res)
      const localList = [...homeworks.value]

      const matchedLocalIds = new Set<number>()
      const findLocal = (apiId: number, apiTitle: string): Homework | undefined => {
        const byId = localList.find(l => l.id === apiId)
        if (byId) { matchedLocalIds.add(byId.id); return byId }
        if (apiId > 0) {
          const byTitle = localList.find(l => l.title === apiTitle && l.id > 1000000)
          if (byTitle) { matchedLocalIds.add(byTitle.id); return byTitle }
        }
        return undefined
      }

      const mappedList = list
        .filter((item: any) => !deletedHomeworkIds.has(pick(item, 'homeworkId', 'homework_id', 0) as number))
        .map((item: any) => {
          const id = pick(item, 'homeworkId', 'homework_id', 0) as number
          const title = pick(item, 'homeworkTitle', 'homework_title', '') as string
          const local = findLocal(id, title)
          return {
            id,
            title: local?.title || title,
            department: local?.department || 'software' as const,
            publishDate: local?.publishDate || (pick(item, 'createTime', 'create_time', '') as string),
            deadline: local?.deadline || (pick(item, 'deadline', '') as string),
            questions: local?.questions || [],
            courseId: local?.courseId ?? pick(item, 'courseId', 'course_id', 0) as number,
            courseName: local?.courseName || (pick(item, 'courseName', 'course_name', '') as string),
            className: local?.className || (pick(item, 'groupName', 'group_name', '') as string),
            totalScore: local?.totalScore || calcTotalScore(local?.questions || []),
            status: local?.status || 'published' as const,
            createdAt: local?.createdAt || (pick(item, 'createTime', 'create_time', '') as string),
            createdBy: local?.createdBy || '管理员',
          }
        })

      const notYetInApi = localList.filter(l => l.id > 1000000 && !matchedLocalIds.has(l.id) && !deletedHomeworkIds.has(l.id))

      homeworks.value = [...notYetInApi, ...mappedList]
      saveHomeworks()
    } catch (error) {
      console.warn('获取作业列表失败:', error)
      homeworks.value = homeworks.value.filter(h => !deletedHomeworkIds.has(h.id))
      if (homeworks.value.length === 0) {
        homeworks.value = [...MOCK_HOMEWORKS]
        saveHomeworks()
      }
    }
  }

  const createHomework = async (data: Omit<Homework, 'id' | 'totalScore' | 'createdAt'>, courseId?: number | string) => {
    const tempId = generateTempId()
    const localHw: Homework = { ...data, id: tempId, totalScore: calcTotalScore(data.questions || []), createdAt: now() }
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
        groupName: className && className !== '全部班级' ? className : undefined,
      }
      const res: any = await createHomeworkApi(apiParams)

      const backendId = pick(res?.data, 'homeworkId', 'homework_id', 'id', null) ?? pick(res, 'homeworkId', 'id', null)
      if (backendId) {
        const idx = homeworks.value.findIndex(h => h.id === tempId)
        if (idx !== -1) {
          homeworks.value[idx].id = backendId as number
          saveHomeworks()
        }
      }
      await fetchHomeworks()
    } catch (error: any) {
      console.warn('布置作业接口失败:', error)
      throw error
    }
  }

  const updateHomework = async (id: number, data: Partial<Omit<Homework, 'id' | 'createdAt'>>, courseId?: number | string) => {
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
        groupName: className && className !== '全部班级' ? className : undefined,
      })
      await fetchHomeworks()
    } catch (error: any) {
      console.warn('编辑作业接口失败:', error)
      throw error
    }
  }

  const deleteHomework = async (id: number) => {
    if (id <= 1000000) {
      try { await deleteHomeworkApi(id) } catch (error) { console.warn('删除作业接口失败:', error) }
    }
    deletedHomeworkIds.add(id)
    homeworks.value = homeworks.value.filter(h => h.id !== id)
    saveHomeworks()
  }

  const publishHomework = (id: number) => {
    const hw = homeworks.value.find(h => h.id === id)
    if (hw) { hw.status = 'published'; hw.publishDate = now(); saveHomeworks() }
  }

  const endHomework = (id: number) => {
    const hw = homeworks.value.find(h => h.id === id)
    if (hw) { hw.status = 'ended'; saveHomeworks() }
  }

  const newQuestionId = (hwId: number) => {
    const hw = homeworks.value.find(h => h.id === hwId)
    return hw ? Math.max(0, ...hw.questions.map(q => q.id)) + 1 : 1
  }

  const softwareHomeworks = computed(() => homeworks.value.filter(h => h.department === 'software'))
  const stats = computed(() => ({
    total: homeworks.value.length,
    published: homeworks.value.filter(h => h.status === 'published').length,
    draft: homeworks.value.filter(h => h.status === 'draft').length,
    ended: homeworks.value.filter(h => h.status === 'ended').length,
  }))

  // ==================== 学生提交 ====================
  const parseSubmitContent = (content: string): QuestionAnswer[] => {
    if (!content) return []
    if (typeof content !== 'string') {
      const arr = Array.isArray(content) ? content : (content.answers || content.list || content.questions || [])
      return Array.isArray(arr) ? arr.map(mapAnswerItem) : []
    }
    try {
      const parsed = JSON.parse(content)
      const arr = Array.isArray(parsed) ? parsed : (parsed.answers || parsed.list || parsed.questions || [])
      return Array.isArray(arr) ? arr.map(mapAnswerItem) : []
    } catch {
      return [{ questionId: 0, questionOrder: 1, questionType: 'essay', questionTitle: '提交内容', questionScore: 0, studentAnswer: content, score: -1, comment: '' }]
    }
  }

  const mapAnswerItem = (item: any, idx = 0): QuestionAnswer => ({
    questionId: pick(item, 'questionId', 'question_id', 'id', idx) as number,
    questionOrder: pick(item, 'questionOrder', 'question_order', 'order', 'seq', idx + 1) as number,
    questionType: pick(item, 'questionType', 'question_type', 'type', 'qtype', 'essay') as string,
    questionTitle: pick(item, 'questionTitle', 'question_title', 'title', 'content', 'question', 'name', '') as string,
    questionScore: pick(item, 'questionScore', 'question_score', 'maxScore', 'max_score', 'points', 0) as number,
    studentAnswer: pick(item, 'studentAnswer', 'student_answer', 'answer', 'userAnswer', 'user_answer', 'value', '') as string,
    score: pick(item, 'teacherScore', 'teacher_score', 'grade', 'gotScore', 'got_score', -1) as number,
    comment: pick(item, 'comment', 'teacherComment', 'teacher_comment', 'remark', 'feedback', '') as string,
  })

  const fetchSubmissions = async (params?: { groupName?: string; homeworkId?: number | string; courseId?: number | string }) => {
    try {
      const res: any = await getSubmitList(params)
      const list = parseListResponse(res)
      if (list.length > 0) {
        const hwMap = new Map<number, Homework>()
        homeworks.value.forEach(hw => hwMap.set(hw.id, hw))

        const apiSubmissions = list
          .filter((item: any) => !deletedSubmitIds.has(pick(item, 'submitId', 'submit_id', 'id', 0) as number))
          .map((item: any) => {
            const hwId = pick(item, 'homeworkId', 'homework_id', 0) as number
            const localHw = hwMap.get(hwId)
            return {
              id: pick(item, 'submitId', 'submit_id', 'id', 0) as number,
              homeworkId: hwId,
              homeworkTitle: pick(item, 'homeworkTitle', 'homework_title', 'title', '') || localHw?.title || (hwId ? `作业#${hwId}` : ''),
              courseName: pick(item, 'courseName', 'course_name', '') as string,
              studentId: pick(item, 'userId', 'user_id', 0) as number,
              studentName: pick(item, 'realName', 'userRealName', 'real_name', 'studentName', 'name', '') as string,
              studentNo: pick(item, 'studentNo', 'student_no', 'sno', '') as string,
              department: 'software' as const,
              className: pick(item, 'groupName', 'group_name', 'className', 'class_name', '') as string,
              phone: pick(item, 'userPhone', 'user_phone', 'phone', '') as string,
              submitTime: pick(item, 'submitTime', 'submit_time', 'createTime', '') as string,
              submitContent: pick(item, 'submitContent', 'submit_content', '') as string,
              submitFile: pick(item, 'submitFile', 'submit_file', '') as string,
              answers: [] as QuestionAnswer[],
              totalScore: pick(item, 'score', 0) as number,
              remark: pick(item, 'remark', '') as string,
              gradingStatus: (pick(item, 'score') != null ? 'graded' : 'ungraded') as 'graded' | 'ungraded',
            }
          })

        const mergedSubmissions = apiSubmissions.map(api => {
          const local = submissions.value.find(s => s.id === api.id)
          if (local) {
            return {
              ...api,
              answers: local.answers.length > 0 ? local.answers : api.answers,
              totalScore: local.totalScore > 0 || local.remark ? local.totalScore : api.totalScore,
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
      }
    } catch (error) {
      console.warn('获取提交列表失败:', error)
    }
  }

  const getSubmissionById = (id: number) => submissions.value.find(s => s.id === id)

  const fetchSubmissionDetail = async (submitId: number) => {
    if (homeworks.value.length === 0) await fetchHomeworks()

    const hwMap = new Map<number, Homework>()
    homeworks.value.forEach(hw => hwMap.set(hw.id, hw))

    let localSub = submissions.value.find(s => s.id === submitId)
    if (!localSub) {
      const cachedList = loadSubmissionsFromStorage()
      localSub = cachedList.find(s => s.id === submitId)
      if (localSub && !submissions.value.some(s => s.id === submitId)) {
        submissions.value.push({ ...localSub })
      }
    }

    try {
      const res: any = await getSubmitDetail(submitId)
      const d = res?.data || res
      if (d) {
        const detail = d.data || d
        const detailId = pick(detail, 'submitId', 'submit_id', 'id', submitId) as number
        const score = pick(detail, 'score', 'totalScore', null)
        const hwId = pick(detail, 'homeworkId', 'homework_id', 0) as number
        const localHw = hwMap.get(hwId)

        const rawContent = pick(detail, 'submitContent', 'submit_content', 'content', 'answerContent', 'answers', '')
        const answers = typeof rawContent === 'string' ? parseSubmitContent(rawContent) : parseSubmitContent(JSON.stringify(rawContent))

        const localScore = localSub ? localSub.totalScore : undefined
        const savedRemark = localSub?.remark ?? ''
        const savedStatus = localSub?.gradingStatus

        const studentNoValue = (pick(detail, 'studentNo', 'student_no', 'userStudentNo', 'user_student_no', 'sno', 'studentSn', 'student_id', 'studentId') as string) || localSub?.studentNo || ''
        const phoneValue = (pick(detail, 'userPhone', 'user_phone', 'phone', 'mobile', 'userMobile', 'user_mobile') as string) || localSub?.phone || ''

        const result: HomeworkSubmission = {
          id: detailId,
          homeworkId: hwId,
          homeworkTitle: localHw?.title || pick(detail, 'homeworkTitle', 'homework_title', 'title', '') || (hwId ? `作业#${hwId}` : ''),
          courseName: pick(detail, 'courseName', 'course_name', '') as string,
          studentId: pick(detail, 'userId', 'user_id', 0) as number,
          studentName: pick(detail, 'userRealName', 'user_real_name', 'userName', 'realName', 'real_name', 'name', '') as string,
          studentNo: studentNoValue || '-',
          department: 'software' as const,
          className: (pick(detail, 'className', 'class_name', 'userClass') as string) || localSub?.className || '',
          phone: phoneValue || '',
          submitTime: pick(detail, 'submitTime', 'submit_time', 'createTime', '') as string,
          submitContent: typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent),
          submitFile: pick(detail, 'submitFile', 'submit_file', 'fileUrl', '') as string,
          answers: localSub?.answers?.length ? localSub.answers : answers,
          totalScore: localScore !== undefined && localScore !== null ? localScore : (score ?? 0),
          remark: savedRemark || pick(detail, 'remark', 'comment', '') as string,
          gradingStatus: savedStatus || (score !== null && score !== undefined ? 'graded' : 'ungraded') as 'graded' | 'ungraded',
        }

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

  const saveAnswerGrade = (submissionId: number, questionId: number, score: number, comment: string) => {
    const sub = submissions.value.find(s => s.id === submissionId)
    const ans = sub?.answers.find(a => a.questionId === questionId)
    if (ans) { ans.score = score; ans.comment = comment }
  }

  const completeGrading = async (submissionId: number, totalScore?: number, remark?: string) => {
    const sub = submissions.value.find(s => s.id === submissionId)
    if (!sub) return false

    const finalScore = totalScore !== undefined ? totalScore : sub.answers.reduce((s, a) => s + (a.score >= 0 ? a.score : 0), 0)

    try {
      await submitScore(submissionId, { score: finalScore, remark: remark || sub.remark || undefined })
    } catch (error) {
      console.warn('提交评分接口失败，本地降级:', error)
    }

    sub.totalScore = finalScore
    sub.gradingStatus = 'graded'
    if (remark !== undefined) sub.remark = remark
    sub.gradedAt = now()
    saveSubmissionsToStorage()
    return true
  }

  const getUngradedCount = (submissionId: number) => {
    const sub = submissions.value.find(s => s.id === submissionId)
    return sub ? sub.answers.filter(a => a.score < 0).length : 0
  }

  const saveGradingProgress = (submitId: number, score: number, remark: string) => {
    const sub = submissions.value.find(s => s.id === submitId)
    if (sub) { sub.totalScore = score; sub.remark = remark; saveSubmissionsToStorage() }
  }

  const deleteSubmission = async (submitId: number) => {
    try { await deleteSubmit(submitId) } catch { console.warn('删除提交接口失败') }
    deletedSubmitIds.add(submitId)
    submissions.value = submissions.value.filter(s => s.id !== submitId)
    saveSubmissionsToStorage()
  }

  const batchDeleteSubmissions = async (ids: number[]) => {
    try { await batchDeleteSubmit(ids) } catch { console.warn('批量删除提交接口失败') }
    deletedSubmitIds.addMany(ids)
    const idSet = new Set(ids)
    submissions.value = submissions.value.filter(s => !idSet.has(s.id))
    saveSubmissionsToStorage()
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
