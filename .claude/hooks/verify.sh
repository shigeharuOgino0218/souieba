#!/usr/bin/env bash
# 未コミットの変更があるときだけ typecheck と test を走らせ、落ちていれば作業を継続させる
set -uo pipefail

export PATH="$HOME/.local/share/mise/shims:$PATH"
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

payload=$(cat)
active=$(printf '%s' "$payload" | /usr/bin/python3 -c "
import json, sys
try:
    print(str(json.load(sys.stdin).get('stop_hook_active', False)).lower())
except Exception:
    print('true')
" 2>/dev/null)
[ "$active" = "true" ] && exit 0

if git diff --quiet -- src supabase &&
  git diff --cached --quiet -- src supabase &&
  [ -z "$(git ls-files --others --exclude-standard -- src supabase)" ]; then
  exit 0
fi

if ! out=$(bun run typecheck 2>&1); then
  printf '型チェックが通っていません。修正してください。\n%s\n' "$out"
  exit 2
fi

if ! out=$(bun run test 2>&1); then
  printf 'テストが落ちています。修正してください。\n%s\n' "$out"
  exit 2
fi

exit 0
