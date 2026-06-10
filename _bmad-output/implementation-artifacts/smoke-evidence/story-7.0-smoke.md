# Story 7.0 — Lead per-story smoke (live `/api/guide` latency proof)

**Date:** 2026-06-09 · **Method:** api (real HTTP SSE against the live production server) · **Result: PASS** · **iterations:** 1 · **defects_caught:** 0

## What this smoke proves

Story 7.0's headline deferred item is `[deploy · MED · NFR-4]` — at the Epic-5 deploy smoke the live `/api/guide` conversational answer consistently hit the abort ceiling (gpt-5-mini ~16.5s streaming > the 15s ceiling) → `FALLBACK_DEGRADED` ("I'm unable to answer right now…"). The model-switch arm of the fix (`223eef6`: default → `claude-haiku-4-5-20251001`) had landed but was never re-proven fresh on the live runtime. This smoke does exactly that.

## Method

`POST https://joshuabrandt.abacusai.cloud/api/guide` (live VM, `portfolio-api` systemd unit active), body `{"query":"What is the loandemo flagship project about?"}` — a grounded query against the build-time KB. Streamed the SSE response, measured time-to-first-token (TTFT) and total stream time, assembled the answer, and asserted it is a real grounded answer (not the fallback error event).

## Result (captured)

| Metric | Value | NFR-4 target | Verdict |
| --- | --- | --- | --- |
| HTTP / content-type | `200` / `text/event-stream` | — | ✅ |
| **TTFT** | **1402 ms** | < ~1.5s | ✅ under target |
| **Total stream time** | **2841 ms** (~2.8s) | hard ceiling ~15s | ✅ well under |
| Token events | 8 | > 0 | ✅ |
| Answer length | 822 chars | real answer | ✅ |
| Citations | 3 — LoanDemo case study (`/work/loandemo/`), About Joshua (`/about/`), FAQ (`/faq/`) | grounded | ✅ |
| `error` events | `[]` (none) | none | ✅ |
| **`is_FALLBACK_DEGRADED`** | **false** | must be false | ✅ degradation gone |
| `done` event | received | — | ✅ |

**Answer preview (verbatim, first 400 chars):**
> loandemo is a real, end-to-end agentic-engineering case study — a live loan origination application that Joshua R. Brandt, MSE built to answer a single structural question: can agentic engineering produce production software, not just prototypes [4].
>
> The project applies the BMAD Method to a domain problem that demands correctness: financial data, multi-step state, and real user flows [4]. It exis…

## Conclusion

The live Guide returns a real, grounded, cited answer in ~2.8s end-to-end with TTFT ~1.4s — comfortably inside the (now-reconciled) ~15s ceiling and the < ~1.5s TTFT target. The `FALLBACK_DEGRADED` degradation that was the `[deploy · MED · NFR-4]` item is **resolved on the live runtime**. The Story 7.0 spec↔code reconciliation (NFR-4 "~10s" → "~15s" to match `LLM_CEILING_MS = 15_000`) and the Rule-8 regression test (locking the ceiling value + the fast `GUIDE_LLM_MODEL` default) close the loop so a future silent model/ceiling regression is caught by the gate.

Defects caught by this smoke that the automated tiers missed: 0 (the config/doc reconciliation + regression test were clean through dev/QA/code-review; this smoke is the real-runtime proof of the user-observable outcome).
