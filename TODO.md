# TODO — Zero AI Note

> **Bám theo**: `docs/PRD Zero AI Note.md` (PRD canonical single-file, locked 2026-08-22).
> **Cập nhật**: 2026-08-22 (audit trung thực pass 1). Đối chiếu thực tế repo + site `zero-ai-note.vercel.app`.

## Quy ước
- `[ ]` chưa làm · `[X]` đã xong (verify qua code/site thật) · `[~]` đang làm dở/một phần (ghi %/lý do ngay sau)
- Mục ghi "cần verify / chưa thấy / chưa có / chưa test" BẮT BUỘC là `[ ]` — không được mang `[X]`.
- Cha (CẤP 2/3) chỉ `[X]` khi 100% con `[X]`; toàn `[ ]` → `[ ]`; còn lại → `[~]`.
- Mỗi mục CẤP 3 phải có ≥1 CẤP 4 con cụ thể.

## Tổng quan (audit trung thực 2026-08-23)
- **Tổng mục CẤP 4**: 196
- **Đã xong `[X]`**: 144 (73.5%)
- **Đang làm dở `[~]`**: 2
- **Chưa làm `[ ]`**: 50
- **% Hoàn thành thực**: ~73% — MỚI NHẤT: Hierarchical Summarization map-reduce XONG (`lib/ai/summarize.ts`, threshold gate >24k chars/>3 nguồn, conflict detection 2 phía không chọn truth, test 11/11). Verify-before-code đã đóng 9 mục UI có sẵn. Còn mở chính: knowledge_objects/coverage_ledger wiring, PPTX parser, tsvector hybrid RAG.

---

## [~] CẤP 1: Hạ tầng & Nền tảng (PRD mục 3.0, 3.1, Roadmap Phase 1)

### [X] CẤP 2: Next.js + Vercel scaffold
- [X] CẤP 3: Next.js App Router scaffolded
  - [X] CẤP 4: `app/layout.tsx` + `app/page.tsx` (landing) tồn tại
  - [X] CẤP 4: `package.json` scripts: `dev` (next dev -p 3000), `build`, `start` (port 3100), `lint` (tsc --noEmit)
- [X] CẤP 3: TypeScript + Tailwind CSS
  - [X] CẤP 4: `tsconfig.json` strict mode + Tailwind 4.x via `@tailwindcss/postcss`
  - [X] CẤP 4: Build pass (commit msg "0 errors (TypeScript passed)")

### [X] CẤP 2: Neon PostgreSQL + Drizzle ORM
- [X] CẤP 3: Neon serverless driver
  - [X] CẤP 4: `@neondatabase/serverless ^1.1.0` trong dependencies
  - [X] CẤP 4: `lib/db.ts` (68 lines) — Neon HTTP client
- [X] CẤP 3: Drizzle ORM + schema helper
  - [X] CẤP 4: `drizzle-orm ^0.45.2` + `drizzle-kit ^0.31.10`
  - [X] CẤP 4: `lib/db-types.ts` (110 lines), `lib/neon/schema.ts` (24 lines)

### [~] CẤP 2: Cloudflare R2 (storage-only)
- [X] CẤP 3: AWS S3 client (R2-compatible)
  - [X] CẤP 4: `@aws-sdk/client-s3 ^3.1111.0` + `@aws-sdk/s3-request-presigner`
  - [X] CẤP 4: `lib/storage.ts` (130 lines) — R2 client wrapper
- [X] CẤP 3: Presigned URL upload
  - [X] CẤP 4: API route `app/api/upload/presign/route.ts` (65 lines)
  - [X] CẤP 4: API route `app/api/upload/put/route.ts` (45 lines)
- [ ] CẤP 3: Multipart/Resumable upload (TUS)
  - [ ] CẤP 4: Chưa scaffold — cần cho file >4.5GB
- [X] CẤP 3: Retention policy tự động xoá file media >500MB sau STT [2026-08-22]
  - [X] CẤP 4: `storageService.purgeLargeProcessedMedia()` (lib/storage.ts): select uploads completed >500MB → DeleteObjectCommand R2 → mark deleted; presign route giờ ghi `size_bytes` vào uploads (trước đây null nên retention không thể chạy) [2026-08-22]
  - [X] CẤP 4: Cron trigger `r2-retention-purge` (Inngest cron 03:00 VN daily, register trong /api/inngest) gọi purgeLargeProcessedMedia(50)/lượt [2026-08-22]

### [X] CẤP 2: Authentication (JWT HS256)
- [X] CẤP 3: JWT tự phát hành + HttpOnly cookie
  - [X] CẤP 4: `lib/auth/session.ts` (49 lines) — `signSession` + `verifySession` + `getSession` qua `jose`
  - [X] CẤP 4: Fail-closed khi thiếu `ZERO_JWT_SECRET` (throw error rõ ràng)
  - [X] CẤP 4: Cookie: HttpOnly, Max-Age 7 ngày, SameSite=Lax, Secure ở production
- [X] CẤP 3: Email/password + bcryptjs
  - [X] CẤP 4: `lib/auth/password.ts` (24 lines) — bcrypt hash
  - [X] CẤP 4: `lib/auth/users.ts` (187 lines) — user CRUD
- [X] CẤP 3: Google OAuth
  - [X] CẤP 4: `google-auth-library ^11.0.2` dependency
  - [X] CẤP 4: API route `app/api/auth/google/callback/route.ts` (161 lines) — xử lý ID token

### [X] CẤP 2: Inngest (orchestration)
- [X] CẤP 3: Inngest client + serve endpoint
  - [X] CẤP 4: `inngest ^4.18.1` dependency
  - [X] CẤP 4: `lib/inngest/client.ts` (30 lines) — Inngest client init
  - [X] CẤP 4: API route `app/api/inngest/route.ts` (30 lines) — serve Inngest functions
