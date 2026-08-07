<template>
  <div class="page-container">
    <PageHeaderCard
      :title="homework?.title || '作业详情'"
      :subtitle="getSubtitle()"
    >
      <template #icon>
        <el-icon class="header-icon"><Document /></el-icon>
      </template>
      <template #default>
        <el-button type="success" @click="handleExportAllScores">
          <el-icon><Download /></el-icon>
          导出成绩
        </el-button>
      </template>
    </PageHeaderCard>

    <div class="backBtn">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div class="detail-content">
      <div class="homework-info-card">
        <div class="info-header">
          <h3>作业要求</h3>
          <el-tag :type="getStatusTagType(homework?.status)" size="small">
            {{ getStatusText(homework?.status) }}
          </el-tag>
        </div>

        <div class="requirement-content">
          <div class="requirement-section">
            <div class="requirement-label">作业目标</div>
            <div class="requirement-text">{{ parseRequirement(homework?.requirement).goal }}</div>
          </div>
          <div class="requirement-section">
            <div class="requirement-label">作业要求</div>
            <div class="requirement-text">{{ parseRequirement(homework?.requirement).requirements }}</div>
          </div>
          <div class="requirement-section">
            <div class="requirement-label">提交要求</div>
            <div class="requirement-text">{{ parseRequirement(homework?.requirement).submit }}</div>
          </div>
        </div>

        <div class="info-footer">
          <div class="info-item">
            <el-icon><Clock /></el-icon>
            <span>截止时间：{{ homework?.deadline }}</span>
          </div>
          <div class="info-item">
            <el-icon><Medal /></el-icon>
            <span>满分：{{ homework?.fullScore }}分</span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span>创建人：{{ homework?.createdBy }}</span>
          </div>
        </div>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon blue">
            <el-icon><Collection /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ submissions.length }}</span>
            <span class="stat-label">总提交数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ gradedCount }}</span>
            <span class="stat-label">已批改</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ ungradedCount }}</span>
            <span class="stat-label">待批改</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ averageScore }}</span>
            <span class="stat-label">平均分</span>
          </div>
        </div>
      </div>

      <div class="submissions-section">
        <div class="section-header">
          <h3>学生提交</h3>
          <div class="filter-bar">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索学生姓名或学号"
              :prefix-icon="Search"
              clearable
              style="width: 200px;"
            />
            <el-select v-model="filterStatus" placeholder="状态" style="width: 120px;">
              <el-option label="全部" value="" />
              <el-option label="已提交" value="submitted" />
              <el-option label="已批改" value="graded" />
              <el-option label="待批改" value="ungraded" />
            </el-select>
            <el-button :icon="Refresh" circle @click="resetFilters" />
          </div>
        </div>

        <div class="submissions-list">
          <div v-for="submission in filteredSubmissions" :key="submission.id" class="submission-item">
            <div class="submission-header" @click="toggleExpand(submission.id)">
              <div class="submission-left">
                <el-icon class="expand-icon" :class="{ expanded: expandedId === submission.id }">
                  <CaretRight />
                </el-icon>
                <div class="student-info">
                  <span class="student-name">{{ submission.studentName }}</span>
                  <span class="student-no">{{ submission.studentNo }}</span>
                </div>
              </div>

              <div class="submission-right">
                <template v-if="submission.attachments && submission.attachments.length > 0">
                  <el-tag :type="submission.graded ? 'success' : 'warning'" size="small">
                    {{ submission.graded ? '已批改' : '待批改' }}
                  </el-tag>
                  <span v-if="submission.graded" class="score-display">
                    <span class="score-value">{{ submission.score }}</span>
                    <span class="score-divider">/</span>
                    <span class="score-full">{{ homework?.fullScore }}</span>
                  </span>
                </template>
                <el-tag v-else type="info" size="small">未提交</el-tag>
              </div>
            </div>

            <div v-if="expandedId === submission.id" class="submission-detail">
              <div class="detail-row">
                <span class="row-label">提交时间：</span>
                <span class="row-value">{{ submission.submittedAt || '未提交' }}</span>
              </div>

              <div class="detail-row">
                <span class="row-label">提交附件：</span>
                <div class="attachments-list">
                  <template v-if="submission.attachments && submission.attachments.length > 0">
                    <div v-for="(file, idx) in submission.attachments" :key="idx" class="file-item">
                      <el-icon><Document /></el-icon>
                      <span class="file-name">{{ file.name }}</span>
                      <el-button type="primary" link @click="viewFile(file)">查看</el-button>
                      <el-button type="success" link @click="exportFile(file)">下载</el-button>
                    </div>
                  </template>
                  <span v-else class="no-files">暂无提交文件</span>
                </div>
              </div>

              <div class="detail-row" v-if="submission.graded">
                <span class="row-label">评语：</span>
                <span class="row-value comment">{{ submission.comment || '暂无评语' }}</span>
              </div>

              <div class="detail-row" v-if="submission.graded">
                <span class="row-label">批改信息：</span>
                <span class="row-value">{{ submission.gradedBy }} · {{ submission.gradedAt }}</span>
              </div>

              <div class="grading-section">
                <template v-if="editingId === submission.id">
                  <div class="grading-form">
                    <div class="form-item">
                      <label>分数：</label>
                      <el-input-number
                        v-model="editingScore"
                        :min="0"
                        :max="homework?.fullScore || 100"
                        size="default"
                      />
                      <span class="score-unit">/{{ homework?.fullScore }}分</span>
                    </div>
                    <div class="form-item">
                      <label>评语：</label>
                      <el-input
                        v-model="editingComment"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入评语..."
                        style="flex: 1;"
                      />
                    </div>
                    <div class="form-actions">
                      <el-button size="small" @click="cancelEdit">取消</el-button>
                      <el-button type="primary" size="small" @click="saveGrade(submission)" :loading="saving">
                        保存评分
                      </el-button>
                    </div>
                  </div>
                </template>

                <div v-else class="grading-actions">
                  <template v-if="submission.attachments && submission.attachments.length > 0">
                    <el-button v-if="!submission.graded" type="primary" size="small" @click="startEdit(submission)">
                      <el-icon><Edit /></el-icon>
                      评分
                    </el-button>
                    <el-button type="warning" size="small" @click="startEdit(submission)">
                      <el-icon><EditPen /></el-icon>
                      修改评分
                    </el-button>
                  </template>
                  <el-button v-else type="info" size="small" disabled>等待提交</el-button>
                </div>
              </div>
            </div>
          </div>

          <el-empty v-if="filteredSubmissions.length === 0" description="暂无提交记录" />
        </div>
      </div>
    </div>

    <el-dialog v-model="showFileViewer" title="查看文件" width="900px">
      <div class="file-viewer-content">
        <iframe v-if="currentFileUrl" :src="currentFileUrl" class="file-iframe"></iframe>
        <div v-else class="no-preview">
          <el-icon size="48"><Document /></el-icon>
          <p>文件无法打开或不存在</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Document, Download, Clock, Medal, User,
  Collection, CircleCheck, Warning, TrendCharts,
  Search, Refresh, CaretRight, Edit, EditPen
} from '@element-plus/icons-vue'
import { useHomeworkStore } from '@/stores/homework'
import PageHeaderCard from '@/components/PageHeaderCard.vue'
import * as XLSX from 'xlsx'

