# BOT_BRIEF.md — Zero AI Note (Shared Fleet Context)

> Maintained by CEO (@ceo). **READ THIS + ARCHITECTURE.md + DEFINITION_OF_DONE.md before ANY task on this repo.**
> This file is the fleet's shared memory for the project. It is authoritative while present at repo root.

## Repo
- **Local path:** `C:/Users/nguye/OneDrive/Documents/Projects/Zero-AI-Note`
- **Stack:** Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript + Drizzle ORM
- **DB:** Neon Postgres (serverless) + RLS; **Storage:** Cloudflare R2 (backup, S3-compatible)
- **AI:** Google Gemini 3.7 Flash (primary) + failover 2.5/2.0 via `@google/genai`; **runtime model = user-selected from AppContext** (BYOK); BYOK 8 providers (Google, OpenAI, Anthropic, OpenRouter, Groq, NVIDIA NIM, Local Ollama, Custom Endpoint)
- **Billing:** Zero Tracking (a SEPARATE project using Supabase) via REST + `ZEROINVOICE_API_KEY`. App talks to Zero Tracking over HTTP only — never shares DB.
- **Deploy target:** Vercel (auto-deploy on `main`)

## ⚠️ CRITICAL WARNING (from AGENTS.md)
**"This is NOT the Next.js you know."** Next 16 has breaking changes (APIs, conventions, file structure). ALWAYS read the guides under `node_modules/next/dist/docs/` before writing any Next code. Heed deprecation notices. Do NOT code Next from training memory.

## DONE (verified in DEFINITION_OF_DONE.md)
- Auth: JWT (HS256) + bcryptjs, Google OAuth (signature-verified), 7-day HttpOnly cookie
- Neon schema (10 tables + RLS + indexes), `/api/health` real DB check
- Core pipeline: 1 file → Gemini → `StructuredNoteOutput` → Preview + **real** DOCX/PDF/MD/HTML export
- `content_structured` JSON is the single source for Preview + every export
- Notes Library (Living Note: 1 session = 1 in-place-upserted note), Recent Chats switcher, 30-day Trash/Archive
- Pricing matrix (Free/Pro/Ultra), VietQR Zero-Click payment, Coupons CRUD + 1-account-1-coupon rule
- Zero Tracking realtime payee switch; BYOK with verified-provider lock + multi custom endpoints
- Security: gitleaks scan clean (no real secret ever committed), fail-closed secrets, Google OAuth sig verification fixed

## DANGLING WORK QUEUE (the backlog)
1. **Tuần 1-2:** Inngest background job queue — not yet tested (only 1 simulated job). **Trigger.dev đã loại bỏ** (chỉ dùng Inngest).
2. **Tuần 5-7:** Multi-file/multi-format pipeline via chunk — **DESIGNED & LOCKED in PRD (2026-08-20)**: server-cloud 7-step (R2 presign → Inngest worker demux `-c:a copy` streaming + segment 30–60p → FFmpeg keyframe <2h → Gemini STT per chunk w/ overlap 10–15s+silence-detection for lossless → YouTube caption client-side (youtubei.js) → map-reduce → content_structured → Neon; Stepper3 + sub-progress + email Resend; cap free 2GB/5h). **Model = user-selected from AppContext combobox + failover cascade 3.7→2.5→2.0; non-Gemini → transcription-first then synthesis.** BUILD PENDING (handoff @tech). Also: 5 templates + Auto + custom template; preview of 4 export formats
3. **Tuần 12+:** Mind map, TTS, action items, Notion/Calendar sync, spaced repetition
4. **Launch:** Vercel production deploy; run full real flow (signup → upload → note → upgrade → pay)

## INVARIANT RULES (violation = rework; @audit will block)
1. `content_structured` (JSON) is the ONLY source for Preview + every export — never parse HTML back
2. Billing fail-closed; tracking/analytics fail-open
3. RLS on every table with personal data
4. BYOK keys encrypted, never logged, never exposed to client
5. SSRF-validate Custom Endpoints server-side
6. Free-model cache shared by provider
7. NO hardcoded Tailwind colors — all via theme token (`src/utils/themeTokens.ts`)
8. NO mock/fake data in UI — every query hits real Neon (empty state is fine)
9. Coupon discount is ALWAYS % (1-100%), never fixed VND
10. Each chat session = independent research thread tied to a Note Artifact

## KEY FILE MAP
- Routes: `app/(landing)/page.tsx`, `app/app/page.tsx`, `app/docs/page.tsx`, `app/api/{auth,billing,coupons,notes,providers,upload,health}/...`
- `middleware.ts` — guards `/app`, admin routes, redirect logic
- `lib/db.ts` (Neon singleton), `lib/neon/queries.ts` (CRUD), `lib/storage.ts` (R2 abstraction)
- `lib/ai/gemini.ts`, `lib/ai/dispatcher.ts` — AI engine
- `lib/billing/zeroinvoice.ts`, `lib/billing/coupon.ts` — billing
- `src/` — UI (components, `context/AppContext.tsx`, `i18n` VI/EN, `utils/themeTokens.ts`)
- `src/data/modelCatalog.ts` — BYOK provider presets
- `docs/schema-neon.sql`, `docs/migrations/*.sql`
- **Project docs:** `ARCHITECTURE.md` (canonical), `DECISIONS.md` (461 lines, full rationale), `DEFINITION_OF_DONE.md` (checklist), `AGENTS.md` (Next 16 warning)

## ORCHESTRATION
- **CEO (@ceo)** is the hub: decomposes work, delegates via @mention, owns final synthesis + @audit sign-off
- Group chat = ≤6 bots, ≤3 serial rounds, **human-triggered** — it does NOT inherit any bot's chat history
- Therefore this brief + `ARCHITECTURE.md` ARE the shared memory; do not assume prior chat context
- After code: `@audit` reviews; `@operations` tracks; **do NOT self-merge to `main` without CEO go-ahead**
- Secrets live only in `.env.local` / Vercel dashboard. Never commit. `.env.example` is the map.

## ANTI-PATTERNS (fixed in DECISIONS.md — do not reintroduce)
- No hardcoded JWT fallback secret (was removed; now fail-closed)
- No decoding Google JWT without signature verification (was a critical vuln, fixed)
- No mock data (removed; UI shows empty state)
- No Next code from memory (Next 16 breaking changes)
- RLS uses `auth_uid()` NOT `auth.uid()` (Neon vs Supabase syntax)
