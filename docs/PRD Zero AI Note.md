# PRD Zero AI Note

> **Phiên bản hợp nhất & cập nhật toàn diện — align Architecture v1 (2026-08-21, đơn giản hoá 2026-08-22)**.
>
> File `PRD_Zero_AI_Note.md` này là canonical DUY NHẤT (single-file), không còn tách file ADR/spec riêng — mọi kiến trúc, đặc tả tính năng, schema DDL và pipeline đều nằm trọn trong file này.
>
> Website ghi chú AI dạng chat (kiểu Gemini/ChatGPT), nhận file dài đa định dạng (video/audio/PDF/slide/ảnh/text/link), xuất note theo phương pháp học thuật cụ thể (Cornell, Outline, Q&A...) đồng thời dưới nhiều định dạng (Markdown/DOCX/PDF/HTML) ngay trong cuộc trò chuyện. **Vừa là sản phẩm thương mại dài hạn (không deadline), vừa là đồ án môn học có deadline thật — xem mục 8 để biết bối cảnh và ưu tiên tương ứng.**

## Canonical Architecture Reference

| Doc | Purpose |
|---|---|
| **`docs/PRD Zero AI Note.md`** | **Canonical — Product + Architecture + Pipeline + Schema + Migration (file này)** |
| `docs/schema-neon.sql` | Database DDL (canonical) |
| `TODO.md` | Checklist tiến độ 4 cấp, đối chiếu thực tế repo + site (cập nhật liên tục) |

---

## Mục lục

