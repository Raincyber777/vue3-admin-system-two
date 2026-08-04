<template>
  <div class="page-container">
    <PageHeaderCard title="公告管理" subtitle="Announcement Management">
      <template #icon>
        <el-icon><Bell /></el-icon>
      </template>
      <template #default>
        <el-button type="primary" @click="openPublishDialog">
          <el-icon><Plus /></el-icon>
          <span>发布公告</span>
        </el-button>
      </template>
    </PageHeaderCard>

    <!-- 状态筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="announcementStore.activeStatus" size="large">
        <el-radio-button label="all">
          全部 <el-badge :value="announcementStore.stats.all" class="badge" />
        </el-radio-button>
        <el-radio-button label="published">
          已发布 <el-badge :value="announcementStore.stats.published" class="badge" />
        </el-radio-button>
        <el-radio-button label="draft">
          草稿 <el-badge :value="announcementStore.stats.draft" class="badge" />
        </el-radio-button>
        <el-radio-button label="scheduled">
          定时发布 <el-badge :value="announcementStore.stats.scheduled" class="badge" />
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 公告列表 -->
    <div class="announcements-list">
      <el-card
        v-for="item in announcementStore.filteredAnnouncements"
        :key="item.id"
        class="announcement-card"
      >
        <div class="announcement-content">
          <div class="announcement-main">
            <div class="announcement-header">
              <el-tag v-if="item.isPinned" type="warning" size="small" effect="dark" class="pin-tag">
                <el-icon><Top /></el-icon> 置顶
              </el-tag>
              <el-tag type="primary" size="small">{{ item.category }}</el-tag>
              <!-- 状态标签（仅在全部视图中显示） -->
              <el-tag
                v-if="announcementStore.activeStatus === 'all'"
                :type="getStatusType(item.status)"
                size="small"
              >
                {{ getStatusText(item.status) }}
              </el-tag>
              <h3 class="announcement-title">{{ item.title }}</h3>
            </div>
            <p class="announcement-excerpt">{{ getExcerpt(item.content) }}</p>
            <div class="announcement-meta">
              <span class="meta-item">
                <el-icon><User /></el-icon>
                {{ item.author }}
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ getDisplayTime(item) }}
              </span>
              <span class="meta-item">
                <el-icon><View /></el-icon>
                {{ item.views }} 次阅读
              </span>
            </div>
          </div>
          <div class="announcement-actions">
            <el-button size="small" text type="primary">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button size="small" text type="danger" @click="handleDelete(item.id)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="10"
        :total="announcementStore.announcements.length"
        layout="prev, pager, next"
        background
      />
    </div>

    <!-- 发布公告弹窗 -->
    <el-dialog
      title="发布公告"
      v-model="showPublishDialog"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="publishForm" label-width="100px" class="publish-form">
        <el-form-item label="公告标题">
          <el-input
            v-model="publishForm.title"
            placeholder="请输入公告标题"
            size="large"
          />
        </el-form-item>
        <el-form-item label="发布人">
          <el-input
            v-model="publishForm.author"
            placeholder="请输入发布人姓名"
            size="large"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="publishForm.category"
            placeholder="请选择分类"
            size="large"
          >
            <el-option label="通知" value="通知" />
            <el-option label="公告" value="公告" />
            <el-option label="活动" value="活动" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="定时发布">
          <div class="datetime-picker-wrapper">
            <el-date-picker
              v-model="publishForm.scheduledTime"
              type="datetime"
              placeholder="选填 - 设置定时发布时间"
              size="large"
              :disabled-date="(time) => time.getTime() < Date.now() - 8.64e7"
            />
            <span class="optional-hint">（选填，不填则立即发布）</span>
          </div>
        </el-form-item>
        <el-form-item label="公告内容">
          <el-textarea
            v-model="publishForm.content"
            :rows="8"
            placeholder="请输入公告内容"
            class="content-textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="large" @click="closePublishDialog">取消</el-button>
        <el-button size="large" type="info" @click="saveDraft">保存草稿</el-button>
        <el-button type="primary" size="large" @click="publishAnnouncement">发布公告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAnnouncementStore } from '@/stores/announcement'
import PageHeaderCard from '@/components/PageHeaderCard.vue'
import {
  Bell, Plus, Top, User, Clock, View, Edit, Delete
} from '@element-plus/icons-vue'

const router = useRouter()
const announcementStore = useAnnouncementStore()

const currentPage = ref(1)

// 发布公告弹窗
const showPublishDialog = ref(false)
const publishForm = reactive({
  title: '',
  content: '',
  author: '管理员',
  category: '通知',
  scheduledTime: ''
})

// 页面加载时加载数据
onMounted(() => {
  announcementStore.loadFromStorage()
})

// 获取状态标签文字
const getStatusText = (status) => {
  const map = {
    published: '已发布',
    draft: '草稿',
    scheduled: '定时发布'
  }
  return map[status] || status
}

// 获取状态标签样式
const getStatusType = (status) => {
  const map = {
    published: 'success',
    draft: 'info',
    scheduled: 'warning'
  }
  return map[status] || 'default'
}

// 获取公告摘要
const getExcerpt = (content) => {
  if (content.length <= 100) return content
  return content.slice(0, 100) + '...'
}

// 获取显示时间
const getDisplayTime = (announcement) => {
  if (announcement.status === 'scheduled') {
    return `定时: ${announcement.scheduledTime}`
  }
  return announcement.publishTime
}

