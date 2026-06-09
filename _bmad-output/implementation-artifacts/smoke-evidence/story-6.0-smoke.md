# Story 6.0 — Lead per-story smoke evidence

**Date:** 2026-06-08
**Method:** CLI (the real CI gate command `pnpm run lint` = root `eslint .`)
**Deliverable:** the Rule-12 mechanical guard — `react-hooks/exhaustive-deps` + `rules-of-hooks` as ERRORS scoped to `web/src/islands/**`.

## What was exercised

The story's core promise is that **Epic 6's NEW React islands cannot ship the Epic-5 stale-closure bug class**. The dev/QA/CR mutations all targeted *existing* islands; the lead smoke proves the claim on a brand-**new** island, through the actual gate command CI runs.

1. Created a throwaway island `web/src/islands/__smoke60_tmp.tsx` with a `useCallback` that captures `count` but omits it from the dep array — the exact Story-5.2 `currentDepth` stale-closure pattern.
2. Ran `pnpm run lint` (the real gate command).
   - **Result: exit code 1**, with:
     ```
     web/src/islands/__smoke60_tmp.tsx
       10:6  error  React Hook useCallback has a missing dependency: 'count'. Either include it or
                    remove the dependency array. You can also do a functional update
                    'setCount(c => ...)' …  react-hooks/exhaustive-deps
     ✖ 1 problem (1 error, 0 warnings)
     ```
   - The glob `web/src/islands/**/*.{ts,tsx}` caught the new file automatically; the rule fired at `error` severity and blocked the gate.
3. Removed the fixture; re-ran `pnpm run lint` → **exit code 0** (green). No working-tree residue (`git status web/src/islands/` clean).

## Verdict

**PASS.** A developer introducing the Epic-5 stale-closure on any new island is blocked at lint time by the canonical gate — the user-observable outcome the story promises. iterations=1, defects_caught=0 (positive proof; the automated tiers already cover the existing-island case).
