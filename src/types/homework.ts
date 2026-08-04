/** 题目类型 */
export type QuestionType = 'judge' | 'choice' | 'essay'

/** 选择题选项标签 */
export const CHOICE_LABELS = ['A', 'B', 'C', 'D']

/** 单道题目 */
export interface Question {
  id: number
  /** 题号（第1题、第2题...） */
  order: number
  /** 题目类型 */
  type: QuestionType
  /** 题目内容 */
  title: string
  /** 分值 */
  score: number
  /** 选择题选项，如 ['A. HTML是编程语言', 'B. HTML是标记语言', ...] */
  options?: string[]
  /** 正确答案：
   *  - judge: '正确' | '错误'
   *  - choice: 'A' | 'B' | 'C' | 'D'
   *  - essay: 参考答案文本
   */
  answer: string
}

/** 作业（题集） */
export interface Homework {
  id: number
  title: string
  department: 'software'
  publishDate: string
  deadline: string
  questions: Question[]
  /** 关联的课程 ID */
  courseId?: number | string
  /** 关联的课程名称 */
  courseName?: string
  /** 总分（各题分值自动求和） */
  totalScore: number
  status: 'draft' | 'published' | 'ended'
  createdAt: string
  createdBy: string
}

/** 题目类型显示标签 */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  judge: '判断题',
  choice: '选择题',
  essay: '解答题',
}

/** 题目类型标签颜色 */
export const QUESTION_TYPE_COLORS: Record<QuestionType, string> = {
  judge: 'warning',
  choice: 'primary',
  essay: 'success',
}
