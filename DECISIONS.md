# Zero AI Note — Technical Decisions

## 1. Database Migration (Supabase → Neon)

### Decision
- **Database**: Neon Postgres (serverless) thay cho Supabase
- **ORM**: Drizzle ORM (thay cho Supabase client)
- **Schema**: 10 bảng + RLS + index, tương thích Neon
- **Auth**: JWT tự phát hành (thay cho Supabase Auth)

### Rationale
- **Neon** cung cấp Postgres serverless với RLS, tương thích tốt với Vercel
- **Drizzle ORM** nhẹ, type-safe, hỗ trợ tốt cho Neon
- **JWT** đơn giản, dễ tích hợp với middleware Next.js
- **RLS** dùng `auth_uid()` dựa trên `current_setting('request.jwt.claims')` (chuẩn Neon)

### Implementation
- Schema: `docs/schema-neon.sql`
- Connection: `@neondatabase/serverless`
- Auth: `jose` + `bcryptjs`
- Session: cookie `zero_ai_note_session` (HttpOnly, Secure, SameSite=Lax)

### Migration Steps
1. Export schema từ Supabase sang cú pháp Postgres chuẩn
2. Cài `@neondatabase/serverless` và `drizzle-orm`
3. Thay `supabase.from(...)` bằng query Postgres trực tiếp
4. Viết RLS policy dùng `auth_uid()` thay cho `auth.uid()`

---

## 2. Auth Migration (Supabase Auth → Neon Auth)

### Decision
- **Auth**: JWT tự phát hành (HS256) thay cho Supabase Auth
- **Session**: cookie HttpOnly với TTL 7 ngày
- **Password**: bcryptjs (thay cho Supabase Auth)
- **OAuth**: Google OAuth (chưa triển khai, chờ Neon DB sẵn sàng)

### Rationale
- **JWT** đơn giản, không phụ thuộc vào Supabase
- **Cookie HttpOnly** bảo mật hơn localStorage
- **bcryptjs** tiêu chuẩn cho password hashing
- **Google OAuth** sẽ triển khai sau khi Neon DB ổn định

### Implementation
- **Login**: `POST /api/auth/login` → trả về JWT trong cookie
- **Register**: `POST /api/auth/register` → tạo user + trả về JWT
- **Session**: `verifySession()` kiểm tra JWT trong cookie
- **Middleware**: kiểm tra session JWT trên mọi route không public

### Security
- Cookie: `HttpOnly`, `Secure` (production), `SameSite=Lax`
- JWT: HS256, TTL 7 ngày, secret trong `ZERO_JWT_SECRET`
- RLS: dùng `auth_uid()` để kiểm tra quyền truy cập

---

## 3. Storage Migration (Neon database chính + Cloudflare R2 backup)

### Decision
- **Primary Storage**: Neon Postgres database (QUYẾT ĐỊNH CHÍNH THỨC 2026-08-17) — lưu notes, sources, metadata, toàn bộ dữ liệu app
- **Backup Storage**: Cloudflare R2 (S3-compatible) — dùng khi Neon database đầy, chứa media/file upload
- **Loại bỏ**: Neon Object Storage (Beta) — project Neon hiện ở `ap-southeast-1`, không đáp ứng yêu cầu `us-east-2` + project mới; Zero chọn **giữ nguyên project Neon ap-southeast-1** (phương án C)
- **Abstraction Layer**: `lib/storage.ts` để dễ dàng chuyển đổi sau này (nếu Neon Object Storage mở rộng region trong tương lai)

### Rationale
- **Neon Postgres** là database chính, chi phí thấp, serverless, tự scale — phù hợp lưu dữ liệu cấu trúc của app
- **Cloudflare R2** backup khi Neon đầy (free tier cao 10GB, S3-compatible, không giới hạn region)
- **Giữ project Neon ap-southeast-1**: dữ liệu đã có (profiles, coupons, notes...), tránh di dời lại DB chỉ vì storage
- **Abstraction Layer** đảm bảo dễ dàng chuyển đổi khi Neon Object Storage hết Beta hoặc mở rộng region

