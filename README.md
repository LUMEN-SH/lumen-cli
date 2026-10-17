# lumen-cli

> Day-to-day CLI for Lumen projects.

`lumen-cli` provides commands for project initialization, file generators, architectural validation, docs generation, and barrel synchronization.

## Installation

```bash
# Global installation
npm install -g lumen-cli

# Or run directly with npx
npx lumen --help
```

## Command Aliases

The CLI is available as both `lumen` and `lm`:

```bash
lumen --help
lm --help
```

Commands also provide short aliases:

- `generate` alias: `g` (`lumen g` or `lm g`)

## Commands

### `lumen create [name]`

Create a new Lumen project by delegating to `create-lumen`:

```bash
lumen create my-app
lumen create my-app -y
lumen create my-app --template react-ts
lumen create my-app --arch feature-based
lumen create my-app --manifest ./lumen.config.json
lumen create my-app -y --linter oxlint --formatter oxfmt
```

**Options:**
- `-y, --yes` — Quick setup with recommended defaults
- `-m, --manifest <file-or-json>` — Manifest file path or inline JSON
- `-t, --template <preset>` — Template preset (e.g. `react-ts`, `react-js`, `react-type-ts`, etc.)
- `-f, --framework <name>` — Target framework
- `-a, --arch <arch>` / `--architecture <arch>` — Architecture preset (`feature-based`, `type-based`, `none`, `hybrid`)
- `--linter <eslint|oxlint|biome|none>` — Linting tool
- `--formatter <prettier|oxfmt|none>` — Code formatter
- `--language <ts|js>` — Project language
- `--styling <tailwind|none>` — Styling engine
- `--ui <shadcn|none>` — UI component kit (requires `--styling tailwind`)

When tooling flags are supplied, `lumen` builds and validates an inline manifest and passes it to the scaffolder via `--manifest`. If combined with an existing manifest (`-m`), flags take precedence over the base manifest values.

### `lumen init`

Initialize a Lumen project in the current directory (or prompt for name interactively):

```bash
lumen init
lumen init -y
lumen init --template react-ts
lumen init -y --linter oxlint --formatter oxfmt
```

Supports the same options as `lumen create`.

### Global Options

- `-c, --cwd <dir>` — Working directory
- `-v, --verbose` — Enable verbose output
- `-j, --json` — Output in JSON format
- `--no-color` — Disable colored output
- `-V, --version` — Output the version number
- `-h, --help` — Display help for command

## Exit Codes

`lumen-cli` conforms to standard process exit codes:

| Code | Name | Description |
|------|------|-------------|
| `0` | `OK` | Command completed successfully |
| `1` | `USER` | User error (invalid arguments, flags, or unknown command) |
| `2` | `CONFIG` | Configuration error (missing or invalid manifest) |
| `70` | `INTERNAL` | Internal software error |

## Compatibility

`lumen-cli` `v1` reads only the `create-lumen` **v2** manifest (`lumen.config.json`, `manifestVersion: 2`, incl. v2.1 `preset`/`validation`/`harness`). Developed against `create-lumen@2.0.0-alpha.2`; v1.x manifests are rejected.

## Config Reader

The CLI discovers and loads the project's configuration from `lumen.config.json`:

```javascript
import { readConfig, findConfigFile, ConfigError } from 'lumen-cli';
// or from 'src/config/index.js'
```

- `findConfigFile(startDir)`: Walks up directory tree searching for `lumen.config.json`.
- `readConfig({ cwd })`: Locates `lumen.config.json`, parses and validates the manifest against `manifestSchemaV2`, normalizes v2.1 fields (`architecture.preset`, `validation`, `harness.commands`, `agentDocs`), resolves generator paths via `resolvePaths`, and returns `{ manifest, paths, root, file }`.
- Throws `ConfigError` (code `CONFIG`, exitCode `2`) if the config file is missing, invalid JSON, or fails schema validation. Any legacy v1 manifest is rejected with an actionable migration pointer.

## Config Command

Inspect, query, and validate your Lumen configuration via the CLI:

### `lumen config`
Prints a human-readable summary of the resolved configuration, including framework, styling, architecture preset and validation mode, UI kit, tooling, and resolved file generator paths.

```bash
lumen config
```

Pass `-j` or `--json` to output the full `{ file, root, manifest, paths }` payload:

```bash
lumen config --json
```

### `lumen config get <dotted.path>`
Retrieves a specific configuration value using dot notation (e.g. `architecture.preset`, `paths.features`, or `framework`).

```bash
lumen config get architecture.preset
lumen config get paths.features
```

If the key does not exist, the command exits with code `1` and prints a helpful hint. Objects are printed as formatted JSON.

### `lumen config validate`
Validates the local `lumen.config.json` against schema and compatibility rules. Exits with code `0` and prints `OK` on success, or exits with code `2` with an actionable `ConfigError` if invalid or missing.

```bash
lumen config validate
```

## Generators

`lumen-cli` features a flexible code generator engine driven by the project's `lumen.config.json` manifest:

- **Path Mapping**: Generator destinations are resolved dynamically from `manifest.paths` (`paths.features`, `paths.components`, `paths.services`, `paths.hooks`, `paths.pages`, `paths.ui`), respecting architectural presets (`feature-based`, `type-based`, `hybrid`, `none`) without hardcoding paths.
- **Language Detection**: Automatically matches template variants (`.ts`/`.tsx` vs `.js`/`.jsx`) against `tooling.language`.
- **Safe Containment**: All generated targets are strictly checked to resolve within the project root, guarding against path traversal attempts.
- **Dry-Run & JSON**: Supports `--dry-run` to preview file operations without writing to disk, and `--json` for structured automation pipelines.

### `lumen generate form <name>`

Generate a validated React Hook Form component and matching Zod schema (`<Name>Form.tsx` and `<name>.schema.ts`, or JS equivalents):

```bash
lumen g form user-profile
lumen g form login --feature auth
lumen g form checkout --feature billing --service checkout
lumen g form contact --dry-run
```

**Options:**
- `--feature <feature>` — Place form under a feature module (`paths.features/<feature>/components`)
- `--service <service>` — Wire `onSubmit` to a service module import
- `--dry-run` — Preview file creations without writing to disk
- `-f, --force` — Overwrite existing files
- `-j, --json` — Output result as JSON


### `lumen generate feature <name>`

Generates a domain feature module under `paths.features/<name>/` complete with `components/`, `hooks/`, `services/`, `types/`, and a public barrel export (`index.ts` / `index.js`).

```bash
lumen generate feature billing
lumen g feature auth --dry-run
lumen g feature checkout --with-tests
lumen g feature dashboard --force
```

**Options:**
- `--dry-run` — Preview file generation actions without modifying the filesystem
- `--force` — Overwrite existing files instead of skipping
- `--with-tests` — Generate starter `<Name>.test.tsx` / `<Name>.test.jsx` test if project uses `vitest`
- `--with-store` — Hint to generate associated state store (`lumen g store <name>`)
- `--with-service` — Hint to generate associated API service (`lumen g service <name>`)

## Documentation & Roadmap


- [ROADMAP.md](./ROADMAP.md) — Milestone breakdown (M1–M5)
- [PLAN.md](./docs/PLAN.md) — Visual architecture diagrams
- [BRANCHING.md](./docs/BRANCHING.md) — Git workflow and release guide
- [CHANGELOG.md](./CHANGELOG.md) — Release notes
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contribution guidelines

## License

[GNU General Public License v3.0 (GPL-3.0)](./LICENSE)
