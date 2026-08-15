# Continuity Protocol — Zero AI Note

This project is initialized with a Free-First pipeline: Vite + React + Tailwind v4, then Next.js app-router packaging next to it. The app is functionally ready; it just needs its backend replaced by real services.

## Autonomous Loop

Keep the following in mind for every next Hermes run:

1. Treat `DECISIONS.md`, `DEFINITION_OF_DONE.md`, and `ARCHITECTURE.md` as the contract. Do not invent new directions.
2. Only stop to confirm when touching billing, deletion, or a shared state change.
3. Everything else: do the work, verify, commit, and write the next step into those three files.

## Ground rules

- Free 100% forever. Do not add paid services unless the user explicitly asks.
- If a task needs credentials, fall back to a local stub and mark it TODO with the exact env var name.
- If the app breaks on Next.js, attempt a Vite fallback, then stop and report the exact error.
- Rely on the documents in this folder to maintain continuity between sessions.

## Next step (post-initialization)

Finish the repository initialization without further user input:

1. Audit the actual app entry points (`src/App.tsx`, `src/main.tsx`, `app/page.tsx`, `app/layout.tsx`).
2. Stabilize the Next.js build first.
3. Then wire the app to `lib/db.ts` + `lib/db-types.ts` via a minimal Neon-based API route.
4. Update `docs/README_NOTE.md` after each milestone.

## Continuity contract

If this message is re-injected into a new context:

- Assume all files in `prompt_embeddings/` are still valid.
- Assume `DECISIONS.md` is still the source of truth.
- Never echo the full README or DECISIONS back to the user; only reference them.
- Keep changes incremental: one logical piece of work per step.