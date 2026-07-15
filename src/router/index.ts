import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { tenantSessionService } from '../shared/container'

const LoginScreen = () => import('../views/screens/LoginScreen.vue')
const ForgotPasswordScreen = () => import('../views/screens/ForgotPasswordScreen.vue')
const ResetPasswordScreen = () => import('../views/screens/ResetPasswordScreen.vue')
const TenantSelectorScreen = () => import('../views/screens/TenantSelectorScreen.vue')
const DashboardView = () => import('../router/DashboardView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => {
      if (!tenantSessionService.isAuthenticated()) return '/login'
      if (!tenantSessionService.getActiveTenantId()) return '/select-tenant'
      return '/dashboard'
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginScreen,
  },
  {
    path: '/forgot-password',
    name: 'forgotPassword',
    component: ForgotPasswordScreen,
  },
  {
    path: '/reset-password',
    name: 'resetPassword',
    component: ResetPasswordScreen,
    props: (route) => ({ token: route.query.token || '' }),
  },
  {
    path: '/select-tenant',
    name: 'selectTenant',
    component: TenantSelectorScreen,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
