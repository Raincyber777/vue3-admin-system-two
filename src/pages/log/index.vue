<template>
  <div class="page-container">
    <!-- 页面标题卡片 -->
    <div class="page-header-card">
      <div class="header-bg-pattern"></div>
      <div class="header-content">
        <div class="header-left">
          <div class="icon-wrapper">
            <el-icon><Reading /></el-icon>
          </div>
          <div class="title-section">
            <h1 class="page-title">日志管理</h1>
            <p class="page-subtitle">Log Management System</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选卡片 -->
    <el-card class="filter-card">
      <div class="filter-content">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索日志内容..."
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="logLevel" placeholder="日志级别" clearable class="level-select">
          <el-option label="全部级别" value="" />
          <el-option label="DEBUG" value="DEBUG">
            <span class="level-tag debug">DEBUG</span>
          </el-option>
          <el-option label="INFO" value="INFO">
            <span class="level-tag info">INFO</span>
          </el-option>
          <el-option label="WARN" value="WARN">
            <span class="level-tag warn">WARN</span>
          </el-option>
          <el-option label="ERROR" value="ERROR">
            <span class="level-tag error">ERROR</span>
          </el-option>
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="date-picker"
        />

        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </el-card>

    <!-- 统计卡片 -->


    <!-- 日志列表卡片 -->
    <el-card class="logs-card">
      <template #header>
        <div class="card-header">
          <div class="card-title">
            <el-icon><List /></el-icon>
            <span>日志列表</span>
            <span v-if="selectedLogs.length > 0" class="selected-tip">
              已选择 <strong>{{ selectedLogs.length }}</strong> 项
            </span>
          </div>
          <div class="card-actions">
            <el-button
              v-if="selectedLogs.length > 0"
              type="danger"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
            <el-button type="primary" plain @click="loadLogs">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="currentPageLogs" stripe class="logs-table" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="level" label="级别" width="100" align="center">
          <template #default="{ row }">
            <span :class="['level-badge', row.level.toLowerCase()]">{{ row.level }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="日志内容" min-width="300">
          <template #default="{ row }">
            <span class="log-message">{{ row.message }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120" align="center" />
        <el-table-column prop="operator" label="操作人" width="100" align="center" />
        <el-table-column prop="createTime" label="时间" width="180" align="center" />
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" class="btn-view" @click="handleViewDetail(row)">
            查看
            </el-button>
            <el-button type="danger" size="small" class="btn-delete" @click="handleDelete(row)">
            删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <div class="pagination-info">
          共 <strong>{{ filteredLogs.length }}</strong> 条记录
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 15]"
          :total="filteredLogs.length"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="日志详情"
      width="700px"
      destroy-on-close
      class="detail-dialog"
    >
      <div v-if="currentLog" class="log-detail">
        <div class="detail-header">
          <span :class="['level-badge', currentLog.level.toLowerCase()]">{{ currentLog.level }}</span>
          <span class="detail-time">{{ currentLog.createTime }}</span>
        </div>
        <div class="detail-content">
          <div class="detail-row">
            <span class="detail-label">日志ID：</span>
            <span class="detail-value">{{ currentLog.id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">模块：</span>
            <span class="detail-value">{{ currentLog.module }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">操作人：</span>
            <span class="detail-value">{{ currentLog.operator }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">IP地址：</span>
            <span class="detail-value">{{ currentLog.ip }}</span>
          </div>
          <div class="detail-row full">
            <span class="detail-label">日志内容：</span>
            <div class="detail-message">{{ currentLog.message }}</div>
          </div>
          <div class="detail-row full" v-if="currentLog.stack">
            <span class="detail-label">堆栈信息：</span>
            <pre class="detail-stack">{{ currentLog.stack }}</pre>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Reading, Search, Refresh, List, Document,
  Download, CircleCheck, Warning, CircleClose,
  View, Delete
} from '@element-plus/icons-vue'
import { useLogStore } from '@/stores/log'

const logStore = useLogStore()

const searchKeyword = ref('')
const logLevel = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const currentLog = ref(null)
const selectedLogs = ref([])

const allLogs = computed(() => logStore.logs)
const stats = computed(() => logStore.stats)

const filteredLogs = computed(() => {
  let result = allLogs.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(log =>
      log.message.toLowerCase().includes(keyword) ||
      log.module.toLowerCase().includes(keyword) ||
      log.operator.toLowerCase().includes(keyword)
    )
  }

  if (logLevel.value) {
    result = result.filter(log => log.level === logLevel.value)
  }

  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(log => {
      const logDate = log.createTime.split(' ')[0]
      return logDate >= start && logDate <= end
    })
  }

  return result
})

const currentPageLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLogs.value.slice(start, end)
})

