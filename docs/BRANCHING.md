# Branch Workflow — Human Guide

> For 4 devs, `lumen-cli` `v1.0.0` train `alpha -> alpha.2 -> beta -> beta.2 -> stable` (ROADMAP.md M1-M5), parallel to `create-lumen` `v2.0.0`. See ADR 0002 and PLAN.md.

## TL;DR

- **Never** push directly to `main` or `develop`.
- Create `feat/*` from `develop`, open a PR to `develop`.
- `release/*` is only created by the release manager to freeze a version.
- `main` only receives `develop` (at `v1.0.0` stable) or `hotfix/*` (emergency).
- Same flow as `create-lumen` — only the versioning differs (`v1.0.0-*` vs `v2.0.0-*`).

## Graph

```mermaid
flowchart LR
    feat["feat/*<br/>(from develop)"] --> develop["develop<br/>(v1 integration)"]
    develop --> rel["release/v1.0.0-alpha/beta/rc<br/>(freeze + bump)"]
    rel --> develop
    develop --> main["main<br/>(stable, tag v*, npm latest)"]
    hotfix["hotfix/*<br/>(from main)"] --> main
    main -. back-merge .-> develop
```

## Branches

| Branch | Purpose | Who owns it | Lifetime |
|--------|---------|-------------|----------|
| `main` | What users see (`npx lumen`, `npm@latest` after `v1.0.0`). | Only via PR from `develop` or `hotfix/*` | Permanent |
| `develop` | Integration for 4 devs. Always green. | Everyone, via `feat/*`/`release/*` | Permanent |
| `release/v1.0.0-alpha` | Frozen snapshot to stabilize. Bump `package.json` and `CHANGELOG.md`. Only critical `fix` allowed. | Release manager | Days/weeks |
| `feat/g-feature` | Your feature (e.g. `feat/gen-feature`, `feat/python-bridge`). | You | Days, deleted after merge |
| `hotfix/1.0.1` | Emergency on `main` after `v1.0.0`. Created from `main`, merged to `main` then to `develop`. | Fix author | Hours |

## Naming

- `feat/<scope>-<description>` e.g. `feat/cli-bootstrap`, `feat/gen-core`, `feat/g-ui`
- `fix/<description>` e.g. `fix/config-reader`
- `release/v1.0.0-alpha`, `release/v1.0.0-alpha.2`, `release/v1.0.0-beta`, `release/v1.0.0-rc`, `release/v1.0.0`
- `hotfix/<version>` e.g. `hotfix/1.0.1`

Commits: Conventional Commits — `feat:`, `fix:`, `chore(release):`, `docs:`, `ci:`.

## How to work (step by step)

### 1. Start a feature (daily, 4 devs in parallel)

```bash
git checkout develop
git pull origin develop
git checkout -b feat/my-feature
# ... code ...
npm test  # when available (M1 #1)
git add -A && git commit -m "feat: my feature"
git push -u origin feat/my-feature
# Open PR on GitHub: feat/my-feature -> develop, wait for review + green CI
```

> Rule: `feat/*` always branches from `develop`, never from `release/*`. This keeps 4 devs unblocked.

### 2. Cut an alpha/beta/rc (release manager only)

When `develop` reaches a milestone DoD (M1: `npx lumen create my-app` works):

```bash
git checkout develop && git pull
git checkout -b release/v1.0.0-alpha
# bump version
npm version 1.0.0-alpha --no-git-tag-version
# update CHANGELOG.md [Unreleased] -> [1.0.0-alpha]
git commit -am "chore(release): 1.0.0-alpha"
git push -u origin release/v1.0.0-alpha
# Only critical fixes from now on:
git checkout -b fix/tweak release/v1.0.0-alpha -> PR fix/* -> release/*
# When green:
# PR release/v1.0.0-alpha -> develop (merge, keep bump)
# Tag: git tag v1.0.0-alpha && git push origin v1.0.0-alpha
# publish.yml publishes with npm publish --tag alpha and creates GitHub prerelease
```

Dist-tags: `alpha` -> `npm create lumen@alpha` (via `lumen-cli@alpha`), `beta` -> `@beta`, `rc` -> `@rc`, `next` -> generic, `latest` -> stable.

### 3. Stable release `v1.0.0` (M5)

```bash
# develop already has M1-M4
git checkout main && git pull
git merge develop --no-ff -m "chore(release): 1.0.0 stable"
# or PR develop -> main on GitHub
npm version 1.0.0 --no-git-tag-version
git tag v1.0.0 && git push origin main --tags
# publish.yml: npm publish (latest) + GitHub Release
```

### 4. Hotfix (only if `main` has a regression that cannot wait for `develop`)

```bash
git checkout main && git pull
git checkout -b hotfix/1.0.1
# fix
git commit -m "fix: ..."
git push -u origin hotfix/1.0.1
# PR hotfix/1.0.1 -> main (tag v1.0.1), then back-merge:
git checkout develop && git merge main
git push origin develop
```

## SemVer in 30 seconds

- `fix:` -> `1.0.1` (patch)
- `feat:` additive -> `1.1.0` (minor)
- Breaking CLI/config -> `2.0.0` (major)
- `lumen-cli` `v1.0.0` speaks `create-lumen` `v2` manifest only (ROADMAP.md).

## Coordination with create-lumen

| Milestone | create-lumen | lumen-cli | Note |
|-----------|--------------|-----------|------|
| M1 alpha | `v2.0.0-alpha` | `v1.0.0-alpha` | `lumen-cli#3`/`#5` unblocked |
| M2 alpha.2 | `v2.0.0-alpha.2` | `v1.0.0-alpha.2` | Generators |
| M3 beta | shadcn/ui `#33` | `v1.0.0-beta` | `g ui` |
| M5 stable | `v2.0.0` | `v1.0.0` | Both `latest` |

## Checklists

**Before opening a PR to `develop`:**
- [ ] `git pull --rebase origin develop`
- [ ] `npm test` green (when available)
- [ ] `npx eslint .` green (when available)

**Before creating `release/*`:**
- [ ] `develop` green in CI
- [ ] Milestone DoD met (ROADMAP.md)
- [ ] `package.json` and `CHANGELOG.md` bumped

## Do / Don't

- DO: frequent rebases, small PRs, delete `feat/*` after merge.
- DON'T: `feat -> release/*`, `feat -> main`, direct push to `main`/`develop`, two active `release/*` at once, leave `release/*` without back-merge to `develop`.

## References

- ADR 0002: `docs/adr/0002-branching-strategy.md`
- Versioning: `docs/ROADMAP.md`
- Plan: `docs/PLAN.md`
- CI: `.github/workflows/publish.yml`, `.github/workflows/eslint.yml`
