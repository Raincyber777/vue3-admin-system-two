<template>
  <div class="page-header-card">
    <div class="header-content">
      <div class="header-left">
        <div class="header-icon-wrapper">
          <slot name="icon">
            <el-icon class="header-icon"><Reading /></el-icon>
          </slot>
        </div>
        <div class="header-text">
          <h1>{{ title }}</h1>
          <p class="header-subtitle">
            {{ subtitle || '' }}
            <span v-if="labName" class="lab-tag">{{ labName }}</span>
          </p>
        </div>
      </div>
      <div class="header-right">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Reading } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getLabDisplayName } from '@/utils/permission'

const props = defineProps<{
  title: string
  subtitle?: string
}>()

const authStore = useAuthStore()

// 动态获取实验室名称
const labName = computed(() => {
  return authStore.currentLabName || getLabDisplayName(authStore.currentLabId) || ''
})
</script>

<style scoped>
.page-header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background:#e3f2fd;
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
  border-radius: 50%;
}

.header-content::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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

.header-icon-wrapper :deep(.el-icon) {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.lab-tag {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(33, 150, 243, 0.15);
  color: #2196f3;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.header-right {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right :deep(.el-button) {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(100, 181, 246, 0.3);
  color: #2196f3;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
}

.header-right :deep(.el-button:hover) {
  background: #fff;
  border-color: #2196f3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.25);
}
</style>
