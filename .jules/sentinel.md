# Sentinel Journal - Security Learnings

## 2026-06-04 - [Global Authentication Guard Implementation]
**Vulnerability:** Insecure defaults. Most financeiro endpoints were unprotected because developers had to remember to add `@UseGuards(JwtAuthGuard)` to each method or controller.
**Learning:** Developers often forget to apply security guards as the codebase grows. Relying on opt-in security is a high risk.
**Prevention:** Implement a global `APP_GUARD` in NestJS to ensure a "Fail-Secure" policy. Use a custom `@Public()` decorator for opt-out visibility. This ensures any new endpoint is private by default.
**Technical Note:** Switched to `bcryptjs` from `bcrypt` to avoid native environment binding issues while running integration tests in the sandbox.

## 2026-06-09 - [BOLA Protection in TenantRoleGuard]
**Vulnerability:** Broken Object Level Authorization (BOLA). The `TenantRoleGuard` was only checking tenant membership if specific roles were required via `@Roles()`. Authenticated users could access any tenant's data on generic endpoints by providing a different `X-Tenant-ID` header.
**Learning:** Decoupling tenant validation from role validation is crucial. Membership verification must be a prerequisite for any tenant-scoped request, regardless of the user's specific role.
**Prevention:** Always verify tenant membership if a tenant ID is present in the request. The guard now enforces mandatory membership checks for all requests providing an `X-Tenant-ID`, ensuring proper isolation by default.
