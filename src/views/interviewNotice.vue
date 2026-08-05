<template>
  <div class="notice-container">
    <div class="header">
        <div class="header-title-group">
          <h2>通知管理</h2>
          <span class="header-subtitle">Notification Management</span>
        </div>
      </div>

    <div class="content-wrapper">
      <div class="left-panel">
        <el-card class="publish-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>发布通知</span>
            </div>
          </template>

          <el-form :model="noticeForm" label-position="top">
            <el-form-item label="通知标题">
              <el-input
                v-model="noticeForm.title"
                placeholder="请输入通知标题"
                clearable
              />
            </el-form-item>

            <el-form-item label="通知类型">
              <el-select v-model="noticeForm.type" placeholder="请选择类型" class="full-width">
                <el-option label="面试通知" value="interview" />
                <el-option label="会议通知" value="meeting" />
                <el-option label="活动通知" value="activity" />
                <el-option label="其他通知" value="other" />
              </el-select>
            </el-form-item>

            <el-form-item label="通知人员">
              <el-input
                v-model="peopleSearch"
                placeholder="搜索人员..."
                clearable
                :prefix-icon="Search"
                class="people-search"
              />

              <div class="people-actions">
                <el-checkbox
                  v-model="selectAll"
                  :indeterminate="isIndeterminate"
                  @change="handleSelectAll"
                >
                  全选
                </el-checkbox>
                <span class="selected-count">已选 {{ selectedPeople.length }} 人</span>
              </div>

              <el-checkbox-group v-model="selectedPeople" class="people-list">
                <el-checkbox
                  v-for="person in filteredPeople"
                  :key="person.id"
                  :value="person.id"
                  class="people-item"
                >
                  <div class="people-info">
                    <el-avatar :size="32" class="people-avatar">
                      {{ person.name.charAt(0) }}
                    </el-avatar>
                    <div class="people-detail">
                      <div class="people-name">{{ person.name }}</div>
                      <div class="people-dept">{{ person.department }}</div>
                    </div>
                  </div>
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="通知内容">
              <el-input
                v-model="noticeForm.content"
                type="textarea"
                placeholder="请输入通知内容..."
                :rows="8"
                clearable
              />
            </el-form-item>

            <el-form-item>
              <div class="form-actions">
                <el-button class="btn-cancel" @click="handleClear">
                  取消
                </el-button>
                <el-button type="primary" class="btn-publish" @click="handlePublish">
                  <el-icon><Promotion /></el-icon>
                  发布通知
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card class="history-card" shadow="never">
          <template #header>
            <div class="history-header-wrapper">
              <span>通知记录</span>
              <div class="history-actions-header">
                <el-checkbox
                  v-model="selectAllHistory"
                  :indeterminate="isIndeterminateHistory"
                  @change="handleSelectAllHistory"
                >
                  全选
                </el-checkbox>
                <el-button
                  type="danger"
                  size="small"
                  :disabled="selectedHistoryIds.length === 0"
                  @click="handleBatchDelete"
                >
                  <el-icon><Delete /></el-icon>
                  删除 ({{ selectedHistoryIds.length }})
                </el-button>
              </div>
            </div>
          </template>

          <el-table
            :data="historyList"
            style="width: 100%"
            :header-cell-style="{ background: '#f5f7fa', color: '#333' }"
            row-key="id"
          >
            <el-table-column width="50">
              <template #default="{ row }">
                <el-checkbox
                  :model-value="selectedHistoryIds.includes(row.id!)"
                  @change="toggleHistorySelection(row.id!)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="120" show-overflow-tooltip />
            <el-table-column prop="type" label="通知类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getTypeTagType(row.type)" size="small">
                  {{ getTypeLabel(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="recipients" label="通知人员" min-width="150" align="center">
              <template #default="{ row }">
                <span class="recipients-names">
                  {{ getDisplayNames(row.recipientsNames) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="通知内容" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" width="180" align="center">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="handleViewDetail(row)">
                  查看
                </el-button>
                <el-button size="small" type="danger" @click="handleDelete(row.id!)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="historyList.length === 0" description="暂无通知记录" />
        </el-card>

        <el-dialog v-model="detailDialogVisible" title="通知详情" width="600px" :lock-scroll="false">
          <div class="detail-content">
            <div class="detail-item">
              <span class="detail-label">标题：</span>
              <span class="detail-value">{{ currentNotice.title }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">类型：</span>
              <el-tag :type="getTypeTagType(currentNotice.type)" size="small">
                {{ getTypeLabel(currentNotice.type) }}
              </el-tag>
            </div>
            <div class="detail-item">
              <span class="detail-label">通知人员：</span>
              <span class="detail-value">{{ currentNotice.recipientsNames?.join('、') }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">发布时间：</span>
              <span class="detail-value">{{ currentNotice.createTime }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">通知内容：</span>
            </div>
            <div class="detail-content-text">{{ currentNotice.content }}</div>
          </div>
          <template #footer>
            <el-button @click="detailDialogVisible = false">关闭</el-button>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Promotion,
  Delete,
  Bell
} from '@element-plus/icons-vue'
import { type Notice } from '@/services/notice'
import { useApplicationStore } from '@/stores/application'
import { useAuthStore } from '@/stores/auth'

interface Person {
  id: number
  name: string
  department: string
}

const applicationStore = useApplicationStore()

const peopleList = computed<Person[]>(() => {
  return applicationStore.approvedApplicants.map(app => ({
    id: app.id,
    name: app.name,
    department: useAuthStore().currentLabName || '实验室'
  }))
})

const historyList = ref<Notice[]>([
  {
    id: 1,
    title: '技术部面试通知',
    type: 'interview',
    content: '请以下同学于2024年1月15日上午10点到公司进行技术面试，面试地点：北京市朝阳区建国路88号。请提前准备好简历和相关证书。',
    recipients: 3,
    recipientsNames: ['张三', '李四', '王五'],
    createTime: '2024-01-10 09:30'
  },
  {
    id: 2,
    title: '产品部需求评审会议',
    type: 'meeting',
    content: '产品部将于本周五下午2点召开需求评审会议，讨论Q2季度产品规划，请相关部门负责人准时参加。',
    recipients: 2,
    recipientsNames: ['赵六', '钱七'],
    createTime: '2024-01-08 14:20'
  },
  {
    id: 3,
    title: '年度团建活动通知',
    type: 'activity',
    content: '公司将于1月20日组织年度团建活动，活动地点为郊外的度假山庄，请大家积极报名参加，名额有限，先到先得。',
    recipients: 6,
    recipientsNames: ['孙八', '周九', '吴十', '郑十一', '陈十二', '刘十三'],
    createTime: '2024-01-05 10:00'
  }
])
const selectedPeople = ref<number[]>([])
const peopleSearch = ref('')
const selectAll = ref(false)
const selectedHistoryIds = ref<number[]>([])
const selectAllHistory = ref(false)
const detailDialogVisible = ref(false)
const currentNotice = reactive<Notice>({
  id: 0,
  title: '',
  type: '',
  content: '',
  recipients: 0,
  createTime: ''
})

const noticeForm = reactive<NoticeForm>({
  title: '',
  type: 'interview',
  content: ''
})

const isIndeterminate = computed(() => {
  const len = selectedPeople.value.length
  return len > 0 && len < peopleList.value.length
})

const isIndeterminateHistory = computed(() => {
  const len = selectedHistoryIds.value.length
  return len > 0 && len < historyList.value.length
})

const filteredPeople = computed(() => {
  if (!peopleSearch.value) return peopleList.value
  const search = peopleSearch.value.toLowerCase()
  return peopleList.value.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.department.toLowerCase().includes(search)
  )
})

const stats = computed(() => {
  const today = new Date().toDateString()
  const tenDaysAgo = new Date()
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

  const recent = historyList.value.filter(item => {
    const itemDate = new Date(item.createTime!)
    return itemDate >= tenDaysAgo
  })

  const todayCount = historyList.value.filter(item => {
    return new Date(item.createTime!).toDateString() === today
  })

  const totalRecipients = historyList.value.reduce((sum, item) => sum + (item.recipients || 0), 0)

  return {
    total: historyList.value.length,
    today: todayCount.length,
    recent: recent.length,
    recipients: totalRecipients
  }
})

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    interview: '面试',
    meeting: '会议',
    activity: '活动',
    other: '其他'
  }
  return labels[type] || type
}

const getTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    interview: 'primary',
    meeting: 'warning',
    activity: 'success',
    other: 'info'
  }
  return types[type] || 'info'
}

const getDisplayNames = (names?: string[]) => {
  if (!names || names.length === 0) return ''
  if (names.length <= 4) return names.join('、')
  return names.slice(0, 4).join('、') + '...'
}

const handleSelectAll = (val: boolean) => {
  selectedPeople.value = val ? peopleList.value.map(p => p.id) : []
}

const handlePublish = async () => {
  if (!noticeForm.title.trim()) {
    ElMessage.error('请输入通知标题')
    return
  }
  if (selectedPeople.value.length === 0) {
    ElMessage.error('请选择通知人员')
    return
  }
  if (!noticeForm.content.trim()) {
    ElMessage.error('请输入通知内容')
    return
  }

  const selectedNames = peopleList.value
    .filter(p => selectedPeople.value.includes(p.id))
    .map(p => p.name)

  const newNotice: Notice = {
    id: Date.now(),
    title: noticeForm.title,
    type: noticeForm.type,
    content: noticeForm.content,
    recipients: selectedPeople.value.length,
    recipientsNames: selectedNames,
    createTime: new Date().toLocaleString('zh-CN')
  }

  historyList.value.unshift(newNotice)

  ElMessage.success('发布成功')
  handleClear()
}

const handleClear = () => {
  noticeForm.title = ''
  noticeForm.type = 'interview'
  noticeForm.content = ''
  selectedPeople.value = []
  selectAll.value = false
  peopleSearch.value = ''
}

const toggleHistorySelection = (id: number) => {
  const index = selectedHistoryIds.value.indexOf(id)
  if (index > -1) {
    selectedHistoryIds.value.splice(index, 1)
  } else {
    selectedHistoryIds.value.push(id)
  }
  selectAllHistory.value = selectedHistoryIds.value.length === historyList.value.length
}

const handleSelectAllHistory = (val: boolean) => {
  if (val) {
    selectedHistoryIds.value = historyList.value.map(item => item.id!)
  } else {
    selectedHistoryIds.value = []
  }
}

const handleBatchDelete = async () => {
  if (selectedHistoryIds.value.length === 0) {
    ElMessage.warning('请选择要删除的通知')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedHistoryIds.value.length} 条通知吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    historyList.value = historyList.value.filter(
      item => !selectedHistoryIds.value.includes(item.id!)
    )

    ElMessage.success('删除成功')
    selectedHistoryIds.value = []
    selectAllHistory.value = false
  } catch {
    // 用户取消
  }
}

const handleViewDetail = (item: Notice) => {
  currentNotice.id = item.id!
  currentNotice.title = item.title
  currentNotice.type = item.type
  currentNotice.content = item.content
  currentNotice.recipients = item.recipients || 0
  currentNotice.recipientsNames = item.recipientsNames || []
  currentNotice.createTime = item.createTime || ''
  detailDialogVisible.value = true
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    historyList.value = historyList.value.filter(item => item.id !== id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.notice-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #3b82f6 0%, #88a9f1 100%);
  padding: 20px 28px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.422);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-icon {
  font-size: 24px;
  color: white;
}

.header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  font-weight: 600;
}

.header-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.header-stats {
  display: flex;
  align-items: center;
}

.stat-box {
  color: white;
  display: flex;
  flex-direction: row;
  align-items: center;
  background: rgba(255, 255, 255, 0.422);
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 28px;
  min-width: 50px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #e5e7eb;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stat-text {
  font-size: 13px;
  color: white;
}

.content-wrapper {
  display: flex;
  gap: 24px;
  width: 100%;
  box-sizing: border-box;
}

.left-panel {
  flex: 1;
}

.right-panel {
  flex: 2;
}

.publish-card,
.history-card {
  border-radius: 12px;
  height: 100%;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.full-width {
  width: 100%;
}

.people-search {
  margin-bottom: 12px;
}

.people-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px 8px 0 0;
  background: #fafbfc;
  width: 100%;
  box-sizing: border-box;
}

.selected-count {
  font-size: 13px;
  color: #909399;
}

.people-list {
  max-height: 200px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #dcdfe6;
  border-top: 1px dashed #e5e7eb;
  border-radius: 0 0 8px 8px;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
}

.people-item {
  margin: 0;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.2s;
  width: 100%;

}

.people-item:hover {
  background: #f5f7fa;
}

.people-info {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;

}

.people-avatar {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.people-detail {
  flex: 1;
  height: 15px;
}

.people-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.people-dept {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.form-actions {
  display: flex;
  gap: 16px;
  width: 100%;
  margin-top: 20px;
}

.form-actions .el-button {
  flex: 1;
  height: 44px;
  font-size: 15px;
  border-radius: 10px;
}

.btn-cancel {
  border: 2px solid #e5e7eb;
  background: #fff;
  color: #666;
}

.btn-cancel:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.btn-publish {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-publish:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.history-header-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.history-actions-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.recipients-count {
  color: #8b5cf6;
  font-weight: 500;
}

.recipients-names {
  color: #3b82f6;
  font-weight: 500;
  font-size: 13px;
}

.detail-content {
  padding: 10px 0;
}

.detail-item {
  margin-bottom: 16px;
  line-height: 1.6;
}

.detail-label {
  font-weight: 600;
  color: #333;
}

.detail-value {
  color: #666;
}

.detail-content-text {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
