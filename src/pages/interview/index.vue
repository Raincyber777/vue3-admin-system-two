<template>
  <div class="homework-page">
    <PageHeaderCard title="作业发布" subtitle="Homework Publishing">
      <template #icon><el-icon><Notebook /></el-icon></template>
      <template #default>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">作业总数</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value stat-published">{{ stats.published }}</span>
            <span class="stat-label">已发布</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value stat-draft">{{ stats.draft }}</span>
            <span class="stat-label">草稿</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value stat-ended">{{ stats.ended }}</span>
            <span class="stat-label">已结束</span>
          </div>
        </div>
      </template>
    </PageHeaderCard>

    <!-- 筛选 + 工具栏 -->
    <div class="toolbar-card">
      <div class="toolbar-left">
        <el-radio-group v-model="filterStatus" size="small" style="margin-left: 16px;">
          <el-radio-button value="all">全部状态</el-radio-button>
          <el-radio-button value="published">已发布</el-radio-button>
          <el-radio-button value="draft">草稿</el-radio-button>
          <el-radio-button value="ended">已结束</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon> 新建作业
        </el-button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <el-table :data="currentPageData" border stripe class="homework-table"
        :header-cell-style="{ backgroundColor:'#f8fafc', color:'#475569', fontWeight:'600' }">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="title" label="作业标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="题数" width="70" align="center">
          <template #default="{ row }">{{ row.questions?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="totalScore" label="总分" width="80" align="center" />
        <el-table-column prop="publishDate" label="发布日期" width="150" align="center" />
        <el-table-column prop="deadline" label="截止日期" width="150" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <span :class="['status-tag', 'status-' + row.status]">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openPreview(row)"><el-icon><View /></el-icon>预览</el-button>
            <el-button type="primary" link @click="openEditDialog(row)"><el-icon><Edit /></el-icon>编辑</el-button>
            <template v-if="row.status === 'draft'">
              <el-button type="success" link @click="handleTablePublish(row)"><el-icon><CircleCheck /></el-icon>发布</el-button>
            </template>
            <el-popconfirm title="确定删除该作业？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" link><el-icon><Delete /></el-icon>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="pagination-info">
          共 <strong>{{ filteredList.length }}</strong> 条记录，每页显示
          <el-select v-model="pageSize" size="small" class="page-size-select" @change="handleSizeChange">
            <el-option :value="10" label="10" />
            <el-option :value="20" label="20" />
            <el-option :value="30" label="30" />
          </el-select>
          条
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30]"
          :total="filteredList.length"
          layout="prev, pager, next"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- ======== 新建/编辑弹窗 ======== -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑作业' : '新建作业'"
      width="900px" destroy-on-close top="3vh" class="homework-dialog">
      <div class="dialog-body">
        <!-- 基本信息 -->
        <div class="form-section">
          <h4 class="section-title">基本信息</h4>
          <el-form :model="form" label-width="80px" class="base-form">
            <el-form-item label="作业标题" required>
              <el-input v-model="form.title" placeholder="请输入作业标题" maxlength="100" />
            </el-form-item>
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="关联课程" label-width="80px" required>
                  <el-select v-model="form.courseId" style="width:100%" placeholder="请选择课程">
                    <el-option v-for="c in courseOptions" :key="c.value" :label="c.label" :value="c.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="发布日期" label-width="80px">
                  <el-date-picker v-model="form.publishDate" type="datetime" placeholder="选择日期"
                    format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="截止日期" label-width="80px">
                  <el-date-picker v-model="form.deadline" type="datetime" placeholder="选择日期"
                    format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" style="width:100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 题目列表 -->
        <div class="form-section">
          <div class="question-header">
            <h4 class="section-title">题目列表 <span class="sub">（共 {{ form.questions.length }} 题，总分 {{ calcTotal }} 分）</span></h4>
          </div>

          <div v-if="form.questions.length === 0" class="empty-questions">
            <el-empty description="暂无题目，点击上方按钮添加" :image-size="80" />
          </div>

          <div v-for="(q, qi) in form.questions" :key="q._key" class="question-card" :class="{ collapsed: q._collapsed }">
            <div class="q-header" @click="q._collapsed = !q._collapsed">
              <div class="q-summary">
                <el-tag size="small" :type="q.type === 'judge' ? 'warning' : q.type === 'choice' ? '' : 'success'" class="q-type-tag">
                  {{ typeLabel(q.type) }}
                </el-tag>
                <span class="q-title-text">第{{ qi + 1 }}题：{{ q.title || '(未填写)' }}</span>
                <span class="q-score">{{ q.score }}分</span>
              </div>
              <div class="q-actions" @click.stop>
                <el-button type="primary" link size="small" @click.stop="moveQuestion(qi, -1)" :disabled="qi === 0">
                  <el-icon><Top /></el-icon>
                </el-button>
                <el-button type="primary" link size="small" @click.stop="moveQuestion(qi, 1)" :disabled="qi === form.questions.length - 1">
                  <el-icon><Bottom /></el-icon>
                </el-button>
                <el-button type="danger" link size="small" @click.stop="removeQuestion(qi)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div v-show="!q._collapsed" class="q-body">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-form-item label="题目类型" label-width="80px">
                    <el-select v-model="q.type" @change="onTypeChange(q)" style="width:100%">
                      <el-option label="判断题" value="judge" />
                      <el-option label="选择题" value="choice" />
                      <el-option label="解答题" value="essay" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="分值" label-width="80px">
                    <el-input-number v-model="q.score" :min="1" :max="100" style="width:100%" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="题目内容" label-width="80px">
                <el-input v-model="q.title" type="textarea" :rows="2" placeholder="请输入题目内容" />
              </el-form-item>

              <!-- 选择题选项 -->
              <template v-if="q.type === 'choice'">
                <el-form-item label="选项设置" label-width="80px">
                  <div class="options-editor">
                    <div v-for="(opt, oi) in q.options" :key="oi" class="option-row">
                      <el-tag size="small" class="opt-label">{{ optionLabel(oi) }}</el-tag>
                      <el-input v-model="q.options[oi]" :placeholder="'选项 ' + optionLabel(oi) + ' 的内容'" size="small" style="flex:1" />
                      <el-button v-if="q.options!.length > 2" type="danger" link size="small" @click="q.options!.splice(oi, 1)">
                        <el-icon><Close /></el-icon>
                      </el-button>
                    </div>
                    <el-button v-if="(q.options?.length || 0) < 6" size="small" @click="addOption(q)" class="add-opt-btn">
                      <el-icon><Plus /></el-icon> 添加选项
                    </el-button>
                  </div>
                </el-form-item>
                <el-form-item label="正确答案" label-width="80px">
                  <el-checkbox-group v-model="q.choiceAnswers" class="answer-checkboxes">
                    <el-checkbox v-for="(opt, oi) in q.options" :key="oi" :label="optionLabel(oi)">
                      {{ optionLabel(oi) }}. {{ opt.replace(/^[A-F]\.\s*/, '') }}
                    </el-checkbox>
                  </el-checkbox-group>
                  <span v-if="q.choiceAnswers.length === 0" class="no-answer-hint">请至少勾选一个正确答案</span>
                </el-form-item>
              </template>

              <!-- 判断题答案 -->
              <template v-if="q.type === 'judge'">
                <el-form-item label="正确答案" label-width="80px">
                  <el-radio-group v-model="q.answer">
                    <el-radio value="正确">正确</el-radio>
                    <el-radio value="错误">错误</el-radio>
                  </el-radio-group>
                </el-form-item>
              </template>

              <!-- 解答题答案 -->
              <template v-if="q.type === 'essay'">
                <el-form-item label="参考答案" label-width="80px">
                  <el-input v-model="q.answer" type="textarea" :rows="3" placeholder="请输入参考答案（供评分参考）" />
                </el-form-item>
              </template>
            </div>
          </div>

          <!-- 添加题目按钮（列表末尾） -->
          <div class="add-question-bottom">
            <el-button size="small" @click="addQuestion">
              <el-icon><Plus /></el-icon> 添加题目
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer-left">
          <el-button @click="dialogVisible = false">取消</el-button>
        </div>
        <div class="dialog-footer-right">
          <template v-if="!isEditing">
            <el-button @click="handleSaveDraft" :loading="saveLoading">
              <el-icon><Folder /></el-icon> 存为草稿
            </el-button>
            <el-button type="primary" @click="handlePublishClick" :loading="saveLoading">
              发布作业
            </el-button>
          </template>
          <template v-else>
            <el-button type="primary" @click="handleEditSave" :loading="saveLoading">
              保存修改
            </el-button>
          </template>
        </div>
      </template>
    </el-dialog>

    <!-- ======== 发布确认弹窗 ======== -->
    <el-dialog v-model="publishConfirmVisible" title="确认发布" width="420px"
      destroy-on-close align-center class="publish-confirm-dialog">
      <div class="confirm-body">
        <el-icon class="confirm-icon"><WarningFilled /></el-icon>
        <p>确定要发布该作业吗？</p>
        <p class="confirm-detail">发布后学生即可查看并提交作业，发布前请确认题目和答案设置无误。</p>
      </div>
      <template #footer>
        <el-button @click="publishConfirmVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmPublish" :loading="saveLoading">
          确认发布
        </el-button>
      </template>
    </el-dialog>

    <!-- ======== 预览弹窗（试卷样式） ======== -->
    <el-dialog v-model="previewVisible" :title="previewHw?.title || '作业预览'"
      width="750px" destroy-on-close top="3vh" class="preview-dialog">
      <div v-if="previewHw" class="paper">
        <div class="paper-header">
          <div class="paper-info">
            <span>总分：<strong>{{ previewHw.totalScore }}</strong>分</span>
            <span>题数：<strong>{{ previewHw.questions.length }}</strong>道</span>
            <span>截止：<strong>{{ previewHw.deadline }}</strong></span>
          </div>
        </div>
        <div v-for="q in previewHw.questions" :key="q.id" class="paper-question">
          <div class="pq-title">
            <el-tag size="small" :type="q.type === 'judge' ? 'warning' : q.type === 'choice' ? '' : 'success'">
              {{ typeLabel(q.type) }}
            </el-tag>
            <span class="pq-num">第{{ q.order }}题</span>
            <span class="pq-score">（{{ q.score }}分）</span>
          </div>
          <div class="pq-content">{{ q.title }}</div>
          <!-- 选择题选项 -->
          <div v-if="q.type === 'choice' && q.options" class="pq-options">
            <div v-for="(opt, oi) in q.options" :key="oi" class="pq-opt">
              <el-checkbox :model-value="false" disabled />
              <span class="pq-opt-label">{{ optionLabel(oi) }}.</span>
              <span>{{ opt.replace(/^[A-F]\.\s*/, '') }}</span>
            </div>
          </div>
          <!-- 判断题选项 -->
          <div v-if="q.type === 'judge'" class="pq-options">
            <div class="pq-opt"><el-radio disabled /> 正确</div>
            <div class="pq-opt"><el-radio disabled /> 错误</div>
          </div>
          <!-- 解答题区域 -->
          <div v-if="q.type === 'essay'" class="pq-essay-area">
            <div class="essay-placeholder">（学生在此作答）</div>
          </div>
          <!-- 正确答案（管理员可见） -->
          <div class="pq-answer">
            <span class="answer-label">正确答案：</span>
            <template v-if="q.type === 'choice'">
              {{ q.answer.split(',').filter(Boolean).join('、') }}
            </template>
            <template v-else>{{ q.answer }}</template>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Notebook, Plus, View, Edit, Delete, CircleCheck, Top, Bottom, Close, Folder, WarningFilled
} from '@element-plus/icons-vue'
import PageHeaderCard from '@/components/PageHeaderCard.vue'
import { useHomeworkStore } from '@/stores/homework'
import { useTrainingCourseStore } from '@/stores/training-course'
import { QUESTION_TYPE_LABELS } from '@/types/homework'
import type { Homework, Question } from '@/types/homework'

