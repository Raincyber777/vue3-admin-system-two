<template>
  <div class="signin-page">
    <PageHeaderCard title="签到管理" subtitle="Sign-in Management">
      <template #icon><el-icon><Clock /></el-icon></template>
      <template #default>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon> 发起签到
        </el-button>
      </template>
    </PageHeaderCard>

    <!-- 筛选 -->
    <div class="toolbar-card">
      <el-radio-group v-model="filterClass" size="small" style="margin-left:12px" @change="onFilterChange">
        <el-radio-button value="all">全部班级</el-radio-button>
        <el-radio-button value="一班">一班</el-radio-button>
        <el-radio-button value="二班">二班</el-radio-button>
        <el-radio-button value="三班">三班</el-radio-button>
      </el-radio-group>
      <el-radio-group v-model="filterStatus" size="small" style="margin-left:12px" @change="onFilterChange">
        <el-radio-button value="all">全部状态</el-radio-button>
        <el-radio-button value="ongoing">进行中</el-radio-button>
        <el-radio-button value="ended">已结束</el-radio-button>
      </el-radio-group>
      <div v-if="selectedIds.length > 0" style="margin-left:auto;display:flex;align-items:center;gap:8px">
        <span style="font-size:13px;color:#64748b">已选 <strong style="color:#e6a23c">{{ selectedIds.length }}</strong> 条</span>
        <el-button type="danger" size="small" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon> 批量删除
        </el-button>
      </div>
    </div>

    <!-- 签到列表表格 -->
    <div class="table-card">
      <el-table :data="currentPageData" border stripe v-loading="store.loading"
        :header-cell-style="{ backgroundColor:'#f8fafc', color:'#475569', fontWeight:'600' }"
        @selection-change="onSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="title" label="签到标题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="courseName" label="关联课程" min-width="150" show-overflow-tooltip />
        <el-table-column prop="className" label="班级" width="70" align="center" />
        <el-table-column prop="checkinCode" label="签到码" width="100" align="center" />
        <el-table-column prop="endTime" label="结束时间" min-width="160" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.endTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="签到人数" width="110" align="center">
          <template #default="{ row }">
            <span class="count-text">{{ row.signinCount }} / {{ row.totalCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" min-width="160" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.startTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <span :class="['status-tag', row.status === 'ongoing' ? 's-ongoing' : 's-ended']">
              {{ row.status === 'ongoing' ? '进行中' : '已结束' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="310" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetailDialog(row)">
              <el-icon><List /></el-icon> 明细
            </el-button>
            <el-button type="success" link size="small" @click="openManualSignDialog(row)">
              <el-icon><CircleCheck /></el-icon> 手动签到
            </el-button>
            <el-button v-if="row.status === 'ongoing'" type="warning" link size="small" @click="handleEndSignIn(row)">
              <el-icon><SwitchButton /></el-icon> 结束
            </el-button>
            <el-button type="info" link size="small" @click="handleExport(row)">
              <el-icon><Download /></el-icon> 导出
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="pagination-info">
          共 <strong>{{ filteredList.length }}</strong> 条，每页
          <el-select v-model="pageSize" size="small" class="ps-select" @change="onPageSizeChange">
            <el-option :value="10" label="10" /><el-option :value="20" label="20" /><el-option :value="50" label="50" />
          </el-select> 条
        </div>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
          :page-sizes="[10,20,50]" :total="filteredList.length"
          layout="prev, pager, next" background
          @size-change="onPageSizeChange" @current-change="onPageChange" />
      </div>
    </div>

    <!-- ======== 发起签到弹窗 ======== -->
    <el-dialog v-model="createVisible" title="发起签到" width="520px" destroy-on-close top="5vh" class="create-dialog">
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="签到标题" required>
          <el-input v-model="createForm.title" placeholder="如：第1次课堂签到" maxlength="40" />
        </el-form-item>
        <el-form-item label="关联课程" required>
          <el-select
            v-model="createForm.courseId"
            placeholder="请选择课程"
            filterable
            style="width:100%"
            @change="(val: number) => {
              const c = courseOptions.find(o => o.course_id === val)
              createForm.courseName = c?.course_name || ''
            }"
          >
            <el-option
              v-for="c in courseOptions"
              :key="c.course_id"
              :label="c.course_name"
              :value="c.course_id"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="班级" required>
              <el-select v-model="createForm.className" placeholder="请选择班级" style="width:100%">
                <el-option label="一班" value="一班" />
                <el-option label="二班" value="二班" />
                <el-option label="三班" value="三班" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" required>
              <el-date-picker
                v-model="createForm.endTime"
                type="datetime"
                placeholder="选择结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="footer-left"><el-button @click="createVisible = false">取消</el-button></div>
        <div class="footer-right">
          <el-button type="primary" @click="handleCreate" :loading="createLoading">发起签到</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ======== 签到明细弹窗 ======== -->
    <el-dialog v-model="detailVisible" :title="detailTitle + ' — 签到明细'" width="900px" destroy-on-close top="3vh" class="detail-dialog">
      <el-table :data="detailList" border stripe size="small" v-loading="detailLoading"
        :header-cell-style="{ backgroundColor:'#f8fafc', color:'#475569', fontWeight:'600' }">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column prop="studentName" label="姓名" width="100" align="center" />
        <el-table-column prop="studentNo" label="学号" min-width="130" align="center" />
        <el-table-column prop="className" label="班级" width="70" align="center" />
        <el-table-column label="签到状态" width="90" align="center">
          <template #default="{ row }">
            <span :class="['record-status', 'rs-' + row.status]">
              {{ statusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="签到方式" width="80" align="center">
          <template #default="{ row }">{{ row.method === 'manual' ? '手动' : '扫码' }}</template>
        </el-table-column>
        <el-table-column label="签到时间" min-width="160" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.signinTime ? formatTime(row.signinTime) : '-' }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ======== 手动签到弹窗 ======== -->
    <el-dialog v-model="manualVisible" :title="'手动签到 — ' + manualSignTitle" width="420px" destroy-on-close class="manual-dialog">
      <el-form :model="manualForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="manualForm.studentName" placeholder="请输入学生姓名" maxlength="20" />
        </el-form-item>
        <el-form-item label="学号" required>
          <el-input v-model="manualForm.studentNo" placeholder="请输入学号" maxlength="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualVisible = false">取消</el-button>
        <el-button type="primary" @click="handleManualSign" :loading="manualLoading">确认签到</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Plus, List, CircleCheck, SwitchButton, Download, Delete } from '@element-plus/icons-vue'
import PageHeaderCard from '@/components/PageHeaderCard.vue'
import { useSignInStore, type SignInSession, type SignInRecord } from '@/stores/signin'
import { useTrainingCourseStore } from '@/stores/training-course'
import { formatTime } from '@/utils/common'

const store = useSignInStore()
const courseStore = useTrainingCourseStore()

/** 可选课程列表（本地 store + API 合并） */
const courseOptions = ref<Array<{ course_id: number; course_name: string }>>([])

const loadCourseOptions = async () => {
  courseOptions.value = []
  // 从课程管理 store 加载（和课程管理列表完全一致）
  await courseStore.fetchCourses()
  const deletedNames: string[] = (() => {
    try { return JSON.parse(localStorage.getItem('deletedCourseNames') || '[]') } catch { return [] }
  })()
  for (const c of courseStore.courses) {
    // 跳过已被用户主动删除的课程
    if (!c.name || deletedNames.includes(c.name)) continue
    const numId = Number(c.id)
    // 只添加有效后端 ID 的课程（过滤本地临时 ID）
    if (!isNaN(numId) && numId > 0) {
      courseOptions.value.push({
        course_id: numId,
        course_name: c.name,
      })
    }
  }
}

// ==================== 筛选 ====================
const filterClass = ref('all')
const filterStatus = ref('all')

const filteredList = computed(() => {
  let list = [...store.sessions]
  if (filterClass.value !== 'all') list = list.filter(s => s.className === filterClass.value)
  if (filterStatus.value !== 'all') list = list.filter(s => s.status === filterStatus.value)
  return list
})
const onFilterChange = () => { currentPage.value = 1 }

// ==================== 分页 ====================
const currentPage = ref(1)
const pageSize = ref(10)
const currentPageData = computed(() => {
  const s = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(s, s + pageSize.value)
})
const onPageSizeChange = () => { currentPage.value = 1 }
const onPageChange = (p: number) => { currentPage.value = p }

// ==================== 发起签到 ====================
const createVisible = ref(false)
const createLoading = ref(false)
const createForm = reactive({
  title: '', courseId: null as number | null, courseName: '', className: '', endTime: '',
})

const openCreateDialog = () => {
  createForm.title = ''; createForm.courseId = null; createForm.courseName = ''
  createForm.className = ''; createForm.endTime = ''
  loadCourseOptions()
  createVisible.value = true
}

const handleCreate = async () => {
  if (!createForm.title.trim()) { ElMessage.warning('请输入签到标题'); return }
  if (createForm.courseId == null) { ElMessage.warning('请选择关联课程'); return }
  if (!createForm.endTime) { ElMessage.warning('请选择结束时间'); return }
  createLoading.value = true
  try {
    await store.addSession({
      courseId: createForm.courseId,
      title: createForm.title,
      courseName: createForm.courseName,
      className: createForm.className,
      department: '',
      checkinCode: '',
      startTime: new Date().toLocaleString('zh-CN'),
      endTime: createForm.endTime,
      status: 'ongoing',
    })
    createVisible.value = false
    ElMessage.success('签到已发起')
  } catch {
    // 本地已保存，但后端同步失败
    createVisible.value = false
    ElMessage.warning('签到已本地保存，后端同步失败，请检查网络')
  } finally {
    createLoading.value = false
  }
}

// ==================== 签到明细 ====================
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailTitle = ref('')
const detailList = ref<SignInRecord[]>([])

const statusLabel = (s: string) => ({ signed: '已签到', late: '迟到', absent: '未签到' }[s] || s)

const openDetailDialog = async (row: SignInSession) => {
  detailTitle.value = row.title
  detailVisible.value = true
  detailLoading.value = true
  try {
    detailList.value = await store.fetchDetail(row.id)
  } catch {
    detailList.value = []
    ElMessage.warning('获取签到明细失败')
  } finally {
    detailLoading.value = false
  }
}

// ==================== 手动签到 ====================
const manualVisible = ref(false)
const manualLoading = ref(false)
const manualSignId = ref(0)
const manualSignTitle = ref('')
const manualForm = reactive({ studentName: '', studentNo: '' })

const openManualSignDialog = (row: SignInSession) => {
  manualSignId.value = row.id
  manualSignTitle.value = row.title
  manualForm.studentName = ''; manualForm.studentNo = ''
  manualVisible.value = true
}

const handleManualSign = async () => {
  if (!manualForm.studentNo.trim()) { ElMessage.warning('请输入学号'); return }
  manualLoading.value = true
  try {
    await store.doManualSign(manualSignId.value, manualForm.studentNo, manualForm.studentName || undefined)
    ElMessage.success('签到成功')
    manualVisible.value = false
  } catch {
    ElMessage.error('签到失败，请重试')
  } finally {
    manualLoading.value = false
  }
}

// ==================== 删除签到 ====================
const selectedIds = ref<number[]>([])

const onSelectionChange = (rows: SignInSession[]) => {
  selectedIds.value = rows.map(r => r.id)
}

const handleDelete = async (row: SignInSession) => {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.title}」的签到记录吗？删除后不可恢复。`,
      '删除签到', { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', customClass: 'no-icon-dlg' }
    )
    await store.doDelete(row.id)
    ElMessage.success('已删除')
  } catch { /* 取消 */ }
}

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedIds.value.length} 条签到记录吗？删除后不可恢复。`,
      '批量删除', { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', customClass: 'no-icon-dlg' }
    )
    await store.doBatchDelete(selectedIds.value)
    selectedIds.value = []
    ElMessage.success('批量删除完成')
  } catch { /* 取消 */ }
}

// ==================== 结束签到 ====================
const handleEndSignIn = async (row: SignInSession) => {
  try {
    await ElMessageBox.confirm(
      `确定要结束「${row.title}」的签到吗？结束后学生将无法继续签到。`,
      '结束签到', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await store.doEndSignIn(row.id)
    ElMessage.success('签到已结束')
  } catch { /* 取消 */ }
}

// ==================== 导出 ====================
const handleExport = async (row: SignInSession) => {
  try {
    await store.doExport(row.id)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败，请重试')
  }
}

// 自动结束签到定时器
let autoEndTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  store.fetchSessions()
  loadCourseOptions()
  // 每 30 秒检查一次是否有到期的签到
  autoEndTimer = setInterval(() => {
    store.autoEndExpiredSessions()
  }, 30000)
})

