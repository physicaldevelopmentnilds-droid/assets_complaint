# NILDS Physical Development Division specification

## Identity and scope

National Institute for Legislative and Democratic Studies (NILDS), National Assembly. Responsible division: Physical Development Division. One professional responsive app, three modules, English labels, Nigerian naira, Africa/Lagos dates. Use the user-supplied NILDS emblem and its royal blue, navy, gold, green and restrained red colors in the interface. No invented official logo. No full accounting ledger or electronic approval workflow.

## Roles and access

The only role values are admin and officer. Both access complaints, memos, settings, filtering and those modules' reports. Audit history and user administration are admin-only. Cashbook transactions, balances, reports and APIs require admin status or explicit admin approval through a cashbookAccess permission. Existing officers without that permission have no cashbook access; new officers default to unapproved. Only admins create officers, promote officers, approve/revoke cashbook access, or remove officers. Removal disables the officer account, invalidates sessions and removes push subscriptions while preserving authored records and financial/audit history. Admin accounts cannot be removed through this officer action. No public signup or client-selectable role. The initial account is bootstrapped securely for umarfrq65@gmail.com. Both roles may opt into staff push notifications.

Staff reads, reports, images, updates, and endpoints require authentication. Public access includes the operations entry page, staff sign-in page, complaint form and its submission confirmation. The user has approved public web access with search indexing discouraged: all pages use noindex/nofollow metadata and all responses use an X-Robots-Tag header, including images and PDFs. Do not block crawler access in robots.txt, because crawlers must read noindex instructions. These instructions are not an access control and cannot guarantee that every crawler complies. A whole-site private hosting gate is no longer required.

## Assets Complaint Form

Title: Assets Complaint Form. All original fields required except office number and picture. Conditional Other text required when Other is selected.

| Field | Type |
|---|---|
| Complaint type | Select plus Other text |
| Complaint description | Textarea |
| Submission type | First complaint or Reminder |
| Building section | Select plus Other text |
| Floor | Text |
| Office number | Optional text |
| Name of complainant | Text |
| Department of complainant | Text |
| Designation of complainant | Text |
| Contact number | Phone string |
| Picture, if any | Optional single image |

Complaint types, preserving user wording except the expanded spelling of Kitchenette:

1. Furniture
2. Appliance
3. Structural Defects
4. Facilities (e.g. Toilet, Kitchenette)
5. Electrical Components (e.g. Switch, Light, Socket)
6. Mechanical (A/C, Plumbing)
7. Other

Building sections:

1. Reception Hall
2. Administrative Block
3. Lecture Theatre (Lecture Halls and Open Arena)
4. Library Block
5. Convention Centre
6. Clinic
7. Car Park and Landscape
8. Other

Optional previous complaint reference for reminders. Do not require public lookup or expose another complainant's details. If provided, validate the reference without revealing the matched record.

Server generates a unique reference (for example ASSET-2026-000001), submission timestamp, and handling status Received. Staff may change handling status to In progress or Resolved. Submission type is separate from handling status.

Successful save displays the reference. Failed submission retains form content. Prevent duplicate submissions caused by retries/double clicks with a bounded idempotency mechanism.

Staff records: paginated search, date range, complaint type, building section, submission type, handling status; detail view with all fields and picture. Date filters use submission timestamps in Lagos and inclusive calendar-day boundaries.

Every single complaint must have Print Complaint and Download PDF actions. Include branding, reference, submission date, all original fields, handling status, and the picture when present. Batch/date-range PDF reports also required, with descriptions, location, complainant information, references and status. Individual complaint PDFs and the Print Complaint action use a complete one-page layout, including any picture. Font size adapts to content; exceptionally long legacy values may produce small text. Filtered complaint lists use landscape tables with every field, wrapping and repeating column headings. Avoid leaking public image URLs in logs; use authenticated delivery/private Cloudinary assets where practical for staff-only pictures.

## Cloudinary

No memo/cashbook image uploads. Allow one JPEG, PNG or WebP complaint image up to 5 MiB. Validate file bytes as well as declared type, impose reasonable pixel limits, and reject SVG/arbitrary files. Use server-side upload or bounded signed upload; no Cloudinary API secret or unsigned unrestricted upload preset in client code.

MongoDB stores publicId, asset URL/delivery reference, original filename, format, size and dimensions; not the image bytes. Generate asset identifiers server-side. PDF image fetching must only use application-owned Cloudinary assets, with timeouts and size limits; do not fetch caller-supplied arbitrary URLs. Handle unavailable pictures gracefully in PDF without silently omitting the fact that an image was attached.

## Memo Tracking

| Field | Type/default |
|---|---|
| Memo subject | Required string |
| Drafted by | Required string |
| Recipient | Required string |
| Reviewed | Boolean, false |
| Approved | Boolean, false |
| Submitted to the registry | Boolean, false |
| Date submitted to the registry | Date-only, conditional |
| Project progress | Integer 0–100, default 0 |
| Project executed | Boolean, false |

