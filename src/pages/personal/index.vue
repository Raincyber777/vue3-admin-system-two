<template>
  <div class="page-container">
    <PageHeaderCard title="个人中心" subtitle="Personal Center">
      <template #icon>
        <el-icon><User /></el-icon>
      </template>
      <template #default>
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">{{ pendingCount }}</span>
            <span class="stat-label">待审核</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ approvedCount }}</span>
            <span class="stat-label">已通过</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ studentCount }}</span>
            <span class="stat-label">学生总数</span>
          </div>
        </div>
      </template>
    </PageHeaderCard>

    <!-- 功能模块 - 两列布局 -->
    <div class="profile-row">
      <!-- 左侧：账号与安全 + 今日待办 -->
      <div class="left-modules">
        <!-- 账号与安全卡片 -->
        <el-card class="module-card security-card">
          <template #header>
            <div class="card-title">
              <el-icon><Lock /></el-icon>
              <span>账号与安全</span>
            </div>
          </template>
          <div class="security-items">
            <div class="security-item" @click="openChangePasswordDialog">
              <div class="item-icon password-icon">
                <el-icon><Key /></el-icon>
              </div>
              <div class="item-info">
                <span class="item-title">修改密码</span>
                <span class="item-desc">定期更换密码保障账号安全</span>
              </div>
              <el-icon class="item-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="security-item" @click="openForgotPasswordDialog">
              <div class="item-icon reset-icon">
                <el-icon><Unlock /></el-icon>
              </div>
              <div class="item-info">
                <span class="item-title">找回密码</span>
                <span class="item-desc">通过邮箱验证码重置密码</span>
              </div>
              <el-icon class="item-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="security-item clickable" @click="handleLogout">
              <div class="item-icon logout-icon">
                <el-icon><Logout /></el-icon>
              </div>
              <div class="item-info">
                <span class="item-title">退出登录</span>
                <span class="item-desc">安全退出当前账号</span>
              </div>
              <el-icon class="item-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：用户信息 -->
      <div class="right-modules">
        <!-- 用户信息卡片 -->
        <el-card class="module-card info-card">
          <template #header>
            <div class="card-title">
              <el-icon><User /></el-icon>
              <span>个人信息</span>
            </div>
          </template>
          <div class="info-content">

            <div class="info-item">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ userInfo?.email || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">角色</span>
              <span class="info-value">{{ userInfo?.role === 'admin' ? '管理员' : '用户' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">上次登录</span>
              <span class="info-value">{{ lastLoginTime }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showChangePasswordDialog" title="修改密码" width="480px" destroy-on-close>
      <el-form :model="changePasswordForm" label-width="100px">
        <el-form-item label="旧密码" required>
          <el-input v-model="changePasswordForm.oldPassword" type="password" placeholder="请输入旧密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="changePasswordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input v-model="changePasswordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangePasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword" :loading="changePasswordLoading">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 找回密码弹窗 -->
    <el-dialog v-model="showForgotPasswordDialog" title="找回密码" width="480px" destroy-on-close>
      <el-form :model="forgotForm" label-width="100px">
        <el-form-item label="邮箱" required>
          <el-input v-model="forgotForm.email" placeholder="请输入管理员邮箱" />
        </el-form-item>
        <el-form-item label="验证码" required>
          <div class="code-row">
            <el-input v-model="forgotForm.code" placeholder="请输入验证码" style="flex:1" />
            <el-button
              type="primary"
              :disabled="codeCountdown > 0"
              :loading="sendingCode"
              @click="handleSendCode"
              style="margin-left:12px;min-width:120px"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="forgotForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" show-password />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input v-model="forgotForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForgotPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleResetPassword" :loading="resetLoading">重置密码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useApplicationStore } from '@/stores/application'
import { changePassword, sendCode, resetPassword } from '@/api/auth'
import PageHeaderCard from '@/components/PageHeaderCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const applicationStore = useApplicationStore()

const userInfo = computed(() => authStore.userInfo || userStore.userInfo)

// 数据统计 - 从applicationStore获取
const pendingCount = computed(() => applicationStore.pendingApplicants.length)
const approvedCount = computed(() => applicationStore.approvedApplicants.length)
const studentCount = computed(() => applicationStore.approvedApplicants.length)

// 安全信息
const lastLoginTime = ref('首次登录')
// 修改密码
const showChangePasswordDialog = ref(false)

const changePasswordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const openChangePasswordDialog = () => {
  showChangePasswordDialog.value = true
  changePasswordForm.oldPassword = ''
  changePasswordForm.newPassword = ''
  changePasswordForm.confirmPassword = ''
}

const changePasswordLoading = ref(false)

const handleChangePassword = async () => {
  if (!changePasswordForm.oldPassword) { ElMessage.warning('请输入旧密码'); return }
  if (!changePasswordForm.newPassword) { ElMessage.warning('请输入新密码'); return }
  if (changePasswordForm.newPassword.length < 6) { ElMessage.warning('新密码至少6位'); return }
  if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) { ElMessage.warning('两次输入的新密码不一致'); return }
  changePasswordLoading.value = true
  try {
    await changePassword({
      oldPassword: changePasswordForm.oldPassword,
      newPassword: changePasswordForm.newPassword,
    })
    ElMessage.success('密码修改成功，即将跳转登录页')
    showChangePasswordDialog.value = false
    // 修改密码后 token 通常会被后端失效，主动退出并跳转登录
    setTimeout(() => {
      authStore.logout()
      router.push('/login')
    }, 1500)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.msg || error?.message || '修改密码失败，请重试'
    console.warn('修改密码失败:', error)
    ElMessage.error(typeof msg === 'string' ? msg : '修改密码失败，请重试')
  } finally {
    changePasswordLoading.value = false
  }
}

// 找回密码
const showForgotPasswordDialog = ref(false)
const sendingCode = ref(false)
const resetLoading = ref(false)
const codeCountdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const forgotForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

const openForgotPasswordDialog = () => {
  // 自动填入当前管理员的邮箱
  forgotForm.email = userInfo.value?.email || ''
  forgotForm.code = ''
  forgotForm.newPassword = ''
  forgotForm.confirmPassword = ''
  showForgotPasswordDialog.value = true
}

const handleSendCode = async () => {
  if (!forgotForm.email.trim()) { ElMessage.warning('请先输入邮箱'); return }
  sendingCode.value = true
  try {
    await sendCode(forgotForm.email.trim())
    ElMessage.success('验证码已发送，请检查邮箱')
    // 启动 60s 冷却倒计时
    codeCountdown.value = 60
    countdownTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
      }
    }, 1000)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.msg || error?.message || '发送验证码失败'
    ElMessage.error(typeof msg === 'string' ? msg : '发送验证码失败')
  } finally {
    sendingCode.value = false
  }
}

