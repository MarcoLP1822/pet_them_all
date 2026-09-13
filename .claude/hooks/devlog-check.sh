#!/bin/bash
INPUT=$(cat)
ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
[ "$ACTIVE" = "true" ] && exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0

TODAY=$(date +%Y-%m-%d)

if ls docs/_posts/${TODAY}-*.md >/dev/null 2>&1; then
  exit 0
fi

if ! git log --since="$TODAY 00:00" --oneline | grep -q .; then
  exit 0
fi

echo "C'e' lavoro committato oggi ma nessun post nel devlog. Se e' un checkpoint reale, scrivi docs/_posts/${TODAY}-titolo-breve.md in italiano e inglese, con la stessa struttura dei post gia' presenti, basandoti su 'git log --since=\"$TODAY 00:00\" --oneline', poi fai commit del post e push su master per pubblicarlo. Se non vale la pena documentarlo, dimmelo e fermati comunque." >&2
exit 2
