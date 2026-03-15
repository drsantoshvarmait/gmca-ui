---
description: Process flow for new development in GMCA UI
---

# 🚀 Development Process Flow: GMCA UI

Follow these steps for any new development task:

1. **Discovery & Planning**:
   - Analyze user request and design changes.
   - Create an `implementation_plan` artifact.
   - **WAIT** for user approval.

2. **Backend Development**:
   - Create migrations in `supabase/migrations/` (if DB changes are needed).
   - Ensure RLS policies are updated for multi-tenancy.

3. **Frontend Development**:
   - Implement logic in `src/pages/` or `src/modules/`.
   - Create UI components in `src/components/`.
   - Use Vanilla CSS or Inline styles for styling.

4. **Verification**:
   - Run `npm run test` for unit tests.
   - Run `npm run test:e2e` for environment-wide integration checks.
   - Perform manual verification in the dev server.

5. **Deployment & Promotion**:
   - Push to `staging` branch for staging deployment.
   - Verify on Staging.
   - Merge to `main` for Production deployment.
