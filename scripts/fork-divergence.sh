#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-${FORK_BASE_REF:-upstream/main}}"
LEDGER_FILE="${FORK_CHANGES_FILE:-FORK-CHANGES.md}"

if ! git rev-parse --verify "${BASE_REF}" >/dev/null 2>&1; then
    echo "Base ref not found: ${BASE_REF}" >&2
    exit 2
fi

if [[ ! -f "${LEDGER_FILE}" ]]; then
    echo "Ledger file not found: ${LEDGER_FILE}" >&2
    exit 2
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT

modified_files="${tmp_dir}/modified.txt"
added_files="${tmp_dir}/added.txt"
registered_files="${tmp_dir}/registered.txt"
missing_files="${tmp_dir}/missing.txt"
stale_files="${tmp_dir}/stale.txt"

git diff --diff-filter=M --name-only "${BASE_REF}...HEAD" | sort -u > "${modified_files}"
git diff --diff-filter=A --name-only "${BASE_REF}...HEAD" | sort -u > "${added_files}"

grep -E '^\|[[:space:]]*`[^`]+`[[:space:]]*\|' "${LEDGER_FILE}" |
    sed -E 's/^\|[[:space:]]*`([^`]+)`.*/\1/' |
    sort -u > "${registered_files}" || true

comm -23 "${modified_files}" "${registered_files}" > "${missing_files}"
comm -13 "${modified_files}" "${registered_files}" > "${stale_files}"

modified_count="$(wc -l < "${modified_files}" | tr -d ' ')"
added_count="$(wc -l < "${added_files}" | tr -d ' ')"
registered_count="$(wc -l < "${registered_files}" | tr -d ' ')"
missing_count="$(wc -l < "${missing_files}" | tr -d ' ')"
stale_count="$(wc -l < "${stale_files}" | tr -d ' ')"

echo "Base ref: ${BASE_REF}"
echo "Modified existing files: ${modified_count}"
echo "Added files: ${added_count}"
echo "Registered modified files: ${registered_count}"

if [[ "${stale_count}" != "0" ]]; then
    echo
    echo "Registered paths not currently modified relative to ${BASE_REF}:"
    sed 's/^/  - /' "${stale_files}"
fi

if [[ "${missing_count}" != "0" ]]; then
    echo
    echo "Unregistered modified files:"
    sed 's/^/  - /' "${missing_files}"
    echo
    echo "Register these files in ${LEDGER_FILE} or remove the unintended modifications." >&2
    exit 1
fi

echo "Fork divergence ledger check passed."
