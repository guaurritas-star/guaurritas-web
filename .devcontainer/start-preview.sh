#!/usr/bin/env bash
set -Eeuo pipefail

readonly repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly preview_url="http://127.0.0.1:3000"

cd "${repo_root}"

if curl --silent --fail --max-time 2 "${preview_url}" > /dev/null; then
  echo "Guaurritas is already available at ${preview_url}."
  exit 0
fi

rm -f .next/dev/lock
exec npm run dev
