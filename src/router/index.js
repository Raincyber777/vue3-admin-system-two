import { createRouter, createWebHashHistory } from 'vue-router'

const isAuthenticated = () => {
  return !!localStorage.getItem('token')
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

  next()
})

export default router
