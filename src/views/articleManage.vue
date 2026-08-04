<template>
  <div class="header">
      <div class="header-icon-wrapper">
          <el-icon class="header-icon"><Bell /></el-icon>
      </div>
      <div class="header-title-group">
        <h2>日志管理</h2>
        <span class="header-subtitle">Manage your logs</span>
      </div>
  </div>
</template>

<script setup lang="ts">
import { Bell } from '@element-plus/icons-vue'
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #88a9f1 100%);
  padding: 20px 28px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.header-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-icon {
  font-size: 24px;
  color: #3b82f6;
}

.header-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  font-weight: 600;
}

.header-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}
</style>
