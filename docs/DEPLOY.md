# Put Java Forge online for your friends

The repository holds the source code. Cloudflare Workers runs the website and compiler API routes, and Cloudflare D1 holds each learner's progress. GitHub Pages by itself cannot run this application's backend.

After setup, friends only need the website link and their own GitHub account. They do not need Cloudflare accounts, a copy of this repository, or deployment credentials.

## 1. Keep this repository on GitHub

Destination: https://github.com/monishb10/java-forge-web

Use `main` as the default branch. You can keep the repository private; the website is accessible independently. The first push runs checks but deliberately skips deployment until `DEPLOY_ENABLED` is set to `true` below.

## 2. Create the Cloudflare resources

1. Sign in at https://dash.cloudflare.com/ and open **Workers & Pages**.
2. Choose your Workers `workers.dev` subdomain if you have not done so already.
3. This project's Worker name is `java-forge-web`. Its address will be `https://java-forge-web.YOUR-SUBDOMAIN.workers.dev`. Replace `YOUR-SUBDOMAIN` with the subdomain shown in your account; do not paste the example unchanged.
4. Open **Storage & databases → D1 SQL Database** and create a new empty database named `java-forge-progress`. Copy its **Database ID**.
5. Copy your **Cloudflare Account ID** from the dashboard.
6. Create a Cloudflare API token scoped to this account with **Workers Scripts: Edit**, **D1: Edit**, and **Account Settings: Read** permissions. The token is used only by GitHub Actions to migrate and deploy.

Start with a fresh database. No owner progress, previous code, or repository tokens are included in this source repository. All tables are created automatically by the deployment workflow.

## 3. Register GitHub sign-in

Open https://github.com/settings/developers and choose **OAuth Apps → New OAuth App**.

| Field | Value |
| --- | --- |
| Application name | Java Forge |
| Homepage URL | Your exact Cloudflare website URL from step 2 |
| Authorization callback URL | Your website URL followed by `/auth/callback` |

For example, if the site is `https://java-forge-web.example.workers.dev`, the callback must be `https://java-forge-web.example.workers.dev/auth/callback`.

Register the app, copy the **Client ID**, and generate a **Client secret**. Use the exact callback URL, with no wildcard. Sign-in requests profile access only. Each learner connects their own solution repository separately in Settings if they want code saves.

## 4. Add repository variables and secrets

Open the GitHub repository → **Settings → Secrets and variables → Actions**.

Under **Variables → New repository variable**, add:

| Name | Value |
| --- | --- |
| `APP_URL` | Your exact HTTPS website URL, without a path |
| `D1_DATABASE_ID` | The new D1 database's UUID |
| `OAUTH_CLIENT_ID` | GitHub OAuth app Client ID |
| `DEPLOY_ENABLED` | `true`, after adding all the secrets below |

Under **Secrets → New repository secret**, add:

| Name | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | The Cloudflare deployment token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |
| `OAUTH_CLIENT_SECRET` | GitHub OAuth app Client secret |
| `TOKEN_ENCRYPTION_KEY` | A new random 32-byte key encoded as base64 |

Generate the encryption key on your computer with Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Paste the generated value directly into the GitHub secret field. Keep this same key on later deployments: changing it makes previously saved solution-repository tokens unreadable and users will need to reconnect them. Do not put secret values in source files, GitHub issues, screenshots, or this guide.

## 5. Deploy

Open **Actions → Check and deploy Java Forge → Run workflow → main**.

The workflow tests and builds the application, applies both database migrations, adds the Worker secrets, and deploys the Worker. When the two jobs finish successfully, open your `APP_URL` and choose **Continue with GitHub**. Future pushes to `main` deploy automatically.

The workflow uses the `production` GitHub environment. If you add required reviewers to that environment, GitHub waits for your approval before deploying.

## 6. Check two separate accounts, then share the link

1. Sign in with your GitHub account and mark a lesson studied.
2. Open a separate browser profile or private window and ask a friend to sign in with their account.
3. The friend's dashboard starts empty. Your lesson completion stays in your own account.
4. Sign out and back in to confirm each account's saved work returns.

Share the deployed website URL, not the repository URL. Friends can start learning immediately after sign-in. Compiler execution asks permission before sending their code/input to Paiza.IO. That external execution service must be available for Run and Submit.

## Optional: save each learner's accepted solutions

Each learner opens **Settings** on the website, chooses their own repository, and connects their own GitHub token. Tokens are encrypted in D1 and are never returned in API responses. One learner's repository connection does not apply to another learner.

A new accepted problem can create a commit in the learner's chosen repository. Identical repeated submissions do not manufacture duplicate commits. GitHub's contribution graph also depends on its author-email, repository, branch, and visibility rules; a saved program file alone does not guarantee a graph square.

## Local development

Use Node.js 24 and the version of pnpm in `package.json`:

```sh
git clone https://github.com/monishb10/java-forge-web.git
cd java-forge-web
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm configure --local
cp .dev.vars.example .dev.vars
```

Create a separate local GitHub OAuth app with homepage `http://127.0.0.1:5173` and callback `http://127.0.0.1:5173/auth/callback`. Fill `.dev.vars` with that app's credentials and a fresh encryption key. Then:

```sh
pnpm db:local
pnpm dev
```

Open `http://127.0.0.1:5173` exactly. There is no mock-login bypass. `.dev.vars`, generated `wrangler.jsonc`, local database files, and build output are ignored by Git.

## Troubleshooting

| What you see | What to check |
| --- | --- |
| Deployment skipped | Set repository variable `DEPLOY_ENABLED` to `true`; use `main` |
| GitHub sign-in not configured | Check all four repository variables and four secrets, then rerun deployment |
| Callback or URL mismatch | `APP_URL`, OAuth Homepage URL, and callback origin must match exactly |
| Database/table error | Check the D1 ID and the migration step in Actions |
| Account changed message | Copy any unsaved code, reload, and sign in with the intended account |
| GitHub solution save unavailable | Check `TOKEN_ENCRYPTION_KEY`; each user connects their repository in Settings |
| Website loads but Run fails | Check Paiza.IO availability and the compiler consent prompt |

## Official setup references

- Cloudflare deployment from GitHub Actions: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- Cloudflare D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- GitHub OAuth app registration: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
- GitHub OAuth state and PKCE: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
