/**
 * InviteForm — the Invite-Me React island (Story 3.4, Decision 1/2/4).
 *
 * Renders a REAL <form action="/api/invite" method="POST"> that Astro SSRs into
 * the static HTML — so the complete labeled form is in dist/invite/index.html and
 * works as a native POST with JavaScript disabled (the resilience guarantee).
 *
 * Hydration (client:visible): onSubmit preventDefault → client-side validation
 * (InviteInput.safeParse) → inline aria-invalid/aria-describedby error messages →
 * focus-managed error summary → fetch (Accept: application/json) → aria-live/
 * role="status" success → role="alert" failure (non-destructive, preserves values).
 *
 * Field names MATCH the shared InviteInput contract keys + the honeypot field
 * name `website` (which the server checks). AR-15 single contract.
 *
 * Accessibility (NFR-2 / WCAG 2.1 AA):
 *   - Every field has a persistent visible <label> (never placeholder-as-label).
 *   - Required fields are marked in text ("(required)"), not asterisk/color alone.
 *   - aria-invalid + aria-describedby wired on each field with an error.
 *   - Focus-managed error summary at the top links to each bad field.
 *   - aria-live="polite" role="status" success region.
 *   - role="alert" failure region (non-destructive, preserves values).
 *   - Visible :focus-visible ring on all interactive controls.
 *   - Full keyboard operability.
 *
 * NFR-6: no new Date() / wall-clock in render (byte-deterministic SSR output).
 * NFR-5: no secret reaches the client.
 * Voice: positive-assertion, no hype, no exclamation marks.
 */
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { InviteInput } from '@portfolio/shared/schemas';
import { track } from '../lib/analytics';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Response-time copy. N is [OPEN] pending confirmation. */
const RESPONSE_TIME_COPY =
  'Your inquiry is persisted and a notification has been sent — never an auto-responder. ' +
  'Joshua replies within [OPEN: N] business days.';

/** Attribution options — concrete set (values confirmable; [OPEN] for final wording). */
const ATTRIBUTION_OPTIONS = [
  { value: '', label: 'Select one' },
  { value: 'search', label: 'Search' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'a-talk', label: 'A talk' },
  { value: 'referral', label: 'A referral' },
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'other', label: 'Other' },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FieldErrors {
  name?: string;
  email?: string;
  org?: string;
  message?: string;
  topic?: string;
  attribution?: string;
}

interface FormValues {
  name: string;
  email: string;
  org: string;
  message: string;
  topic: string;
  attribution: string;
}

// ---------------------------------------------------------------------------
// Error boundary
// ---------------------------------------------------------------------------

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// InviteFormInner (the actual form, wrapped in the error boundary)
// ---------------------------------------------------------------------------

