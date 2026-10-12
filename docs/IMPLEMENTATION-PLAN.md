# Development sequence

## Phase 1 — Foundation

Scaffold Next.js App Router/TypeScript with compatible stable packages, responsive staff/public layouts, validation helpers, MongoDB connection reuse, environment validation, date/money utilities, and indexes. Establish module-based organization: src/modules/{complaints,memos,cashbook}, shared src/lib, src/components, and src/reports. Keep database operations off client components. Add .env.example and setup documentation. Validate build/types and exact money/date conversions.

## Phase 2 — Authentication and staff accounts

Implement secure staff login/logout/session handling. Add idempotent bootstrap-admin command and initial email. Implement only admin officer-creation and officer-promotion actions. Protect all staff routes and API operations server-side. Validate direct endpoint access and mass-assignment resistance. Do not seed a password into a repository.

## Phase 3 — Assets Complaints and Cloudinary

Implement all public form fields, exact option lists, Other branches, reminder references, bounded image upload, references, durable submission and confirmation. Add staff list/detail/search/filter/status handling. Deliver individual print/PDF and batch PDF. Verify using real Cloudinary when credentials exist; otherwise report integration unverified. Never replace durable persistence with localStorage.

## Phase 4 — Memo Tracking

Implement CRUD-style create/read/update without unrequested record deletion, four processing/execution booleans, percentage progress, registry date conditional rules, search/filters/PDF and audit history. Confirm executed/progress consistency server-side.

## Phase 5 — Cashbook

Implement zero opening at 2026-10-15, exact amounts, stable transaction ordering, derived balances, backdated recomputation, void/replacement correction, date/type/search filters and PDF. Include negative/future-date display behavior and protect fixed opening configuration.

## Phase 6 — Web Push

Implement service worker, explicit notification opt-in/out, authenticated subscription endpoints, ownership, durable job/outbox creation, retry worker, expiration cleanup, and private notification payloads. Include a repeatable key-generation/setup command. Confirm delivery with real browser subscription; use mocks only for failure/retry tests. Document how jobs run in development and hosting.

## Phase 7 — Reporting, dashboard and final validation

Complete dashboard summaries, shared Reports/Settings/audit views, consistent date filters, pagination-independent exports, responsive behavior and PDF pagination. Run ACCEPTANCE-CHECKS. Create README with exact install/dev/build/bootstrap/worker commands and deployment setup. Public hosting is authorized with noindex metadata/response headers; verify protected staff operations and public complaint access before sharing.

## Status tracking

Create docs/BUILD-STATUS.md with a phase checklist, validation evidence, pending external services and next step. If credentials are missing, keep building independent code. Distinguish implemented, tested locally, tested against actual provider, and deployed privately.

## 9 October amendments
Admin-only audit history; admin-controlled officer cashbook permissions and account removal with session revocation. Optional office number. Red National Assembly labels. Landscape tabular list exports and compact one-page individual complaint PDFs/printing. Validate authorization policy, optional field validation, PDF page count/orientation/content, types/lint/build.
