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

## Documentation & Roadmap

- [ROADMAP.md](./ROADMAP.md) — Milestone breakdown (M1–M5)
- [PLAN.md](./docs/PLAN.md) — Visual architecture diagrams
- [BRANCHING.md](./docs/BRANCHING.md) — Git workflow and release guide
- [CHANGELOG.md](./CHANGELOG.md) — Release notes
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contribution guidelines

## License

[GNU General Public License v3.0 (GPL-3.0)](./LICENSE)