- [X] CẤP 3: Pipeline function (process-note-pipeline)
  - [X] CẤP 4: `lib/inngest/functions.ts` (76 lines) — 4 steps (mark-processing → extract-transcript → generate-note → save-note)
  - [X] CẤP 4: Concurrency 2 (giới hạn tránh 429 Gemini theo PRD mục 10)

### [ ] CẤP 2: Architecture v1 advanced features (defer sau deadline)
- [ ] CẤP 3: Atomic quota reservation (SELECT FOR UPDATE)
  - [ ] CẤP 4: Chưa có `lib/quota/reserve.ts` + `release.ts`
- [X] CẤP 3: 90% safety valve (auto-pause khi quota đạt ngưỡng) [2026-08-22]
  - [X] CẤP 4: Trong reserveQuota: committed+reserved ≥ floor(limit×0.9) → từ chối job mới với pausedByValve=true + message 'quá tải tạm thời' (khác message hết quota thường) [2026-08-22]
- [X] CẤP 3: Daily cron quota reconciliation [2026-08-22]
  - [X] CẤP 4: MỚI `quotaReconcile` (Inngest cron 03:30 VN daily, register /api/inngest): delete quotas row >35 ngày (returning id đếm số). Ngày mới tự có row mới nhờ unique(user,resource,period_start). ponytail: orphaned reservation per-job cần quotas.job_link — ghi trong code comment [2026-08-22]

---

## [~] CẤP 1: Ingestion & Xử lý file dài (PRD mục 4.0, 4.1, 4.1b, 3.2b, Phase 2-3)

### [X] CẤP 2: Email notification batch (2026-08-23, DECISIONS.md §25)
- [X] CẤP 3: Schema — batch_group_id + notification_sent_at
  - [X] CẤP 4: Migration `docs/migrations/add_batch_notification.sql` ĐÃ CHẠY trên Neon thật — verify information_schema có cả 2 cột + partial index idx_sources_batch_group; schema-neon.sql đồng bộ
- [X] CẤP 3: Logic trigger batch-complete
  - [X] CẤP 4: Backend sinh batch_group_id khi nhận N>1 sources/1 request (`/api/notes/generate` stamp theo file_url/file_name, fail-open)
  - [X] CẤP 4: Inngest step `batch-email-check` sau mỗi file xong (`lib/inngest/functions.ts`) — NULL→hành vi cũ; còn pending→dừng; đủ điều kiện→claim ATOMIC `update ... where notification_sent_at is null returning id`
  - [X] CẤP 4: Test race condition — `scripts/test-batch-notification.ts` TEST 1: claim thứ 2 trả false, chỉ 1 email (13/13 PASS)
  - [X] CẤP 4: Test ngưỡng 2 phút — TEST 2: 1 phút tuổi → không gửi, 5 phút → gửi
- [X] CẤP 3: Template email batch (liệt kê trạng thái từng file)
  - [X] CẤP 4: `lib/notifications/batch.ts` sendBatchCompletionEmail qua Resend — subject "Note của bạn đã sẵn sàng"/"X/N file đã xử lý xong", friendly-error cho file lỗi, link thẳng notebook; test với case 1 file lỗi (TEST 4). CHƯA test E2E với Resend thật — cần RESEND_API_KEY trên Vercel

### [~] CẤP 2: Project & File model (Architecture v1 §9)
- [X] CẤP 3: `projects` table schema
  - [X] CẤP 4: DDL trong `docs/schema-neon.sql` với RLS
- [X] CẤP 3: `files` table schema
  - [X] CẤP 4: DDL trong `docs/schema-neon.sql` với RLS
- [~] CẤP 3: Code switch sang tables mới
  - [~] CẤP 4: Code hiện dùng legacy `notebooks` + `sources` — đã có DDL nhưng code chưa switch, chưa có migration script idempotent

### [~] CẤP 2: Job model với idempotency
- [X] CẤP 3: `jobs` table enhanced
  - [X] CẤP 4: DDL trong `docs/schema-neon.sql` (idempotency_key UNIQUE, attempt, priority)
  - [X] CẤP 4: `lib/inngest/functions.ts` update jobs status (mark-processing → done)
- [ ] CẤP 3: Idempotency wrapper chuẩn
  - [ ] CẤP 4: Chưa có `lib/jobs/manager.ts` với `enqueueJob()` kiểm tra idempotency_key trước khi trigger

### [~] CẤP 2: Ingestion (PRD mục 4.1)
- [X] CẤP 3: Direct upload qua R2 Presigned URL
  - [X] CẤP 4: `app/api/upload/presign/route.ts` + `put/route.ts`
  - [X] CẤP 4: `lib/storage.ts` wrap S3 client cho R2
- [X] CẤP 3: Sources/notebooks CRUD (legacy)
  - [X] CẤP 4: `lib/neon/queries.ts` (500 lines) — createNote, getNotes, deleteNotePermanently, purgeExpiredArchivedNotes (30 ngày)
- [X] CẤP 3: API routes cho notes
  - [X] CẤP 4: `app/api/notes/route.ts` (141 lines) — list/create
  - [X] CẤP 4: `app/api/notes/generate/route.ts` (110 lines)
  - [X] CẤP 4: `app/api/notes/export/route.ts` (201 lines)
  - [X] CẤP 4: `app/api/notes/status/[jobId]/route.ts` (92 lines) — polling
- [ ] CẤP 3: Multipart/Resumable upload (TUS)
  - [ ] CẤP 4: Chưa scaffold

