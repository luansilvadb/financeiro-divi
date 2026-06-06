# Sentinel Journal - Security Learnings

## 2026-06-04 - [Global Authentication Guard Implementation]
**Vulnerability:** Insecure defaults. Most financeiro endpoints were unprotected because developers had to remember to add `@UseGuards(JwtAuthGuard)` to each method or controller.
**Learning:** Developers often forget to apply security guards as the codebase grows. Relying on opt-in security is a high risk.
**Prevention:** Implement a global `APP_GUARD` in NestJS to ensure a "Fail-Secure" policy. Use a custom `@Public()` decorator for opt-out visibility. This ensures any new endpoint is private by default.
**Technical Note:** Switched to `bcryptjs` from `bcrypt` to avoid native environment binding issues while running integration tests in the sandbox.

## 2026-06-05 - [Strict Tenant Isolation in TenantRoleGuard]
**Vulnerability:** Broken Object Level Authorization (BOLA). Authenticated users could access data from any tenant by providing the `X-Tenant-ID` header if the endpoint lacked the `@Roles()` decorator.
**Learning:** Security guards that only activate based on specific decorators can leave many endpoints (especially GET listings) unprotected if they handle shared identifiers like tenant IDs.
**Prevention:** Enforce mandatory membership validation whenever a `X-Tenant-ID` is present in the request headers for all non-public endpoints. This ensures tenant isolation by default for all tenant-scoped data.
