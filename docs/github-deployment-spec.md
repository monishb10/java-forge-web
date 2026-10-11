# Java Forge shared deployment

Create a standalone GitHub repository for the existing Java foundation website. Each learner signs in with their own GitHub account and has separate progress, drafts, study history, compiler runs, and optional solution-repository settings. Start with a new empty Cloudflare D1 database; never copy the existing owner's database, secrets, or private Git history.

Keep the current curriculum, editor, tests, and light blue/white interface. Host the dynamic website on Cloudflare Workers, with GitHub Actions deploying source from the main branch. GitHub Pages cannot replace the account/database/compiler backend. Signing in only reads a GitHub profile; saving accepted solutions remains an optional, separate setting for each learner.

Use OAuth state, PKCE, an HttpOnly session cookie, hashed session identifiers, same-origin mutations, and server-verified numeric GitHub IDs. Reject forged identity headers and requests from stale tabs belonging to another account. Do not expose OAuth tokens, repository tokens, or server secrets to client JavaScript.

Provide a sign-in screen, visible account identity, logout, schema migrations, deployment configuration, an automated workflow, and a step-by-step setup guide. Pushing source requires the user's GitHub connection and destination repository. Hosting additionally requires the user's Cloudflare account and GitHub OAuth app configuration.
