# Lead per-story smoke — Story 3.4 (Invite-Me form — accessible, resilient)

Date: 2026-06-07 · Method: api (native form-POST resilience path, real Hono + Postgres) + browser (chrome-devtools render + a11y tree) · Result: **PASS** · iterations: 1 · defects caught by smoke: 0
Screenshot: `story-3.4-invite-form.png` (rendered `/invite/` form)

The headline is JS-off resilience + an accessible form. Exercised the native form-encoded POST against the real api + real Postgres, and inspected the rendered form's accessibility tree live in Chrome.

## AC2 — JS-off resilience (the headline guarantee)
A native browser form post is `application/x-www-form-urlencoded`. Issued exactly that against the real `node dist/index.js` (RESEND unset):
- → **HTTP 303 See Other**, `Location: /invite/thanks/` (the content-negotiation path; the browser would follow it to the static confirmation).
- `web/dist/invite/thanks/index.html` **exists** (a real static page, 0 JS) — JS-off the visitor lands on a server-rendered confirmation.
- The inquiry **persisted**: `inquiries` row `JS Off Tester · attribution=referral · source=form · status=new · mail_status=skipped`. The inquiry is captured with NO JavaScript — the resilience guarantee holds.

## AC1 — accessible form, rendered live (chrome-devtools a11y tree)
The `/invite/` page renders a real `<form>` ("Speaking and collaboration inquiry") with:
- Persistent visible labels on every field; **required fields marked in TEXT** "(required)" (not asterisk/color): Your name, Your email, Message — required; Organisation, Topic — optional.
- The attribution field is a labeled `<select>` "How did you hear about Joshua? (required)" with a concrete option set (Search · YouTube · A talk · A referral · GitHub · LinkedIn · Other) — the FR-31 structured attribution.
- A "Send inquiry" button. The form is in the SSR HTML (the JS-off baseline).

## a11y correctness (investigated a potential premature-invalid concern — confirmed clean)
The a11y tree showed `invalid="true"` on the attribution combobox at load. Investigated: the `aria-invalid` ATTRIBUTE is `null` on the select AND on name/email (no premature aria-invalid before submit); the `invalid` state is only the NATIVE constraint-validation of a `required` empty `<select>` (normal HTML5, harmless, not announced as an error). No error summary is present pre-submit. **Not a defect.**

## The code-review MED fix verified live (noValidate gating)
The hydrated form has `novalidate` PRESENT (the island owns validation JS-on) while the SSR'd form has NO `novalidate` (native validation works JS-off) — i.e. `noValidate={hydrated}`. The CR's fix (which restored JS-off native validation) is confirmed working in the live DOM.

## AC4/AC5 — JS-on island path
JSON POST (the island's fetch path) → **201** receipt `{ id, mailStatus:"skipped", message:"Thank you. We will review your inquiry and be in touch." }` — no exclamation (the Story-3.3 voice fix held). The JS-on success/failure state machine (aria-live success, role=alert preserve-values failure) is covered by the green e2e (QA's harness, 200 passed / 0 skipped; CR-validated).

## AC6 — first React island; non-island routes 0-JS
`/invite/` references the React island ×3; EVERY non-island route (home, /about, /speaking, /glass-box, /timeline, /work/loandemo, /faq, /browse, **/invite/thanks/**) references 0 React chunks + 0 executable script-src. Deferred `[1.2]`/retro-A4 (unreferenced React chunk) resolved — the chunk is now legitimately used by the island.

## Cleanup / floor
All smoke rows deleted (`inquiries` count = 0). Literal `pnpm test:all` is green on the post-CR-fix tree (EXIT 0; 200 e2e / 0 skipped incl. the JS-off resilience test; axe AA 0 on /invite/ + /invite/thanks/; byte-deterministic). `api/.env` gitignored, never staged.

## Verdict
The resilience headline (JS-off native POST → persisted row → /invite/thanks/) works against the real api + DB; the form is accessible by construction; the first React island is correctly isolated. PASS — clear to commit.
