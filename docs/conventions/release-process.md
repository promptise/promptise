# Release Process

Manual release workflow for Promptise monorepo packages.

---

## Versioning Strategy

**Major Version Lock:** Both packages share the same major version, independent minor/patch.

```
✅ core: 1.2.5  ↔  cli: 1.0.3   (Compatible)
❌ core: 2.0.0  ↔  cli: 1.x.x   (Breaking)
```

**When core changes:**
- PATCH/MINOR → Update CLI `devDependencies` to `^X.Y.0`
- MAJOR → CLI must bump to same major + update `peerDependencies`

---

## Release Workflow

1. Create release PR from main
2. Merge to main
3. Create tags, publish npm, create GitHub releases
4. Push tags

---

## Step-by-Step

### 1. Prepare Release Branch

```bash
git checkout main && git pull
git checkout -b release/core-1.1.0
```

### 2. Update Versions

```bash
cd packages/core
npm version minor --no-git-tag-version  # patch | minor | major
cd ../..
```

**If core changed**, update CLI dependencies:
```json
// packages/cli/package.json
"devDependencies": {
  "@promptise/core": "^1.1.0"
}
```

Then: `npm install`

### 3. Update CHANGELOGs

Add release section in `packages/{package}/CHANGELOG.md`:

```markdown
## [1.1.0] - 2026-02-11

### Added
- Feature description

### Changed
- Change description
```

### 4. Commit and Push

```bash
git add packages/core/package.json packages/core/CHANGELOG.md
git add packages/cli/package.json package-lock.json  # if updated
git commit -m "chore(release): @promptise/core@1.1.0"
git push origin release/core-1.1.0
```

### 5. Create PR

```bash
gh pr create --title "chore(release): @promptise/core@1.1.0" \
  --body "Release summary and changes"
```

### 6. Merge PR

Merge via GitHub UI after CI passes.

### 7. Tag Releases

```bash
git checkout main && git pull

# Create tags (use @scope/package@version format)
git tag @promptise/core@1.1.0
git tag @promptise/cli@1.0.0  # if releasing CLI

# Verify
git tag --list
```

**Retroactive tags** (if needed):
```bash
git tag @promptise/core@1.0.0 <commit-hash>
```

### 8. Publish to npm

```bash
# Login (if needed)
npm login

# Publish (use --otp if 2FA enabled)
cd packages/core
npm publish --access public --otp=XXXXXX
cd ../..

cd packages/cli
npm publish --access public --otp=XXXXXX
cd ../..
```

**What runs automatically:**
- `prepublishOnly` → `validate:ci` → build + lint:ci + test

### 9. Create GitHub Releases

**Option A: GitHub CLI**

Create release files in `temp/`:

```bash
# temp/release-core-1.1.0.md
TÍTULO:
Promptise Core v1.1.0

DESCRIPCIÓN:
MINOR release adding [feature description].

📝 **[Changelog: @promptise/core@1.1.0](https://github.com/promptise/promptise/blob/main/packages/core/CHANGELOG.md)**

## Installation
[...]

## What's New
[...]

## Links
- 📦 [npm package](https://www.npmjs.com/package/@promptise/core)
- 📖 [Documentation](https://github.com/promptise/promptise)
```

Then create releases manually via GitHub UI at:
`https://github.com/promptise/promptise/releases/new`

**Option B: Automated (future)**

GitHub Action that triggers on tag push.

**Release naming:**
- Title: `Promptise Core v1.1.0` (readable)
- Tag: `@promptise/core@1.1.0` (technical)
- Changelog link: `Changelog: @promptise/core@1.1.0`

### 10. Push Tags

```bash
git push origin --tags
```

### 11. Verify

- ✅ npm: [@promptise/core](https://www.npmjs.com/package/@promptise/core)
- ✅ npm: [@promptise/cli](https://www.npmjs.com/package/@promptise/cli)
- ✅ GitHub: Tags visible
- ✅ GitHub: Releases published

---

## Release Types

### Patch (1.0.0 → 1.0.1)
Bug fixes, docs, internal refactoring.

### Minor (1.0.0 → 1.1.0)
New features, backward compatible.

### Major (1.0.0 → 2.0.0)
Breaking changes. **Must sync both packages.**

---

## Troubleshooting

**npm auth expired:**
```bash
npm login
```

**Validation fails:**
```bash
npm run validate:ci  # See errors
```

**Wrong version published:**
```bash
npm deprecate @promptise/core@1.1.0 "Use 1.1.1 instead"
# Then publish fix
```

**Rollback before publish:**
```bash
git checkout main
git branch -D release/core-1.1.0
```

---

## Quick Reference

```bash
# Version bump (in package dir)
npm version patch --no-git-tag-version
npm version minor --no-git-tag-version
npm version major --no-git-tag-version

# Create tag (from root)
git tag @promptise/core@1.1.0

# Publish (in package dir)
npm publish --access public --otp=XXXXXX

# Push tags
git push origin --tags

# Check versions
npm view @promptise/core version
git tag --list
```

---

## Monorepo Notes

- **Tags:** Use `@promptise/package@version` format
- **GitHub Releases:** All packages in one chronological list
- **Publishing order:** Core first, then CLI (dependency order)
- **Release PRs:** Better tracking and debugging vs direct commits
