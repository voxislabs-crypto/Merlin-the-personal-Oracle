#!/usr/bin/env bash

set -euo pipefail

REPO="voxislabs-crypto/Merlin-the-personal-Oracle"
ROADMAP_START_DATE="${ROADMAP_START_DATE:-2026-05-26}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required but not found."
  exit 1
fi

ALL=$(gh issue list -R "$REPO" --state all --limit 200 --json number,title,state,url)
MILESTONES=$(echo "$ALL" | jq '[.[] | select(.number >= 18 and .number <= 27)] | sort_by(.number)')
TOTAL=$(echo "$MILESTONES" | jq 'length')
DONE=$(echo "$MILESTONES" | jq '[.[] | select(.state == "CLOSED")] | length')
OPEN=$((TOTAL - DONE))

START_EPOCH=$(date -u -d "$ROADMAP_START_DATE" +%s)
NOW_EPOCH=$(date -u +%s)
DAYS_SINCE=$(( (NOW_EPOCH - START_EPOCH) / 86400 ))
if [[ $DAYS_SINCE -lt 0 ]]; then
  CURRENT_WEEK=1
else
  CURRENT_WEEK=$(( DAYS_SINCE / 7 + 1 ))
fi
if [[ $CURRENT_WEEK -gt 10 ]]; then
  CURRENT_WEEK=10
fi

CURRENT_ISSUE=$((17 + CURRENT_WEEK))

echo "Roadmap Standup"
echo "Repo: $REPO"
echo "Progress: $DONE/$TOTAL milestones closed ($OPEN open)"
echo "Current week target: #$CURRENT_ISSUE"

echo
echo "Completed Milestones"
echo "$MILESTONES" | jq -r '.[] | select(.state == "CLOSED") | "- #\(.number) \(.title)\n  \(.url)"'

echo
echo "Next Open Milestones"
echo "$MILESTONES" | jq -r '.[] | select(.state == "OPEN") | "- #\(.number) \(.title)\n  \(.url)"' | head -n 8

echo
echo "Suggested next action: Close or update #$CURRENT_ISSUE at week end."