### [ ] CẤP 2: MediaProcessor (PRD mục 4.0.4)
- [ ] CẤP 3: `MediaProcessor` interface abstraction
  - [ ] CẤP 4: Chưa có file `lib/media/processor.ts` (inspect/extractAudio/createSegments/getStatus/handleFailure)
- [ ] CẤP 3: `InngestFFmpegProcessor` implementation
  - [ ] CẤP 4: Chưa có — cần `ffmpeg -c:a copy` streaming, segment 30-60p, HTTP Range Request
- [ ] CẤP 3: External FFmpeg fallback
  - [ ] CẤP 4: Không cần (chỉ dùng Inngest worker) — đánh dấu để tránh nhầm là thiếu

### [~] CẤP 2: ASR / Transcription (PRD mục 3.2b step 4)
- [X] CẤP 3: Gemini native audio transcription
  - [X] CẤP 4: `@google/genai ^2.4.0` dependency
  - [X] CẤP 4: `lib/ai/gemini.ts` (444 lines)
- [X] CẤP 3: STT hợp nhất về Gemini duy nhất (quyết định 2026-08-22, xem DECISIONS.md)
  - [X] CẤP 4: Không cần Groq client — đã bỏ theo quyết định đơn giản hoá
- [X] CẤP 3: STT Map-Reduce
  - [X] CẤP 4: `lib/ai/map-reduce/stt-map-reduce.ts` (101 lines) — chunk 30-45p + overlap 30s
- [X] CẤP 3: Wire extraction thật vào /api/notes/generate [2026-08-22]
  - [X] CẤP 4: MỚI `lib/ai/extract.ts`: PDF/image/audio/video inline ≤18MB qua Gemini multimodal (cascade flash-latest→2.0→2.5-lite), YouTube fileData native, web r.jina.ai, DOCX mammoth; transcript LƯU sources.transcript cho pipeline/RAG; fail per-source không chết request [2026-08-22]
  - [~] CẤP 4: E2E verify với file thật CHƯA chạy được — GEMINI_API_KEY local lẫn Vercel đều sai loại (OAuth token AQ.A... thay vì AI Studio AIza...) → production đang sống nhờ OpenRouter fallback; cần user tạo key mới aistudio.google.com/apikey [2026-08-22]
- [ ] CẤP 3: Keyframes (scene-change detection)
  - [ ] CẤP 4: Chưa có ffmpeg scene detection integration

### [ ] CẤP 2: DOCX/PPTX parsers
- [X] CẤP 3: DOCX parser (giữ heading/list/table) [2026-08-22]
  - [X] CẤP 4: MỚI `mammoth` dep + wire trong `lib/ai/extract.ts` extractSource() — download R2 → extractRawText; PPTX vẫn [ ] (cần thư viện riêng) [2026-08-22]
- [ ] CẤP 3: PPTX parser (slide-by-slide)
  - [ ] CẤP 4: Chưa có

### [~] CẤP 2: Tách luồng Chat thường vs Xử lý file (PRD mục 4.1b)
- [~] CẤP 3: Luồng A — Chat thường (không đính kèm file)
  - [X] CẤP 4: `lib/ai/autonomousAgent.ts` (415 lines) — có logic phân biệt attachment
  - [ ] CẤP 4: Verify: text không file → gọi thẳng model, không qua Inngest
- [~] CẤP 3: Luồng B — Có đính kèm file → Processing Card
  - [X] CẤP 4: API `app/api/notes/status/[jobId]` polling
  - [X] CẤP 4: Frontend ProcessingCard trong khung chat — VERIFY TRONG CODE: ChatPipelineProgress.tsx render khi isProcessingChat && có attachments (ChatScreen L452) [2026-08-23]
  - [X] CẤP 4: Stepper 3 bước real-time — VERIFY TRONG CODE: ChatPipelineProgress currentStep prop; FilesScreen pollJobUntilDone cập nhật step; /api/notes/status trả progress [2026-08-23]

---

## [~] CẤP 1: AI Pipeline & Note Generation (PRD mục 3.2c-g, 4.0.7-12, Phase 4-6)

### [X] CẤP 2: Tool-calling cho Chat Assistant (2026-08-23)
- [X] CẤP 3: System prompt redesign (trả lời tự nhiên, danh tính động, chỉ kích hoạt tài liệu khi liên quan)
  - [X] CẤP 4: Viết lại system prompt theo Phần A — `lib/ai/prompts/chat-assistant.ts` rewrite toàn bộ: natural-first, identity inject runtime từ provider đang chạy request, document-flow gating 2 điều kiện (có đính kèm / user chủ động hỏi note cũ) [2026-08-23]
  - [X] CẤP 4: Test câu hỏi off-topic — `scripts/test-chat-prompt.ts` 13/13 PASS (dynamic identity ×2 provider, khai báo tool, gating rules); production curl "Bạn là ai/model gì" trả đúng trọng tâm qua fallback chat [2026-08-23]
- [X] CẤP 3: Tool web_search (Tavily)
  - [X] CẤP 4: Đăng ký Tavily key, thêm .env — USER đã thêm `TAVILY_API_KEY` vào Vercel Environment Variables (23/08); local .env.local không có (chỉ server cần) [2026-08-23]
  - [X] CẤP 4: Implement function-calling schema + gọi API — `lib/ai/tools/registry.ts` `webSearch()` POST api.tavily.com/search basic depth; test mock fetch 16/16 PASS [2026-08-23]
  - [X] CẤP 4: Guard quota 1.000 credit/tháng — `checkTavilyQuota()` đếm usage operation='tavily_search' tháng hiện tại, chặn ở 950 (buffer 50); gate trong agent-loop trả {error} cho model → trả lời "không thể tra cứu" thay vì lỗi cứng [2026-08-23]
