# ByteLearn Content Operations

## Current release target

The curriculum manifest defines 200 topic IDs across six tracks. It is a plan, not a claim that 200 lesson bodies are already generated or approved. Existing lesson IDs are marked `existing_review_required`; verify them against Supabase and the app before generating replacements.

## Repository workflow

1. Select a batch of curriculum topics and attach curated source URLs.
2. Generate one lesson JSON per topic using `prompts/generate-lesson.md`.
3. Save outputs under `content/drafts/`.
4. Run `node scripts/validate-lessons.mjs content/drafts`.
5. Run the independent review prompt in `prompts/review-lesson.md`; resolve all medium/high/critical findings.
6. Manually verify sources and execute code samples where feasible.
7. Copy approved JSON to `content/approved/`, recording `review.status: "PASS"` or `approved: true`.
8. Run `node scripts/validate-lessons.mjs content/approved`.
9. Run the seeder only from a trusted environment with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set.
10. Verify published counts and render lessons in the app before release.

The seeder uses an upsert by lesson ID, so reruns reconcile the same record instead of duplicating it. It refuses records that have not been marked approved. Never put a service-role key in the React Native app or Git history.

## Suggested batch schedule for 200 lessons

- Batch 1: 20 lessons to validate the content contract and rendering.
- Batch 2: 30 lessons.
- Batch 3: 50 lessons.
- Batch 4: 50 lessons.
- Batch 5: 50 lessons.

Do not call the launch library complete until the database has the intended number of distinct published lessons, every lesson has passed validation and review, and the actual app renders the full catalog correctly. The existing hard-coded/local lesson catalog and any current Supabase rows must be reconciled before counting toward 200.

## Background lesson updater (Phase 2)

Recommended shape:
- Scheduled server-side job (Supabase Edge Function + scheduled invocation, or a separate trusted worker).
- Read the curriculum manifest and a persisted generation queue.
- Select gaps based on track coverage, learner feedback, stale references, and priority.
- Generate drafts using a server-side AI provider key stored as a secret.
- Run deterministic schema/duplicate checks and an independent review pass.
- Save drafts and job logs with statuses such as queued, generated, needs_review, approved, rejected, published, failed.
- Publish only when required checks and approval policy pass.
- Use unique topic/lesson IDs, idempotent upserts, rate limits, budget caps, retry limits, and alerts.
- Do not run model calls in the mobile/web client. Do not blindly auto-publish AI-generated content.

For the first release, a manual batch workflow is simpler and easier to audit. Add the scheduled updater after the batch pipeline is reliable.

## PDF-to-reels feature (Phase 3)

Recommended flow:
1. User uploads a PDF to private object storage.
2. Create a document record owned by that user and a processing job.
3. Extract text and page metadata in a trusted server-side worker; detect scanned PDFs and use OCR only when required.
4. Segment the document into concepts, preserving page numbers and source spans.
5. Generate a proposed outline and short lessons with quizzes, each linked to source pages.
6. Validate schema, check coverage against the document, flag unsupported claims, and let the user review/edit the outline before generating the full set.
7. Store generated lessons privately by default; the user can publish/share them only after review.
8. Render with the same scene schema and templates used by the public library.

Security requirements: private storage, per-user row-level security, file size/page limits, processing timeouts, malware/content checks appropriate to the environment, retention/deletion controls, and no exposure of provider keys. Treat document text as untrusted input; instructions embedded inside PDFs must not override system prompts or trigger tools.

## Courses (later)

Keep lessons reusable. Model courses as metadata plus a join table such as `course_lessons(course_id, lesson_id, position, required)`; this allows one lesson to appear in multiple courses and in the discovery feed. Add this after the 200-lesson feed and PDF processing foundations are stable.
