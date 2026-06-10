# Sentinel Journal - Security Learnings

## 2026-06-04 - [Global Authentication Guard Implementation]
**Vulnerability:** Insecure defaults. Most financeiro endpoints were unprotected because developers had to remember to add `@UseGuards(JwtAuthGuard)` to each method or controller.
**Learning:** Developers often forget to apply security guards as the codebase grows. Relying on opt-in security is a high risk.
**Prevention:** Implement a global `APP_GUARD` in NestJS to ensure a "Fail-Secure" policy. Use a custom `@Public()` decorator for opt-out visibility. This ensures any new endpoint is private by default.
**Technical Note:** Switched to `bcryptjs` from `bcrypt` to avoid native environment binding issues while running integration tests in the sandbox.

## 2026-06-05 - [BOLA Protection in Tenant-Aware Endpoints]
**Vulnerability:** Broken Object Level Authorization (BOLA). Routes that did not require specific roles (e.g., `GET /financeiro/membros`) would skip tenant membership validation if the `@Roles()` decorator was absent, even if a `X-Tenant-ID` was provided.
**Learning:** Security guards that rely on the presence of metadata (like roles) may inadvertently skip mandatory isolation checks if that metadata is missing.
**Prevention:** Decouple tenant isolation from role validation. The `TenantRoleGuard` now always verifies tenant membership whenever a `X-Tenant-ID` header is present, ensuring consistent isolation across all shared endpoints.
