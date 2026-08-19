# ARCHITECTURE — Zero AI Note

> Sơ đồ kiến trúc hiện tại, cập nhật mỗi khi có thay đổi lớn.

## Trạng thái: 2026-08-16 — Đã migration Supabase → Neon, hoàn thiện Tuần 1-2

### Hiện tại (sau Tuần 1-2)
```
[Next.js 16 App Router → deploy Vercel]
  ├── app/                        ← pages + API routes
  │   ├── (landing)/page.tsx      ← / : landing công khai (SEO)
  │   ├── app/page.tsx            ← /app : dashboard SPA (bắt buộc login)
  │   ├── docs/page.tsx           ← /docs : tài liệu công khai (SEO)
  │   ├── api/auth/*              ← register/login/session (JWT + bcrypt)
  │   ├── api/admin/coupons       ← CRUD coupon (admin only)
  │   ├── api/coupons/apply       ← áp mã giảm giá (cần login)
  │   └── api/health              ← health check DB
  ├── middleware.ts               ← bảo vệ /app, admin routes, redirect logic
  ├── lib/
  │   ├── db.ts                   ← Neon serverless driver singleton
  │   ├── auth/                   ← session (jose JWT), admin, http, password
  │   ├── neon/queries.ts         ← CRUD notes/sources/coupons/profile
  │   └── storage.ts              ← abstraction Storage (Neon Object Storage / R2)
  └── src/                        ← UI giữ nguyên từ Google AI Studio
      ├── components/             ← common/screens/modals
      ├── context/AppContext.tsx  ← data thật từ Neon (bỏ mock)
      ├── i18n/                   ← VI/EN
      └── utils/themeTokens.ts    ← 12 theme × dark/light

[Neon Postgres] — serverless, RLS (Row-Level Security), 10 bảng
[Ngrok/Server khác] — tuỳ chọn
[Cloudflare R2 / Neon Object Storage] — file storage (chờ chốt)
[JWT (HS256)] — cookie HttpOnly 7 ngày, bcryptjs
```

### Routing & Middleware (mục 5, 8)
| Route | Chưa đăng nhập | Đã đăng nhập |
|---|---|---|
| `/` | Landing page (200) | Redirect → `/app` (307) |
| `/app` | Redirect → `/` (307) | Dashboard (200) |
| `/docs` | Công khai (200) | Công khai (200) |
| `/api/admin/coupons` | 401/403 | Admin: CRUD; user thường: 403 |

### Admin hardcode (mục 6)
- `ADMIN_EMAIL` (`.env.local`) là nguồn duy nhất xác định admin
- Register tự gán role `admin` khi email khớp
- Route coupon kiểm tra `isAdmin()` server-side (không chỉ RLS/UI)
- RLS coupons: `admin manages coupons` — only admin role

### Storage (mục 3) — QUYẾT ĐỊNH: Neon database chính + Cloudflare R2 backup (2026-08-17)
- `lib/storage.ts` là lớp trừu tượng chung (interface StorageService)
- **Neon Postgres**: lưu trữ chính (notes, sources, metadata, toàn bộ dữ liệu app)
- **Cloudflare R2**: backup file storage — dùng khi Neon database đầy, chứa media/file upload (S3-compatible)
- Env cần: `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`

### Zero Tracking & Coupon (2026-08-19)
- `lib/billing/zeroinvoice.ts` — lớp gọi Zero Tracking (fail-closed nếu thiếu `ZEROINVOICE_API_KEY`). Thêm `listZeroTrackingPaymentAccounts()` gọi `GET /api/partner/payment-accounts` (app API key `zi_...`).
- `lib/billing/coupon.ts` — hàm tính giảm giá thuần (tách khỏi file `"use server"` queries để không vi phạm server-action async rule).
- **Realtime payee switch:** App gửi `payment_account_id` trong body `POST /api/bills` của Zero Tracking → bill đó route đúng TK/Ví (bank/MoMo/ZaloPay) realtime. Zero-AI-Note:
  - `GET /api/billing/payment-accounts` (server proxy, key không lộ client)
  - `PricingScreen` + `PaymentQrModal` render combobox chọn TK nhận tiền; đổi trước khi thanh toán → gọi lại `create-invoice` tạo bill mới với `payment_account_id` → QR mới nhận đúng TK.
  - Fallback chain: body override → `apps.payment_account_id` → TK default user → profile. Tenant isolation: account phải thuộc user sở hữu app.
  - `subscriptions.payment_account_id` snapshot để trace (migration `docs/migrations/add_subscriptions_payment_account.sql`).
- **Coupon backend (không còn chỉ frontend):** `validate-coupon` chỉ validate read-only (KHÔNG tăng `usage_count`). `create-invoice` validate → tính giảm giá → tạo bill → lưu `subscriptions` (`coupon_code` + `payment_account_id`) → tăng `usage_count` đúng 1 lần khi bill thành công. `applyCouponCode` (UI) gọi `validate-coupon` preview, không đổi plan, không redeem.

### Nguyên tắc bất biến
1. `content_structured` (JSON) là nguồn DUY NHẤT cho Preview + mọi export (MD/DOCX/PDF/HTML)
2. Billing fail-closed; tracking/analytics fail-open
3. RLS trên mọi bảng chứa dữ liệu cá nhân
4. API key BYOK mã hoá, không log, không lộ client
5. SSRF validate server-side cho Custom Endpoint
6. Free models cache dùng chung theo provider (`provider_free_models_cache`)
7. Không màu Tailwind hardcode — mọi màu qua theme token
8. Không mock/fake data ở UI — mọi dữ liệu query Neon thật

### Pipeline xử lý file (PRD mục 3.2)
```
Upload → Enqueue job → Phase 1: Transcribe (STT chunk + map-reduce, ưu tiên phụ đề YouTube)
→ Phase 2: Structure theo method (Cornell/Outline/Q&A/Flashcard/... hoặc Auto)
→ Phase 3: Sinh content_structured → Preview + Export
→ Notify user (email/in-app)
```