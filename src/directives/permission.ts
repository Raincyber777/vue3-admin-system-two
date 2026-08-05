import { useAuthStore } from '@/stores/auth'
import type { Directive } from 'vue'

/**
 * v-permission 指令
 * 用法：
 *   v-permission="'course:create'"           // 需要指定权限
 *   v-permission="['course:create', 'course:edit']"  // 需要任意一个权限
 *   v-permission.role="'admin'"              // 需要指定角色
 *   v-permission.role="['admin', 'teacher']"  // 需要任意一个角色
 *   v-permission.menu="'/training-course'"   // 需要菜单访问权限
 */

type PermissionValue = string | string[]

// 移除元素的辅助函数
const removeElement = (el: HTMLElement) => {
  el.parentNode?.removeChild(el)
}

// 检查权限的辅助函数
const checkPermission = (value: PermissionValue, type: 'permission' | 'role' | 'menu' = 'permission'): boolean => {
  const authStore = useAuthStore()

  const values = Array.isArray(value) ? value : [value]

  switch (type) {
    case 'role':
      return values.some(v => authStore.hasRole(v))
    case 'menu':
      return values.some(v => authStore.hasMenu(v))
    case 'permission':
    default:
      return values.some(v => authStore.hasPermission(v))
  }
}

// 创建指令
export const permissionDirective: Directive<HTMLElement, PermissionValue> = {
  mounted(el, binding) {
    const { value, modifiers } = binding
    if (!value) return

    // 根据修饰符判断检查类型
    const type: 'permission' | 'role' | 'menu' = 
      modifiers.role ? 'role' : 
      modifiers.menu ? 'menu' : 'permission'

    if (!checkPermission(value, type)) {
      // 保存原始 display 以便恢复
      el.setAttribute('data-permission-hidden', 'true')
      removeElement(el)
    }
  },

  updated(el, binding) {
    const { value, modifiers } = binding
    if (!value) return

    const type: 'permission' | 'role' | 'menu' = 
      modifiers.role ? 'role' : 
      modifiers.menu ? 'menu' : 'permission'

    const hasPermission = checkPermission(value, type)
    const isHidden = el.getAttribute('data-permission-hidden') === 'true'

    if (!hasPermission && !isHidden) {
      el.setAttribute('data-permission-hidden', 'true')
      removeElement(el)
    }
  },
}

// 注册指令的辅助函数
export const setupPermissionDirective = (app: any) => {
  app.directive('permission', permissionDirective)
}

export default permissionDirective