### Implementation
- **Database chính**: Neon Postgres — mọi CRUD notes/sources/coupons/profile qua `lib/neon/queries.ts`
- **Storage Service**: `lib/storage.ts` — R2 là implementation backup (presign upload/delete/public URL qua AWS SDK)
- **Presigned URL**: sinh URL upload/download qua S3 Request Presigner (chỉ kích hoạt khi cần backup file)
- **Database Tracking**: bảng `uploads` để theo dõi trạng thái upload
- **RLS**: bảng `uploads` bật RLS để bảo vệ dữ liệu người dùng

### Configuration (Cloudflare R2)
- `R2_ENDPOINT` (vd `https://<accountid>.r2.cloudflarestorage.com`)
- `R2_ACCESS_KEY`, `R2_SECRET_KEY` (tạo từ Cloudflare Dashboard → R2 → Manage R2 API Tokens)
- `R2_BUCKET` (tên bucket, vd `zero-ai-note`)
- `R2_PUBLIC_URL` (tuỳ chọn, domain public custom nếu bật Public Access)

---

## 4. Admin Hardcode

### Decision
- **Admin Email**: hardcode trong `.env.local` (`ADMIN_EMAIL`)
- **RLS**: bảng `coupons` kiểm tra email admin qua RLS
- **Server-Side Check**: mọi API route Coupon kiểm tra admin trước khi thực thi

### Rationale
- **Hardcode email** an toàn hơn gõ tay trong code
- **RLS** bảo vệ dữ liệu cấp database
- **Server-Side Check** bảo vệ API khỏi gọi trái phép

### Implementation
- **Environment Variable**: `ADMIN_EMAIL=nguyenchithang2804@gmail.com`
- **RLS Policy**: `exists (select 1 from profiles where id = auth_uid() and email = current_setting('app.admin_email'))`
- **API Check**: `isAdmin(request)` kiểm tra session và email

---

## 5. Fake Data Removal

### Decision
- **Xoá toàn bộ mock data** trong `src/data/mockData.ts`
- **Thay bằng query thật** tới Neon DB
- **UI rỗng** khi không có dữ liệu (không dùng placeholder "cho đẹp")

### Rationale
- **Dữ liệu thật** đảm bảo tính nhất quán
- **Không fake data** tránh nhầm lẫn trong phát triển
- **UI rỗng** phản ánh đúng trạng thái hệ thống

### Implementation
- **Xoá mock data**: `initialNotes`, `initialCoupons`, `initialSourceFiles`
- **Thêm `useEffect`**: load data khi user đăng nhập
- **CRUD thật**: dùng `lib/neon/queries.ts` thay vì mock data

---

## 6. Landing Page + Docs

### Decision
- **Landing Page**: `/` (công khai, không đăng nhập)
- **Docs Page**: `/docs` (công khai, không đăng nhập)
- **Nội dung thật**: không placeholder "Lorem ipsum"

### Rationale
- **Landing page** thu hút người dùng mới
- **Docs page** giúp người dùng hiểu sản phẩm
- **Nội dung thật** chuyên nghiệp, dễ SEO

### Implementation
- **Landing Page**: `app/(landing)/page.tsx`
- **Docs Page**: `app/docs/page.tsx`
- **Metadata**: SEO-friendly title và description
- **Navigation**: link giữa landing, docs, login

---

## 7. Middleware (Bắt buộc đăng nhập)

### Decision
- **Middleware**: kiểm tra session JWT trên mọi route không public
- **Redirect**: chưa đăng nhập → `/login`
- **Admin Check**: route admin kiểm tra role và email

### Rationale
- **Bảo mật**: ngăn truy cập trái phép vào dashboard
- **Trải nghiệm người dùng**: redirect tự động khi chưa đăng nhập
- **Admin**: bảo vệ route admin khỏi truy cập trái phép

### Implementation
- **Middleware**: `middleware.ts`
- **Public Routes**: `/`, `/login`, `/register`, `/docs`, `/api/auth/*`, `/api/health`
- **Admin Routes**: `/admin-coupons` (kiểm tra role và email)

---

## 8. Tech Stack

