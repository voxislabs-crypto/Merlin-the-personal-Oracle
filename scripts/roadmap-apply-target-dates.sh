#!/usr/bin/env bash

set -euo pipefail

REPO="voxislabs-crypto/Merlin-the-personal-Oracle"
ROADMAP_START_DATE="${ROADMAP_START_DATE:-2026-05-26}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required but not found."
  exit 1
fi

for ISSUE in {18..27}; do
  WEEK=$((ISSUE - 17))
  START=$(date -u -d "$ROADMAP_START_DATE +$(( (WEEK - 1) * 7 )) days" +%Y-%m-%d)
  END=$(date -u -d "$ROADMAP_START_DATE +$(( WEEK * 7 - 1 )) days" +%Y-%m-%d)

  BODY=$(gh issue view "$ISSUE" -R "$REPO" --json body --jq .body)

  if [[ "$BODY" == *"## Target Window"* ]]; then
    BODY=$(printf "%s" "$BODY" | awk -v start="$START" -v end="$END" '
      BEGIN { in_target=0 }
      /^## Target Window$/ { print; getline; print "- " start " to " end; in_target=1; next }
      /^## / && in_target==1 { in_target=0 }
      { if (in_target==0) print }
    ')
  else
    BODY+=$'\n\n## Target Window\n'
    BODY+="- $START to $END"
    BODY+=$'\n'
  fi

  printf "%s" "$BODY" > "/tmp/issue-${ISSUE}-target.md"
  gh issue edit "$ISSUE" -R "$REPO" --body-file "/tmp/issue-${ISSUE}-target.md" >/dev/null
  echo "Updated #$ISSUE target window: $START to $END"
done

echo "All milestone target windows updated."
