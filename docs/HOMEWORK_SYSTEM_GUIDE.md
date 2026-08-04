# 多题型作业系统使用指南

## 📖 系统概述

这是一个功能完整的作业管理系统，支持多种题型和AI辅助批改功能。

### 主要功能

1. **多题型支持**
   - 📝 单选题 / 多选题
   - ✏️ 填空题
   - 📄 简答题
   - 💻 编程题（支持测试用例）
   - 📎 报告提交（支持本地打开）

2. **AI智能批改**
   - 自动批改选择题和填空题
   - AI辅助评分简答题和编程题
   - 支持多种AI服务商（OpenAI、Claude、自定义API）

3. **学生在线答题**
   - 实时保存草稿
   - 题目导航和进度追踪
   - 支持代码编辑器

4. **教师批改工具**
   - AI批量批改
   - 教师审核和调整分数
   - 详细评语和反馈

---

## 🚀 快速开始

### 1. 访问新系统

在侧边栏找到 **"作业管理(AI)"** 菜单，点击进入新系统。

### 2. 创建作业

点击 **"布置作业"** 按钮，打开作业创建对话框。

#### 基本设置
- 填写作业标题
- 选择所属部门
- 设置截止时间
- 设置满分分值

#### 题目设置
点击"题目设置"标签页，可以添加不同类型的题目：

**添加单选题**
1. 点击"单选题"按钮
2. 填写题目名称
3. 填写选项内容
4. 标记正确答案
5. 设置分值

**添加填空题**
1. 点击"填空题"按钮
2. 填写题目
3. 添加填空项，填写正确答案
4. 可设置是否区分大小写

**添加简答题**
1. 点击"简答题"按钮
2. 填写题目和描述
3. 可填写参考答案和评分指南
4. 设置最大字数限制

**添加编程题**
1. 点击"编程题"按钮
2. 选择编程语言
3. 填写初始代码模板
4. 添加测试用例（输入/期望输出）
5. 标记是否隐藏测试用例

**添加报告提交**
1. 点击"报告提交"按钮
2. 选择提交方式（文件/链接/两者）
3. 设置允许的文件类型
4. 设置最大文件大小
5. 开启"允许本地打开"选项

#### AI批改设置
在"高级设置"标签页：

- **启用AI批改**：开启后系统将自动批改
- **AI批改模式**：
  - 全自动批改：直接使用AI评分
  - AI辅助批改：AI提供评分参考，教师最终确认
- **自动批改题型**：选择哪些题型由AI自动评分

---

## 📊 题目类型详解

### 选择题/多选题

```typescript
{
  type: 'choice' | 'multi_choice',
  title: '题目名称',
  options: [
    { id: 'a', label: 'A', content: '选项内容', isCorrect: false },
    // ...
  ],
  explanation: '答案解析（可选）'
}
```

**特点**：
- 自动批改
- 支持单选和多选
- 可设置答案解析

### 填空题

```typescript
{
  type: 'fill_blank',
  title: '请填写代码',
  blanks: [
    { id: 'b1', answer: '正确答案', caseSensitive: false },
    // ...
  ],
  acceptableAnswers: ['答案1', '答案2'] // 可选
}
```

**特点**：
- 自动批改
- 支持区分大小写
- 可设置多个可接受答案

### 简答题

```typescript
{
  type: 'short_answer',
  title: '简述面向对象特性',
  referenceAnswer: '参考答案内容',
  gradingGuide: '评分标准：每点X分',
  maxLength: 1000
}
```

**特点**：
- AI辅助评分
- 可设置字数限制
- 支持评分指南

### 编程题

```typescript
{
  type: 'code',
  title: '实现排序算法',
  language: 'python',
  starterCode: 'def sort():\n    pass',
  testCases: [
    { input: '[3,1,2]', expectedOutput: '[1,2,3]', isHidden: false },
    // ...
  ]
}
```

**特点**：
- AI辅助评分
- 支持测试用例
- 可设置隐藏测试用例

### 报告提交

```typescript
{
  type: 'report',
  submissionType: 'file', // 'file' | 'link' | 'both'
  allowedFileTypes: ['.pdf', '.docx'],
  maxFileSize: 10, // MB
  allowLocalOpen: true
}
```

**特点**：
- 灵活的文件提交
- 支持本地打开编辑
- 适合大型项目提交

---

## 🔧 AI配置

### 支持的AI服务商

1. **Mock（默认）**
   - 适用于开发和测试
   - 模拟AI批改逻辑

2. **OpenAI**
   ```typescript
   {
     provider: 'openai',
     apiKey: 'your-api-key',
     baseUrl: 'https://api.openai.com',
     model: 'gpt-4'
   }
   ```

3. **Claude**
   ```typescript
   {
     provider: 'claude',
     apiKey: 'your-api-key',
     model: 'claude-3-opus'
   }
   ```

