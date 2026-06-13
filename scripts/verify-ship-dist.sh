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

enterprise_paths="$(find "$DIST" -path "*enterprise*" -print)"
if [ -n "$enterprise_paths" ]; then
    echo "$enterprise_paths" >&2
    fail "enterprise paths remain under packages/server/dist"
fi

identity_paths="$(find "$DIST" -maxdepth 1 -name "IdentityManager.*" -print)"
if [ -n "$identity_paths" ]; then
    echo "$identity_paths" >&2
    fail "IdentityManager dist artifacts remain"
fi

runtime_hits="$(grep -RIlE "src/enterprise|/enterprise/" "$DIST" --include="*.js" || true)"
bad_runtime_hits=()
while IFS= read -r hit; do
    [ -z "$hit" ] && continue
    rel="$(relative_to_root "$hit")"
    case "$rel" in
        packages/server/dist/iam/boot.js | \
        packages/server/dist/iam/entities.js | \
        packages/server/dist/iam/identity.js | \
        packages/server/dist/iam/middleware.js | \
        packages/server/dist/iam/query.js | \
        packages/server/dist/iam/routes.js | \
        packages/server/dist/iam/security.js | \
        packages/server/dist/iam/services.js | \
        packages/server/dist/iam/sso.js)
            ;;
        *)
            bad_runtime_hits+=("$rel")
            ;;
    esac
done <<< "$runtime_hits"

if [ "${#bad_runtime_hits[@]}" -gt 0 ]; then
    printf '%s\n' "${bad_runtime_hits[@]}" >&2
    fail "non-seam JS files reference enterprise paths"
fi

for driver in postgres mysql mariadb sqlite; do
    ship_index="$DIST/database/migrations/$driver/index.ship.js"
    if [ ! -f "$ship_index" ]; then
        fail "missing ship migration index: packages/server/dist/database/migrations/$driver/index.ship.js"
    fi

    if grep -qE "enterprise|AddAuthTables|AddWorkspaceShared|AddWorkspaceIdToCustomTemplate|AddOrganization1727798417345|LinkWorkspaceId|LinkOrganizationId|AddSSOColumns|AddPersonalWorkspace|RefactorEnterpriseDatabase|ExecutionLinkWorkspaceId" "$ship_index"; then
        fail "ship migration index contains enterprise migration residue: packages/server/dist/database/migrations/$driver/index.ship.js"
    fi
done

echo "✅ ship dist verification passed"
