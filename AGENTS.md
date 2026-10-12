# Project instructions

## Authority

Read docs/PRODUCT-SPEC.md, docs/IMPLEMENTATION-PLAN.md, and docs/ACCEPTANCE-CHECKS.md. User changes override these files; update the spec when scope changes. Do not invent requirements or expand this into full double-entry accounting.

## Implementation

- One Next.js App Router application with TypeScript, MongoDB, and Cloudinary. Use the Node runtime for MongoDB, Cloudinary, authentication, and server PDF operations.
- Organize module components, validation, models, and services separately. Shared server code belongs in src/lib. Keep database and secrets out of client bundles.
- Validate input server-side, check authorization for every protected operation, restrict updates to explicit allowed fields, and derive the acting user from the session.
- Use password hashing from a maintained library, secure session cookies, logout invalidation, login throttling, and appropriate request-origin/CSRF protections. Never store raw passwords.
- Exactly two roles: admin and officer. Deny officer creation and officer-to-admin promotion to officers. Do not expose unrestricted user role/profile mutations or public signup.
- Use server-side PDF generation with print-friendly browser layouts. Use an embedded Unicode font supporting the naira symbol; render user text as data.
- Public complaint submissions must use server validation, upload bounds, and durable rate limiting. Do not disclose internal records through public read endpoints.
- Cloudinary is used only for optional complaint pictures. Use server-authorized upload and validate actual image content; clean up abandoned uploads safely.
- Web Push is a real integration with a service worker, explicit device consent, server-owned subscription records, and retryable jobs. Do not substitute polling or a toast for push delivery.
- Use integer kobo and date-only business dates. Interpret complaint timestamps and reporting boundaries in Africa/Lagos.
- References use atomic database sequences with unique indexes. Gaps after failed transactions are acceptable; duplicate references are not.
- Audit sensitive operations. Keep secrets, password hashes, and tokens out of audit snapshots and logs.

## Validation and progress

Run type/build checks and relevant integration or browser checks. Test authorization, ledger correctness, filtering, PDF output, image integration, and notification persistence rather than implementation-mirroring tests.

Update docs/BUILD-STATUS.md after every phase with completed work, actual commands/checks and results, external configuration blockers, and the next phase. Never claim an external integration or private deployment works without verification.

## Delivery

No public publishing without user approval. Never commit .env.local, real credentials, bootstrap passwords, database exports, or uploaded personal images. Preserve unrelated files and user changes. Provide local setup and an operational deployment guide for the actual implemented stack.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