| Component          | Technology                          | Rationale                                                                 |
|--------------------|-------------------------------------|----------------------------------------------------------------------------|
| **Frontend**       | Next.js 16, React 19, Tailwind CSS  | Full-stack framework, SSR/SSG, styling nhanh                              |
| **Database**       | Neon Postgres (serverless)          | Postgres serverless, RLS, tương thích Vercel                              |
| **ORM**            | Drizzle ORM                         | Type-safe, nhẹ, hỗ trợ tốt cho Neon                                       |
| **Auth**           | JWT (HS256) + bcryptjs              | Đơn giản, không phụ thuộc vào bên thứ ba                                  |
| **Storage**        | Neon Object Storage / Cloudflare R2 | Neon Object Storage (Beta) hoặc R2 (ổn định)                              |
| **AI**             | Google GenAI, BYOK                  | Google GenAI miễn phí, BYOK cho OpenAI/Anthropic                          |
| **Deployment**     | Vercel                              | Tích hợp tốt với Next.js, CI/CD đơn giản                                  |

---

## 9. Deployment

### Decision
- **Hosting**: Vercel
- **Database**: Neon Postgres
- **Storage**: Neon Object Storage hoặc Cloudflare R2
- **CI/CD**: GitHub Actions

### Rationale
- **Vercel**: tích hợp tốt với Next.js, CI/CD đơn giản
- **Neon**: Postgres serverless, tương thích Vercel
- **Storage**: linh hoạt giữa Neon Object Storage và R2
- **CI/CD**: tự động build và deploy khi push lên `main`

### Implementation
- **Vercel**: kết nối GitHub repo
- **Environment Variables**: cấu hình trong Vercel dashboard
- **CI/CD**: GitHub Actions cho build và test

---

## 10. Future Considerations

### Neon Object Storage
- Theo dõi khi Neon Object Storage ra khỏi Beta
- Cập nhật `lib/storage.ts` khi SDK chính thức được phát hành

### Google OAuth
- Triển khai khi Neon DB ổn định
- Sử dụng Neon Auth hoặc NextAuth.js

### BYOK (Bring Your Own Key)
- Mở rộng BYOK cho nhiều nhà cung cấp AI hơn
- Thêm caching cho API key để giảm latency

### Multi-region Support
- Triển khai multi-region nếu cần
- Sử dụng Cloudflare R2 cho storage đa vùng

---

## 11. Migration Checklist

### Completed ✅
- [x] Database migration (Supabase → Neon)
- [x] Auth migration (Supabase Auth → JWT)
- [x] Storage abstraction layer
- [x] Fake data removal
- [x] Admin hardcode (environment variable)
- [x] Middleware (bắt buộc đăng nhập)
- [x] Landing page + docs page
- [x] DECISIONS.md documentation
- [x] Routing: `/app` = dashboard (login required), `/` = landing (redirect if logged in)
- [x] Coupon CRUD hoàn chỉnh (admin) + `/api/coupons/apply` (user login)
- [x] Bảng `uploads` + RLS migrate lên Neon
- [x] Test thật end-to-end: register → login → coupon CRUD → apply (verified DB)

### Pending ⏳
- [ ] Storage integration (Neon Object Storage or R2) — chờ Zero chốt
- [x] Google OAuth implementation — ✅ hoàn tất 2026-08-18
- [ ] BYOK provider caching
- [ ] Multi-region deployment

---

## 12. Lessons Learned

1. **Schema Migration**: Export schema từ Supabase sang cú pháp Postgres chuẩn cần kiểm tra kỹ constraint và index
2. **RLS Policy**: Cú pháp RLS của Neon khác Supabase (`auth_uid()` thay cho `auth.uid()`)
3. **Storage Abstraction**: Viết abstraction layer ngay từ đầu giúp dễ dàng chuyển đổi giữa các dịch vụ storage
4. **Admin Hardcode**: Sử dụng environment variable cho admin email an toàn hơn gõ tay trong code
5. **Fake Data**: Xoá fake data sớm để tránh lệ thuộc vào mock data trong phát triển
6. **Middleware**: Triển khai middleware sớm để bảo vệ route không public
7. **Documentation**: Ghi lại quyết định kỹ thuật ngay khi triển khai để tránh quên sau này

---

## 13. Security Audit — Secret Scan (2026-08-17)

