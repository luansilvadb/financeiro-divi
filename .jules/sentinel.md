# Sentinel Journal - Security Learnings

## 2026-06-04 - [Global Authentication Guard Implementation]
**Vulnerability:** Insecure defaults. Most financeiro endpoints were unprotected because developers had to remember to add `@UseGuards(JwtAuthGuard)` to each method or controller.
**Learning:** Developers often forget to apply security guards as the codebase grows. Relying on opt-in security is a high risk.
**Prevention:** Implement a global `APP_GUARD` in NestJS to ensure a "Fail-Secure" policy. Use a custom `@Public()` decorator for opt-out visibility. This ensures any new endpoint is private by default.
**Technical Note:** Switched to `bcryptjs` from `bcrypt` to avoid native environment binding issues while running integration tests in the sandbox.

## 2026-06-05 - [Tenant Isolation Bypass (BOLA) in Role Guard]
**Vulnerability:** Broken Object Level Authorization (BOLA). The `TenantRoleGuard` only performed membership checks if the `@Roles()` decorator was present. Routes with only authentication (`JwtAuthGuard`) but no specific role requirements were vulnerable to cross-tenant data access if they relied on the `X-Tenant-ID` header.
**Learning:** Security guards that combine authorization (roles) and isolation (tenants) must ensure that isolation checks are mandatory for all multi-tenant requests, even when authorization is permissive.
**Prevention:** Modified the guard to always verify tenant membership if an `X-Tenant-ID` header is present, ensuring that "Authenticated" does not automatically mean "Authorized for all tenants".