function InviteFormInner() {
  const formRef = useRef<HTMLFormElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<FormState>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  // `noValidate` must apply ONLY after hydration. JS-off (the SSR'd baseline) the
  // browser's native required/type=email validation must stay ACTIVE so a JS-off
  // visitor is blocked client-side before the native POST (Decision 3). Once the
  // island hydrates it runs its own richer validation, so it then suppresses the
  // native UI by setting noValidate. Starting false keeps SSR output identical
  // for both branches and only opts into custom validation when JS is present.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  const [values, setValues] = useState<FormValues>({
    name: '',
    email: '',
    org: '',
    message: '',
    topic: '',
    attribution: '',
  });

  // Stable IDs for aria-describedby associations.
  const idPrefix = useId();
  const fieldId = (field: string) => `${idPrefix}-${field}`;
  const errorId = (field: string) => `${idPrefix}-err-${field}`;
  const summaryId = `${idPrefix}-summary`;
  const statusId = `${idPrefix}-status`;
  const alertId = `${idPrefix}-alert`;

  const hasErrors = Object.keys(fieldErrors).length > 0;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear per-field error on change so the user gets immediate feedback.
      if (name in fieldErrors) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name as keyof FieldErrors];
          return next;
        });
      }
    },
    [fieldErrors],
  );

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();

      // --- Client-side validation ---
      const parseResult = InviteInput.safeParse({
        name: values.name,
        email: values.email,
        org: values.org || undefined,
        message: values.message,
        topic: values.topic || undefined,
        attribution: values.attribution,
      });

      if (!parseResult.success) {
        // Build fieldErrors from ZodError.issues (Zod 4 non-deprecated API).
        // Each issue has a `path` array and a `message` string.
        const flatErrors: Record<string, string[]> = {};
        for (const issue of parseResult.error.issues) {
          const field = issue.path[0];
          if (typeof field === 'string') {
            if (!flatErrors[field]) flatErrors[field] = [];
            flatErrors[field]!.push(issue.message);
          }
        }
        const newErrors: FieldErrors = {};
        for (const [field, msgs] of Object.entries(flatErrors)) {
          if (msgs && msgs.length > 0) {
            newErrors[field as keyof FieldErrors] = msgs[0];
          }
        }
        setFieldErrors(newErrors);
        // Focus the error summary so screen readers announce it.
        setTimeout(() => errorSummaryRef.current?.focus(), 0);
        return;
      }

      // --- Submitting state ---
      setState('submitting');
      setFieldErrors({});
      setErrorMessage('');

      try {
        const response = await fetch('/api/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            org: values.org || undefined,
            message: values.message,
            topic: values.topic || undefined,
            attribution: values.attribution,
          }),
        });

        if (response.ok) {
          // --- Success state ---
          // Fire the invite-submitted conversion event (FR-36, Story 3.5 Task 2).
          // SSR-safe, env-gated: no-op without Umami (Rule 4). NO PII — only the
          // non-identifying `source` primitive. Fires wherever the island is embedded
          // (home Close + /invite). `source` disambiguates the two embed surfaces so
          // funnel analytics can attribute conversion to the right scene.
          track('invite-submitted', {
            source:
              typeof window !== 'undefined' && window.location.pathname === '/'
                ? 'close'
                : 'invite-page',
          });
          setState('success');
        } else {
          let msg = 'Your message could not be sent. Please try again.';
          try {
            const data = (await response.json()) as { error?: { message?: string } };
            if (data.error?.message) msg = data.error.message;
          } catch {
            // ignore JSON parse failure
          }
          setErrorMessage(msg);
          setState('error');
        }
      } catch {
        // Network failure (offline, etc.).
        setErrorMessage('Unable to reach the server. Please check your connection and try again.');
        setState('error');
      }
    },
    [values],
  );

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const isSubmitting = state === 'submitting';

  /** Render a field's error message element (aria-describedby target). */
  function FieldError({ field }: { field: keyof FieldErrors }) {
    const err = fieldErrors[field];
    if (!err) return null;
    return (
      <span id={errorId(field)} className="invite-form__error" role="presentation">
        {err}
      </span>
    );
  }

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------
  if (state === 'success') {
    return (
      <div
        id={statusId}
        className="invite-form__success"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="invite-form__success-heading">Your inquiry has been received.</p>
        <p className="invite-form__success-copy">{RESPONSE_TIME_COPY}</p>
        <p>
          <a href="/">Return to the site</a>
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main form render
  // ---------------------------------------------------------------------------
  return (
    <div className="invite-form-wrapper">
      {/* Error summary — rendered when there are validation errors; receives focus. */}
      {hasErrors && (
        <div
          id={summaryId}
          ref={errorSummaryRef}
          className="invite-form__summary"
          tabIndex={-1}
          role="group"
          aria-labelledby={`${summaryId}-heading`}
        >
          <p id={`${summaryId}-heading`} className="invite-form__summary-heading">
            Please fix the following before submitting:
          </p>
          <ul className="invite-form__summary-list">
            {Object.entries(fieldErrors).map(([field, msg]) => (
              <li key={field}>
                <a href={`#${fieldId(field)}`}>{msg}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Non-destructive error alert — preserves values, offers retry + mailto. */}
      {state === 'error' && (
        <div
          id={alertId}
          className="invite-form__alert"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <p className="invite-form__alert-heading">Your message was not sent.</p>
          <p>{errorMessage}</p>
          <p>
            You can retry using the button below, or{' '}
            <a
              href={`mailto:?subject=${encodeURIComponent('Speaking inquiry — Joshua R. Brandt, MSE')}&body=${encodeURIComponent('Hi Joshua,\n\n' + values.message)}`}
            >
              send an email directly
            </a>{' '}
            so your inquiry is not lost. You can also visit <a href="/about/">the about page</a>.
          </p>
        </div>
      )}

      {/*
       * The real <form> with action+method so native POST works JS-off.
       * The island intercepts onSubmit to use the enhanced fetch path.
       */}
      <form
        ref={formRef}
        action="/api/invite"
        method="POST"
        onSubmit={handleSubmit}
        // Only suppress native validation once hydrated (Decision 3 resilience):
        // JS-off the SSR'd form keeps native required/type=email validation.
        noValidate={hydrated}
        className="invite-form"
        aria-label="Speaking and collaboration inquiry"
      >
        {/* --- Name (required) --- */}
        <div className="invite-form__field">
          <label className="invite-form__label" htmlFor={fieldId('name')}>
            Your name <span className="invite-form__required">(required)</span>
          </label>
          <input
            id={fieldId('name')}
            className="invite-form__input"
            type="text"
            name="name"
            autoComplete="name"
            required
            maxLength={200}
            value={values.name}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.name ? 'true' : undefined}
            aria-describedby={fieldErrors.name ? errorId('name') : undefined}
          />
          <FieldError field="name" />
        </div>

        {/* --- Email (required) --- */}
        <div className="invite-form__field">
          <label className="invite-form__label" htmlFor={fieldId('email')}>
            Your email <span className="invite-form__required">(required)</span>
          </label>
          <input
            id={fieldId('email')}
            className="invite-form__input"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.email ? 'true' : undefined}
            aria-describedby={fieldErrors.email ? errorId('email') : undefined}
          />
          <FieldError field="email" />
        </div>

        {/* --- Organisation (optional) --- */}
        <div className="invite-form__field">
          <label className="invite-form__label" htmlFor={fieldId('org')}>
            Organisation
          </label>
          <input
            id={fieldId('org')}
            className="invite-form__input"
            type="text"
            name="org"
            autoComplete="organization"
            maxLength={200}
            value={values.org}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.org ? 'true' : undefined}
            aria-describedby={fieldErrors.org ? errorId('org') : undefined}
          />
          <FieldError field="org" />
        </div>

        {/* --- Message (required) --- */}
        <div className="invite-form__field">
          <label className="invite-form__label" htmlFor={fieldId('message')}>
            Message <span className="invite-form__required">(required)</span>
          </label>
          <textarea
            id={fieldId('message')}
            className="invite-form__textarea"
            name="message"
            required
            maxLength={5000}
            rows={5}
            value={values.message}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.message ? 'true' : undefined}
            aria-describedby={fieldErrors.message ? errorId('message') : undefined}
          />
          <FieldError field="message" />
        </div>

        {/* --- Topic (optional) --- */}
        <div className="invite-form__field">
          <label className="invite-form__label" htmlFor={fieldId('topic')}>
            Topic or event type
          </label>
          <input
            id={fieldId('topic')}
            className="invite-form__input"
            type="text"
            name="topic"
            maxLength={200}
            value={values.topic}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.topic ? 'true' : undefined}
            aria-describedby={fieldErrors.topic ? errorId('topic') : undefined}
          />
          <FieldError field="topic" />
        </div>

        {/* --- Attribution (required) — structured FR-31 --- */}
        <div className="invite-form__field">
          <label className="invite-form__label" htmlFor={fieldId('attribution')}>
            How did you hear about Joshua? <span className="invite-form__required">(required)</span>
          </label>
          <select
            id={fieldId('attribution')}
            className="invite-form__select"
            name="attribution"
            required
            value={values.attribution}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.attribution ? 'true' : undefined}
            aria-describedby={fieldErrors.attribution ? errorId('attribution') : undefined}
          >
            {ATTRIBUTION_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value} disabled={value === ''}>
                {label}
              </option>
            ))}
          </select>
          <FieldError field="attribution" />
        </div>

        {/* --- Honeypot (visually hidden, aria-hidden, never touched by real users) --- */}
        <div
          className="invite-form__honeypot"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', top: 'auto', overflow: 'hidden' }}
        >
          <label htmlFor={`${idPrefix}-website`}>Website (leave this blank)</label>
          <input
            id={`${idPrefix}-website`}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* --- Submit --- */}
        <div className="invite-form__actions">
          <button
            type="submit"
            className="invite-form__submit"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending…' : 'Send inquiry'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported component — wrapped in an error boundary (architecture §Islands)
