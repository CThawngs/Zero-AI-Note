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
- **Ràng buộc 1 tài khoản = 1 mã coupon duy nhất (2026-08-19):** bảng `user_coupons(user_id PK, coupon_code, used_at)`. `validateCouponForPlan(code, plan, userId)` check `user_coupons` → nếu user đã từng dùng coupon nào thì từ chối mọi mã (kể cả mã cũ/hết hạn), trả thông báo "Mỗi tài khoản chỉ được dùng 1 mã duy nhất" vào chuông. `create-invoice` ghi `user_coupons` (insert ... on conflict do nothing) khi bill thành công. Migration `docs/migrations/add_user_coupons.sql` đã chạy thực tế trên Neon (PK enforce verified).
- **Deploy / verify (2026-08-19):** Zero-AI-Note gọi Zero Tracking qua `ZEROINVOICE_BASE_URL` (mặc định `https://zeroinvoice-silk.vercel.app`). Đã redeploy Zero Tracking (`vercel --prod`) → READY; migration `supabase/payment-accounts.sql` (thêm `bills.payee_payment_account_id`) chạy thực tế qua `supabase db query --linked`. Đã fix lỗi app nhầm: `ZEROINVOICE_API_KEY` của Zero-AI-Note phải là api_key của app "Zero AI Note" (UUID `77f87388-...`), không phải app "Zero LLM" (`zi_17762c7f...`).
- **Kiến trúc DB tách biệt (quan trọng):** Zero-AI-Note dùng **Neon Postgres + Cloudflare R2** (đúng PRD, đã migration từ Supabase 2026-08-16). **Zero Tracking là project riêng biệt**, dùng **Supabase** của nó. Hai project giao tiếp qua **HTTP REST API + api_key** (`POST /api/bills`), KHÔNG share DB, Zero-AI-Note không kết nối trực tiếp Supabase của Zero Tracking. Supabase chỉ là nơi Zero Tracking lưu bills/apps/payment_accounts nội bộ; QR được Zero-AI-Note nhận qua response JSON.
- **Secrets:** `.env.local` được git-ignore; `ZEROINVOICE_API_KEY` (app key `zi_...`) chỉ nằm server-side, không lộ client. Không commit credential.

### AI Provider & Model (BYOK) — 2026-08-20
- `src/data/modelCatalog.ts`: `BYOK_PROVIDER_PRESETS` hỗ trợ 8 nhà cung cấp (Google, OpenAI, Anthropic Claude, OpenRouter, Groq, NVIDIA NIM, Local Ollama, Custom Endpoint), mỗi preset có `logoUrl` (SVG brand thật từ website chính chủ, lưu local `public/assets/providers/*.svg`) + `logoEmoji` fallback.
- **Khóa bảo vệ Verified Providers**: Đối với các nhà cung cấp chuẩn quốc tế đã xác minh (`isVerified: true`), `Provider ID` và `Endpoint URL` được đặt ở chế độ **Disabled / Read-only** (kèm icon `Lock`), tránh người dùng vô tình làm hỏng cấu hình kết nối chuẩn.
- **Hỗ trợ Đa Máy Chủ Custom Endpoints**:
  - Hỗ trợ lưu trữ **nhiều** Custom Endpoint khác nhau trong cùng một tài khoản người dùng (miễn là khác tên hiển thị).
  - Cho phép người dùng nhập Endpoint URL tùy ý (`https://...` hoặc `http://localhost:...`).
  - `Provider ID` không bắt buộc nhập — hệ thống tự động sinh slug an toàn dựa trên tên hiển thị (`custom_${slugify(name)}_${timestamp}`).
- **Model Mặc định Tùy chọn (Optional Default Model)**:
  - Trường `Default Model` là tùy chọn cho toàn bộ các Provider. Nếu để trống, hệ thống tự động gán model tối ưu chuẩn tương ứng.
- **Validation Toàn diện**:
  - Kiểm tra hợp lệ định dạng URL (`http://` hoặc `https://`), kiểm tra trùng lặp tên hiển thị và kiểm tra API Key bắt buộc cho Cloud providers với thông báo lỗi inline trực tiếp.
