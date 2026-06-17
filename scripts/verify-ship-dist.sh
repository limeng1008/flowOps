#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/packages/server/dist"

fail() {
    echo "❌ ship dist verification failed: $*" >&2
    exit 1
}

relative_to_root() {
    local path="$1"
    echo "${path#"$ROOT"/}"
}

if [ ! -d "$DIST" ]; then
    fail "packages/server/dist does not exist; run pnpm build first"
fi

removed_source_paths="$(find "$DIST" \( -path "*/enterprise/*" -o -name "IdentityManager.*" \) -print)"
if [ -n "$removed_source_paths" ]; then
    echo "$removed_source_paths" >&2
    fail "removed IAM source artifacts remain under packages/server/dist"
fi

runtime_hits="$(grep -RIlE "src/enterprise|/enterprise/|IdentityManager" "$DIST" --include="*.js" || true)"
if [ -n "$runtime_hits" ]; then
    while IFS= read -r hit; do
        [ -z "$hit" ] && continue
        relative_to_root "$hit"
    done <<< "$runtime_hits" >&2
    fail "dist JS references removed IAM source paths"
fi

for driver in postgres mysql mariadb sqlite; do
    for index_name in index.js index.ship.js; do
        migration_index="$DIST/database/migrations/$driver/$index_name"
        [ -f "$migration_index" ] || continue

        if grep -qE "AddAuthTables|AddWorkspaceShared|AddWorkspaceIdToCustomTemplate|AddOrganization1727798417345|LinkWorkspaceId|LinkOrganizationId|AddSSOColumns|AddPersonalWorkspace|RefactorEnterpriseDatabase|ExecutionLinkWorkspaceId" "$migration_index"; then
            fail "migration index contains removed IAM migration residue: packages/server/dist/database/migrations/$driver/$index_name"
        fi
    done
done

echo "✅ ship dist verification passed"
