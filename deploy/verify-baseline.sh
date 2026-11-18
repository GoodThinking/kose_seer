#!/usr/bin/env bash
# Verify a tree (git checkout of deploy/baseline, or /opt/kose-seer on the server)
# against deploy/baseline/MANIFEST.tsv: same file set, same sha256.
# Usage: deploy/verify-baseline.sh <root-containing-app-and-client> [manifest]
set -euo pipefail
export LC_ALL=C
root=${1:?root dir}
manifest=$(cd "$(dirname "${2:-$(dirname "$0")/baseline/MANIFEST.tsv}")" && pwd)/$(basename "${2:-MANIFEST.tsv}")
if command -v sha256sum >/dev/null; then sha=(sha256sum); else sha=(shasum -a 256); fi

cd "$root"
actual=$(find app client \( -path app/node_modules -o -path app/data -o -path app/logs -o -path app/src \
  -o -path client/assets -o -path client/node_modules \) -prune -o -type f ! -name '._*' \
  ! -path client/resource-tree.json -print0 | xargs -0 "${sha[@]}" \
  | awk '{h=$1; $1=""; sub(/^ +/, ""); print $0 "\t" h}' | sort)
if diff <(cut -f1,2 "$manifest" | sort) <(printf '%s\n' "$actual"); then
  echo "OK: $(wc -l < "$manifest" | tr -d ' ') files match $manifest"
else
  echo "MISMATCH (< manifest, > $root)" >&2; exit 1
fi
