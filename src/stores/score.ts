import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getPerformanceList, getPerformanceDetail, type ApiPerformanceItem } from '@/api/score'

/** 出勤记录 */
export interface AttendanceRecord {
  courseName: string
  attended: number
  total: number
}

/** 成绩记录 */
export interface ScoreRecord {
  title: string
  score: number
  fullScore: number
}

/** 学员综合表现 */
export interface StudentRecord {
  id: number
  name: string
  studentId: string
  courseName: string
  department: 'software' | 'ai'
  className: string
  /** 作业总数 */
  homeworkCount: number
  /** 已提交数 */
  submitCount: number
  /** 平均分 */
  avgScore: number | null
  /** 提交率（如 "50%"） */
  submitRate: string
  // 以下为详情弹窗数据（来自 detail API）
  attendance: AttendanceRecord[]
  attendanceRate: number
  homeworkScores: ScoreRecord[]
  homeworkAvg: number
  examScores: ScoreRecord[]
  examAvg: number
  rating: number
}

const MOCK_STUDENTS: StudentRecord[] = [
  {
    id: 1, name: '张伟', studentId: '2024010001', courseName: 'Web前端开发实战',
    department: 'software', className: '1班',
    homeworkCount: 4, submitCount: 3, avgScore: 85, submitRate: '75%',
    attendance: [
      { courseName: 'Web前端开发实战', attended: 8, total: 10 },
      { courseName: 'Java后端开发', attended: 7, total: 8 },
    ],
    attendanceRate: 83,
    homeworkScores: [
      { title: 'HTML+CSS基础', score: 8, fullScore: 10 },
      { title: 'JavaScript练习', score: 9, fullScore: 10 },
    ],
    homeworkAvg: 85,
    examScores: [
      { title: '前端基础测试', score: 82, fullScore: 100 },
      { title: 'Java期中考试', score: 75, fullScore: 100 },
    ],
    examAvg: 79,
    rating: 82,
  },
  {
    id: 2, name: '李娜', studentId: '2024010002', courseName: 'Web前端开发实战',
    department: 'software', className: '2班',
    homeworkCount: 4, submitCount: 4, avgScore: 95, submitRate: '100%',
    attendance: [
      { courseName: 'Web前端开发实战', attended: 10, total: 10 },
      { courseName: 'Java后端开发', attended: 8, total: 8 },
    ],
    attendanceRate: 100,
    homeworkScores: [
      { title: 'HTML+CSS基础', score: 9, fullScore: 10 },
      { title: 'JavaScript练习', score: 10, fullScore: 10 },
    ],
    homeworkAvg: 95,
    examScores: [
      { title: '前端基础测试', score: 90, fullScore: 100 },
      { title: 'Java期中考试', score: 88, fullScore: 100 },
    ],
    examAvg: 89,
    rating: 94,
  },
  {
    id: 3, name: '王强', studentId: '2024010003', courseName: 'Web前端开发实战',
    department: 'software', className: '3班',
    homeworkCount: 4, submitCount: 2, avgScore: 60, submitRate: '50%',
    attendance: [
      { courseName: 'Web前端开发实战', attended: 6, total: 10 },
    ],
    attendanceRate: 60,
    homeworkScores: [
      { title: 'HTML+CSS基础', score: 6, fullScore: 10 },
    ],
    homeworkAvg: 60,
    examScores: [
      { title: '前端基础测试', score: 65, fullScore: 100 },
    ],
    examAvg: 65,
    rating: 62,
  },
  {
    id: 4, name: '刘洋', studentId: '2024010004', courseName: 'Java后端开发',
    department: 'software', className: '1班',
    homeworkCount: 4, submitCount: 3, avgScore: 75, submitRate: '75%',
    attendance: [
      { courseName: 'Web前端开发实战', attended: 9, total: 10 },
      { courseName: 'Java后端开发', attended: 6, total: 8 },
    ],
    attendanceRate: 78,
    homeworkScores: [
      { title: 'HTML+CSS基础', score: 7, fullScore: 10 },
      { title: 'JavaScript练习', score: 8, fullScore: 10 },
    ],
    homeworkAvg: 75,
    examScores: [
      { title: '前端基础测试', score: 78, fullScore: 100 },
    ],
    examAvg: 78,
    rating: 77,
  },
  {
    id: 5, name: '陈静', studentId: '2024010005', courseName: 'AI算法入门培训',
    department: 'ai', className: '1班',
    homeworkCount: 4, submitCount: 4, avgScore: 93, submitRate: '100%',
    attendance: [
      { courseName: '机器学习入门', attended: 9, total: 10 },
      { courseName: 'Python基础入门', attended: 10, total: 10 },
    ],
    attendanceRate: 95,
    homeworkScores: [
      { title: '机器学习实战', score: 14, fullScore: 15 },
      { title: 'Python编程练习', score: 9, fullScore: 10 },
    ],
    homeworkAvg: 93,
    examScores: [
      { title: 'AI导论测试', score: 37, fullScore: 40 },
      { title: 'Python期中考试', score: 88, fullScore: 100 },
    ],
    examAvg: 89,
    rating: 92,
  },
  {
    id: 6, name: '赵磊', studentId: '2024010006', courseName: 'AI算法入门培训',
    department: 'ai', className: '2班',
    homeworkCount: 4, submitCount: 1, avgScore: 67, submitRate: '25%',
    attendance: [
      { courseName: '机器学习入门', attended: 7, total: 10 },
    ],
    attendanceRate: 70,
    homeworkScores: [
      { title: '机器学习实战', score: 10, fullScore: 15 },
    ],
    homeworkAvg: 67,
    examScores: [
      { title: 'AI导论测试', score: 28, fullScore: 40 },
    ],
    examAvg: 70,
    rating: 69,
  },
  {
    id: 7, name: '周琳', studentId: '2024010007', courseName: 'Web前端开发实战',
    department: 'software', className: '2班',
    homeworkCount: 4, submitCount: 4, avgScore: 95, submitRate: '100%',
    attendance: [
      { courseName: 'Web前端开发实战', attended: 10, total: 10 },
    ],
    attendanceRate: 100,
    homeworkScores: [
      { title: 'HTML+CSS基础', score: 10, fullScore: 10 },
      { title: 'JavaScript练习', score: 9, fullScore: 10 },
    ],
    homeworkAvg: 95,
    examScores: [
      { title: '前端基础测试', score: 92, fullScore: 100 },
    ],
    examAvg: 92,
    rating: 95,
  },
  {
    id: 8, name: '吴芳', studentId: '2024010008', courseName: 'Python基础入门',
    department: 'ai', className: '3班',
    homeworkCount: 4, submitCount: 3, avgScore: 80, submitRate: '75%',
    attendance: [
      { courseName: 'Python基础入门', attended: 8, total: 10 },
    ],
    attendanceRate: 80,
    homeworkScores: [
      { title: 'Python编程练习', score: 8, fullScore: 10 },
    ],
    homeworkAvg: 80,
    examScores: [
      { title: 'Python期中考试', score: 80, fullScore: 100 },
    ],
    examAvg: 80,
    rating: 80,
  },
]

