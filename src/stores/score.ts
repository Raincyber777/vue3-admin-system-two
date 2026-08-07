import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getPerformanceList, getPerformanceDetail } from '@/api/score'

/** 作业成绩记录 */
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
  className: string
  /** 作业总数（列表接口返回） */
  homeworkCount: number
  /** 已提交数（列表接口返回） */
  submitCount: number
  /** 平均分 */
  avgScore: number | null
  /** 提交率 */
  submitRate: string
  /** 按时率（仅详情接口返回） */
  onTimeRate: string
  // 详情弹窗
  homeworkList: ScoreRecord[]
}

const MOCK_STUDENTS: StudentRecord[] = [
  {
    id: 1, name: '张伟', studentId: '2024010001', className: '1班',
    homeworkCount: 4, submitCount: 3, avgScore: 85, submitRate: '75%', onTimeRate: '80%',
    homeworkList: [
      { title: 'HTML+CSS基础', score: 8, fullScore: 10 },
      { title: 'JavaScript练习', score: 9, fullScore: 10 },
    ],
  },
  {
    id: 2, name: '李娜', studentId: '2024010002', className: '2班',
    homeworkCount: 4, submitCount: 4, avgScore: 95, submitRate: '100%', onTimeRate: '100%',
    homeworkList: [
      { title: 'HTML+CSS基础', score: 9, fullScore: 10 },
      { title: 'JavaScript练习', score: 10, fullScore: 10 },
    ],
  },
  {
    id: 3, name: '王强', studentId: '2024010003', className: '3班',
    homeworkCount: 4, submitCount: 2, avgScore: 60, submitRate: '50%', onTimeRate: '40%',
    homeworkList: [
      { title: 'HTML+CSS基础', score: 6, fullScore: 10 },
    ],
  },
  {
    id: 4, name: '刘洋', studentId: '2024010004', className: '1班',
    homeworkCount: 4, submitCount: 3, avgScore: 75, submitRate: '75%', onTimeRate: '70%',
    homeworkList: [
      { title: 'HTML+CSS基础', score: 7, fullScore: 10 },
      { title: 'JavaScript练习', score: 8, fullScore: 10 },
    ],
  },
]

export const useScoreStore = defineStore('score', () => {
  const students = ref<StudentRecord[]>([])

  /** 将后端表现项映射为前端 StudentRecord */
  const mapPerformanceItem = (item: any): StudentRecord => ({
    id: item.userId ?? item.user_id ?? item.id ?? 0,
    name: item.realName || item.real_name || item.name || '',
    studentId: item.studentId || item.student_id || item.studentNo || '',
    className: item.className || item.class_name || item.grade || item.courseName || '',
    homeworkCount: item.homeworkCount ?? item.homework_count ?? 0,
    submitCount: item.submitCount ?? item.submit_count ?? 0,
    avgScore: item.avgScore ?? item.avg_score ?? null,
    submitRate: item.submitRate || item.submit_rate || 'N/A',
    onTimeRate: item.onTimeRate || item.on_time_rate || 'N/A',
    homeworkList: (item.homeworkList || item.homework_list || []).map((h: any) => ({
      title: h.title || h.name || h.homeworkTitle || '',
      score: h.score ?? h.grade ?? 0,
      fullScore: h.fullScore ?? h.full_score ?? h.maxScore ?? 100,
    })),
  })

  const fetchStudents = async () => {
    try {
      const res: any = await getPerformanceList()
      const data = res.data || res
      const list = data?.list || data?.records || (Array.isArray(data) ? data : [])
      if (list.length > 0) {
        const apiStudents = list.map(mapPerformanceItem)
        // 合并：保留本地数据
        const merged = apiStudents.map(api => {
          const local = students.value.find(s => s.id === api.id)
          if (local) {
            return { ...api, className: local.className || api.className }
          }
          return api
        })
        students.value = merged
        return
      }
    } catch (error) {
      console.warn('获取表现汇总列表失败:', error)
    }
  }

  /** 获取学员表现详情（API 优先，失败降级本地） */
  const fetchPerformanceDetail = async (userId: number): Promise<StudentRecord | null> => {
    try {
      const res: any = await getPerformanceDetail(userId)
      const d: any = res.data || res
      const hasId = d && (d.userId || d.user_id || d.id)
      if (hasId) {
        return mapPerformanceItem(d)
      }
    } catch (error) {
      console.warn('获取表现详情接口失败，使用本地数据:', error)
    }
    return students.value.find(s => s.id === userId) || null
  }

  return { students, fetchStudents, fetchPerformanceDetail }
})
