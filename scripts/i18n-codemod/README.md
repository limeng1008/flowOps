# FlowOps i18n Codemod

This codemod helps replay FlowOps UI localization after pulling upstream Flowise changes.

## What It Does

-   Reads `packages/ui/src/i18n/locales/en.json` and `zh.json`.
-   Builds a locale-backed dictionary from English UI copy to translation keys.
-   Replaces matching JSX text and translatable JSX string attributes with `t('key')`.
-   Injects `useTranslation` into the first JSX-returning function when needed.
-   Leaves unknown English copy untouched and reports it for manual localization.

## Common Commands

Dry-run a file or directory:

```bash
node scripts/i18n-codemod/index.js packages/ui/src/views/variables
```

Rewrite matching copy in place:

```bash
node scripts/i18n-codemod/index.js --write packages/ui/src/views/variables
```

Check whether a path still has locale-backed replacements available:

```bash
node scripts/i18n-codemod/index.js --check packages/ui/src/views/variables
```

Run the residual English audit:

```bash
node scripts/i18n-codemod/audit.js --write-report
```

Run the codemod test:

```bash
node scripts/i18n-codemod/codemod.test.js
```

## Upstream Replay Workflow

1. Take the upstream version of the changed UI file.
2. Run the codemod against that file or directory.
3. Add missing English copy to `en.json` and `zh.json` when the audit reports unmatched UI text.
4. Re-run the codemod.
5. Run `pnpm --filter flowise-ui test` and `pnpm --filter flowise-ui build`.

The codemod is intentionally conservative: it only rewrites strings already backed by locale keys.