export const useScoreStore = defineStore('score', () => {
  const students = ref<StudentRecord[]>([])

  /** 将后端表现项映射为前端 StudentRecord（camelCase + snake_case 双兜底） */
  const mapPerformanceItem = (item: any): StudentRecord => {
    const avgScore = item.avgScore ?? item.avg_score ?? item.averageScore ?? null
    return {
      // 后端实际字段：userId, realName, studentId, courseName, homeworkCount, submitCount, avgScore, submitRate
      id: item.userId ?? item.user_id ?? item.id ?? 0,
      name: item.realName || item.real_name || item.name || item.studentName || '',
      studentId: item.studentId || item.student_id || item.studentNo || '',
      courseName: item.courseName || item.course_name || '',
      department: (item.department === 'ai' ? 'ai' : 'software') as 'software' | 'ai',
      className: item.className || item.class_name || item.class || '',
      homeworkCount: item.homeworkCount ?? item.homework_count ?? 0,
      submitCount: item.submitCount ?? item.submit_count ?? 0,
      avgScore,
      submitRate: item.submitRate || item.submit_rate || (avgScore != null ? `${avgScore}分` : 'N/A'),
      // 以下来自 detail API
      attendance: [],
      attendanceRate: 0,
      homeworkScores: [],
      homeworkAvg: 0,
      examScores: [],
      examAvg: 0,
      rating: item.rating ?? avgScore ?? 0,
    }
  }

  /** 将 detail API 返回的额外字段合并 */
  const mergeDetailFields = (base: StudentRecord, detail: any): StudentRecord => {
    const avgScore = detail.avgScore ?? detail.avg_score ?? base.avgScore
    return {
      ...base,
      className: detail.className || detail.class_name || base.className,
      courseName: detail.courseName || detail.course_name || base.courseName,
      attendance: (detail.attendance || detail.attendanceList || []).map((a: any) => ({
        courseName: a.courseName || a.course_name || a.name || '',
        attended: a.attended ?? a.attendCount ?? 0,
        total: a.total ?? a.totalCount ?? 0,
      })),
      attendanceRate: detail.attendanceRate ?? detail.attendance_rate ?? base.attendanceRate,
      homeworkScores: (detail.homeworkScores || detail.homework_scores || detail.homeworkList || []).map((h: any) => ({
        title: h.title || h.name || h.homeworkTitle || '',
        score: h.score ?? h.grade ?? h.studentScore ?? 0,
        fullScore: h.fullScore ?? h.full_score ?? h.maxScore ?? h.totalScore ?? 100,
      })),
      homeworkAvg: detail.homeworkAvg ?? detail.homework_avg ?? base.homeworkAvg,
      examScores: (detail.examScores || detail.exam_scores || detail.examList || []).map((e: any) => ({
        title: e.title || e.name || '',
        score: e.score ?? e.grade ?? 0,
        fullScore: e.fullScore ?? e.full_score ?? e.maxScore ?? 100,
      })),
      examAvg: detail.examAvg ?? detail.exam_avg ?? base.examAvg,
      rating: detail.rating ?? detail.totalScore ?? avgScore ?? base.rating,
    }
  }

  const fetchStudents = async () => {
    try {
      const res: any = await getPerformanceList()
      const data = res.data || res
      const list = data?.list || data?.records || (Array.isArray(data) ? data : [])
      console.log('📊 表现列表 API 原始响应:', JSON.stringify(res))
      if (list.length > 0) {
        console.log('📊 列表第一条所有字段:', JSON.stringify(list[0]))
        const apiStudents = list.map(mapPerformanceItem)
        // 合并：保留本地的 rating 等手动修改
        const merged = apiStudents.map(api => {
          const local = students.value.find(s => s.id === api.id)
          if (local) {
            return {
              ...api,
              rating: local.rating || api.rating,
              attendance: local.attendance.length > 0 ? local.attendance : api.attendance,
              attendanceRate: local.attendanceRate || api.attendanceRate,
              homeworkScores: local.homeworkScores.length > 0 ? local.homeworkScores : api.homeworkScores,
              homeworkAvg: local.homeworkAvg || api.homeworkAvg,
              examScores: local.examScores.length > 0 ? local.examScores : api.examScores,
              examAvg: local.examAvg || api.examAvg,
              className: local.className || api.className,
            }
          }
          return api
        })
        students.value = merged
        saveStudents()
        return
      }
    } catch (error) {
      console.warn('获取表现汇总列表失败，使用本地数据:', error)
    }

    const cached = localStorage.getItem('studentRecords')
    if (cached) {
      try { students.value = JSON.parse(cached); return } catch { /* ignore */ }
    }
    students.value = [...MOCK_STUDENTS]
    localStorage.setItem('studentRecords', JSON.stringify(students.value))
  }

  /** 获取学员表现详情（API 优先，失败降级本地） */
  const fetchPerformanceDetail = async (userId: number): Promise<StudentRecord | null> => {
    try {
      const res: any = await getPerformanceDetail(userId)
      const d: any = res.data || res
      console.log('📊 表现详情 API 原始响应:', JSON.stringify(res))
      const hasId = d && (d.userId || d.user_id || d.id)
      if (hasId) {
        console.log('📊 详情 data 所有字段:', JSON.stringify(d))
        return mapPerformanceItem(d)
      }
    } catch (error) {
      console.warn('获取表现详情接口失败，使用本地数据:', error)
    }
    return students.value.find(s => s.id === userId) || null
  }

  const saveStudents = () => {
    localStorage.setItem('studentRecords', JSON.stringify(students.value))
  }

  /** 更新综合评分 */
  const updateRating = (id: number, rating: number) => {
    const s = students.value.find(s => s.id === id)
    if (s) { s.rating = rating; saveStudents() }
  }

  return { students, fetchStudents, fetchPerformanceDetail, updateRating }
})
