<template>
  <div class="account-container">
    <PageHeaderCard title="账号管理" subtitle="管理系统用户账户">
      <template #icon><el-icon><UserIcon /></el-icon></template>
      <template #default>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon> 新增账号
        </el-button>
        <el-button type="primary" @click="handleExportUsers" style="margin-left:8px">
          <el-icon><Download /></el-icon> 导出用户Excel
        </el-button>
      </template>
    </PageHeaderCard>

    <!-- 筛选 -->
    <div class="toolbar-card">
      <el-radio-group v-model="filterStatus" size="small" style="margin-left:12px">
        <el-radio-button value="all">全部状态</el-radio-button>
        <el-radio-button value="active">启用</el-radio-button>
        <el-radio-button value="disabled">禁用</el-radio-button>
      </el-radio-group>
      <el-input v-model="searchKeyword" placeholder="搜索姓名或邮箱" clearable class="search-input"
        :prefix-icon="Search" style="margin-left:auto;width:220px" />
      <el-button @click="resetFilter" style="margin-left:8px">重置</el-button>
      <el-button type="primary" @click="handleRefresh"><el-icon><Refresh /></el-icon> 刷新</el-button>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <el-table :data="currentPageData" border stripe @selection-change="handleSelectionChange"
        :header-cell-style="{ backgroundColor:'#f8fafc',color:'#475569',fontWeight:'600',textAlign:'center' }"
        :cell-style="{ textAlign:'center' }">
        <el-table-column type="selection" width="50" />
        <el-table-column type="index" label="序号" width="65" />
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <span :class="row.status === 'active' ? 'status-active' : 'status-disabled'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" min-width="160" />
        <el-table-column label="账户详情" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button v-if="row.status === 'disabled'" type="success" link size="small" @click="handleEnable(row)">
              <el-icon><CircleCheck /></el-icon> 启用
            </el-button>
            <el-button v-if="row.status === 'active'" type="warning" link size="small" @click="handleDisable(row)">
              <el-icon><CircleClose /></el-icon> 禁用
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <div class="batch-actions" v-if="selectedIds.length>0">
          已选 <strong>{{ selectedIds.length }}</strong> 条
          <el-button type="danger" size="small" @click="handleBatchDelete" :disabled="selectedIds.includes(1)" style="margin-left:12px">批量删除</el-button>
        </div>
        <div class="pagination-info" style="margin-left:auto">
          共 <strong>{{ filteredList.length }}</strong> 条，每页
          <el-select v-model="pageSize" size="small" style="width:80px;margin:0 6px" @change="onPageSizeChange">
            <el-option :value="10" label="10" /><el-option :value="20" label="20" /><el-option :value="50" label="50" />
          </el-select> 条
        </div>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
          :page-sizes="[10,20,50]" :total="filteredList.length"
          layout="prev,pager,next" background @size-change="onPageSizeChange" @current-change="onPageChange" />
      </div>
    </div>

    <!-- 账户详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="detailUser?.name + ' — 账户详情'" width="480px" destroy-on-close>
      <div v-if="detailUser" class="detail-body">
        <div class="detail-row"><span class="dl">姓名</span><span class="dv">{{ detailUser.name }}</span></div>
        <div class="detail-row"><span class="dl">邮箱</span><span class="dv">{{ detailUser.email }}</span></div>
        <div class="detail-row"><span class="dl">学号</span><span class="dv">{{ detailUser.studentNo || '-' }}</span></div>
        <div class="detail-row"><span class="dl">电话号码</span><span class="dv">{{ detailUser.phone || '-' }}</span></div>
        <div class="detail-row"><span class="dl">注册时间</span><span class="dv">{{ detailUser.createdAt || '-' }}</span></div>
      </div>
      <template #footer><el-button @click="detailVisible=false">关闭</el-button></template>
    </el-dialog>

    <!-- 新增账号弹窗 -->
    <el-dialog v-model="createVisible" title="新增学员账号" width="580px" destroy-on-close top="3vh" class="create-dialog">
      <el-form :model="createForm" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="createForm.name" placeholder="请输入真实姓名" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号" required>
              <el-input v-model="createForm.studentNo" placeholder="请输入学号" maxlength="20" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="邮箱" required>
          <el-input v-model="createForm.email" placeholder="请输入邮箱地址" maxlength="60" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="createForm.password" placeholder="请输入初始密码" maxlength="30" show-password />
        </el-form-item>
        <el-form-item label="电话号码">
          <el-input v-model="createForm.phone" placeholder="请输入手机号码" maxlength="11" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="footer-left">
          <el-button @click="createVisible = false">取消</el-button>
        </div>
        <div class="footer-right">
          <el-button type="primary" @click="handleCreateUser" :loading="createLoading">
            <el-icon><Plus /></el-icon> 创建账号
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User as UserIcon, Search, Delete, Download, Refresh, CircleCheck, CircleClose, Plus } from '@element-plus/icons-vue'
import { useAccountStore } from '@/stores/account'
import type { User } from '@/stores/account'
import PageHeaderCard from '@/components/PageHeaderCard.vue'

const store = useAccountStore()

const searchKeyword = ref('')
const filterStatus = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedIds = ref<number[]>([])
const loading = ref(false)

const filteredList = computed(() => {
  let list = [...store.users]
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(u => (u.name || '').toLowerCase().includes(kw) || (u.email || '').toLowerCase().includes(kw))
  }
  if (filterStatus.value !== 'all') list = list.filter(u => u.status === filterStatus.value)
  return list
})

const currentPageData = computed(() => {
  const s = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(s, s + pageSize.value)
})

