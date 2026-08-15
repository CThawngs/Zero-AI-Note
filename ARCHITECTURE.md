# ARCHITECTURE — Zero AI Note

> Sơ đồ kiến trúc hiện tại, cập nhật mỗi khi có thay đổi lớn.

## Trạng thái: 2026-08-15 — Đang chuyển từ UI-only sang full-stack

### Hiện tại (trước Tuần 1-2)
```
[Vite + React 19 + Tailwind v4]  ← UI hoàn thiện từ Google AI Studio (11 màn, 12 theme)
  ├── src/components/        ← components common/screens/modals
  ├── src/context/           ← AppContext (state giả lập, dữ liệu mock)
  ├── src/data/mockData.ts   ← MOCK — sẽ thay thế bằng dữ liệu thật
  ├── src/i18n/              ← đa ngôn ngữ VI/EN
  ├── src/utils/themeTokens.ts ← 12 theme × dark/light
  └── src/index.css          ← theme tokens, font scale, utilities
[Express server nhẹ (đã có trong deps)] — chưa dùng
```

### Mục tiêu (theo PRD mục 3.1, master prompt)
```
[Next.js app router trên Vercel]
  ├── app/ (pages + API routes)
  ├── src/components/        ← GIỮ NGUYÊN từ Vite (không thiết kế lại)
  ├── src/context/           ← thay dữ liệu mock bằng data thật từ API
  ├── lib/supabase/          ← client + server (RLS)
  ├── lib/ai/                ← pipeline: transcribe → structure → content_structured
  ├── lib/billing/           ← ZeroInvoice webhook (fail-closed, idempotent)
  ├── lib/jobs/              ← Inngest/Trigger.dev (xử lý file dài)
  └── lib/byok/              ← adapter từng provider + cache free models

[Supabase] — Auth (Google OAuth + email/password), Postgres (RLS), Storage
[Inngest/Trigger.dev] — job nền xử lý file dài
[ZeroInvoice] — billing thật (webhook xác minh chữ ký, idempotent)
[AI Providers] — Google AI (default), OpenAI, Anthropic, NVIDIA, Groq, OpenRouter, DeepSeek, Grok + BYOK custom
```

### Nguyên tắc bất biến
1. `content_structured` (JSON) là nguồn DUY NHẤT cho Preview + mọi export (MD/DOCX/PDF/HTML)
2. Billing fail-closed; tracking/analytics fail-open
3. RLS trên mọi bảng chứa dữ liệu cá nhân
4. API key BYOK mã hoá, không log, không lộ client
5. SSRF validate server-side cho Custom Endpoint
6. Free models cache dùng chung theo provider (`provider_free_models_cache`), không polling riêng từng user
7. Không màu Tailwind hardcode — mọi màu qua theme token

### Pipeline xử lý file (PRD mục 3.2)
```
Upload → Enqueue job → Phase 1: Transcribe (STT chunk + map-reduce, ưu tiên phụ đề YouTube)
→ Phase 2: Structure theo method (Cornell/Outline/Q&A/Flashcard/... hoặc Auto)
→ Phase 3: Sinh content_structured → Preview + Export
→ Notify user (email/in-app)
```
