import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', noAuth: true }
  },
  {
    path: '/',
    redirect: '/config'
  },
  {
    path: '/config',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/config/map-ogres'
      },
      {
        path: 'map-ogres',
        name: 'MapOgres',
        component: () => import('@/views/config/MapOgres.vue'),
        meta: { title: '地图怪物配置' }
      },
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('@/views/config/任务配置.vue'),
        meta: { title: '任务配置' }
      },
      {
        path: 'unique-items',
        name: 'UniqueItems',
        component: () => import('@/views/config/UniqueItems.vue'),
        meta: { title: '特殊物品配置' }
      },
      {
        path: 'default-player',
        name: 'DefaultPlayer',
        component: () => import('@/views/config/默认玩家配置.vue'),
        meta: { title: '默认玩家配置' }
      },
      {
        path: 'shop',
        name: 'Shop',
        component: () => import('@/views/config/商店配置.vue'),
        meta: { title: '商店配置' }
      }
    ]
  },
  {
    path: '/gm',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: 'players',
        name: 'Players',
        component: () => import('@/views/gm/Players.vue'),
        meta: { title: '玩家管理' }
      },
      {
        path: 'server',
        name: 'Server',
        component: () => import('@/views/gm/Server.vue'),
        meta: { title: '服务器管理' }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/gm/Logs.vue'),
        meta: { title: '操作日志' }
      }
    ]
  },
  // {
  //   path: '/demo',
  //   component: () => import('@/layouts/MainLayout.vue'),
  //   children: [
  //     {
  //       path: '',
  //       name: 'ComponentDemo',
  //       component: () => import('@/views/ComponentDemo.vue'),
  //       meta: { title: '组件演示' }
  //     }
  //   ]
  // }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：检查认证状态
router.beforeEach(async (to, _from, next) => {
  // 登录页面直接放行
  if (to.meta.noAuth) {
    next()
    return
  }

  // 检查是否有 token
  const token = localStorage.getItem('gm_token')
  
  // 如果没有 token，尝试访问 API 检查是否是本地模式
  if (!token) {
    try {
      const { gmApi } = await import('@/api/gm')
      const response = await gmApi.getCurrentUser() as any
      
      if (response.success && response.data) {
        // 检查是否是本地模式
        if (response.data.isLocal) {
          // 本地模式：保存标记并继续访问
          localStorage.setItem('gm_local_mode', 'true')
          next()
          return
        }
      }
      
      // 非本地模式且无 token，跳转到登录页
      next('/login')
    } catch (error) {
      // API 访问失败，跳转到登录页
      next('/login')
    }
  } else {
    // 有 token，验证 token 是否有效
    try {
      const { gmApi } = await import('@/api/gm')
      const response = await gmApi.getCurrentUser() as any
      
      if (response.success) {
        // Token 有效，继续访问
        next()
      } else {
        // Token 无效，清除并跳转到登录页
        localStorage.removeItem('gm_token')
        localStorage.removeItem('gm_local_mode')
        next('/login')
      }
    } catch (error) {
      // Token 验证失败，清除并跳转到登录页
      localStorage.removeItem('gm_token')
      localStorage.removeItem('gm_local_mode')
      next('/login')
    }
  }
})

export default router
