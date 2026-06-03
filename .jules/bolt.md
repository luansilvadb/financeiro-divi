## 2025-06-03 - [O(n) to O(1) installment calculation]
**Learning:** In financial logic involving installments, calculating a specific part's value (e.g., share for a member or current installment) frequently uses distribution logic. Using an O(n) `distribuir(n)` method that allocates a full array is a major bottleneck in dashboards where many such calculations happen.
**Action:** Always prefer a `valorNoIndice(n, index)` O(1) approach for specific part retrieval. Use `distribuir(n)` only when the entire array is truly needed.