- **AddProviderModal**: input API Key chuyển viền xanh (`var(--status-success)`) + nền xanh nhạt khi test thành công. **1 button duy nhất 2 trạng thái**: "⚡ Test Kết Nối" (khi chưa connected) → sau success chuyển thành "Lưu & Kích Hoạt" (màu xanh lá). Test gọi `POST /api/providers/test` (thực sự kết nối: Google models list / Anthropic messages / OpenAI-compatible chat/completions / models fallback discovery).
- **Real-time notification (chuông):** mọi kết quả test (success/error) đẩy vào `addNotification` → hiện trong Bell (Header) kèm badge số chưa đọc (`hasUnreadNotifications`), real-time theo account.
- **Multi-model & Model Selector Integration**: ngoài default model, user thêm nhiều model LLM khác — mỗi model có input + nút Test riêng, chỉ lưu (`prov.models`) khi test pass. Toàn bộ model này được tự động map vào dropdown chọn Model trên `Header.tsx`.
- `AIProviderItem` mở rộng: `models?`, `logoUrl?`, `logoEmoji?`, `apiKey?`, `isCustomEndpoint?`. Cấu hình được tự động lưu trữ bền vững trong `localStorage`.

### Living Note Architecture & Thư viện Ghi chú (2026-08-19)
- **Kiến trúc Living Note (1 Phiên = 1 Living Note):**
  - Trong cùng 1 phiên chat, AI duy trì duy nhất 1 file Note động (`activeArtifactNote`).
  - Mọi yêu cầu chỉnh sửa/bổ sung/tóm tắt lại trong phiên đều thực hiện **In-place Update (cập nhật đè)** vào file Note hiện tại trên DB (`on conflict (id) do update set...`) mà không sinh ra các file note trùng lặp rác.
  - Tạo file Note mới chỉ diễn ra khi người dùng chủ động bấm `+ Cuộc trò chuyện & Note mới` để bắt đầu chủ đề nghiên cứu mới.
- **Thư viện Ghi chú (`LibraryScreen.tsx` / `Notes`):**
  - Đóng vai trò là trung tâm quản lý các thành phẩm ghi chú học thuật chất lượng cao (Cornell, Outline, Feynman, Q&A,...).
  - Hỗ trợ xem chi tiết, tiếp tục chat mở rộng, xem trước nhanh (Quick Preview), đổi tên, ghim và xuất bản (DOCX/PDF/HTML).
- **Thùng rác & Lưu trữ 30 ngày (`ArchivesScreen.tsx`):**
  - Chuyển tính năng Xóa thành Lưu trữ 30 ngày (`Archive`).
  - Đếm ngược chính xác 30 ngày (`daysLeft`).
  - Nút **Khôi phục (Restore)** đưa phiên làm việc và ghi chú trở lại Thư viện Ghi chú ngay lập tức và hủy bỏ đếm ngược xóa.
  - Nút **Xóa vĩnh viễn (Permanent Delete)** với popup xác nhận an toàn.
- **Sidebar Quick Switcher:**
  - Mục điều hướng chính: `📝 Ghi chú (Notes)`.
  - Mục `Hội thoại gần đây (Recent Chats)` ở sidebar đóng vai trò là Quick Switcher để nhảy nhanh vào các phiên làm việc đang dang dở.

### Nguyên tắc bất biến
1. `content_structured` (JSON) là nguồn DUY NHẤT cho Preview + mọi export (MD/DOCX/PDF/HTML)
2. Billing fail-closed; tracking/analytics fail-open
3. RLS trên mọi bảng chứa dữ liệu cá nhân
4. API key BYOK mã hoá, không log, không lộ client
5. SSRF validate server-side cho Custom Endpoint
6. Free models cache dùng chung theo provider (`provider_free_models_cache`)
7. Không màu Tailwind hardcode — mọi màu qua theme token
8. Không mock/fake data ở UI — mọi dữ liệu query Neon thật
9. Discount Type của Coupons luôn luôn là phần trăm (`%`) từ 1-100% (không hỗ trợ VND cố định).
10. Mỗi phiên chat là một luồng nghiên cứu độc lập gắn liền với Note Artifact trong trang Lịch sử.

### Pipeline xử lý file (PRD mục 3.2)
```
Upload → Enqueue job → Phase 1: Transcribe (STT chunk + map-reduce, ưu tiên phụ đề YouTube)
→ Phase 2: Structure theo method (Cornell/Outline/Q&A/Flashcard/... hoặc Auto)
→ Phase 3: Sinh content_structured → Preview + Export
→ Notify user (email/in-app)
```