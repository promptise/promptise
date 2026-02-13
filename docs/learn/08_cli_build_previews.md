# CLI Build Previews

Generate preview files from registry fixtures.

## Command

```bash
promptise build [compositionId] [options]
```

## Options

- `-f, --fixture <name>`: build one fixture
- `-o, --outdir <path>`: output directory
- `-c, --config <path>`: config path
- `--no-metadata`: write prompt content without header
- `--no-clean`: keep stale files in output directory
- `-v, --verbose`: verbose logs

## Default Behavior

- Generates one `.txt` file per composition/fixture pair
- If a composition has no fixtures, generates `placeholder`
- Cleans stale preview files before build (unless `--no-clean`)

## Output Naming

```txt
{compositionId}_{fixtureName}.txt
```

## Metadata Behavior

- `complete`: includes estimated token/cost metadata block
- `partial`: no estimated token/cost block
- `placeholder`: no estimated token/cost block

## Status Warnings

- `partial`: warns missing required fields
- `placeholder`: warns no fields were provided
