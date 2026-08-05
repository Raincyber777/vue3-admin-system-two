<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'is-collapse': isCollapse }">
      <!-- 装饰性背景元素 -->
      <div class="floating-elements"></div>

      <!-- Logo区域 -->
      <div class="sidebar-header">
        <div class="logo-wrapper">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <transition name="slide-fade">
            <div v-show="!isCollapse" class="logo-text">
              <span class="logo-title">{{ labName }}</span>
              <span class="logo-subtitle">{{ authStore.userInfo?.role || 'Lab Admin' }}</span>
            </div>
          </transition>
        </div>
      </div>

      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="transparent"
        text-color="#334155"
        active-text-color="#2196f3"
      >
        <el-menu-item v-if="showMenu('/application')" index="/application">
          <div class="menu-icon-wrapper">
            <el-icon><FolderChecked /></el-icon>
          </div>
          <template #title>报名审核</template>
        </el-menu-item>

        <el-menu-item v-if="showMenu('/signin')" index="/signin">
          <div class="menu-icon-wrapper">
            <el-icon><Clock /></el-icon>
          </div>
          <template #title>签到管理</template>
        </el-menu-item>

        <el-menu-item v-if="showMenu('/homework')" index="/homework">
          <div class="menu-icon-wrapper">
            <el-icon><Notebook /></el-icon>
          </div>
          <template #title>作业发布</template>
        </el-menu-item>

        <el-menu-item v-if="showMenu('/grading')" index="/grading">
          <div class="menu-icon-wrapper">
            <el-icon><EditPen /></el-icon>
          </div>
          <template #title>作业批改</template>
        </el-menu-item>

        <el-menu-item v-if="showMenu('/training-course')" index="/training-course">
          <div class="menu-icon-wrapper">
            <el-icon><Collection /></el-icon>
          </div>
          <template #title>课程管理</template>
        </el-menu-item>

        <el-menu-item v-if="showMenu('/training-detail')" index="/training-detail">
          <div class="menu-icon-wrapper">
            <el-icon><Notebook /></el-icon>
          </div>
          <template #title>培训名单</template>
        </el-menu-item>

        <el-menu-item v-if="showMenu('/score')" index="/score">
          <div class="menu-icon-wrapper">
            <el-icon><Reading /></el-icon>
          </div>
          <template #title>学员表现</template>
        </el-menu-item>

        <div class="menu-divider-wrapper" v-if="showMenu('/account') || showMenu('/personal')">
          <el-divider class="menu-divider" />
        </div>

        <el-menu-item v-if="showMenu('/account')" index="/account">
          <div class="menu-icon-wrapper">
            <el-icon><UserFilled /></el-icon>
          </div>
          <template #title>账号管理</template>
        </el-menu-item>

        <el-menu-item v-if="showMenu('/personal')" index="/personal">
          <div class="menu-icon-wrapper">
            <el-icon><User /></el-icon>
          </div>
          <template #title>个人中心</template>
        </el-menu-item>
      </el-menu>

      <!-- 折叠按钮 -->
      <div class="sidebar-footer">
        <div class="collapse-wrapper">
          <el-button
            :icon="isCollapse ? 'DArrowRight' : 'DArrowLeft'"
            circle
            class="collapse-btn"
            @click="toggleCollapse"
          />
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航 -->
      <header class="main-header">
        <div class="header-left">
          <div class="page-breadcrumb">
            <el-icon class="breadcrumb-icon"><HomeFilled /></el-icon>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">{{ currentRouteName }}</span>
          </div>
        </div>
        <div class="header-right">
          <div class="header-actions">
            <div class="windmill-container">
              <div class="loader">
                <div class="stick"></div>
                <div class="container">
                  <div class="pin"></div>
                  <div class="paper-container red">
                    <div class="paper-leaf-1 red-1"></div>
                    <div class="paper-leaf-2 red-2"></div>
                  </div>
                  <div class="paper-container rotate-90">
                    <div class="paper-leaf-1 yellow-1"></div>
                    <div class="paper-leaf-2 yellow-2"></div>
                  </div>
                  <div class="paper-container rotate-180">
                    <div class="paper-leaf-1 green-1"></div>
                    <div class="paper-leaf-2 green-2"></div>
                  </div>
                  <div class="paper-container rotate-270">
                    <div class="paper-leaf-1 blue-1"></div>
                    <div class="paper-leaf-2 blue-2"></div>
                  </div>
                </div>
                <div class="line"></div>
              </div>
            </div>
          </div>
          <el-divider direction="vertical" class="header-divider" />
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="36" class="user-avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <div class="user-text">
                <span class="user-name">{{ authStore.userInfo?.name || userStore.userInfo.username }}</span>
                <span class="user-role">{{ authStore.currentLabName }} · {{ authStore.roles.join('/') || '管理员' }}</span>
              </div>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { getLabDisplayName } from '@/utils/permission'
import {
  FolderChecked, Notebook, EditPen, Reading, User,
  HomeFilled, UserFilled, ArrowDown, SwitchButton, Collection, Clock
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)
const userStore = useUserStore()
const authStore = useAuthStore()

