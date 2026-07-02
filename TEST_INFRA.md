# E2E Test Infra: Next.js Multi-Tenant Server Actions

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Auth & Profile | ORIGINAL_REQUEST §R1-3 | 5 | 5 | ✓ |
| 2 | Customer & Pipeline | ORIGINAL_REQUEST §R1-3 | 5 | 5 | ✓ |
| 3 | Automation & Reminders | ORIGINAL_REQUEST §R1-3 | 5 | 5 | ✓ |
| 4 | Third-party Integrations | ORIGINAL_REQUEST §R1-3 | 5 | 5 | ✓ |
| 5 | Public Engagement & Marketing | ORIGINAL_REQUEST §R1-3 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Custom Node test runner with CommonJS compilation override
- Mock environment: Mocking Next.js headers/cookies, navigation (redirects), cache (revalidatePath), and Supabase server/admin clients.
- Directory layout: `tests/`
