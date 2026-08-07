---
name: openrtl-release
description: Manage OpenRTL releases: versioning, milestones, snapshots/baselines, freeze, release candidates, hotfix/LTS planning, and the release review gate.
---

# OpenRTL — Release Management

## Model
- Version numbering (semver or custom), milestones, snapshots (git tags), baselines, freeze, candidates, hotfix, maintenance, LTS.

## Procedure
1. Create the release plan in `docs/34-release/release-plan.md`.
2. Cut the snapshot/baseline and freeze changes.
3. Run the release review gate (blocking findings resolved/waived).
4. Publish release notes and archive the release.