### Audit Result
- **Công cụ**: `gitleaks v8.24.3` (open source, free 100%) quét full lịch sử Git (38 commits) + quét thủ công bằng grep patterns
- **Kết quả**: ✅ **KHÔNG phát hiện secret thật nào từng lộ trong lịch sử Git**
  - Neon connection string thật (`ep-frosty-morning`, `npg_jD6yf4...`) → 0 lần xuất hiện
  - Cloudflare R2 keys (`bb4cd6b4...`, `e8f9fbaf...`, `cfut_aC07...`, `7d1c250f...`) → 0 lần xuất hiện
  - AI provider keys, ZeroInvoice keys → không có
- **Kết luận**: Không cần rotate key — mọi giá trị thật chỉ nằm trong `.env.local` (đã gitignore), chưa từng bị commit.

### Fixes đã áp dụng (phòng ngừa lộ trong tương lai)
1. **`.gitignore`**: thêm `.env` và `.env.*` (trước chỉ chặn `.env*.local`) — chặn triệt để mọi biến thể env
2. **`lib/auth/session.ts`**: bỏ JWT fallback secret hardcode (`dev-zero-ai-note-secret-change-me`) — giờ fail-closed (throw error nếu thiếu `ZERO_JWT_SECRET`), không dùng secret mặc định public
3. **`.env.example`**: liệt kê ĐẦY ĐỦ biến env (NEON_DATABASE_URL, ZERO_JWT_SECRET, ADMIN_EMAIL, R2_*, GEMINI_API_KEY, OPENAI_API_KEY, ZEROINVOICE) — là "bản đồ" duy nhất sau khi xoá máy local

### Cloud-First (độc lập máy local)
- Giá trị thật phải nhập vào **Vercel Dashboard → Settings → Environment Variables** (không lưu local)
- Vercel project phải liên kết GitHub repo (auto-deploy mỗi commit `main`)

---

## 14. Google OAuth — Security Fix (2026-08-18)