const store = useHomeworkStore()
const courseStore = useTrainingCourseStore()

// 课程列表（从课程管理 store 读取）
const courseOptions = ref<Array<{ label: string; value: string | number; valid: boolean }>>([])
const loadCourses = async () => {
  await courseStore.fetchCourses()
  courseOptions.value = courseStore.courses
    .filter(c => c.name && c.id)
    .map(c => ({
      label: c.name + (/^\d+$/.test(String(c.id)) ? '' : '（未同步到后端，不可用）'),
      value: /^\d+$/.test(String(c.id)) ? Number(c.id) : String(c.id),
      valid: /^\d+$/.test(String(c.id)),
    }))
}

// ==================== 筛选 ====================
const filterStatus = ref('all')

const filteredList = computed(() => {
  let list = [...store.homeworks]
  if (filterStatus.value !== 'all') {
    list = list.filter(h => h.status === filterStatus.value)
  }
  return list
})

// ==================== 分页 ====================
const currentPage = ref(1)
const pageSize = ref(10)

const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const handleSizeChange = () => { currentPage.value = 1 }
const handleCurrentChange = (page: number) => { currentPage.value = page }

const stats = computed(() => {
  const list = store.homeworks
  return {
    total: list.length,
    published: list.filter(h => h.status === 'published').length,
    draft: list.filter(h => h.status === 'draft').length,
    ended: list.filter(h => h.status === 'ended').length,
  }
})

