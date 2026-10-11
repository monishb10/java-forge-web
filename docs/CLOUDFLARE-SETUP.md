# Finish your Java Forge deployment

Cloudflare resources were created and verified on 11 October 2026.

## Already completed

- Registered `monishb10.workers.dev`.
- Created the `java-forge-web` Worker and enabled its public workers.dev route.
- Created `java-forge-progress` in Cloudflare's APAC region.
- Applied `0000_right_the_leader.sql` and `0001_accounts.sql`, including the migration history used by Wrangler.
- Verified all six application/account tables exist and contain no learner data.
- Connected the Worker to this database through the `DB` binding.
- Set the Worker's `APP_URL`.

Website address: https://java-forge-web.monishb10.workers.dev

**The Worker currently serves a setup message with HTTP 503. The actual learning application and static assets have not been deployed to Cloudflare yet.** The GitHub Actions deployment below replaces the setup Worker with the tested website.

## 1. Register GitHub sign-in

Open https://github.com/settings/applications/new and enter:

| Field | Exact value |
| --- | --- |
| Application name | Java Forge |
| Homepage URL | `https://java-forge-web.monishb10.workers.dev` |
| Authorization callback URL | `https://java-forge-web.monishb10.workers.dev/auth/callback` |

Register the application. Copy its Client ID and generate a Client secret.

## 2. Create your Cloudflare deployment token

Cloudflare's connected app returned Unauthorized for API-token management. Create the deployment token directly in the Cloudflare dashboard:

1. Open your account's API tokens page and choose Create Token.
2. Name it `Java Forge deployment`.
3. Set account permissions: **Workers Scripts: Edit**, **D1: Edit**, **Account Settings: Read**.
4. Scope it to this Cloudflare account.
5. Create it and copy its value directly into the GitHub secret below.

Cloudflare dashboard: https://dash.cloudflare.com/6c3aae116c23183d02afe113bbe447fa

## 3. Add these GitHub Actions settings

Open https://github.com/monishb10/java-forge-web/settings/secrets/actions

Under **Variables**, add these exact names individually:

| Name | Value |
| --- | --- |
| `APP_URL` | `https://java-forge-web.monishb10.workers.dev` |
| `D1_DATABASE_ID` | `1c25393f-2f5c-415e-ae7b-6c37519513c0` |
| `OAUTH_CLIENT_ID` | Your GitHub OAuth app Client ID |
| `DEPLOY_ENABLED` | `true`, after the secrets below are added |

Under **Secrets**, add:

| Name | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | `6c3aae116c23183d02afe113bbe447fa` |
| `CLOUDFLARE_API_TOKEN` | Your new Cloudflare deployment token |
| `OAUTH_CLIENT_SECRET` | Your GitHub OAuth app Client secret |
| `TOKEN_ENCRYPTION_KEY` | A new random 32-byte key encoded as base64 |

To generate the encryption key, run this locally with Node.js installed:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Paste the output directly into `TOKEN_ENCRYPTION_KEY`. Keep the same key for later deployments. Do not put tokens, the client secret, or the encryption key into source files, chat, or screenshots.

Account IDs and database IDs identify resources; they are not access tokens.

## 4. Deploy

Open https://github.com/monishb10/java-forge-web/actions

Choose **Check and deploy Java Forge → Run workflow → main → Run workflow**.

The workflow builds the application, checks migrations, installs the Worker secrets, and deploys the website with its static assets. Both **verify** and **deploy** must finish successfully.

Then open https://java-forge-web.monishb10.workers.dev and choose **Continue with GitHub**.

## 5. Verify separate progress

Sign in, complete one lesson, and refresh. Have a friend sign in with their own GitHub account in another browser and confirm their progress starts separately. Sign out and back in to check persistence before sharing widely.

Each learner can separately connect their own solution repository in the website's Settings.

For background and troubleshooting, see [DEPLOY.md](DEPLOY.md).