### Problem
- `GoogleSignInButton.tsx` fallback sang dummy Client ID `1047462061234-sample.apps.googleusercontent.com` khi thiếu `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → Google trả `Error 401: invalid_client`
- Backend route `app/api/auth/google/route.ts` chỉ decode base64 JWT payload mà KHÔNG verify chữ ký Google → **lỗ hổng bảo mật critical**: attacker có thể forge JWT giả với email bất kỳ

### Fix Applied
1. **GoogleSignInButton.tsx**: Bỏ dummy fallback → fail-closed (hiện "Google Sign-In chưa được cấu hình" khi thiếu env var). Xóa `any` types → `GoogleAuthResponse` typed interface.
2. **app/api/auth/google/route.ts**: Thay `decodeJwtPayload()` bằng `google-auth-library` `OAuth2Client.verifyIdToken()` — verify chữ ký crypto + audience + expiry + issuer. Trả `401` nếu token không hợp lệ, `503` nếu server chưa cấu hình.
3. **middleware.ts**: Thêm `/api/auth/google` vào `PUBLIC_ROUTES`.
4. **LoginScreen.tsx**: Map `GoogleAuthResponse` → `UserProfile` (thêm `name`, `avatar` fields).
5. **`.env.example`**: Thêm `NEXT_PUBLIC_GOOGLE_CLIENT_ID` vào bản đồ env.

### [ANTIGRAVITY QUYẾT ĐỊNH]
- Dùng `google-auth-library` (Google official SDK) thay vì `jsonwebtoken` + JWKS fetch thủ công — lý do: SDK chính thức handle cả key rotation, caching, retry tự động.
- Google Sign-In button hiện thông báo thay vì render button lỗi khi thiếu Client ID — lý do: fail-closed (PRD mục 3.3), tránh UX xấu khi user click button sẽ fail.

---

## 15. Core AI Generation Pipeline & Multi-Format Export (Tuần 3-4 MVP) (2026-08-18)

### Problem
- Trước đây hệ thống sử dụng simulation timeout và mock template trong `AppContext.tsx` để giả lập việc tạo ghi chú.
- Các nút tải file trong Artifact Panel chỉ hiển thị toast thông báo mà không sinh ra file thực tế.

### Fix & Architecture Applied
1. **Google Gemini 2.0 Flash AI Engine (`lib/ai/gemini.ts`)**:
   - Tích hợp `@google/genai` chính thức từ Google.
   - Nhận diện phương pháp (`auto`, `cornell`, `outline`, `qa`, `flashcard`, `quick-summary`, `executive-summary`, `custom`).
   - Trả về JSON `StructuredNoteOutput` với đầy đủ cấu trúc: `title`, `method`, `summary`, `category`, `keywords`, `coreQuestions`, `content` (overview, sections, cues, notes, definitions, bulletPoints, tableData, summaryText) và `rawMarkdown`.
2. **Nguồn Dữ Liệu Duy Nhất (`content_structured`)**:
   - `content_structured` JSON là nguồn duy nhất để render Preview trên web và sinh mọi file export, tuyệt đối không parse ngược từ HTML.
3. **Multi-Format Export Engine (`lib/export/`) & `/api/notes/export`**:
   - **DOCX**: Sử dụng thư viện `docx` chính thức để tạo file Microsoft Word `.docx` thật, với bảng Cornell 2 cột (Cues bên trái, Notes bên phải, Summary ở cuối) và phân cấp Outline chuẩn.
   - **PDF**: Tạo giao diện HTML chuẩn in ấn và kích hoạt hộp thoại lưu PDF của trình duyệt.
   - **Markdown (.md)**: Tạo file Markdown GFM tương thích 100%.
   - **HTML (.html)**: Tạo tài liệu HTML độc lập có sẵn style CSS chuyên nghiệp.
4. **Artifact Panel Integration (`src/components/screens/ArtifactPanel.tsx`)**:
   - Cho phép chọn tải một hoặc nhiều định dạng cùng lúc (Multi-format parallel download).
   - Tích hợp Copy vào Clipboard tức thì và Code/Markdown raw view.
5. **Database Persistence**:
   - Lưu trữ trực tiếp ghi chú mới vào bảng `notes` trên Neon Serverless Postgres.
   - Cập nhật số phút xử lý `processing_minutes_used` trong `profiles`.

---

## 16. Living Note Architecture & Notes Library Transition (2026-08-19/20)

### Problem
- Khi người dùng chat trao đổi qua lại với AI trong cùng một chủ đề, mỗi lượt phản hồi trước đây có nguy cơ sinh ra một file Note mới độc lập, gây phân mảnh dữ liệu và làm rác giao diện thư viện ghi chú.

### Decision & Implementation
1. **1 Phiên Chat = 1 Living Note (`activeArtifactNote`)**:
   - Duy trì duy nhất một file ghi chú sống động cho mỗi phiên nghiên cứu.
   - Khi người dùng gửi thêm tin nhắn yêu cầu bổ sung, tóm tắt thêm hoặc hiệu chỉnh nội dung, API `/api/notes/generate` thực hiện **In-place Upsert** (`on conflict (id) do update set content_structured = ...`) vào bản ghi hiện có trên Neon Postgres.
   - Chỉ tạo bản ghi Note mới khi người dùng chủ động bấm `+ Tạo Note mới` / `+ New Chat & Note`.
2. **Thư viện Ghi chú (Notes Library)**:
   - Sidebar item 1 chính thức là `Ghi chú (Notes)`, đóng vai trò là thư viện tổng hợp tri thức học thuật.
   - Khung `Cuộc trò chuyện gần đây (Recent Chats)` ở thanh điều hướng bên trái được định vị là Fast Switcher để chuyển đổi tức thì giữa các luồng nghiên cứu đang mở.

---

## 17. 30-Day Trash & Archive Lifecycle Management (2026-08-19/20)

### Problem
- Việc xóa thẳng tay dữ liệu mà không có cơ chế lưu trữ an toàn dễ gây mất mát bài học của người dùng khi lỡ thao tác nhầm.

### Decision & Implementation
1. **Lưu trữ 30 ngày thay vì xóa ngay**:
   - Thao tác xóa trong Thư viện Ghi chú chuyển thành đưa vào mục **Thùng rác & Lưu trữ (`Archives`)**.
   - Hệ thống tính toán chính xác số ngày còn lại (`daysLeft = 30 - elapsedDays`) và hiển thị huy hiệu cảnh báo màu sắc theo mức độ khẩn cấp (Đỏ $\le 5$ ngày, Vàng $\le 15$ ngày, Xám $> 15$ ngày).
2. **Khôi phục (Restore)**:
   - Cho phép phục hồi bài ghi chú quay lại Thư viện Ghi chú ngay lập tức và dừng tiến trình đếm ngược xóa.
3. **Xóa vĩnh viễn (Permanent Delete)**:
   - Cho phép người dùng chủ động xóa vĩnh viễn trước thời hạn 30 ngày kèm theo hộp thoại xác nhận bảo vệ an toàn dữ liệu.

---

## 18. Master Pricing Matrix & Custom Template Quotas Enforcement (2026-08-20)

### Problem
- Cần có sự phân cấp tính năng minh bạch, hợp lý theo chi phí vận hành và đồng bộ 100% giữa Landing Page, Trang Nâng cấp (Upgrade Pricing) và Codebase logic.

### Decision & Implementation
1. **Phân cấp Hạn mức Gói Chuẩn**:
   - **Gói FREE (0đ)**: Tối đa 20 Notes, 3 templates nền tảng (Cornell, Outline, Tóm tắt nhanh), tối đa 5 Custom Templates, Markdown preview, xuất 3 định dạng cơ bản (.pdf, .docx, .md).
   - **Gói PRO (99.000đ/tháng)**: Tối đa 50 Notes, 9 templates tiêu chuẩn, tối đa 25 Custom Templates, Static HTML Preview với CSS styling, xuất 4 định dạng (PDF, DOCX, MD, Webpage HTML).
   - **Gói ULTRA (199.000đ/tháng)**: Không giới hạn Notes ($\infty$), toàn bộ 17 templates, Không giới hạn Custom Templates ($\infty$), Interactive Dynamic HTML Preview (JS, chart hover, animation), Single-file Interactive HTML 100% offline, Checkbox Multi-Export & đóng gói file .ZIP duy nhất.
2. **Hạn mức Custom Templates (Quota Guard)**:
   - `TemplatesScreen.tsx` kiểm soát nghiêm ngặt số lượng mẫu tùy chỉnh: 5 (Free), 25 (Pro), $\infty$ (Ultra).
   - Chặn tạo mới và hiển thị modal điều hướng nâng cấp khi chạm ngưỡng.

---

## 19. Real-Time Dynamic User Plan Badges & Instant State Sync (2026-08-20)

### Problem
- Sau khi thanh toán VietQR thành công hoặc kích hoạt mã giảm giá 100%, tag gói của người dùng cần được cập nhật tức thì trên giao diện mà không yêu cầu reload trang.

### Decision & Implementation
1. **Thiết kế Tag gói phân cấp trực quan (`Sidebar.tsx`, `SettingsScreen.tsx`, `Header.tsx`)**:
   - **FREE**: Huy hiệu xám tối giản, viền tinh tế.
   - **PRO**: Huy hiệu xanh dương công nghệ `bg-blue-500/20 text-blue-400` kèm icon lấp lánh `✨ Sparkles`.
   - **ULTRA**: Huy hiệu chuyển màu hoàng gia `bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-400` kèm icon vương miện `👑 Crown`.
   - **ADMIN**: Huy hiệu xanh lục bảo vệ `bg-emerald-500/20 text-emerald-400` kèm icon khiên `🛡️ Shield`.
2. **Đồng bộ State tức thì**:
   - Cập nhật trực tiếp `user.plan` trong `AppContext` ngay khi nhận tín hiệu xác nhận thanh toán hoặc mã giảm giá 100% (0đ), đồng thời cập nhật profile trên Neon Postgres.

---

## 20. BYOK AI Provider Security Locking & Multi-Server Custom Endpoints Architecture (2026-08-20)

### Problem
- Việc người dùng chỉnh sửa sai lệch Endpoint URL hoặc Provider ID của các nhà cung cấp chuẩn quốc tế (Google AI Studio, OpenAI, Anthropic Claude, OpenRouter, Groq, NVIDIA NIM, Local Ollama) dễ gây hỏng cấu hình kết nối.
- Đồng thời, người dùng có nhu cầu lưu trữ nhiều máy chủ AI tùy chỉnh riêng (Private vLLM, LiteLLM, LM Studio) mà không bị giới hạn 1 endpoint hay bị đè dữ liệu.

### Decision & Implementation
1. **Khóa bảo vệ các Verified Providers**:
   - `Provider ID` và `Endpoint URL` của các Preset đã xác minh được chuyển sang trạng thái **Disabled / Read-only** kèm biểu tượng khóa `Lock` và visual unactive, bảo vệ người dùng không bị nhập sai.
2. **Hỗ trợ Custom Endpoints linh hoạt & Đa máy chủ**:
   - Thêm tab **Custom Endpoint** cho phép nhập Endpoint URL tùy ý.
   - `Provider ID` **không bắt buộc** — hệ thống tự động sinh slug/ID duy nhất dựa trên tên hiển thị (`custom_${slugify(name)}_${timestamp}`).
   - Cho phép người dùng lưu nhiều Custom Endpoint độc lập trong cùng một tài khoản (miễn là khác tên hiển thị).
3. **Model Mặc định Tùy chọn (Optional Default Model)**:
   - Toàn bộ các Provider không bắt buộc người dùng phải gõ tên model.
   - Hệ thống tự động nhận diện và gán model tối ưu chuẩn tương ứng (Google: `gemini-2.0-flash`, OpenAI: `gpt-4o-mini`, Anthropic: `claude-3-5-haiku-20241022`, Groq: `llama-3.3-70b-versatile`, OpenRouter: `deepseek/deepseek-r1`, NVIDIA: `meta/llama-3.1-70b-instruct`, Local: `llama3.3:latest`, Custom: `gpt-4o-mini`).
4. **Validation Toàn diện & Xác thực Kết nối Thực**:
   - Kiểm tra định dạng URL (`http://` hoặc `https://`), kiểm tra trùng tên và kiểm tra API Key bắt buộc cho Cloud providers.
   - API `/api/providers/test` kiểm tra kết nối thực tế tới Endpoint và nạp toàn bộ các model đã test vào danh sách chọn Model trên `Header.tsx`.

