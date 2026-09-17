# Roadmap

`lumen-cli` is the day-to-day CLI for Lumen projects. Target:
**`v1.0.0`**. It speaks the `create-lumen` **v2** manifest only — there is
no compatibility with `create-lumen` 1.x.

v1 ships as **5 functional milestones**. Each one closes with an
*observable result*; you never wait for a 90%-assembled CLI to see
something working. They are GitHub milestones on this repo and are
grouped in the *lumen-cli Planning Tool* Project (view **Milestones**).

Visual versions (milestone flow, dependency graph, parallel waves, docs
pipeline) live in [`docs/PLAN.md`](./docs/PLAN.md).

---

## 🧱 M1 · `v1.0.0-alpha` — Core: CLI + config + create/init

> **DoD:** `lumen` installs (ESM/bin), has a command framework with
> help/version, reads `lumen.config.json` v2 (Zod, rejects v1),
> `lumen config` works, and `lumen create` / `lumen init` delegates to
> `create-lumen@^2`. Result: `npx lumen create my-app` scaffolds a
> project.

- [ ] #1 Bootstrap lumen-cli package (ESM, bin, CI, publish)
- [ ] #2 Command framework + per-command help/version
- [ ] #3 Config reader: Zod schema v2 + strict v1 rejection
- [ ] #4 `lumen config` command
- [ ] #5 `lumen create` / `lumen init` delegate to `create-lumen@^2`
- [ ] #6 Forward tooling flags to the scaffolder

## 🏗️ M2 · `v1.0.0-alpha.2` — Generators

> **DoD:** `lumen g feature|page|service|store|form <name>` writes valid
> files into a project that has a v2 manifest.

- [ ] #7 Generator core: template engine + manifest path mapping
- [ ] #8 `lumen g feature <name>`: domain module + barrel
- [ ] #11 `lumen g page <name>`: route scaffold (Vite + Next.js)
- [ ] #12 `lumen g service <name>`: typed CRUD service client
- [ ] #13 `lumen g store <name>`: Zustand/Context scaffold
- [ ] #14 `lumen g form <name>`: React Hook Form + Zod scaffold

## 🎨 M3 · `v1.0.0-beta` — UI registry

> **DoD:** `lumen g ui <name>` resolves from the Lumen Registry with a
> shadcn fallback, and `lumen g ui theme-<name>` applies preset tokens.

- [ ] #9 `lumen g ui <name>`: Lumen Registry + Shadcn fallback resolver
- [ ] #10 `lumen g ui theme-<name>`: preset theme tokens

## 📚 M4 · `v1.0.0-beta.2` — Docs engine

> **DoD:** docs generation works end-to-end (ported `documentador` +
> Python bridge + Gemini): API-key management, TSDoc/JSDoc injection,
> single-language wiki, and `--readme` update.

- [ ] #24 Port the `documentador` analysis base (credit: Moisés Cantillo)
- [ ] #16 Python bridge (`doc_engine.py`) + Gemini SDK
- [ ] #15 API key management (`--set-key` / `--rm-key`)
- [ ] #17 TSDoc/JSDoc injection
- [ ] #18 wiki generation (single language, chosen at setup)
- [ ] #19 `--readme` update of the main README.md
- [ ] #25 Co-located documentation (docs beside the source)

## 🩺 M5 · `v1.0.0` — Doctor, barrels & docs

> **DoD:** `lumen doctor` (AST) and `lumen sync-barrels`, plus README and
> the command reference. `v1.0.0` is usable and documented.

- [ ] #20 `lumen doctor`: import/architecture validation (AST)
- [ ] #21 `lumen sync-barrels`: auto-maintain intermediate `index.ts`
- [ ] #22 Docs: README + command reference

> Tracker: **#23** 🧭 Backlog v1.0.0 (umbrella — no milestone).

---

## 🔗 Dependency matrix

`lc#` = `lumen-cli`, `cl#` = `create-lumen`. "Enables" lists the issues
that cannot start until the row lands.

| Issue | Depends on | Enables |
|-------|------------|---------|
| lc#1  | — | lc#2, lc#3 |
| lc#2  | lc#1 | lc#4, lc#5 |
| lc#3  | lc#1, cl#9, cl#13 | lc#4, lc#5, lc#7, lc#20 |
| lc#4  | lc#2, lc#3 | — |
| lc#5  | lc#2, lc#3, cl M1 | lc#6 |
| lc#6  | lc#5 | — |
| lc#7  | lc#3 | lc#8, #11–#14, #17, #20, #21 |
| lc#8  | lc#7 | — |
| lc#9  | lc#7, cl#33 | lc#10 |
| lc#10 | lc#9 | — |
| lc#11 | lc#7 | — |
| lc#12 | lc#7 | — |
| lc#13 | lc#7 | — |
| lc#14 | lc#7 | — |
| lc#24 | — (external `documentador`) | lc#16 |
| lc#16 | lc#24 | lc#15, #17, #18, #19, #25 |
| lc#15 | lc#16 | — |
| lc#17 | lc#16, lc#7 | — |
| lc#18 | lc#16 | — |
| lc#19 | lc#16 | — |
| lc#25 | lc#16 | — |
| lc#20 | lc#3, lc#7 | — |
| lc#21 | lc#7 | — |
| lc#22 | lc#1–#21 | `v1.0.0` |

Cross-repo: **lc#3** needs `cl#9` + `cl#13`; **lc#5** needs
`create-lumen` M1; **lc#9** needs `cl#33`.

---

## 🧵 Parallel-work matrix

| Lane | Workstream | Issues | Starts after | Parallel with |
|------|------------|--------|--------------|---------------|
| C | lumen-cli skeleton | lc#1, lc#2 | now | A, B, D, G |
| D | docs-engine base (port `documentador`) | lc#24, lc#16 | now | A, B, C, G |
| H | generators | lc#7, lc#8, #11–#14 | after C + `cl#9` | F, I, J, K |
| I | UI registry | lc#9, lc#10 | after H + `cl#33` | F, J, K |
| J | docs engine features | lc#15, #17, #18, #19, #25 | after D | F, H, K |
| K | doctor / barrels | lc#20, lc#21 | after H | F, J |
| L | release & docs | lc#22 | at close | — |

Full cross-project view (lanes A–L, 4 devs) is in
[`docs/PLAN.md`](./docs/PLAN.md).
