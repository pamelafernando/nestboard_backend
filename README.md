#Links to other repos

NestBoard frontend
https://github.com/pamelafernando/nestboard_frontend

Nestboard mobile
https://github.com/pamelafernando/nestboard_mobile

mobile APK
https://github.com/pamelafernando/nestboard_mobile/releases/download/v1.0.0/app-release.apk


# NestBoard API

Backend for **NestBoard**, the co-living booking platform we're building together as the capstone of the Full-Stack Product Engineering bootcamp.

This repo grows session by session. Each Saturday's end-state lands as a commit tagged `session-N`, and the take-home notes PDF for that week (shared in the cohort group) walks through what changed and the homework attached to it.

## Stack

- **Node 22+**: the runtime.
- **Express 5**: HTTP framework.
- **TypeScript**: strict, ESM, `NodeNext` resolution.

More layers join over the next sessions (validation, auth, Postgres, security, file uploads, …); they'll show up in the code and in the corresponding week's notes.

## Running it

> **Full setup, including the database** (Docker or a free cloud Postgres, migrations, seed data): see **[SETUP.md](./SETUP.md)**. From Session 09 onward you'll need a database running before `npm run dev`.

```bash
npm install

npm run dev           # tsx watch, auto-reload on save
npm run build         # tsc, compiles to dist/
npm start             # node dist/server.js
npm run typecheck     # tsc --noEmit
```

By default the server listens on `http://localhost:3001`.

## Layout

```
nestboard-api/
├── package.json
├── tsconfig.json
└── src/
    ├── server.ts     # entry point, binds the app to a port
    ├── app.ts        # buildApp() factory, mounts middleware + routers
    └── routes/       # one router per resource
```

The `server` / `app` split exists so tests can import the app factory without binding a port, and so future entry points (CLI scripts, lambdas, workers) can reuse the same definition.

## Conventions

- **Status codes are deliberate.** 200 / 201 / 204 / 400 / 401 / 403 / 404 / 409 / 422 / 500. Every code is a choice.
- **TypeScript imports end in `.js`** even though source is `.ts`. Node loads what's on disk, the import path matches the _output_ filename.
- **Migrations and history are append-only** once shared. Never edit a committed migration or rewrite history other people might have pulled.

## For students

The README is the orientation map; the take-home notes PDF (per session) is the textbook; the commit history is the journal of how we got here. If anything in the code doesn't match what we did in class, the take-home notes for that session are the source of truth. Open an issue and I'll fix the code.