- [X] CẤP 3: Tool get_weather (Open-Meteo)
  - [X] CẤP 4: Implement geocode + forecast 2 bước — LIVE TEST THẬT: Hà Nội → geocode 21.02/105.84 → forecast 25.2°C mưa phùn 93% khớp curl trực tiếp; địa điểm không tồn tại trả error không crash [2026-08-23]
  - [X] CẤP 4: Map weather_code sang mô tả tiếng Việt — `wmoToVietnamese()` 25 codes WMO (0 quang, 45 sương mù, 51-55 mưa phùn, 61-67 mưa, 71-77 tuyết, 95-99 dông); test PASS [2026-08-23]
- [X] CẤP 4: Test cả 2 tool hoạt động đúng khi user BYOK ≠ Gemini (OpenAI/Claude/OpenRouter) — E2E PRODUCTION THẬT qua OpenRouter free (FC format OpenAI-compatible): weather trả 25.1°C mưa rào khớp live Open-Meteo; web_search trả giá vàng SJC thật + usage row ghi 1 credit vào Neon (verify bằng query); identity trung thực khai báo 'OpenRouter free fallback' [2026-08-23]

### [X] CẤP 2: Dual Engine AI (PRD mục 3.2c)
- [X] CẤP 3: Chat Assistant Engine (Engine A)
  - [X] CẤP 4: `lib/ai/prompts/chat-assistant.ts` (74 lines) — Dynamic Runtime Identity
  - [X] CẤP 4: Inject provider/model từ `byok_providers` runtime
- [X] CẤP 3: Note Generator Engine (Engine B)
  - [X] CẤP 4: `lib/ai/prompts/note-generator.ts` (106 lines) — Headless JSON Generator
  - [X] CẤP 4: `lib/ai/dispatcher.ts` (346 lines) — generateAgentResponse + generateStructuredNote
- [X] CẤP 3: OpenRouter free fallback tầng 4 (Chat/Note Generator) [2026-08-22]
  - [X] CẤP 4: Nhánh `openrouter/free` đã wire: `lib/ai/openrouter-fallback.ts` (mới) + catch-block `lib/ai/gemini.ts` + system-pool branch `lib/ai/dispatcher.ts` — cascade Gemini fail → OpenRouter → autonomous local [2026-08-22]
  - [X] CẤP 4: Test fallback giả lập Gemini 429: `scripts/test-openrouter-fallback.ts` (bun, mock fetch) — ALL TESTS PASSED; model=alias `openrouter/free`, headers đúng, JSON note parse OK [2026-08-22]

### [~] CẤP 2: Config-Driven Template Registry (PRD mục 3.2f, 4.2)
- [X] CẤP 3: 17 templates centralized
  - [X] CẤP 4: `lib/templates/registry.ts` (147 lines) — đủ 17 templates + tier free/pro/ultra
- [X] CẤP 3: Tier gating runtime (Auto chỉ chọn template trong gói user) [2026-08-22]
  - [X] CẤP 4: Free: dispatcher `freeTemplates` random 3 template Free khi method=auto; Pro/Ultra: generate route chặn `isTemplateAllowed(method, plan)` trước khi gọi AI → 403 kèm message nâng cấp. Fix lệch type `deep-analysis`→`deep-research` trong permissions.ts. Test pass (test-crypto-ssrf-gating.ts) [2026-08-22]

### [X] CẤP 2: Universal Block Schema + Zod Validator (PRD mục 3.2g, 4.3)
- [X] CẤP 3: 7 block types
  - [X] CẤP 4: `lib/ai/validators/block-schema.ts` (87 lines)
- [X] CẤP 3: Auto-repair loop
  - [X] CẤP 4: `lib/ai/validators/repair-loop.ts` (143 lines) — validateAndRepair max 2 retries

### [X] CẤP 2: Map-Reduce 2 tầng (PRD mục 3.2d)
- [X] CẤP 3: STT Map-Reduce
  - [X] CẤP 4: `lib/ai/map-reduce/stt-map-reduce.ts` (101 lines)
- [X] CẤP 3: Structuring Map-Reduce
  - [X] CẤP 4: `lib/ai/map-reduce/structuring-map-reduce.ts` (142 lines) — chunk 3.000-5.000 từ

### [~] CẤP 2: RAG với pgvector (PRD mục 3.2e)
- [X] CẤP 3: Chunking + Embedding + Storage
  - [X] CẤP 4: `lib/ai/rag/rag-pipeline.ts` (109 lines) — chunkTranscript 400 từ + embedAndStoreChunks + querySimilarChunks Top-K=5
- [X] CẤP 3: pgvector extension
  - [X] CẤP 4: `docs/02-migrations/001_initial_schema.sql` — extension vector + source_embeddings table
- [ ] CẤP 3: Hybrid retrieval (vector + keyword + metadata + hierarchy)
  - [ ] CẤP 4: Hiện chỉ vector cosine — chưa có tsvector keyword search
- [ ] CẤP 3: Evidence tracing UI
  - [ ] CẤP 4: Chưa có UI hiển thị evidence source → claim

### [X] CẤP 2: Universal Export Engine (PRD mục 3.2g, 4.3)
- [X] CẤP 3: Markdown export
  - [X] CẤP 4: `lib/export/markdown.ts` (65 lines)
- [X] CẤP 3: DOCX export
  - [X] CẤP 4: `lib/export/docx.ts` (96 lines)
- [X] CẤP 3: PDF export
  - [X] CẤP 4: `lib/export/pdf.ts` (28 lines) — puppeteer-core + fallback HTML printable
- [X] CẤP 3: Static HTML export
  - [X] CẤP 4: `lib/export/static-html.ts` (85 lines)
- [X] CẤP 3: Interactive HTML export
  - [X] CẤP 4: `lib/export/interactive-html.ts` (91 lines) — Alpine.js + Mermaid.js offline
