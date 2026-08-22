# Definition of Done — Zero AI Note

> Reference: [`docs/ARCHITECTURE_V1.md`](./docs/ARCHITECTURE_V1.md), [`docs/MIGRATION_PLAN.md`](./docs/MIGRATION_PLAN.md)

## Phase 1 — Foundation ✅
- [x] Next.js App Router scaffolded (Vercel)
- [x] Neon PostgreSQL + Drizzle ORM
- [x] Cloudflare R2 (signed URL upload) — storage-only, không compute
- [x] JWT auth (`jose` + `bcryptjs`)
- [x] Project + File model

## Phase 2 — File Ingestion ✅ (partial)
- [x] Direct upload via R2 signed URL
- [x] Multipart support (basic)
- [ ] **Resume upload via TUS** (deferred to MediaProcessor abstraction)
- [x] Job manifest (Inngest)

## Phase 3 — Processing ⚠️ (in progress)
- [x] Gemini STT (primary)
- [x] Groq Whisper v3 Turbo (STT pool #2)
- [x] 30-60 min chunk + overlap + silence detection
- [x] ffprobe metadata extraction
- [ ] **MediaProcessor abstraction** (CloudflareStreamProcessor + ExternalFFmpegProcessor)
- [ ] DOCX parser (giữ heading/list/table) — partial
- [ ] PPTX parser (slide-by-slide)
- [ ] Normalized Content model (Architecture v1 §13)

## Phase 4 — Knowledge ⚠️ (in progress)
- [x] pgvector extension + `source_embeddings` table
- [x] Chunking cơ bản (~400 từ)
- [ ] **Knowledge Objects structured extraction** (Architecture v1 §14)
- [ ] `content_chunks` table với location metadata
- [ ] Coverage Ledger
- [ ] Entity normalization

## Phase 5 — Summarization ⚠️ (partial)
- [x] Map-Reduce 2 tầng (STT + Structuring) — basic
- [ ] **Section summary**
- [ ] **File summary**
- [ ] **Cross-file analysis + conflict detection**
- [ ] **Project summary**
- [ ] `summaries` table với scope ref

## Phase 6 — Note System ✅ (partial)
- [x] 17 templates config-driven (`lib/templates/registry.ts`)
- [x] Universal Block JSON (heading/paragraph/cue_box/table/card_grid/callout/quote/mindmap)
- [x] Zod validation
- [x] Auto-repair loop (max 2 retries)
- [x] Universal Export Engine (MD/DOCX/PDF/Static HTML/Interactive HTML)

## Phase 7 — Chat ⚠️ (partial)
- [x] RAG Chat với pgvector cosine similarity
- [x] Hybrid (vector + keyword basic)
- [x] Dynamic Runtime Identity (không hardcode provider/model)
- [ ] **Hybrid retrieval chuẩn** (vector + keyword + metadata + hierarchy)
- [ ] **Evidence tracing UI**
- [ ] Streaming response (chat hiện tại polling/await)

## Phase 8 — Scale ❌ (not started)
- [ ] 10h+ video benchmark (verify MediaProcessor abstraction)
- [ ] Multi-file concurrent users stress test
- [ ] Quota optimization under load
- [ ] Conflict detection production test

## Cross-cutting

### Free-tier / Quota Policy (ADR-007) ⚠️
- [x] 3 plans (Free/Pro/Ultra)
- [x] Note count limit (20/50/∞) — server-side check
- [x] Custom template limit (5/25/∞) — server-side check
- [ ] **Atomic quota reservation** (SELECT FOR UPDATE)
- [ ] **90% safety valve**
- [ ] **Quota table + cron reconciliation**
- [ ] **Retention cleanup** (xoá file media >500MB sau STT)
- [x] Zero Tracking billing integration

### Security (ADR-007) ⚠️
- [x] JWT HS256 HttpOnly cookie
- [x] RLS policies trên các bảng chính
- [x] BYOK API key encryption
- [x] Webhook HMAC verification
- [x] SSRF protection
- [ ] **Audit log** (login_failed, quota_exceeded, safety_valve)

### Observability ❌
- [ ] Stage duration tracking
- [ ] AI Neurons usage tracking
- [ ] Retry/failure rate
- [ ] Quota remaining dashboards

## Acceptance Criteria (Production-Ready)

Một project được coi là "AI đã xử lý toàn bộ" khi:

1. **Upload**: Large file upload resumable (TUS) ✅ (signed URL works for basic cases)
2. **Processing**: Job can resume / retry / partial failure không restart project ❌ (cần idempotency table)
3. **AI**: ASR + Knowledge + Summarization + Cross-file synthesis ✅ (basic) / ⚠️ (production)
4. **Retrieval**: Relevant evidence retrievable ✅ (basic RAG)
5. **Notes**: Output conforms to Block JSON schema ✅
6. **Evidence**: Claims map back to source ❌ (cần `evidence` table + UI)
7. **Multi-file**: Synthesis across formats ✅ (basic)
8. **Context**: Project > model context mà vẫn xử lý được ✅ (RAG)
9. **Cost**: Quota prevents uncontrolled cloud spend ❌ (cần safety valve + atomic reservation)

## Definition of Done per Phase

Một phase "done" khi:
1. Code implemented + tests pass
2. Schema migration applied to Neon
3. Documentation updated (canonical reference)
4. Migration plan updated (gap → resolved)
5. ADR updated nếu thay đổi quyết định kiến trúc
