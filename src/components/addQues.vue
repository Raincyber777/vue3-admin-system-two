<template>
  <div class="homework-list">
    <div v-for="item in bonusList" :key="item.id" class="homework-card">
      <div class="homework-collapsed" @click="toggleExpand(item.id)">
        <div class="collapsed-left">
          <el-icon class="expand-icon" :class="{ expanded: expandedId === item.id }"><CaretRight /></el-icon>
          <span class="homework-title">{{ item.relatedHomework || '附加题' }}</span>
          <el-tag :type="getStatusType(item)" size="small">{{ getStatusText(item) }}</el-tag>
        </div>
        <div class="collapsed-right">
          <span class="score-number">{{ item.score ?? '-' }}</span>
          <span class="score-full"> / {{ item.fullScore || 100 }}分</span>
        </div>
      </div>

      <div v-if="expandedId === item.id" class="homework-expanded">
        <div class="expanded-row requirement-row">
          <div class="requirement-content">
            <div class="requirement-section">
              <div class="requirement-label">作业目标</div>
              <div class="requirement-text">{{ parseRequirement(item.requirement).goal }}</div>
            </div>
            <div class="requirement-section">
              <div class="requirement-label">作业要求</div>
              <div class="requirement-text">{{ parseRequirement(item.requirement).requirements }}</div>
            </div>
            <div class="requirement-section">
              <div class="requirement-label">提交要求</div>
              <div class="requirement-text">{{ parseRequirement(item.requirement).submit }}</div>
            </div>
          </div>
        </div>

        <div class="expanded-row">
          <span class="row-label">学生提交：</span>
          <div class="attachments-inline">
            <template v-if="item.attachments && item.attachments.length > 0">
              <div v-for="(file, idx) in item.attachments" :key="idx" class="file-chip">
                <el-icon><Document /></el-icon>
                <span class="file-name">{{ file.name || '文件' + (idx + 1) }}</span>
                <el-button type="primary" link @click.stop="handleViewFile(file)">查看</el-button>
                <el-button type="success" link @click.stop="handleExportFile(file)">导出</el-button>
              </div>
            </template>
            <span v-else class="no-attachment">同学暂未提交作业</span>
          </div>
        </div>

        <div class="score-readonly-row" v-if="editingId !== item.id">
            <div class="readonly-left">
              <span class="row-label">分数：</span>
              <span class="score-value">{{ item.score ?? '-' }} / {{ item.fullScore || 100 }}分</span>
            </div>
          </div>
          <div class="score-edit-row" v-else>
            <span class="row-label">分数：</span>
            <el-input-number
              v-model="item.score"
              :min="0"
              :max="item.fullScore || 100"
              size="small"
            />
            <span class="score-full"> / {{ item.fullScore || 100 }}分</span>
          </div>

          <div class="comment-readonly-row" v-if="editingId !== item.id">
            <span class="row-label">评语：</span>
            <span class="comment-value">{{ item.comment || '暂无评语' }}</span>
          </div>
          <div class="comment-edit-row" v-else>
            <span class="row-label">评语：</span>
            <el-input
              v-model="item.comment"
              type="textarea"
              :rows="2"
              placeholder="请输入评语..."
              size="small"
              class="comment-input"
            />
          </div>

          <div class="action-row">
            <template v-if="editingId === item.id">
              <el-button size="small" @click.stop="cancelEdit">取消</el-button>
              <el-button type="primary" size="small" @click.stop="saveScore(item)">保存</el-button>
            </template>
            <el-button v-else type="primary" size="small" @click.stop="startEdit(item)">编辑</el-button>
          </div>

        </div>
      </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Document, CaretRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  bonusList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['view-file', 'export-file', 'update-score'])

const expandedId = ref(null)
const editingId = ref(null)

function parseRequirement(requirement) {
  if (!requirement) {
    return {
      goal: '巩固 HTML 基础结构 + CSS 基础样式 + 简单页面布局，完成一个简洁的个人介绍小网页，不要求复杂功能，重在规范和基础。',
      requirements: '使用纯 HTML + CSS 完成，不能用框架、不能复制别人代码。页面结构清晰、代码缩进规范、加简单注释。页面内容完整、样式美观、无明显错乱。',
      submit: '提交一个 .html 文件（CSS 可写在 <style> 里），文件名：homework01.html，代码干净、注释清晰。'
    }
  }
  return {
    goal: requirement.match(/作业目标[\s\S]*?(?=\s*作业要求|$)/)?.[0]?.replace(/作业目标/, '')?.trim() || '',
    requirements: requirement.match(/作业要求[\s\S]*?(?=\s*提交要求|$)/)?.[0]?.replace(/作业要求/, '')?.trim() || '',
    submit: requirement.match(/提交要求[\s\S]*$/)?.[0]?.replace(/提交要求/, '')?.trim() || ''
  }
}

function getStatusType(item) {
  if (!item.attachments || item.attachments.length === 0) return 'info'
  if (item.graded || (item.score !== undefined && item.score !== null)) return 'success'
  return 'warning'
}

function getStatusText(item) {
  if (!item.attachments || item.attachments.length === 0) return '未提交'
  if (item.graded || (item.score !== undefined && item.score !== null)) return '已评分'
  return '未评分'
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
  editingId.value = null
}

function startEdit(item) {
  editingId.value = item.id
}

function cancelEdit() {
  editingId.value = null
}

function saveScore(item) {
  emit('update-score', {
    id: item.id,
    score: item.score,
    comment: item.comment
  })
  editingId.value = null
  ElMessage.success('评分已保存')
}

function handleViewFile(file) {
  emit('view-file', file)
}

function handleExportFile(file) {
  emit('export-file', file)
}
</script>

<style scoped>
.homework-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.homework-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.homework-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.homework-collapsed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  user-select: none;
}

.homework-collapsed:hover {
  background: #f8f9ff;
}

.collapsed-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expand-icon {
  font-size: 14px;
  color: #909399;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.homework-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.collapsed-right {
  display: flex;
  align-items: center;
}

.score-number {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.score-full {
  font-size: 13px;
  color: #909399;
  margin-left: 2px;
}

.homework-expanded {
  padding: 0 20px 16px 44px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.expanded-row {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.expanded-row:last-child {
  border-bottom: none;
}

.requirement-row {
  padding: 12px 0;
}

.requirement-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.requirement-section {
  background: #fff;
  border-radius: 6px;
  padding: 10px 14px;
  box-shadow: 0px 2px 4px rgba(219, 218, 218, 0.53);
}

.requirement-label {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.requirement-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}

.row-label {
  font-size: 13px;
  color: #909399;
  margin-right: 8px;
}

.attachments-inline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.file-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.file-chip .el-icon {
  color: #409eff;
  font-size: 16px;
}

.file-chip .file-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-attachment {
  font-size: 13px;
  color: #c0c4cc;
  font-style: italic;
}

.score-readonly-row {
  display: flex;
  align-items: center;
  padding: 12px 0 4px 0;
}

.readonly-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-value {
  font-size: 14px;
  color: #409eff;
  font-weight: 600;
}

.score-edit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0 4px 0;
}

.comment-readonly-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0 8px 0;
}

.comment-value {
  font-size: 13px;
  color: #606266;
}

.comment-edit-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0 8px 0;
}

.comment-input {
  flex: 1;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  padding-bottom: 4px;
}

.row-label {
  font-size: 13px;
  color: #909399;
}

.comment-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-top: 10px;
}

.comment-input {
  flex: 1;
}
</style>
