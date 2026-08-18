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

## 16. References
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [gitleaks](https://github.com/gitleaks/gitleaks)
- [Cloudflare R2](https://developers.cloudflare.com/r2)
- [Next.js Middleware](https://nextjs.org/docs/middleware)
- [JWT.io](https://jwt.io)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs)
- [Google Gen AI SDK](https://github.com/googleapis/genai-js)
- [Docx JS](https://docx.js.org/)