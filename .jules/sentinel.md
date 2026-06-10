# Sentinel Journal - Security Learnings

## 2026-06-04 - [Global Authentication Guard Implementation]
**Vulnerability:** Insecure defaults. Most financeiro endpoints were unprotected because developers had to remember to add `@UseGuards(JwtAuthGuard)` to each method or controller.
**Learning:** Developers often forget to apply security guards as the codebase grows. Relying on opt-in security is a high risk.
**Prevention:** Implement a global `APP_GUARD` in NestJS to ensure a "Fail-Secure" policy. Use a custom `@Public()` decorator for opt-out visibility. This ensures any new endpoint is private by default.
**Technical Note:** Switched to `bcryptjs` from `bcrypt` to avoid native environment binding issues while running integration tests in the sandbox.

## 2025-05-22 - Hardcoded JWT Secret Removed
- **Issue**: AuthModule and JwtStrategy were using a hardcoded fallback secret ('super-secret-key-12345').
- **Risk**: If the environment variable JWT_SECRET is not set, the application would use a known insecure key, allowing attackers to forge tokens.
- **Fix**: Removed the fallback, ensuring the application fails to initialize or validate tokens securely if the configuration is missing.