1. [Định vị sản phẩm](#1-định-vị-sản-phẩm)
2. [Đối tượng người dùng](#2-đối-tượng-người-dùng)
3. [Kiến trúc kỹ thuật](#3-kiến-trúc-kỹ-thuật)
   - [3.2c Tách biệt 2 Engine AI & Dynamic Runtime Identity](#32c-tách-biệt-tuyệt-đối-2-engine-ai--dynamic-runtime-identity-2026-08-21)
   - [3.2d Map-Reduce 2 Tầng](#32d-map-reduce-2-tầng-cho-file-dài)
   - [3.2e RAG pgvector](#32e-rag-chat-với-neon-pgvector-source_embeddings)
   - [3.2f Template Registry](#32f-config-driven-template-registry-libtemplatesregistryts)
   - [3.2g Export Engine](#32g-universal-block-based-export-engine-libexport)
4. [Đặc tả tính năng](#4-đặc-tả-tính-năng)
   - [4.1 Xử lý đầu vào (Ingestion)](#41-xử-lý-đầu-vào-ingestion)
   - [4.1b Tách luồng: Chat thường vs Xử lý file đính kèm](#41b-tách-luồng-chat-thường-vs-luồng-xử-lý-file-đính-kèm-nguyên-tắc-bảo-vệ-context-window)
   - [4.2 Điều khiển output](#42-điều-khiển-output)
   - [4.3 Artifact Panel, Preview & Xuất file](#43-artifact-panel-xem-trước-preview--xuất-file)
   - [4.4 Tổ chức & lưu trữ](#44-tổ-chức--lưu-trữ)
   - [4.5 UX xử lý file dài](#45-ux-xử-lý-file-dài)
   - [4.6 Giữ chân người dùng](#46-giữ-chân-người-dùng)
   - [4.7 Quy trình AI chat thông minh](#47-quy-trình-ai-chat-thông-minh-đã-implement-2026-08-20)
   - [4.8 Tính năng mở rộng](#48-tính-năng-mở-rộng-ưu-tiên-thấp-hơn-làm-sau)
   - [4.9 Tự kết nối AI / Nhà cung cấp AI](#49-tự-kết-nối-ai--nhà-cung-cấp-ai-trước-đây-byok--bring-your-own-api-key)
5. [Mô hình kinh doanh & Bảng giá](#5-mô-hình-kinh-doanh--bảng-giá)
6. [Database Schema](#6-database-schema)
7. [UI/UX](#7-uiux)
8. [Bối cảnh Đồ án Chuyên ngành](#8-bối-cảnh-đồ-án-chuyên-ngành)
9. [Roadmap](#9-roadmap)
10. [Cần chốt trước khi build](#10-cần-chốt-trước-khi-build)
11. [Lịch sử thay đổi](#11-lịch-sử-thay-đổi)

---

## 1. Định vị sản phẩm

**Vấn đề cốt lõi**: các chatbot phổ thông (Gemini, ChatGPT, Claude, DeepSeek, Grok) về mặt kỹ thuật không nhận nổi file dài nhiều giờ, và không có khái niệm xuất file layout chuyên nghiệp. Các app ghi chú AI hiện có (Otter, Fireflies, Fathom, tl;dv, Granola) đều thiết kế quanh **cuộc họp trực tiếp** (bot tham gia call), không phải file đã ghi sẵn. NotebookLM là đối thủ gần nhất về tinh thần "học tập" nhưng đầu ra là Q&A/audio overview, không phải note có bố cục học thuật cụ thể xuất file sẵn sàng nộp/lưu trữ.

**5 trụ cột khác biệt (kết hợp cùng lúc, không phải từng cái riêng lẻ)**:
1. Nhận file dài đã ghi sẵn (hàng chục giờ), không bắt buộc là sự kiện trực tiếp
2. Đa định dạng cùng lúc trong 1 request (video+audio+PDF+slide+text+link)
3. Template học thuật cụ thể (Cornell 2 cột, Outline, Q&A, Flashcard...) — không chỉ tóm tắt chung chung
4. Xuất file layout chuẩn (DOCX/PDF có bảng, không phải markdown thô)
5. Tối ưu tiếng Việt-Anh, kể cả code-switching

**Không phải trọng tâm**: mind map/biểu đồ trực quan — NotebookLM đã có, đây chỉ là tính năng bắt kịp (parity), không phải lợi thế cạnh tranh.

---

## 2. Đối tượng người dùng

Sinh viên/giáo viên xử lý bài giảng dài, người đi họp cần ghi chú chuẩn để nộp/lưu trữ, nhà nghiên cứu tổng hợp nhiều nguồn tài liệu — ưu tiên thị trường Việt Nam nhưng hỗ trợ đa ngôn ngữ đầu ra.

---

## 3. Kiến trúc kỹ thuật

> Mục này đặc tả kiến trúc kỹ thuật đầy đủ — không cần tham chiếu file ngoài.

### 3.0 Architecture v1 — 10 nguyên tắc bất biến

| # | Principle | Mô tả |
|---|---|---|
| 1 | **Server-side AI** | AI inference chạy cloud qua Inngest worker (Gemini API / BYOK). Browser KHÔNG chạy Whisper/LLM local làm pipeline chính |
| 2 | **Multi-file Project** | 1 Project = logical unit chứa nhiều source file (video, audio, DOCX, PPTX…) |
| 3 | **Async & Durable** | Heavy processing chạy qua Inngest worker. Không sync Vercel function. Mỗi step ≤300s (Vercel Hobby + Fluid Compute) |
| 4 | **Resumable & Retryable** | Mỗi job có checkpoint. Partial failure ≠ restart project |
| 5 | **Idempotent** | Idempotency key = `project_id + file_id + chunk_id + job_type + model_version + prompt_version` |
| 6 | **RAG + Hierarchical** | Vector similarity chỉ là 1 retrieval signal. Knowledge Base qua Hierarchical Multi-Stage Map-Reduce |
| 7 | **Evidence-First** | Mọi claim trace về source location (timestamp / slide / page). Evidence = product feature, không phải debug metadata |
| 8 | **Model-Agnostic** | `LLMProvider`, `TranscriptionProvider`, `EmbeddingProvider` abstraction. Không hardcode model ID |
| 9 | **Quota-Aware** | Free tier có hard quota. 90% safety valve → queue/pause/upgrade. Không auto-charge |
| 10 | **Free-Tier Honest** | "Free" = free cho end user trong system quota. Operator tối ưu trong provider free tier. KHÔNG "unlimited free compute" |

### 3.1 Tech stack

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Frontend | Next.js (App Router) trên **Vercel** | Quen thuộc, free tier đủ dùng đầu. **Ràng buộc**: Request Payload ≤ 4.5MB, Serverless function timeout 10–300s (Fluid Compute) — mọi upload lớn và xử lý nặng KHÔNG đi qua sync request (xem mục 4.1) |
| API Layer | Next.js API Routes (cùng Vercel project) | Auth, Authorization, Upload session, Signed URL, Job creation, Workflow trigger, Webhook, Status API, Streaming chat. **Không tách Cloudflare Workers** (xem "Đã cân nhắc và loại bỏ") |
| Object Storage | **Cloudflare R2** (S3-compatible) | Raw sources + derived assets + exports. Free tier 10 GB-month, 1M Class A, 10M Class B, free egress. **Ràng buộc**: CHỈ dùng làm storage (raw sources + exports), KHÔNG dùng Cloudflare Workers/Workflows để xử lý — mọi compute chạy qua Inngest worker phía Vercel. KHÔNG coi là storage miễn phí vô hạn — phải có retention policy (xoá file media >500MB ngay sau xử lý, xem mục 3.3) |
| Database | **Neon PostgreSQL** | Serverless, RLS-compatible. Neon = source of truth cho relational records + embeddings |
| Vector DB | **pgvector** (extension trên Neon) | Semantic retrieval, similarity search, RAG. **Không** coi là source of truth — vẫn là relational records + source references |
| ORM | **Drizzle ORM** (duy nhất) | Type-safe, Neon serverless driver |
| Auth | **JWT tự phát hành** (`jose` + `bcryptjs`), HttpOnly cookie 7 ngày | Fail-closed khi thiếu `ZERO_JWT_SECRET`. Email/password + Google OAuth (`google-auth-library` signature-verified) |
| Job nền / Orchestration | **Inngest** (chạy trên Vercel qua route `/api/inngest`) | Durable execution, retries, checkpoints, step function. Mỗi step giới hạn theo Vercel Function timeout — Hobby (free) tối đa 300s nếu bật **Fluid Compute** (mặc định chỉ 10s nếu chưa bật). File lớn → chia step nhỏ hơn (đọc R2 qua HTTP Range Request theo từng đoạn). Free Gemini key: queue 1–2 job/shared. Concurrency limit tránh `429 Resource Exhausted`. Free tier Inngest: 5 concurrent steps |
| AI — System Pool | **STT (transcribe)**: chỉ Gemini API (cascade 3.7→2.5→2.0 Flash), dùng CHUNG cho mọi user bất kể BYOK nào được chọn cho chat/note-generation. **Text (Chat Assistant + Note Generator)**: cascade Gemini 3.7→2.5→2.0 Flash → fallback cuối **OpenRouter free** (`openrouter/free` auto-router, KHÔNG hardcode model ID cụ thể vì roster free đổi liên tục) khi cả 3 tầng Gemini đều 429/quota hết | STT tách biệt hoàn toàn khỏi lựa chọn BYOK của user — transcribe là hạ tầng ngầm, xong mới chuyển text sạch cho model user chọn. OpenRouter free chỉ là van xả cuối cùng (20 RPM/50 req/ngày CHUNG toàn tài khoản) cho 2 engine text, không dùng cho STT vì OpenRouter free không có model Whisper |
| AI — BYOK / Tự kết nối AI | 8 providers (Google, OpenAI, Anthropic Claude, OpenRouter, Groq, NVIDIA NIM, Local Ollama, Custom Endpoint OpenAI-compatible) | User API key riêng, BYOK bypass system quota. Dynamic runtime identity inject vào system prompt |
| Billing | **Zero Tracking** (`zeroinvoice-silk.vercel.app`) — project riêng dùng Supabase | Tạo bill `POST /api/bills` (amount locked), QR render client-side `qrcode.react` (EMVCo VietQR payload), 30-min expiry. Polling `/api/billing/check-status` 2.5s + webhook HMAC-SHA256 verified (`x-webhook-signature`) |
| Email | **Resend** (free tier 3.000 mail/tháng) | Notification khi Note xong |
| Tools — Chat Assistant | Tavily (web_search, free 1.000 credit/tháng) + Open-Meteo (get_weather, free không cần key, 10k call/ngày) | Function-calling chuẩn, đồng nhất mọi BYOK provider qua dispatcher.ts |

**Đã cân nhắc và loại bỏ**:
- **Supabase** (cả Auth + Storage): free tier giới hạn 2 project hoạt động cùng lúc — vượt giới hạn ở thời điểm triển khai
- **Neon Auth**: đã cân nhắc (ra mắt 2026, nâng cấp lớn 8/2026, miễn phí tới 60.000 MAU) nhưng quyết định dùng JWT tự phát hành cho gọn vendor
- **Neon Object Storage**: từng cân nhắc (mới ra mắt 8/2026, Beta, S3-compatible) nhưng ràng buộc chỉ vùng `us-east-2`, chỉ bật cho project MỚI → chọn R2 làm backup
- **Google Cloud Run** (tính phí theo giây CPU không hợp workload xử lý file dài liên tục)
- **Render** (Background Worker không miễn phí, từ $7/tháng)
- **Netlify** (không có lợi thế riêng so với Vercel)
- **Cloudflare Workers làm API layer riêng**: free tier chỉ 10ms CPU/request — quá chặt cho logic auth/query DB thực tế, dễ lỗi ngẫu nhiên khi vượt; Next.js API Routes trên Vercel đã đủ dùng, không cần tách layer
- **Cloudflare Workflows + Queues**: chạy song song với Inngest tạo 2 hệ durable-execution riêng biệt, tăng gấp đôi độ phức tạp vận hành/debug mà không có nhu cầu kỹ thuật bắt buộc; số liệu free tier (50k concurrent/2M queued) chưa verify được từ nguồn chính chủ
- **Cloudflare Stream làm MediaProcessor Primary**: tốn phí thật ($5/1.000 phút lưu), mâu thuẫn mục tiêu free 100%; External FFmpeg qua Inngest (đã dùng ổn từ trước) đủ đáp ứng nhu cầu, miễn phí hoàn toàn
- **Cloudflare Workers AI (Whisper)**: dư thừa khi đã có Gemini làm STT đủ dùng; giảm 1 provider cần tích hợp/monitor quota
- **OpenRouter free thay Groq cho STT**: KHÔNG khả thi — catalog free của OpenRouter không có model Whisper/STT nào, chỉ có model text-completion; không giải quyết được bài toán transcribe audio
- **Groq Whisper làm STT pool #2**: bỏ vì Zero hiện không lấy được API key (không phải vấn đề kỹ thuật) — thay bằng dồn STT về Gemini duy nhất, đơn giản hoá thêm 1 bước

### 3.2 Luồng xử lý chính (Architecture v1)

```
User gửi file/link/text + (tùy chọn) chỉ định phương pháp
  → Nếu thiếu: AI hỏi lại (Engine A, chỉ sau khi có nguồn)
  → Tạo Job Manifest + Inngest job instance
  → Khởi chạy stage 0 (Media / Document Processing)
  → Khởi chạy stage 1 (ASR / Parsing)
  → Khởi chạy stage 2 (Chunk-Level Knowledge Extraction)
  → Khởi chạy stage 3-5 (Section → File → Cross-File Summarization)
  → Khởi chạy stage 6 (Note Generation - Engine B)
  → Sinh content_structured (Block-based JSON chuẩn)
  → Trình duyệt Polling /api/notes/status/:jobId mỗi 2.5 giây
  → Frontend hiển thị Stepper 3 bước + sub-progress (In-app + email Resend khi xong)
```

**Nguyên tắc**: Preview (HTML) và file tải (MD/DOCX/PDF/HTML) đều sinh từ một nguồn `content_structured` duy nhất.

### 3.2b Luồng xử lý file dài (Video/Audio 10–25h)
Xử lý nặng chạy trên Inngest worker bất đồng bộ (không tại Vercel sync request / client):
1. **Direct upload → R2**: Trình duyệt đẩy thẳng file gốc lên Cloudflare R2 qua Signed URL.
2. **Inngest job trigger → MediaProcessor (InngestFFmpeg)**: Demux luồng audio bằng `ffmpeg -c:a copy` (streaming copy, KHÔNG re-encode) + segment thành chunk 30–60 phút (overlap 10–15s + silence detection) ghi lên R2. File gốc lớn khiến 1 lần tải+demux vượt 300s → đọc theo HTTP Range Request từng đoạn nhỏ, mỗi đoạn 1 Inngest step riêng (fan-out), để nằm trong giới hạn timeout 300s của Vercel Function (Hobby + Fluid Compute).
3. **Keyframes**: Chạy scene-change detection theo từng segment 30-60p, gán timestamp cộng dồn.
4. **ASR / Transcription**: Mọi transcribe — bất kể user chọn BYOK nào (Gemini/OpenAI/Claude/khác) để xử lý chat/note-generation phía sau — đều LUÔN chạy qua Gemini API key dùng chung của hệ thống ở bước STT này. Lý do: transcribe là hạ tầng ngầm tách biệt khỏi lựa chọn model của user, không cần khớp. Sau khi có transcript sạch, mới chuyển tiếp cho model user đã chọn xử lý cấu trúc hoá/chat (mục 3.2c).
5. **Map-Reduce 2 tầng**: Ghép transcript có timestamp (Tầng 1) → Chia section 3k-5k từ → Note Generator sinh Local Blocks → Reduce gộp thành Global Note (Tầng 2).
6. **RAG pgvector**: Chunk transcript (400 từ) → Embed → Lưu `source_embeddings`. Câu hỏi sau đó trong chat query Cosine similarity Top-K chunks đưa vào context Chat Assistant (tiết kiệm 95% token).

### 3.2c Tách biệt tuyệt đối 2 Engine AI
1. **Chat Assistant Engine (Engine A)**: Q&A, trò chuyện tự nhiên. Dynamic Identity (nhận diện động provider/model từ session/`byok_providers`, không hardcode).
2. **Note Generator Engine (Engine B)**: Headless JSON Generator (không chào hỏi, JSON Universal Block Schema, Zod validation + Auto-repair loop max 2 retries).

**Tool-calling Chat Assistant (2026-08-23)**: Engine A có 2 tool chuẩn function-calling, hoạt động đồng nhất mọi provider qua `lib/ai/dispatcher.ts` + `lib/ai/tools/`:
- **`web_search(query)` — Tavily**: tin tức/sự kiện/giá cả thời gian thực. Free 1.000 credit/tháng (đã verify tavily.com/pricing), key server-side `TAVILY_API_KEY`. Guard quota: đếm `usage` operation=`tavily_search` trong tháng, gần chạm 1.000 → agent trả lời "không thể tra cứu web lúc này" thay vì lỗi cứng.
- **`get_weather(location)` — Open-Meteo**: geocode → forecast 2 bước, không cần key. Map WMO weather_code sang tiếng Việt (`wmoToVietnamese`). License non-commercial (10k call/ngày) — chấp nhận giai đoạn đồ án, xem lại khi thương mại hoá.
- **System prompt** (`lib/ai/prompts/chat-assistant.ts`): trả lời tự nhiên mọi input trước tiên như chat assistant thông thường; danh tính inject runtime từ provider đang chạy; chỉ vào luồng tài liệu/note khi có file đính kèm HOẶC user chủ động hỏi về note của họ; model tự quyết gọi tool (chỉ khi cần dữ liệu thời gian thực — tiết kiệm quota Tavily dùng chung).
- **Agent loop** (`lib/ai/tools/agent-loop.ts`, max 3 rounds): map tool schema đúng format từng provider — Gemini `functionDeclarations` (@google/genai SDK), OpenAI-compatible `tools` (OpenAI/Groq/OpenRouter/NVIDIA/Local), Anthropic `tools`; execute JS thuần rồi trả kết quả cho model vòng sau.

**Cascade chung 2 engine (qua `lib/ai/dispatcher.ts`)**: Gemini 3.7→2.5→2.0 Flash → Tầng 4 (last-resort, chỉ khi cả 3 tầng Gemini 429/quota hết): **OpenRouter free** qua alias `openrouter/free` (auto-router nội bộ của OpenRouter, tự chọn model free còn khả dụng — KHÔNG hardcode model ID vì danh sách free rotate liên tục, tránh vỡ khi 1 model bị gỡ). ⚠️ Lưu ý rủi ro riêng cho Note Generator (Engine B): model open-weight qua OpenRouter free độ tin cậy JSON schema thấp hơn Gemini Flash — dựa vào `repair-loop.ts` (auto-repair, max 2 retries, đã có sẵn) làm lưới an toàn. Chat Assistant (Engine A) rủi ro thấp hơn vì output tự do, không strict schema. OpenRouter free KHÔNG dùng cho STT (catalog free không có model Whisper/STT).

### 3.2d Hierarchical Multi-Stage Map-Reduce (6 Stages)
- Stage 0: Media / Document Processing
- Stage 1: ASR / Parsing
- Stage 2: Chunk-level Knowledge Extraction
- Stage 3: Section-level Aggregation
- Stage 4: File-level Aggregation
- Stage 5: Cross-file Synthesis
- Stage 6: Project Note Generation

### 3.2e RAG & pgvector Architecture
- Vector embedding (pgvector Cosine similarity) + Keyword (tsvector) + Metadata + Hierarchy-aware.
- Context window independence: RAG vẫn hoạt động với cả 1M context để giảm cost, latency và tăng evidence precision.

### 3.2f Config-Driven Template Registry
Xem chi tiết tại **`lib/templates/registry.ts`**.
- 17 templates tập trung, loại bỏ `if/else` hoặc `switch/case` trên tên template.

### 3.2g Universal Block-Based Export Engine
- 7 block types cơ bản. 1 bộ renderer duy nhất xuất MD, DOCX, PDF, Static HTML, Interactive HTML.

### 3.3 Bảo mật, Vận hành & Quota Policy (Safety Valve)
- **Row-Level Security (RLS)**: Neon `auth_uid()` dựa trên `request.jwt.claims`.
- **BYOK URL validation**: SSRF validation (chặn private IP, localhost).
- **Billing fail-closed**: Webhook HMAC verified.
- **Quota Safety Valve**: Ở ngưỡng 90% daily quota → tạm dừng nhận job mới, báo user chờ reset hoặc chuyển sang "Tự kết nối AI".
- **Atomic Quota Reservation**: Tránh race condition khi nhiều job chạy song song.
- **Retention cleanup**: Xoá file media >500MB ngay sau khi xử lý thành công để tiết kiệm R2 quota.

### 3.4 Công cụ phát triển — Chrome Remote Debugging (Windows)

Dùng cho **Hermes `browser_exec`** để điều khiển Chrome thật (đọc trang client-rendered, kiểm tra giao diện, kiểm tra luồng thanh toán). Khi browser-harness báo *"opened chrome://inspect/#remote-debugging — ask the user to click Allow"*, nghĩa là Chrome chưa chạy với cờ remote-debugging và/hoặc chưa bấm Allow.

**Bước 1 — Đóng hết Chrome:**
- Task Manager (`Ctrl+Shift+Esc`) → tab Processes → chọn từng `chrome.exe` → **End task** cho hết.

**Bước 2 — Khởi động Chrome có cờ remote-debugging:**
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --user-data-dir="C:\chrome-debug-profile"
```
> Mẹo: tạo shortcut Desktop rồi thêm các cờ này vào ô **Target** (Properties) để 1-click mở lần sau — không ảnh hưởng hồ sơ Chrome bình thường vì dùng `--user-data-dir` riêng.

**Bước 3 — Xác nhận đã bật:** mở `http://localhost:9222/json/version` → thấy JSON có `webSocketDebuggerUrl` là OK.

**Bước 4 — Bấm Allow:** lần đầu Hermes kết nối, Chrome hiện popup **"Allow remote debugging?"** (góc trên phải) — tick checkbox + bấm **Allow**. Lần đầu có thể có **2 popup Allow** (một cho kết nối đầu tiên, một mỗi lần connection mới) — bấm Allow hết. Sau đó Hermes điều khiển được Chrome.

---

## 4. Đặc tả tính năng

### 4.0 Project & Job Model (Architecture v1)

#### 4.0.1 Project — Multi-file processing unit
Một Project = logical unit chứa nhiều source file. Mỗi Project có:
```json
{
  "project_id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "status": "queued|running|completed|failed|partial",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

Mỗi File:
```json
{
  "file_id": "uuid",
  "project_id": "uuid",
  "filename": "string",
  "mime_type": "string",
  "size_bytes": "number",
  "duration_seconds": "number",
  "status": "pending|processing|completed|failed",
  "r2_key": "string",
  "processing_progress": "0-100"
}
```

#### 4.0.2 Job Model
Mọi processing biểu diễn dưới dạng job/step. **Job type baseline** (Architecture v1):
```
UPLOAD_FINALIZE          — Hoàn tất upload R2 + tạo record
INSPECT_FILE             — Validate mime, duration, size, hash
EXTRACT_MEDIA            — MediaProcessor: video→audio hoặc chuẩn hoá audio
CREATE_AUDIO_CHUNKS      — Segment 30-60p + overlap
TRANSCRIBE_CHUNK         — Whisper/Gemini STT
PARSE_DOCX               — DOCX parser (giữ heading/list/table)
PARSE_PPTX               — PPTX parser (slide-by-slide)
NORMALIZE_CONTENT        — Đưa về Normalized Content model
EXTRACT_KNOWLEDGE        — Knowledge Object per chunk
CREATE_EMBEDDING         — Vector embedding (pgvector)
CREATE_SECTION_SUMMARY   — Section-level aggregation
CREATE_FILE_SUMMARY      — File-level aggregation
CROSS_FILE_ANALYSIS      — Cross-file synthesis + conflict detection
CREATE_PROJECT_NOTES     — Note generation (Engine B)
```

Mỗi Job:
```json
{
  "job_id": "uuid",
  "project_id": "uuid",
  "file_id": "uuid",
  "chunk_id": "uuid (optional)",
  "job_type": "string",
  "status": "queued|running|retrying|completed|failed|cancelled",
  "attempt": "integer",
  "priority": "integer",
  "idempotency_key": "hash(project_id+file_id+chunk_id+job_type+model_version+prompt_version+schema_version)",
  "created_at": "timestamptz",
  "started_at": "timestamptz",
  "completed_at": "timestamptz",
  "error": "string"
}
```

#### 4.0.3 Idempotency
Retry an toàn. Nếu `idempotency_key` đã có `completed` result → reuse/cache thay vì chạy lại.

#### 4.0.4 MediaProcessor Abstraction (ADR-002)
Không hard-code media processing vào một vendor duy nhất. Định nghĩa interface:
```
MediaProcessor
├── inspect()         — Validate file
├── extractAudio()    — Video → audio
├── createSegments()  — 30-60 phút
├── getStatus()
└── handleFailure()
```

**Implementations**:
- **InngestFFmpegProcessor** (duy nhất, chạy trên Inngest worker phía Vercel): `ffmpeg -c:a copy` streaming copy, không re-encode, segment 30-60p. Đọc file gốc từ R2 qua HTTP Range Request theo đoạn nhỏ để nằm trong giới hạn 300s/step. 100% free (không phụ thuộc Cloudflare Stream).

Không cần selection logic — chỉ 1 implementation. Giữ interface `MediaProcessor` (ADR-002) để dễ mở rộng sau này nếu cần processor khác.

Nếu processor không khả dụng → `queue | pause | require_upgrade`. **Không auto-charge**.

#### 4.0.5 Normalized Content Model
Mọi source type normalize về một model chung trước khi chunking:
```typescript
interface NormalizedContent {
  project_id: string;
  source_id: string;
  source_type: "video" | "audio" | "docx" | "pptx";
  location: LocationMetadata;  // start_time/end_time | page | slide
  heading?: string;
  text: string;
}
```

Ví dụ:
- **Video**: `location: { start_time: 5420, end_time: 5480 }`
- **DOCX**: `location: { page: 8, section: "Methodology" }`
- **PPTX**: `location: { slide: 12 }`

DOCX giữ heading/section/paragraph/table/list; PPTX giữ slide_number/speaker_notes/tables. Không flatten thành plain text.

#### 4.0.6 Chunking Layer
Mỗi NormalizedContent → Chunk với token_count, chunk_id, location metadata. **Strategy khác nhau theo source type**:
- Video: time + sentence + semantic boundary (~400 từ)
- DOCX: heading/paragraph/semantic
- PPTX: slide hoặc grouped slides

#### 4.0.7 Knowledge Object
Mỗi chunk tạo structured Knowledge Object (không chỉ summary):
```typescript
interface KnowledgeObject {
  summary: string;
  facts: string[];
  topics: string[];
  entities: Array<{ name: string; type: string; normalized_form?: string }>;
  numbers: string[];
  dates: string[];
  decisions: string[];
  action_items: string[];
  questions: string[];
  quotes: string[];
}
```

Knowledge extraction cố gắng giữ information quan trọng thay vì chỉ prose summary.

#### 4.0.8 Source of Truth (Hierarchical)
```
Raw source          → Source of truth
Knowledge Object    → Structured representation
Summary             → Compression (chỉ là derived view)
```
Không flatten summary→summary→summary mà mất evidence. Mọi summary phải truy ngược được raw source.

#### 4.0.9 Coverage Ledger
Mỗi chunk track pipeline coverage:
```
transcribed | parsed | normalized | knowledge_extracted |
embedded | section_included | file_included | project_included
```
Project chỉ `READY` khi required pipeline coverage đạt threshold (per Architecture v1).

#### 4.0.10 Conflict Detection (Cross-File)
Ví dụ:
```
Video A: CAC = $20
Video B: CAC = $18
PPT:     CAC = $15
DOCX:    CAC = $20
```
Hệ thống tạo Conflict record:
```typescript
interface Conflict {
  conflict_id: string;
  topic: string;
  sources: Array<{
    source_id: string;
    location: LocationMetadata;
    claim: string;
    evidence: string;
  }>;
  resolution: "unresolved" | "user_decided" | "most_authoritative";
}
```
**Không tự ý chọn một value làm truth** nếu sources conflict.

#### 4.0.11 Entity Normalization
Normalize entity (OpenAI / Open AI / OpenAI Inc.) và acronym (CAC = Customer Acquisition Cost) khi confidence đủ cao. **Không cần Graph Database ở MVP** — PostgreSQL là entity/relationship layer ban đầu.

#### 4.0.12 Context Window Independence
Pipeline RAG + Hierarchical xử lý project 700k+ tokens với model 128K context. Large context (1M) là capability, không phải architecture requirement — RAG vẫn cần để giảm latency, cost, tăng evidence precision.

### 4.1 Xử lý đầu vào (Ingestion)
- Nhận nhiều file/định dạng cùng lúc trong 1 request (video, audio, ảnh, PDF, slide, text paste)
- Xử lý file dài hàng chục giờ/phiên qua kiến trúc chunk + map-reduce (giới hạn hào phóng nhưng thật — không theo hướng "không giới hạn TB", vừa phi thực tế về hạ tầng vừa mâu thuẫn với mục tiêu chính xác)
- Timestamp-linking: note liên kết ngược về đúng khoảnh khắc trong file gốc
|- Đối chiếu song song slide + audio theo thời điểm
|- Tự nhận diện ngôn ngữ + xử lý code-switching Việt-Anh
|- Kiến trúc transcribe-trước-cấu trúc-sau (2 pha), cho phép audit lại khi nghi ngờ sai sót
|- Tách giọng theo người nói (speaker diarization) — mở rộng cho use case họp sau này
|- Nhận link website (reader-mode) và YouTube (ưu tiên caption có sẵn; YouTube không có caption → unsupported, không tải audio server-side vì CORS + IP-block cloud)
|- Tự động phân loại & gộp nhiều file rời rạc thành 1 bộ note liền mạch (có xác nhận lại từ user, AI không tự quyết định gộp mà không hỏi)
|- **STT hợp nhất về Gemini (2026-08-22, thay cho "STT pool đa nguồn" 2026-08-21)**: Toàn bộ transcribe chạy qua Gemini API key dùng chung của hệ thống cho mọi user, bất kể BYOK nào được chọn cho chat/note-generation (transcribe là hạ tầng ngầm, tách biệt khỏi lựa chọn model của user). Groq Whisper pool #2 đã bỏ (không lấy được API key — xem mục 3.1 "Đã cân nhắc và loại bỏ"); OpenRouter free không thay được cho STT vì catalog free không có model Whisper/STT.

### 4.1b Tách luồng: Chat thường vs Luồng xử lý file đính kèm (nguyên tắc bảo vệ Context Window)

**Nguyên tắc cốt lõi**: AI (model chat) KHÔNG BAO GIỜ nhận trực tiếp file thô (video/audio/PDF/slide/ảnh) vào context/prompt. Mọi file đều được HỆ THỐNG BACKEND xử lý triệt để trước (transcribe/trích xuất → text sạch qua pipeline mục 3.2/3.2b), AI chỉ tiếp nhận text đã qua xử lý. Đây là lý do bắt buộc của kiến trúc pipeline mục 3.2b: (1) tránh AI phải tự "nuốt" file dài hàng giờ trong 1 lần gọi — cực tốn token + rủi ro vượt context window dù model hỗ trợ 1M token, (2) giữ trải nghiệm chat mượt như ChatGPT/Gemini cho tin nhắn KHÔNG đính kèm file — đây là hệ thống chat AI bình thường trước tiên, pipeline file chỉ là lớp xử lý ngầm phía sau khi cần.

**Luồng A — Chat thường (không đính kèm file)**:
- Tin nhắn text thuần → gọi thẳng AI model (Gemini mặc định hoặc model user chọn qua Tự kết nối AI) → trả lời ngay như chatbot thông thường, KHÔNG qua Inngest/job nền, latency thấp.
- Đây là luồng MẶC ĐỊNH, chiếm đa số tương tác hàng ngày (hỏi đáp, chat tiếp theo nguồn đã có ở mục 4.6, chỉnh sửa note, trò chuyện thường).

**Luồng B — Có đính kèm 1 hoặc NHIỀU file cùng lúc**:
1. Hệ thống phát hiện attachment(s) trong tin nhắn → KHÔNG gọi AI ngay — chuyển sang chế độ xử lý nền (enqueue Inngest, đúng luồng mục 3.2).
2. Hiển thị NGAY một "Processing Card" — dạng bong bóng tin nhắn hệ thống xuất hiện TRỰC TIẾP trong khung chat (không phải màn hình/tab riêng) — gồm: danh sách từng file đang xử lý kèm trạng thái riêng, Stepper các bước (mục 4.5), đồng hồ đếm thời gian đã trôi qua (chạy real-time phía client), ETA ước tính (không cam kết cứng, đúng nguyên tắc mục 4.5).
3. Card cập nhật qua polling 2-3s đã chốt (`/api/notes/status/:jobId`), nhưng render TẠI VỊ TRÍ tin nhắn đó trong lịch sử chat — user cuộn lại vẫn thấy tiến trình đã qua, không mất ngữ cảnh hội thoại.
4. Nhiều file cùng lúc: xử lý song song (trong giới hạn concurrency Inngest — mục 3.1/10), Processing Card hiển thị trạng thái riêng từng file, ví dụ: "File 1/3: Video bài giảng.mp4 — 47/120 chunk", "File 2/3: Slide.pdf — Hoàn tất ✓", "File 3/3: Audio.mp3 — Đang chờ hàng đợi". 1 file lỗi KHÔNG chặn các file còn lại.
5. CHỈ SAU KHI TẤT CẢ file xử lý xong 100%, hệ thống mới gộp toàn bộ transcript/text sạch (không phải file gốc) làm context đưa cho AI → tiếp tục đúng luồng mục 4.7 (AI xác nhận trước khi Take Note) hoặc trả lời câu hỏi user đã hỏi kèm lúc đính kèm.
6. User vẫn gõ được tin nhắn khác trong lúc Processing Card đang chạy (không khoá chat) — tin nhắn không liên quan đi qua Luồng A bình thường; nếu hỏi thêm về file đang xử lý → AI trả lời dựa trạng thái hiện có, nói rõ file chưa xử lý xong nên chưa đủ nội dung.

**Ràng buộc hạ tầng Vercel Serverless — bắt buộc tuân thủ**:
- **Giới hạn Request Payload 4.5MB**: File lớn >4.5MB **KHÔNG** gửi qua form/sheet thông thường tới API Route Next.js — Vercel sẽ sập.
- **Upload qua Presigned URL**: Trình duyệt client gọi API Route `/api/upload/presign` (chỉ cần tên file + loại + size) → nhận URL Presigned từ R2 → **đẩy thẳng file lên Cloudflare R2** (không qua server Next.js). Server chỉ lưu `file_url` (R2 key) trong table `sources`.
- **Bóc tách Audio trên worker cloud (cho file Video tải lên trực tiếp)**: Sau khi file gốc lên R2, **Inngest worker** chạy `ffmpeg -c:a copy` streaming + segment 30–60p để tách luồng âm thanh (KHÔNG re-encode, không chạy FFmpeg.wasm/MEMFS tại client — client không nuốt nổi file 2–20GB). Kết quả audio chunk (~14MB/chunk) đẩy thẳng lên R2. Worker chạy bất đồng bộ, vượt giới hạn Vercel 60s & Lambda 15'/tmp 10GB.
- **Link YouTube**: caption fetch **tại client** qua `youtubei.js` (IP dân, tránh Google IP-block trên cloud). Ưu tiên phụ đề có sẵn (0đ, 0 compute); **không có caption → unsupported** (backend không tải audio YouTube vì CORS + IP-block cloud). Không tải video 4K full.

### 4.2 Điều khiển output
- Chọn phương pháp ghi chú qua ngôn ngữ tự nhiên trong prompt: Cornell, Outline, Mindmap dạng text, Q&A, Flashcard, tóm tắt điều hành, tóm tắt nhanh, hoặc custom template
- **Chế độ "Auto" (mặc định)**: khi user không chỉ định phương pháp cụ thể (không chọn pill, không nhắc trong prompt), AI tự phân tích nội dung nguồn và chọn phương pháp phù hợp nhất (ví dụ: bài giảng có cấu trúc rõ → Cornell; tài liệu nghiên cứu dài → tóm tắt điều hành) — **không cần dừng lại hỏi user** trong phần lớn trường hợp, hiển thị rõ "AI đã chọn: [phương pháp]" trong bước xử lý để user biết lý do. Chỉ hỏi lại trong chat khi nội dung thật sự mơ hồ (kể cả AI cũng không đủ tin cậy để tự quyết) — đây là fallback hiếm gặp, không phải hành vi mặc định.
  - **Chống lách gói (Tier Bypass) — bắt buộc**: System Prompt của bộ điều hướng (Router Prompt) phải quy định: *"Chế độ Auto chỉ được phép tự động chọn trong phạm vi các template mà gói tài khoản hiện tại của user sở hữu. User Free chỉ Auto trong 3 template Free (Cornell/Outline/Tóm tắt tổng quan); User Pro Auto trong 9 template Free+Pro; User Ultra Auto trong toàn bộ 17 template."* Nếu nội dung phù hợp template trả phí mà user chưa sở hữu → Auto chọn template Free gần nhất + gợi ý nâng cấp, **không tự ý mở khoá trả phí**.
- Pill chọn nhanh trong composer: "Auto" là pill DUY NHẤT được pre-select mặc định; các pill phương pháp cụ thể (Cornell/Outline/Q&A/Flashcard/Tóm tắt nhanh) không pre-select — user chọn thủ công bất kỳ lúc nào sẽ ghi đè Auto
- Custom template: user mô tả phong cách mong muốn bằng prompt tự nhiên, đặt tên, lưu lại tái sử dụng (bảng `custom_note_templates`) — có giới hạn theo gói (xem mục 5)
- Tùy chỉnh độ sâu (nhanh/chi tiết/học thuật) qua 1 câu trong prompt
- Tự tạo glossary thuật ngữ chuyên ngành, hỗ trợ song ngữ (dịch + giữ bản gốc)
- Đánh dấu độ tin cậy từng đoạn (gạch chân, hover xem cảnh báo) khi model không chắc
- Chọn ngôn ngữ đầu ra độc lập với ngôn ngữ nguồn

### 4.3 Artifact Panel, Xem trước (Preview) & Xuất file

**Artifact Panel (chung cho mọi gói)**:
- User chọn chế độ output mỗi lần chat: trả lời thường (follow-up ngắn) hoặc mở Artifact Panel (nội dung dài/có cấu trúc/sẽ lưu-tải)
- Panel trượt từ bên phải, không thay khung chat, có nút mở rộng toàn màn hình (fullscreen, giống YouTube)
- Có toggle chuyển giữa **Code/Raw** và **Preview**
- Nút chính mặc định: **Copy vào clipboard** (không phải tải file — copy là thao tác nhanh/tần suất cao nhất)

**Phân cấp Xem trước (In-App Preview) theo gói**:

| Gói | Preview được phép |
|---|---|
| **Free** | Code Raw / Markdown thô + **Preview Markdown** đã render cơ bản (🔒 Preview HTML bị khóa) |
| **Pro** | Toàn bộ của Free + mở khóa **Preview HTML Tĩnh** (layout chuẩn CSS, bảng 2 cột, chia khối) |
| **Ultra** | Toàn bộ của Pro + mở khóa **Preview HTML Tương tác Động** (chạy JavaScript trực tiếp, hover xem số liệu biểu đồ, đóng/mở nhánh Mindmap, animation mượt mà) |

**Phân cấp Định dạng Xuất file (Export Engine) theo gói**:

| Gói | Định dạng xuất | Cơ chế tải |
|---|---|---|
| **Free** | 3 định dạng cơ bản: `.pdf`, `.docx`, `.md` | Tải đơn lẻ từng file một |
| **Pro** | 4 định dạng chuẩn: PDF, DOCX, Markdown + **Trang web HTML tĩnh `.html`** | Tải đơn lẻ từng file một |
| **Ultra** | 4 định dạng cao cấp: PDF, DOCX, Markdown + **Single-file Interactive HTML** (1 file `.html` duy nhất nhúng trọn bộ inline CSS và JavaScript tương tác, hoạt động offline 100%) | **Checkbox Multi-Export (độc quyền Ultra)** — 4 ô checkbox độc lập (`[ ] PDF`, `[ ] DOCX`, `[ ] Markdown`, `[ ] Interactive HTML`), tick tùy ý để tải song song hoặc đóng gói 1 file `.zip` |

**Đặc tả hộp thoại xuất file (Ultra)**:
- Giao diện xuất hiện khi bấm nút tải: 4 ô Checkbox độc lập (`[ ] PDF`, `[ ] DOCX`, `[ ] Markdown`, `[ ] Interactive HTML`), không bắt buộc tick hết

**Chuẩn hóa hạ tầng xuất file — Block-based `content_structured` (chống Scope Creep)**:
- Để tránh 17 template × 3 định dạng = 51 bộ chuyển đổi, mọi template phải trả về `content_structured` theo **Block-based JSON chuẩn** (tương tự Notion Block): chỉ gồm các khối cơ bản `heading`, `paragraph`, `cue_box`, `table`, `card_grid`, `callout`, `quote`, `mindmap`.
- **Export Engine DUY NHẤT** đọc mảng Block này để render ra DOCX/PDF/HTML — không viết hàm render riêng cho từng template. Template chỉ định: thứ tự + loại + nội dung Block; engine lo phần hiển thị.
- Bảo đảm 1 `content_structured` dùng chung cho Preview + mọi định dạng tải (đã ghi ở 3.2).

**Cơ chế sinh Interactive Single-file HTML (gói Ultra) — chống AI sinh lỗi code**:
- Backend chuẩn bị sẵn **HTML Template tĩnh mẫu** chứa CSS (Tailwind nhúng inline) + thư viện vẽ biểu đồ nhẹ không phụ thuộc CDN (SVG/Canvas thuần hoặc chart nhúng inline), hoạt động offline 100%.
- Khi xuất, **chỉ inject dữ liệu** `content_structured` dưới dạng `<script>window.__NOTE_DATA__ = {...}</script>` vào file mẫu — KHÔNG để AI tự do viết JavaScript/Canvas từ đầu (dễ sinh lỗi syntax/vỡ layout).
- File đầu ra nhẹ, an toàn offline, không cần mạng để xem.
- Ví dụ: tick 2 ô PDF + DOCX → bấm **Tải xuống** → tải song song 2 file, hoặc chọn **Đóng gói ZIP** → 1 file `.zip` chứa cả 2
- Bố cục DOCX/PDF đúng chuẩn phương pháp (ví dụ Cornell: bảng 2 cột cue/notes + hàng tóm tắt) — không thể làm trong markdown chat thường
- Preview áp dụng cho mọi định dạng render được (không chỉ MD/HTML), hỗ trợ bảng biểu/biểu đồ trực tiếp trong nội dung khi dữ liệu nguồn phù hợp

### 4.4 Tổ chức & lưu trữ
- Thư viện lưu các phiên note, tìm kiếm theo từ khóa, gắn thẻ môn học/dự án
- Chia sẻ link xem note (không cần gửi file)
- Notebook chia sẻ/cộng tác (mức độ chỉ-xem hay đồng-biên-tập — cần chốt trước khi build)
- **Giới hạn lưu trữ Note theo gói**: Free tối đa 20 Notes | Pro tối đa 50 Notes | Ultra không giới hạn (kiểm tra server-side, xem mục 6)

### 4.5 UX xử lý file dài
- Xử lý bất đồng bộ qua job nền + thông báo khi xong (email/in-app) — **không hứa hẹn thời gian xử lý cụ thể ("vài phút")**, mô tả đúng bất đồng bộ: job nền, thanh tiến trình, thông báo khi xong, không ngồi chờ
- Thanh tiến trình (Progress Bar) thời gian thực: Stepper 3 bước [Trích Transcript → Phân tích Cấu trúc → Hoàn thiện Note] + **sub-progress từng chunk** ("Transcript 47/120") lấy từ DB, cập nhật liên tục bởi worker nền (không phải spinner vô nghĩa)
- Email tự động qua **Resend** (free tier 3.000 mail/tháng) gửi tới email account khi Note hoàn tất, kèm link mở Note
- Dự toán thời gian thông minh: ước tính từ dung lượng/độ dài nguồn đầu vào ngay khi bắt đầu (hiển thị khoảng, không cam kết)
- Streaming kết quả theo từng chunk khi có thể

### 4.6 Giữ chân người dùng
- Chat tiếp dựa trên nguồn gốc (hỏi thêm sau khi có note, trả lời dựa trên transcript đã xử lý)
- Regenerate từng phần riêng lẻ, không chạy lại toàn bộ file gốc
- Lưu cấu hình mặc định (phương pháp + ngôn ngữ + độ sâu)
- Ước tính thời gian xử lý trước khi bắt đầu; cho xem note mẫu trước khi user tự thử file thật

> **Đã loại bỏ**: TTS (Text-to-Speech), Audio Player, Web Speech API, Edge-TTS — KHÔNG còn trong bất kỳ gói nào, giữ codebase tinh gọn.

### 4.7 Quy trình AI chat thông minh (đã implement 2026-08-20)

Bot AI không tự động tạo note ngay khi user gửi — tuân thủ luồng hỏi-hoặc-xác-nhận để tránh tạo note sai/lãng phí:

1. **Thiếu nguồn đính kèm**: nếu user gửi tin nhắn mà chưa attach file/link YouTube → AI hỏi lại: *"Bạn chưa đính kèm tài liệu/file/link nào. Bạn có quên upload không? Hay ý bạn là muốn tôi tư vấn/tóm tắt từ nội dung bạn gõ?"* — không gọi generate.
2. **Có nguồn → xác nhận trước khi tạo**: AI hiển thị thông báo xác nhận kèm số nguồn + phương pháp sẽ dùng (Auto hoặc cụ thể), lưu `pendingNoteRef`. Chỉ khi user trả lời xác nhận (`có`/`ok`/`yes`/`xác nhận`/`thực hiện`/`đồng ý`) → gọi `executeTakeNote` tạo file. User từ chối → hủy, coi như tin nhắn thường.
3. **Tự động chọn phương pháp** (chế độ Auto) vẫn áp dụng khi user không chỉ định rõ (Cornell/Outline/... được detect từ prompt).

**CRUD lịch sử chat**: LibraryScreen hỗ trợ đổi tên (`renameChatSession` → `updateNote` DB), ghim (`pinChatSession`), lưu trữ (`archiveChatSession`), xóa vĩnh viễn (`deleteChatSessionPermanently` → `deleteNotePermanently` DB). Mọi thao tác persist qua Neon, không chỉ state local.

### 4.8 Tính năng mở rộng (ưu tiên thấp hơn, làm sau)
- Trích xuất action item, đồng bộ Notion/Google Docs/Calendar
- Spaced repetition cho template Flashcard
- ~~Chế độ on-device Gemma~~ — đã tạm gác (mâu thuẫn với quyết định full-cloud; quay lại nếu có nhu cầu doanh nghiệp thật, khi đó triển khai qua WebGPU/ONNX Runtime Web trên trình duyệt user, không phải server Zero)

### 4.9 Tự kết nối AI / Nhà cung cấp AI (trước đây: BYOK — Bring Your Own API Key)

> **Đổi tên**: toàn bộ giao diện, bảng giá và tài liệu dùng cụm từ **"Tự kết nối AI / Nhà cung cấp AI"** (hoặc "Dùng API Key riêng"). **Đã loại bỏ hoàn toàn** tính năng Auto-Sync model free và bảng cache `provider_free_models_cache` — không dùng cron job polling giá model bên thứ ba.

**Cơ chế kết nối AI cá nhân — chuẩn OpenAI-compatible tối giản**:
- Người dùng nhập: **Tên Provider**, **Endpoint URL**, **API Key**
- Nút **"Discover Models"**: gọi `GET {endpoint}/v1/models` để tự động liệt kê model có sẵn (song song với nhập tay tên model — không thay thế nhau)
- Nút **"Test Connection"**: kiểm tra endpoint + API key hoạt động ở mức kết nối chung, **bắt buộc trước khi Save** (fail-closed)
- Không có toggle Import/Sync free models, không có cron job, không có bảng cache dùng chung
- Riêng Gemini/Claude API gốc không theo chuẩn OpenAI-compatible → xử lý như provider có sẵn riêng của hệ thống
- Bảng kiểm tra khả năng theo từng provider (ví dụ cảnh báo khi chọn provider không nhận video), chặn/cảnh báo trước khi user tự thử-và-lỗi
- Cân nhắc giới hạn tính năng ở gói Paid — nếu mở Free, user né được giới hạn dung lượng lưu trữ
- **2 tầng kiểm tra riêng biệt, không trùng nhau**: nút **"Test Connection"** khi thêm provider (kiểm tra endpoint + API key hoạt động ở mức kết nối chung, bắt buộc trước khi Save) và nút **"Discover Models"** (liệt kê model từ `/v1/models`, phòng trường hợp kết nối ổn nhưng model gõ sai tên/đã ngừng hỗ trợ)

---

## 5. Mô hình kinh doanh & Bảng giá

**Nguyên tắc gate tính năng**: Tính năng tốn compute (Interactive Preview, mind map, xuất file cao cấp) → gói Paid. Tính năng retention (thư viện, chat tiếp theo nguồn) → giữ Free để tối đa engagement.

**Định nghĩa "Free 100%" chính thức**: User được dùng sản phẩm miễn phí trong phạm vi **system quota** (xem mục 5.1). KHÔNG phải unlimited cloud compute. Nếu workload vượt quota → **queue / pause / require upgrade**. Không tự động phát sinh cloud bill.

### 5.1 Plan Limits — Quota-Aware Architecture

| Resource | Free | Pro | Ultra |
|---|---|---|---|
| **Giá** | **0đ** (vĩnh viễn) | **99.000đ/tháng** (~$4) | **199.000đ/tháng** (~$8) |
| **Notes tối đa** | 20 | 50 | ∞ |
| **Files / project** | 20 | 100 | 1000 |
| **Total duration / project** | 12h (720min) | 83h (5000min) | 333h (20000min) |
| **Storage** | 5 GB | 50 GB | 200 GB |
| **Daily AI budget (Neurons)** | 8000 (80% Gemini free cascade) | 50.000 | 200.000 |
| **Concurrent jobs** | 2 | 5 | 20 |
| **Projects** | 5 | 50 | ∞ |
| **Custom templates** | 5 | 25 | ∞ |
| **Raw media retention** | 30 ngày | 60 ngày | 90 ngày |
| **Structured retention** | 365 ngày | 3650 ngày | ∞ |

Tất cả con số là **configuration**, không hardcode.

### 5.2 Cost Control — 6-layer Defense
1. **Input validation** — Reject file trước khi processing nếu vượt plan limit
2. **Pre-job quota check** — Đọc daily quota trước khi start workflow
3. **Atomic reservation** — Tránh race condition khi nhiều job chạy song song (PostgreSQL `SELECT FOR UPDATE`)
4. **Mid-job monitoring** — Hủy job nếu `actual_usage > estimate * 1.5`
5. **Post-job reconciliation** — Ghi actual usage + release unused reservation
6. **Daily cron reconciliation** — Verify quota sums vs actual usage, fix drift, reset counter

### 5.3 90% Safety Valve
Khi daily quota đạt >90%:
1. Tạm dừng nhận job mới (job đang chạy vẫn tiếp tục)
2. In-app notification + email Resend
3. Offer 3 option: chờ reset cuối ngày / BYOK / upgrade
4. **Không auto-charge**

### 5.4 BYOK as Escape Valve
User cung cấp API key riêng → bypass system quota cho provider đó. BYOK key AES-256-GCM encrypted at rest, không log, không expose client. BYOK model không bị giới hạn tính năng theo gói (trừ giới hạn note storage).

### 5.5 Plan Features (Master Pricing Matrix)

| Hạng mục / Tính năng | Gói FREE (0đ) | Gói PRO (99.000đ/tháng) | Gói ULTRA (199.000đ/tháng) |
|---|---|---|---|
| **Mô tả định vị** | Khám phá & trải nghiệm ghi chú học thuật chuẩn AI | Sinh viên, giảng viên & người làm việc hằng ngày | Chuyên gia nghiên cứu, đề án chuyên ngành & khối lượng lớn |
| **Huy hiệu** | Cơ Bản | Phổ Biến Nhất | Tối Thượng |
| **AI Engine** | Shared Gemini Key (Safety Valve >90%) hoặc BYOK | Shared Gemini Key hoặc BYOK | Shared Gemini Key hoặc BYOK |
| **Xem trước (Preview)** | Code Raw + Markdown rendered | + Preview HTML Tĩnh | + Preview HTML Tương tác Động |
| **Xuất file** | PDF, DOCX, MD | PDF, DOCX, MD, Static HTML | PDF, DOCX, MD, Interactive HTML |
| **Cơ chế tải** | Tải đơn lẻ | Tải đơn lẻ | Checkbox Multi-Export + ZIP |
| **Templates có sẵn** | 3 (Cornell, Outline, Tóm tắt tổng quan) | 9 (+ Tóm tắt cuộc họp, bài giảng, Phân tích chi tiết, Q&A, Charting, Boxing) | 17 (+ Take Note All-in-One, Mindmap, Flashcard, Phân tích chuyên sâu, Feynman, First Principles, Syntopical Matrix, 5W1H) |
| **Custom templates** | 5 | 25 | ∞ |
| **Hỗ trợ** | Tiêu chuẩn | Tiêu chuẩn | Ưu tiên tốc độ + 24/7 |

### Bảng Master Pricing Matrix (chuẩn 100% với website thực tế)

| Hạng mục / Tính năng | Gói FREE (0đ) | Gói PRO (99.000đ/tháng) | Gói ULTRA (199.000đ/tháng) |
|---|---|---|---|
| **Giá thành** | **0đ** (vĩnh viễn) | **99.000đ / tháng** (~$4) | **199.000đ / tháng** (~$8) |
| **Mô tả định vị** | Khám phá & trải nghiệm ghi chú học thuật chuẩn AI | Dành cho sinh viên, giảng viên & người làm việc hằng ngày | Chuyên gia nghiên cứu, đề án chuyên ngành & khối lượng lớn |
| **Huy hiệu (Badge)** | Cơ Bản | Phổ Biến Nhất | Tối Thượng / Tất Cả Đặc Quyền |
| **Giới hạn lưu trữ Note** | **Tối đa 20 Notes** | **Tối đa 50 Notes** | **KHÔNG GIỚI HẠN** số lượng Note |
| **Hạn mức & AI Engine** | Dùng chung Gemini Key mặc định hoặc Tự kết nối AI cá nhân (Safety Valve mềm >90% quota) | Dùng chung Gemini Key mặc định hoặc Tự kết nối AI cá nhân (Safety Valve mềm >90% quota) | Dùng chung Gemini Key mặc định hoặc Tự kết nối AI cá nhân (Safety Valve mềm >90% quota) |
| **Xem trước (In-App Preview)** | • Code Raw thô<br>• Preview Markdown đã render | • Toàn bộ của Free<br>• Preview HTML Tĩnh (layout CSS chuẩn) | • Toàn bộ của Pro<br>• Preview HTML Tương tác Động (JS, chart hover, animation) |
| **Định dạng Xuất file** | 3 định dạng cơ bản (`.pdf`, `.docx`, `.md`) | 4 định dạng chuẩn (PDF, DOCX, MD, Webpage HTML tĩnh) | 4 định dạng cao cấp (PDF, DOCX, MD, Single-file Interactive HTML độc lập 100% offline) |
| **Cơ chế Tải xuống** | Tải đơn lẻ từng file một | Tải đơn lẻ từng file một | Checkbox Multi-Export & Đóng gói tự động vào 1 file `.ZIP` duy nhất |
| **Hệ thống Templates có sẵn** | **3 template nền tảng:**<br>• Cornell<br>• Outline<br>• Tóm tắt tổng quan | **9 template (Kế thừa Free + 6 chuyên sâu):**<br>• Tóm tắt cuộc họp<br>• Tóm tắt bài giảng<br>• Phân tích chi tiết<br>• Q&A<br>• Charting Method<br>• Boxing Method | **17 template (Trọn bộ Free, Pro + 8 chuyên gia):**<br>• Take Note tổng hợp (All-in-One)<br>• Mindmap<br>• Flashcard<br>• Phân tích chuyên sâu<br>• Feynman Technique<br>• First Principles<br>• Syntopical Matrix<br>• 5W1H & Actionable Matrix |
| **Tự tạo Template (Custom)** | Tối đa **5 templates** | Tối đa **25 templates** | **KHÔNG GIỚI HẠN** số lượng |
| **Hỗ trợ & Ưu tiên** | Tiêu chuẩn | Tiêu chuẩn | Ưu tiên tốc độ xử lý & hỗ trợ kỹ thuật 24/7 |

> **Ghi chú pricing**: 
> - **Không giới hạn giờ xử lý / độ dài file** trên lý thuyết cho cả 3 gói — nếu Gemini key hệ thống quá tải/nghẽn quota, hệ thống kích hoạt Safety Valve mềm và thông báo người dùng chờ reset hoặc chuyển sang "Tự kết nối AI".
> - Đơn vị tiền tệ hiển thị theo ngôn ngữ: tiếng Việt dùng `đ`, English dùng `$` (quy đổi ~25.500đ/$1).
> - Không dùng từ "không giới hạn" mơ hồ trên landing — con số cụ thể hoặc placeholder rõ ràng.

### Chi tiết hệ thống Templates & Phương pháp Ghi chú (kế thừa 100%)

**Gói FREE — 3 templates nền tảng (+ Tối đa 5 Custom Templates):**
1. **Cornell** — Khung 2 cột Cue/Notes + Summary tổng quát
2. **Outline** — Dàn ý phân cấp I, A, 1, a
3. **Tóm tắt tổng quan / Nhanh** — Ý chính then chốt

**Gói PRO — Kế thừa 3 Free + Bổ sung 6 templates chuyên sâu = 9 templates (+ Tối đa 25 Custom Templates):**
4. **Tóm tắt chi tiết cuộc họp** — Bối cảnh, thảo luận, quyết định, Action Items
5. **Tóm tắt chi tiết bài giảng** — Khái niệm, glossary, đối chiếu mốc thời gian slide/audio
6. **Phân tích chi tiết** — Nguyên nhân, diễn biến, số liệu dẫn chứng, tác động
7. **Q&A** — Bộ câu hỏi - trả lời ôn tập/phỏng vấn
8. **Charting Method** — Bảng ma trận so sánh đa chiều & phân loại đối tượng
9. **Boxing Method** — Khối Bento Box kiến thức độc lập: Khái niệm, Nguyên lý, Ví dụ, Cạm bẫy

**Gói ULTRA — Kế thừa 9 Free & Pro + Bổ sung 8 templates chuyên gia = 17 templates (+ KHÔNG GIỚI HẠN Custom Templates):**
10. **Take Note tổng hợp / All-in-One** — Kết hợp đồng thời Cornell + Outline + Tóm tắt đa năng cho mọi case phức tạp
11. **Mindmap** — Sơ đồ tư duy phân nhánh logic trực quan
12. **Flashcard** — Bộ thẻ ghi nhớ 2 mặt thuật ngữ/định nghĩa để ôn tập
13. **Phân tích chuyên sâu** — Báo cáo điều hành và nghiên cứu đa chiều
14. **Feynman Technique** — Đơn giản hóa đa tầng: Bình dân học vụ → Ẩn dụ thực tế → Chuẩn học thuật → Khoảng trống kiến thức
15. **First Principles Breakdown** — Tư duy nguyên lý cơ bản: Lọc bỏ giả định, giữ lại sự thật cốt lõi, tái cấu trúc từ số 0
16. **Syntopical Matrix** — Phân tích tổng hợp đa tài liệu: Từ khóa chung, điểm đồng thuận, luận điểm tranh cãi, khoảng trống tri thức
17. **5W1H & Actionable Matrix** — Khung 5W1H, ma trận đánh giá rủi ro và lộ trình hành động có đo lường KPI

**Coupon**: trang quản lý riêng (admin), CRUD đầy đủ, giới hạn số lần dùng + ngày hết hạn + áp dụng cho gói nào (all/paid).

**Ràng buộc coupon thực tế đã implement (2026-08-19/20):**
- **1 tài khoản chỉ được nhập đúng 1 mã coupon duy nhất**: bảng `user_coupons(user_id PK, coupon_code, used_at)`. Khi user Active bất kỳ mã nào, `validateCouponForPlan(code, plan, userId)` kiểm tra `user_coupons` → nếu user đã từng dùng coupon nào thì từ chối mọi mã (kể cả mã cũ đã hết hạn), trả thông báo *"Mỗi tài khoản chỉ được dùng 1 mã duy nhất"* vào chuông thông báo. Mục đích: chặn user lưu coupon hết hạn rồi tái sử dụng.
- **Coupon giảm 100% → Zero Tracking track 0đ**: `applyCouponDiscount` cho phép `finalAmount = 0` (bỏ floor tối thiểu). `create-invoice` truyền `finalAmount` đã giảm sang Zero Tracking; nếu Zero Tracking trả bill `status='paid'` (số tiền 0đ) → hệ thống auto `upgradeUserPlan` + kích hoạt gói ngay (không cần quét QR). Zero Tracking chấp nhận `amount=0` (bill auto-paid, không cần QR).
- **Quy trình Active (UI)**: Chọn gói → nhập mã → bấm **Active** → thành công ghi nhận discount + quyền, thất bại báo lỗi trong chuông thông báo. Coupon backend thực sự (không chỉ frontend): `validate-coupon` read-only, `create-invoice` validate → tính giảm → tạo bill → lưu `subscriptions.coupon_code` + tăng `usage_count` đúng 1 lần.

**Admin**: chỉ 1 tài khoản (`nguyenchithang2804@gmail.com`) truy cập trang Coupon, phân quyền qua `role` kiểm tra server-side + RLS, set thủ công 1 lần qua SQL — không có flow tự nhận quyền admin.

**Tích hợp ZeroInvoice**: fail-closed cho mọi luồng thanh toán, webhook xác minh chữ ký, xử lý idempotent, đối chiếu định kỳ trạng thái subscription phòng khi webhook bị lỡ.

---

## 6. Database Schema (Neon / Drizzle)

> Schema thiết kế theo Architecture v1 — DDL chính thức tại `docs/schema-neon.sql`. Bao gồm RLS, pgvector, jobs, knowledge_objects, coverage_ledger, usage, quotas.

### 6.0 Schema Overview

Baseline tables (DDL chi tiết xem `docs/schema-neon.sql`):

```
profiles            — User identity (email, password_hash, google_id, role, plan)
notebooks           — Project-like container (title, tags, is_merged, archived, deleted)
sources             — Raw file/link metadata (type, file_url, original_url, size_bytes,
                      duration_seconds, status, transcript, retention_delete_at)
custom_note_templates — User-defined templates (5/25/∞ theo gói)
subscriptions       — Billing records (bill_id, plan, amount, status, qr_data, coupon_code,
                      paid_at, renews_at)
user_coupons        — 1 account = 1 coupon (PK = user_id)
notes               — Generated notes với content_structured (Block JSON)
                      + confidence_flags
byok_providers      — User-supplied AI provider (name, provider_id, endpoint_url,
                      default_model, api_key_encrypted AES-256-GCM, is_default)
coupons             — Admin-defined discount codes

— Architecture v1 additions —
projects            — Multi-file processing unit (status, job_graph_ref)
files               — Per-file processing state (r2_key, processing_progress,
                      media_processor_used)
jobs                — Job manifest với idempotency_key, attempt, priority
content_chunks      — Normalized content + token_count + location metadata
knowledge_objects   — Structured extraction (summary, facts, topics, entities, numbers,
                      dates, decisions, action_items, questions, quotes)
embeddings          — pgvector vector(1536) + metadata
summaries           — Section/File/Cross-file summaries
evidence            — Mọi claim → source location (timestamp/slide/page)
notes_v2            — Project-level notes (khác notes single-file)
entities            — Normalized entities (OpenAI = Open AI = OpenAI Inc.)
relationships       — Entity co-occurrence
conflicts           — Cross-file disagreement records
usage               — Metered AI calls (per user/provider/model/operation/timestamp)
quotas              — Daily/per-user quota state + reservation tracking
coverage_ledger     — Pipeline coverage per chunk (transcribed, normalized,
                      knowledge_extracted, embedded, included_in_*, project_ready)
```

### 6.1 RLS (Row-Level Security)
Neon dùng `auth_uid()` qua `current_setting('request.jwt.claims')`, KHÔNG dùng `auth.uid()` của Supabase. Pattern:

```sql
CREATE OR REPLACE FUNCTION auth_uid() RETURNS uuid AS $$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub'::uuid;
$$ LANGUAGE sql STABLE;

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own notes" ON notes
  FOR SELECT USING (auth_uid() = user_id);
CREATE POLICY "user writes own notes" ON notes
  FOR INSERT WITH CHECK (auth_uid() = user_id);

-- Admin bypass
CREATE POLICY "admin manages all" ON notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth_uid() AND role = 'admin')
  );
```

### 6.2 Server-side Constraint Checks
Bắt buộc kiểm tra TRƯỚC khi insert (không âm thầm chặn):
- **Notes limit**: `SELECT count(*) FROM notes WHERE user_id = $1` → Free `<20`, Pro `<50`, Ultra ∞
- **Custom templates limit**: Free `<5`, Pro `<25`, Ultra ∞
- **Project file count / duration / storage** (xem mục 5.1)
- Khi vượt → trả lỗi rõ ràng + đề xuất nâng gói

### 6.3 Đã xóa khỏi schema
- `provider_free_models_cache` — bỏ Auto-Sync model free (PRD 4.9)
- `import_free_models`, `sync_enabled` columns trên `byok_providers` (bỏ Auto-Sync)

### 6.4 Schema Notes
- **Legacy tables** (PRD gốc 2026-08-18): vẫn giữ để tương thích code hiện tại (`notebooks`, `sources`, `notes` với `content_structured`). Schema mới (`projects`, `files`, `jobs`, `knowledge_objects`, `content_chunks`, `embeddings`) được thêm vào khi migration plan được implement.
- **Migration path**: xem mục 6.0 (Schema Overview) và mục 6.4 (Schema Notes) — gap giữa schema hiện tại và Architecture v1 đã được document inline tại PRD này.

```sql
-- Hồ sơ user
create table profiles (
  id uuid primary key,
  email text unique not null,          -- login bằng mật khẩu hoặc Google
  password_hash text,                  -- login bằng mật khẩu (bcryptjs)
  google_id text unique,               -- login bằng Google OAuth (GIS popup), NULL nếu đăng ký bằng email/password
  display_name text,
  role text default 'user' check (role in ('user','admin')),
  plan text default 'free' check (plan in ('free','pro','ultra')),
  plan_renews_at timestamptz,
  created_at timestamptz default now()
);

-- Notebook = tập hợp note, có thể do gộp nhiều file tự động
create table notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text not null,
  tags text[],
  is_merged boolean default false,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- File/link nguồn gốc
create table sources (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid references notebooks(id),
  user_id uuid references profiles(id),
  type text check (type in ('video','audio','pdf','image','slide','text','url','youtube')),
  file_url text,
  original_url text,
  size_bytes bigint,
  duration_seconds int,
  status text default 'pending' check (status in ('pending','processing','processed','error')),
  transcript text,
  retention_delete_at timestamptz,
  created_at timestamptz default now()
);

-- Template ghi chú do user tự tạo (giới hạn theo gói: Free ≤5, Pro ≤25, Ultra ∞)
create table custom_note_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text not null,
  description_prompt text not null,
  created_at timestamptz default now()
);

-- Hóa đơn / đăng ký gói trả phí (Zero Tracking VietQR — lưu vết giao dịch tiền thật)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  bill_id text unique not null,               -- ID đơn hàng từ Zero Tracking
  plan text not null check (plan in ('pro','ultra')),
  amount numeric not null,                    -- Số tiền thực trả (đã trừ coupon; 0đ nếu coupon 100%)
  status text default 'pending' check (status in ('pending','paid','expired','canceled')),
  qr_data text,                               -- Chuỗi EMVCo payload (render client-side); null nếu bill 0đ auto-paid
  coupon_code text,
  payment_account_id text,   -- (deprecated) Zero Tracking App đã gắn cố định 1 tài khoản NH khi tạo; Zero AI Note KHÔNG gửi payee per-checkout nữa
  paid_at timestamptz,
  renews_at timestamptz,                      -- Ngày hết hạn gói (now() + 30 days)
  created_at timestamptz default now()
);

-- Ràng buộc: 1 tài khoản chỉ được nhập đúng 1 mã coupon duy nhất (không trùng)
create table user_coupons (
  user_id uuid not null references profiles(id) on delete cascade,
  coupon_code text not null,
  used_at timestamptz not null default now(),
  primary key (user_id)   -- mỗi account = 1 coupon duy nhất
);

-- Note đã tạo — content_structured là nguồn duy nhất để render mọi định dạng
create table notes (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid references notebooks(id),
  user_id uuid references profiles(id),
  method text,
  custom_template_id uuid references custom_note_templates(id),
  output_language text default 'vi',
  content_structured jsonb,
  confidence_flags jsonb,
  created_at timestamptz default now()
);

-- Provider AI do user tự kết nối ("Tự kết nối AI / Nhà cung cấp AI")
create table byok_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text,
  provider_id text, -- ví dụ 'openrouter', 'nvidia', 'huggingface', 'custom'
  endpoint_url text,
  default_model text,
  api_key_encrypted text,
  is_default boolean default false,
  last_test_status text,
  created_at timestamptz default now()
);
-- LƯU Ý: Đã XÓA cột import_free_models, sync_enabled (bỏ Auto-Sync)

-- Coupon
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text check (discount_type in ('percent','fixed')),
  discount_value numeric,
  applies_to text default 'all' check (applies_to in ('all','paid')),
  usage_limit int,
  usage_count int default 0,
  expires_at timestamptz,
  status text default 'active' check (status in ('active','expired','disabled')),
  created_at timestamptz default now()
);

-- RLS mẫu (áp dụng tương tự cho các bảng còn lại)
alter table notes enable row level security;
create policy "user reads own notes" on notes for select using (auth.uid() = user_id);
create policy "user writes own notes" on notes for insert with check (auth.uid() = user_id);

alter table coupons enable row level security;
create policy "admin manages coupons" on coupons for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
```

> **Bảng ĐÃ XÓA**: `provider_free_models_cache` — không còn tồn tại (bỏ Auto-Sync, không cron job polling giá model).

**Logic kiểm tra giới hạn (Server-side constraint)** — bắt buộc kiểm tra TRƯỚC khi insert:
- **Giới hạn lưu trữ Note**: `SELECT count(*) FROM notes WHERE user_id = $1` → Free: `< 20`, Pro: `< 50`, Ultra: không giới hạn
- **Giới hạn Custom Template**: `SELECT count(*) FROM custom_note_templates WHERE user_id = $1` → Free: `< 5`, Pro: `< 25`, Ultra: không giới hạn
- Khi vượt giới hạn → trả lỗi rõ ràng cho user (không âm thầm chặn), đề xuất nâng gói

> **Lưu ý RLS trên Neon**: không dùng `auth.uid()` của Supabase — dùng `auth_uid()` qua `current_setting('request.jwt.claims')` (xem `docs/schema-neon.sql`).

---

## 7. UI/UX

### 7.1 Luồng thiết kế đã thực hiện & vai trò của code AI Studio

Google Stitch (Ideate + nhiều vòng Direct Edit) → export sang Google AI Studio → hoàn thiện qua nhiều đợt: kết nối luồng điều hướng giữa 11 màn, animation/micro-interaction, responsive, hệ thống 10 theme, chế độ Auto chọn phương pháp, hoàn thiện Tự kết nối AI (Discover Models / Test Connection) → chuẩn hoá code thành React + TypeScript + Tailwind sạch, tách component, không màu hardcode.

**Quyết định cuối cùng (đã điều chỉnh so với dự định ban đầu)**: code này **KHÔNG còn là throwaway thuần tuý** — sẽ đẩy lên GitHub, Hermes/Antigravity **clone repo về làm nền tảng UI/UX thật**. Ranh giới rõ ràng:
- **Lấy**: toàn bộ phần hiển thị — component, layout, theme system, animation, responsive
- **Không lấy**: bất kỳ suy luận nào về kiến trúc backend/database từ cách code AI Studio tổ chức dữ liệu mock — schema, luồng xử lý, bảo mật vẫn tuân thủ nghiêm ngặt theo mục 3, 4, 5, 6 của PRD này, viết mới hoàn toàn
- Việc còn lại của Hermes: đóng gói code React đã có vào cấu trúc Next.js thật (`app/` router, tách API routes), nối vào Neon/Inngest/AI pipeline thật, thay toàn bộ dữ liệu mock bằng dữ liệu thật

### 7.2 Danh sách 11 màn hình

Dark mode mặc định (theme "Giấy"), brand "Zero AI Note" + tagline "AI-Powered Research", nav chuẩn: Lịch sử (History) / Search / Files / Account / Templates / Archives (dưới 1024px chuyển thành sidebar off-canvas).

1. **Màn chính** (chat + Artifact Panel) — hoàn chỉnh, gồm pill phương pháp (có "Auto" mặc định), modal Đính kèm nguồn, stepper xử lý 3 giai đoạn
2. **Lịch sử Hội thoại & Ghi chú (History)** — hợp nhất toàn bộ phiên chat AI kèm file Note sinh ra, hỗ trợ đầy đủ quyền CRUD (Tạo mới, Đọc & Tiếp tục Chat / Xem nhanh Note, Cập nhật Đổi tên & Ghim phiên lên đầu, Xóa vào Thùng rác 30 ngày), grid/list toggle, tabs phân loại (Tất cả / Đã ghim / Có Note / Chia sẻ)
3. **Cài đặt — Tài khoản & Billing**
4. **Cài đặt — Tự kết nối AI / Nhà cung cấp AI** — form Custom Endpoint (Tên Provider, Endpoint URL, API Key), nút **Test Connection** + nút **Discover Models**, dropdown model tự động đồng bộ đúng provider đã thêm
5. **Pricing** — 3 cột Free/Pro/Ultra theo đúng Master Pricing Matrix, ô coupon (chiết khấu % tự động), FAQ
6. **Admin — Quản lý Coupon & Hệ thống** — Full CRUD backend/frontend, chiết khấu phần trăm (%), hạn sử dụng và lượt dùng
7. **Đăng nhập/Đăng ký** — email/password + Google OAuth
8. **Chi tiết 1 note đã lưu** — 2 cột (nội dung + chat hỏi thêm)
9. **Templates** — quản lý phương pháp ghi chú có sẵn (3/9/17 theo gói) + tự tạo (5/25/∞ theo gói)
10. **Archives (Thùng rác & Lưu trữ)** — phiên hội thoại & note lưu trữ/xoá mềm, đếm ngược 30 ngày trước khi purge
11. **Files** — danh sách file nguồn đã tải

### 7.3 Design System

**Theme**: 10 bảng màu, mỗi theme bắt buộc có cả dark + light (20 bộ token tổng cộng) — **Giấy** (mặc định, than ấm/kem giấy + accent hổ phách), Dracula/Alucard, Rừng, Biển, Hoàng hôn, Mực, Oải hương, Đào, Bạc hà, Rượu vang. Nguyên tắc màu: tránh thẩm mỹ "đen-tím/indigo" mặc định của ngành AI, ưu tiên tông ấm/mềm mại, thân thiện. Chọn theme lưu ở `localStorage`, áp dụng qua CSS token — **không có bất kỳ màu Tailwind chuẩn hardcode nào** (blue/cyan/indigo...) trong code, mọi màu phải đi qua token theme.

**Responsive**: breakpoint chuẩn Tailwind (sm/md/lg). Sidebar chuyển off-canvas drawer dưới 1024px. Bảng dữ liệu (Lưu trữ, Files) chuyển sang dạng list-card trên mobile. Artifact Panel mở full màn hình trên mobile thay vì panel 45% như desktop. Touch target tối thiểu 44x44px.

**Animation**: easing ease-in-out nhất quán, 150-300ms cho hover/click, 300-400ms cho chuyển màn/mở panel. Mọi nút/card có trạng thái hover (đổi màu/nâng nhẹ) + active (nhấn xuống nhẹ) + focus (viền accent cho điều hướng bàn phím). Loading skeleton khi tải dữ liệu, không màn trắng/giật cục.

### 7.4 Lỗi đã phát hiện trong quá trình làm — Hermes audit lại khi nhận code

Đây là các lỗi từng phát sinh và đã yêu cầu vá qua nhiều vòng — cần kiểm tra kỹ khi clone repo về vì rất có thể còn sót ở chỗ khác chưa phát hiện:
- **Màu hardcode**: từng phát hiện nhiều phần tử (logo, nút, badge) giữ nguyên màu xanh dương/cyan khi đổi theme — dấu hiệu code gán màu Tailwind cứng thay vì theme token. Đã yêu cầu quét sửa 1 lần nhưng cần audit lại toàn diện.
- **Pre-select sai**: pill "Cornell" từng bị active mặc định (sai) — đã sửa thành "Auto" là pill duy nhất pre-select.
- **Icon thao tác thiếu**: cột "THAO TÁC" ở bảng Lưu trữ/Files/Coupon từng trống nhiều lần liên tiếp qua các vòng chỉnh sửa Stitch — xác nhận đã có đủ icon Sửa/Xoá/Khôi phục trước khi coi là xong.
- **Dropdown model không đồng bộ provider**: dropdown "AI Engine Model" ở thanh trên từng hiển thị danh sách mẫu cứng không liên quan tới provider user tự thêm — đã yêu cầu sửa thành tự động lấy đúng model từ provider đã kết nối, cần xác nhận lại.

---

## 8. Bối cảnh Đồ án Chuyên ngành (song song với mục tiêu thương mại)

Zero AI Note đồng thời là đồ án môn "Đồ án Chuyên ngành" (1 tín chỉ, ngành Lập trình máy tính, ĐH) — có **deadline thật**, khác hẳn khung "không gấp" đã dùng để thiết kế roadmap thương mại ở mục 9. Đây là ưu tiên thời gian riêng, dùng chung 1 codebase với sản phẩm thương mại.

### 8.1 Mốc thời gian bắt buộc
- Tuần 1 môn học = 17/08/2026 (đã bắt đầu)
- **Báo cáo đồ án lần 1** (điểm hệ số 1, gồm cả điểm quá trình): Tuần 10 = **19–25/10/2026**
- **Demo + bảo vệ chính thức** (điểm hệ số 2): Tuần 15 = **23/11/2026**
- Tiêu chí chấm điểm: Phân tích & thiết kế hệ thống (20%), Lập trình & chất lượng sản phẩm (40%), Tài liệu & báo cáo (20%), Thuyết trình bảo vệ (20%)

### 8.2 Yêu cầu khai báo AI — ảnh hưởng trực tiếp tới cách chuẩn bị bảo vệ
- Dùng AI thoải mái, dùng nhiều không bị trừ điểm — miễn khai báo rõ công cụ + công đoạn, hiểu và giải thích được, chịu trách nhiệm về chất lượng mã nguồn
- Phiếu Đăng Ký Đề Tài có mục riêng (mục IX) khai báo công cụ AI (có sẵn checkbox "Claude") + công đoạn dùng AI + cam kết hiểu/kiểm chứng
- **Rủi ro cụ thể cần chuẩn bị trước**: buổi bảo vệ, giảng viên hỏi trực tiếp theo từng dòng code cụ thể (ví dụ "dòng 89 AI làm không? dòng 150?"), không chỉ hỏi kiến trúc chung chung. Cần tự đọc lại code + `DECISIONS.md`/`ARCHITECTURE.md` trước bảo vệ, sẵn sàng giải thích tại chỗ — không chỉ dựa vào có sẵn tài liệu.

### 8.3 Phân loại đề tài — đã xác nhận phù hợp
Phiếu đăng ký chính thức có checkbox "Web Application" và "AI Application" — Zero AI Note tick được cả 2, không cần điều chỉnh phạm vi để phù hợp ngành.

### 8.4 Cần xác nhận với giảng viên (chưa tự quyết được)
Slide ghi "1–2 sinh viên/nhóm" là quy định chính thức, nhưng lời giảng viên trong buổi học lại nói "thông thường 3, 1–2 là trường hợp đặc biệt" — cần Zero tự xác nhận việc làm 1 mình có được chấp nhận không trước khi nộp Phiếu Đăng Ký.

### 8.5 Phạm vi rút gọn riêng cho deadline đồ án (khác roadmap thương mại đầy đủ ở mục 9)
Tiêu chí chấm điểm không đòi hỏi billing thật/"Tự kết nối AI" hoàn chỉnh — 1 bản demo chạy tốt với luồng ghi chú lõi, auth thật, CRUD đầy đủ, UI/UX hoàn thiện là đủ đáp ứng.

- **Tới Tuần 10 (báo cáo lần 1)**: ưu tiên xong tương đương roadmap mục 9 tới hết "Tuần 5-7" (multi-file, multi-định dạng, đủ template, xuất đa định dạng) — thể hiện rõ nhất tiêu chí "Lập trình & chất lượng sản phẩm" (40% điểm, trọng số cao nhất)
- **Tới Tuần 15 (bảo vệ)**: hoàn thiện thêm UX giữ chân người dùng (mục 9, Tuần 8-9) + tối thiểu 1 luồng thanh toán chạy được thật (không nhất thiết đầy đủ mọi tính năng Ultra) để thể hiện chiều sâu kỹ thuật khi phản biện
- **Có thể lược bớt nếu thiếu thời gian**: Mindmap/Interactive Preview/action item/spaced repetition (mục 9, Tuần 12+) — không nằm trong tiêu chí chấm điểm chính thức, ưu tiên thấp nhất
- Bộ sản phẩm nộp (theo đúng yêu cầu môn học): báo cáo đồ án (theo mẫu của khoa — Zero cần xin mẫu riêng, chưa có trong tài liệu đã đọc), source code có chú thích, tài liệu hướng dẫn sử dụng/cài đặt, slide thuyết trình 10-15 phút (cấu trúc: Vấn đề→Mục tiêu→Giải pháp→Phân tích→Thiết kế→Công nghệ→Demo→Kết quả→Hạn chế→Hướng phát triển), video demo sản phẩm

---

## 9. Roadmap — Architecture v1 Phases

8 phases từ Architecture v1 (mục tiêu thương mại dài hạn; xem mục 8 cho mốc đồ án):

| Phase | Nội dung |
|---|---|
| **Phase 1 — Foundation** | Next.js (Vercel), Inngest, Cloudflare R2 (storage only), Neon, Authentication, Project model, File model |
| **Phase 2 — File ingestion** | Direct upload (R2 Signed URL), Multipart/resumable, Job manifest, Inngest trigger |
| **Phase 3 — Processing** | MediaProcessor abstraction (InngestFFmpeg), DOCX parser, PPTX parser, ASR (Gemini native audio) |
| **Phase 4 — Knowledge** | Normalized chunks, Knowledge Objects, Embeddings, pgvector |
| **Phase 5 — Summarization** | Section, File, Cross-file, Project summaries |
| **Phase 6 — Note system** | Templates (17), Block JSON, Zod validation, Universal Export Engine |
| **Phase 7 — Chat** | Hybrid RAG, Evidence tracing, Streaming, Conversation context |
| **Phase 8 — Scale** | 10h+ videos, multi-file, multiple concurrent users, quota optimization, conflict detection |

---

## 10. Cần chốt trước khi build (không blocking, nên quyết sớm)

**Đã chốt (2026-08-18)**:
- ✅ **Bảng giá 3 gói**: Free 0đ / Pro 99.000đ / Ultra 199.000đ (quy đổi $ theo ngôn ngữ)
- ✅ **Giới hạn lưu trữ Note**: Free 20 Notes, Pro 50 Notes, Ultra không giới hạn
- ✅ **Hạn mức AI**: cả 3 gói **không giới hạn giờ xử lý / độ dài file** (dùng chung Gemini key hệ thống; quá tải → chờ reset hoặc Tự kết nối AI)
- ✅ **Hệ thống Templates**: 3 (Free) / 9 (Pro) / 17 (Ultra); Custom: 5 / 25 / ∞
- ✅ **Phân cấp Preview**: Raw/Markdown (Free) → Static HTML (Pro) → Interactive HTML (Ultra)
- ✅ **Phân cấp Xuất file**: 3 định dạng (Free) → 4 định dạng + Static HTML (Pro) → 4 định dạng + Interactive HTML + Checkbox Multi-Export/ZIP (Ultra)
- ✅ **Bỏ TTS** (Text-to-Speech) hoàn toàn
- ✅ **Bỏ Auto-Sync model free** + bảng `provider_free_models_cache`
- ✅ **Đổi tên BYOK** → "Tự kết nối AI / Nhà cung cấp AI"
- ✅ **Auth**: email/password + Google OAuth (GIS popup)
- Storage:
  - **Neon** — NetworkDB chính để lưu trữ Text, Metadata, JSON, Profile, Notes (cấu trúc dữ liệu).
  - **Cloudflare R2** — Upload file media (Video/Audio/PDF/Docx/ppt) qua Presigned URL, không backup fallback.
- ✅ **Upload file lớn**: Presigned URL (client đẩy thẳng lên R2, tránh giới hạn 4.5MB Vercel); **bóc tách audio trên Inngest worker cloud** (`ffmpeg -c:a copy` streaming + segment 30–60p, KHÔNG re-encode); YouTube caption **client-side** (`youtubei.js`), không có caption → unsupported
- ✅ **Job nền + Polling**: không stream token qua SSE/WebSocket — trình duyệt Polling `/api/notes/status/:jobId` mỗi 2–3s + Stepper 3 bước
- ✅ **Giới hạn AI song song**: key Gemini dùng chung chạy tối đa 1–2 job AI đồng thời (Inngest queue), user Tự kết nối AI dùng luồng riêng chạy ngay
- ✅ **Chống lộ Gemini key**: env `GEMINI_API_KEY` (KHÔNG `NEXT_PUBLIC_`), 100% gọi AI qua server-side route/worker, client không gọi Google AI trực tiếp
- ✅ **Auto Template gating**: chế độ Auto chỉ chọn template trong phạm vi gói user sở hữu (Free→3, Pro→9, Ultra→17)
- ✅ **Block-based `content_structured`**: 17 template trả về Block JSON chuẩn (heading/paragraph/cue_box/table/card_grid/callout...), Export Engine DUY NHẤT render DOCX/PDF/HTML — tránh 17×3=51 converter
- ✅ **Interactive HTML Ultra**: dùng HTML Template tĩnh mẫu + inject `window.__NOTE_DATA__`, KHÔNG để AI tự viết JS từ đầu
- ✅ **Subscription schema**: bảng `subscriptions` (bill_id, plan, amount, status, qr_data, coupon_code, paid_at, renews_at) — xem mục 6

**Chốt bổ sung (2026-08-20) — Pipeline file dài & AI model**:
- ✅ Pipeline file dài (Video/Audio 10–25h) chạy **server-cloud**: Client → R2 (presigned) → **Inngest worker** demux streaming `-c:a copy` + segment **30–60 phút** (KHÔNG re-encode, vượt Lambda 15'/tmp 10GB) → STT từng chunk (overlap 10–15s + silence detection, **trọn vẹn 100%**, timestamp đầy đủ) → Map-Reduce → `content_structured` → Neon.
- ✅ **YouTube caption client-side** (`youtubei.js`): server-side bị Google IP-block. Không có caption → UI báo unsupported.
- ✅ **Email notify**: **Resend** (free tier 3000/tháng) khi Note xong.
- ✅ "Free" = **miễn phí người dùng cuối**, operator tối ưu free tier **có giới hạn** (KHÔNG "free 100% vận hành" / "0đ vô điều kiện").
- ✅ **Đã xác nhận (2026-08-21): BỎ cap cứng 2GB/5h cho free tier — khớp lại quyết định gốc 2026-08-18 ('cả 3 gói không giới hạn giờ xử lý/độ dài file'). Thay bằng safety valve MỀM: khi quota Gemini trong ngày đạt >90%, hệ thống tạm dừng nhận job MỚI (không huỷ job đang chạy), báo user chờ quota reset thay vì chặn cứng theo dung lượng/thời lượng.**
- ✅ **STT hợp nhất về Gemini (2026-08-22, thay cho "STT pool đa nguồn" 2026-08-21)**: toàn bộ transcribe chạy qua Gemini API key dùng chung cho mọi user bất kể BYOK; pool #2 Groq Whisper đã bỏ (không lấy được API key). Chi tiết xem mục 3.1 + 3.2b.
- ✅ **Model lõi: `gemini-3.7-flash` (mới nhất, Stable/GA) làm PRIMARY**, `gemini-2.5-flash` + `gemini-2.0-flash` làm **FALLBACK cascade tự động** (theo chỉ đạo Chủ tịch 2026-08-20: 3.7 chính → lỗi/429 → 2.5 → 2.0). Dispatcher phải implement **failover chain 3 bậc**: gọi 3.7 Flash, bắt `429 Resource Exhausted` / lỗi → retry 2.5 → 2.0 (cùng shared key `GEMINI_API_KEY`). 3.7 Flash giữ nguyên 1M context + 65k output + native audio/video như 2.5. ⚠️ RPM free-tier 3.7 Flash **CHƯA verify được** (login-wall AI Studio, giống 2.5) → failover đảm bảo pipeline không kẹt. Operator nên check RPM 3.7 trong console để tối ưu queue size.
- ✅ **Runtime model = model USER CHỌN từ Model Selector** (lưu trong `AppContext`), KHÔNG hardcode default. Pipeline rẽ nhánh 2 giai đoạn: (1) **STT (audio→text)**: nếu user chọn Gemini → Gemini native audio; nếu user chọn non-Gemini (OpenAI/Claude) → bắt buộc qua **transcription service** (Whisper/equivalent) vì **Claude/OpenAI KHÔNG ingest raw audio/video** (chỉ text+image); (2) **Synthesis (text→note)**: dùng model user chọn (mọi provider đều làm được vì đã là text). User không chọn / chọn Auto → dùng Gemini chung operator (cascade 3.7→2.5→2.0). **BYOK = user trả token riêng** → vừa đỡ tốn Gemini chung, vừa mở model khác (khớp PRD 4.8).
- ❌ Loại bỏ đề xuất "chunk 5 phút" (dựa trên số "free tier 5 phút" KHÔNG có trong Google docs — myth). Chunk chuẩn = 30–60 phút.

**Còn cần xác nhận**:
- Notebook chia sẻ: chỉ xem hay đồng biên tập
- Số lượng thành viên nhóm đồ án — xác nhận với giảng viên (xem mục 8.4)
- Mẫu báo cáo đồ án theo khoa (xin từ giảng viên trước Tuần 10)

---

## 11. Lịch sử thay đổi

| Ngày | Nội dung |
|---|---|
| 2026-08-22 | **Bỏ Groq khỏi STT pool + thêm OpenRouter free fallback cho text**: dồn toàn bộ transcribe về Gemini duy nhất (dùng chung key hệ thống cho mọi user bất kể BYOK nào chọn cho chat/note-generation); OpenRouter free qua alias `openrouter/free` làm tầng fallback thứ 4 CHỈ cho Chat Assistant + Note Generator (KHÔNG cho STT — catalog free OpenRouter không có model Whisper/STT). Lý do bỏ Groq: Zero không lấy được API key (không phải vấn đề kỹ thuật). **Đã implement**: `lib/ai/openrouter-fallback.ts` + wire vào `gemini.ts`/`dispatcher.ts`; test mock pass (`scripts/test-openrouter-fallback.ts`). Chi tiết verify free-tier limits xem DECISIONS.md §24. |
| 2026-08-22 | **Đơn giản hoá hạ tầng pipeline (rollback Cloudflare Workers/Workflows/Queues/Stream)**: quay về kiến trúc đơn-cloud Vercel+Inngest+R2(storage-only)+Gemini+Groq đã validate. Lý do: (1) quy mô 2-cloud (Vercel + Cloudflare Workers/Workflows) vượt khả năng hoàn thành trong 9 tuần còn lại tới deadline Tuần 10, mâu thuẫn mục 8.5; (2) Cloudflare Stream tốn phí thật, mâu thuẫn mục tiêu free 100%; (3) Cloudflare Workers free tier chỉ 10ms CPU/request — quá chặt cho vai trò API layer; (4) số liệu free tier Cloudflare Workflows/Queues chưa verify được, rủi ro lặp lại lỗi đã từng mắc với Stream; (5) bỏ Workers AI Whisper, rút STT pool về 2 nguồn (Gemini + Groq) cho gọn. Giữ nguyên toàn bộ logic ứng dụng: Dual-Engine AI, Map-Reduce 2 tầng, RAG pgvector, Template Registry, Export Engine (mục 3.2c-g) — không đổi. |
| **2026-08-22** | **Architecture v1 Lock + Documentation Alignment Pass.** Gộp toàn bộ kiến trúc vào file PRD duy nhất (`docs/PRD Zero AI Note.md`). Đã tạo tạm thời các file canonical `docs/ARCHITECTURE_V1.md` + 7 ADRs (`docs/adr/ADR-001..007.md`) + 4 technical specs (`AI_PIPELINE.md`, `MEDIA_PROCESSING.md`, `QUOTA_AND_BILLING.md`, `SECURITY.md`); sau đó đã xoá gộp vào PRD để giữ single-file. Schema canonical bổ sung: `projects`, `files`, `jobs` (idempotency_key), `content_chunks`, `knowledge_objects`, `embeddings`, `summaries`, `evidence`, `entities`, `relationships`, `conflicts`, `usage`, `quotas`, `coverage_ledger`. **10 nguyên tắc bất biến**: server-side AI, multi-file, async/durable, resumable/retryable, idempotent, RAG+hierarchical, evidence-first, model-agnostic, quota-aware, free-tier honest. Xóa song song kiến trúc cũ: chunk 5 phút (myth), "free 100% vận hành" (không tồn tại), Stream 10GB free (sai — $5/1k minutes stored). Migration path document inline tại mục 6 PRD. |
| 2026-08-21 | **Bổ sung nguyên tắc tách luồng Chat thường vs Luồng xử lý file (mục 4.1b)** — bảo vệ context window, AI không nhận file thô, hệ thống xử lý triệt để trước rồi mới đưa AI. Verify lại kiến trúc file dài (10h+) qua docs chính chủ Inngest/Vercel/Groq: bỏ mâu thuẫn cap 5h (thay bằng safety valve mềm khi quota >90%), sửa giả định sai timeout worker (Vercel Fluid Compute 300s không phải Lambda 15'), bổ sung Groq Whisper Large v3 Turbo làm STT pool thứ 2, làm rõ keyframe cho video 10h+ theo từng segment, cụ thể hoá policy xoá file media >500MB ngay sau STT để tiết kiệm R2, chốt dứt điểm Inngest. Đổi tên mục BYOK thành 4.9. |
| 2026-08-18 | **Loại bỏ mục Kickoff prompt cho Hermes Agent** (đã qua giai đoạn bắt đầu dự án từ lâu). Đánh số lại: mục 12 "Lịch sử thay đổi" → thành mục 11. Chốt chiến lược kinh doanh: lấy **khả năng upload + xử lý file không giới hạn** làm lợi thế cạnh tranh trực tiếp so với các AI Chatbot (Gemini/ChatGPT/Claude) vốn bị giới hạn upload file — dùng cho marketing, SEO và định vị thị trường. |
| 2026-08-18 | **Bịt 5 điểm nghẽn kỹ thuật + 5 điểm cấn ngầm (Edge Cases & Architectural Traps) trước khi code**: (1) Presigned URL upload + bóc tách audio client-side (Web Audio API/FFmpeg.wasm) + YouTube chỉ audio/captions — tránh giới hạn 4.5MB Vercel; (2) giới hạn AI job song song 1–2 trên key dùng chung (Inngest queue) tránh `429 Resource Exhausted`; (3) bổ sung auth fields (email/password_hash/google_id) vào `profiles` + thêm bảng `subscriptions` (bill_id, plan, amount, status, qr_data, paid_at, renews_at); (4) Block-based `content_structured` chuẩn (heading/paragraph/cue_box/table/card_grid/callout) + Export Engine DUY NHẤT — tránh 17×3=51 converter; (5) Interactive Single-file HTML dùng template tĩnh mẫu + inject `window.__NOTE_DATA__` — không AI tự viết JS. Kèm: Auto Template gating theo gói (chống tier bypass), Polling 2–3s thay vì stream SSE/WebSocket, chống lộ Gemini key (`GEMINI_API_KEY` không `NEXT_PUBLIC_`), luồng thanh toán VietQR production chi tiết (create-bill → render QR qrcode.react → countdown 30 phút → polling 3s + webhook HMAC idempotent). |
| 2026-08-18 | **Đồng bộ Zero Tracking mới** (ZeroInvoice đổi tên): QR thanh toán render client-side bằng `qrcode.react` (EMVCo VietQR payload từ `qr_data`, amount/addInfo locked, bỏ `img.vietqr.io`); sửa `checkZeroInvoiceBillStatus` parse nested `data.bill`; webhook hỗ trợ event `bill.paid` + `data` payload; bỏ hardcode Zero Tracking API key (đọc từ env, fail-closed), webhook fail-open khi chưa set secret. Thêm mục 3.4 hướng dẫn Chrome Remote Debugging cho Hermes `browser_exec`. |
| 2026-08-18 | **Chuẩn hóa bảng giá 3 gói Free/Pro/Ultra; phân cấp Preview (Raw/Markdown/Static HTML/Interactive HTML); phân cấp Xuất file kèm Checkbox Multi-Export cho Ultra; mở rộng hệ thống 17 templates học thuật; bỏ tính năng TTS và Auto-Sync để tối ưu hóa vibe coding; đổi tên BYOK thành Tự kết nối AI.** |
| 2026-08-18 | **Hợp nhất 2 file PRD** (`PRD-Zero-AI-Note.md` + `PRD_Zero_AI_Note.md`) thành 1 file duy nhất. Cập nhật theo hiện trạng triển khai: Neon database chính + Cloudflare R2 backup, JWT auth thay Neon Auth, 3 gói giá chốt con số cụ thể (3h/50h/200h, file 30'/2h/4h — sau đó được thay bằng "không giới hạn thời lượng"), đơn vị tiền tệ theo ngôn ngữ (đ/$) |
| 2026-08-17 | Bổ sung bối cảnh Đồ án Chuyên ngành (deadline Tuần 10 & 15), quyết định storage Neon chính + R2 backup |
| 2026-08-16 | Chuyển từ Supabase sang Neon, bổ sung BYOK chi tiết (Import/Sync free models, Test Connection/Check Model — sau này bỏ Auto-Sync, đổi tên Tự kết nối AI) |
| 2026-08-20 | **Thống nhất Pipeline xử lý file dài (Video/Audio 10–25h) chạy server-cloud**: Client → R2 (presigned) → Inngest worker demux `ffmpeg -c:a copy` streaming + segment 30–60p (KHÔNG re-encode, vượt Lambda 15'/tmp 10GB) → STT từng chunk (overlap 10–15s + silence detection, trọn vẹn 100%, timestamp đầy đủ) → Map-Reduce → `content_structured` → Neon. YouTube caption **client-side** (`youtubei.js`, tránh IP-block); không caption → unsupported. Email notify qua **Resend** free. Ghi rõ "Free" = miễn phí người dùng cuối, operator tối ưu free tier **có giới hạn** (bỏ "free 100% vận hành"). Cap free: 2GB/file, 5h source. **Model: `gemini-3.7-flash` PRIMARY + `gemini-2.5-flash` + `gemini-2.0-flash` FALLBACK cascade tự động (failover chain 3 bậc trên 429)** — theo chỉ đạo Chủ tịch; RPM 3.7 free chưa verify (login-wall) nên cần failover. Bỏ đề xuất "chunk 5 phút" (dựa trên số ảo). |
| 2026-08-20 | **Runtime model = model USER CHỌN** từ Model Selector (`AppContext`), không hardcode. Pipeline rẽ nhánh: STT (Gemini native nếu user chọn Gemini; transcription service nếu user chọn OpenAI/Claude vì 2 provider này **KHÔNG ingest raw audio/video**) → Synthesis (model user chọn, đã là text). User không chọn/Auto → Gemini chung operator cascade 3.7→2.5→2.0. BYOK = user trả token riêng, đỡ tốn Gemini chung. |
| 2026-08-21 | **TÁI CẤU TRÚC TOÀN DIỆN (PRD mục 3.2, 3.3, 3.5, 3.6, 3.7)** — Dual-Engine AI Pipeline (`chat-assistant.ts` + `note-generator.ts`), Config-Driven Template Registry (`lib/templates/registry.ts` 17 templates), Universal Block Schema + Zod Validator + Auto-Repair Loop (2 lần retry), Map-Reduce 2 tầng (STT chunk 30–45' + Structuring chunk 3.000–5.000 từ), RAG Pipeline với Neon pgvector (`source_embeddings`), Universal Export Engine (`lib/export/` md/docx/pdf/static-html/interactive-html). Migration SQL chuẩn hóa `profiles` + `subscriptions` (chuẩn Zero Tracking duy nhất) + `source_embeddings` (pgvector). **Build 0 errors.** |
