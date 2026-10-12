# Deployment and operations

This platform has **not been deployed**. The user has approved public access with search indexing discouraged. Complete the checks in `ACCEPTANCE-CHECKS.md` with an isolated database before handling real records. Staff operations remain protected by application authentication and authorization.

## Required environment

- For Vercel, select Next.js and Node.js 24.x; Vercel builds and runs the web application as managed functions. For a VM alternative, run `npm run build` and `npm run start` on a persistent Node server. Keep MongoDB, Cloudinary, authentication and PDFs on the Node runtime.
- A MongoDB replica set reachable from the application and worker on TCP 27017. Create a separate database for integration testing; never run destructive tests against operational data. Add each server's actual egress IP to the Atlas project access list.
- Cloudinary cloud name, API key and secret on the server. Complaint images are uploaded as authenticated assets. No Cloudinary secret belongs in a client bundle.
- HTTPS and a compatible browser for Web Push. Generate one VAPID pair with `npm run push:keys`, copy its public and private values to the server, and retain them across releases. Set a valid `VAPID_SUBJECT` mailto address.
- Public HTTPS access for `/`, `/login`, `/complaints/new` and `/sw.js`. Do not require a whole-site hosting login for public complaint submissions. Verify application authorization on staff pages, APIs, images and PDFs.
- Search indexing controls: root metadata emits noindex/nofollow; `next.config.ts` adds `X-Robots-Tag: noindex, nofollow, noimageindex` to all paths. Check the deployed HTML and response headers, including PDFs and images. Do not add a robots.txt crawl disallow that prevents search engines reading noindex. Noindex is a crawler instruction, not a security boundary. If URLs were already indexed, they may remain until recrawled; use search-engine removal tools if necessary.

Use `.env.example` as the environment key list. Set `APP_URL` to the exact external origin for origin checks. Keep the MongoDB URI, Cloudinary secret, VAPID private key, bootstrap password and all credentials in the host's secret store. Never commit `.env.local` or include credentials in logs.

## Provision and run

### Selected host: Vercel

1. Create/import a Vercel project using this repository. Framework: Next.js; root directory: repository root; Node version: 24.x. `vercel.json` uses `npm ci` and the locally proven webpack build command. Keep the default Next.js output directory. No custom start command is needed. Use a private source repository; check Hobby eligibility for personal non-commercial use or use a suitable organization plan.
2. Add `MONGODB_URI`, `MONGODB_DATABASE`, `APP_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in Vercel Environment Variables. Leave `MONGODB_DNS_SERVERS` unset unless deployment DNS actually needs an override. Do not upload `.env.local` or store `BOOTSTRAP_ADMIN_PASSWORD` in the deployed app. The administrator already exists in the current operational database; an isolated test database needs its own private bootstrap.
3. Use an isolated test database for testing. Set `APP_URL` to the exact chosen HTTPS production alias, such as `https://YOUR-PROJECT.vercel.app`, before testing submissions/login. If the assigned alias changes, update `APP_URL` and redeploy. Preview deployments need their own matching origin and test database configuration; the production origin does not authorize unrelated preview origins. Changing the public VAPID key also requires a rebuild.
4. Configure Atlas network access for the deployment's actual network path. The development machine's IP allowlist does not cover Vercel. Verify connectivity from the deployed app; do not assume fixed outbound IPs or silently open Atlas to every IP.
5. Verify that the public production alias is reachable without a Vercel login while staff pages, data, images and PDFs require application authentication. Check noindex metadata and X-Robots-Tag headers on the deployed host. `next.config.ts` explicitly includes the PDF Unicode font and logo in API function traces.
6. Run `npm run worker:notifications` separately on a supervised Node.js 24 host with the same database and VAPID values. For temporary testing, run it locally while the computer stays connected. Notification jobs remain pending when no worker runs. Hobby cron runs at most daily and is unsuitable for timely new-complaint notifications; no cron workaround or fake delivery is configured.

Vercel-specific unresolved limits: the current complaint form sends the picture through a function, while Vercel's request/response body limit is 4.5 MB. The agreed 5 MiB image allowance therefore cannot be fully supported by the current transport on Vercel. Testing with small pictures can proceed, but a bounded server-authorized direct-upload flow with image-content verification is required before claiming full upload compatibility. Large PDF responses also need deployed size-limit checks. Do not reduce the agreed image limit silently.

Official references: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [function limits](https://vercel.com/docs/functions/limitations), [file tracing](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions), [cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

### Self-managed server and worker

1. Install from `package-lock.json` with `npm ci`.
2. Set environment values and run `npm run verify:mongo`, `npm run verify:cloudinary`, and `npm run verify:cloudinary:image` from the deployment network.
3. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
4. Supply `BOOTSTRAP_ADMIN_PASSWORD` privately at execution time and run `npm run bootstrap:admin`. It creates `umarfrq65@gmail.com` once and never resets an existing password or role.
5. Run `npm run start` as the web service and `npm run worker:notifications` as a separately supervised long-running process. A scheduler may instead invoke `npm run worker:notifications -- --once` frequently. Both processes need the same MongoDB and VAPID configuration.
6. Schedule `npm run images:cleanup` as a dry run, review the count, then run `npm run images:cleanup -- --delete` during routine maintenance. It considers only authenticated complaint images older than 24 hours and checks MongoDB before deletion.

## Verify before access is shared

- Test unauthenticated direct requests to staff data, image and PDF routes, plus admin-only account actions as an officer.
- Submit a first complaint and reminder, including an optional image. Verify database persistence across restart and authenticated image delivery. Check an orphan image cleanup dry run.
- Verify individual and filtered PDFs for all modules, long text, page numbers, filters and the ₦ glyph.
- Verify memo registry-date and executed/progress behavior; cashbook backdating, voids, filtered balances and future-date handling.
- Enable Web Push with an explicit browser gesture on a supported device, save multiple subscriptions, run the worker, receive a private preview, and confirm notification clicks reach a protected complaint. Verify logout/account switching detaches the old device record.
- Verify public access, indexing directives, service-worker registration and push click-through on the actual HTTPS deployment. Signed-out staff data/image/PDF requests must remain unauthorized.

## Current blocker

From the development machine on 6 October 2026, the Atlas SRV record resolved but all three shard hosts refused TCP port 27017. The public egress IP matched the supplied address and the user confirmed the Atlas access entry and cluster status. Database persistence, staff login, worker delivery and private deployment remain unverified until the network path is fixed.

## Officer access administration

In User management, admins can approve or revoke cashbook access for each officer and remove an officer. Existing officers without explicit approval are denied cashbook access. Removal disables the account and revokes sessions/push subscriptions, preserving historical records; it does not delete authored complaints, memos, transactions or audit entries. Permissions are read from the current user record on each protected request. Verify these actions using an isolated database and existing sessions before operational use.

Keep one local server on each port. Stop a production preview before starting development on the same port. Use `npm run dev` for development; stop `npm run start` before rebuilding its production output.