// ---------------------------------------------------------------------------

/**
 * InviteForm island.
 *
 * Wrap in an error boundary: if hydration fails the SSR'd static <form> beneath
 * continues to work as a native POST (the resilience guarantee).
 *
 * Mount with client:visible so the React runtime is deferred until the form
 * scrolls into view (Lighthouse budget; NFR-1).
 */
export default function InviteForm() {
  return (
    <ErrorBoundary
      fallback={
        // The SSR form is already in the DOM — this fallback is only reached on
        // a client-side hydration error, in which case the native form still
        // works. Provide a minimal visible hint without a redundant re-render.
        <p className="invite-form__hydration-note" role="status">
          The enhanced form is temporarily unavailable. The form above still works — submit it
          directly.
        </p>
      }
    >
      <InviteFormInner />

      <style>{`
        /* ---------------------------------------------------------------------------
         * InviteForm scoped styles — DESIGN input token (DESIGN.md lines 317-327).
         * ---------------------------------------------------------------------------
         * input token:
         *   background:  --color-surface-base
         *   border:      1px solid --color-border-hairline
         *   radius:      9px (md-lg family)
         *   padding:     10px 12px
         *   fontFamily:  body
         *   fontSize:    14px (interface / form level)
         *   color:       --color-ink-secondary (resting)
         *   focus:       border → --color-accent; 2px rgba(30,58,95,0.12) ring
         *   label:       always present (never placeholder-as-label)
         * ---------------------------------------------------------------------------
         */

        .invite-form-wrapper {
          max-width: 560px;
        }

        .invite-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 28px;
        }

        .invite-form__field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .invite-form__label {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-ink-primary);
          line-height: 1.4;
        }

        .invite-form__required {
          font-weight: 400;
          color: var(--color-ink-secondary);
          font-size: 13px;
        }

        .invite-form__input,
        .invite-form__textarea,
        .invite-form__select {
          background: var(--color-surface-base);
          border: 1px solid var(--color-border-hairline);
          border-radius: 9px;
          padding: 10px 12px;
          font-family: var(--font-family-base);
          font-size: 14px;
          color: var(--color-ink-secondary);
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.1s ease, box-shadow 0.1s ease;
          appearance: none;
          -webkit-appearance: none;
        }

        .invite-form__textarea {
          resize: vertical;
          min-height: 120px;
        }

        .invite-form__select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231e3a5f' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
          cursor: pointer;
        }

        .invite-form__input:focus-visible,
        .invite-form__textarea:focus-visible,
        .invite-form__select:focus-visible {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px rgba(30, 58, 95, 0.12);
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
          color: var(--color-ink-primary);
        }

        /* aria-invalid styling */
        .invite-form__input[aria-invalid="true"],
        .invite-form__textarea[aria-invalid="true"],
        .invite-form__select[aria-invalid="true"] {
          border-color: #b91c1c;
          box-shadow: 0 0 0 2px rgba(185, 28, 28, 0.12);
        }

        .invite-form__input:disabled,
        .invite-form__textarea:disabled,
        .invite-form__select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .invite-form__error {
          display: block;
          font-size: 13px;
          color: #b91c1c;
          margin-top: 2px;
        }

        .invite-form__actions {
          margin-top: 4px;
        }

        .invite-form__submit {
          background: var(--color-accent);
          color: var(--color-surface-base);
          border: none;
          border-radius: var(--radius-md);
          padding: 12px 24px;
          font-family: var(--font-family-base);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.1s ease;
        }

        .invite-form__submit:hover:not(:disabled) {
          background: var(--color-accent-hover);
        }

        .invite-form__submit:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        .invite-form__submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Error summary */
        .invite-form__summary {
          border: 1px solid #b91c1c;
          border-radius: var(--radius-md);
          padding: 14px 16px;
          margin-bottom: 16px;
          background: #fef2f2;
        }

        .invite-form__summary:focus {
          outline: 2px solid #b91c1c;
          outline-offset: 2px;
        }

        .invite-form__summary-heading {
          font-weight: 600;
          color: #b91c1c;
          font-size: 14px;
          margin: 0 0 8px 0;
        }

        .invite-form__summary-list {
          margin: 0;
          padding-left: 20px;
          font-size: 14px;
          color: #7f1d1d;
        }

        .invite-form__summary-list a {
          color: #7f1d1d;
          text-decoration: underline;
        }

        .invite-form__summary-list a:focus-visible {
          outline: 2px solid #b91c1c;
          outline-offset: 2px;
        }

        /* Non-destructive error alert */
        .invite-form__alert {
          border: 1px solid #b91c1c;
          border-radius: var(--radius-md);
          padding: 14px 16px;
          margin-bottom: 16px;
          background: #fef2f2;
          font-size: 14px;
          color: var(--color-ink-primary);
        }

        .invite-form__alert-heading {
          font-weight: 600;
          color: #b91c1c;
          margin: 0 0 6px 0;
        }

        .invite-form__alert a {
          color: var(--color-accent);
          text-decoration: underline;
        }

        .invite-form__alert a:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        /* Success state */
        .invite-form__success {
          padding: 20px 0;
          font-size: var(--font-size-body);
          color: var(--color-ink-primary);
        }

        .invite-form__success-heading {
          font-weight: 600;
          font-size: 18px;
          margin: 0 0 10px 0;
        }

        .invite-form__success-copy {
          color: var(--color-ink-secondary);
          margin: 0 0 16px 0;
          line-height: 1.6;
        }

        .invite-form__success a {
          color: var(--color-accent);
          text-decoration: underline;
        }

        .invite-form__success a:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        .invite-form__hydration-note {
          font-size: 14px;
          color: var(--color-ink-secondary);
          padding: 12px 0;
        }
      `}</style>
    </ErrorBoundary>
  );
}