const onPageSizeChange = () => { currentPage.value = 1 }
const onPageChange = (p: number) => { currentPage.value = p }

const handleRefresh = async () => {
  loading.value = true
  try {
    await store.fetchUsers()
    ElMessage.success('已刷新')
  } catch {
    ElMessage.error('刷新失败，请重试')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  searchKeyword.value = ''; filterStatus.value = 'all'; currentPage.value = 1
}

const handleEnable = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确定启用「${row.name}」的账号吗？`, '确认启用', {
      confirmButtonText: '确定启用', cancelButtonText: '取消', type: 'info'
    })
    loading.value = true
    await store.toggleUserStatus(row.id)
    loading.value = false
    ElMessage.success(`「${row.name}」已启用`)
  } catch { /* 取消 */ }
}

const handleDisable = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确定禁用「${row.name}」的账号吗？禁用后该用户将无法登录系统。`, '确认禁用', {
      confirmButtonText: '确定禁用', cancelButtonText: '取消', type: 'warning'
    })
    loading.value = true
    await store.toggleUserStatus(row.id)
    loading.value = false
    ElMessage.success(`「${row.name}」已禁用`)
  } catch { /* 取消 */ }
}

const handleSelectionChange = (val: User[]) => { selectedIds.value = val.map(v => v.id) }

const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」？`,'提示',{type:'warning'})
  } catch { return }
  loading.value = true
  try {
    await store.deleteUser(row.id)
    ElMessage.success('已删除')
  } catch {
    ElMessage.error('删除失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定删除选中的${selectedIds.value.length}个账户？`,'提示',{type:'warning', customClass: 'no-icon-dlg'})
  } catch { return }
  loading.value = true
  try {
    await store.batchDeleteUsers(selectedIds.value)
    selectedIds.value = []
    ElMessage.success('批量删除完成')
  } catch {
    ElMessage.error('批量删除失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleExportUsers = async () => {
  try {
    await ElMessageBox.confirm('确定导出当前列表中的用户数据？','提示',{type:'info'})
  } catch { return }
  try {
    await store.exportUsers()
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败，请重试')
  }
}

// 账户详情
const detailVisible = ref(false)
const detailUser = ref<User | null>(null)
const detailLoading = ref(false)
const openDetail = async (row: User) => {
  detailVisible.value = true
  detailLoading.value = true
  const detail = await store.fetchUserDetail(row.id)
  detailUser.value = detail || row
  detailLoading.value = false
}

// 新增账号
const createVisible = ref(false)
const createLoading = ref(false)
const createForm = reactive({
  name: '',
  email: '',
  studentNo: '',
  password: '',
  phone: '',
})

const resetCreateForm = () => {
  createForm.name = ''
  createForm.email = ''
  createForm.studentNo = ''
  createForm.password = ''
  createForm.phone = ''
}

const openCreateDialog = () => {
  resetCreateForm()
  createVisible.value = true
}

const handleCreateUser = async () => {
  if (!createForm.name.trim()) { ElMessage.warning('请输入姓名'); return }
  if (!createForm.studentNo.trim()) { ElMessage.warning('请输入学号'); return }
  if (!createForm.email.trim()) { ElMessage.warning('请输入邮箱'); return }
  if (!createForm.password.trim()) { ElMessage.warning('请输入密码'); return }
  createLoading.value = true
  try {
    await store.addUser({
      username: createForm.email,
      name: createForm.name,
      email: createForm.email,
      role: 'normal',
      status: 'active' as const,
      studentNo: createForm.studentNo,
      password: createForm.password,
      phone: createForm.phone,
      department: 'software',
      className: '',
    })
    createVisible.value = false
    ElMessage.success('账号创建成功！')
  } catch (err: any) {
    const msg = err?.message || err?.response?.data?.detail || '创建失败，请重试'
    ElMessage.error(typeof msg === 'string' ? msg : '创建失败，请重试')
  } finally {
    createLoading.value = false
  }
}

onMounted(() => { store.fetchUsers() })
</script>

<style scoped>
.account-container { padding:20px; }
.toolbar-card { display:flex; align-items:center; flex-wrap:wrap; gap:8px;
  background:#fff; border-radius:12px; padding:12px 20px; margin:16px 0; box-shadow:0 1px 3px rgba(0,0,0,.08); }
.search-input { width:220px; }
.table-card { background:#fff; border-radius:12px; padding:20px 24px; box-shadow:0 1px 3px rgba(0,0,0,.08); }
.status-active { padding:2px 10px; border-radius:4px; font-size:12px; font-weight:500; background:#e1f3d8; color:#67c23a; }
.status-disabled { padding:2px 10px; border-radius:4px; font-size:12px; font-weight:500; background:#fde2e2; color:#f56c6c; }

.pagination-wrapper { display:flex; align-items:center; margin-top:20px; flex-wrap:wrap; gap:12px; }
.pagination-info { display:flex; align-items:center; font-size:13px; color:#606266; }
.pagination-info strong { color:#303133; }
.batch-actions { display:flex; align-items:center; font-size:13px; color:#64748b; }

.detail-body { padding:8px 0; }
.detail-row { display:flex; padding:10px 14px; border-bottom:1px solid #f1f5f9; }
.detail-row:last-child { border:none; }
.dl { width:80px; font-size:14px; color:#64748b; flex-shrink:0; }
.dv { font-size:14px; color:#1e293b; }

.create-dialog :deep(.el-dialog__footer) { display:flex; justify-content:space-between; align-items:center; }
.footer-right { display:flex; gap:8px; }
</style>
