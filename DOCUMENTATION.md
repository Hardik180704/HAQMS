# HAQMS Assignment Documentation

## Overview

This submission focuses on making the project runnable, then fixing the highest-impact security, performance, database, and frontend issues called out by the assignment brief. I prioritized fixes that improve correctness and production readiness while keeping the changes small enough to review.

## Issues Identified

- Project setup was incomplete: the repository referenced Prisma schema, seed files, migrations, and env templates that were not present.
- Authentication logged sensitive request data and login passwords.
- JWT handling used a hardcoded fallback secret and ignored token expiration during verification.
- Registration returned the full user record, including the password hash.
- Admin-only patient deletion used a legacy authorization middleware that did not enforce the `ADMIN` role.
- Doctor search used unsafe raw SQL string interpolation.
- Patient listing loaded all rows and performed search/filter/pagination in memory.
- Appointment listing performed N+1 database queries for patient and doctor details.
- Doctor statistics and report generation performed independent queries sequentially.
- Queue check-in generated token numbers with a read-then-create race condition.
- Public queue page leaked polling intervals after unmount.
- Doctor patient history modal crashed when `medicalHistory` was `null`.
- The legacy patient history link routed to a missing Next.js page.
- Frontend configuration hardcoded the API URL, making local/deployed environments harder to configure.

## Fixes Implemented

- Added `backend/prisma/schema.prisma` with the models needed by the existing Express routes.
- Added `backend/prisma/seed.js` with seeded admin, receptionist, doctor, patient, appointment, and queue data.
- Added `backend/.env.example` and `frontend/.env.example`.
- Added `.gitignore` to keep local env files, build output, and dependencies out of commits.
- Updated backend local env to run on port `5001` because macOS Control Center was already using port `5000`.
- Removed password/request-body logging from auth routes.
- Required `JWT_SECRET` to be configured and removed the unsafe hardcoded fallback.
- Enabled normal JWT expiration validation and configured login token lifetime through `JWT_EXPIRES_IN`.
- Sanitized auth error responses so stack traces and token verification details are not returned to clients.
- Returned selected user fields from registration instead of the password hash.
- Enforced `ADMIN` role checks in `authorizeAdminOnlyLegacy`.
- Replaced unsafe doctor search SQL with Prisma `findMany` filters.
- Moved patient filtering and pagination into Prisma queries using `where`, `skip`, and `take`.
- Replaced appointment N+1 logic with Prisma relation includes and field selection.
- Parallelized independent doctor stats queries with `Promise.all`.
- Rebuilt doctor report aggregation using Prisma `groupBy` instead of nested sequential loops.
- Wrapped queue token generation in a transaction and used a Postgres advisory transaction lock per doctor/day.
- Removed artificial queue delay that widened the race window.
- Made `GET /api/queue` public to match the intended public monitor board behavior.
- Added cleanup for queue polling interval and guarded state updates after unmount.
- Fixed the null medical history crash with optional chaining and fallback UI text.
- Added `frontend/src/app/patients/[id]/history-records/page.js` to render clinical background and appointment history.
- Added `turbopack.root` in `frontend/next.config.mjs` to remove the workspace-root warning during builds.
- Moved frontend API base URL to `NEXT_PUBLIC_API_BASE_URL`.

## Optimizations Performed

- Patient directory now uses database-level pagination instead of loading and slicing all patients in memory.
- Appointment list now executes one relation-aware query instead of one query per appointment plus patient/doctor lookups.
- Doctor stats now runs independent database work concurrently.
- Report generation now uses grouped database aggregates instead of repeated nested count/find loops.
- Queue polling no longer leaks intervals across route changes.

## Database Improvements

- Added unique email constraint for users.
- Added one-to-one link between `User` and `Doctor` where applicable.
- Added unique appointment constraint on doctor and exact appointment date.
- Added indexes for common filters and relationships such as doctor, patient, appointment status, queue status, gender, and created date.
- Added seeded records matching the README demo credentials.

## Verification

- `npm run db:setup --prefix backend` completed successfully.
- `npx prisma validate` completed successfully.
- `npx prisma generate` completed successfully.
- `npm run lint --prefix frontend` completed with warnings only.
- `npm run build --prefix frontend` completed successfully.
- Browser verification covered:
  - doctor login
  - appointment list
  - null medical history fallback for Clark Kent
  - new patient history route
  - admin report loading
  - SQL-injection-style physician search no longer returning all doctors
  - public queue monitor rendering tokens without auth failure
- API smoke test covered:
  - admin login
  - patient pagination
  - doctor search
  - doctor report endpoint
  - public queue endpoint

## Remaining Known Issues

- Some frontend hook dependency warnings remain in `dashboard/page.js` and `AuthContext.js`. They do not block the production build, but the dashboard component would benefit from extracting data-fetching logic into memoized callbacks or smaller components.
- Auth still stores JWTs in `localStorage`. A production application should prefer secure, HTTP-only cookies with CSRF protections.
- CORS is still broad and should be restricted to known frontend origins in production.
- Input validation is still basic in several routes. A schema validator such as Zod or Joi would make request validation more consistent.
- Queue token uniqueness is protected by a transaction lock, but a dedicated daily token counter table or sequence would be cleaner under heavier production load.
- Deployment still needs production environment variables and a hosted PostgreSQL database.

## Reasoning Behind Major Decisions

- I fixed setup first because no other work can be verified if the project cannot run locally.
- I prioritized security issues that could leak credentials, bypass authorization, or allow SQL injection.
- I used Prisma APIs instead of raw SQL for maintainability and safer query construction.
- I kept performance fixes close to the existing route contracts so the frontend required minimal changes.
- I implemented the missing history page as a small authenticated client page to match the current frontend architecture.
- I left a short remaining-issues list to show prioritization rather than pretending every production concern was solved.
