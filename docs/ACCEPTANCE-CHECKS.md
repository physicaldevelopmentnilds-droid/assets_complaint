# Acceptance checks

## Access

- Public complaint submission works with no application session; staff records/PDFs return unauthorized for direct unauthenticated requests.
- Officers operate complaints/memos; cashbook reads, writes, voids, reports and dashboard finance data require explicit admin approval. Unapproved and legacy officers cannot access finance through direct requests. Only admins see audit history or administer users. Verify approval/revocation without logout, removal session invalidation, and rejection of officer attempts to approve/remove/promote users.
- Crafted profile/body role changes cannot escalate access. Admin can create officers and promote them.
- Bootstrap reruns neither duplicate accounts nor reset existing passwords. Logout ends session access.

## Complaints and images

- Submit complete first complaint without picture, reminder with optional reference, and both Other fields.
- Missing required/Other values and invalid images rejected server-side; valid JPEG/PNG/WebP accepted within limits. Cloudinary JPEG format jpg and normalized jpeg both deliver through the protected image endpoint and embed correctly in complaint PDFs.
- Concurrent submissions receive unique references. Retried submission does not create duplicate complaints/jobs.
- Refresh/restart preserves records. Cloudinary upload failure does not report success; database failure triggers safe orphan cleanup.
- Single complaint print/PDF shows all fields and picture. Individual complaints fit one PDF page without dropping fields; long text adapts in size. Absent/unavailable picture handled clearly. List reports are landscape tables with repeated headings and complete rows.
- Batch reports export all matched complaints, beyond table pagination, with accurate date boundary behavior.

## Memos

- All eight original fields plus progress retained. Checkbox combinations are tracked without forced approval order.
- Registry submission requires a date; unchecking clears active date but preserves prior value in audit.
- 100% and executed agree; progress below 100 clears executed. Invalid percentages rejected on server.
- Date filters use registry date; undated records appear without a date filter. PDF contains recipient and execution indicators.

## Cashbook

- Start is 2026-10-15, opening 0. Earlier transactions rejected through UI and direct API.
- Income NGN 1000.10 then expenditure NGN 250.05 yields NGN 750.05 exactly.
- Backdated income NGN 100.00 recalculates closing to NGN 850.05 and later row balances.
- Voiding the expenditure changes closing to NGN 1100.10, preserves void reason/actor and excludes it from totals.
- Date-range opening includes preceding entries; Income/Expenses/search filters do not alter true running/closing balances.
- Stable same-day ordering; negative balances visible; future entries don't silently affect a summary labelled today.
- Concurrent entries, duplicate retry protection, cent precision, overflow limits and PDF export correctness checked.

## Push

- Explicit consent required; denied/unsupported states work. Multiple device subscriptions persist and unregister correctly.
- New saved complaint/reminder creates a durable job; provider failure does not fail a successful complaint submission.
- Worker retries transient errors, removes expired endpoints and survives restart.
- Real notification received on supported authorized device, without personal complaint data; click goes to protected record.
- User switching/logout cannot retain another user's notification subscription; server validates endpoint destinations.
- Verify worker/service-worker behavior on the actual public HTTPS deployment or mark it blocked.

## Layout, PDFs and delivery

- Desktop/mobile widths, keyboard navigation, visible field errors, no accidental horizontal clipping.
- All three report types: empty results, one row, multi-page results, long strings, naira glyph and all filters.
- Inclusive Lagos date boundaries, reversed-date validation and pagination-independent totals checked.
- Production build and type checks pass. Integration checks use an isolated test database; no production records destroyed.
- Logs/source/client bundles contain no credentials, passwords or sensitive notification content.
- Public entry and complaint pages work without a session; staff records remain protected. Deployed HTML contains noindex/nofollow metadata and pages, PDFs and image responses carry X-Robots-Tag. Crawlers are not blocked from reading noindex. Missing provider configuration clearly reported.