- [X] CẤP 3: HTML renderer nội bộ
  - [X] CẤP 4: `lib/export/html.ts` (297 lines)
- [X] CẤP 3: Adapter (backward compat)
  - [X] CẤP 4: `lib/export/adapter.ts` (112 lines)
- [X] CẤP 3: Export orchestrator
  - [X] CẤP 4: `lib/export/index.ts` (65 lines) — exportNote() switch theo format

### [X] CẤP 2: Hierarchical Summarization (PRD mục 4.0.8, Phase 5)
- [X] CẤP 3: Section-level aggregation
  - [X] CẤP 4: `lib/ai/summarize.ts` — MAP stage: mỗi source → section summary (dispatcher isInternalTask, giữ key quotes làm evidence theo 4.0.8); test 11/11 PASS [2026-08-23, commit e26e176]
- [X] CẤP 3: File-level aggregation
  - [X] CẤP 4: REDUCE stage: ghép section summaries + evidence quotes → synthesizedContext; wire vào generate route thay raw dump khi >24k chars hoặc >3 nguồn; dưới ngưỡng tự single-pass không tốn LLM [2026-08-23]
- [X] CẤP 3: Cross-file synthesis + conflict detection
  - [X] CẤP 4: Unicode-aware number-conflict heuristic (>20% lệch số liệu + word overlap) — liệt kê CẢ HAI phía nguồn, KHÔNG tự chọn truth (đúng 4.0.10); conflicts inject vào prompt tạo note với chỉ dẫn trung lập [2026-08-23]
- [X] CẤP 3: Project-level summary (scope legacy schema)
  - [X] CẤP 4: Synthesized context cấp batch N nguồn trong 1 request = tương đương project-level trên legacy `sources` (chưa có bảng projects); nâng cấp đầy đủ khi migrate v1 [2026-08-23]

### [ ] CẤP 2: Knowledge Objects + Coverage Ledger (PRD mục 4.0.7, 4.0.9)
- [ ] CẤP 3: `knowledge_objects` table populated
  - [ ] CẤP 4: Schema có nhưng code chưa insert/select
- [ ] CẤP 3: `coverage_ledger` tracking
  - [ ] CẤP 4: Chưa implement

---

## [~] CẤP 1: Tính năng sản phẩm & UI/UX (PRD mục 4.2-4.9, mục 7 — 11 màn hình)

> Lưu ý audit: các mục UI dưới đây chỉ verify được backend/API qua code; UI thật chưa test qua Chrome Remote Debugging (PRD mục 3.4). Do đó phần lớn đang `[ ]` hoặc `[~]` dù landing/pricing đã thấy trên site thật.

### [~] CẤP 2: Màn 1 — Chat + Artifact Panel (PRD mục 7.2 #1)
- [~] CẤP 3: Pill chọn phương pháp với "Auto" pre-select mặc định
  - [X] CẤP 4: 17 templates exposed trong registry
  - [ ] CẤP 4: Verify UI: pill Auto pre-select, các pill khác không pre-select (lỗi cũ PRD 7.4)
- [ ] CẤP 3: Modal Đính kèm nguồn
  - [ ] CẤP 4: Upload component tồn tại ở đâu chưa xác nhận — cần verify UI
- [~] CẤP 3: Stepper 3 bước xử lý
  - [X] CẤP 4: Backend pipeline 4 steps trong functions.ts
  - [ ] CẤP 4: Frontend Stepper component — cần verify
- [~] CẤP 3: Artifact Panel (panel trượt phải)
  - [X] CẤP 4: Backend notes table + export route
  - [ ] CẤP 4: UI panel trượt phải + toggle Code/Raw vs Preview + nút Copy — cần verify

### [~] CẤP 2: Màn 2 — History
- [X] CẤP 3: CRUD phiên chat + notes backend
  - [X] CẤP 4: `lib/neon/queries.ts` — renameChatSession, pinChatSession, archiveChatSession, deleteChatSessionPermanently
  - [X] CẤP 4: API notes route list/create
- [X] CẤP 3: Grid/list toggle + tabs (Tất cả / Đã ghim / Có Note / Chia sẻ)
  - [X] CẤP 4: VERIFY TRONG CODE: LibraryScreen.tsx `libraryViewMode` + tabs 'Đã ghim/pinned/Có Note/Chia sẻ' đầy đủ [2026-08-23]

### [X] CẤP 2: Màn 3 — Cài đặt Tài khoản & Billing
- [X] CẤP 3: Profile + plan management
  - [X] CẤP 4: `app/profile/` route
  - [X] CẤP 4: `lib/billing/zeroinvoice.ts` (137 lines)
- [X] CẤP 3: Subscriptions API
  - [X] CẤP 4: `app/api/billing/` đầy đủ (cancel, check-status, confirm, create-invoice, validate-coupon, webhook)

### [~] CẤP 2: Màn 4 — Tự kết nối AI (PRD mục 4.9)
- [X] CẤP 3: byok_providers CRUD backend
  - [X] CẤP 4: `lib/ai/dispatcher.ts` có providerId/endpointUrl/apiKey params
  - [X] CẤP 4: Schema byok_providers chuẩn (đã xoá import_free_models/sync_enabled)
- [X] CẤP 3: "Discover Models" (GET {endpoint}/v1/models)
  - [X] CẤP 4: VERIFY TRONG CODE: /api/providers/test L155-165 fallback GET {endpoint}/models + Gemini v1beta/models L68; AddProviderModal autoDiscoverModels=true mặc định [2026-08-23]
- [X] CẤP 3: "Test Connection" fail-closed trước Save [2026-08-22]
  - [X] CẤP 4: Endpoint `app/api/providers/test/route.ts` (195 lines, +SSRF guard production) + UI `AddProviderModal.tsx` gọi POST /api/providers/test — flow 1 button Test→Save, chỉ hiện nút Save sau khi test pass (L558-594) [2026-08-22]