// ==================== 辅助 ====================
const statusText = (s: string) => ({ draft: '草稿', published: '已发布', ended: '已结束' }[s] || s)
const typeLabel = (t: string) => (QUESTION_TYPE_LABELS as Record<string, string>)[t] || t

// ==================== 编辑表单 ====================
interface QForm extends Question {
  _key: number
  _collapsed: boolean
  /** 选择题多选答案数组 */
  choiceAnswers: string[]
}
interface HwForm {
  title: string
  courseId: number | string
  publishDate: string
  deadline: string
  questions: QForm[]
}

let qKeyGen = 100
const makeQForm = (q?: Partial<Question>): QForm => {
  const type = q?.type ?? 'judge'
  const answer = q?.answer ?? (type === 'judge' ? '正确' : '')
  // 选择题：解析逗号分隔的答案到 choiceAnswers 数组
  const choiceAnswers = (type === 'choice' && answer) ? answer.split(',').filter(Boolean) : []
  return {
    id: q?.id ?? 0,
    order: q?.order ?? 0,
    type,
    title: q?.title ?? '',
    score: q?.score ?? 5,
    options: q?.options ? [...q.options] : ['A. ', 'B. ', 'C. ', 'D. '],
    answer,
    choiceAnswers,
    _key: ++qKeyGen,
    _collapsed: false,
  }
}

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(0)
const saveLoading = ref(false)
const publishConfirmVisible = ref(false)
/** 当前待发布的目标：'form'=表单发布, 或 Homework=列表发布 */
const publishTarget = ref<'form' | Homework | null>(null)