---

## 21. Pricing Coupon Layout Hardening & Automatic Zero-Click VietQR Payment Flow (2026-08-20)

### Problem
- Khung nhập mã Coupon bị bể giao diện do flexbox squish và bị các huy hiệu floating (`-top-3.5`) của các Pricing Cards bên dưới đè lên khi thay đổi kích thước cửa sổ.
- Trải nghiệm thanh toán VietQR yêu cầu sự liền mạch và tự động 100%: người dùng chỉ quét mã QR trên ứng dụng ngân hàng, không cần phải tìm bấm bất kỳ nút "Xác nhận" thủ công nào.

### Decision & Implementation
1. **Tối ưu hóa Cấu trúc Bố cục Trang Bảng Giá (`PricingScreen.tsx`)**:
   - Tách biệt hoàn toàn Coupon Promo Banner thành container riêng biệt với `relative z-10 shrink-0` và khoảng cách thông thoáng.
   - Thêm `pt-6 sm:pt-8` vào Pricing Cards Grid, tạo khoảng thở an toàn để các floating badges (Most Popular, Ultimate) không bao giờ chạm hoặc đè lên khung Coupon.
   - Bố cục responsive hoàn chỉnh cho cả Mobile, Tablet và Desktop.
2. **Quy trình Thanh toán VietQR Tự Động 100% Zero-Click (`PaymentQrModal.tsx`)**:
   - Loại bỏ hoàn toàn tất cả các nút bấm xác nhận thủ công.
   - Hiển thị trực quan: Mã VietQR Napas EMVCo sắc nét, thông tin ngân hàng chi tiết (Tên NH, Số TK, Chủ TK, Số tiền, Nội dung chuyển khoản kèm nút 1-Click Copy).
   - Tích hợp radar trạng thái thời gian thực (`Listening for automatic payment...`) cùng cơ chế Polling siêu nhạy (2.5s) qua `/api/billing/check-status`.
   - Ngay khi tiền vào tài khoản, hệ thống tự động: Bắn pháo hoa Confetti $\rightarrow$ Cập nhật tức thì `user.plan` trong AppContext $\rightarrow$ Hiển thị màn hình thành công $\rightarrow$ Tự động đóng modal sau 2.5s.