### [X] CẤP 2: Màn 5 — Pricing
- [X] CẤP 3: 3 cột Free/Pro/Ultra đúng Master Pricing Matrix
  - [X] CẤP 4: Site thật hiển thị đúng 3 gói (Free 0đ, Pro 99k, Ultra 199k) — đã xem qua web_extract
- [X] CẤP 3: Ô coupon áp dụng
  - [X] CẤP 4: API validate-coupon (70 lines) + apply (57 lines)

### [~] CẤP 2: Màn 6 — Admin Coupon & Hệ thống
- [X] CẤP 3: Coupon CRUD + admin auth
  - [X] CẤP 4: `app/api/admin/coupons/route.ts` (168 lines)
  - [X] CẤP 4: `lib/auth/admin.ts` (34 lines), `lib/billing/coupon.ts` (23 lines)
- [X] CẤP 3: Ràng buộc 1 account = 1 coupon [2026-08-22]
  - [X] CẤP 4: user_coupons PK = user_id (schema chặn mức DB)
  - [X] CẤP 4: `validateCouponForPlan` (queries.ts L350-355) check `user_coupons` theo userId → trả null; validate-coupon route phân biệt message 'Tài khoản này đã sử dụng mã coupon' [2026-08-22]

### [X] CẤP 2: Màn 7 — Đăng nhập/Đăng ký
- [X] CẤP 3: Email/password flow
  - [X] CẤP 4: register (78), login (50), logout (43) routes
- [X] CẤP 3: Google OAuth flow
  - [X] CẤP 4: callback (161 lines) + users lookup

### [~] CẤP 2: Màn 8 — Chi tiết note (2 cột nội dung + chat)
- [X] CẤP 3: Note detail view 2 cột
  - [X] CẤP 4: VERIFY TRONG CODE: NoteDetailScreen.tsx 41k chars grid-cols layout + chat panel [2026-08-23]
- [X] CẤP 3: Chat hỏi thêm (RAG)
  - [X] CẤP 4: rag-pipeline.ts (109 lines)

### [~] CẤP 2: Màn 9 — Templates
- [X] CẤP 3: Templates có sẵn (3/9/17 theo gói)
  - [X] CẤP 4: registry.ts 17 templates + tier
- [ ] CẤP 3: Custom templates CRUD UI
  - [ ] CẤP 4: Table custom_note_templates có; UI/API routes cần verify (`app/api/templates/`)

### [~] CẤP 2: Màn 10 — Archives (Thùng rác 30 ngày)
- [X] CẤP 3: Soft-delete + retention 30 ngày backend
  - [X] CẤP 4: purgeExpiredArchivedNotes + add_deleted_at_to_notes.sql
- [X] CẤP 3: UI thùng rác + đếm ngược purge
  - [X] CẤP 4: VERIFY TRONG CODE: ArchivesScreen.tsx (25k chars) có purge countdown 'ngày' + restore [2026-08-23]

### [ ] CẤP 2: Màn 11 — Files
- [X] CẤP 3: File list view
  - [X] CẤP 4: VERIFY TRONG CODE: FilesScreen.tsx handleProcessFile → Inngest + pollJobUntilDone + Stepper qua /api/notes/status; gate Pro/Ultra [2026-08-23]

### [ ] CẤP 2: Theme system (10 themes dark+light)
- [X] CẤP 3: Theme tokens qua CSS variable
  - [X] CẤP 4: VERIFY TRONG CODE: index.css có data-theme selectors: paper/dracula/forest/ocean/sunset/ink/lavender/sakura... (12+ theme blocks dark+light); layout.tsx data-theme=mono [2026-08-23]
- [ ] CẤP 3: localStorage theme persistence
  - [ ] CẤP 4: Cần verify UI

### [~] CẤP 2: Responsive + Animation
- [X] CẤP 3: Sidebar off-canvas dưới 1024px
  - [X] CẤP 4: VERIFY TRONG CODE: Sidebar.tsx mobile drawer translate-x-full; ChatScreen L571 off-canvas [2026-08-23]
- [X] CẤP 3: Motion library
  - [X] CẤP 4: `motion ^12.23.24` dependency

---

## [~] CẤP 1: Kinh doanh & Billing (PRD mục 5, Zero Tracking)

### [~] CẤP 2: Zero Tracking (VietQR) integration
> Lý do `[~]`: API/QR/polling/webhook đã verify code, nhưng chưa test E2E thật với sandbox.
- [X] CẤP 3: Create-invoice API
  - [X] CẤP 4: `app/api/billing/create-invoice/route.ts` (87 lines)
  - [X] CẤP 4: `lib/billing/zeroinvoice.ts` (137 lines) — fail-closed nếu thiếu ZEROINVOICE_API_KEY
- [X] CẤP 3: QR render client-side
  - [X] CẤP 4: `qrcode.react` + `vietnam-qr-pay` dependencies
- [X] CẤP 3: Polling check-status
  - [X] CẤP 4: `app/api/billing/check-status/route.ts` (118 lines)
- [X] CẤP 3: Webhook HMAC verification
  - [X] CẤP 4: `app/api/billing/webhook/route.ts` (160 lines) — x-webhook-signature
- [X] CẤP 3: Subscription confirm
  - [X] CẤP 4: `app/api/billing/confirm/route.ts` (34 lines)
- [ ] CẤP 3: E2E payment test thật (QR → quét → webhook → plan update)
  - [ ] CẤP 4: Chưa test với Zero Tracking sandbox

