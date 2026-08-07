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
      students.value = list.map(mapPerformanceItem)
    } catch (error) {
      console.warn('获取表现汇总列表失败:', error)
      students.value = []
    }
  }

  /** 获取学员表现详情（纯 API） */
  const fetchPerformanceDetail = async (userId: number): Promise<StudentRecord | null> => {
    try {
      const res: any = await getPerformanceDetail(userId)
      const d: any = res.data || res
      if (d && (d.userId || d.user_id || d.id)) {
        return mapPerformanceItem(d)
      }
    } catch (error) {
      console.warn('获取表现详情失败:', error)
    }
    return null
  }

  return { students, fetchStudents, fetchPerformanceDetail }
})
