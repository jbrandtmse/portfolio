# Sample Project — Overview

This is a **test fixture** for the Story 2.6 mechanism-validation test.

It represents a minimal curated artifact for a hypothetical new project being
imported via the Project Import path (`docs/project-import.md`).

## Purpose

This file exists only to give `scripts/project-import.test.ts` a real, committed
file to point a sample `GlassboxEntry` at — so the mechanism test can exercise
the real `renderGlassbox()` function without polluting the live
`content/glassbox.allowlist.ts` with a fake project entry.

Do NOT add this path to `GLASSBOX_ALLOWLIST`. It is a test fixture, not a
publishable artifact.