Completed means project executed, not completed memo processing. The UI label is Project executed. Progress and executed must agree: 100 means true; below 100 means false. Checking executed sets 100. Do not impose approval dependencies on the processing checkboxes.

Registry date required when submitted is true; otherwise null. Unchecking clears the current date, while audit history retains the prior value. Generate unique memo reference and creation/update metadata.

Search subject/drafter/recipient; filters for processing booleans, executed/incomplete, progress range, and registry submission dates. Registry date filtering excludes undated memos; no date filter includes them. PDF reports show all memo fields and selected filters. No document/image attachment feature requested.

## Cashbook

Opening balance exactly 0 kobo, effective date 2026-10-15. Block transactions with earlier business dates server-side and client-side. On dates before commencement, display the start date and zero opening balance; never fabricate entries. Do not invent a ban on future-dated entries; identify their as-of effect clearly.

Fields: transaction date, required description, income/expenditure type, positive amount, optional receipt/voucher reference. Server stores amountKobo as a safe integer, parsing decimal input exactly and rejecting more than two fractional digits. Staff cannot edit a stored balance. Derived running balances use valid, non-voided transactions in chronological order with a stable same-day sequence.

Balance = opening + income - expenditure. Backdated entries recalculate later balances. Negative balances are shown, not silently clamped; no overdraft ban requested.

Incorrect entries are voided with required reason and actor/timestamp; create a replacement instead of rewriting financial history. Voided entries remain inspectable and excluded from financial totals. Opening date/balance are protected server constants in V1, displayed in settings without operational editing.

Filters: inclusive transaction date range, All/Income/Expenses, and search. For a period, opening balance sums valid earlier entries; closing balance uses all entries in the period, irrespective of type/search filters. Each displayed running balance includes hidden transactions. Distinguish filtered subtotals from period ledger totals. Stable ordering is essential.

Reports include date, description, reference, income, expenditure, running balance, opening balance, period totals, closing balance, and visible filter labels. Export all matching rows, not just the table's current page.

## Officer push notifications

Notify opted-in officers/admins of new successfully saved complaints and reminders. Private preview: New asset complaint received or Asset complaint reminder received; reference may be included; omit names, phones, descriptions, images and other personal details. Link to the protected complaint detail view.

Explicit user-triggered Enable notifications button, permission denied/unsupported states, unsubscribe and multi-device support. Persist subscriptions with owning staff user. On logout detach the device subscription from the old session/user to avoid account-switch leaks. Validate endpoint shape and permitted provider destinations to prevent server-side request forgery.

Create a durable outbox job when saving a complaint; use a MongoDB transaction for complaint/audit/outbox consistency when required. An unavailable push provider must not discard the complaint or create duplicates on retry. Worker retries temporary failures with backoff, deletes expired subscriptions on permanent expiry, and prevents uncontrolled repeated delivery. Real delivery requires browser consent, secure deployment, Web Push keys and an available worker. A private hosting access gate may affect service-worker fetches: verify on the target deployment and document any restriction.

## Shared records, reports and UI

Collections: users, sessions if used, assetComplaints, memos, cashbookTransactions, auditLogs, numberSequences, settings, pushSubscriptions, notificationJobs and rate-limit/idempotency records as needed. Use indexes for unique normalized emails/references and common filters; atomic sequence increments; immutable IDs and creation metadata. Audit actions include staff record changes, transaction voids, user creation/promotion, and configuration changes. Public creation has no invented staff actor.

Navigation: Dashboard, Assets Complaints, Memo Tracking, Cashbook, Reports, Settings, and admin-only User management. The root operations entry page links directly to staff sign-in and public asset complaint submission; staff reach the dashboard through sign-in. Professional interface using the supplied emblem's royal blue/navy base with gold, green and restrained red accents; readable form labels, keyboard controls, visible validation, useful empty/loading/error/success states, responsive tables and layouts. Public complaint form is its own direct route and is linked from the entry and sign-in pages. Use meaningful accessible labels; no fake demo data mixed into real records.

Dashboard: complaint counts by handling status, registry submissions, unexecuted projects, and dated cashbook income/expenditure/balance; show the measurement period/as-of date explicitly.

Memo, complaint and cashbook lists remain wide tables on screen, scroll horizontally on narrow screens, and export/print list reports in A4 landscape. Every National Assembly text label uses red.

All PDFs: full organization name, National Assembly, division, report title, selected dates/filters, generated-at date, page numbers, legible Unicode/naira support, safe text wrapping and pagination. Printing and downloads remain protected except the public success message (no full record retrieval).

Public hosting is authorized with the indexing controls above and protected staff operations. Do not declare readiness until real persistence, staff access, Cloudinary and notification behaviors have been checked or specifically marked unverified.

Individual complaint presentation: a branded document card with grouped submission/location/complainant information, clear handling status, highlighted description and a compact picture. One-page PDF and Print Complaint share the same complete document. Reduce description font size before shrinking other fields when content is unusually long.
