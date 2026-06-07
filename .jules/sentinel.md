# Sentinel Journal - Security Learnings

## 2026-06-04 - [Global Authentication Guard Implementation]
**Vulnerability:** Insecure defaults. Most financeiro endpoints were unprotected because developers had to remember to add `@UseGuards(JwtAuthGuard)` to each method or controller.
**Learning:** Developers often forget to apply security guards as the codebase grows. Relying on opt-in security is a high risk.
**Prevention:** Implement a global `APP_GUARD` in NestJS to ensure a "Fail-Secure" policy. Use a custom `@Public()` decorator for opt-out visibility. This ensures any new endpoint is private by default.
**Technical Note:** Switched to `bcryptjs` from `bcrypt` to avoid native environment binding issues while running integration tests in the sandbox.

## 2026-06-05 - [Tenant-based BOLA Protection]
**Vulnerability:** Broken Object Level Authorization (BOLA). `TenantRoleGuard` was skipping checks if no specific roles were required, allowing any authenticated user to access any tenant's data via headers.
**Learning:** Security guards that only check for roles can leave a massive gap in multi-tenant applications if they don't explicitly verify tenant ownership for every non-public request.
**Prevention:** Ensure the guard always verifies tenant membership if a tenant context (like a header) is provided, regardless of whether specific roles are required.
