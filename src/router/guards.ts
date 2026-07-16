import type { Router } from 'vue-router'
import { tenantSessionService } from '../shared/container'

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password']
const isPublic = (path: string) => PUBLIC_PATHS.some(p => path.startsWith(p))

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const isAuthed = tenantSessionService.isAuthenticated()
    const hasTenant = !!tenantSessionService.getActiveTenantId()

    if (!isAuthed && !isPublic(to.path)) {
      return next('/login')
    }

    if (isAuthed && !hasTenant && to.path !== '/select-tenant' && !isPublic(to.path)) {
      return next('/select-tenant')
    }

    if (isAuthed && hasTenant && (to.path.startsWith('/login') || to.path.startsWith('/select-tenant'))) {
      return next('/dashboard')
    }

    next()
  })
}