onUnmounted(() => {
  if (autoEndTimer) { clearInterval(autoEndTimer); autoEndTimer = null }
})
</script>

<style scoped>
.signin-page { min-height: calc(100vh - 40px); padding: 20px; }

.toolbar-card { display:flex; align-items:center; flex-wrap:wrap; gap:8px;
  background:#fff; border-radius:12px; padding:14px 24px; margin:16px 0; box-shadow:0 1px 3px rgba(0,0,0,.08); }

.table-card { background:#fff; border-radius:12px; padding:20px 24px; box-shadow:0 1px 3px rgba(0,0,0,.08); }

.status-tag { padding:2px 10px; border-radius:4px; font-size:12px; font-weight:500; }
.s-ongoing { background:#e1f3d8; color:#67c23a; }
.s-ended { background:#f1f5f9; color:#64748b; }

.count-text { font-weight:600; color:#303133; }

.record-status { padding:1px 8px; border-radius:4px; font-size:12px; font-weight:500; }
.rs-signed { background:#e1f3d8; color:#67c23a; }
.rs-late { background:#fef3c7; color:#d97706; }
.rs-absent { background:#fee2e2; color:#dc2626; }

.pagination-wrapper { display:flex; justify-content:space-between; align-items:center; margin-top:20px; flex-wrap:wrap; gap:12px; }
.pagination-info { display:flex; align-items:center; gap:6px; font-size:13px; color:#606266; }
.pagination-info strong { color:#303133; }
.ps-select { width:80px; }

.create-dialog :deep(.el-dialog__footer),
.detail-dialog :deep(.el-dialog__footer),
.manual-dialog :deep(.el-dialog__footer) { display:flex; justify-content:space-between; align-items:center; }
.footer-right { display:flex; gap:8px; }
</style>
