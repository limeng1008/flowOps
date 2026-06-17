#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT"

pnpm build

find packages/server/dist -type f \( -name "*.test.js" -o -name "*.test.js.map" -o -name "*.test.d.ts" \) -delete

scripts/verify-ship-dist.sh

cat <<'EOF'
Ship build completed.

Ship artifact policy:
- Start from this repository after excluding .planning.
- packages/server/src no longer contains the removed commercial IAM source or the legacy identity boundary.
- packages/server/dist is verified to have no removed-source artifacts after build.
- Packaging format is intentionally left to the release pipeline; this script performs build, pruning, and verification only.
EOF
