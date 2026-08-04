<template>
  <div class="homework-expand-item">
    <div class="homework-item" :class="{ 'is-expanded': isExpanded }" @click="toggleExpand">
      <div class="homework-info">
        <div class="homework-title">
          <el-icon v-if="!isExpanded" class="expand-icon"><ArrowRight /></el-icon>
          <el-icon v-else class="expand-icon"><ArrowDown /></el-icon>
          <span class="lesson-title">{{ homework.lessonTitle || homework.relatedHomework || '附加题' }}</span>
          <el-tag :type="getStatusType()" size="small">
            {{ getStatusText() }}
          </el-tag>
        </div>
        <div class="homework-meta">
          <span>题目：{{ homework.relatedHomework || '未填写' }}</span>
        </div>
        <div class="homework-score-row">
          <span class="score-label">分数：</span>
          <span class="score-value" :class="getScoreClass(getPercent())">{{ homework.score }}</span>
          <span class="score-divider">/</span>
          <span class="score-full">{{ homework.fullScore }}分</span>
        </div>
      </div>
      <div class="homework-actions" @click.stop>
        <el-button type="primary" size="large" text @click="startEdit">编辑</el-button>
      </div>
    </div>

    <transition name="expand">
      <div v-if="isExpanded" class="homework-detail">
        <div class="detail-section">
          <h4 class="section-title">题目要求</h4>
          <div class="section-content">{{ homework.comment || '无具体要求' }}</div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">学生提交内容</h4>
          <div v-if="homework.attachments && homework.attachments.length > 0" class="attachments-grid">
            <div v-for="(att, idx) in homework.attachments" :key="idx" class="attachment-card">
              <div class="attachment-icon-wrapper">
                <el-icon class="attachment-icon"><Document /></el-icon>
              </div>
              <div class="attachment-info">
                <span class="attachment-name">{{ att.name }}</span>
                <span v-if="att.url" class="attachment-url">{{ att.url }}</span>
              </div>
              <div class="attachment-actions">
                <el-button type="primary" size="small" @click="$emit('view', { ...homework, attachment: att })">查看</el-button>
                <el-button type="success" size="small" @click="handleExport(att)">导出</el-button>
              </div>
            </div>
          </div>
          <div v-else class="no-submission">
            <el-empty description="学生未提交" :image-size="60" />
          </div>
        </div>

        <div class="detail-section score-edit-section">
          <h4 class="section-title">评分信息</h4>

          <div v-if="!isEditing" class="score-display">
            <span class="current-score" :class="getScoreClass(getPercent())">
              {{ homework.score }} / {{ homework.fullScore }}分
            </span>

            <span v-if="homework.comment" class="comment-text">评语：{{ homework.comment }}</span>
            <div class="record-info">
              <span v-if="homework.recordDate" class="record-date">记录时间：{{ homework.recordDate }}</span>
            </div>
          </div>

          <div v-else class="edit-form">
            <div class="edit-form-row">
              <span class="edit-label">得分：</span>
              <el-input-number v-model="editScore" :min="0" :max="homework.fullScore" size="default" />
              <span class="edit-unit">/ {{ homework.fullScore }}分</span>
            </div>
            <div class="edit-form-row">
              <span class="edit-label">评语：</span>
              <el-input v-model="editComment" type="textarea" :rows="2" placeholder="请输入评语" size="default" />
            </div>
            <div class="edit-form-actions">
              <el-button type="primary" size="small" @click="saveEdit">保存</el-button>
              <el-button size="small" @click="cancelEdit">取消</el-button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRight, ArrowDown, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Attachment {
  name: string
  url?: string
  size?: string
}

interface Homework {
  id: number
  score: number
  fullScore: number
  relatedHomework?: string
  lessonTitle?: string
  comment?: string
  attachments?: Attachment[]
  recordDate?: string
}

const props = defineProps<{
  homework: Homework
}>()