onMounted(async () => {
  userStore.loadUserInfo()

  // 页面加载时获取最新的用户信息（包括实验室名称）
  if (authStore.isAuthenticated && !authStore.currentLabName) {
    await authStore.fetchUserInfo()
  }
})

// 实验室名称（动态显示）
const labName = computed(() => {
  return authStore.currentLabName || getLabDisplayName(authStore.currentLabId) || '实验室招生系统'
})

// 检查菜单是否显示
const showMenu = (menuPath: string): boolean => {
  return authStore.hasMenu(menuPath)
}

const activeMenu = computed(() => route.path)

const currentRouteName = computed(() => {
  const nameMap = {
    '/application': '报名审核',
    '/signin': '签到管理',
    '/homework': '作业发布',
    '/grading': '作业批改',
    '/article': '日志管理',
    '/announcement': '公告管理',
    '/training-course': '课程管理',
    '/training-detail': '培训名单',
    '/account': '账号管理',
    '/personal': '个人中心',
    '/score': '学员表现',
    '/score/detail': '分数详情',
    '/homework/detail': '作业详情',
  }
  const path = route.path
  for (const key of Object.keys(nameMap)) {
    if (path.startsWith(key)) return nameMap[key]
  }
  return '首页'
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/personal')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        authStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      }).catch(() => {})
      break
  }
}
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
}

/* ==================== 侧边栏 ==================== */
.sidebar {
  width: 200px;
  height: 100vh;
  background: #e3f2fd;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 100;
  box-shadow:
    0 0 60px rgba(33, 150, 243, 0.2),
    0 0 80px rgba(100, 181, 246, 0.15),
    2px 0 25px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: -100%;
  left: -100%;
  width: 200%;
  height: 200%;
  pointer-events: none;
}

.sidebar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  pointer-events: none;
}

/* 装饰性几何图形 */
.sidebar .floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.sidebar .floating-elements::before {
  content: '';
  position: absolute;
  top: 15%;
  right: -20px;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.18), rgba(66, 165, 245, 0.18));
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  animation: float1 8s ease-in-out infinite;
}

.sidebar .floating-elements::after {
  content: '';
  position: absolute;
  bottom: 20%;
  left: -15px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.15), rgba(33, 150, 243, 0.15));
  border-radius: 50%;
  animation: float2 10s ease-in-out infinite;
}

@keyframes cosmicFlow {
  0%, 100% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 25% 25%;
  }
  50% {
    background-position: 100% 50%;
  }
  75% {
    background-position: 75% 75%;
  }
}

@keyframes orbitingGlow {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes float1 {
  0%, 100% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-30px) rotate(180deg) scale(1.2);
    opacity: 1;
  }
}

@keyframes float2 {
  0%, 100% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0.5;
  }
  33% {
    transform: translateY(-20px) translateX(10px) scale(0.9);
    opacity: 0.8;
  }
  66% {
    transform: translateY(-40px) translateX(-5px) scale(1.1);
    opacity: 0.7;
  }
}

.sidebar.is-collapse {
  width: 75px;
}

.sidebar.is-collapse .sidebar-menu {
  width: 85px;
}

.sidebar.is-collapse .sidebar-menu .el-menu-item {
  padding: 0 !important;
  justify-content: center;
}

.sidebar.is-collapse .menu-icon-wrapper {
  width: 36px;
  height: 36px;
  margin-right: 0;
}

.sidebar-header {
  padding: 20px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2196f3, #64b5f6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.35);
}

.logo-icon svg {
  color: #fff;
}

.logo-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.logo-subtitle {
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ==================== 菜单 ==================== */
.sidebar-menu {
  flex: 1;
  background: transparent;
  border-right: none;
  padding: 16px 12px;
  overflow-y: auto;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 100%;
}

.sidebar-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.3s ease;
  position: relative;
  border-left: 3px solid transparent;
  color: #334155;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(33, 150, 243, 0.15);
  color: #2196f3;
}

.sidebar-menu .el-menu-item.is-active {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
  border-left-color: #2196f3;
}

.sidebar-menu .el-menu-item .el-icon {
  font-size: 18px;
  color: #64748b;
}

.menu-icon-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  margin-right: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.sidebar-menu .el-menu-item:hover .menu-icon-wrapper,
.sidebar-menu .el-menu-item.is-active .menu-icon-wrapper {
  background: rgba(33, 150, 243, 0.25);
}

.sidebar-menu .el-menu-item:hover .el-icon,
.sidebar-menu .el-menu-item.is-active .el-icon {
  color: #2196f3;
}

.menu-divider-wrapper {
  padding: 8px 0;
}

.menu-divider {
  margin: 0;
  border-color: rgba(148, 163, 184, 0.2);
}

/* ==================== 折叠按钮 ==================== */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.collapse-wrapper {
  display: flex;
  justify-content: center;
}

