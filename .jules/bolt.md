## 2025-06-03 - [O(n) to O(1) installment calculation]
**Learning:** In financial logic involving installments, calculating a specific part's value (e.g., share for a member or current installment) frequently uses distribution logic. Using an O(n) `distribuir(n)` method that allocates a full array is a major bottleneck in dashboards where many such calculations happen.
**Action:** Always prefer a `valorNoIndice(n, index)` O(1) approach for specific part retrieval. Use `distribuir(n)` only when the entire array is truly needed.

## 2026-06-04 - [Optimized BigInt Serialization & Date Bug Fix]
**Learning:** Generic recursive serialization utilities (like `serializeBigInt`) can be performance bottlenecks and sources of subtle bugs (like `Date` objects being corrupted into empty objects). Using `for...in` instead of `Object.keys().map()` reduces intermediate allocations and garbage collection pressure in deep traversals.
**Action:** Use manual loops and pre-allocated arrays for critical path serialization. Always include explicit guards for `Date` and other built-in types to prevent data loss during cloning.

## 2026-06-05 - [Prisma Nested Writes & Batch Transaction Optimization]
**Learning:** Performing multiple independent database calls (delete, upsert, create, find) within an interactive transaction loop creates O(4N) round-trips. Consolidating these into a single nested write (using `deleteMany: {}` and `create: [...]` inside `upsert`) and passing an array of promises to `$transaction` reduces this to a single optimized batch operation.
**Action:** Always leverage Prisma's nested write capabilities for relation synchronization in bulk operations. Prefer passing an array of operations to `$transaction` over interactive callbacks when operations are independent.
