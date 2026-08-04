<template>
  <div class="page-container">
    <PageHeaderCard title="文志管理" subtitle="Article & Knowledge Management">
      <template #icon>
        <el-icon><Reading /></el-icon>
      </template>
      <template #default>
        <el-button type="primary">
          <el-icon><Plus /></el-icon>
          <span>创建文章</span>
        </el-button>
      </template>
    </PageHeaderCard>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <el-radio-group v-model="activeCategory" size="large">
        <el-radio-button label="all">全部文章</el-radio-button>
        <el-radio-button label="tech">技术分享</el-radio-button>
        <el-radio-button label="project">项目记录</el-radio-button>
        <el-radio-button label="activity">活动总结</el-radio-button>
        <el-radio-button label="notes">学习笔记</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon blue">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">156</span>
            <span class="stat-label">文章总数</span>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon green">
            <el-icon><View /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">12.8k</span>
            <span class="stat-label">总浏览量</span>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon orange">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">89</span>
            <span class="stat-label">精选文章</span>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon purple">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">24</span>
            <span class="stat-label"> contributors</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 文章列表卡片 -->
    <el-card class="articles-card">
      <template #header>
        <div class="card-header">
          <div class="card-title">
            <el-icon><Collection /></el-icon>
            <span>文章列表</span>
          </div>
          <div class="card-actions">
            <el-select v-model="sortBy" placeholder="排序方式" class="sort-select">
              <el-option label="最新发布" value="newest" />
              <el-option label="最多浏览" value="views" />
              <el-option label="最近更新" value="updated" />
            </el-select>
            <el-button type="primary" plain>
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <div class="empty-state">
        <div class="empty-illustration">
          <el-icon><Reading /></el-icon>
        </div>
        <h3 class="empty-title">文志管理平台</h3>
        <p class="empty-desc">记录实验室的技术分享、项目经验、活动总结和学习笔记，构建知识共享平台</p>
        <el-button type="primary" class="empty-btn">
          <el-icon><Plus /></el-icon>
          撰写第一篇文章
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  Reading, Plus, Document, View, Star, User,
  Collection, Refresh
} from '@element-plus/icons-vue'
import PageHeaderCard from '@/components/PageHeaderCard.vue'

const activeCategory = ref('all')
const sortBy = ref('newest')
</script>

<style scoped>
.page-container {
  padding: 20px;
}

/* ==================== 页面标题卡片 ==================== */
.page-header-card {
  background: linear-gradient(135deg, #409eff 0%, #7c3aed 50%, #a855f7 100%);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(64, 158, 255, 0.25);
}

.header-bg-pattern {
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 32px;
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper .el-icon {
  font-size: 32px;
  color: #fff;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 1px;
}

.add-btn {
  background: rgba(255, 255, 255, 0.95) !important;
  border: none !important;
  color: #7c3aed !important;
  padding: 12px 24px !important;
  border-radius: 10px !important;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.add-btn .el-icon {
  margin-right: 6px;
}

/* ==================== 分类标签 ==================== */
.category-tabs {
  background: #fff;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.category-tabs :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tabs :deep(.el-radio-button__inner) {
  border: 1px solid #e2e8f0;
  border-radius: 8px !important;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.category-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #409eff, #7c3aed);
  border-color: #7c3aed;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

/* ==================== 统计卡片 ==================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon .el-icon {
  font-size: 24px;
  color: #fff;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.green {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

/* ==================== 文章卡片 ==================== */
.articles-card {
  border: none;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.articles-card :deep(.el-card__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.card-title .el-icon {
  font-size: 20px;
  color: #7c3aed;

}

.card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sort-select {
  width: 140px;
}

.articles-card :deep(.el-card__body) {
  padding: 0;
}

/* ==================== 空状态 ==================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.empty-illustration {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-illustration .el-icon {
  font-size: 56px;
  color: #cbd5e1;
}

.empty-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  color: #334155;
}

.empty-desc {
  margin: 0 0 28px;
  font-size: 14px;
  color: #94a3b8;
  max-width: 400px;
  line-height: 1.6;
}

.empty-btn {
  background: linear-gradient(135deg, #409eff, #7c3aed) !important;
  border: none !important;
  color: #fff !important;
  padding: 14px 28px !important;
  border-radius: 10px !important;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
}

.empty-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
}

.empty-btn .el-icon {
  margin-right: 6px;
}
</style>
