Build the NILDS Physical Development Division platform in this repository. Read AGENTS.md and every document under docs before implementing. These are the agreed requirements; preserve them.

Use Next.js App Router, TypeScript, MongoDB, and Cloudinary. Build one application containing Assets Complaints, Memo Tracking, and Cashbook. The complaint form needs no application login. Staff authentication has exactly two roles, admin and officer. Officers have operational access to everything except creating officers and promoting an officer to admin. Include individual complaint printing/PDF, filtered reports for all modules, and officer Web Push notifications for new complaints/reminders.

Begin implementing Phase 1 immediately. Inspect any existing project first; in a projectless folder scaffold without overwriting this build pack. Choose stable compatible dependencies from official documentation and preserve the resulting lockfile. Use a professional responsive interface appropriate to NILDS; do not add a marketing landing page.

Complete each phase and its meaningful checks before moving to dependent work. Continue independently through phases that do not need external credentials. If a service is unavailable, implement its integration and provide a precise setup instruction; do not fake successful persistence, upload, notification delivery, or account creation. Keep missing credentials as explicit blockers in docs/BUILD-STATUS.md.

Initial administrator email is umarfrq65@gmail.com. Implement an idempotent secure bootstrap script, with its password supplied privately at execution time. No open registration, default password, or client-selectable role.

Use a zero opening balance effective 15 October 2026 in Africa/Lagos. Use the exact complaint categories/building sections in PRODUCT-SPEC.md. Preserve financial history by voiding instead of deleting. Keep sensitive values and complaint personal information out of logs and notification previews.

Do not publish publicly. A private deployment is authorized only to a compatible environment with verified access protection. If no such environment is available, deliver working local code and report the deployment blocker. At handoff summarize implemented features, validation evidence, required setup, and any remaining limitations.
