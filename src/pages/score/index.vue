<template>
  <div class="score-page">
    <PageHeaderCard title="学员表现" subtitle="Student Performance">
      <template #icon><el-icon><Reading /></el-icon></template>
    </PageHeaderCard>

    <!-- 筛选 + 搜索 -->
    <div class="toolbar-card">
      <div class="toolbar-left">
        <el-radio-group v-model="filterClass" size="small" style="margin-left:16px" @change="onFilterChange">
          <el-radio-button value="all">全部班级</el-radio-button>
          <el-radio-button value="1班">1班</el-radio-button>
          <el-radio-button value="2班">2班</el-radio-button>
          <el-radio-button value="3班">3班</el-radio-button>
        </el-radio-group>
        </div>
        <div class="toolbar-center">
          <span class="sort-label">排序：</span>
          <el-radio-group v-model="sortOrder" size="small" @change="onFilterChange">
            <el-radio-button value="desc">评分 ↓</el-radio-button>
            <el-radio-button value="asc">评分 ↑</el-radio-button>
          </el-radio-group>
        </div>
        <div class="toolbar-right">
        <el-input v-model="searchName" placeholder="搜索学生姓名" clearable class="search-input"
          :prefix-icon="Search" @input="onFilterChange" />
        <el-button type="primary" @click="batchExport" style="margin-left:12px">
          <el-icon><Download /></el-icon> 批量打印
        </el-button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <el-table :data="currentPageData" border stripe
        :header-cell-style="{ backgroundColor:'#f8fafc', color:'#475569', fontWeight:'600' }">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="姓名" min-width="100" align="center" />
        <el-table-column prop="studentId" label="学号" min-width="130" align="center" />
        <el-table-column prop="className" label="所属班级" min-width="100" align="center">
          <template #default="{ row }">{{ row.className || '-' }}</template>
        </el-table-column>
        <el-table-column label="作业完成" min-width="110" align="center">
          <template #default="{ row }">{{ row.submitCount }} / {{ row.homeworkCount }}</template>
        </el-table-column>
        <el-table-column label="平均分" min-width="90" align="center">
          <template #default="{ row }">
            <span :class="['rating-badge', getRatingClass(row.avgScore ?? 0)]">
              {{ row.avgScore != null ? row.avgScore : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="提交率" min-width="90" align="center">
          <template #default="{ row }">{{ formatSubmitRate(row) }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">
              <el-icon><View /></el-icon> 查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="pagination-info">
          共 <strong>{{ filteredList.length }}</strong> 条，每页
          <el-select v-model="pageSize" size="small" class="ps-select" @change="onPageSizeChange">
            <el-option :value="10" label="10" />
            <el-option :value="20" label="20" />
            <el-option :value="50" label="50" />
          </el-select> 条
        </div>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
          :page-sizes="[10,20,50]" :total="filteredList.length"
          layout="prev, pager, next" background
          @size-change="onPageSizeChange" @current-change="onPageChange" />
      </div>
    </div>

    <!-- ======== 表现详情弹窗 ======== -->
    <el-dialog v-model="detailVisible" :title="detailStudent?.name + ' — 综合表现'"
      width="800px" destroy-on-close top="3vh" class="detail-dialog">
      <div v-if="detailStudent" class="detail-body">
        <!-- 出勤 -->
        <div class="section">
          <h4 class="section-title"><el-icon><Calendar /></el-icon> 出勤情况</h4>
          <el-table :data="detailStudent.attendance" border size="small"
            :header-cell-style="{ backgroundColor:'#f8fafc' }">
            <el-table-column prop="courseName" label="课程" />
            <el-table-column label="出勤/总课时" width="130" align="center">
              <template #default="{ row }">{{ row.attended }} / {{ row.total }}</template>
            </el-table-column>
            <el-table-column label="出勤率" width="100" align="center">
              <template #default="{ row }">{{ Math.round(row.attended / row.total * 100) }}%</template>
            </el-table-column>
          </el-table>
          <div class="summary-row">
            <span>总计出勤率：<strong :class="rateColor(detailStudent.attendanceRate)">{{ detailStudent.attendanceRate }}%</strong></span>
          </div>
        </div>

        <!-- 作业 -->
        <div class="section">
          <h4 class="section-title"><el-icon><Notebook /></el-icon> 作业成绩</h4>
          <el-table :data="detailStudent.homeworkScores" border size="small"
            :header-cell-style="{ backgroundColor:'#f8fafc' }">
            <el-table-column prop="title" label="作业" />
            <el-table-column label="得分/满分" width="130" align="center">
              <template #default="{ row }">{{ row.score }} / {{ row.fullScore }}</template>
            </el-table-column>
            <el-table-column label="得分率" width="100" align="center">
              <template #default="{ row }">{{ Math.round(row.score / row.fullScore * 100) }}%</template>
            </el-table-column>
          </el-table>
          <div class="summary-row">
            <span>作业平均分：<strong :class="rateColor(detailStudent.homeworkAvg)">{{ detailStudent.homeworkAvg }}</strong></span>
          </div>
        </div>

        <!-- 考试 -->
        <div class="section">
          <h4 class="section-title"><el-icon><TrophyBase /></el-icon> 考试成绩</h4>
          <el-table :data="detailStudent.examScores" border size="small"
            :header-cell-style="{ backgroundColor:'#f8fafc' }">
            <el-table-column prop="title" label="考试" />
            <el-table-column label="得分/满分" width="130" align="center">
              <template #default="{ row }">{{ row.score }} / {{ row.fullScore }}</template>
            </el-table-column>
            <el-table-column label="得分率" width="100" align="center">
              <template #default="{ row }">{{ Math.round(row.score / row.fullScore * 100) }}%</template>
            </el-table-column>
          </el-table>
          <div class="summary-row">
            <span>考试平均分：<strong :class="rateColor(detailStudent.examAvg)">{{ detailStudent.examAvg }}</strong></span>
          </div>
        </div>

        <!-- 综合评分 -->
        <div class="total-score-box">
          <span>综合评分</span>
          <div class="score-display">
            <span class="score-value">{{ detailStudent.rating }} 分</span>
            <el-input-number v-model="detailStudent.rating" :min="0" :max="100" size="small" style="width:130px" />
            <el-button type="primary" @click="saveRating" :loading="saveLoading">保存评分</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportDetail" type="success" plain>
          <el-icon><Download /></el-icon> 导出成绩
        </el-button>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Reading, View, Calendar, Notebook, TrophyBase, Download, Search } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import PageHeaderCard from '@/components/PageHeaderCard.vue'
import { useScoreStore } from '@/stores/score'
import type { StudentRecord } from '@/stores/score'

const store = useScoreStore()

// ==================== 筛选 ====================
const filterClass = ref('all')
const searchName = ref('')
const sortOrder = ref('desc')

const filteredList = computed(() => {
  let list = [...store.students]
  if (filterClass.value !== 'all') list = list.filter(s => s.className === filterClass.value)
  if (searchName.value.trim()) {
    const kw = searchName.value.trim().toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(kw))
  }
  list.sort((a, b) => {
    const va = a.avgScore ?? 0
    const vb = b.avgScore ?? 0
    return sortOrder.value === 'desc' ? vb - va : va - vb
  })
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

// ==================== 辅助 ====================
const getRatingClass = (r: number) => r >= 90 ? 'excellent' : r >= 75 ? 'good' : r >= 60 ? 'ok' : 'poor'
const rateColor = (v: number) => v >= 90 ? 'c-green' : v >= 75 ? 'c-blue' : v >= 60 ? 'c-orange' : 'c-red'
const formatSubmitRate = (row: StudentRecord) => {
  if (row.homeworkCount === 0) return '无作业'
  if (row.submitRate === 'N/A') return '无作业'
  return row.submitRate
}

// ==================== 详情弹窗 ====================
const detailVisible = ref(false)
const detailStudent = ref<StudentRecord | null>(null)
const saveLoading = ref(false)

const openDetail = async (row: StudentRecord) => {
  detailVisible.value = true
  try {
    const detail = await store.fetchPerformanceDetail(row.id)
    detailStudent.value = detail ? JSON.parse(JSON.stringify(detail)) : JSON.parse(JSON.stringify(row))
  } catch {
    detailStudent.value = JSON.parse(JSON.stringify(row))
    ElMessage.warning('获取表现详情失败，使用本地数据')
  }
}

const saveRating = () => {
  if (!detailStudent.value) return
  saveLoading.value = true
  store.updateRating(detailStudent.value.id, detailStudent.value.rating)
  saveLoading.value = false
  ElMessage.success('评分已保存')
}

// ==================== 导出 ====================
const exportDetail = () => {
  if (!detailStudent.value) return
  const s = detailStudent.value

  const attendanceData = s.attendance.map(a => ({
    '课程': a.courseName, '出勤课时': a.attended, '总课时': a.total,
    '出勤率': Math.round(a.attended / a.total * 100) + '%',
  }))
  const hwData = s.homeworkScores.map(h => ({
    '作业': h.title, '得分': h.score, '满分': h.fullScore,
    '得分率': Math.round(h.score / h.fullScore * 100) + '%',
  }))
  const examData = s.examScores.map(e => ({
    '考试': e.title, '得分': e.score, '满分': e.fullScore,
    '得分率': Math.round(e.score / e.fullScore * 100) + '%',
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attendanceData), '出勤')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hwData), '作业')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(examData), '考试')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
    '姓名': s.name,
    '班级': s.className, '出勤率': s.attendanceRate + '%',
    '作业平均': s.homeworkAvg, '考试平均': s.examAvg, '综合评分': s.rating,
  }]), '汇总')

  XLSX.writeFile(wb, `${s.name}_综合表现.xlsx`)
  ElMessage.success('已导出')
}

