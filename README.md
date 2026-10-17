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

## Documentation & Roadmap

- [ROADMAP.md](./ROADMAP.md) — Milestone breakdown (M1–M5)
- [PLAN.md](./docs/PLAN.md) — Visual architecture diagrams
- [BRANCHING.md](./docs/BRANCHING.md) — Git workflow and release guide
- [CHANGELOG.md](./CHANGELOG.md) — Release notes
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contribution guidelines

## License

[GNU General Public License v3.0 (GPL-3.0)](./LICENSE)
