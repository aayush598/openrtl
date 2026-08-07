---
name: openrtl-analytics
description: Generate the OpenRTL analytics report by parsing status.md, tasks, gates, and reviews across phases. Outputs docs/analytics/report.md + JSON covering productivity, coverage, quality, review stats, defect density, technical debt, risk, schedule, cost, power, area, performance.
---

# OpenRTL — Analytics

## Report (docs/analytics/report.md + report.json)
- Phase completion, gate pass rates, review findings, waivers, defect density, technical debt, risk score, schedule delta, cost/power/area/performance vs budget.

## Procedure
1. Scan all `docs/<phase>/status.md`, `gates.md`, and `_reviews/*.md`.
2. Aggregate metrics and write the report.
3. Flag deviations from requirements as risks.
