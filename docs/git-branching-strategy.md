# Git Branching Strategy

## Overview

```text
main
 │
 ├── production-cutover-2026-09-17  (annotated tag — rollback reference)
 │
 ├── feature/*
 ├── fix/*
 ├── performance/*
 └── hotfix/*
```

## `main`

- Always production-ready.
- Never commit directly to `main`.
- All changes land via pull request.

## Branch naming

| Type | Prefix | Example |
| --- | --- | --- |
| Feature | `feature/` | `feature/collection-page` |
| Bug fix | `fix/` | `fix/cart-checkout-sync` |
| Performance | `performance/` | `performance/catalog-api` |
| Hotfix | `hotfix/` | `hotfix/payment-webhook` |

## Workflow

```text
main → feature/xxx → PR → main → delete feature/xxx
```

1. Branch from latest `main`:
   ```bash
   git checkout main && git pull origin main
   git checkout -b feature/my-change
   ```
2. Open a PR into `main`.
3. Require tests/builds to pass before merge.
4. Use a normal merge commit (preserve history for auditability).
5. Delete the branch after merge.

## Updating a branch from `main`

```bash
git checkout feature/my-change
git fetch origin
git merge origin/main
```

## Hotfixing production

1. Branch from `main`: `hotfix/description`
2. Fix, test, open PR to `main`.
3. Merge and deploy via existing Vercel projects.
4. Tag if the fix represents a verified production state:
   ```bash
   git tag -a hotfix-YYYY-MM-DD-description <commit> -m "..."
   git push origin hotfix-YYYY-MM-DD-description
   ```

## Production rollback tags

- `production-cutover-2026-09-17` → commit `6a9195e` (verified React/Vite cutover).
- Do not overwrite existing tags.
- Rollback procedure: see `docs/production-cutover.md` in the agent store (Vercel domain reassignment + Next.js project at `melkoraa-phi.vercel.app`).

## PR requirements

- No `.env` files with secrets (only `.env.example`).
- No force-push to `main`.
- Tests pass (`npm test`).
- SPAs build (`frontend/`, `admin/`).
- Backend typechecks (`backend/`).

## Legacy branches (post-migration cleanup)

These migration branches were merged into `main` and deleted:

- `melkoraa_spa`
- `cursor/vercel-handler-fix-efab`
