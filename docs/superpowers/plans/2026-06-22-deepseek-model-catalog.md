# DeepSeek Model Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load DeepSeek models from the official API with bundled fallback and allow users to persist a manually entered model ID.

**Architecture:** A focused provider module performs the authenticated server-side request and normalizes the response. The DeepSeek node follows the repository's existing live-list/fallback pattern, while a small pure UI helper makes `AsyncDropdown` preserve free-form values without changing option-only dropdowns.

**Tech Stack:** TypeScript, React, Material UI Autocomplete, Jest, pnpm, Flowise node load methods

---

### Task 1: DeepSeek provider model discovery

**Files:**

-   Create: `packages/components/src/model-providers/deepseek.ts`
-   Test: `packages/components/src/model-providers/deepseek.test.ts`

-   [ ] **Step 1: Write the failing provider tests**

Test that `fetchDeepseekModels('key')` sends a bearer-authenticated GET to `https://api.deepseek.com/models`, filters invalid IDs, and returns normalized provider records. Test that `fetchDeepseekChatModelOptions` deduplicates IDs into `{ label, name }` options and that a non-2xx response throws `DeepSeek model list request failed: <status>`.

-   [ ] **Step 2: Run the provider test and verify RED**

Run: `pnpm --filter flowise-components test -- --runInBand src/model-providers/deepseek.test.ts`

Expected: FAIL because `./deepseek` does not exist.

-   [ ] **Step 3: Implement the provider helper**

Create exports with these signatures:

```ts
export const DEEPSEEK_MODELS_URL = 'https://api.deepseek.com/models'

export interface DeepseekModelInfo {
    id: string
    name: string
    provider: 'deepseek'
}

export async function fetchDeepseekModels(apiKey: string): Promise<DeepseekModelInfo[]>
export async function fetchDeepseekChatModelOptions(apiKey: string): Promise<INodeOptionsValue[]>
```

Use `global.fetch`, bearer authentication, `Content-Type: application/json`, `Array.isArray(data?.data)`, non-empty string filtering, and a `Set` for option deduplication.

-   [ ] **Step 4: Run the provider test and verify GREEN**

Run: `pnpm --filter flowise-components test -- --runInBand src/model-providers/deepseek.test.ts`

Expected: PASS with three provider tests.

### Task 2: DeepSeek node live list and fallback

**Files:**

-   Modify: `packages/components/nodes/chatmodels/Deepseek/Deepseek.ts`
-   Modify: `packages/components/models.json`
-   Create: `packages/components/nodes/chatmodels/Deepseek/Deepseek.test.ts`

-   [ ] **Step 1: Write the failing node tests**

Mock `@langchain/deepseek`, credential utilities, `getModels`, and `fetchDeepseekChatModelOptions`. Assert the model input has `freeSolo: true` and default `deepseek-v4-flash`; live options are used with a selected credential; bundled options are used with no credential, a failed live request, or an empty response; and `init` forwards a manually entered model name unchanged.

-   [ ] **Step 2: Run the node test and verify RED**

Run: `pnpm --filter flowise-components test -- --runInBand nodes/chatmodels/Deepseek/Deepseek.test.ts`

Expected: FAIL because the existing metadata and load method do not implement the specified behavior.

-   [ ] **Step 3: Implement live loading and fallback**

Import `fetchDeepseekChatModelOptions`, change the input metadata to:

```ts
{
    label: 'Model Name',
    name: 'modelName',
    type: 'asyncOptions',
    loadMethod: 'listModels',
    default: 'deepseek-v4-flash',
    freeSolo: true
}
```

Change `listModels` to accept `(nodeData: INodeData, options: ICommonObject)`, use the selected `deepseekApi` credential server-side, return a non-empty live list, and otherwise call `getModels(MODEL_TYPE.CHAT, 'deepseek')`.

-   [ ] **Step 4: Update the bundled catalog**

Place `deepseek-v4-flash` and `deepseek-v4-pro` before the retained `deepseek-chat` and `deepseek-reasoner` entries in the DeepSeek section of `packages/components/models.json`. Do not add unverified pricing values.

-   [ ] **Step 5: Run provider and node tests and verify GREEN**

Run: `pnpm --filter flowise-components test -- --runInBand src/model-providers/deepseek.test.ts nodes/chatmodels/Deepseek/Deepseek.test.ts`

Expected: PASS.

### Task 3: Persist free-form async dropdown values

**Files:**

-   Create: `packages/ui/src/ui-component/dropdown/asyncDropdownUtils.js`
-   Create: `packages/ui/src/ui-component/dropdown/asyncDropdownUtils.test.js`
-   Modify: `packages/ui/src/ui-component/dropdown/AsyncDropdown.jsx`

-   [ ] **Step 1: Write failing pure helper tests**

Define the desired APIs through tests:

```js
resolveAsyncDropdownValue({ options, value, multiple, freeSolo, chooseOptionLabel })
getAsyncDropdownSelectionValue(selection)
```

Assert that known values resolve to their option object, unknown free-solo values remain strings, unknown option-only values become `''`, a string selection is returned unchanged, an option selection returns `.name`, and a cleared selection returns `''`.

-   [ ] **Step 2: Run the UI helper test and verify RED**

Run: `pnpm --filter flowise-ui test -- --runInBand src/ui-component/dropdown/asyncDropdownUtils.test.js`

Expected: FAIL because the helper module does not exist.

-   [ ] **Step 3: Implement the pure helpers**

Move the existing matching behavior into `asyncDropdownUtils.js`, retain the current JSON-array handling for multiple values, and add only the free-solo string fallback and selection normalization.

-   [ ] **Step 4: Wire the helpers into AsyncDropdown**

Import the helpers, replace the component-local matching function, resolve the Autocomplete `value` with `freeSolo`, and use `getAsyncDropdownSelectionValue(selection)` in the single-value `onChange`. Keep multi-select and create-new behavior unchanged.

-   [ ] **Step 5: Run the UI helper test and verify GREEN**

Run: `pnpm --filter flowise-ui test -- --runInBand src/ui-component/dropdown/asyncDropdownUtils.test.js`

Expected: PASS.

### Task 4: Full verification

**Files:**

-   Verify all files above

-   [ ] **Step 1: Run focused tests**

Run: `pnpm --filter flowise-components test -- --runInBand src/model-providers/deepseek.test.ts nodes/chatmodels/Deepseek/Deepseek.test.ts && pnpm --filter flowise-ui test -- --runInBand src/ui-component/dropdown/asyncDropdownUtils.test.js`

Expected: PASS.

-   [ ] **Step 2: Run lint and builds**

Run: `pnpm --filter flowise-components lint && pnpm --filter flowise-components build && pnpm --filter flowise-ui build`

Expected: all commands exit 0.

-   [ ] **Step 3: Verify the local browser workflow**

Start the local development server, open a DeepSeek node, verify that official models load when its credential works, enter a model ID absent from the list, commit it, reopen the node, and verify the custom value remains visible.

-   [ ] **Step 4: Inspect the final diff**

Run: `git diff --check && git status --short && git diff -- packages/components/src/model-providers/deepseek.ts packages/components/nodes/chatmodels/Deepseek/Deepseek.ts packages/components/models.json packages/ui/src/ui-component/dropdown/asyncDropdownUtils.js packages/ui/src/ui-component/dropdown/AsyncDropdown.jsx`

Expected: no whitespace errors and only the planned files plus tests/docs are modified.
