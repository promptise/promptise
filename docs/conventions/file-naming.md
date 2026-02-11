# File Naming Convention

TypeScript file naming pattern for consistency and clarity across the codebase.

## Pattern

```
[feature-name].[type].ts
```

## Single-Word Features

Use **dots** to separate feature name from type.

| Feature    | File Examples                                      |
| ---------- | -------------------------------------------------- |
| component  | `component.factory.ts`, `component.types.ts`       |
| composition| `composition.factory.ts`, `composition.types.ts`   |
| strategy   | `strategy.factory.ts`, `strategy.types.ts`         |
| registry   | `registry.class.ts`, `registry.types.ts`           |

## Multi-Word Features

Use **hyphens** for feature name (compound words), **dots** for type separator.

| Feature            | File Examples                                              |
| ------------------ | ---------------------------------------------------------- |
| composition-pattern| `composition-pattern.factory.ts`                           |
|                    | `composition-pattern.types.ts`                             |
|                    | `composition-pattern.prebuilt.ts`                          |
|                    | `composition-pattern.validator.ts`                         |
| strategy-pattern   | `strategy-pattern.factory.ts`                              |
|                    | `strategy-pattern.types.ts`                                |
|                    | `strategy-pattern.prebuilt.ts`                             |

## Common File Types

| Type        | Purpose                              | Example                              |
| ----------- | ------------------------------------ | ------------------------------------ |
| `.factory`  | Factory functions for creating instances | `component.factory.ts`          |
| `.types`    | Type definitions and interfaces      | `component.types.ts`                 |
| `.class`    | Class implementations                | `registry.class.ts`                  |
| `.validator`| Validation logic                     | `composition-pattern.validator.ts`   |
| `.prebuilt` | Pre-built configurations/patterns    | `composition-pattern.prebuilt.ts`    |

## Test Files

Add `.test` before the `.ts` extension.

```typescript
// Source file
composition-pattern.factory.ts

// Test file
composition-pattern.factory.test.ts
```

## Why This Convention?

### Dots vs Hyphens

- **Dots (.)**: Separate logical parts (feature.type.extension)
- **Hyphens (-)**: Join compound words in feature names

This mirrors how TypeScript uses dots for module structure (`@promptise/core`) and hyphens for package names.

### Benefits

1. **IDE Navigation**: Files group by feature when sorted alphabetically
2. **Clear Context**: File type visible at a glance
3. **Consistency**: Predictable naming across codebase
4. **Scalability**: Pattern scales to any feature complexity

## Examples

### ✅ Correct

```
component.factory.ts
composition-pattern.factory.ts
composition-pattern.validator.test.ts
registry.class.ts
```

### ❌ Incorrect

```
componentFactory.ts         # Don't use camelCase
composition_pattern.ts      # Don't use underscores
compositionpattern.ts       # Missing type separator
pattern.factory.ts          # Too generic (missing context)
```

## Folder Structure

Match file naming with folder organization:

```
packages/core/src/
├── component/
│   ├── component.factory.ts
│   ├── component.types.ts
│   └── optimizer/
│       ├── optimizer.factory.ts
│       └── optimizer.types.ts
├── composition/
│   ├── composition.factory.ts
│   ├── composition.types.ts
│   └── pattern/
│       ├── composition-pattern.factory.ts
│       ├── composition-pattern.types.ts
│       └── composition-pattern.prebuilt.ts
└── strategy/
    ├── strategy.factory.ts
    └── pattern/
        ├── strategy-pattern.factory.ts
        └── strategy-pattern.types.ts
```

## Migration Notes

When renaming files:
1. Update all imports in the same folder
2. Search for cross-folder imports: `from './old-name'`
3. Update `index.ts` re-exports
4. Verify with `npm run build`
