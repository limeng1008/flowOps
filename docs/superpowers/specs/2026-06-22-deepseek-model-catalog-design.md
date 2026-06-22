# DeepSeek Model Catalog Design

## Goal

Make the DeepSeek chat-model node discover the models available to its selected credential while still allowing a user to enter a model ID that is not present in the returned catalog.

## Behavior

-   The model dropdown calls DeepSeek's OpenAI-compatible `GET /models` endpoint through the existing server-side node load-method route.
-   The selected credential is decrypted only on the server. The browser never receives the API key.
-   Missing credentials, failed requests, malformed responses, and empty live lists fall back to the bundled DeepSeek model list.
-   The bundled list contains the current canonical IDs `deepseek-v4-flash` and `deepseek-v4-pro` and retains `deepseek-chat` and `deepseek-reasoner` for compatibility.
-   New DeepSeek nodes default to `deepseek-v4-flash`. Existing flows keep their saved `modelName` unchanged.
-   The async dropdown accepts a free-form string, preserves it when it is absent from the options, and passes it unchanged to the node.

## Structure

-   `packages/components/src/model-providers/deepseek.ts` owns the DeepSeek models endpoint request and response normalization.
-   `packages/components/nodes/chatmodels/Deepseek/Deepseek.ts` owns credential lookup, live-list selection, bundled fallback, and DeepSeek node metadata.
-   `packages/ui/src/ui-component/dropdown/asyncDropdownUtils.js` owns the pure value-normalization behavior needed by the React dropdown.
-   `packages/ui/src/ui-component/dropdown/AsyncDropdown.jsx` wires those pure helpers into Material UI Autocomplete.

## Failure And Compatibility Rules

-   No model-list failure blocks editing a flow.
-   Duplicate and invalid model IDs from the provider are ignored.
-   A manually entered model is committed as a string and remains visible after the list reloads.
-   Existing non-free-solo async dropdowns retain their current option-only behavior.

## Verification

-   Provider tests cover request authentication, normalization, deduplication, and HTTP failures.
-   Node tests cover live loading, missing-credential fallback, failed-request fallback, free-form metadata, the new default, and unchanged model forwarding.
-   UI helper tests cover custom strings, known options, clears, and non-free-solo behavior.
-   Component and UI tests, lint, TypeScript builds, production build, and a local browser check complete the verification.
