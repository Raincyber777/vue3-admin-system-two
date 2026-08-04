<template>
  <div class="grading-page">
    <PageHeaderCard title="作业批改" subtitle="Homework Grading">
      <template #icon><el-icon><EditPen /></el-icon></template>
      <template #default>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ submissions.length }}</span>
            <span class="stat-label">提交总数</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value stat-ungraded">{{ ungradedCount }}</span>
            <span class="stat-label">未完成</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value stat-graded">{{ submissions.length - ungradedCount }}</span>
            <span class="stat-label">已完成</span>
          </div>
        </div>
      </template>
    </PageHeaderCard>

    <!-- 筛选 -->
    <div class="toolbar-card">
      <div class="toolbar-left">
        <el-radio-group v-model="filterClass" size="small" style="margin-left:16px" @change="onFilterChange">
          <el-radio-button value="all">全部班级</el-radio-button>
          <el-radio-button value="1班">1班</el-radio-button>
          <el-radio-button value="2班">2班</el-radio-button>
          <el-radio-button value="3班">3班</el-radio-button>
        </el-radio-group>
        <el-radio-group v-model="filterStatus" size="small" style="margin-left:16px" @change="onFilterChange">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="ungraded">未完成批改</el-radio-button>
          <el-radio-button value="graded">已完成批改</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <div v-if="selectedIds.length > 0" class="batch-bar">
        <span>已选 <strong>{{ selectedIds.length }}</strong> 条</span>
        <el-button type="danger" size="small" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon> 批量删除
        </el-button>
      </div>
      <el-table :data="currentPageData" border stripe class="grading-table"
        :header-cell-style="{ backgroundColor:'#f8fafc', color:'#475569', fontWeight:'600' }"
        @selection-change="onSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="homeworkTitle" label="作业标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="studentName" label="姓名" width="100" align="center" />
        <el-table-column prop="className" label="所属班级" width="110" align="center" />
        <el-table-column prop="submitTime" label="提交时间" width="160" align="center" />
        <el-table-column label="作业详情" width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openGradingDialog(row)">
              <el-icon><View /></el-icon> 查看
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="批改进度" width="110" align="center">
          <template #default="{ row }">
            <span :class="['progress-tag', row.gradingStatus === 'graded' ? 'progress-done' : 'progress-pending']">
              {{ row.gradingStatus === 'graded' ? '已完成' : '未完成' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
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
            <el-option :value="50" label="50" />
          </el-select>
          条
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredList.length"
          layout="prev, pager, next"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- ======== 批改弹窗 ======== -->
    <el-dialog v-model="dialogVisible" :title="'批改：' + currentSub?.studentName + ' — ' + currentSub?.homeworkTitle"
      width="700px" destroy-on-close top="3vh" class="grading-dialog">
      <div v-if="currentSub" class="grading-body">
        <!-- 学生信息 -->
        <div class="submission-header">
          <span>姓名：<strong>{{ currentSub.studentName }}</strong></span>
          <span>学号：<strong>{{ currentSub.studentNo || '-' }}</strong></span>
          <span>手机号：<strong>{{ currentSub.phone || '-' }}</strong></span>
          <span>提交时间：<strong>{{ currentSub.submitTime }}</strong></span>
        </div>

        <!-- 提交内容 -->
        <div class="submit-content-card">
          <div class="sc-label">📝 提交内容：</div>
          <div class="sc-text">{{ currentSub.submitContent || '(无内容)' }}</div>
        </div>

        <!-- 提交文件 -->
        <div v-if="currentSub.submitFile" class="submit-file-area">
          <span class="label">📎 提交文件：</span>
          <el-link type="primary" :href="currentSub.submitFile" target="_blank" underline="never">
            <el-icon><Link /></el-icon> {{ currentSub.submitFile }}
          </el-link>
        </div>

        <!-- 已批改时显示之前评分 -->
        <div v-if="currentSub.gradingStatus === 'graded'" class="prev-grade-info">
          <span>上次评分：<strong>{{ currentSub.totalScore }} 分</strong></span>
          <span v-if="currentSub.remark">评语：{{ currentSub.remark }}</span>
        </div>

        <!-- 批改区 -->
        <div class="grade-area">
          <div class="grade-row">
            <span class="grade-label">得分：</span>
            <el-input-number v-model="gradeForm.score" :min="0" :max="100" size="default"
              style="width:140px" controls-position="right" />
            <span class="grade-range">/ 100 分</span>
          </div>
          <div class="grade-row comment-row">
            <span class="grade-label">评语：</span>
            <el-input v-model="gradeForm.remark" placeholder="评语（选填）" maxlength="200" show-word-limit
              type="textarea" :rows="3" style="width:100%" />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer-left">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </div>
        <div class="dialog-footer-right">
          <el-button @click="handleSaveProgress" :loading="saveLoading">
            <el-icon><Folder /></el-icon> 保存批改进度
          </el-button>
          <el-button type="primary" @click="handleCompleteGrading" :loading="saveLoading">
            <el-icon><CircleCheck /></el-icon> 完成批改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ======== 完成批改确认弹窗 ======== -->
    <el-dialog v-model="confirmVisible" title="确认完成批改" width="420px"
      destroy-on-close align-center class="confirm-dialog">
      <div class="confirm-body">
        <el-icon class="confirm-icon"><CircleCheck /></el-icon>
        <p>确认完成批改？</p>
        <p class="confirm-detail">得分：<strong>{{ gradeForm.score }} 分</strong>，提交后将标记为"已完成批改"。</p>
      </div>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" @click="doCompleteGrading" :loading="saveLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, View, Folder, CircleCheck, Link, Delete } from '@element-plus/icons-vue'
import PageHeaderCard from '@/components/PageHeaderCard.vue'
import { useHomeworkStore } from '@/stores/homework'
import type { HomeworkSubmission } from '@/stores/homework'

const store = useHomeworkStore()
const submissions = computed(() => store.submissions)

// ==================== 筛选 ====================
const filterClass = ref('all')
const filterStatus = ref('all')

const filteredList = computed(() => {
  let list = [...submissions.value]
  if (filterClass.value !== 'all') {
    list = list.filter(s => s.className.includes(filterClass.value))
  }
  if (filterStatus.value !== 'all') {
    list = list.filter(s => s.gradingStatus === filterStatus.value)
  }
  return list
})

const ungradedCount = computed(() =>
  submissions.value.filter(s => s.gradingStatus === 'ungraded').length
)

const onFilterChange = () => { currentPage.value = 1 }

// ==================== 分页 ====================
const currentPage = ref(1)
const pageSize = ref(10)

const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const handleSizeChange = () => { currentPage.value = 1 }
const handleCurrentChange = (p: number) => { currentPage.value = p }

// ==================== 批改弹窗 ====================
const dialogVisible = ref(false)
const saveLoading = ref(false)
const confirmVisible = ref(false)
const currentSub = ref<HomeworkSubmission | null>(null)

const gradeForm = reactive({ score: 0, remark: '' })

const openGradingDialog = async (row: HomeworkSubmission) => {
  try {
    const detail = await store.fetchSubmissionDetail(row.id)
    currentSub.value = JSON.parse(JSON.stringify(detail || row))
  } catch {
    currentSub.value = JSON.parse(JSON.stringify(row))
    ElMessage.warning('获取提交详情失败，使用本地数据')
  }
  // 初始化评分表单
  gradeForm.score = currentSub.value?.totalScore ?? 0
  gradeForm.remark = currentSub.value?.remark ?? ''
  dialogVisible.value = true
}

const handleSaveProgress = async () => {
  if (!currentSub.value) return
  saveLoading.value = true
  // 保存当前分数和评语到本地
  const sub = store.submissions.find(s => s.id === currentSub.value!.id)
  if (sub) {
    sub.totalScore = gradeForm.score
    sub.remark = gradeForm.remark
    sub.gradingStatus = 'ungraded'
  }
  saveLoading.value = false
  dialogVisible.value = false
  ElMessage.success('已保存批改进度')
}

const handleCompleteGrading = () => {
  if (!currentSub.value) return
  if (gradeForm.score < 0) {
    ElMessage.warning('请先输入分数')
    return
  }
  confirmVisible.value = true
}

const doCompleteGrading = async () => {
  if (!currentSub.value) return
  saveLoading.value = true
  try {
    await store.completeGrading(currentSub.value.id, gradeForm.score, gradeForm.remark)
    // 刷新当前展示
    const updated = store.getSubmissionById(currentSub.value.id)
    if (updated) {
      currentSub.value = JSON.parse(JSON.stringify(updated))
      gradeForm.score = updated.totalScore
      gradeForm.remark = updated.remark || ''
    }
    confirmVisible.value = false
    dialogVisible.value = false
    ElMessage.success('批改完成！')
  } catch {
    ElMessage.error('批改提交失败，请重试')
  } finally {
    saveLoading.value = false
  }
}

// ==================== 删除提交 ====================
const selectedIds = ref<number[]>([])

const onSelectionChange = (rows: HomeworkSubmission[]) => {
  selectedIds.value = rows.map(r => r.id)
}

const handleDelete = async (row: HomeworkSubmission) => {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.studentName}」的提交记录吗？删除后不可恢复。`,
      '删除提交', { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', customClass: 'no-icon-dlg' }
    )
  } catch { return }
  await store.deleteSubmission(row.id)
  ElMessage.success('已删除')
}

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedIds.value.length} 条提交记录吗？删除后不可恢复。`,
      '批量删除', { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', customClass: 'no-icon-dlg' }
    )
  } catch { return }
  await store.batchDeleteSubmissions(selectedIds.value)
  selectedIds.value = []
  ElMessage.success('批量删除完成')
}