const route = useRoute()
const router = useRouter()
const homeworkStore = useHomeworkStore()

const searchKeyword = ref('')
const filterStatus = ref('')
const expandedId = ref(null)
const editingId = ref(null)
const editingScore = ref(0)
const editingComment = ref('')
const saving = ref(false)
const showFileViewer = ref(false)
const currentFileUrl = ref('')

const homeworkId = computed(() => Number(route.params.id))

const homework = computed(() => {
  return homeworkStore.homeworks.find(h => h.id === homeworkId.value)
})

const submissions = computed(() => {
  return homeworkStore.getHomeworkSubmissions(homeworkId.value)
})

const gradedCount = computed(() => {
  return submissions.value.filter(s => s.graded).length
})

const ungradedCount = computed(() => {
  return submissions.value.filter(s => !s.graded && s.attachments.length > 0).length
})

const averageScore = computed(() => {
  const graded = submissions.value.filter(s => s.graded && s.score !== undefined)
  if (graded.length === 0) return 0
  const total = graded.reduce((sum, s) => sum + (s.score || 0), 0)
  return Math.round(total / graded.length)
})

const filteredSubmissions = computed(() => {
  let list = submissions.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(s =>
      (s.studentName || '').toLowerCase().includes(keyword) ||
      (s.studentNo || '').toLowerCase().includes(keyword)
    )
  }

  if (filterStatus.value) {
    switch (filterStatus.value) {
      case 'submitted':
        list = list.filter(s => s.attachments && s.attachments.length > 0)
        break
      case 'graded':
        list = list.filter(s => s.graded)
        break
      case 'ungraded':
        list = list.filter(s => !s.graded && s.attachments && s.attachments.length > 0)
        break
    }
  }

  return list
})

function getSubtitle() {
  if (!homework.value) return ''
  return homework.value.subject || '通用'
}

function getStatusTagType(status) {
  switch (status) {
    case 'active': return 'success'
    case 'ended': return 'info'
    case 'draft': return 'warning'
    default: return 'info'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'active': return '进行中'
    case 'ended': return '已结束'
    case 'draft': return '草稿'
    default: return status
  }
}

