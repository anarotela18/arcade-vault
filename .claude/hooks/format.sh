#!/bin/bash
# PostToolUse hook: formatea con Prettier y ESLint --fix el archivo escrito por Claude.
# Solo actúa dentro de este proyecto.

file=$(jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
case "$file" in
  "$root"/node_modules/*|"$root"/.next/*|"$root"/references/*|"$root"/.agents/*|"$root"/.claude/*) exit 0 ;;
  "$root"/*) ;;
  *) exit 0 ;;
esac

cd "$root" || exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.css|*.json|*.md|*.mdx)
    npx --no-install prettier --write "$file" >/dev/null 2>&1
    ;;
esac

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs)
    out=$(npx --no-install eslint --fix "$file" 2>&1)
    if [ $? -ne 0 ]; then
      echo "ESLint encontró errores en $file:" >&2
      echo "$out" >&2
      exit 2
    fi
    ;;
esac

exit 0
