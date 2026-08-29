#!/usr/bin/env bash
# 編集された .ts/.tsx を整形し、マイグレーションを触ったら型の再生成を促す
set -uo pipefail

export PATH="$HOME/.local/share/mise/shims:$PATH"
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

payload=$(cat)
file=$(printf '%s' "$payload" | /usr/bin/python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    print('')
    sys.exit(0)
print(d.get('tool_input', {}).get('file_path') or d.get('tool_response', {}).get('filePath') or '')
" 2>/dev/null)

[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

case "$file" in
  */supabase/migrations/*.sql)
    printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"マイグレーションを変更しました。bun run db:migrate でリモートに適用し src/lib/database.types.ts を再生成してから、生成された型を使ってください。"}}'
    exit 0
    ;;
  *.ts | *.tsx)
    bunx --bun prettier --write "$file" >/dev/null 2>&1
    bunx --bun oxlint --fix "$file" >/dev/null 2>&1
    ;;
esac

exit 0
