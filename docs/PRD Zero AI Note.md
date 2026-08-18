# PRD Zero AI Note

> **Phiên bản hợp nhất** (gộp từ `PRD-Zero-AI-Note.md` + `PRD_Zero_AI_Note.md`, cập nhật theo hiện trạng triển khai 2026-08-18).
>
> Website ghi chú AI dạng chat (kiểu Gemini/ChatGPT), nhận file dài đa định dạng (video/audio/PDF/slide/ảnh/text/link), xuất note theo phương pháp học thuật cụ thể (Cornell, Outline, Q&A...) đồng thời dưới nhiều định dạng (Markdown/DOCX/PDF/HTML) ngay trong cuộc trò chuyện. **Vừa là sản phẩm thương mại dài hạn (không deadline), vừa là đồ án môn học có deadline thật — xem mục 8 để biết bối cảnh và ưu tiên tương ứng.**

---

## Mục lục

1. [Định vị sản phẩm](#1-định-vị-sản-phẩm)
2. [Đối tượng người dùng](#2-đối-tượng-người-dùng)
3. [Kiến trúc kỹ thuật](#3-kiến-trúc-kỹ-thuật)
4. [Đặc tả tính năng](#4-đặc-tả-tính-năng)
5. [Mô hình kinh doanh](#5-mô-hình-kinh-doanh)
6. [Database Schema](#6-database-schema)
7. [UI/UX](#7-uiux)
8. [Bối cảnh Đồ án Chuyên ngành](#8-bối-cảnh-đồ-án-chuyên-ngành)
9. [Roadmap](#9-roadmap)
10. [Cần chốt trước khi build](#10-cần-chốt-trước-khi-build)
11. [Kickoff prompt cho Hermes Agent](#11-kickoff-prompt-cho-hermes-agent)
12. [Lịch sử thay đổi](#12-lịch-sử-thay-đổi)

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

### 3.1 Tech stack

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Frontend + API routes | Next.js trên **Vercel** | Đã quen thuộc (ZeroInvoice đang chạy Vercel), free tier đủ dùng giai đoạn đầu |
| Database (lưu trữ chính) | **Neon** (Postgres serverless) | Đổi từ Supabase vì free tier Supabase giới hạn 2 project hoạt động cùng lúc — dự án thứ 3 của Zero, chưa có doanh thu để nâng cấp trả phí. Neon free tier cho tới 100 project, không giới hạn kiểu này. **Neon là nơi lưu trữ CHÍNH** (text/base64/binary trong DB) |
| Backup storage (khi Neon đầy) | **Cloudflare R2** (S3-compatible) | Chỉ dùng làm file storage sao lưu khi Neon database đầy — đa vùng, ổn định production, free tier 10GB. Do cùng chuẩn S3 nên chuyển đổi sau này nhẹ nhàng |
| ORM | **Drizzle ORM** (duy nhất) | Không lẫn Prisma/raw Supabase; driver Neon serverless (`@neondatabase/serverless`) |
| Auth | **JWT tự phát hành** (`jose` + `bcryptjs`), session cookie HttpOnly | Đã thay thế Neon Auth trong quá trình triển khai — 1 cơ chế ký token duy nhất (`lib/auth/session.ts`), fail-closed khi thiếu `ZERO_JWT_SECRET`. Hỗ trợ email/password + Google OAuth (Google Identity Services popup) |
| Job nền (xử lý file dài) | **Inngest hoặc Trigger.dev** | Chuyên cho chuỗi job AI dài nhiều bước, tách biệt hoàn toàn khỏi nơi hosting app chính |
| Ngôn ngữ | JS/TypeScript, **không dùng Rust** | Antigravity/Hermes định hướng Next.js; phần việc chính là điều phối I/O (gọi API AI) chứ không phải tính toán CPU nặng |
| AI xử lý | Cloud API only (Gemini/OpenRouter/Claude/OpenAI qua key của Zero hoặc BYOK) | Đã bỏ hướng on-device/local để ưu tiên tốc độ triển khai |
| Billing | **ZeroInvoice** (zeroinvoice-silk.vercel.app, sản phẩm khác của Zero) | Webhook + fail-closed |
| Nguồn UI ban đầu | Export từ Google AI Studio (React + TypeScript + Tailwind, đã component hoá) | Xem chi tiết luồng & vai trò ở mục 7.1 — chỉ lấy phần giao diện, không suy ra kiến trúc backend từ code này |

**Đã cân nhắc và loại bỏ**:
- **Supabase** (cả Auth + Storage): free tier giới hạn 2 project hoạt động cùng lúc — vượt giới hạn ở thời điểm triển khai
- **Neon Auth**: đã cân nhắc (ra mắt 2026, nâng cấp lớn 8/2026, miễn phí tới 60.000 MAU) nhưng quyết định dùng JWT tự phát hành cho gọn vendor
- **Neon Object Storage**: từng cân nhắc (mới ra mắt 8/2026, Beta, S3-compatible) nhưng ràng buộc chỉ vùng `us-east-2`, chỉ bật cho project MỚI → chọn R2 làm backup
- **Google Cloud Run** (tính phí theo giây CPU không hợp workload xử lý file dài liên tục)
- **Render** (Background Worker không miễn phí, từ $7/tháng)
- **Netlify** (không có lợi thế riêng so với Vercel)

### 3.2 Luồng xử lý chính

```
User gửi file/link/text + (tùy chọn) chỉ định phương pháp ghi chú
  → Nếu thiếu phương pháp: AI hỏi lại trong chat, CHỈ SAU KHI đã nhận đủ nguồn
  → Enqueue job nền (Inngest/Trigger.dev) — không xử lý trong request đồng bộ
  → Giai đoạn 1: Trích transcript (ưu tiên phụ đề có sẵn nếu là YouTube;
    ngược lại STT qua chunk + map-reduce cho file dài)
  → Giai đoạn 2: Cấu trúc theo phương pháp đã chọn (dùng transcript làm
    nguồn, không xử lý lại audio/video thô — tăng độ chính xác, cho phép audit)
  → Giai đoạn 3: Sinh content_structured (JSON chuẩn) — nguồn duy nhất để
    render Preview (HTML) và mọi định dạng tải (MD/DOCX/PDF/HTML)
  → Thông báo user khi xong (email/in-app), stream kết quả theo từng
    chunk nếu có thể
```

**Nguyên tắc bắt buộc**: Preview và file tải về đều sinh ra từ cùng 1 `content_structured`, không parse ngược từ HTML — tránh các định dạng lệch nhau. DOCX/PDF không tự render trong trình duyệt, chỉ sinh file thật tại thời điểm tải.

### 3.3 Bảo mật & vận hành

- Row-Level Security (RLS) trên mọi bảng chứa dữ liệu cá nhân (Neon dùng cú pháp `auth_uid()` qua `current_setting('request.jwt.claims')`, không dùng `auth.uid()` của Supabase)
- API key BYOK mã hoá khi lưu, không log ra console, không lộ client-side
- Chặn SSRF: validate Endpoint URL tùy ý (BYOK custom endpoint) ở server-side, từ chối địa chỉ nội bộ/private IP trước khi Test/gọi thật
- Billing qua ZeroInvoice: fail-closed (khác tracking — fail-open), webhook có xác minh chữ ký, xử lý idempotent tránh cộng dồn subscription
- Phân quyền admin qua trường `role` trong DB, kiểm tra server-side ở mọi route — không chỉ ẩn UI. Admin email cấu hình 1 nơi `ADMIN_EMAIL` trong `.env.local`
- Tự động xoá file gốc sau N ngày (giữ lại note), giảm chi phí lưu trữ + rủi ro riêng tư
- **JWT fail-closed**: thiếu `ZERO_JWT_SECRET` → crash runtime, không fallback yếu

---

## 4. Đặc tả tính năng

### 4.1 Xử lý đầu vào (Ingestion)
- Nhận nhiều file/định dạng cùng lúc trong 1 request (video, audio, ảnh, PDF, slide, text paste)
- Xử lý file dài hàng chục giờ/phiên qua kiến trúc chunk + map-reduce (giới hạn hào phóng nhưng thật — không theo hướng "không giới hạn TB", vừa phi thực tế về hạ tầng vừa mâu thuẫn với mục tiêu chính xác)
- Timestamp-linking: note liên kết ngược về đúng khoảnh khắc trong file gốc
- Đối chiếu song song slide + audio theo thời điểm
- Tự nhận diện ngôn ngữ + xử lý code-switching Việt-Anh
- Kiến trúc transcribe-trước-cấu trúc-sau (2 pha), cho phép audit lại khi nghi ngờ sai sót
- Tách giọng theo người nói (speaker diarization) — mở rộng cho use case họp sau này
- Nhận link website (reader-mode) và YouTube (ưu tiên transcript có sẵn, fallback tải+STT tái dùng pipeline chính)
- Tự động phân loại & gộp nhiều file rời rạc thành 1 bộ note liền mạch (có xác nhận lại từ user, AI không tự quyết định gộp mà không hỏi)

### 4.2 Điều khiển output
- Chọn phương pháp ghi chú qua ngôn ngữ tự nhiên trong prompt: Cornell, Outline, Mindmap dạng text, Q&A, Flashcard, tóm tắt điều hành, tóm tắt nhanh, hoặc custom template
- **Chế độ "Auto" (mặc định)**: khi user không chỉ định phương pháp cụ thể (không chọn pill, không nhắc trong prompt), AI tự phân tích nội dung nguồn và chọn phương pháp phù hợp nhất (ví dụ: bài giảng có cấu trúc rõ → Cornell; tài liệu nghiên cứu dài → tóm tắt điều hành) — **không cần dừng lại hỏi user** trong phần lớn trường hợp, hiển thị rõ "AI đã chọn: [phương pháp]" trong bước xử lý để user biết lý do. Chỉ hỏi lại trong chat khi nội dung thật sự mơ hồ (kể cả AI cũng không đủ tin cậy để tự quyết) — đây là fallback hiếm gặp, không phải hành vi mặc định.
- Pill chọn nhanh trong composer: "Auto" là pill DUY NHẤT được pre-select mặc định; các pill phương pháp cụ thể (Cornell/Outline/Q&A/Flashcard/Tóm tắt nhanh) không pre-select — user chọn thủ công bất kỳ lúc nào sẽ ghi đè Auto
- Custom template: user mô tả phong cách mong muốn bằng prompt tự nhiên, đặt tên, lưu lại tái sử dụng (bảng `custom_note_templates`)
- Tùy chỉnh độ sâu (nhanh/chi tiết/học thuật) qua 1 câu trong prompt
- Tự tạo glossary thuật ngữ chuyên ngành, hỗ trợ song ngữ (dịch + giữ bản gốc)
- Đánh dấu độ tin cậy từng đoạn (gạch chân, hover xem cảnh báo) khi model không chắc
- Chọn ngôn ngữ đầu ra độc lập với ngôn ngữ nguồn

### 4.3 Artifact Panel & xuất file
- User chọn chế độ output mỗi lần chat: trả lời thường (follow-up ngắn) hoặc mở Artifact Panel (nội dung dài/có cấu trúc/sẽ lưu-tải)
- Panel trượt từ bên phải, không thay khung chat, có nút mở rộng toàn màn hình (fullscreen, giống YouTube)
- 2 chế độ xem: **Preview** (mặc định) và **Code/Raw**, chuyển qua toggle
- Nút chính mặc định: **Copy vào clipboard** (không phải tải file — copy là thao tác nhanh/tần suất cao nhất)
- Nút mũi tên kế bên mở dropdown tải file đa định dạng: Markdown, DOCX, **PDF** (ưu tiên đầu danh sách vì giữ layout trung thực nhất, fixed-layout), HTML+CSS+JS — cho chọn nhiều định dạng tải song song
- Bố cục DOCX/PDF đúng chuẩn phương pháp (ví dụ Cornell: bảng 2 cột cue/notes + hàng tóm tắt) — không thể làm trong markdown chat thường
- Preview áp dụng cho mọi định dạng render được (không chỉ MD/HTML), hỗ trợ bảng biểu/biểu đồ trực tiếp trong nội dung khi dữ liệu nguồn phù hợp

### 4.4 Tổ chức & lưu trữ
- Thư viện lưu các phiên note, tìm kiếm theo từ khóa, gắn thẻ môn học/dự án
- Chia sẻ link xem note (không cần gửi file)
- Notebook chia sẻ/cộng tác (mức độ chỉ-xem hay đồng-biên-tập — cần chốt trước khi build)

### 4.5 UX xử lý file dài
- Xử lý bất đồng bộ qua job nền + thông báo khi xong (email/in-app) — **không hứa hẹn thời gian xử lý cụ thể ("vài phút")**, mô tả đúng bất đồng bộ: job nền, thanh tiến trình, thông báo khi xong, không ngồi chờ
- Thanh tiến trình theo giai đoạn thật (Trích transcript → Cấu trúc → Tạo file), không phải spinner vô nghĩa
- Streaming kết quả theo từng chunk khi có thể

### 4.6 Giữ chân người dùng
- Chat tiếp dựa trên nguồn gốc (hỏi thêm sau khi có note, trả lời dựa trên transcript đã xử lý)
- TTS đọc note bằng giọng nói
- Regenerate từng phần riêng lẻ, không chạy lại toàn bộ file gốc
- Lưu cấu hình mặc định (phương pháp + ngôn ngữ + độ sâu)
- Ước tính thời gian xử lý trước khi bắt đầu; cho xem note mẫu trước khi user tự thử file thật

### 4.7 Tính năng mở rộng (ưu tiên thấp hơn, làm sau)
- Trích xuất action item, đồng bộ Notion/Google Docs/Calendar
- Spaced repetition cho template Flashcard
- ~~Chế độ on-device Gemma~~ — đã tạm gác (mâu thuẫn với quyết định full-cloud; quay lại nếu có nhu cầu doanh nghiệp thật, khi đó triển khai qua WebGPU/ONNX Runtime Web trên trình duyệt user, không phải server Zero)

### 4.8 BYOK (Bring Your Own API Key)
- Kết nối provider có sẵn (Google AI, OpenRouter, NVIDIA, Groq, Claude, OpenAI) hoặc Custom Endpoint theo chuẩn OpenAI-compatible (Name, Provider ID, Endpoint URL, Default Model, API Key tùy chọn, checkbox Discover models)
- Riêng Gemini/Claude API gốc không theo chuẩn OpenAI-compatible, xử lý như provider có sẵn riêng
- Discover models tự động (`/v1/models`) song song với nhập tay tên model — không thay thế nhau
- Nút Test bắt buộc trước khi Save (fail-closed)
- Bảng kiểm tra khả năng theo từng provider (ví dụ cảnh báo khi chọn provider không nhận video), chặn/cảnh báo trước khi user tự thử-và-lỗi
- Cân nhắc giới hạn BYOK ở gói Paid — nếu mở Free, user né được giới hạn xử lý/tháng
- **Toggle "Import free models" + "Sync"** — áp dụng đồng nhất cho **mọi provider user đã active thành công** (OpenRouter, NVIDIA, Hugging Face...), không riêng OpenRouter. Import kéo danh sách model đang free về ngay lúc bật; Sync giữ danh sách tự cập nhật liên tục (model hết free tự gỡ, model mới free tự thêm). **Hoàn toàn tách biệt với ZeroLLM** — không dùng chung dữ liệu/hạ tầng, tự xây adapter riêng cho từng provider (mỗi provider có định dạng API liệt kê model/giá khác nhau, cần hàm đọc riêng, không có chuẩn chung). Với **Custom Endpoint tự host**: khái niệm "free" không áp dụng được (không phải marketplace có giá niêm yết) — 2 toggle vẫn hiện diện đồng nhất trên UI nhưng ở trạng thái disabled kèm giải thích ngắn, không giả vờ hoạt động. **Kiến trúc bắt buộc**: 1 bảng cache dùng chung theo provider (không polling riêng theo từng user) + job nền định kỳ cập nhật. Khi model đang là Default Model của user bị gỡ vì hết free: thông báo in-app + fallback sang model free khác, không âm thầm xoá.
- **2 tầng kiểm tra riêng biệt, không trùng nhau**: nút **"Test Connection"** khi thêm provider (kiểm tra endpoint + API key hoạt động ở mức kết nối chung, bắt buộc trước khi Save) và nút **"Check Model"** riêng khi nhập tay tên model (kiểm tra đúng model ID đó có thật sự gọi được qua provider, phòng trường hợp kết nối ổn nhưng model gõ sai tên/đã ngừng hỗ trợ).

---

## 5. Mô hình kinh doanh

**Nguyên tắc gate tính năng**: theo chi phí vận hành thực tế — tính năng tốn compute (mind map, TTS, file rất dài) vào gói Paid; tính năng giữ chân user (thư viện, chat tiếp theo nguồn) giữ Free để tối đa engagement.

| Gói | Giá | Tính năng |
|---|---|---|
| Free | 0đ | Ghi chú cơ bản (Cornell/Outline/tóm tắt), **3 giờ xử lý/tháng**, file ≤30 phút, thư viện không giới hạn |
| **Pro** | **99.000đ/tháng** (~$4) | Toàn bộ Free + **50 giờ xử lý/tháng**, file ≤2 giờ, **chưa mở** Mind map/biểu đồ, TTS, BYOK (2 nhóm tính năng tốn compute nhất) |
| **Ultra** | **199.000đ/tháng** (~$8) | Toàn bộ Pro + **200 giờ xử lý/tháng**, file ≤4 giờ, Mind map/biểu đồ trực quan, đọc note bằng giọng nói (TTS), kết nối API key riêng (BYOK), ưu tiên tốc độ xử lý, **hỗ trợ ưu tiên qua email** |

> **Ghi chú pricing**: con số cụ thể (3h/50h/200h, file 30'/2h/4h) là quyết định đã chốt 2026-08-18 — không dùng từ "không giới hạn" trên landing. Đơn vị tiền tệ hiển thị theo ngôn ngữ: tiếng Việt dùng `đ`, English dùng `$` (quy đổi ~25.500đ/$1).

**Coupon**: trang quản lý riêng, CRUD đầy đủ, giới hạn số lần dùng + ngày hết hạn + áp dụng cho gói nào.

**Admin**: chỉ 1 tài khoản (`nguyenchithang2804@gmail.com`) truy cập trang Coupon, phân quyền qua `role` kiểm tra server-side + RLS, set thủ công 1 lần qua SQL — không có flow tự nhận quyền admin.

**Tích hợp ZeroInvoice**: fail-closed cho mọi luồng thanh toán, webhook xác minh chữ ký, xử lý idempotent, đối chiếu định kỳ trạng thái subscription phòng khi webhook bị lỡ.

---

## 6. Database Schema

> **Bản nháp schema khái niệm** (từ PRD gốc, viết theo Supabase). Khi build thực tế, schema được tinh chỉnh theo Neon + Drizzle ORM — xem `docs/schema-neon.sql` và `docs/schema.sql` là bản thực thi hiện tại.

```sql
-- Hồ sơ user, mở rộng từ auth.users
create table profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  role text default 'user' check (role in ('user','admin')),
  plan text default 'free' check (plan in ('free','paid')),
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

-- Template ghi chú do user tự tạo
create table custom_note_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text not null,
  description_prompt text not null,
  created_at timestamptz default now()
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

-- Provider AI do user tự kết nối (BYOK)
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
  import_free_models boolean default false,
  sync_enabled boolean default false,
  created_at timestamptz default now()
);

-- Cache dùng chung: model nào đang free theo từng provider — 1 job nền cập
-- nhật định kỳ, MỌI user chỉ đọc từ đây, không tự polling riêng (xem 4.8)
create table provider_free_models_cache (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  model_id text not null,
  is_free boolean default true,
  last_checked_at timestamptz default now(),
  unique (provider_id, model_id)
);

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

-- Subscription, đồng bộ với ZeroInvoice
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  zeroinvoice_invoice_id text,
  status text check (status in ('active','canceled','past_due')),
  amount numeric,
  coupon_code text,
  renews_at timestamptz,
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

> **Lưu ý RLS trên Neon**: không dùng `auth.uid()` của Supabase — dùng `auth_uid()` qua `current_setting('request.jwt.claims')` (xem `docs/schema-neon.sql`).

---

## 7. UI/UX

### 7.1 Luồng thiết kế đã thực hiện & vai trò của code AI Studio

Google Stitch (Ideate + nhiều vòng Direct Edit) → export sang Google AI Studio → hoàn thiện qua nhiều đợt: kết nối luồng điều hướng giữa 11 màn, animation/micro-interaction, responsive, hệ thống 10 theme, chế độ Auto chọn phương pháp, hoàn thiện BYOK (Import/Sync/Check Model) → chuẩn hoá code thành React + TypeScript + Tailwind sạch, tách component, không màu hardcode.

**Quyết định cuối cùng (đã điều chỉnh so với dự định ban đầu)**: code này **KHÔNG còn là throwaway thuần tuý** — sẽ đẩy lên GitHub, Hermes/Antigravity **clone repo về làm nền tảng UI/UX thật**. Ranh giới rõ ràng:
- **Lấy**: toàn bộ phần hiển thị — component, layout, theme system, animation, responsive
- **Không lấy**: bất kỳ suy luận nào về kiến trúc backend/database từ cách code AI Studio tổ chức dữ liệu mock — schema, luồng xử lý, bảo mật vẫn tuân thủ nghiêm ngặt theo mục 3, 4, 5, 6 của PRD này, viết mới hoàn toàn
- Việc còn lại của Hermes: đóng gói code React đã có vào cấu trúc Next.js thật (`app/` router, tách API routes), nối vào Neon/Inngest/AI pipeline thật, thay toàn bộ dữ liệu mock bằng dữ liệu thật

### 7.2 Danh sách 11 màn hình

Dark mode mặc định (theme "Giấy"), brand "Zero AI Note" + tagline "AI-Powered Research", nav chuẩn: Notes / Search / Files / Account / Templates / Archives (dưới 1024px chuyển thành sidebar off-canvas).

1. **Màn chính** (chat + Artifact Panel) — hoàn chỉnh, gồm pill phương pháp (có "Auto" mặc định), modal Đính kèm nguồn, stepper xử lý 3 giai đoạn
2. **Thư viện** — grid/list toggle, tự phân loại file gộp, tab "Của tôi/Được chia sẻ"
3. **Cài đặt — Tài khoản & Billing**
4. **Cài đặt — Provider AI (BYOK)** — đầy đủ: form Custom Endpoint, dropdown model tự động đồng bộ đúng provider đã thêm, toggle Import/Sync free models, nút Test Connection + Check Model riêng biệt
5. **Pricing** — 3 cột Free/Pro/Ultra, ô coupon, FAQ
6. **Admin — Quản lý Coupon**
7. **Đăng nhập/Đăng ký** — email/password + Google OAuth
8. **Chi tiết 1 note đã lưu** — 2 cột (nội dung + chat hỏi thêm)
9. **Templates** — quản lý phương pháp ghi chú có sẵn + tự tạo
10. **Archives** — note lưu trữ/xoá mềm, đếm ngược 30 ngày
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
- **Dropdown model không đồng bộ BYOK**: dropdown "AI Engine Model" ở thanh trên từng hiển thị danh sách mẫu cứng không liên quan tới provider user tự thêm — đã yêu cầu sửa thành tự động lấy đúng model từ provider đã kết nối, cần xác nhận lại.

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
Tiêu chí chấm điểm không đòi hỏi billing thật/BYOK hoàn chỉnh — 1 bản demo chạy tốt với luồng ghi chú lõi, auth thật, CRUD đầy đủ, UI/UX hoàn thiện là đủ đáp ứng.

- **Tới Tuần 10 (báo cáo lần 1)**: ưu tiên xong tương đương roadmap mục 9 tới hết "Tuần 5-7" (multi-file, multi-định dạng, đủ template, xuất đa định dạng) — thể hiện rõ nhất tiêu chí "Lập trình & chất lượng sản phẩm" (40% điểm, trọng số cao nhất)
- **Tới Tuần 15 (bảo vệ)**: hoàn thiện thêm UX giữ chân người dùng (mục 9, Tuần 8-9) + tối thiểu 1 luồng thanh toán chạy được thật (không nhất thiết đầy đủ mọi tính năng Ultra) để thể hiện chiều sâu kỹ thuật khi phản biện
- **Có thể lược bớt nếu thiếu thời gian**: Mind map/TTS/action item/spaced repetition (mục 9, Tuần 12+) — không nằm trong tiêu chí chấm điểm chính thức, ưu tiên thấp nhất
- Bộ sản phẩm nộp (theo đúng yêu cầu môn học): báo cáo đồ án (theo mẫu của khoa — Zero cần xin mẫu riêng, chưa có trong tài liệu đã đọc), source code có chú thích, tài liệu hướng dẫn sử dụng/cài đặt, slide thuyết trình 10-15 phút (cấu trúc: Vấn đề→Mục tiêu→Giải pháp→Phân tích→Thiết kế→Công nghệ→Demo→Kết quả→Hạn chế→Hướng phát triển), video demo sản phẩm

---

## 9. Roadmap (nhịp độ gợi ý — dài hạn cho mục tiêu thương mại, xem mục 8 để biết mốc rút gọn cho đồ án)

| Giai đoạn | Nội dung |
|---|---|
| Tuần 1-2 | Scaffold Next.js + Neon schema, khung chat UI cơ bản, upload 1 file + paste text, dựng hàng đợi job nền |
| Tuần 3-4 | MVP lõi: 1 file → transcribe → note theo Cornell + tóm tắt nhanh, Artifact Panel cơ bản |
| Tuần 5-7 | Multi-file multi-định dạng, kiến trúc chunk file dài, các template còn lại, xuất đa định dạng, chọn ngôn ngữ đầu ra |
| Tuần 8-9 | UX giữ chân: xử lý bất đồng bộ + thông báo, chat tiếp theo nguồn, regenerate từng phần, thư viện, share link, nguồn URL/YouTube |
| Tuần 10-11 | Kinh doanh hoá: phân quyền role, gate Free/Pro/Ultra, tích hợp ZeroInvoice billing thật, coupon, BYOK |
| Tuần 12+ | Mind map, TTS, action item, đồng bộ Notion/Calendar, spaced repetition |

---

## 10. Cần chốt trước khi build (không blocking, nên quyết sớm)

- ~~Con số cụ thể: giới hạn giờ xử lý/phiên, số ngày giữ file gốc trước khi xoá~~ → **Đã chốt**: 3h/50h/200h mỗi tháng; file 30'/2h/4h; giữ file gốc N ngày (đang cấu hình)
- Provider AI mặc định cho user không dùng BYOK — đề xuất tận dụng 9Router/OmniRoute đã có từ ZeroLLM
- Auth: chỉ email/password hay có thêm Google OAuth (thiết kế Stitch đã làm cả 2, chỉ cần xác nhận) → **Đã làm cả 2** (email/password + Google OAuth qua GIS popup)
- Notebook chia sẻ: chỉ xem hay đồng biên tập
- Số lượng thành viên nhóm đồ án — xác nhận với giảng viên (xem mục 8.4)
- Mẫu báo cáo đồ án theo khoa (xin từ giảng viên trước Tuần 10)

---

## 11. Kickoff prompt cho Hermes Agent

```
Bắt đầu xây dựng Zero AI Note theo đúng PRD Zero AI Note.md đính kèm.
LƯU Ý: dự án này vừa là sản phẩm thương mại vừa là đồ án môn học có
deadline thật (mục 8) — ưu tiên đúng phạm vi rút gọn ở mục 8.5 trước,
không chạy theo roadmap dài hạn mục 9 nếu deadline đồ án gần kề.

Bước 1 — Xác nhận trước khi code:
- Đọc kỹ mục 10 (Cần chốt trước khi build), hỏi lại Zero từng điểm nếu
  chưa có câu trả lời cụ thể — đặc biệt là giới hạn giờ xử lý/phiên,
  vì ảnh hưởng trực tiếp tới thiết kế schema và luồng billing.

Bước 2 — Clone repo GitHub (Zero sẽ cung cấp link) chứa code UI đã xuất
từ Google AI Studio. Đọc kỹ mục 7.1 và 7.4 trước khi động vào code:
- Audit toàn bộ codebase theo đúng danh sách lỗi đã biết ở mục 7.4 (màu
  hardcode, pre-select sai, icon thao tác thiếu, dropdown model không
  đồng bộ BYOK) — xác nhận đã sửa hết trước khi build tiếp lên nền này
- Đóng gói code React hiện có vào cấu trúc Next.js (`app/` router, tách
  API routes) — KHÔNG suy luận kiến trúc backend/database từ cách code
  AI Studio tổ chức dữ liệu mock, chỉ lấy phần hiển thị

Bước 3 — Khởi tạo backend theo đúng thứ tự roadmap (mục 9), ưu tiên
theo mốc đồ án ở mục 8.5, không nhảy cóc sang giai đoạn sau khi giai
đoạn trước chưa chạy được thật.

Bước 4 — Tuân thủ nghiêm các nguyên tắc kỹ thuật đã chốt trong mục 3:
- content_structured là nguồn DUY NHẤT để sinh Preview và mọi định dạng
  tải — không parse ngược từ HTML
- Billing luôn fail-closed, mọi cuộc gọi ra ZeroInvoice qua server-side
- BYOK: validate SSRF trước khi gọi Endpoint URL tùy ý, mã hoá API key
- Import/Sync free models: dùng bảng cache dùng chung theo provider
  (`provider_free_models_cache`), không polling riêng theo từng user
- Không dùng Google Cloud Run, không dùng Rust cho phần lõi
- Neon database là lưu trữ CHÍNH; Cloudflare R2 chỉ là backup khi Neon đầy

Bắt đầu từ việc audit + đóng gói code AI Studio (Bước 2), sau đó mới
sang Tuần 1-2: nối schema Neon (mục 6) + JWT auth thật vào nền UI đã có.
```

---

## 12. Lịch sử thay đổi

| Ngày | Nội dung |
|---|---|
| 2026-08-18 | **Hợp nhất 2 file PRD** (`PRD-Zero-AI-Note.md` + `PRD_Zero_AI_Note.md`) thành 1 file duy nhất. Cập nhật theo hiện trạng triển khai: Neon database chính + Cloudflare R2 backup, JWT auth thay Neon Auth, 3 gói giá chốt con số cụ thể (3h/50h/200h, file 30'/2h/4h), đơn vị tiền tệ theo ngôn ngữ (đ/$) |
| 2026-08-17 | Bổ sung bối cảnh Đồ án Chuyên ngành (deadline Tuần 10 & 15), quyết định storage Neon chính + R2 backup |
| 2026-08-16 | Chuyển từ Supabase sang Neon, bổ sung BYOK chi tiết (Import/Sync free models, Test Connection/Check Model) |