.collapse-btn {
  background: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(148, 163, 184, 0.2) !important;
  color: #64748b !important;
  width: 36px !important;
  height: 36px !important;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.collapse-btn:hover {
  background: rgba(33, 150, 243, 0.15) !important;
  color: #2196f3 !important;
  border-color: #2196f3 !important;
  transform: scale(1.05);
}

/* ==================== 主容器 ==================== */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

/* ==================== 顶部导航 ==================== */
.main-header {
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  z-index: 50;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
}

.page-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.breadcrumb-icon {
  font-size: 16px;
  color: #94a3b8;
}

.breadcrumb-separator {
  color: #cbd5e1;
  font-size: 14px;
}

.breadcrumb-current {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  color: #64748b !important;
  width: 36px !important;
  height: 36px !important;
  transition: all 0.3s ease;
}

.header-btn:hover {
  background: #f1f5f9 !important;
  color: #409eff !important;
  border-color: #409eff !important;
}

.badge-item {
  margin-right: 4px;
}

.header-divider {
  height: 24px;
  margin: 0 8px;
  border-color: #e2e8f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8fafc;
  border: 1px solid transparent;
}

.user-info:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.user-avatar {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.user-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.user-role {
  font-size: 11px;
  color: #94a3b8;
}

.arrow-icon {
  font-size: 12px;
  color: #94a3b8;
  transition: transform 0.3s ease;
}

.user-info:hover .arrow-icon {
  transform: rotate(180deg);
}

/* ==================== 内容区 ==================== */
.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ==================== 过渡动画 ==================== */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ==================== 滚动条 ==================== */
.sidebar-menu::-webkit-scrollbar {
  width: 6px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.main-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 风车动画 */
.windmill-container {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 5px;
  transform: scale(0.3) translate(-30px, 55px);
  margin-top: -60px;
}

.loader {
  position: relative;
  width: 20px;
  height: 20px;
}

.stick {
  width: 5px;
  height: 150px;
  background-color: #a3541c;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0%);
  z-index: -1;
}

.container {
  position: relative;
  width: 20px;
  height: 20px;
  transform: rotate(30deg) scale(0.77);
  animation: rotateAnimation 3s infinite linear;
}

.pin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background-color: white;
  z-index: 10;
  border-radius: 999px;
}

.paper-container {
  position: absolute;
  scale: 1.5;
}

.paper-leaf-1 {
  position: relative;
  width: 0;
  height: 0;
  clip-path: ellipse(50% 50% at 50% 109%);
  border-left: 30px solid transparent;
  border-right: 30px solid transparent;
  border-top-left-radius: 222px;
  border-top-right-radius: 222px;
}

.paper-leaf-2 {
  position: absolute;
  right: -1px;
  bottom: 0;
  width: 30px;
  height: 20.5px;
  border-bottom-right-radius: 2px;
  z-index: 2;
}

.paper-leaf-2::before {
  content: "";
  position: absolute;
  right: 50%;
  bottom: 0;
  width: 24.5px;
  height: 20.5px;
  clip-path: ellipse(100% 100% at 0% 100%);
  border-top-right-radius: 999px;
  box-shadow:
    inset -5px 0px 3px -3px rgba(0, 0, 0, 0.2),
    10px -10px 10px 0px rgba(255, 255, 255, 0.1);
  z-index: 1;
}

.red {
  top: 50%;
  left: 50%;
  transform: translate(-80%, -85%);
  z-index: 2;
}

.red-1 {
  border-bottom: 50px solid #ff5733;
}

.red-2 {
  background-color: #ff5733;
}

.rotate-90 {
  transform: rotate(90deg) translate(-75%, -10%);
  top: 50%;
  left: 50%;
  z-index: 3;
}

.yellow-1 {
  border-bottom: 50px solid #ffc300;
}

.yellow-2 {
  background-color: #ffc300;
}

.rotate-180 {
  transform: rotate(180deg) translate(-16%, -17%);
  top: 50%;
  left: 50%;
  z-index: 4;
}

.green-1 {
  border-bottom: 50px solid #2ecc71;
}

.green-2 {
  background-color: #2ecc71;
}

.rotate-270 {
  transform: rotate(270deg) translate(-22%, -90%);
  top: 50%;
  left: 50%;
  z-index: 5;
}

.blue-1 {
  border-bottom: 50px solid #3498db;
}

.blue-2 {
  background-color: #3498db;
}

.grass-container {
  position: absolute;
  top: 500%;
  display: flex;
  align-items: end;
  justify-content: center;
  z-index: -2;
}

.line {
  position: absolute;
  right: 150px;
  top: 150px;
  z-index: -2;
}

.line:before {
  content: "";
  position: absolute;
  background-color: #6a994e;
  width: 100px;
  height: 50px;
  border-radius: 50px 50px 0 0;
  top: -50px;
  left: 50px;
  box-shadow: 100px 0 #78a85b;
}

.line:after {
  content: "";
  position: absolute;
  background-color: #78a85b;
  width: 50px;
  height: 25px;
  border-radius: 50px 50px 0 0;
  top: -25px;
  left: 10px;
  box-shadow:
    50px 0 #55803c,
    105px 0 #6a994e,
    195px 0 #6a994e,
    225px 0 #a7c957;
}

@keyframes rotateAnimation {
  from {
    transform: rotate(30deg) scale(0.77);
  }
  to {
    transform: rotate(390deg) scale(0.77);
  }
}
</style>
