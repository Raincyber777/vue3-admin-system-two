<template>
  <div class="review-page">
    <PageHeaderCard title="报名审核" subtitle="Enrollment Review">
      <template #icon>
        <el-icon><FolderChecked /></el-icon>
      </template>
    </PageHeaderCard>

    <!-- 筛选区域 -->
    <div class="filter-card">
      <div class="filter-header">
        <div class="filter-title">
          <span>筛选查询</span>
        </div>
      </div>
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="学院" class="filter-item">
          <el-select
            v-model="filterForm.college"
            placeholder="请选择或输入学院"
            clearable
            filterable
            class="filter-select"
          >
            <el-option
              v-for="col in collegeOptions"
              :key="col"
              :label="col"
              :value="col"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专业" class="filter-item">
          <el-select
            v-model="filterForm.major"
            placeholder="请选择或输入专业"
            clearable
            filterable
            class="filter-select"
          >
            <el-option
              v-for="maj in majorOptions"
              :key="maj"
              :label="maj"
              :value="maj"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" class="filter-item">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable class="filter-select">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="报名时间" class="filter-item">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="filter-date-picker"
          />
          <el-button class="btn-reset" @click="handleReset">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-card">
      <div class="toolbar-left">
        <div class="toolbar-title">
          <span>报名列表</span>
        </div>
        <div class="sign-switch-wrapper">
          <span class="switch-label">报名开关</span>
          <el-switch
            v-model="signSwitchEnabled"
            :loading="switchLoading"
            :before-change="handleToggleSwitch"
            active-text="开启"
            inactive-text="关闭"
            inline-prompt
            size="small"
          />
          <span :class="['switch-status', signSwitchEnabled ? 'switch-on' : 'switch-off']">
            {{ signSwitchEnabled ? '报名进行中' : '报名已关闭' }}
          </span>
        </div>
      </div>
      <div class="toolbar-right">
        <template v-if="selectedIds.length > 0">
          <span class="selected-count">已选 <strong>{{ selectedIds.length }}</strong> 条</span>
          <el-button type="success" @click="handleBatchApprove" :loading="refreshLoading">
            <el-icon><CircleCheck /></el-icon> 批量通过
          </el-button>
          <el-button type="danger" @click="handleBatchReject" :loading="refreshLoading">
            <el-icon><CircleClose /></el-icon> 批量驳回
          </el-button>
        </template>
        <el-button class="btn-export" @click="handleExport" :loading="exportLoading">
          <el-icon><Download /></el-icon> 导出名单
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-card">
      <el-table
        :data="currentPageData"
        border
        stripe
        class="application-table"
        :header-cell-style="headerCellStyle"
        :row-class-name="tableRowClassName"
        v-loading="tableLoading"
        element-loading-text="加载中..."
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" fixed />
        <el-table-column type="index" label="序号" width="60" align="center" fixed>
          <template #header>
            <span class="index-header">序号</span>
          </template>
        </el-table-column>
        <el-table-column prop="student_name" label="姓名" min-width="90" align="center" fixed>
          <template #default="{ row }">
            <span class="name-text">{{ row.student_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="student_id" label="学号" min-width="130" align="center">
          <template #default="{ row }">
            <span class="student-id">{{ row.student_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="college" label="学院" min-width="140" align="center" show-overflow-tooltip />
        <el-table-column prop="department" label="部门" min-width="140" align="center" show-overflow-tooltip />
        <el-table-column prop="major" label="专业" min-width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="class_name" label="班级" min-width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.class_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="130" align="center" />
        <el-table-column label="操作" width="220" align="center" fixed="right" class-name="action-column">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link class="btn-detail" @click="handleViewDetail(row)">
                <el-icon><View /></el-icon> 详情
              </el-button>
              <template v-if="row.status === 'pending'">
                <el-button type="success" link @click="handleApprove(row)">
                  <el-icon><CircleCheck /></el-icon> 通过
                </el-button>
                <el-button type="danger" link @click="handleReject(row)">
                  <el-icon><CircleClose /></el-icon> 驳回
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>

      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-wrapper">
        <div class="pagination-info">
          共 <strong>{{ filteredTotal }}</strong> 条记录，每页显示
          <el-select v-model="pageSize" size="small" class="page-size-select" @change="handleSizeChange">
            <el-option :value="10" label="10" />
            <el-option :value="20" label="20" />
            <el-option :value="50" label="50" />
          </el-select>
          条
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredTotal"
          layout="prev, pager, next"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title=""
      width="720px"
      destroy-on-close
      class="detail-dialog"
    >
      <template #header>
        <div class="detail-dialog-header">
          <div class="dialog-title-wrapper">
            <span class="dialog-title">报名详情</span>
          </div>
          <span :class="['header-status', 'status-' + currentDetail.status]">
            {{ getStatusText(currentDetail.status) }}
          </span>
        </div>
      </template>
      <div v-if="currentDetail" class="detail-content">
        <!-- 基础信息模块 -->
        <div class="module-card basic-module">
          <div class="module-header">
            <span class="module-icon basic-icon"></span>
            <span class="module-title">报名信息</span>
          </div>
          <div class="info-grid">
            <div class="info-cell">
              <span class="info-label">姓名</span>
              <span class="info-value">{{ currentDetail.student_name }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">学号</span>
              <span class="info-value code">{{ currentDetail.student_id }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">培训课程</span>
              <span class="info-value">{{ currentDetail.course_title }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">学院</span>
              <span class="info-value">{{ currentDetail.college }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">专业</span>
              <span class="info-value">{{ currentDetail.major }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">班级</span>
              <span class="info-value">{{ currentDetail.class_name }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">手机号</span>
              <span class="info-value">{{ currentDetail.phone }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">报名时间</span>
              <span class="info-value">{{ formatDate(currentDetail.enrollment_time) }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">报名ID</span>
              <span class="info-value">{{ currentDetail.id }}</span>
            </div>
            <div class="info-cell full">
              <span class="info-label">自我介绍</span>
              <span class="info-value intro-full">{{ currentDetail.self_intro }}</span>
            </div>
          </div>
        </div>

        <!-- 审核信息模块 -->
        <div v-if="currentDetail.review_remark || currentDetail.review_time" class="module-card review-module">
          <div class="module-header">
            <span class="module-icon review-icon"></span>
            <span class="module-title">审核信息</span>
          </div>
          <div class="info-grid">
            <div class="info-cell full">
              <span class="info-label">审核意见</span>
              <span class="info-value review-text">{{ currentDetail.review_remark || '暂无' }}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">审核时间</span>
              <span class="info-value">{{ formatDate(currentDetail.review_time) || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false" class="btn-close">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import {
  FolderChecked, Refresh, View,
  Download,
  CircleCheck, CircleClose
} from '@element-plus/icons-vue'
import PageHeaderCard from '@/components/PageHeaderCard.vue'
import { useApplicationStore } from '@/stores/application'
import type { CourseEnrollmentItem } from '@/types/training'

// ==================== Store ====================
const applicationStore = useApplicationStore()

// 报名开关
const signSwitchEnabled = computed({
  get: () => applicationStore.signSwitchEnabled,
  set: () => {},
})
const switchLoading = computed(() => applicationStore.switchLoading)
const handleToggleSwitch = async (): Promise<boolean> => {
  const newStatus = signSwitchEnabled.value ? '关闭' : '开启'
  try {
    await ElMessageBox.confirm(
      `确定要${newStatus}报名通道吗？${signSwitchEnabled.value ? '关闭后学生将无法提交报名。' : '开启后学生即可正常报名。'}`,
      `${newStatus}报名`,
      { confirmButtonText: `确定${newStatus}`, cancelButtonText: '取消', customClass: 'no-icon-dlg' }
    )
    await applicationStore.toggleSignSwitch()
    ElMessage.success(`报名通道已${newStatus}`)
    return true
  } catch {
    return false
  }
}

// ==================== 响应式数据 ====================
const tableLoading = computed(() => applicationStore.loading)

const filterForm = reactive({
  studentName: '', studentId: '', college: '', major: '', status: '', dateRange: null
})

const allData = computed(() => applicationStore.applicants)
const currentPage = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const currentDetail = ref<CourseEnrollmentItem | null>(null)

const refreshLoading = ref(false)
const exportLoading = ref(false)
const selectedIds = ref<number[]>([])

const handleSelectionChange = (rows: CourseEnrollmentItem[]) => {
  selectedIds.value = rows.map(r => r.id)
}

const handleBatchApprove = async () => {
  if (selectedIds.value.length === 0) { ElMessage.warning('请先选择记录'); return }
  try {
    await ElMessageBox.confirm(
      `确定要通过选中的 ${selectedIds.value.length} 条报名吗？`,
      '批量通过', { confirmButtonText: '确定', cancelButtonText: '取消', customClass: 'no-icon-dlg' }
    )
  } catch {
    return // 用户取消
  }
  refreshLoading.value = true
  try {
    for (const id of selectedIds.value) {
      await applicationStore.approveApplication(id)
    }
    selectedIds.value = []
    ElMessage.success('批量通过完成')
  } catch (error: any) {
    ElMessage.error(error?.message || '批量通过失败')
  } finally {
    refreshLoading.value = false
  }
}

const handleBatchReject = async () => {
  if (selectedIds.value.length === 0) { ElMessage.warning('请先选择记录'); return }
  try {
    await ElMessageBox.confirm(
      `确定要驳回选中的 ${selectedIds.value.length} 条报名吗？`,
      '批量驳回', { confirmButtonText: '确定', cancelButtonText: '取消', customClass: 'no-icon-dlg' }
    )
  } catch {
    return // 用户取消
  }
  refreshLoading.value = true
  try {
    for (const id of selectedIds.value) {
      await applicationStore.rejectApplication(id)
    }
    selectedIds.value = []
    ElMessage.success('批量驳回完成')
  } catch (error: any) {
    ElMessage.error(error?.message || '批量驳回失败')
  } finally {
    refreshLoading.value = false
  }
}

// ==================== 计算属性 ====================
const filteredData = computed(() => {
  let data = [...allData.value]
  if (filterForm.studentName) {
    data = data.filter(item => (item.student_name || '').toLowerCase().includes(filterForm.studentName.toLowerCase()))
  }
  if (filterForm.studentId) {
    data = data.filter(item => (item.student_id || '').toLowerCase().includes(filterForm.studentId))
  }
  if (filterForm.college) {
    data = data.filter(item => item.college === filterForm.college)
  }
  if (filterForm.major) {
    data = data.filter(item => item.major === filterForm.major)
  }
  if (filterForm.status) {
    data = data.filter(item => item.status === filterForm.status)
  }
  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const [startDate, endDate] = filterForm.dateRange
    data = data.filter(item => {
      const enrollDate = item.enrollment_time.substring(0, 10)
      return enrollDate >= startDate && enrollDate <= endDate
    })
  }
  return data
})

/** 从全部数据中提取不重复的学院列表 */
const collegeOptions = computed(() => {
  const colleges = [...new Set(allData.value.map(item => item.college).filter(Boolean))]
  return colleges.sort()
})

/** 从全部数据中提取不重复的专业列表 */
const majorOptions = computed(() => {
  const majors = [...new Set(allData.value.map(item => item.major).filter(Boolean))]
  return majors.sort()
})

const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const filteredTotal = computed(() => filteredData.value.length)

// ==================== 方法 ====================
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  // 后端格式 "2026-07-25 09:00:00"，直接截取避免 new Date() 时区偏差
  const [datePart, timePart] = dateStr.split(' ')
  if (!timePart) return dateStr
  const [year, month, day] = datePart.split('-')
  return `${year}/${month}/${day} ${timePart}`
}

const headerCellStyle = {
  backgroundColor: '#f8fafc',
  color: '#475569',
  fontWeight: '600',
  fontSize: '13px',
  borderBottom: '2px solid #e2e8f0'
}

const tableRowClassName = ({ row }) => {
  if (!row) return ''
  if (row.status === 'pending') return 'pending-row'
  if (row.status === 'approved') return 'approved-row'
  if (row.status === 'rejected') return 'rejected-row'
  return ''
}

const getStatusText = (status) => {
  const textMap = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
  return textMap[status] || status
}

const handleReset = () => {
  filterForm.studentName = ''
  filterForm.studentId = ''
  filterForm.college = ''
  filterForm.major = ''
  filterForm.status = ''
  filterForm.dateRange = null
  currentPage.value = 1
  ElMessage.success('已重置筛选条件')
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleViewDetail = async (row: CourseEnrollmentItem) => {
  const detail = await applicationStore.fetchSignDetail(row.id)
  if (detail) {
    // 把详情数据回写到列表行（不同步 status，列表和详情的状态字段含义可能不同）
    row.self_intro = detail.self_intro || row.self_intro
    row.phone = detail.phone || row.phone
    row.review_remark = detail.review_remark || row.review_remark
    row.review_time = detail.review_time || row.review_time
  }
  // 列表数据为主，详情补充；status 以列表为准，不覆盖
  currentDetail.value = detail
    ? {
        ...detail,
        ...row,
        status: row.status,
        course_title: row.course_title || detail.course_title || '',
        enrollment_time: row.enrollment_time || detail.enrollment_time || '',
        phone: detail.phone || row.phone,
        self_intro: detail.self_intro || row.self_intro,
      }
    : row
  detailDialogVisible.value = true
}

const handleApprove = async (row: CourseEnrollmentItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要通过「${row.student_name}」的报名吗？`,
      '审核通过', { confirmButtonText: '确定', cancelButtonText: '取消', customClass: 'no-icon-dlg' }
    )
  } catch {
    return // 用户取消
  }
  try {
    await applicationStore.approveApplication(row.id)
    ElMessage.success(`「${row.student_name}」已通过`)
  } catch (error: any) {
    ElMessage.error(error?.message || '审核失败，请重试')
  }
}

const handleReject = async (row: CourseEnrollmentItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要驳回「${row.student_name}」的报名吗？`,
      '审核驳回', { confirmButtonText: '确定', cancelButtonText: '取消', customClass: 'no-icon-dlg' }
    )
  } catch {
    return // 用户取消
  }
  try {
    await applicationStore.rejectApplication(row.id)
    ElMessage.success(`「${row.student_name}」已驳回`)
  } catch (error: any) {
    ElMessage.error(error?.message || '驳回失败，请重试')
  }
}

// ==================== 导出功能 ====================
const handleExport = async () => {
  exportLoading.value = true
  try {
    const exportData = filteredData.value.map((item, i) => ({
      '序号': i + 1,
      '姓名': item.student_name,
      '学号': item.student_id,
      '培训课程': item.course_title,
      '学院': item.college,
      '专业': item.major,
      '班级': item.class_name,
      '手机号': item.phone,
      '自我介绍': item.self_intro,
      '状态': getStatusText(item.status),
      '报名时间': formatDate(item.enrollment_time),
      '审核意见': item.review_remark || '',
      '审核时间': formatDate(item.review_time) || '',
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    // 设置列宽
    ws['!cols'] = [
      { wch: 6 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 22 },
      { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 30 },
      { wch: 10 }, { wch: 20 }, { wch: 30 }, { wch: 20 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '报名名单')
    const timestamp = new Date().toLocaleString('zh-CN').replace(/[/: ]/g, '-')
    XLSX.writeFile(wb, `报名名单_${timestamp}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败，请重试')
  } finally {
    exportLoading.value = false
  }
}

onMounted(async () => {
  try {
    tableLoading.value = true
    await Promise.all([
      applicationStore.fetchApplications(),
      applicationStore.fetchSignSwitch(),
    ])
  } catch (error) {
    console.error('加载报名列表失败:', error)
  } finally {
    tableLoading.value = false
  }
})
</script>

<style scoped>
/* ==================== 页面整体布局 ==================== */
.review-page {
  min-height: calc(100vh - 40px);
    padding: 20px;
}

/* ==================== 模拟数据提示条 ==================== */
.mock-warning-banner {
  margin-bottom: 16px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #f59e0b;
  border-left: 4px solid #d97706;
  border-radius: 8px;
  animation: mockPulse 2s ease-in-out infinite;
}

@keyframes mockPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.mock-warning-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #92400e;
}

.mock-warning-icon {
  font-size: 20px;
  color: #d97706;
  flex-shrink: 0;
}

.mock-warning-content strong {
  color: #b45309;
  font-weight: 700;
}

/* ==================== 页面标题 ==================== */
.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #e3f2fd 30%, #bbdefb 50%, #e3f2fd 70%, #ffffff 100%);
  background-size: 400% 400%;
  animation: headerFlow 15s ease-in-out infinite;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(33, 150, 243, 0.15);
  position: relative;
  overflow: hidden;
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

.header-content::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.06) 0%, transparent 50%, rgba(100, 181, 246, 0.06) 100%);
  pointer-events: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.header-icon-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #2196f3, #64b5f6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.35);
}

.header-icon {
  font-size: 28px;
  color: #fff;
}

.header-text h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.header-subtitle {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #64748b;
}

.header-right {
  position: relative;
  z-index: 1;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  border: 1px solid rgba(100, 181, 246, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #2196f3;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(100, 181, 246, 0.3);
}

/* ==================== 筛选区域 ==================== */
.filter-card,
.toolbar-card,
.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.filter-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1a202c;
}

.filter-title .el-icon {
  color: #409eff;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filter-item {
  margin-bottom: 0;
}

.filter-input {
  width: 160px;
}

.filter-select {
  width: 150px;
}

.filter-date-picker {
  width: 260px;
}

.filter-actions {
  margin-left: auto;
  margin-bottom: 0;
  display: flex;
  gap: 10px;
}

.btn-search {
  background: linear-gradient(135deg, #409eff, #66b1ff) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.btn-reset {
  margin-left: 20px;
  background: #fff;
}

.btn-reset:hover {
  background: #f1f5f9;
}

/* ==================== 工具栏 ==================== */
.toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1a202c;
}

.toolbar-title .el-icon {
  color: #409eff;
}

.sign-switch-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 24px;
  padding: 6px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.switch-label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.switch-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.switch-on {
  background: #e1f3d8;
  color: #67c23a;
}

.switch-off {
  background: #fde2e2;
  color: #f56c6c;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.selected-count {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #e0f2fe, #bae6fd);
  color: #337ecc;
  border-radius: 20px;
  font-size: 13px;
}

.selected-count strong {
  color: #409eff;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.btn-import {
  background: linear-gradient(135deg, #1890ff, #40a9ff) !important;
  border: none !important;
  color: #fff !important;
}

.import-file-input {
  display: none;
}

.btn-export {
  background: linear-gradient(135deg, #67c23a, #85ce61) !important;
  border: none !important;
  color: #fff !important;
}

.btn-refresh {
  background: #fff;
}

.btn-refresh:hover {
  background: #f1f5f9;
}

/* ==================== 数据表格 ==================== */
.application-table {
  border-radius: 8px;
  overflow: hidden;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fdf6ec;
  color: #e6a23c;
}

.status-approved {
  background: #e1f3d8;
  color: #67c23a;
}

.status-rejected {
  background: #fde2e2;
  color: #f56c6c;
}

.index-header {
  font-weight: 600;
}

.name-text {
  font-weight: 500;
}

.student-id {
  font-family: 'Consolas', monospace;
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

/* ==================== 分页组件 ==================== */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 0;
  flex-wrap: wrap;
  gap: 12px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.pagination-info strong {
  color: #303133;
  font-weight: 600;
  margin: 0 2px;
}

.page-size-select {
  width: 80px;
  margin: 0 4px;
}

.page-size-select :deep(.el-input__wrapper) {
  padding: 1px 8px;
}

/* ==================== 详情弹窗 ==================== */
.detail-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
}

.detail-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.detail-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f0f9ff, #e8f4fc);
  border-bottom: 1px solid #d0e8f7;
}

.dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a202c;
}

.header-status {
  padding: 5px 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.detail-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.module-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
}

.basic-module {
  border-left: 4px solid #409eff;
}

.detail-module {
  border-left: 4px solid #10b981;
}

.review-module {
  border-left: 4px solid #f59e0b;
}

.review-icon {
  background: #f59e0b;
}

.review-text {
  color: #b45309;
}

.module-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e2e8f0;
}

.module-icon {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.basic-icon {
  background: #409eff;
}

.detail-icon {
  background: #10b981;
}

.module-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a202c;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 40px;
}

.info-cell {
  display: flex;
  align-items: flex-start;
}

.info-cell.full {
  grid-column: 1 / -1;
}

.info-label {
  width: 60px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: #1a202c;
}

.info-value.code {
  font-family: 'Consolas', monospace;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.detail-block {
  margin-bottom: 14px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 6px;
}

.block-label {
  font-size: 13px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 6px;
}

.block-content {
  font-size: 14px;
  color: #64748b;
  line-height: 1.7;
}

.review-block {
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.review-block .block-label {
  color: #b45309;
}

.review-block .block-content {
  color: #92400e;
}

.btn-close {
  padding: 10px 28px;
}

/* ==================== 审核弹窗 ==================== */
.review-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
}

.review-dialog :deep(.el-dialog__body) {
  padding: 0 24px 24px;
}

.dialog-icon {
  font-size: 24px;
}

.icon-success {
  color: #67c23a !important;
}

.icon-danger {
  color: #f56c6c !important;
}

.review-form {
  padding-top: 8px;
}

.review-info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.review-info-card.approve {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border: 1px solid #6ee7b7;
}

.review-info-card.reject {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fca5a5;
}

.review-info-card.batch {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #93c5fd;
}

.info-text {
  font-size: 14px;
  color: #64748b;
}

.info-text strong {
  color: #1a202c;
}

.review-form-item {
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

.btn-cancel {
  padding: 10px 20px;
}

.btn-submit {
  padding: 10px 20px;
}

/* ==================== 过渡动画 ==================== */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.intro-full {
  line-height: 1.7;
  white-space: pre-wrap;
}

/* ==================== 滚动条 ==================== */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