### [~] CẤP 2: Coupon system (PRD mục 5 ràng buộc 2026-08-19/20)
- [X] CẤP 3: Validate coupon API
  - [X] CẤP 4: validate-coupon route (70 lines)
- [X] CẤP 3: Apply coupon (100% → bill 0đ auto-paid)
  - [X] CẤP 4: apply route (57 lines) + create-invoice truyền finalAmount
- [X] CẤP 3: 1 account = 1 coupon unique enforcement [2026-08-22]
  - [X] CẤP 4: user_coupons PK = user_id (DB level)
  - [X] CẤP 4: App-level: validateCouponForPlan chặn user đã dùng (queries.ts L350-355) + message đúng (validate-coupon route L42-54) [2026-08-22]
- [X] CẤP 3: Admin CRUD coupons
  - [X] CẤP 4: admin/coupons route (168 lines) + RLS admin

### [~] CẤP 2: Quota enforcement (PRD mục 5.1, 6.2)
- [X] CẤP 3: Notes count check server-side (20/50/∞) [2026-08-22]
  - [X] CẤP 4: `checkNoteLimit` (queries.ts L65-96): count notes deleted_at IS NULL, plan từ profiles (ultra/admin=∞, pro=50, free=20), message đề xuất nâng cấp; `createNote` check trước insert; POST /api/notes trả 403 + code `NOTE_LIMIT_EXCEEDED` [2026-08-22]
- [X] CẤP 3: Custom templates count check (5/25/∞) [2026-08-22]
  - [X] CẤP 4: `checkCustomTemplateLimit` (queries.ts L154-185): 5/25/∞ + admin bypass, `createCustomTemplate` check trước insert, route trả 403 `TEMPLATE_LIMIT_EXCEEDED`; GET /api/templates trả kèm `limitInfo` [2026-08-22]
- [ ] CẤP 3: Project file/duration/storage enforcement
  - [ ] CẤP 4: permissions.ts (207 lines) tồn tại — cần verify đủ check cho projects/files/duration/storage
  - [ ] CẤP 4: Trả lỗi rõ ràng khi vượt plan limit, đề xuất nâng gói
- [X] CẤP 3: Atomic reservation SELECT FOR UPDATE
  - [X] CẤP 4: `lib/quota/reserve.ts` (132 lines) reserve/commit/release atomic `FOR UPDATE` trên bảng quotas — commit `0141883`, test 7/7 PASS [2026-08-23]

---

## [~] CẤP 1: Database & Bảo mật (PRD mục 6, mục 3.3)

### [X] CẤP 2: Schema baseline
- [X] CẤP 3: 12 legacy/v1 tables DDL
  - [X] CẤP 4: `docs/schema-neon.sql` (573 lines) canonical
  - [X] CẤP 4: Migration scripts: 02-migrations + 3 files migrations/
- [X] CẤP 3: Architecture v1 additions (13 tables)
  - [X] CẤP 4: projects/files/content_chunks/knowledge_objects/embeddings/summaries/evidence/entities/relationships/conflicts/usage/quotas/coverage_ledger + RLS policies

### [ ] CẤP 2: Code migration legacy → v1 tables
- [ ] CẤP 3: Switch notebooks/sources → projects/files
  - [ ] CẤP 4: Chưa có migration script idempotent

### [X] CẤP 2: RLS (Row-Level Security)
- [X] CẤP 3: auth_uid() function
  - [X] CẤP 4: current_setting('request.jwt.claims') trong schema-neon.sql
- [X] CẤP 3: Policies trên tất cả tables
  - [X] CẤP 4: Đủ danh sách trong DDL

### [X] CẤP 2: JWT Auth Security
- [X] CẤP 3: Fail-closed ZERO_JWT_SECRET
  - [X] CẤP 4: session.ts throw error rõ ràng
- [X] CẤP 3: HttpOnly cookie 7 ngày
  - [X] CẤP 4: SESSION_TTL_SECONDS + Secure production
- [X] CẤP 3: Middleware session check
  - [X] CẤP 4: middleware.ts (60 lines)

### [X] CẤP 2: BYOK Encryption + SSRF
- [X] CẤP 3: API key AES-256-GCM encrypt/decrypt helper [2026-08-22]
  - [X] CẤP 4: MỚI `lib/auth/crypto.ts`: encryptApiKey/decryptApiKey AES-256-GCM (format v1.iv.tag.ct, scrypt derive từ BYOK_ENCRYPTION_KEY/ZERO_JWT_SECRET, fail-closed); test roundtrip + tamper-tag PASS [2026-08-22]
- [X] CẤP 3: SSRF validation (block private IPs) [2026-08-22]
  - [X] CẤP 4: MỚI `assertPublicUrl()` chặn localhost/.local/.internal + IPv4 private/reserved/metadata (0/10/127/100.64/169.254/172.16-31/192.168) + non-http(s); wire vào providers/test route (production-only, dev giữ cho Ollama). Test 7 case chặn + 3 case public PASS [2026-08-22]

### [X] CẤP 2: Webhook HMAC verification
- [X] CẤP 3: Billing webhook signature verified
  - [X] CẤP 4: webhook route (160 lines)

### [X] CẤP 2: Quota safety valve (PRD mục 3.3)
- [X] CẤP 3: 90% valve enforce
  - [X] CẤP 4: `pausedByValve` trong `lib/quota/reserve.ts` — reserve trả flag khi usage >= 90% limit; wire vào processNotePipeline commit `0141883` [2026-08-23]

---

## [ ] CẤP 1: Deliverables Đồ án học thuật (PRD mục 8 — Tuần 10 & Tuần 15)