---

## 22. Genuine Dual-Mode AI Agent Engine Architecture & Autonomous Information Gathering (2026-08-20)

### Problem
- Giao diện chat trước đây bị chặn bởi các điều kiện kiểm tra cứng nhắc (hardcoded guards) ở client (`if (!attachedSources) return hardcoded message...`), khiến AI không gọi API LLM thực tế khi người dùng trò chuyện, đặt câu hỏi về danh tính, hỏi về model LLM đang dùng hay yêu cầu viết code.
- Backend trước đây chỉ ép schema JSON tạo ghi chú, thiếu khả năng hội thoại tự nhiên, thiếu phản hồi chat và thiếu cơ chế thu thập thông tin tự động khi người dùng yêu cầu tạo note nhưng chưa có nội dung cụ thể.

### Decision & Implementation
1. **Loại bỏ Hoàn Toàn Hardcoded Guards ở Client (`AppContext.tsx`)**:
   - Mọi tin nhắn của người dùng (có đính kèm file hoặc không) đều được gửi trực tiếp tới AI Engine (`/api/notes/generate`).
   - Tự động truyền API Key và Endpoint của Provider tương ứng được chọn (`Google AI Studio`, `OpenAI`, `Anthropic`, `Groq`, `OpenRouter`, `NVIDIA`, `Local Ollama`, `Custom Endpoints`).
