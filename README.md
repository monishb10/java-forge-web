# Java Forge — Java foundations for DSA

A Java learning website for you and your friends, with a separate account and progress for each learner.

- 20 foundation topics, with step-by-step lessons, illustrations and examples.
- 32 coding programs per topic: **640 programs**, each with **64 test cases**.
- A blank Java editor, sample tests, full submission checks and a terminal-style playground.
- Daily/monthly study tracking, easy/medium/hard completion counts and lesson history.
- GitHub sign-in, private per-user drafts, and optional accepted-solution saves to each learner's own repository.

## Put it online

Follow **[the deployment guide](docs/DEPLOY.md)**. Source lives on GitHub; Cloudflare Workers and D1 run the website and save progress. This is a full-stack application, so GitHub Pages alone is not sufficient.

The repository contains no previous learner data, live database, tokens or credentials. A new deployment starts empty. The GitHub Actions workflow verifies every push and deploys `main` after you finish the one-time setup.

## Develop

Use Node.js 24 and pnpm 11.25.0. The deployment guide covers local OAuth setup. After installing dependencies and configuring `.dev.vars`:

```sh
pnpm configure --local
pnpm db:local
pnpm dev
```

```sh
pnpm test
pnpm typecheck
pnpm build
```

The included tests cover OAuth/session boundaries, account isolation, compilation result handling, progress, GitHub saves, timers, and server-rendered lesson/practice content. External provider calls are mocked in automated checks; production sign-in and compilation need live services.

## How accounts work

GitHub OAuth verifies a stable numeric GitHub ID. An HttpOnly cookie identifies a seven-day session; only its hash is stored in the database. Every saved record, topic, run and repository setting belongs to that verified user. Logging in again restores that account's own work, including on another device. An old tab cannot save into a different account after a browser account switch.

GitHub sign-in requests profile access only. Optional solution-repository tokens are stored separately, encrypted with AES-GCM. A website's database administrator can access its stored data; account separation protects learners from other learners, not from the hosting owner.

Java execution uses Paiza.IO after the learner grants consent. Third-party availability and limits can affect execution. A saved GitHub commit does not automatically guarantee a contribution-graph entry; GitHub applies its own attribution rules.

## Main source areas

| Area | Location |
| --- | --- |
| Sign-in/session boundary | `lib/auth.ts`, `build/worker.ts` |
| Dashboard, lessons, editor and tracker | `components/study/` |
| Curriculum and problem bank | `lib/curriculum.json`, `lib/practice-bank.json` |
| Protected API routes | `app/api/` |
| Database migrations | `drizzle/` |
| Deployment workflow | `.github/workflows/deploy.yml` |
| Setup instructions | `docs/DEPLOY.md` |

Lesson photo sources are recorded in `lib/lesson-photos.json` and `public/images/credits.txt`. Existing third-party package and font licenses continue to apply.