const form = reactive<HwForm>({
  title: '', courseId: '', publishDate: '', deadline: '',
  questions: [],
})

const calcTotal = computed(() => form.questions.reduce((s, q) => s + (q.score || 0), 0))

const resetForm = () => {
  form.title = ''
  form.courseId = ''
  form.publishDate = ''
  form.deadline = ''
  form.questions = []
}

const openCreateDialog = () => {
  isEditing.value = false
  editingId.value = 0
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = async (hw: Homework) => {
  isEditing.value = true
  editingId.value = hw.id
  form.title = hw.title
  form.courseId = hw.courseId ?? ''
  form.publishDate = hw.publishDate
  form.deadline = hw.deadline
  form.questions = hw.questions.map(q => makeQForm(q))
  // 先加载课程列表，再打开弹窗
  await loadCourses()
  dialogVisible.value = true
}

const addQuestion = () => {
  form.questions.push(makeQForm())
}

const removeQuestion = (idx: number) => {
  form.questions.splice(idx, 1)
}

const moveQuestion = (idx: number, dir: number) => {
  const target = idx + dir
  if (target < 0 || target >= form.questions.length) return
  const tmp = form.questions[idx]
  form.questions[idx] = form.questions[target]
  form.questions[target] = tmp
}

const onTypeChange = (q: QForm) => {
  if (q.type === 'choice') {
    if (!q.options || q.options.length === 0) {
      q.options = ['A. ', 'B. ', 'C. ', 'D. ']
    }
    // 从之前保存的 answer 解析 choiceAnswers
    if (q.choiceAnswers.length === 0 && q.answer) {
      q.choiceAnswers = q.answer.split(',').filter(Boolean)
    }
  }
  if (q.type === 'judge') {
    if (!q.answer || q.answer === '') q.answer = '正确'
    q.choiceAnswers = []
  }
  if (q.type === 'essay') {
    if (q.answer === '正确' || q.answer === '错误') q.answer = ''
    q.choiceAnswers = []
  }
}

/** 动态生成选项标签（A~F） */
const optionLabel = (idx: number) => String.fromCharCode(65 + idx)

const addOption = (q: QForm) => {
  if (!q.options) q.options = []
  if (q.options.length >= 6) return
  q.options.push(optionLabel(q.options.length) + '. ')
}

/** 校验表单并构建 Question 数组 */
const buildQuestions = (): Question[] | null => {
  if (!form.title.trim()) { ElMessage.warning('请输入作业标题'); return null }
  if (!form.publishDate) { ElMessage.warning('请选择发布日期'); return null }
  if (!form.deadline) { ElMessage.warning('请选择截止日期'); return null }
  if (form.questions.length === 0) { ElMessage.warning('请至少添加一道题目'); return null }
  for (let i = 0; i < form.questions.length; i++) {
    const q = form.questions[i]
    if (!q.title.trim()) { ElMessage.warning(`第${i + 1}题内容不能为空`); return null }
    if (q.type === 'choice' && q.choiceAnswers.length === 0) {
      ElMessage.warning(`第${i + 1}题（选择题）请至少勾选一个正确答案`); return null
    }
    if (q.type === 'judge' && !q.answer) {
      ElMessage.warning(`第${i + 1}题（判断题）请设置正确答案`); return null
    }
    if (q.type === 'essay' && !q.answer) {
      ElMessage.warning(`第${i + 1}题（解答题）请设置参考答案`); return null
    }
  }

  return form.questions.map((q, i) => ({
    id: q.id || store.newQuestionId(editingId.value),
    order: i + 1,
    type: q.type,
    title: q.title,
    score: q.score,
    options: q.type === 'choice' ? q.options : undefined,
    answer: q.type === 'choice' ? q.choiceAnswers.join(',') : q.answer,
  }))
}

/** 实际执行保存 */
const doSave = (status: 'draft' | 'published') => {
  const questions = buildQuestions()
  if (!questions) return
  if (form.courseId === 0 || form.courseId === '' || form.courseId == null) { ElMessage.warning('请选择关联课程'); return }
  if (!/^\d+$/.test(String(form.courseId))) { ElMessage.warning('该课程未同步到后端，请先在课程管理中重新创建此课程'); return }
  // 截止时间不能早于或等于发布时间
  if (form.publishDate && form.deadline && form.deadline <= form.publishDate) {
    ElMessage.warning('截止时间不能早于或等于发布时间')
    return
  }

  saveLoading.value = true
  if (isEditing.value) {
    store.updateHomework(editingId.value, {
      title: form.title,
      publishDate: form.publishDate,
      deadline: form.deadline,
      status,
      questions,
    }, form.courseId)
    ElMessage.success(status === 'published' ? '作业已更新并发布' : '作业已保存为草稿')
  } else {
    store.createHomework({
      title: form.title,
      publishDate: status === 'published'
        ? (form.publishDate || new Date().toLocaleString('zh-CN'))
        : (form.publishDate || ''),
      deadline: form.deadline,
      status,
      questions,
    }, form.courseId)
    ElMessage.success(status === 'published' ? '作业已发布' : '作业已存为草稿')
  }
  saveLoading.value = false
  dialogVisible.value = false
  publishConfirmVisible.value = false
}

const handleSaveDraft = () => {
  doSave('draft')
}

const handlePublishClick = () => {
  const questions = buildQuestions()
  if (!questions) return
  if (form.courseId === 0 || form.courseId === '' || form.courseId == null) { ElMessage.warning('请选择关联课程'); return }
  if (!/^\d+$/.test(String(form.courseId))) { ElMessage.warning('该课程未同步到后端，请先在课程管理中重新创建此课程'); return }
  if (form.publishDate && form.deadline && form.deadline <= form.publishDate) {
    ElMessage.warning('截止时间不能早于或等于发布时间')
    return
  }
  publishTarget.value = 'form'
  publishConfirmVisible.value = true
}

const handleTablePublish = (hw: Homework) => {
  publishTarget.value = hw
  publishConfirmVisible.value = true
}

const handleConfirmPublish = () => {
  publishConfirmVisible.value = false
  if (publishTarget.value === 'form') {
    doSave('published')
  } else if (publishTarget.value && typeof publishTarget.value === 'object') {
    // 从列表直接发布草稿
    const hw = publishTarget.value as Homework
    store.updateHomework(hw.id, {
      status: 'published',
      publishDate: hw.publishDate || new Date().toLocaleString('zh-CN'),
    })
    ElMessage.success('作业已发布')
  }
  publishTarget.value = null
}

/** 编辑模式：只保存当前编辑进度，不改变发布状态 */
const handleEditSave = () => {
  const questions = buildQuestions()
  if (!questions) return
  if (form.publishDate && form.deadline && form.deadline <= form.publishDate) {
    ElMessage.warning('截止时间不能早于或等于发布时间')
    return
  }

  saveLoading.value = true
  store.updateHomework(editingId.value, {
    title: form.title,
    publishDate: form.publishDate,
    deadline: form.deadline,
    questions,
  }, form.courseId)
  saveLoading.value = false
  dialogVisible.value = false
  ElMessage.success('已保存编辑进度')
}

const handleDelete = (id: number) => {
  store.deleteHomework(id)
  ElMessage.success('作业已删除')
}

// ==================== 预览 ====================
const previewVisible = ref(false)
const previewHw = ref<Homework | null>(null)

const openPreview = (hw: Homework) => {
  previewHw.value = hw
  previewVisible.value = true
}

onMounted(() => {
  store.fetchHomeworks()
  loadCourses()
})
</script>

<style scoped>
.homework-page { min-height: calc(100vh - 40px); padding: 20px; }

/* 页头统计 */
.header-stats { display:flex; align-items:center; gap:20px; padding:12px 20px;
  background:rgba(255,255,255,.8); border-radius:10px; border:1px solid rgba(100,181,246,.2); }
.stat-item { display:flex; flex-direction:column; align-items:center; gap:2px; }
.stat-value { font-size:22px; font-weight:700; color:#2196f3; }
.stat-label { font-size:11px; color:#64748b; }
.stat-divider { width:1px; height:36px; background:rgba(100,181,246,.3); }
.stat-published { color:#67c23a; }
.stat-draft { color:#909399; }
.stat-ended { color:#e6a23c; }

/* 工具栏 */
.toolbar-card { display:flex; justify-content:space-between; align-items:center;
  background:#fff; border-radius:12px; padding:14px 24px; margin:16px 0; box-shadow:0 1px 3px rgba(0,0,0,.08); }

/* 表格 */
.table-card { background:#fff; border-radius:12px; padding:20px 24px; box-shadow:0 1px 3px rgba(0,0,0,.08); }

/* 状态标签 */
.status-tag { padding:2px 10px; border-radius:4px; font-size:12px; font-weight:500; }
.status-draft { background:#f1f5f9; color:#64748b; }
.status-published { background:#e1f3d8; color:#67c23a; }
.status-ended { background:#fdf6ec; color:#e6a23c; }

/* ======== 弹窗 ======== */
.dialog-body { max-height: 65vh; overflow-y: auto; padding-right: 4px; }
.form-section { margin-bottom: 20px; }
.section-title { margin: 0 0 12px; font-size: 15px; color: #1a202c; }
.section-title .sub { font-weight: 400; font-size: 13px; color: #909399; }

.question-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.empty-questions { padding: 30px 0; }

/* 题目卡片 */
.question-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:10px; overflow:hidden; }
.question-card.collapsed { background:#fff; }
.q-header { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; cursor:pointer; user-select:none; }
.q-header:hover { background:#f1f5f9; }
.q-summary { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
.q-type-tag { flex-shrink:0; }
.q-title-text { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; color:#334155; }
.q-score { flex-shrink:0; font-weight:600; color:#2196f3; font-size:13px; }
.q-actions { display:flex; gap:4px; flex-shrink:0; margin-left:12px; }
.q-body { padding:0 14px 14px; background:#fff; border-top:1px solid #e2e8f0; }

/* 选项编辑器 */
.options-editor { width:100%; }
.option-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.opt-label { width:28px; text-align:center; flex-shrink:0; }
.add-opt-btn { margin-top:4px; }

/* ======== 预览弹窗（试卷样式） ======== */
.paper { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.paper-header { background: linear-gradient(135deg, #eff6ff, #dbeafe); padding:14px 20px; border-radius:8px; margin-bottom:20px; }
.paper-info { display:flex; gap:24px; font-size:14px; color:#475569; }
.paper-info strong { color:#1e293b; }

.paper-question { padding:16px 0; border-bottom:1px dashed #e2e8f0; }
.paper-question:last-child { border-bottom:none; }
.pq-title { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.pq-num { font-weight:600; font-size:15px; color:#1e293b; }
.pq-score { font-size:13px; color:#64748b; }
.pq-content { font-size:14px; color:#334155; line-height:1.7; margin-bottom:10px; padding-left:4px; }

.pq-options { padding-left:20px; }
.pq-opt { padding:6px 0; font-size:14px; color:#475569; display:flex; align-items:center; gap:8px; }
.pq-opt-label { font-weight:600; color:#2196f3; min-width:20px; }

.pq-essay-area { margin:10px 0; }
.essay-placeholder { height:100px; border:1px dashed #cbd5e1; border-radius:6px; background:#f8fafc;
  display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:13px; }

.pq-answer { margin-top:10px; padding:8px 12px; background:#f0fdf4; border-left:3px solid #22c55e; border-radius:4px; font-size:13px; color:#166534; }
.answer-label { font-weight:600; }

/* ======== 分页 ======== */
.pagination-wrapper { display:flex; justify-content:space-between; align-items:center; margin-top:20px; flex-wrap:wrap; gap:12px; }
.pagination-info { display:flex; align-items:center; gap:6px; font-size:13px; color:#606266; }
.pagination-info strong { color:#303133; }
.page-size-select { width:80px; }

/* ======== 底部添加题目 ======== */
.add-question-bottom { display:flex; justify-content:center; padding:8px 0; }

/* ======== 答案复选框 ======== */
.answer-checkboxes { display:flex; flex-wrap:wrap; gap:6px 16px; }
.no-answer-hint { font-size:12px; color:#e6a23c; margin-left:8px; }

/* ======== 弹窗底部 ======== */
.homework-dialog :deep(.el-dialog__footer) { display:flex; justify-content:space-between; align-items:center; }
.dialog-footer-left { }
.dialog-footer-right { display:flex; gap:8px; }

/* ======== 发布确认弹窗 ======== */
.confirm-body { display:flex; flex-direction:column; align-items:center; text-align:center; padding:10px 0; }
.confirm-icon { font-size:42px; color:#e6a23c; margin-bottom:12px; }
.confirm-body p { margin:4px 0; font-size:15px; color:#1e293b; }
.confirm-detail { font-size:13px !important; color:#64748b !important; max-width:320px; }
</style>
