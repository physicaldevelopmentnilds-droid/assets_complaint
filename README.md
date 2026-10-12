# NILDS Physical Development Division platform

Platform for the National Institute for Legislative and Democratic Studies, National Assembly. One Next.js App Router application contains Assets Complaints, Memo Tracking, and Cashbook. The complaint submission form needs no application login; staff operations use admin/officer sessions. Public hosting is authorized with search indexing discouraged through noindex metadata and response headers. **Do not use for operational records until the blocked live checks in [BUILD-STATUS.md](docs/BUILD-STATUS.md) pass.** No deployment has been verified.

## Local setup

1. Use Node.js 20.9+ and run `npm ci` (or `npm ci --offline=false` if npm is configured offline).
2. Copy `.env.example` to `.env.local`. Set a MongoDB replica-set URI, database name, `APP_URL`, Cloudinary credentials, and Web Push values. Keep `.env.local` private. If Node cannot resolve the Atlas SRV record through this machine's default DNS server, set `MONGODB_DNS_SERVERS` to a reachable DNS server IP; leave it empty when the default resolver works.
3. Generate Web Push keys once with `npm run push:keys` if the VAPID fields are empty. Keep the same key pair across deployments.
4. Run `npm run verify:mongo`, `npm run verify:cloudinary`, and `npm run verify:cloudinary:image` to check provider access. The image check uploads and removes a synthetic image.
5. Supply `BOOTSTRAP_ADMIN_PASSWORD` privately in the execution environment and run `npm run bootstrap:admin`. The initial email is `umarfrq65@gmail.com`; reruns leave the account unchanged. Remove the password from the environment afterward.
6. Run `npm run dev`. Open `/login` for staff or `/complaints/new` for public submission. Start the separate notification process with `npm run worker:notifications`; use `npm run worker:notifications -- --once` for a scheduler.

Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run verify:pdf`, and `npm run build`. `npm run images:cleanup` previews abandoned complaint images older than 24 hours; `npm run images:cleanup -- --delete` removes only unreferenced candidates after a successful database lookup.

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for hosting, indexing controls and worker operations. Search indexing instructions do not replace staff authentication or prevent public scraping.