const handleSearch = () => {
  currentPage.value = 1
  ElMessage.success('搜索完成')
}

const handleReset = () => {
  searchKeyword.value = ''
  logLevel.value = ''
  dateRange.value = []
  currentPage.value = 1
  ElMessage.success('重置成功')
}

const handleExport = () => {
  const data = filteredLogs.value.map(log => ({
    ID: log.id,
    级别: log.level,
    内容: log.message,
    模块: log.module,
    操作人: log.operator,
    IP: log.ip,
    时间: log.createTime
  }))

  const headers = ['ID', '级别', '内容', '模块', '操作人', 'IP', '时间']
  let csv = headers.join(',') + '\n'

  data.forEach(row => {
    csv += headers.map(key => `"${row[key]}"`).join(',') + '\n'
  })

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `日志导出_${new Date().toLocaleString('zh-CN').replace(/\//g, '-').replace(/\s/g, '_')}.csv`
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

const handleViewDetail = (row) => {
  currentLog.value = row
  detailDialogVisible.value = true
}

const loadLogs = () => {
  ElMessage.success('刷新成功')
}

const handleSelectionChange = (selection) => {
  selectedLogs.value = selection
}

const handleBatchDelete = () => {
  if (selectedLogs.value.length === 0) return

  ElMessageBox.confirm(`确定要删除选中的 ${selectedLogs.value.length} 条日志吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const selectedIds = selectedLogs.value.map(log => log.id)
    logStore.deleteLogs(selectedIds)
    selectedLogs.value = []
    ElMessage.success('批量删除成功')
  }).catch(() => {})
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除这条日志吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    logStore.deleteLog(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
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

/* ==================== 筛选卡片 ==================== */
.filter-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.filter-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.filter-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 240px;
}

.level-select {
  width: 140px;
}

.date-picker {
  width: 280px;
}

.level-tag {
  font-weight: 600;
  font-size: 12px;
}

.level-tag.debug { color: #909399; }
.level-tag.info { color: #409eff; }
.level-tag.warn { color: #e6a23c; }
.level-tag.error { color: #f56c6c; }

/* ==================== 统计卡片 ==================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
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
}

.stat-icon .el-icon {
  font-size: 24px;
  color: #fff;
}

.stat-icon.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-icon.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stat-icon.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-icon.red { background: linear-gradient(135deg, #f56c6c, #f89898); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

/* ==================== 日志列表卡片 ==================== */
.logs-card {
  border: none;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.logs-card :deep(.el-card__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.card-title .el-icon {
  font-size: 20px;
  color: #409eff;
}

.selected-tip {
  margin-left: 12px;
  font-size: 13px;
  color: #f56c6c;
  font-weight: normal;
}

.selected-tip strong {
  color: #f56c6c;
}

.btn-view {
  background: linear-gradient(135deg, #409eff, #66b1ff) !important;
  border: none !important;
  color: #fff !important;
  margin-right: 6px;
}

.btn-view:hover {
  background: linear-gradient(135deg, #66b1ff, #8cc5ff) !important;
  transform: translateY(-1px);
}

.btn-delete {
  background: linear-gradient(135deg, #f56c6c, #f78989) !important;
  border: none !important;
  color: #fff !important;
}

.btn-delete:hover {
  background: linear-gradient(135deg, #f78989, #fab6b6) !important;
  transform: translateY(-1px);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logs-table :deep(.el-table__header th) {
  background: #f8fafc !important;
  color: #334155;
  font-weight: 600;
  font-size: 14px;
}

.level-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.level-badge.debug {
  background: #f4f4f5;
  color: #909399;
}

.level-badge.info {
  background: #ecf5ff;
  color: #409eff;
}

.level-badge.warn {
  background: #fdf6ec;
  color: #e6a23c;
}

.level-badge.error {
  background: #fef0f0;
  color: #f56c6c;
}

.log-message {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 400px;
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 0;
  border-top: 1px solid #f1f5f9;
  margin-top: 16px;
}

.pagination-info {
  font-size: 14px;
  color: #64748b;
}

/* ==================== 详情弹窗 ==================== */
.detail-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.detail-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  background: linear-gradient(135deg, #409eff, #7c3aed);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.detail-dialog :deep(.el-dialog__title) {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.detail-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.8);
}

.detail-dialog :deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: #fff;
}

.log-detail {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 16px;
}

.detail-time {
  color: #64748b;
  font-size: 14px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
}

.detail-row.full {
  flex-direction: column;
}

.detail-label {
  font-weight: 600;
  color: #334155;
  min-width: 80px;
}

.detail-value {
  color: #64748b;
}

.detail-message {
  margin-top: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.detail-stack {
  margin-top: 8px;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 8px;
  color: #d4d4d4;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
