import { useAuthStore } from '@/stores/auth'

/**
 * 权限控制工具函数
 * 用于在组件外（如路由守卫、工具函数中）进行权限判断
 */

/**
 * 检查当前用户是否拥有指定角色
 * @param role 角色名
 */
export function hasRole(role: string): boolean {
  const authStore = useAuthStore()
  return authStore.hasRole(role)
}

/**
 * 检查当前用户是否拥有任意一个角色
 * @param roleList 角色名数组
 */
export function hasAnyRole(roleList: string[]): boolean {
  const authStore = useAuthStore()
  return authStore.hasAnyRole(roleList)
}

/**
 * 检查当前用户是否拥有指定权限
 * @param permission 权限标识
 */
export function hasPermission(permission: string): boolean {
  const authStore = useAuthStore()
  return authStore.hasPermission(permission)
}

/**
 * 检查当前用户是否拥有任意一个权限
 * @param permissionList 权限标识数组
 */
export function hasAnyPermission(permissionList: string[]): boolean {
  const authStore = useAuthStore()
  return authStore.hasAnyPermission(permissionList)
}

/**
 * 检查当前用户是否可以访问指定菜单
 * @param menuPath 菜单路径
 */
export function hasMenu(menuPath: string): boolean {
  const authStore = useAuthStore()
  return authStore.hasMenu(menuPath)
}

/**
 * 获取当前实验室名称
 */
export function getCurrentLabName(): string {
  const authStore = useAuthStore()
  return authStore.currentLabName || '软件开发实验室' // 默认值
}

/**
 * 获取当前实验室 ID
 */
export function getCurrentLabId(): string | number | undefined {
  const authStore = useAuthStore()
  return authStore.currentLabId
}

/**
 * 实验室名称映射（用于动态显示）
 */
export const LAB_NAME_MAP: Record<string, string> = {
  'software': '软件开发实验室',
  'ai': '人工智能实验室',
  'hardware': '硬件实验室',
  'network': '网络实验室',
}

/**
 * 获取实验室显示名称
 * @param labNameOrId 实验室名称或ID
 */
export function getLabDisplayName(labNameOrId?: string | number): string {
  if (!labNameOrId) return '软件开发实验室'
  const key = String(labNameOrId).toLowerCase()
  return LAB_NAME_MAP[key] || String(labNameOrId)
}
