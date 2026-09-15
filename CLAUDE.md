# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform for playing games online and competing for the highest score (see README.md). The codebase is currently a fresh Next.js scaffold with no app-specific code yet (only the default `app/page.tsx`).

This project uses Spec Driven Design via the `/spec` and `/spec-impl` skills from https://github.com/Klerith/fernando-skills (installed with `npx skills@latest add Klerith/fernando-skills`). Prefer that workflow (spec first, then implementation) for new features rather than jumping straight to code.

## Commands

- `npm run dev` — start the dev server (Next.js)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint (flat config in `eslint.config.mjs`, using `eslint-config-next`'s core-web-vitals + typescript rule sets)

There is no test runner configured yet.

## Architecture notes

- Next.js App Router (`app/` directory), TypeScript, Tailwind CSS v4 (via `@tailwindcss/postcss`).
- Path alias `@/*` maps to the repo root (see `tsconfig.json`).
- **Important:** per `AGENTS.md`, this project pins a Next.js version whose APIs/conventions may differ from your training data. Before writing Next.js code, check the docs bundled at `node_modules/next/dist/docs/` (resolve the path from `AGENTS.md`'s location, since in monorepos `next` may not be hoisted to the repo root) and follow any deprecation notices found there.
