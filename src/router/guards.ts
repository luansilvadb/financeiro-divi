import type { Router } from 'vue-router'
import { tenantSessionService } from '../shared/container'

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const isAuthed = tenantSessionService.isAuthenticated()
    const hasTenant = !!tenantSessionService.getActiveTenantId()

    if (!isAuthed && !to.path.startsWith('/login') && !to.path.startsWith('/forgot-password') && !to.path.startsWith('/reset-password')) {
      return next('/login')
    }

    if (isAuthed && !hasTenant && !to.path.startsWith('/select-tenant') && to.path !== '/login' && to.path !== '/forgot-password' && to.path !== '/reset-password') {
      return next('/select-tenant')
    }

    if (isAuthed && hasTenant && (to.path.startsWith('/login') || to.path.startsWith('/select-tenant'))) {
      return next('/dashboard')
    }

    next()
  })
}
