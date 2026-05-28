#!/usr/bin/env bash

set -euo pipefail

REPO="voxislabs-crypto/Merlin-the-personal-Oracle"
ROADMAP_START_DATE="${ROADMAP_START_DATE:-2026-05-26}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required but not found."
  exit 1
fi

echo "Roadmap Tracker"
echo "Repo: $REPO"
echo "Roadmap Start: $ROADMAP_START_DATE"

START_EPOCH=$(date -u -d "$ROADMAP_START_DATE" +%s)
NOW_EPOCH=$(date -u +%s)
DAYS_SINCE=$(( (NOW_EPOCH - START_EPOCH) / 86400 ))
if [[ $DAYS_SINCE -lt 0 ]]; then
  CURRENT_WEEK=0
else
  CURRENT_WEEK=$(( DAYS_SINCE / 7 + 1 ))
fi

if [[ $CURRENT_WEEK -gt 10 ]]; then
  CURRENT_WEEK=10
fi

if [[ $CURRENT_WEEK -lt 1 ]]; then
  CURRENT_WEEK=1
fi

CURRENT_ISSUE=$((17 + CURRENT_WEEK))
echo "Current Week: $CURRENT_WEEK (Milestone issue #$CURRENT_ISSUE)"
echo

ALL_ISSUES_JSON=$(gh issue list -R "$REPO" --state all --limit 200 --json number,title,state,url)

echo "Epics"
echo "$ALL_ISSUES_JSON" | \
  jq -r '[.[] | select(.number == 16 or .number == 17)] | sort_by(.number)[] | "- #\(.number) [\(.state)] \(.title)\n  \(.url)"'

echo
echo "Milestones (Week 1-10)"
echo "$ALL_ISSUES_JSON" | \
  jq -r '[.[] | select(.number >= 18 and .number <= 27)] | sort_by(.number)[] | "- #\(.number) [\(.state)] \(.title)\n  \(.url)"'

echo
echo "Open Milestones"
echo "$ALL_ISSUES_JSON" | \
  jq -r '[.[] | select(.state == "OPEN" and (.number >= 18 and .number <= 27))] | sort_by(.number)[] | "- #\(.number) \(.title)\n  \(.url)"'

echo
echo "Done."
