<template>
  <div class="detail-page">
    <PageHeaderCard title="培训名单" subtitle="Training Detail">
      <template #icon><el-icon><Collection /></el-icon></template>
    </PageHeaderCard>

    <!-- 筛选 -->
    <div class="toolbar-card">
      <div class="toolbar-left">
        <el-radio-group v-model="filterClass" size="small" @change="onFilterChange">
          <el-radio-button value="all">全部班级</el-radio-button>
          <el-radio-button value="一班">一班</el-radio-button>
          <el-radio-button value="二班">二班</el-radio-button>
          <el-radio-button value="三班">三班</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button class="btn-export" @click="handleExport" :loading="exportLoading">
          <el-icon><Download /></el-icon> 导出名单
        </el-button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <el-table :data="currentPageData" border stripe v-loading="loading"
        :header-cell-style="{ backgroundColor:'#f8fafc', color:'#475569', fontWeight:'600' }">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="姓名" min-width="100" align="center" />
        <el-table-column prop="studentId" label="学号" min-width="130" align="center" />
        <el-table-column prop="college" label="学院" min-width="160" align="center" show-overflow-tooltip />
        <el-table-column prop="major" label="专业" min-width="140" align="center" show-overflow-tooltip />
        <el-table-column prop="className" label="班级" min-width="120" align="center" />
        <el-table-column prop="phone" label="手机号" min-width="130" align="center" />
        <el-table-column prop="groupName" label="培训分班" width="120" align="center" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="pagination-info">
          共 <strong>{{ filteredList.length }}</strong> 条，每页
          <el-select v-model="pageSize" size="small" class="ps-select" @change="onPageSizeChange">
            <el-option :value="10" label="10" />
            <el-option :value="20" label="20" />
            <el-option :value="50" label="50" />
          </el-select>
          条
        </div>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
          :page-sizes="[10,20,50]" :total="filteredList.length"
          layout="prev, pager, next" background
          @size-change="onPageSizeChange" @current-change="onPageChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Collection, Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import PageHeaderCard from '@/components/PageHeaderCard.vue'
import { getClassList, exportClassList, type ClassListItem } from '@/api/training'

// ==================== 数据 ====================
const list = ref<ClassListItem[]>([])
const loading = ref(false)
const exportLoading = ref(false)

// ==================== 筛选 ====================
const filterClass = ref('all')
const GROUP_IDS = [1, 2, 3]

const filteredList = computed(() => list.value)

const onFilterChange = () => {
  currentPage.value = 1
  fetchList()
}

// ==================== 分页 ====================
const currentPage = ref(1)
const pageSize = ref(10)

const currentPageData = computed(() => {
  const s = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(s, s + pageSize.value)
})

const onPageSizeChange = () => { currentPage.value = 1 }
const onPageChange = (p: number) => { currentPage.value = p }

// ==================== 导出 ====================
const handleExport = async () => {
  exportLoading.value = true
  try {
    const gid = filterClass.value !== 'all' ? filterClass.value : ''
    const res = await exportClassList(String(gid))
    const rawList = (res as any).data?.list || (res as any).list || []
    const exportData = rawList.map((item: any, i: number) => ({
      '序号': i + 1,
      '姓名': item['姓名'] || item.name || '',
      '学号': item['学号'] || item.studentId || '',
      '学院': item['学院'] || item.college || '',
      '专业': item['专业'] || item.major || '',
      '班级': item['班级'] || item.className || '',
      '分班': item['分班'] || item.groupName || '',
      '手机号': item['手机号'] || item.phone || '',
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    ws['!cols'] = [
      { wch: 6 }, { wch: 10 }, { wch: 14 }, { wch: 22 },
      { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '培训名单')
    const timestamp = new Date().toLocaleString('zh-CN').replace(/[/: ]/g, '-')
    XLSX.writeFile(wb, `培训名单_${timestamp}.xlsx`)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// ==================== 数据加载 ====================
const classGroupMap: Record<string, string> = { '一班': '1', '二班': '2', '三班': '3' }

const fetchList = async () => {
  loading.value = true
  try {
    if (filterClass.value === 'all') {
      const all: ClassListItem[] = []
      for (const id of GROUP_IDS) {
        try {
          const res = await getClassList(String(id))
          const data = (res as any).data || res
          console.log(`📋 groupId=${id} 返回:`, data)
          all.push(...(data.list || []))
        } catch (e) {
          console.warn(`📋 groupId=${id} 请求失败:`, e)
        }
      }
      list.value = all
    } else {
      const gid = classGroupMap[filterClass.value] || '1'
      const res = await getClassList(gid)
      const data = (res as any).data || res
      console.log('📋 培训名单返回:', data)
      list.value = data.list || []
    }
  } catch (e) {
    console.warn('获取培训名单失败:', e)
    list.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.detail-page {
  min-height: calc(100vh - 40px);
  padding: 20px;
}

.toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-export {
  background: linear-gradient(135deg, #67c23a, #85ce61) !important;
  border: none !important;
  color: #fff !important;
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
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
}

.ps-select {
  width: 80px;
  margin: 0 4px;
}
</style>