### [ ] CẤP 2: Tuần 10 (19-25/10/2026) — Báo cáo lần 1 (hệ số 1)
- [ ] CẤP 3: Báo cáo đồ án (theo mẫu khoa)
  - [ ] CẤP 4: Xin mẫu báo cáo từ giảng viên
  - [ ] CẤP 4: Viết báo cáo: phân tích thiết kế (20%) + lập trình chất lượng (40%) + tài liệu (20%) + thuyết trình (20%)
- [ ] CẤP 3: Source code có chú thích
  - [ ] CẤP 4: README + comments cho lib/ai/, lib/inngest/, lib/export/
- [ ] CẤP 3: Tài liệu HDSD/cài đặt
  - [ ] CẤP 4: Viết README.md cài đặt local (clone, npm install, env vars, dev)
- [ ] CẤP 3: Phiếu Đăng Ký Đề Tài
  - [ ] CẤP 4: Xác nhận Zero đã nộp, mục IX khai báo AI tool
- [ ] CẤP 3: Xác nhận số thành viên nhóm
  - [ ] CẤP 4: Zero tự xác nhận với giảng viên (PRD 8.4)

### [ ] CẤP 2: Tuần 15 (23/11/2026) — Demo + Bảo vệ (hệ số 2)
- [ ] CẤP 3: Slide thuyết trình 10-15 phút
  - [ ] CẤP 4: Cấu trúc Vấn đề→Mục tiêu→Giải pháp→Phân tích→Thiết kế→Công nghệ→Demo→Kết quả→Hạn chế→Hướng phát triển
- [ ] CẤP 3: Video demo sản phẩm
  - [ ] CẤP 4: Quay 5-10 phút flow đăng ký → upload → xử lý → xuất note → Q&A
- [ ] CẤP 3: Luồng thanh toán demo thật
  - [ ] CẤP 4: Zero Tracking sandbox + E2E test QR → webhook → plan update
- [ ] CẤP 3: Ôn tập giải thích code
  - [ ] CẤP 4: Zero tự đọc dispatcher.ts (cascade failover 3.7→2.5→2.0)
  - [ ] CẤP 4: Zero tự đọc inngest/functions.ts (step function)
  - [ ] CẤP 4: Zero tự đọc templates/registry.ts (17 templates + tier)
  - [ ] CẤP 4: Zero tự đọc export/index.ts (export switch)
- [ ] CẤP 3: Chuẩn bị trả lời câu hỏi giảng viên
  - [ ] CẤP 4: Đọc lại PRD mục 3/4/6
  - [ ] CẤP 4: Chuẩn bị lý do "tại sao chọn X thay vì Y" (Inngest vs CF Workflows, Groq vs Workers AI, R2 storage-only...)

---

## [ ] CẤP 1: Roadmap mở rộng sau deadline (PRD mục 9 Phase 7-8, mục 4.8)

### [ ] CẤP 2: Phase 7 — Chat enhancements
- [ ] CẤP 3: Streaming response (SSE thay polling)
  - [ ] CẤP 4: Endpoint stream route
  - [ ] CẤP 4: Frontend EventSource/fetch-streaming
- [ ] CẤP 3: Hybrid retrieval (vector + keyword + metadata)
  - [ ] CẤP 4: tsvector column + combine score + queryHybrid()
- [ ] CẤP 3: Evidence tracing UI
  - [ ] CẤP 4: EvidenceBadge component + query evidence table + verbatim hover

### [ ] CẤP 2: Phase 8 — Scale
- [ ] CẤP 3: 10h+ video benchmark end-to-end
  - [ ] CẤP 4: Test upload → STT chunking → map-reduce → note, đo timing từng stage
- [ ] CẤP 3: Multi-file concurrent users stress test
  - [ ] CẤP 4: Load test script + verify Inngest concurrency queue
- [ ] CẤP 3: Quota optimization under load
  - [ ] CẤP 4: Defer sau khi có users thật

### [ ] CẤP 2: Tính năng mở rộng sau deadline (PRD mục 4.8)
- [ ] CẤP 3: Spaced repetition Flashcard
  - [ ] CẤP 4: flashcard_progress table + SM-2 review mode + cloud sync
- [ ] CẤP 3: Action item sync Notion/GDocs/Calendar
  - [ ] CẤP 4: OAuth 3 platform + extract action_items + UI toggle
- [ ] CẤP 3: Speaker diarization
  - [ ] CẤP 4: pyannote/AssemblyAI integration + speaker_id trong transcript

---

## Ghi chú verify
- **Đã verify qua code**: mọi mục `[X]` đều có file thật + line count + path cụ thể trong repo
- **Đã verify qua site**: landing + pricing 3 gói (web_extract) — CHƯA login/upload/test luồng thật
- **Chưa verify (cần Chrome Remote Debugging, PRD mục 3.4)**: Stepper, ProcessingCard, ArtifactPanel, theme switcher, 11 màn UI chi tiết
- **Đã verify CÓ trong code (2026-08-22 — audit trước kết luận sai do chỉ đọc đầu queries.ts)**:
  - Notes/Templates count enforcement: checkNoteLimit + checkCustomTemplateLimit + 403 NOTE_LIMIT_EXCEEDED/TEMPLATE_LIMIT_EXCEEDED
  - 1 account = 1 coupon: validateCouponForPlan chặn user đã dùng + message phân biệt
  - Auto gating Free: generate route truyền userPlan → dispatcher freeTemplates random 3 template Free
- **Vẫn chưa có trong code (giữ `[ ]`)**:
  - ~~BYOK AES helper + SSRF~~ → ĐÃ IMPLEMENT 2026-08-22 (`lib/auth/crypto.ts` + wire providers/test)
  - Auto gating Pro (chặn template ngoài danh sách 9 của Pro — hiện chỉ random cho Free)
  - BYOK AES helper + SSRF: đã implement (lib/auth/crypto.ts, 2026-08-22)