function parseRequirement(requirement) {
  if (!requirement) {
    return { goal: '', requirements: '', submit: '' }
  }
  return {
    goal: requirement.match(/作业目标[\s\S]*?(?=\s*作业要求|$)/)?.[0]?.replace(/作业目标/, '')?.trim() || '',
    requirements: requirement.match(/作业要求[\s\S]*?(?=\s*提交要求|$)/)?.[0]?.replace(/作业要求/, '')?.trim() || '',
    submit: requirement.match(/提交要求[\s\S]*$/)?.[0]?.replace(/提交要求/, '')?.trim() || ''
  }
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
  editingId.value = null
}

function startEdit(submission) {
  editingId.value = submission.id
  editingScore.value = submission.score || 0
  editingComment.value = submission.comment || ''
  expandedId.value = submission.id
}

function cancelEdit() {
  editingId.value = null
}

async function saveGrade(submission) {
  if (editingScore.value === undefined || editingScore.value === null) {
    ElMessage.warning('请输入分数')
    return
  }

  saving.value = true
  try {
    // 更新提交记录的分数
    const success = homeworkStore.gradeSubmission(
      submission.id,
      editingScore.value,
      editingComment.value,
      '管理员'
    )

    if (success) {
      editingId.value = null
      ElMessage.success('评分已保存')
    }
  } finally {
    saving.value = false
  }
}

function resetFilters() {
  searchKeyword.value = ''
  filterStatus.value = ''
}

function viewFile(file) {
  if (file && file.url) {
    currentFileUrl.value = file.url
    showFileViewer.value = true
  } else {
    ElMessage.warning('文件无法打开')
  }
}

function exportFile(file) {
  if (file.url) {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name || '下载文件'
    link.click()
  } else {
    ElMessage.warning('无法下载此文件')
  }
}

function goBack() {
  router.push({ name: 'Homework' })
}

function handleExportAllScores() {
  if (!homework.value) {
    ElMessage.warning('无法获取作业信息')
    return
  }

  const data = [{
    '学生姓名': '',
    '学号': '',
    '提交状态': '',
    '提交时间': '',
    '分数': '',
    '满分': '',
    '评语': ''
  }]

  submissions.value.forEach(s => {
    const submitted = s.attachments && s.attachments.length > 0
    data.push({
      '学生姓名': s.studentName,
      '学号': s.studentNo,
      '提交状态': submitted ? (s.graded ? '已批改' : '待批改') : '未提交',
      '提交时间': s.submittedAt || '-',
      '分数': s.score ?? '-',
      '满分': homework.value.fullScore,
      '评语': s.comment || '-'
    })
  })

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '作业成绩')
  XLSX.writeFile(wb, `${homework.value.title}_成绩表.xlsx`)
  ElMessage.success('成绩导出成功')
}
</script>

<style scoped>
.page-container {
  background: #f5f7fa;
  min-height: 100%;
  padding: 20px;
}

.backBtn {
  margin-bottom: 16px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.homework-info-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.info-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.requirement-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.requirement-section {
  background: #f8f9ff;
  border-radius: 8px;
  padding: 16px;
}

.requirement-label {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.requirement-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
  white-space: pre-wrap;
}

.info-footer {
  display: flex;
  gap: 32px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.info-item .el-icon {
  color: #909399;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.stat-icon.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.purple { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.submissions-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.submission-item {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.submission-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  background: #fff;
}

.submission-header:hover {
  background: #f8f9ff;
}

.submission-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expand-icon {
  font-size: 14px;
  color: #909399;
  transition: transform 0.3s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.student-no {
  font-size: 12px;
  color: #909399;
}

.submission-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

.score-divider {
  color: #909399;
  font-size: 14px;
}

.score-full {
  font-size: 14px;
  color: #909399;
}

.submission-detail {
  padding: 16px 20px 16px 52px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}

.row-label {
  font-size: 13px;
  color: #909399;
  min-width: 80px;
}

.row-value {
  font-size: 13px;
  color: #606266;
}

.row-value.comment {
  flex: 1;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.file-item .el-icon {
  color: #409eff;
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-files {
  font-size: 13px;
  color: #c0c4cc;
  font-style: italic;
}

.grading-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e0e0e0;
}

.grading-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.form-item label {
  font-size: 13px;
  color: #606266;
  min-width: 50px;
  line-height: 32px;
}

.score-unit {
  font-size: 13px;
  color: #909399;
  line-height: 32px;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.grading-actions {
  display: flex;
  gap: 8px;
}

.file-viewer-content {
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.no-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-wrap: wrap;
  }
}
</style>
