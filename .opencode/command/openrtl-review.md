---
description: Run an engineering review for a phase (or all), recording findings and blocking status.
subtask: true
---

Run an OpenRTL engineering review.

1. Load the openrtl-review skill.
2. Determine the review types for the requested phase from its README (or run all reviews).
3. Load docs/_reviews/<type>-review.md and evaluate the phase context files.
4. Record findings with severity (block/non-block), owner, and verifier.
5. Blocking findings block the phase gate until resolved or waived; non-blocking create follow-up tasks.
