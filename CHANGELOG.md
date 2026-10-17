# Changelog

All notable changes to `lumen-cli` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- **Docs: branch workflow aligned with `create-lumen`** — `develop` canonical, `release/<version>` freeze + tag, back-merge PR to `develop`; prereleases are numbered (`1.0.0-alpha.1`); ROADMAP/PLAN/BRANCHING synced with `create-lumen@2.0.0-alpha.2` (manifest v2.1).

## [1.0.0-alpha.0] — 2026-09-19

### Added

- **Bootstrap** (#1) — ESM package, `lumen` / `lm` bins, commander with `-h/--help` and `-V/--version`, vitest + ESLint, CI (`ci.yml`, `eslint.yml`) and OIDC publish pipeline (`publish.yml`).