const batchExport = () => {
  const data = filteredList.value.map((s, i) => ({
    '序号': i + 1,
    '姓名': s.name,
    '学号': s.studentId,
    '班级': s.className,
    '作业完成': `${s.submitCount}/${s.homeworkCount}`,
    '平均分': s.avgScore != null ? s.avgScore : '-',
    '提交率': s.submitRate,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '学员表现')
  XLSX.writeFile(wb, `学员表现_${new Date().toLocaleString('zh-CN').replace(/[/: ]/g, '-')}.xlsx`)
  ElMessage.success('已导出')
}

onMounted(() => { store.fetchStudents() })
</script>

<style scoped>
.score-page { min-height:calc(100vh - 40px); padding:20px; }

.toolbar-card { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;
  background:#fff; border-radius:12px; padding:14px 24px; margin:16px 0; box-shadow:0 1px 3px rgba(0,0,0,.08); }
.toolbar-left { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
.toolbar-center { display:flex; align-items:center; gap:6px; }
.sort-label { font-size:13px; color:#64748b; }
.search-input { width:220px; }

.table-card { background:#fff; border-radius:12px; padding:20px 24px; box-shadow:0 1px 3px rgba(0,0,0,.08); }
.rating-badge { padding:4px 12px; border-radius:12px; font-size:14px; font-weight:700; }
.excellent { background:#e1f3d8; color:#16a34a; }
.good { background:#dbeafe; color:#2563eb; }
.ok { background:#fef3c7; color:#d97706; }
.poor { background:#fee2e2; color:#dc2626; }

.pagination-wrapper { display:flex; justify-content:space-between; align-items:center; margin-top:20px; flex-wrap:wrap; gap:12px; }
.pagination-info { display:flex; align-items:center; gap:6px; font-size:13px; color:#606266; }
.pagination-info strong { color:#303133; }
.ps-select { width:80px; }

/* 详情弹窗 */
.detail-body { max-height:60vh; overflow-y:auto; padding-right:4px; }
.section { margin-bottom:20px; }
.section-title { display:flex; align-items:center; gap:6px; font-size:15px; color:#1e293b; margin:0 0 10px; }
.summary-row { margin-top:8px; padding:6px 10px; background:#f8fafc; border-radius:4px; font-size:14px; color:#475569; }
.c-green { color:#16a34a; }
.c-blue { color:#2563eb; }
.c-orange { color:#d97706; }
.c-red { color:#dc2626; }

.total-score-box { display:flex; justify-content:space-between; align-items:center;
  margin-top:20px; padding:16px 20px; background:linear-gradient(135deg,#eff6ff,#dbeafe); border-radius:10px; font-size:16px; font-weight:600; color:#1e293b; }
.score-display { display:flex; align-items:center; gap:10px; }
.score-value { font-size:24px; font-weight:700; color:#2563eb; }
</style>