2. **Kiến Trúc Dual-Mode AI Agent Engine (`gemini.ts`, `dispatcher.ts`, `/api/notes/generate`)**:
   - **Chế độ 1 - Conversational Chat, In-depth Reasoning & Clean Code**: Khi người dùng chào hỏi, hỏi "bạn là ai", hỏi về mô hình đang dùng, hỏi kiến thức hay yêu cầu viết code Frontend/UI-UX, AI Agent nhận thức rõ danh tính (*Zero AI Note Agent*), mô hình đang kích hoạt (`model`), trả lời chi tiết, sắc sảo, sinh mã nguồn sạch (clean code) với cú pháp chuẩn xác.
   - **Chế độ 2 - Autonomous Information Gathering**: Khi người dùng yêu cầu tạo Note nhưng chưa cung cấp chủ đề hoặc tài liệu, AI Agent thông minh hỏi thăm, gợi ý người dùng bổ sung thông tin thay vì từ chối hay phản hồi theo mẫu máy móc.
   - **Chế độ 3 - Autonomous Academic Note Synthesis**: Khi có đầy đủ tài liệu, bài giảng hoặc văn bản, AI Agent vừa phản hồi xác nhận thân thiện trong chat (`replyText`), vừa đồng thời kiến tạo bản ghi chú học thuật chuẩn hóa chuyên sâu (`note` artifact theo 17 phương pháp) cập nhật trực tiếp vào Artifact Panel bên phải.
3. **Trình Trực Quan Hóa Markdown & Code Block Độc Quyền (`MarkdownView.tsx`, `ChatScreen.tsx`)**:
   - Tích hợp component `MarkdownView` hỗ trợ render Markdown toàn diện: đề mục `#`, danh sách `•`, trích dẫn `>`, và khối mã nguồn tối ưu (`CodeBlock`) kèm thanh công cụ hiển thị ngôn ngữ lập trình và nút **Sao Chép Code 1-Click**.

---

## 23. References
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [gitleaks](https://github.com/gitleaks/gitleaks)
- [Cloudflare R2](https://developers.cloudflare.com/r2)
- [VietQR Napas EMVCo Specification](https://vietqr.net)
- [vietnam-qr-pay](https://github.com/trungnguyenthien/vietnam-qr-pay)
- [Google GenAI SDK](https://github.com/google-gemini/generative-ai-js)
- [Anthropic API](https://docs.anthropic.com)
- [OpenAI API](https://platform.openai.com/docs)
- [Next.js Middleware](https://nextjs.org/docs/middleware)
- [JWT.io](https://jwt.io)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs)
- [Google Gen AI SDK](https://github.com/googleapis/genai-js)
- [Docx JS](https://docx.js.org/)
- [Vietnam QR Pay](https://github.com/momo-wallet/vietnam-qr-pay)