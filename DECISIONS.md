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

## 3. Storage Migration (Cloudflare R2)

### Decision
- **Primary Storage**: Neon Object Storage (Beta) nếu project mới ở `us-east-2`
- **Fallback Storage**: Cloudflare R2 nếu project cũ hoặc khác vùng
- **Abstraction Layer**: `lib/storage.ts` để dễ dàng chuyển đổi giữa Neon Object Storage và R2

### Rationale
- **Neon Object Storage** (Beta) miễn phí, tích hợp tốt với Neon DB
- **Cloudflare R2** ổn định, S3-compatible, miễn phí tier cao
- **Abstraction Layer** đảm bảo dễ dàng chuyển đổi khi Neon Object Storage hết Beta

### Implementation
- **Storage Service**: `lib/storage.ts` hỗ trợ cả Neon Object Storage và R2
- **Presigned URL**: sinh URL upload/download cho cả hai dịch vụ
- **Database Tracking**: bảng `uploads` để theo dõi trạng thái upload
- **RLS**: bảng `uploads` bật RLS để bảo vệ dữ liệu người dùng

### Configuration
- **Neon Object Storage**: `USE_NEON_OBJECT_STORAGE=true`
- **Cloudflare R2**: `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`

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

### Pending ⏳
- [ ] Storage integration (Neon Object Storage or R2)
- [ ] Google OAuth implementation
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

## 13. References
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Cloudflare R2](https://developers.cloudflare.com/r2)
- [Next.js Middleware](https://nextjs.org/docs/middleware)
- [JWT.io](https://jwt.io)