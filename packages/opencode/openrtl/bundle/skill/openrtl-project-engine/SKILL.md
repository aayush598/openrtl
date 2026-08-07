---
name: openrtl-project-engine
description: Manage the OpenRTL project engine: project metadata (openrtl-project.json), templates, tagging, roles/permissions, audit log, and multi-project workspaces.
---

# OpenRTL — Project Engine

## Metadata
- `openrtl-project.json` holds name, description, organization, team roles, permissions, lifecycle preset, tags, properties, dependencies, and the audit log path.

## Operations
- `openrtl project list|create|clone|archive|tag|property|roles`
- Templates scaffold from `packages/openrtl/scaffold/templates/`.
- Audit log is append-only at `docs/00-project/audit.jsonl`.

## Rules
- Project metadata is versioned and reviewed at phase 00.
- Role changes and permissions are audit-logged.
