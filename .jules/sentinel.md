# Sentinel Journal - Security Learnings

## 2026-06-04 - [Global Authentication Guard Implementation]
**Vulnerability:** Insecure defaults. Most financeiro endpoints were unprotected because developers had to remember to add `@UseGuards(JwtAuthGuard)` to each method or controller.
**Learning:** Developers often forget to apply security guards as the codebase grows. Relying on opt-in security is a high risk.
**Prevention:** Implement a global `APP_GUARD` in NestJS to ensure a "Fail-Secure" policy. Use a custom `@Public()` decorator for opt-out visibility. This ensures any new endpoint is private by default.
**Technical Note:** Switched to `bcryptjs` from `bcrypt` to avoid native environment binding issues while running integration tests in the sandbox.

## 2026-06-04 - [Missing Tenant Isolation (Broken Access Control)]
**Vulnerability:** Broken Access Control / Insecure Direct Object Reference (IDOR). While endpoints were protected by JWT, they didn't verify if the user belonged to the tenant specified in the `X-Tenant-ID` header.
**Learning:** Authentication != Authorization. Multi-tenant apps must verify ownership/membership for every request that targets a specific tenant resource.
**Prevention:** Implement a `TenantGuard` that validates the user's membership in the requested tenant before allowing access to any financeiro resources.
