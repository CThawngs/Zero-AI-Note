# Bot Brief — Zero AI Note (Architecture v1)

> **Canonical**: [`docs/PRD Zero AI Note.md`](./docs/PRD%20Zero%20AI%20Note.md)
>
> Brief ngắn cho AI agents / bots khi nhận task về Zero AI Note. Đọc PRD canonical trước khi hành động.

## What is Zero AI Note

AI Take Note / Knowledge Assistant. Multi-file Project xử lý video 10-20h+, audio, DOCX, PPTX → Project Knowledge Base. User generate notes, search, Q&A, cross-file comparison, evidence tracing, export Markdown/DOCX/PDF/HTML. Vietnamese-English bilingual.

## Tech Stack (đơn-cloud, validate)

- **Frontend**: Next.js App Router (Vercel)
- **API**: Next.js API Routes (cùng Vercel project — KHÔNG tách Cloudflare Workers)
- **Orchestration**: Inngest (`/api/inngest` route) — durable step function, 300s/step với Vercel Hobby + Fluid Compute
- **Storage**: Cloudflare R2 (raw + derived + exports) — storage-only, KHÔNG xử lý qua Cloudflare
- **DB**: Neon PostgreSQL + pgvector
- **ORM**: Drizzle
- **Auth**: JWT HS256 (`jose`) + bcrypt + Google OAuth
- **AI**: Gemini API (primary LLM/STT, cascade 3.7→2.5→2.0 Flash) + Groq Whisper v3 Turbo (STT pool #2) + BYOK (8 providers)
- **Billing**: Zero Tracking (VietQR) + Resend (email)

## 10 Immutable Principles

1. **Server-side AI** — Inngest worker chạy Gemini/Groq/BYOK; không local inference làm pipeline chính
2. **Multi-file Project** — 1 project = nhiều source
3. **Async & Durable** — Inngest, không sync Vercel function. Mỗi step ≤300s
4. **Resumable & Retryable** — checkpoint, partial failure ≠ restart
5. **Idempotent** — idempotency_key = `project_id + file_id + chunk_id + job_type + model_version + prompt_version + schema_version`
6. **RAG + Hierarchical** — vector chỉ là 1 signal
7. **Evidence-First** — mọi claim trace về source location
8. **Model-Agnostic** — abstraction `LLMProvider`, `TranscriptionProvider`, `EmbeddingProvider`
9. **Quota-Aware** — 90% safety valve → queue/pause/upgrade, không auto-charge
10. **Free-Tier Honest** — free trong system quota, không "unlimited free compute"

## Dual Engine AI (logic ứng dụng — giữ nguyên)

- **Engine A — Chat Assistant**: Q&A trên Project Knowledge, dynamic runtime identity
- **Engine B — Note Generator**: Headless JSON generator, Zod validation + auto-repair loop (max 2 retries)

## Hierarchical Multi-Stage Map-Reduce (6 stages)

Stage 0: Media/Document → Stage 1: ASR/Parsing → Stage 2: Chunk-level Knowledge → Stage 3: Section → Stage 4: File → Stage 5: Cross-file → Stage 6: Project Notes

## Free-Tier Economics

"Free 100%" = free cho end user **trong system quota**. Operator tối ưu trong provider free tier. KHÔNG unlimited cloud compute.

| Plan | Price | Notes | Storage | AI budget/day |
|---|---|---|---|---|
| Free | 0đ | Trong quota | 5 GB | 8k Neurons |
| Pro | 99kđ/tháng | $4 | 50 GB | 50k Neurons |
| Ultra | 199kđ/tháng | $8 | 200 GB | 200k Neurons |

90% safety valve: tạm dừng job mới, báo user chờ reset/BYOK/upgrade.

## MediaProcessor Abstraction (đơn giản hoá)

Chỉ còn 1 implementation (đã bỏ Cloudflare Stream do tốn phí):

```
MediaProcessor
└── InngestFFmpegProcessor (chạy trên Inngest worker, ffmpeg -c:a copy, 100% free)
```

Interface `MediaProcessor` giữ lại để dễ mở rộng nếu cần processor khác.

## Schema (Canonical)

[`docs/schema-neon.sql`](./docs/schema-neon.sql). Tables chính:

```
profiles, notebooks, sources, custom_note_templates, subscriptions,
user_coupons, notes, byok_providers, coupons,
projects, files, jobs, content_chunks, knowledge_objects, embeddings,
summaries, evidence, entities, relationships, conflicts, usage, quotas,
coverage_ledger
```

## Khi nào KHÔNG dùng

- ❌ Cloudflare Workers làm API layer (10ms CPU quá chặt → đã loại)
- ❌ Cloudflare Workflows/Queues (đã loại — đơn giản hoá)
- ❌ Cloudflare Stream ($5/1k min stored → mâu thuẫn free 100%, đã loại)
- ❌ Cloudflare Workers AI Whisper (dư thừa với Gemini + Groq, đã loại)

## When in Doubt

Đọc canonical: [`docs/PRD Zero AI Note.md`](./docs/PRD%20Zero%20AI%20Note.md).