const handleResetPassword = async () => {
  if (!forgotForm.email.trim()) { ElMessage.warning('请输入邮箱'); return }
  if (!forgotForm.code.trim()) { ElMessage.warning('请输入验证码'); return }
  if (!forgotForm.newPassword) { ElMessage.warning('请输入新密码'); return }
  if (forgotForm.newPassword.length < 6) { ElMessage.warning('新密码至少6位'); return }
  if (forgotForm.newPassword !== forgotForm.confirmPassword) { ElMessage.warning('两次输入的新密码不一致'); return }

  try {
    await ElMessageBox.confirm(
      `确认将邮箱 ${forgotForm.email.trim()} 的密码重置为新密码吗？重置后需要重新登录。`,
      '确认重置密码',
      { confirmButtonText: '确认重置', cancelButtonText: '取消', type: 'warning', customClass: 'no-icon-dlg' }
    )
  } catch {
    return
  }

  resetLoading.value = true
  try {
    await resetPassword({
      email: forgotForm.email.trim(),
      code: forgotForm.code.trim(),
      new_password: forgotForm.newPassword,
    })
    ElMessage.success('密码重置成功，请重新登录')
    showForgotPasswordDialog.value = false
    setTimeout(() => {
      authStore.logout()
      router.push('/login')
    }, 1500)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.msg || error?.message || '重置密码失败'
    ElMessage.error(typeof msg === 'string' ? msg : '重置密码失败')
  } finally {
    resetLoading.value = false
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  await authStore.fetchUserInfo()
  userStore.loadUserInfo()
})

onUnmounted(() => {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.profile-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.module-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

/* 安全卡片 */
.security-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.security-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.security-item:hover {
  background: #f5f7fa;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.password-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.reset-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.logout-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.item-info {
  flex: 1;
}

.item-title {
  display: block;
  font-weight: 500;
  color: #303133;
}

.item-desc {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.item-arrow {
  color: #c0c4cc;
  font-size: 14px;
}

/* 用户信息卡片 */
.info-content {
  padding-top: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #ebf0f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-weight: 500;
}

/* 密码强度提示 */
.password-strength {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.strength-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #c0c4cc;
  padding: 2px 8px;
  background: #f4f4f5;
  border-radius: 4px;
  transition: all 0.2s;
}

.strength-item.active {
  color: #67c23a;
  background: #f0f9eb;
}

.strength-item .el-icon {
  font-size: 12px;
}

.hint-error {
  display: block;
  margin-top: 4px;
  color: #f56c6c;
  font-size: 12px;
}

.clickable {
  cursor: pointer;
}

.code-row {
  display: flex;
  align-items: center;
  width: 100%;
}

@media (max-width: 1024px) {
  .profile-row {
    grid-template-columns: 1fr;
  }
}
</style>
