# Roadmap Tracking Quickstart

This guide gives you a simple way to track roadmap execution without manual GitHub digging.

## Fastest Option

Run this from the repository root:

npm run roadmap:status

It will show:

- epic status for issue 16 and issue 17
- milestone status for week 1 through week 10 (issues 18-27)
- open milestones only (what is still active)

It also shows a current-week marker, so you know which milestone should be in focus.

## Apply Weekly Target Dates Automatically

Run:

npm run roadmap:dates

This updates issue bodies for #18 to #27 with a `Target Window` section.

Default roadmap start date is `2026-05-26`.

To override start date:

ROADMAP_START_DATE=2026-06-02 npm run roadmap:dates

## Standup Summary Command

Run:

npm run roadmap:standup

It prints:

- completed vs remaining milestones
- current week target issue number
- next open milestones to work on

## Weekly Rhythm

Use this checklist once per week:

1. Run npm run roadmap:status
2. Open any issue that should be marked complete
3. Close completed milestone issues
4. Confirm epic checklists are still accurate
5. Add blockers directly in the issue body if a milestone is slipping

## Direct GitHub Commands (Optional)

View roadmap milestones:

gh issue list -R voxislabs-crypto/Merlin-the-personal-Oracle --state open --search "is:issue (#18 OR #19 OR #20 OR #21 OR #22 OR #23 OR #24 OR #25 OR #26 OR #27)"

View both epics:

gh issue list -R voxislabs-crypto/Merlin-the-personal-Oracle --state all --search "is:issue (#16 OR #17)"

## Source Documents

- [docs/VOXIS_COGNITIVE_CLIMATE_ROADMAP.md](docs/VOXIS_COGNITIVE_CLIMATE_ROADMAP.md)
- [docs/VOXIS_MILESTONE_BOARD_2026_Q2_Q3.md](docs/VOXIS_MILESTONE_BOARD_2026_Q2_Q3.md)

## CAFE Gateway Health in Dashboard (Dev)

In non-production mode, open the dashboard and use the diagnostics toggle:

1. Scroll to the dashboard diagnostics section
2. Click Show dashboard event diagnostics
3. Check the CAFE Gateway Health card

Status colors:

- GREEN: endpoint reachable
- RED: probe failed
- YELLOW: configured target without probe result