// 打开发布弹窗
const openPublishDialog = () => {
  showPublishDialog.value = true
  publishForm.title = ''
  publishForm.content = ''
  publishForm.author = '管理员'
  publishForm.category = '通知'
  publishForm.scheduledTime = ''
}

// 关闭发布弹窗
const closePublishDialog = () => {
  showPublishDialog.value = false
}

// 保存草稿
const saveDraft = () => {
  if (!publishForm.title.trim()) {
    ElMessage.error('请输入公告标题')
    return
  }
  if (!publishForm.content.trim()) {
    ElMessage.error('请输入公告内容')
    return
  }

  announcementStore.addAnnouncement({
    title: publishForm.title,
    content: publishForm.content,
    author: publishForm.author,
    category: publishForm.category,
    status: 'draft',
    publishTime: '',
    isPinned: false
  })

  closePublishDialog()
  ElMessage.success('草稿保存成功')
}

// 发布公告
const publishAnnouncement = () => {
  if (!publishForm.title.trim()) {
    ElMessage.error('请输入公告标题')
    return
  }
  if (!publishForm.content.trim()) {
    ElMessage.error('请输入公告内容')
    return
  }

  // 检查定时时间是否有效
  if (publishForm.scheduledTime) {
    const scheduledDate = new Date(publishForm.scheduledTime.replace('T', ' '))
    const now = new Date()
    if (scheduledDate <= now) {
      ElMessage.error('定时发布时间不能早于当前时间')
      return
    }

    // 定时发布
    ElMessageBox.confirm(
      '确定要定时发布此公告吗？',
      '确认定时发布',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      announcementStore.addAnnouncement({
        title: publishForm.title,
        content: publishForm.content,
        author: publishForm.author,
        category: publishForm.category,
        status: 'scheduled',
        publishTime: '',
        scheduledTime: publishForm.scheduledTime.replace('T', ' '),
        isPinned: false
      })
      closePublishDialog()
      ElMessage.success('定时发布设置成功')
    }).catch(() => {
      ElMessage.info('已取消发布')
    })
  } else {
    // 立即发布
    ElMessageBox.confirm(
      '确定要发布此公告吗？',
      '确认发布',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      const now = new Date()
      announcementStore.addAnnouncement({
        title: publishForm.title,
        content: publishForm.content,
        author: publishForm.author,
        category: publishForm.category,
        status: 'published',
        publishTime: now.toLocaleString('zh-CN'),
        isPinned: false
      })
      closePublishDialog()
      ElMessage.success('公告发布成功')
    }).catch(() => {
      ElMessage.info('已取消发布')
    })
  }
}

// 删除公告
const handleDelete = (id) => {
  ElMessageBox.confirm(
    '确定要删除此公告吗？',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    announcementStore.deleteAnnouncement(id)
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}

/* ==================== 页面标题卡片 ==================== */
.page-header-card {
  background: linear-gradient(135deg, #ffffff 0%, #e3f2fd 30%, #bbdefb 50%, #e3f2fd 70%, #ffffff 100%);
  background-size: 400% 400%;
  animation: headerFlow 15s ease-in-out infinite;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(33, 150, 243, 0.15);
  border: 1px solid rgba(100, 181, 246, 0.2);
}

@keyframes headerFlow {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.header-bg-pattern {
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.header-bg-pattern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.06) 0%, transparent 50%, rgba(100, 181, 246, 0.06) 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #2196f3, #64b5f6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.35);
}

.icon-wrapper .el-icon {
  font-size: 28px;
  color: #fff;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.add-btn {
  background: linear-gradient(135deg, #2196f3, #64b5f6) !important;
  border: none !important;
  color: #fff !important;
  padding: 12px 24px !important;
  border-radius: 10px !important;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.35);
}

.add-btn .el-icon {
  margin-right: 6px;
}

/* ==================== 筛选栏 ==================== */
.filter-bar {
  background: #fff;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.filter-bar :deep(.el-radio-group) {
  display: flex;
  gap: 12px;
}

.filter-bar :deep(.el-radio-button__inner) {
  border: 1px solid #e2e8f0;
  border-radius: 8px !important;
  padding: 10px 20px;
  font-weight: 500;
}

.filter-bar :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #2196f3, #64b5f6);
  border-color: #2196f3;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.badge {
  margin-left: 6px;
}

/* ==================== 公告列表 ==================== */
.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.announcement-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.announcement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.announcement-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.announcement-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.announcement-main {
  flex: 1;
}

.announcement-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.pin-tag {
  background: linear-gradient(135deg, #e6a23c, #ebb563) !important;
  border: none !important;
}

.announcement-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
}

.announcement-excerpt {
  margin: 0 0 14px;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.announcement-meta {
  display: flex;
  align-items: center;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
}

.meta-item .el-icon {
  font-size: 14px;
}

.announcement-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

/* ==================== 分页 ==================== */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* ==================== 发布公告弹窗 ==================== */
.publish-form {
  padding: 20px 0;
}

.publish-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.publish-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #334155;
}

.datetime-picker-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.optional-hint {
  font-size: 12px;
  color: #94a3b8;
}

.content-textarea {
  max-height: 300px;
  overflow-y: auto;
}

.content-textarea :deep(.el-textarea__inner) {
  font-size: 14px;
  line-height: 1.6;
  padding: 12px;
}
</style>