const emit = defineEmits(['update', 'view'])

const isExpanded = ref(false)
const isEditing = ref(false)
const editScore = ref(0)
const editComment = ref('')

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function startEdit() {
  isEditing.value = true
  editScore.value = props.homework.score
  editComment.value = props.homework.comment || ''
  isExpanded.value = true
}

function saveEdit() {
  if (editScore.value > props.homework.fullScore) {
    ElMessage.warning('得分不能超过满分！')
    return
  }
  emit('update', {
    ...props.homework,
    score: editScore.value,
    comment: editComment.value,
    graded: true
  })
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  editScore.value = props.homework.score
  editComment.value = props.homework.comment || ''
}

function handleExport(att: Attachment) {
  if (att.url) {
    const link = document.createElement('a')
    link.href = att.url
    link.download = att.name
    link.click()
    ElMessage.success('导出成功')
  } else {
    ElMessage.info('无法导出，文件地址不存在')
  }
}

function getPercent() {
  if (!props.homework || props.homework.fullScore === 0) return 0
  return Math.round((props.homework.score / props.homework.fullScore) * 100)
}

function getScoreClass(percent: number) {
  if (percent >= 90) return 'excellent'
  if (percent >= 75) return 'good'
  if (percent >= 60) return 'pass'
  return 'fail'
}

function getStatusType() {
  if (props.homework.attachments?.length === 0 || !props.homework.attachments) return 'info'
  if (props.homework.score > 0 || props.homework.graded) return 'success'
  return 'warning'
}

function getStatusText() {
  if (!props.homework.attachments || props.homework.attachments.length === 0) return '未提交'
  if (props.homework.score > 0 || props.homework.graded) return '已批改'
  return '未批改'
}
</script>

<style scoped>
.homework-expand-item {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.homework-expand-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.homework-item {
  padding: 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.homework-item.is-expanded {
  border-bottom: 1px solid #ebeef5;
  background: #fafbfc;
}

.homework-info {
  flex: 1;
}

.homework-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.expand-icon {
  color: #409eff;
  font-size: 14px;
  transition: transform 0.2s;
}

.lesson-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.homework-meta {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
  padding-left: 22px;
}

.homework-score-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
  padding-left: 22px;
}

.score-label {
  color: #909399;
}

.score-value {
  font-size: 18px;
  font-weight: 600;
}

.score-value.excellent { color: #409eff; }
.score-value.good { color: #67c23a; }
.score-value.pass { color: #e6a23c; }
.score-value.fail { color: #f56c6c; }

.score-divider { color: #c0c4cc; }

.score-full { color: #606266; }

.homework-actions {
  display: flex;
  gap: 8px;
}

.homework-detail {
  padding: 20px;
  background: #fff;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.section-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  padding-left: 10px;
}

.attachments-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  transition: all 0.2s;
}

.attachment-card:hover {
  background: #f0f5ff;
  transform: translateX(4px);
}

.attachment-icon-wrapper {
  width: 40px;
  height: 40px;
  background: #409eff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
}

.attachment-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.attachment-name {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-url {
  font-size: 12px;
  color: #909399;
}

.no-submission {
  padding: 20px 0;
  text-align: center;
}

.score-edit-section {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
}

.score-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.current-score {
  font-size: 24px;
  font-weight: 700;
}

.current-score.excellent { color: #409eff; }
.current-score.good { color: #67c23a; }
.current-score.pass { color: #e6a23c; }
.current-score.fail { color: #f56c6c; }

.percent-label {
  font-size: 14px;
  color: #909399;
}

.comment-text {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}

.record-info {
  margin-top: 8px;
}

.record-date {
  font-size: 13px;
  color: #909399;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-label {
  font-size: 14px;
  color: #606266;
  min-width: 50px;
}

.edit-unit {
  font-size: 14px;
  color: #909399;
}

.edit-form-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
}
</style>
