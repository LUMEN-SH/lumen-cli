# ADR 0002 — Branching strategy with SemVer: feat -> develop -> release/* -> main

- **Status:** Accepted
- **Date:** 2026-09-18
- **Deciders:** maintainers
- **Supersedes:** —
- **Related:** ROADMAP.md (M1-M5), PLAN.md, ADR 0001 (create-lumen)

## Context

`lumen-cli` is at `v0` (pre-`v1.0.0`). Target `v1.0.0` ships as 5 functional milestones (M1 `v1.0.0-alpha` -> M5 `v1.0.0` stable, ROADMAP.md). It speaks `create-lumen` **v2** manifest only — no `1.x` compat. Work is parallel with `create-lumen` v2 across 4 devs (PLAN.md Parallel-work matrix, lanes C/D/H/I/J/K/L shared with create-lumen).

Previous state: `main`=`develop` divergence pending (`dev` was at `5a90e9e` behind `main` `1ccb8f6`), `release/v1.0.0` was a cut for the final stable, no `hotfix/*` or prerelease dist-tag handling, no CI publish workflow yet (M1 #1 bootstrap pending).

We need a single SemVer topology that:
- keeps `main` always releasable (`latest` on npm after `v1.0.0`),
- allows 4 devs to work in parallel without serializing on one `release/*`,
- supports the `v1` prerelease train with proper npm `dist-tags` (`alpha`, `beta`, `rc`, `next`),
- stays in sync with `create-lumen` v2 train (`create-lumen` `v2.0.0-alpha` unblocks `lumen-cli` M1 #3/#5, PLAN.md Release train),
- is compatible with the future `publish.yml` OIDC flow (same as `create-lumen`).

## Decision

### Topology (identical to create-lumen, ADR 0002 there)

```
feat/*  --PR-->  develop  --checkout-->  release/v1.0.0-*  --PR-->  develop  --PR-->  main
  ^                ^                      ^                         ^
  |                |                      |                         |
from develop  integration v1        freeze + bump            tag v* + publish
(never from                                           (only stable reaches
 release/*)                                            main via develop)
```

| Branch | Role | Lifetime | Who writes |
|--------|------|----------|------------|
| `main` | Stable, `npm@latest` after `v1.0.0`, tags `v*`. | Permanent | Only via PR from `develop` (M5) or `hotfix/*` |
| `develop` | Integration for `v1`. 4 devs merge here continuously. | Permanent | `feat/*`, `fix/*`, `release/*` |
| `release/v1.0.0-alpha`, `...-beta`, `...-rc` | Freeze a version: bump `package.json`, `CHANGELOG.md`, only critical `fix/*`. | Ephemeral (days/weeks) | Cut from `develop`, merged back to `develop` |
| `feat/<scope>-<desc>` | Feature work | Ephemeral | Cut from `develop`, PR to `develop` |
| `hotfix/<version>` | Emergency fix for `main` after `v1.0.0` | Ephemeral | Cut from `main`, PR to `main` + back-merge to `develop` |

Conventional Commits: `feat:`, `fix:`, `chore(release):`, `docs:`, `ci:`.

### SemVer rules

- `patch` (`1.0.1`): `fix/*` only.
- `minor` (`1.1.0`): additive, no CLI/config break.
- `major` (`2.0.0`): CLI surface/config schema break.
- Prereleases: `1.0.0-alpha` (M1), `1.0.0-alpha.2` (M2), `1.0.0-beta` (M3), `1.0.0-beta.2` (M4), `1.0.0` (M5). Published with `alpha`/`beta`/`rc`/`next`, `latest` for stable.

### Cross-repo coordination

- `lumen-cli` `v1.0.0-alpha` (M1) blocked on `create-lumen` `v2.0.0-alpha` (M1) + `create-lumen#9`/`#13` (ROADMAP.md Dependency matrix).
- `lumen-cli` `g ui` (M3) blocked on `create-lumen#33` (shadcn/ui).
- Both repos share the same `develop`/`release/*`/`main` cadence; tags are repo-local (`lumen-cli v1.0.0` != `create-lumen v2.0.0`) but milestones align (PLAN.md Release train).

### CI mapping

- `eslint.yml`: runs on `push` to `main`, `develop`, `release/**`, `hotfix/**` and on `PR` to `main`/`develop` (no-op until M1 #1 adds ESLint).
- `publish.yml`: triggers on `push` to `main` and `tags v*`. Maps `package.json` version to `dist_tag` and publishes with `npm publish --tag <dist_tag>`; creates GitHub Release with `--prerelease` when `stable=false`.

## Consequences

- Same mental model in both repos — 4 devs can switch without relearning.
- `main` stays clean, `develop` is the 4-dev integration point, `release/*` are short freezes.
- `release/*` must be back-merged to `develop` immediately (branch protection).

## Alternatives considered

- `feat -> release/* -> develop -> main`: rejected — serializes 4 devs.
- `feat -> main`: rejected for `v1` train length.
- Keep `dev` name: renamed to `develop` for consistency with `create-lumen` (GH `develop` branch).

## References

- Code: `package.json` (M1 #1), `.github/workflows/publish.yml`, `.github/workflows/eslint.yml`
- Docs: `docs/ROADMAP.md`, `docs/PLAN.md`, `docs/BRANCHING.md`
- Issues: lumen-cli#1-#25, create-lumen#9, #13, #33
