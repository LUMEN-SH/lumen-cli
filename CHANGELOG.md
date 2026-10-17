# Changelog

All notable changes to `lumen-cli` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **`lumen config`** (#4, #36) — `config`, `config get <path>`, `config validate`; `ConfigError` now extends `LumenError`.
- **`lumen create` / `lumen init`** (#5, #37) — delegate to `create-lumen@2` with inherited stdio and signal forwarding.
- **Tooling flags** (#6, #40) — `--linter/--formatter/--language/--styling/--ui` validated against create-lumen enums and sent as an inline manifest.
- **Generator core** (#7, #38) — template engine, name variants, manifest-path targets, `--dry-run`/`--force`, containment checks.
- **Generators** — `g feature` (#8), `g page` (#11), `g service` (#12), `g store` (#13), `g form` (#14).

- **Command framework** (#2, #34) — global flags `-c/--cwd`, `-v/--verbose`, `-j/--json`, `--no-color`; `generate`/`g` command; unknown-command suggestions; `LumenError` and documented exit codes (0/1/2/70).
- **Config reader** (#3, #28, #29, #33) — finds `lumen.config.json` upward, rejects v1 manifests with a migration pointer, normalises manifest v2.1 (`preset`, `validation`, `harness`, `agentDocs`), resolves paths through `create-lumen`; drift gate runs all shared `create-lumen@2.0.0-alpha.2` fixtures.

### Changed

- **Docs: branch workflow aligned with `create-lumen`** — `develop` canonical, `release/<version>` freeze + tag, back-merge PR to `develop`; prereleases are numbered (`1.0.0-alpha.1`); ROADMAP/PLAN/BRANCHING synced with `create-lumen@2.0.0-alpha.2` (manifest v2.1).

## [1.0.0-alpha.0] — 2026-09-19

### Added

- **Bootstrap** (#1) — ESM package, `lumen` / `lm` bins, commander with `-h/--help` and `-V/--version`, vitest + ESLint, CI (`ci.yml`, `eslint.yml`) and OIDC publish pipeline (`publish.yml`).