4. **自定义API**
   ```typescript
   {
     provider: 'custom',
     baseUrl: 'https://your-api.com/grade'
   }
   ```

### 配置AI服务

在代码中初始化AI服务：

```typescript
import { initAiGradingService } from '@/services/aiGradingService'

const aiService = initAiGradingService({
  enabled: true,
  provider: 'openai',
  apiKey: process.env.VITE_OPENAI_API_KEY,
  model: 'gpt-4'
})

// 测试连接
const result = await aiService.testConnection()
console.log(result)
```

---

## 🖥️ 本地文件打开

### Electron桌面应用

如果你的项目使用Electron构建桌面应用，可以启用本地文件打开功能：

**主进程 (main.js)**
```javascript
const { ipcMain, shell } = require('electron')

ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath)
    return { success: true }
  } catch (error) {
    return { success: false, message: error.message }
  }
})
```

**预加载脚本 (preload.js)**
```javascript
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      return ipcRenderer.invoke(channel, ...args)
    }
  }
})
```

### 浏览器环境

在纯浏览器环境中，学生提交文件后可以下载到本地，然后用本地应用打开。

---

## 📱 学生端使用

### 访问答题页面

学生访问 `/homework/answer/:homeworkId` 进入答题页面。

### 答题流程

1. **选择题目**：点击左侧题目导航
2. **填写答案**：
   - 选择题：点击选项
   - 填空题：在输入框填写
   - 简答题：在文本框输入
   - 编程题：在代码编辑器编写
   - 报告：上传文件或填写链接
3. **保存草稿**：点击"保存草稿"按钮
4. **提交作业**：点击"提交作业"按钮

### 查看已提交作业

提交后可以查看：
- 每题的AI评分
- 教师最终评分
- 评语和反馈

---

## 👨‍🏫 教师端使用

### 访问批改页面

教师访问 `/homework/grading/:homeworkId` 进入批改页面。

### 批改流程

1. **选择学生**：点击左侧学生列表
2. **查看答题**：在右侧查看学生答案
3. **AI批改**：
   - 点击"使用AI批改"按钮
   - 系统自动批改选择题和填空题
   - AI为简答题和编程题提供评分参考
4. **审核调整**：
   - 查看AI评分
   - 根据需要调整分数
   - 添加评语
5. **保存评分**：点击"保存评分"按钮

### 批量操作

- 点击"批量AI批改"按钮可一次批改所有未批改的作业
- 支持导出成绩单为Excel

---

## 📁 文件结构

```
src/
├── pages/homework/
│   ├── index.vue              # 旧版作业管理
│   ├── indexV2.vue           # 新版作业管理（多题型）
│   ├── detail.vue            # 作业详情（旧版）
│   ├── CreateHomeworkDialog.vue      # 旧版创建对话框
│   ├── CreateHomeworkDialogV2.vue    # 新版创建对话框
│   ├── QuestionEditor.vue    # 题目编辑器
│   ├── StudentAnswer.vue      # 学生答题页面
│   └── GradingPage.vue        # AI辅助批改页面
├── stores/
│   ├── homework.ts           # 旧版Store
│   └── homework-v2.ts        # 新版Store
├── services/
│   ├── aiGradingService.ts   # AI批改服务
│   └── localFileService.ts   # 本地文件服务
└── types/
    └── homework.ts           # 类型定义
```

---

## 🔄 从旧版迁移

如果你有旧版作业数据，需要迁移到新版：

### 数据兼容

新版Store (`homework-v2.ts`) 保留了与旧版的兼容性：

```typescript
// 旧版数据
{
  id: 1,
  title: '作业标题',
  requirement: '作业要求文本',
  // ...
}

// 新版数据结构
{
  id: 1,
  basic: {
    title: '作业标题',
    // ...
  },
  questions: [],
  requirement: '作业要求文本', // 保留兼容性
}
```

### 迁移步骤

1. 在新版页面创建作业
2. 将旧版作业要求复制为题目描述
3. 如需多题型，逐题添加

---

## ⚠️ 注意事项

1. **AI批改质量**：AI批改仅供参考，最终评分应由教师确认
2. **数据安全**：API Key等敏感信息请使用环境变量
3. **文件大小**：大文件上传可能需要配置服务器端
4. **浏览器兼容**：建议使用Chrome/Firefox最新版

---

## 🐛 常见问题

### Q: AI批改失败怎么办？

1. 检查AI配置是否正确
2. 确认API Key有效
3. 查看浏览器控制台错误信息
4. 可临时切换到Mock模式

### Q: 如何添加新的题型？

在 `src/types/homework.ts` 中添加新的题型定义，然后更新相关组件。

### Q: 如何自定义评分规则？

修改 `aiGradingService.ts` 中的评分逻辑，或配置自定义API服务端。

---

## 📞 获取帮助

如有问题，请在项目Issue中提问。

---

*文档更新于 2024年*
