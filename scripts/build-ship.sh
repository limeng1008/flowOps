#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT"

pnpm build

rm -rf packages/server/dist/enterprise
rm -f packages/server/dist/IdentityManager.*
find packages/server/dist -type f \( -name "*.test.js" -o -name "*.test.js.map" -o -name "*.test.d.ts" \) -delete
for driver in postgres mysql mariadb sqlite; do
    rm -f "packages/server/dist/database/migrations/$driver/index.js" \
        "packages/server/dist/database/migrations/$driver/index.js.map" \
        "packages/server/dist/database/migrations/$driver/index.d.ts"
done

scripts/verify-ship-dist.sh

cat <<'EOF'
Ship build completed.

Ship artifact policy:
- Start from this repository after excluding src/enterprise, src/IdentityManager.ts, and .planning.
- packages/server/dist has been pruned of enterprise dist files and IdentityManager artifacts.
- Packaging format is intentionally left to the release pipeline; this script performs build, pruning, and verification only.
EOF
