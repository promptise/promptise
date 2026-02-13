# CLI Cost Estimation

Cost estimation in previews is based on registry pricing and estimated token counts.

## Pricing Source

The CLI resolves pricing in this order:

1. `CompositionEntry.cost`
2. `PromptiseConfig.defaultCost`
3. no pricing (estimated-token fallback)

## Metadata Block

For `complete` fixtures with pricing, previews include:

```txt
Estimated Input Cost:
  Input Pricing: $5.00 / 1M tokens ($0.000005/token)
  Static: 35 tokens / $0.000175
  Dynamic: 33 tokens / $0.000165
  Total: 68 tokens / $0.000340
```

For `complete` fixtures without pricing, previews include:

```txt
Estimated Tokens: <count>
```

For `partial` and `placeholder`, this block is omitted.

## Static vs Dynamic

- `Static`: token estimate from structure/template baseline
- `Dynamic`: token estimate from fixture data
- `Total`: `Static + Dynamic`

## Scope

This is preview-time estimation for development workflows.
