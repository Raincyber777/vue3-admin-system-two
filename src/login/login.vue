<script setup lang="ts">
import { nextTick, onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { sendCode, resetPassword } from '../api/auth'

const router = useRouter()
const authStore = useAuthStore()
const showPassword = ref(false)
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const accountInputRef = ref<HTMLInputElement | null>(null)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

onMounted(async () => {
  await nextTick()
  accountInputRef.value?.focus()
})

// 忘记密码
const showForgotDialog = ref(false)
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

const openForgotDialog = () => {
  forgotForm.email = ''
  forgotForm.code = ''
  forgotForm.newPassword = ''
  forgotForm.confirmPassword = ''
  codeCountdown.value = 0
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  showForgotDialog.value = true
}

const handleSendCode = async () => {
  if (!forgotForm.email.trim()) { ElMessage.warning('请先输入邮箱'); return }
  sendingCode.value = true
  try {
    await sendCode(forgotForm.email.trim())
    ElMessage.success('验证码已发送，请检查邮箱')
    codeCountdown.value = 60
    countdownTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
      }
    }, 1000)
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.msg || error?.message || '发送失败'
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
      `确认将邮箱 ${forgotForm.email.trim()} 的密码重置为新密码吗？`,
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
    ElMessage.success('密码重置成功，请使用新密码登录')
    showForgotDialog.value = false
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.msg || error?.message || '重置失败'
    ElMessage.error(typeof msg === 'string' ? msg : '重置密码失败')
  } finally {
    resetLoading.value = false
  }
}

const handleLogin = async () => {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  isLoading.value = true

  try {
    const result = await authStore.login({
      adminName: username.value,
      password: password.value,
    })
    if (result.success) {
      // 登录成功后，获取完整的用户信息（包括实验室名称、权限等）
      await authStore.fetchUserInfo()
      
      sessionStorage.setItem('auth', JSON.stringify({ isAuthenticated: true }))
      ElMessage.success(`登录成功！欢迎 ${authStore.currentLabName || ''}管理员`)
      router.push('/application')
    } else {
      ElMessage.error(result.message || '登录失败')
    }
  } catch (error: any) {
    console.log('登录错误:', error)
    ElMessage.error(error.message || '登录失败，请重试')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="container">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>

    </div>

    <div class="login-container">
      <div class="login-card">
        <div class="logo"></div>
        <h1 class="title">招新系统 · 管理员登录</h1>
        <p class="subtitle">请使用管理员账号登录</p>

        <div class="input-group">
          <label>账号</label>
          <input
            ref="accountInputRef"
            type="text"
            placeholder="请输入账号"
            v-model="username"
            autocomplete="username"
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="input-group">
          <label>密码</label>
          <input
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            v-model="password"
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
          <button class="eye-icon" type="button" @click="togglePassword" :aria-label="showPassword ? '隐藏密码' : '显示密码'">
            <el-icon>
              <component :is="showPassword ? 'Hide' : 'View'" />
            </el-icon>
          </button>
        </div>

        <button class="btn login-btn" @click="handleLogin" :disabled="isLoading">
          <span v-if="isLoading" class="loading-spinner"></span>
          <span>{{ isLoading ? '登录中...' : '登录' }}</span>
        </button>

        <div class="forgot-link">
          <a href="javascript:void(0)" @click="openForgotDialog">忘记密码？</a>
        </div>
      </div>
    </div>

    <!-- 忘记密码弹窗 -->
    <div v-if="showForgotDialog" class="modal-overlay" @click.self="showForgotDialog = false">
      <div class="forgot-dialog">
        <h2 class="forgot-title">找回密码</h2>
        <p class="forgot-subtitle">通过邮箱验证码重置密码</p>

        <div class="forgot-field">
          <label>邮箱</label>
          <input v-model="forgotForm.email" placeholder="请输入管理员邮箱" />
        </div>

        <div class="forgot-field">
          <label>验证码</label>
          <div class="code-input-row">
            <input v-model="forgotForm.code" placeholder="请输入验证码" style="flex:1" />
            <button class="btn-send-code" :disabled="codeCountdown > 0 || sendingCode" @click="handleSendCode">
              {{ sendingCode ? '发送中...' : codeCountdown > 0 ? `${codeCountdown}s` : '发送验证码' }}
            </button>
          </div>
        </div>

        <div class="forgot-field">
          <label>新密码</label>
          <input v-model="forgotForm.newPassword" type="password" placeholder="至少6位" />
        </div>

        <div class="forgot-field">
          <label>确认密码</label>
          <input v-model="forgotForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </div>

        <div class="forgot-actions">
          <button class="btn btn-reset" @click="handleResetPassword" :disabled="resetLoading">
            {{ resetLoading ? '重置中...' : '重置密码' }}
          </button>
          <button class="btn btn-cancel" @click="showForgotDialog = false">返回登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', sans-serif;
}

.login-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #e8f4fc 0%, #d4e9f7 30%, #b8d9ed 60%, #a3cce9 100%);
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 200px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 25%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.3) 75%,
    transparent 100%
  );
  animation: wave 8s linear infinite;
  opacity: 0.6;
}

