# Contributing to lumen-cli

## Branch workflow (summary)

Full human guide: [`docs/BRANCHING.md`](./docs/BRANCHING.md) · Formal decision: [`docs/adr/0002-branching-strategy.md`](./docs/adr/0002-branching-strategy.md)

```
feat/*  --PR-->  develop  --checkout-->  release/v1.0.0-*  --PR-->  develop  --PR-->  main
```

- `main` — stable (`latest` on npm after `v1.0.0`), tags `v*`. Only via PR from `develop` or `hotfix/*`.
- `develop` — integration for `v1` (4 devs). All `feat/*` land here. Same model as `create-lumen` `develop` (`v2.0.0` train).
- `release/*` — frozen snapshot for a version (bump `package.json` + `CHANGELOG.md`, only critical `fix/*`).
- `feat/*` / `fix/*` — ephemeral, cut from `develop`, PR to `develop`.

See `docs/BRANCHING.md` for step-by-step commands, cross-repo M1-M5 coordination with `create-lumen`, SemVer rules, and checklists.

## Commit convention

Conventional Commits: `feat:`, `fix:`, `chore(release):`, `docs:`, `ci:`, `test:`, `refactor:`.

## Before opening a PR

```bash
git checkout develop && git pull --rebase origin develop
npm test  # when available (M1 #1)
npx eslint .  # when available
```

CI gates: `ESLint` on `push` to `main`/`develop`/`release/**`/`hotfix/**` and `PR` to `main`/`develop` (`.github/workflows/eslint.yml`), publish on `push` to `main` + `tags v*` (`.github/workflows/publish.yml` with OIDC + dist-tags).

## Release process (release manager only)

1. Cut `release/v1.0.0-alpha` from `develop`, bump `package.json` (`npm version 1.0.0-alpha --no-git-tag-version`) and `CHANGELOG.md`.
2. Freeze — only `fix/* -> release/*`.
3. When green: PR `release/* -> develop`, tag `v1.0.0-alpha`, `publish.yml` does `npm publish --tag alpha` + GitHub prerelease.
4. Stable `v1.0.0` (M5): PR `develop -> main`, tag `v1.0.0`, `npm publish` (`latest`). Paired with `create-lumen` `v2.0.0`.

## References

- Roadmap & versioning: `docs/ROADMAP.md`, `docs/PLAN.md`
- create-lumen counterpart: `LUMEN-SH/create-lumen` ADR 0002 / BRANCHING.md
