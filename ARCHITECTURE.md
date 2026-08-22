# Architecture — Zero AI Note (Pointer)

> **Canonical**: [`docs/PRD Zero AI Note.md`](./docs/PRD%20Zero%20AI%20Note.md)
>
> File này là pointer / stub. Mọi quyết định kiến trúc tham chiếu tới PRD canonical.

## Canonical Architecture

Kiến trúc đơn-cloud (đã đơn giản hoá 2026-08-22, rollback Cloudflare Workers/Workflows/Stream):

- **Frontend + API**: Next.js (Vercel)
- **Orchestration**: Inngest (`/api/inngest`)
- **Storage**: Cloudflare R2 (storage-only)
- **DB**: Neon PostgreSQL + pgvector
- **AI**: Gemini API + Groq Whisper + BYOK
- **Billing**: Zero Tracking
- **Email**: Resend

## Canonical Doc

[`docs/PRD Zero AI Note.md`](./docs/PRD%20Zero%20AI%20Note.md) — PRD duy nhất, chứa toàn bộ:
- 10 nguyên tắc bất biến (mục 3.0)
- Tech stack (mục 3.1)
- Luồng xử lý chính (mục 3.2, 3.2b)
- Dual-Engine AI (mục 3.2c)
- Hierarchical Multi-Stage Map-Reduce (mục 3.2d)
- RAG pgvector (mục 3.2e)
- Template Registry (mục 3.2f)
- Universal Block Export (mục 3.2g)
- Project & Job Model (mục 4.0)
- MediaProcessor abstraction (mục 4.0.4)
- Quota/Billing policy (mục 5)
- Database Schema (mục 6)
- Roadmap 8 phases (mục 9)
- Lịch sử thay đổi (mục 11)

## Schema

Canonical DDL: [`docs/schema-neon.sql`](./docs/schema-neon.sql).
