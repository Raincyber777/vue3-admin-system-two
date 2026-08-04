<template>
  <div class="course-page">
    <PageHeaderCard title="课程管理" subtitle="Course Management">
      <template #icon><el-icon><Collection /></el-icon></template>
      <template #default>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon> 新增课程
        </el-button>
      </template>
    </PageHeaderCard>

    <!-- 筛选 -->
    <div class="toolbar-card">
      <el-radio-group v-model="filterClass" size="small" style="margin-left:16px" @change="onFilterChange">
        <el-radio-button value="all">全部班级</el-radio-button>
        <el-radio-button value="1班">1班</el-radio-button>
        <el-radio-button value="2班">2班</el-radio-button>
        <el-radio-button value="3班">3班</el-radio-button>
      </el-radio-group>
      <el-radio-group v-model="filterStatus" size="small" style="margin-left:16px" @change="onFilterChange">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="published">已发布</el-radio-button>
        <el-radio-button value="draft">草稿</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <el-table :data="currentPageData" border stripe v-loading="store.loading"
        :header-cell-style="{ backgroundColor:'#f8fafc', color:'#475569', fontWeight:'600' }">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="封面" width="80" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.coverImg"
              :src="row.coverImg"
              :preview-src-list="[row.coverImg]"
              fit="cover"
              style="width:50px;height:50px;border-radius:6px"
              preview-teleported
            />
            <span v-else class="no-cover">-</span>
          </template>
        </el-table-column>
        <el-table-column label="班级" width="80" align="center">
          <template #default="{ row }">{{ row.className || '-' }}</template>
        </el-table-column>
        <el-table-column prop="name" label="课程名" min-width="160" show-overflow-tooltip />
        <el-table-column label="课程描述" min-width="240">
          <template #default="{ row }">
            <span class="desc-link" @click="openDescDialog(row)" :title="'点击查看完整描述'">
              {{ truncate(row.description, 20) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="instructor" label="主讲人" width="100" align="center" />
        <el-table-column label="日期" min-width="260" align="center">
          <template #default="{ row }">
            <span>{{ row.startTime }} ~ {{ row.endTime }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="trainingLocation" label="地点" width="140" align="center" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <span :class="['status-tag', 's-' + row.status]">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="270" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button type="primary" link size="small" @click="openSessionDialog(row)">
              <el-icon><Calendar /></el-icon> 安排
            </el-button>
            <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="handlePublish(row)">
              <el-icon><CircleCheck /></el-icon> 发布
            </el-button>
            <el-button v-if="row.status === 'published'" type="warning" link size="small" @click="handleUnpublish(row)">
              <el-icon><Bottom /></el-icon> 下架
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

    <!-- ======== 新增/编辑弹窗 ======== -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑课程' : '新增课程'"
      width="700px" destroy-on-close top="5vh" class="course-dialog">
      <el-form :model="form" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="班级" required>
              <el-select v-model="form.className" style="width:100%">
                <el-option label="1班" value="1班" />
                <el-option label="2班" value="2班" />
                <el-option label="3班" value="3班" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="课程名" required>
          <el-input v-model="form.name" placeholder="请输入课程名" maxlength="60" />
        </el-form-item>
        <el-form-item label="课程描述" required>
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入课程描述" maxlength="300" show-word-limit />
        </el-form-item>
        <el-form-item label="主讲人" required>
          <el-input v-model="form.instructor" placeholder="请输入主讲人" maxlength="30" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始时间" label-width="90px" required>
              <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间"
                format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" label-width="90px" required>
              <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间"
                format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地点" required>
          <el-input v-model="form.trainingLocation" placeholder="请输入培训地点" maxlength="60" />
        </el-form-item>
        <el-form-item label="课程封面">
          <div class="cover-upload">
            <el-upload
              :auto-upload="false"
              :limit="1"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              :show-file-list="false"
              :on-change="handleCoverChange"
            >
              <div class="cover-preview" v-if="coverPreview || form.coverImg">
                <el-image :src="coverPreview || form.coverImg" fit="cover" style="width:160px;height:100px;border-radius:8px" />
                <div class="cover-overlay">
                  <el-icon><Edit /></el-icon>
                  <span>更换封面</span>
                </div>
              </div>
              <div v-else class="cover-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span>上传封面</span>
                <span class="upload-hint">支持 JPG/PNG/GIF/WebP</span>
              </div>
            </el-upload>
            <el-button v-if="coverPreview || form.coverImg" link type="danger" size="small" @click="removeCover" style="margin-left:12px">移除封面</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="footer-left">
          <el-button @click="dialogVisible = false">取消</el-button>
        </div>
        <div class="footer-right">
          <template v-if="!isEdit">
            <el-button @click="handleSaveDraft" :loading="saveLoading">存为草稿</el-button>
            <el-button type="primary" @click="handlePublishClick" :loading="saveLoading">发布课程</el-button>
          </template>
          <template v-else>
            <el-button type="primary" @click="handleSave" :loading="saveLoading">保存修改</el-button>
          </template>
        </div>
      </template>
    </el-dialog>

    <!-- 发布确认弹窗 -->
    <el-dialog v-model="confirmVisible" title="确认发布" width="420px" destroy-on-close align-center class="confirm-dialog">
      <div class="confirm-body">
        <el-icon class="confirm-icon"><CircleCheck /></el-icon>
        <p>确认发布该课程？</p>
        <p class="confirm-detail">发布后课程将变为"已发布"状态，学生即可查看。</p>
      </div>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" @click="doPublish" :loading="saveLoading">确认发布</el-button>
      </template>
    </el-dialog>

    <!-- 课程描述弹窗 -->
    <el-dialog v-model="descVisible" :title="descCourse?.name || '课程描述'" width="520px" destroy-on-close class="desc-dialog">
      <div class="desc-full">{{ descCourse?.description }}</div>
      <template #footer>
        <el-button @click="descVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 课程安排弹窗 -->
    <el-dialog v-model="sessionVisible" :title="sessionCourseName + ' — 课程安排'" width="800px" destroy-on-close top="3vh" class="session-dialog">
      <!-- 新增安排 -->
      <div class="session-add-bar">
        <el-form :inline="true" :model="sessionForm" size="small">
          <el-form-item label="标题">
            <el-input v-model="sessionForm.title" placeholder="安排标题" style="width:140px" maxlength="40" />
          </el-form-item>
          <el-form-item label="日期">
            <el-date-picker v-model="sessionForm.sessionDate" type="date" placeholder="日期" value-format="YYYY-MM-DD" style="width:140px" />
          </el-form-item>
          <el-form-item label="开始">
            <el-time-picker v-model="sessionForm.startTime" placeholder="开始" format="HH:mm" value-format="HH:mm" style="width:110px" />
          </el-form-item>
          <el-form-item label="结束">
            <el-time-picker v-model="sessionForm.endTime" placeholder="结束" format="HH:mm" value-format="HH:mm" style="width:110px" />
          </el-form-item>
          <el-form-item label="地点">
            <el-input v-model="sessionForm.location" placeholder="地点" style="width:120px" maxlength="30" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleCreateSession" :loading="sessionSaving">
              <el-icon><Plus /></el-icon> 添加
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 安排列表 -->
      <el-table :data="sessionList" border stripe size="small" class="session-table"
        :header-cell-style="{ backgroundColor:'#f8fafc', color:'#475569', fontWeight:'600' }">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column prop="session_name" label="标题" min-width="140" />
        <el-table-column prop="session_date" label="日期" width="120" align="center" />
        <el-table-column label="时间" width="160" align="center">
          <template #default="{ row }">{{ row.start_time }} ~ {{ row.end_time }}</template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="130" align="center" show-overflow-tooltip />
        <el-table-column prop="instructor" label="主讲人" width="100" align="center" />
      </el-table>
      <div v-if="sessionList.length === 0 && !sessionLoading" class="session-empty">
        <span>暂无课程安排，请添加</span>
      </div>
      <template #footer>
        <el-button @click="sessionVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Collection, Plus, Edit, CircleCheck, Delete, Bottom, Calendar } from '@element-plus/icons-vue'
import PageHeaderCard from '@/components/PageHeaderCard.vue'
import { useTrainingCourseStore } from '@/stores/training-course'
import type { Course } from '@/stores/training-course'
import { uploadCover } from '@/api/course'
import { getSessionList, createSession, type ApiSessionItem } from '@/api/session'

const store = useTrainingCourseStore()

// ==================== 筛选 ====================
const filterClass = ref('all')
const filterStatus = ref('all')

const filteredList = computed(() => {
  let list = [...store.courses]
  if (filterClass.value !== 'all') {
    list = list.filter(c => (c as any).className === filterClass.value)
  }
  if (filterStatus.value !== 'all') {
    list = list.filter(c => c.status === filterStatus.value)
  }
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
const statusText = (s: string) => ({ draft:'草稿', pending:'待发布', published:'已发布', ended:'已结束' }[s] || s)

// ==================== 弹窗表单 ====================
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const saveLoading = ref(false)

interface CourseForm {
  name: string; className: string
  description: string; instructor: string
  startTime: string; endTime: string; trainingLocation: string
  coverImg: string
}
const form = reactive<CourseForm>({
  name: '', className: '1班',
  description: '', instructor: '',
  startTime: '', endTime: '', trainingLocation: '',
  coverImg: '',
})

const coverPreview = ref('')

const resetForm = () => {
  form.name = ''; form.className = '1班'
  form.description = ''; form.instructor = ''
  form.startTime = ''; form.endTime = ''; form.trainingLocation = ''
  form.coverImg = ''
  coverPreview.value = ''
}

const openAddDialog = () => {
  isEdit.value = false; editId.value = ''; resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row: Course) => {
  isEdit.value = true; editId.value = row.id
  form.name = row.name
  form.className = (row as any).className || ''
  form.description = row.description || ''
  form.instructor = row.instructor || ''
  form.startTime = row.startTime || ''
  form.endTime = row.endTime || ''
  form.trainingLocation = row.trainingLocation || ''
  form.coverImg = (row as any).coverImg || ''
  coverPreview.value = ''
  dialogVisible.value = true
}

let pendingPublishTarget: string | null = null // 'form' | courseId

const handleCoverChange = async (file: any) => {
  const raw = file.raw as File
  if (!raw) return
  // 校验格式
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(raw.type)) {
    ElMessage.warning('仅支持 JPG/PNG/GIF/WebP 格式的图片')
    return
  }
  // 校验大小（最大 5MB）
  if (raw.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }
  // 本地预览
  coverPreview.value = URL.createObjectURL(raw)
  // 上传到后端
  try {
    const res: any = await uploadCover(raw)
    const data = res.data || res
    form.coverImg = data.url || data.cover_img || ''
    ElMessage.success('封面上传成功')
  } catch (error) {
    console.warn('封面上传失败:', error)
    ElMessage.warning('封面上传失败，请重试')
    coverPreview.value = ''
  }
}

const removeCover = () => {
  form.coverImg = ''
  coverPreview.value = ''
}

/** 表单校验，通过则返回 course data */
const validateForm = (): any | null => {
  if (!form.name.trim()) { ElMessage.warning('请输入课程名'); return null }
  if (!form.description.trim()) { ElMessage.warning('请输入课程描述'); return null }
  if (!form.instructor.trim()) { ElMessage.warning('请输入主讲人'); return null }
  if (!form.startTime) { ElMessage.warning('请选择开始时间'); return null }
  if (!form.endTime) { ElMessage.warning('请选择结束时间'); return null }
  if (form.endTime <= form.startTime) { ElMessage.warning('结束时间必须晚于开始时间'); return null }
  if (!form.trainingLocation.trim()) { ElMessage.warning('请输入地点'); return null }
  return {
    name: form.name, className: form.className,
    description: form.description, instructor: form.instructor,
    startTime: form.startTime, endTime: form.endTime,
    trainingLocation: form.trainingLocation,
    coverImg: form.coverImg || '',
    trainingTargets: [],
    maxParticipants: 50, currentParticipants: 0,
    prerequisites: '', courseTags: [], chapters: [],
    linkedAttendance: false, linkedScore: false, linkedAnnouncement: false,
  }
}

const confirmVisible = ref(false)
const descVisible = ref(false)
const descCourse = ref<Course | null>(null)

const truncate = (text: string, len: number) => {
  if (!text) return '-'
  return text.length > len ? text.slice(0, len) + '...' : text
}

const openDescDialog = async (row: Course) => {
  const detail = await store.fetchCourseDetail(row.id)
  descCourse.value = detail || row
  descVisible.value = true
}

/** 编辑模式保存：不改变状态 */
const handleSave = async () => {
  const data = validateForm()
  if (!data) return
  saveLoading.value = true
  store.updateCourse(editId.value, { ...data, updatedAt: new Date().toLocaleString('zh-CN') })
  saveLoading.value = false
  dialogVisible.value = false
  ElMessage.success('已保存编辑进度')
}

/** 新建-存为草稿 */
const handleSaveDraft = async () => {
  const data = validateForm()
  if (!data) return
  saveLoading.value = true
  store.addCourse({ ...data, status: 'draft', registrationStatus: 'not_started' })
  saveLoading.value = false
  dialogVisible.value = false
  ElMessage.success('已存为草稿')
}

/** 新建-点击发布，弹出确认 */
const handlePublishClick = () => {
  if (!validateForm()) return
  pendingPublishTarget = 'form'
  confirmVisible.value = true
}

/** 列表-点击发布，弹出确认 */
const handlePublish = (row: Course) => {
  pendingPublishTarget = row.id
  confirmVisible.value = true
}

const handleUnpublish = async (row: Course) => {
  try {
    await ElMessageBox.confirm(
      `确定要下架「${row.name}」吗？下架后课程将变为草稿状态，可随时重新发布。`,
      '确认下架',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await store.unpublishCourse(row.id)
  } catch { /* 取消 */ }
}

/** 确认发布 */
const doPublish = () => {
  saveLoading.value = true
  if (pendingPublishTarget === 'form') {
    const data = validateForm()!
    store.addCourse({ ...data, status: 'published', registrationStatus: 'ongoing' })
    dialogVisible.value = false
    ElMessage.success('课程已发布')
  } else if (pendingPublishTarget) {
    store.publishCourse(pendingPublishTarget)
    ElMessage.success('课程已发布')
  }
  saveLoading.value = false
  confirmVisible.value = false
  pendingPublishTarget = null
}

const handleDelete = async (row: Course) => {
  try {
    await ElMessageBox.confirm('确定删除该课程？', '提示', { type: 'warning' })
    await store.deleteCourse(row.id)
    ElMessage.success('已删除')
  } catch { /* canceled */ }
}

// ==================== 课程安排 ====================
const sessionVisible = ref(false)
const sessionLoading = ref(false)
const sessionSaving = ref(false)
const sessionCourseId = ref('')
const sessionCourseName = ref('')
const sessionList = ref<ApiSessionItem[]>([])

const sessionForm = reactive({
  title: '',
  sessionDate: '',
  startTime: '',
  endTime: '',
  location: '',
})

const openSessionDialog = async (row: Course) => {
  sessionCourseId.value = row.id
  sessionCourseName.value = row.name
  sessionVisible.value = true
  // 重置表单
  sessionForm.title = ''; sessionForm.sessionDate = ''; sessionForm.startTime = ''
  sessionForm.endTime = ''; sessionForm.location = ''
  // 非数字 ID 的本地课程跳过 API（后端没有对应数据）
  if (!/^\d+$/.test(row.id)) {
    sessionList.value = []
    return
  }
  // 加载已有安排
  sessionLoading.value = true
  try {
    const res: any = await getSessionList({ courseId: Number(row.id) })
    sessionList.value = res.data?.list || res.list || []
  } catch {
    console.warn('获取课程安排列表失败')
    sessionList.value = []
  } finally {
    sessionLoading.value = false
  }
}

const handleCreateSession = async () => {
  if (!sessionForm.title.trim()) { ElMessage.warning('请输入标题'); return }
  if (!sessionForm.sessionDate) { ElMessage.warning('请选择日期'); return }
  if (!sessionForm.startTime) { ElMessage.warning('请选择开始时间'); return }
  if (!sessionForm.endTime) { ElMessage.warning('请选择结束时间'); return }
  if (sessionForm.endTime <= sessionForm.startTime) { ElMessage.warning('结束时间不能早于或等于开始时间'); return }
  if (!/^\d+$/.test(sessionCourseId.value)) { ElMessage.warning('该课程未同步到后端，无法创建课程安排'); return }
  sessionSaving.value = true
  try {
    // 拼接日期+时间为完整 datetime 格式（后端要求 "YYYY-MM-DD HH:mm:ss"）
    const date = sessionForm.sessionDate  // "2026-08-03"
    await createSession({
      courseId: Number(sessionCourseId.value),
      title: sessionForm.title,
      sessionDate: date,
      startTime: `${date} ${sessionForm.startTime}:00`,
      endTime: `${date} ${sessionForm.endTime}:00`,
      location: sessionForm.location || undefined,
    })
    ElMessage.success('已添加课程安排')
    // 重新加载列表
    const res: any = await getSessionList({ courseId: Number(sessionCourseId.value) })
    sessionList.value = res.data?.list || res.list || []
    // 重置表单
    sessionForm.title = ''; sessionForm.sessionDate = ''
    sessionForm.startTime = ''; sessionForm.endTime = ''; sessionForm.location = ''
  } catch {
    ElMessage.error('添加失败，请重试')
  } finally {
    sessionSaving.value = false
  }
}

onMounted(() => { store.fetchCourses() })
</script>

<style scoped>
.course-page { min-height:calc(100vh - 40px); padding:20px; }

.toolbar-card { display:flex; align-items:center; background:#fff; border-radius:12px;
  padding:14px 24px; margin:16px 0; box-shadow:0 1px 3px rgba(0,0,0,.08); }

.table-card { background:#fff; border-radius:12px; padding:20px 24px; box-shadow:0 1px 3px rgba(0,0,0,.08); }

.status-tag { padding:2px 10px; border-radius:4px; font-size:12px; font-weight:500; }
.s-draft { background:#f1f5f9; color:#64748b; }
.s-pending { background:#fdf6ec; color:#e6a23c; }
.s-published { background:#e1f3d8; color:#67c23a; }
.s-ended { background:#fde2e2; color:#f56c6c; }

.pagination-wrapper { display:flex; justify-content:space-between; align-items:center; margin-top:20px; flex-wrap:wrap; gap:12px; }
.pagination-info { display:flex; align-items:center; gap:6px; font-size:13px; color:#606266; }
.pagination-info strong { color:#303133; }
.ps-select { width:80px; }

.course-dialog :deep(.el-dialog__footer) { display:flex; justify-content:space-between; align-items:center; }
.footer-right { display:flex; gap:8px; }

.confirm-body { display:flex; flex-direction:column; align-items:center; text-align:center; padding:10px 0; }
.confirm-icon { font-size:42px; color:#67c23a; margin-bottom:12px; }
.confirm-body p { margin:4px 0; font-size:15px; color:#1e293b; }
.confirm-detail { font-size:13px !important; color:#64748b !important; max-width:320px; }

.desc-link { cursor:pointer; color:#1e293b; }
.desc-link:hover { color:#409eff; text-decoration:underline; }
.desc-full { font-size:14px; color:#334155; line-height:1.8; white-space:pre-wrap; padding:8px 0; }

.no-cover { color:#c0c4cc; font-size:13px; }

.cover-upload { display:flex; align-items:flex-start; }
.cover-preview { position:relative; cursor:pointer; border-radius:8px; overflow:hidden; width:160px; height:100px; }
.cover-preview .cover-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:rgba(0,0,0,.5); color:#fff; font-size:12px; gap:4px; opacity:0; transition:opacity .2s; }
.cover-preview:hover .cover-overlay { opacity:1; }
.cover-placeholder { width:160px; height:100px; border:2px dashed #d9d9d9; border-radius:8px;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; cursor:pointer;
  color:#909399; transition:border-color .2s; }
.cover-placeholder:hover { border-color:#409eff; }
.cover-placeholder .upload-icon { font-size:24px; }
.cover-placeholder .upload-hint { font-size:11px; color:#c0c4cc; }

.session-add-bar { background:#f8fafc; border-radius:8px; padding:12px 16px; margin-bottom:16px; border:1px solid #e2e8f0; }
.session-add-bar .el-form-item { margin-bottom:0; }
.session-table { margin-bottom:12px; }
.session-empty { text-align:center; padding:40px 0; color:#909399; font-size:14px; }
</style>
