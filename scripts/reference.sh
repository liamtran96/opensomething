#!/usr/bin/env bash
# Usage: scripts/reference.sh [commit]
#
# Puts the reference project in the folder next to the main checkout of this
# repository, at the latest main of the original project or at [commit].
# Set OPENSOMETHING_REFERENCE to use another folder.
set -euo pipefail

upstream_url=https://github.com/milind-soni/OpenMausBot.git
script_dir=$(cd "$(dirname "$0")" && pwd)
git_common_dir=$(git -C "$script_dir" rev-parse --path-format=absolute --git-common-dir)
main_root=$(dirname "$git_common_dir")
dir=${OPENSOMETHING_REFERENCE:-$(dirname "$main_root")/OpenMausBot}

if [ ! -d "$dir/.git" ]; then
  git clone --origin upstream "$upstream_url" "$dir"
fi
if ! git -C "$dir" remote get-url upstream >/dev/null 2>&1; then
  git -C "$dir" remote add upstream "$upstream_url"
fi
if [ -n "$(git -C "$dir" status --porcelain)" ]; then
  echo "error: $dir has local changes; commit or remove them first" >&2
  exit 1
fi

git -C "$dir" fetch upstream main
git -C "$dir" checkout --quiet --detach "${1:-upstream/main}"

echo "reference: $dir"
git -C "$dir" log -1 --format='commit:    %h (%ci) %s'
