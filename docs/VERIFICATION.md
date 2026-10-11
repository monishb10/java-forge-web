# Deployment preparation checks — 10 October 2026

Completed locally on Node.js 24:

- 49 OAuth/session and account-isolation checks using in-memory SQLite and mocked GitHub responses.
- 15 deployment-configuration and browser-account checks.
- 58 existing coding API integration checks.
- 34 GitHub solution-save checks; nine simulated commits, no external writes.
- 53 study tracker checks and 19 playground compiler checks.
- Server rendering of all 20 lessons, 80 visual frames, 20 coding workspaces, tracker states, the playground, and the signed-out account screen.
- TypeScript checking, production build, and Wrangler deployment dry run.
- Both D1 migrations applied to a new local database.
- Built Worker HTTP checks: sign-in page and account endpoint load; anonymous and forged-header requests to saved progress return 401; missing OAuth setup returns a clear setup error.
- Independent review found no critical or important authentication/account-isolation defects.

The existing 640-program curriculum was not changed by the account/export work. The source package excludes environment secrets, local databases, prior learner progress, dependency directories, build output, and Git history.

## Still requires the owner's connected accounts

GitHub push, Cloudflare deployment, and live GitHub OAuth have not been verified in a real deployment. Follow `DEPLOY.md`, configure the account-specific variables/secrets, deploy, and check two different GitHub accounts before sharing the website. External GitHub and Paiza.IO operations are mocked in automated tests.

## Small known usability limitation

If a session expires while an editor is already open, a save/run error preserves the code but does not yet offer an inline sign-in button. Open `/auth/github` in a new tab, sign in to the same account, return to the original editor and retry. Copy any unsaved code before switching accounts or reloading. Initial page-load authentication failures do show a Sign in link.