.login-page::after {
  content: '';
  position: absolute;
  bottom: -50px;
  left: 0;
  width: 200%;
  height: 200px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(163, 204, 233, 0.4) 25%,
    rgba(163, 204, 233, 0.6) 50%,
    rgba(163, 204, 233, 0.4) 75%,
    transparent 100%
  );
  animation: wave 10s linear infinite reverse;
}

@keyframes wave {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.container {
  height: 100%;
  width: 100%;
  background: linear-gradient(180deg, #e8f4fc 0%, #d4e9f7 30%, #b8d9ed 60%, #a3cce9 100%);
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}

#stars {
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow:
    501px 811px #fff,
    1450px 1324px #fff,
    1093px 1780px #fff,
    1469px 678px #fff,
    904px 741px #fff,
    1160px 781px #fff,
    1841px 1962px #fff,
    1630px 1667px #fff,
    1788px 676px #fff,
    367px 1734px #fff,
    1343px 156px #fff,
    1283px 1142px #fff,
    1062px 378px #fff,
    1395px 467px #fff,
    1017px 1891px #fff,
    137px 1114px #fff,
    1767px 1403px #fff,
    1543px 11px #fff,
    1078px 181px #fff,
    1189px 1574px #fff;
  animation: animStar 50s linear infinite;
}

#stars2 {
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow:
    1925px 1320px #fff,
    693px 1778px #fff,
    1016px 711px #fff,
    1171px 563px #fff,
    661px 1919px #fff,
    1610px 44px #fff,
    1275px 140px #fff,
    1208px 1802px #fff,
    1473px 1587px #fff,
    11px 1117px #fff;
  animation: animStar 100s linear infinite;
}

#stars3 {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow:
    200px 981px #fff,
    1731px 521px #fff,
    132px 1039px #fff,
    1888px 1547px #fff,
    899px 1226px #fff,
    1887px 580px #fff,
    1548px 1092px #fff,
    1626px 689px #fff,
    254px 1072px #fff,
    1684px 1211px #fff;
  animation: animStar 150s linear infinite;
}

@keyframes animStar {
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-2000px);
  }
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  position: relative;
  z-index: 10;
}

.login-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.logo {
  text-align: center;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #111;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 32px;
  font-size: 14px;
}

.input-group {
  margin-bottom: 20px;
  position: relative;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.input-group input {
  width: 100%;
  padding: 14px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: all 0.3s ease;
  background: #fff;
}

.input-group input:focus {
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.input-group input::placeholder {
  color: #aaa;
}

.eye-icon {
  position: absolute;
  right: 12px;
  top: 42px;
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.2s;
  border: 0;
  background: transparent;
  padding: 0;
  line-height: 1;
}

.eye-icon:hover {
  transform: scale(1.1);
}

.btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 忘记密码 */
.forgot-link {
  text-align: center;
  margin-top: 16px;
}

.forgot-link a {
  color: #2196f3;
  font-size: 13px;
  text-decoration: none;
}

.forgot-link a:hover {
  text-decoration: underline;
}

/* 弹窗遮罩 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.forgot-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.forgot-title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin: 0 0 4px;
  text-align: center;
}

.forgot-subtitle {
  font-size: 13px;
  color: #888;
  margin: 0 0 24px;
  text-align: center;
}

.forgot-field {
  margin-bottom: 16px;
}

.forgot-field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  font-size: 13px;
}

.forgot-field input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.forgot-field input:focus {
  border-color: #2196f3;
}

.code-input-row {
  display: flex;
  gap: 10px;
}

.btn-send-code {
  white-space: nowrap;
  padding: 10px 16px;
  border: none;
  background: #2196f3;
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-send-code:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.forgot-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-reset {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: #fff;
}

.btn-reset:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  color: #666;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #f5f5f5;
}
</style>