onMounted(() => {
  store.fetchSubmissions()
})
</script>

<style scoped>
.grading-page { min-height: calc(100vh - 40px); padding: 20px; }

/* 页头统计 */
.header-stats { display:flex; align-items:center; gap:20px; padding:12px 20px;
  background:rgba(255,255,255,.8); border-radius:10px; border:1px solid rgba(100,181,246,.2); }
.stat-item { display:flex; flex-direction:column; align-items:center; gap:2px; }
.stat-value { font-size:22px; font-weight:700; color:#2196f3; }
.stat-ungraded { color:#e6a23c; }
.stat-graded { color:#67c23a; }
.stat-label { font-size:11px; color:#64748b; }
.stat-divider { width:1px; height:36px; background:rgba(100,181,246,.3); }

/* 工具栏 */
.toolbar-card { display:flex; align-items:center;
  background:#fff; border-radius:12px; padding:14px 24px; margin:16px 0; box-shadow:0 1px 3px rgba(0,0,0,.08); }

/* 表格 */
.table-card { background:#fff; border-radius:12px; padding:20px 24px; box-shadow:0 1px 3px rgba(0,0,0,.08); }
.batch-bar { display:flex; align-items:center; gap:12px; padding:8px 16px; margin-bottom:12px;
  background:#fef2f2; border:1px solid #fecaca; border-radius:8px; font-size:13px; color:#b91c1c; }
.batch-bar strong { color:#dc2626; }
.progress-tag { padding:2px 10px; border-radius:4px; font-size:12px; font-weight:500; }
.progress-done { background:#e1f3d8; color:#67c23a; }
.progress-pending { background:#fdf6ec; color:#e6a23c; }

/* 分页 */
.pagination-wrapper { display:flex; justify-content:space-between; align-items:center; margin-top:20px; flex-wrap:wrap; gap:12px; }
.pagination-info { display:flex; align-items:center; gap:6px; font-size:13px; color:#606266; }
.pagination-info strong { color:#303133; }
.page-size-select { width:80px; }

/* ======== 批改弹窗 ======== */
.grading-body { max-height: 55vh; overflow-y: auto; padding-right: 4px; }
.submission-header { display:flex; flex-wrap:wrap; gap:16px; padding:10px 14px;
  background:#f0f9ff; border-radius:6px; margin-bottom:14px; font-size:13px; color:#475569; }
.submission-header strong { color:#1e293b; }

.submit-content-card { padding:14px; background:#fafafa; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:12px; }
.sc-label { font-size:13px; font-weight:600; color:#475569; margin-bottom:6px; }
.sc-text { font-size:14px; color:#1e293b; line-height:1.7; white-space:pre-wrap; word-break:break-word; }

.submit-file-area { display:flex; align-items:center; gap:8px; padding:10px 14px;
  background:#f0fdf4; border-radius:6px; margin-bottom:12px; font-size:13px; }
.submit-file-area .label { color:#64748b; font-weight:500; }

.prev-grade-info { display:flex; gap:20px; padding:10px 14px; background:#fffbeb;
  border:1px solid #fde68a; border-radius:6px; margin-bottom:14px; font-size:13px; color:#92400e; }
.prev-grade-info strong { color:#b45309; }

.grade-area { padding:14px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; }
.grade-row { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.grade-label { font-size:14px; color:#475569; font-weight:600; white-space:nowrap; }
.grade-range { font-size:14px; color:#64748b; }
.grade-row:last-child { margin-bottom:0; }

/* 弹窗底部 */
.grading-dialog :deep(.el-dialog__footer) { display:flex; justify-content:space-between; align-items:center; }
.dialog-footer-right { display:flex; gap:8px; }

/* 确认弹窗 */
.confirm-body { display:flex; flex-direction:column; align-items:center; text-align:center; padding:10px 0; }
.confirm-icon { font-size:42px; color:#67c23a; margin-bottom:12px; }
.confirm-body p { margin:4px 0; font-size:15px; color:#1e293b; }
.confirm-detail { font-size:13px !important; color:#64748b !important; max-width:320px; }
</style>
