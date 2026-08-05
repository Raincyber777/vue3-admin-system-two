import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

// 从 localStorage 恢复菜单权限
const getStoredMenus = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
    return userInfo?.menus || []
  } catch {
    return []
  }
}

// 检查菜单权限
const hasMenuPermission = (path) => {
  const menus = getStoredMenus()
  // 如果 menus 为空，默认允许访问所有菜单（向后兼容）
  if (menus.length === 0) return true
  // 检查路径是否在权限列表中
  return menus.some(menu => path.startsWith(menu))
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../login/login.vue'),
      meta: { title: '登录' }
    },
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      redirect: '/application',
      children: [
        {
          path: 'application',
          name: 'Application',
          component: () => import('../pages/application/index.vue'),
          meta: { title: '报名审核', requiresAuth: true }
        },
        {
          path: 'signin',
          name: 'Signin',
          component: () => import('../pages/signin/index.vue'),
          meta: { title: '签到管理', requiresAuth: true }
        },
        {
          path: 'homework',
          name: 'Homework',
          component: () => import('../pages/interview/index.vue'),
          meta: { title: '作业发布', requiresAuth: true }
        },
        {
          path: 'grading',
          name: 'Grading',
          component: () => import('../pages/homework/grading.vue'),
          meta: { title: '作业批改', requiresAuth: true }
        },
        {
          path: 'training-course',
          name: 'TrainingCourse',
          component: () => import('../pages/training-course/index.vue'),
          meta: { title: '课程管理', requiresAuth: true }
        },
        {
          path: 'training-detail',
          name: 'TrainingDetail',
          component: () => import('../pages/training-course/TrainingDetail.vue'),
          meta: { title: '培训名单', requiresAuth: true }
        },
        {
          path: 'personal',
          name: 'Personal',
          component: () => import('../pages/personal/index.vue'),
          meta: { title: '个人中心', requiresAuth: true }
        },
        {
          path: 'account',
          name: 'Account',
          component: () => import('../pages/account/index.vue'),
          meta: { title: '账号管理', requiresAuth: true }
        },
        {
          path: 'score',
          name: 'Score',
          component: () => import('../pages/score/index.vue'),
          meta: { title: '学员表现', requiresAuth: true }
        },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

router.beforeEach((to, from, next) => {
  const loginPath = '/login'

  if (to.path === loginPath) {
    if (isAuthenticated()) {
      next('/application')
    } else {
      next()
    }
    return
  }

  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login')
    return
  }

  // 检查菜单权限（仅对需要认证的页面）
  if (to.meta.requiresAuth && !hasMenuPermission(to.path)) {
    // 没有权限，跳转到第一个有权限的页面或 404 页面
    const menus = getStoredMenus()
    if (menus.length > 0) {
      next(menus[0])
    } else {
      next('/application')
    }
    return
  }

  next()
})

export default router
