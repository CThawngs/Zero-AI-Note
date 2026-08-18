# PRD Zero AI Note

> **Phiên bản hợp nhất & cập nhật toàn diện** (gộp từ `PRD-Zero-AI-Note.md` + `PRD_Zero_AI_Note.md`; chuẩn hóa bảng giá, phân cấp tính năng, hệ thống templates, cơ chế xuất file và database schema mới nhất — 2026-08-18).
>
> Website ghi chú AI dạng chat (kiểu Gemini/ChatGPT), nhận file dài đa định dạng (video/audio/PDF/slide/ảnh/text/link), xuất note theo phương pháp học thuật cụ thể (Cornell, Outline, Q&A...) đồng thời dưới nhiều định dạng (Markdown/DOCX/PDF/HTML) ngay trong cuộc trò chuyện. **Vừa là sản phẩm thương mại dài hạn (không deadline), vừa là đồ án môn học có deadline thật — xem mục 8 để biết bối cảnh và ưu tiên tương ứng.**

---

## Mục lục

1. [Định vị sản phẩm](#1-định-vị-sản-phẩm)
2. [Đối tượng người dùng](#2-đối-tượng-người-dùng)
3. [Kiến trúc kỹ thuật](#3-kiến-trúc-kỹ-thuật)
4. [Đặc tả tính năng](#4-đặc-tả-tính-năng)
5. [Mô hình kinh doanh & Bảng giá](#5-mô-hình-kinh-doanh--bảng-giá)
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
| Frontend + API routes | Next.js trên **Vercel** | Đã quen thuộc (ZeroInvoice đang chạy Vercel), free tier đủ dùng giai đoạn đầu. Lưu ý giới hạn Vercel: **Request Payload tối đa 4.5MB**, **Serverless function timeout 10s–60s** — mọi upload file lớn và xử lý nặng KHÔNG được đi qua request đồng bộ này (xem mục 4.1 Presigned URL) |
| Database (lưu trữ chính) | **Neon** (Postgres serverless) | Đổi từ Supabase vì free tier Supabase giới hạn 2 project hoạt động cùng lúc. Neon free tier cho tới 100 project. **Neon là nơi lưu trữ CHÍNH** cho Text, Metadata, JSON, Profile, Notes (dữ liệu cấu trúc) |
| Media file storage (Presigned URL upload) | **Cloudflare R2** (S3-compatible) | Lưu trữ file media (Video/Audio/PDF/Docx/ppt...) khi tải lên qua **Presigned URL** — trình duyệt đẩy thẳng lên R2, không đi qua server Next.js (tránh giới hạn 4.5MB Vercel). Đa vùng, production ổn định, free tier 10GB |
| ORM | **Drizzle ORM** (duy nhất) | Không lẫn Prisma/raw Supabase; driver Neon serverless (`@neondatabase/serverless`) |
| Auth | **JWT tự phát hành** (`jose` + `bcryptjs`), session cookie HttpOnly | Đã thay thế Neon Auth trong quá trình triển khai — 1 cơ chế ký token duy nhất (`lib/auth/session.ts`), fail-closed khi thiếu `ZERO_JWT_SECRET`. Hỗ trợ email/password + Google OAuth (Google Identity Services popup) |
| Job nền (xử lý file dài) | **Inngest hoặc Trigger.dev** | Chuyên cho chuỗi job AI dài nhiều bước, tách biệt hoàn toàn khỏi nơi hosting app chính. **Giới hạn song song**: key Gemini dùng chung chạy tối đa **1–2 job AI đồng thời**, các job còn lại xếp hàng chờ (Pending queue) để tránh vượt quota (15 RPM / 1M TPM) |
| AI xử lý | Cloud API only — **Gemini API key dùng chung của hệ thống** (mặc định) + tính năng **"Tự kết nối AI / Nhà cung cấp AI"** (dùng API Key riêng qua chuẩn OpenAI-compatible) | Đã bỏ hướng on-device/local. Cả 3 gói dùng chung 1 Gemini key; khi key quá tải/nghẽn quota (`429 Resource Exhausted`) → job xếp hàng chờ hoặc user chuyển sang Tự kết nối AI. **Chống lộ key**: biến môi trường là `GEMINI_API_KEY` (KHÔNG có tiền tố `NEXT_PUBLIC_`), 100% cuộc gọi AI chạy qua API Route server-side hoặc worker — client không bao giờ gọi Google AI trực tiếp |
| Billing | **Zero Tracking** (zeroinvoice-silk.vercel.app, tên mới của ZeroInvoice) | Tạo bill qua `POST /api/bills` (amount locked), render QR client-side `qrcode.react`, kiểm tra trạng thái qua polling + webhook `bill.paid`. API key đọc từ env (`ZERO_TRACKING_API_KEY`/`ZEROINVOICE_API_KEY`), không lộ client-side |
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
  → Giai đoạn 3: Sinh content_structured (Block-based JSON chuẩn) — nguồn duy nhất để
    render Preview (HTML) và mọi định dạng tải (MD/DOCX/PDF/HTML)
  → Trình duyệt Polling trạng thái mỗi 2–3 giây tới `/api/notes/status/:jobId`
    (KHÔNG stream token qua SSE/WebSocket — đã chọn polling để gọn, không cần thêm
    service trung gian như Pusher/Ably; không phụ thuộc Supabase Realtime)
  → Frontend hiển thị Stepper 3 bước: [1] Trích Transcript → [2] Phân tích cấu trúc
    → [3] Hoàn thiện Note. 100% → load toàn bộ content_structured vào Artifact Panel
  → Thông báo user khi xong (email/in-app)
```

**Giải thích streaming**: PRD trước ghi "stream kết quả theo từng chunk nếu có thể" — điều này mâu thuẫn với job nền trên Neon thuần (không có Supabase Realtime/Pusher/Ably). Đã **đơn giản hóa thành Polling** 2–3s + Stepper, đủ tốt cho vibe coding và UX, tránh dựng hạ tầng SSE/WebSocket phức tạp.

**Nguyên tắc bắt buộc**: Preview và file tải về đều sinh ra từ cùng 1 `content_structured`, không parse ngược từ HTML — tránh các định dạng lệch nhau. DOCX/PDF không tự render trong trình duyệt, chỉ sinh file thật tại thời điểm tải.

### 3.3 Bảo mật & vận hành

- Row-Level Security (RLS) trên mọi bảng chứa dữ liệu cá nhân (Neon dùng cú pháp `auth_uid()` qua `current_setting('request.jwt.claims')`, không dùng `auth.uid()` của Supabase) — áp dụng cho `notes`, `notebooks`, `sources`, `byok_providers`, `coupons`, `subscriptions`
- API key "Tự kết nối AI" mã hoá khi lưu, không log ra console, không lộ client-side
- Chặn SSRF: validate Endpoint URL tùy ý (Custom Endpoint) ở server-side, từ chối địa chỉ nội bộ/private IP trước khi Test/gọi thật
- Billing qua **Zero Tracking** (tên mới của ZeroInvoice): API key đọc từ env (fail-closed — KHÔNG hardcode key trong source; nếu `ZEROINVOICE_WEBHOOK_SECRET` đã set thì webhook bắt buộc xác minh chữ ký HMAC-SHA256 — signature sai → từ chối 401; khi CHƯA set secret thì fail-open để không chặn luồng tích hợp). Xử lý idempotent tránh cộng dồn subscription
- **Zero Tracking (VietQR)**: tạo bill bằng `POST /api/bills` (chỉ cần `amount`), nhận `qr_data` → **render QR client-side bằng `qrcode.react`** (EMVCo VietQR payload: acqId + accountNo + amount + addInfo). amount + addInfo bị **LOCKED** bởi Zero Tracking, bill hết hạn sau **30 phút**. Check trạng thái bằng `GET /api/bills/:id` (polling) hoặc webhook `{event:"bill.paid", data:{bill_id, amount, paid_at}}` (header `x-webhook-signature`). Luồng chính của app: polling `/api/billing/check-status`; webhook `/api/billing/webhook` là kênh phụ
- Phân quyền admin qua trường `role` trong DB, kiểm tra server-side ở mọi route — không chỉ ẩn UI. Admin email cấu hình 1 nơi `ADMIN_EMAIL` trong `.env.local`
- Tự động xoá file gốc sau N ngày (giữ lại note), giảm chi phí lưu trữ + rủi ro riêng tư
- **JWT fail-closed**: thiếu `ZERO_JWT_SECRET` → crash runtime, không fallback yếu

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

**Ràng buộc hạ tầng Vercel Serverless — bắt buộc tuân thủ**:
- **Giới hạn Request Payload 4.5MB**: File lớn >4.5MB **KHÔNG** gửi qua form/sheet thông thường tới API Route Next.js — Vercel sẽ sập.
- **Upload qua Presigned URL**: Trình duyệt client gọi API Route `/api/upload/presign` (chỉ cần tên file + loại + size) → nhận URL Presigned từ R2 → **đẩy thẳng file lên Cloudflare R2** (không qua server Next.js). Server chỉ lưu `file_url` (R2 key) trong table `sources`.
- **Bóc tách Audio client-side (cho file Video tải lên trực tiếp)**: Trình duyệt dùng **Web Audio API / FFmpeg.wasm** để tách luồng âm thanh ngay tại máy user trước khi đẩy lên R2 — file audio kết quả (~30–50MB thay vì video 2–10GB) tiết kiệm băng thông + token Gemini. Nếu trình duyệt không hỗ trợ → fallback tải full video lên R2 + log cảnh báo để Hệ thống xử lý tách bên worker (nhưng nên khuyến khích client-side trước).
- **Link YouTube**: Backend chỉ tải audio stream (format m4a/opus ~20MB) hoặc ưu tiên cào phụ đề có sẵn (Captions) — **không tải video 4K full**.

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
- Thanh tiến trình theo giai đoạn thật (Trích transcript → Cấu trúc → Tạo file), không phải spinner vô nghĩa
- Streaming kết quả theo từng chunk khi có thể

### 4.6 Giữ chân người dùng
- Chat tiếp dựa trên nguồn gốc (hỏi thêm sau khi có note, trả lời dựa trên transcript đã xử lý)
- Regenerate từng phần riêng lẻ, không chạy lại toàn bộ file gốc
- Lưu cấu hình mặc định (phương pháp + ngôn ngữ + độ sâu)
- Ước tính thời gian xử lý trước khi bắt đầu; cho xem note mẫu trước khi user tự thử file thật

> **Đã loại bỏ**: TTS (Text-to-Speech), Audio Player, Web Speech API, Edge-TTS — KHÔNG còn trong bất kỳ gói nào, giữ codebase tinh gọn.

### 4.7 Tính năng mở rộng (ưu tiên thấp hơn, làm sau)
- Trích xuất action item, đồng bộ Notion/Google Docs/Calendar
- Spaced repetition cho template Flashcard
- ~~Chế độ on-device Gemma~~ — đã tạm gác (mâu thuẫn với quyết định full-cloud; quay lại nếu có nhu cầu doanh nghiệp thật, khi đó triển khai qua WebGPU/ONNX Runtime Web trên trình duyệt user, không phải server Zero)

### 4.8 Tự kết nối AI / Nhà cung cấp AI (trước đây: BYOK — Bring Your Own API Key)

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

**Nguyên tắc gate tính năng**: theo chi phí vận hành thực tế — tính năng tốn compute (Interactive Preview, mind map, xuất file cao cấp) vào gói Paid; tính năng giữ chân user (thư viện, chat tiếp theo nguồn) giữ Free để tối đa engagement.

### Bảng Master Pricing Matrix (chuẩn)

| Hạng mục / Tính năng | Gói FREE (0đ) | Gói PRO (99.000đ/tháng) | Gói ULTRA (199.000đ/tháng) |
|---|---|---|---|
| **Giá thành** | **0đ** | **99.000đ / tháng** (~$4) | **199.000đ / tháng** (~$8) |
| **Giới hạn lưu trữ Note** | **Tối đa 20 Notes** | **Tối đa 50 Notes** | **Không giới hạn** số lượng Note |
| **Thời lượng & AI Engine** | Không giới hạn thời lượng, dùng chung Gemini Key mặc định hoặc Tự kết nối AI cá nhân | Không giới hạn thời lượng, dùng chung Gemini Key mặc định hoặc Tự kết nối AI cá nhân | Không giới hạn thời lượng, dùng chung Gemini Key mặc định hoặc Tự kết nối AI cá nhân |
| **Xem trước (In-App Preview)** | • Code Raw thô<br>• Preview Markdown đã render | • Toàn bộ của Free<br>• Preview HTML Tĩnh (layout CSS chuẩn) | • Toàn bộ của Pro<br>• Preview HTML Tương tác Động (JS, chart hover, animation) |
| **Định dạng Xuất file** | 3 định dạng cơ bản (`.pdf`, `.docx`, `.md`) | 4 định dạng chuẩn (PDF, DOCX, MD, HTML Webpage tĩnh) | 4 định dạng cao cấp (PDF, DOCX, MD, Single-file Interactive HTML nhúng CSS/JS) |
| **Cơ chế Tải xuống** | Tải đơn lẻ từng file một | Tải đơn lẻ từng file một | Tùy chọn đa dạng qua Checkbox (Tải song song / nén `.zip`) |
| **Hệ thống Templates có sẵn** | **3 template nền tảng:**<br>• Cornell<br>• Outline<br>• Tóm tắt tổng quan | **9 template (Kế thừa Free + 6 chuyên sâu):**<br>• Tóm tắt cuộc họp<br>• Tóm tắt bài giảng<br>• Phân tích chi tiết<br>• Q&A<br>• Charting Method<br>• Boxing Method | **17 template (Kế thừa Free, Pro + 8 chuyên gia):**<br>• Take Note tổng hợp (All-in-One)<br>• Mindmap<br>• Flashcard<br>• Phân tích chuyên sâu<br>• Feynman Technique<br>• First Principles<br>• Syntopical Matrix<br>• 5W1H & Actionable |
| **Tự tạo Template (Custom)** | Tối đa **5 templates** | Tối đa **25 templates** | **Không giới hạn** số lượng |

> **Ghi chú pricing**: 
> - **Không giới hạn giờ xử lý / độ dài file** trên lý thuyết cho cả 3 gói — nếu Gemini key hệ thống quá tải/nghẽn quota, user chờ reset hoặc chuyển sang "Tự kết nối AI".
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

**Coupon**: trang quản lý riêng, CRUD đầy đủ, giới hạn số lần dùng + ngày hết hạn + áp dụng cho gói nào.

**Admin**: chỉ 1 tài khoản (`nguyenchithang2804@gmail.com`) truy cập trang Coupon, phân quyền qua `role` kiểm tra server-side + RLS, set thủ công 1 lần qua SQL — không có flow tự nhận quyền admin.

**Tích hợp ZeroInvoice**: fail-closed cho mọi luồng thanh toán, webhook xác minh chữ ký, xử lý idempotent, đối chiếu định kỳ trạng thái subscription phòng khi webhook bị lỡ.

---

## 6. Database Schema (Neon / Drizzle)

> **Bản nháp schema khái niệm** (từ PRD gốc). Khi build thực tế, schema được tinh chỉnh theo Neon + Drizzle ORM — xem `docs/schema-neon.sql` và `docs/schema.sql` là bản thực thi hiện tại.

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
  amount numeric not null,                    -- Số tiền thực trả (99000 / 199000)
  status text default 'pending' check (status in ('pending','paid','expired','canceled')),
  qr_data text,                               -- Chuỗi EMVCo payload (render client-side)
  coupon_code text,
  paid_at timestamptz,
  renews_at timestamptz,                      -- Ngày hết hạn gói (now() + 30 days)
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

Dark mode mặc định (theme "Giấy"), brand "Zero AI Note" + tagline "AI-Powered Research", nav chuẩn: Notes / Search / Files / Account / Templates / Archives (dưới 1024px chuyển thành sidebar off-canvas).

1. **Màn chính** (chat + Artifact Panel) — hoàn chỉnh, gồm pill phương pháp (có "Auto" mặc định), modal Đính kèm nguồn, stepper xử lý 3 giai đoạn
2. **Thư viện** — grid/list toggle, tự phân loại file gộp, tab "Của tôi/Được chia sẻ"
3. **Cài đặt — Tài khoản & Billing**
4. **Cài đặt — Tự kết nối AI / Nhà cung cấp AI** — form Custom Endpoint (Tên Provider, Endpoint URL, API Key), nút **Test Connection** + nút **Discover Models**, dropdown model tự động đồng bộ đúng provider đã thêm
5. **Pricing** — 3 cột Free/Pro/Ultra theo đúng Master Pricing Matrix, ô coupon, FAQ
6. **Admin — Quản lý Coupon**
7. **Đăng nhập/Đăng ký** — email/password + Google OAuth
8. **Chi tiết 1 note đã lưu** — 2 cột (nội dung + chat hỏi thêm)
9. **Templates** — quản lý phương pháp ghi chú có sẵn (3/9/17 theo gói) + tự tạo (5/25/∞ theo gói)
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

## 9. Roadmap (nhịp độ gợi ý — dài hạn cho mục tiêu thương mại, xem mục 8 để biết mốc rút gọn cho đồ án)

| Giai đoạn | Nội dung |
|---|---|
| Tuần 1-2 | Scaffold Next.js + Neon schema, khung chat UI cơ bản, upload 1 file + paste text, dựng hàng đợi job nền |
| Tuần 3-4 | MVP lõi: 1 file → transcribe → note theo Cornell + tóm tắt nhanh, Artifact Panel cơ bản |
| Tuần 5-7 | Multi-file multi-định dạng, kiến trúc chunk file dài, các template còn lại, xuất đa định dạng, chọn ngôn ngữ đầu ra |
| Tuần 8-9 | UX giữ chân: xử lý bất đồng bộ + thông báo, chat tiếp theo nguồn, regenerate từng phần, thư viện, share link, nguồn URL/YouTube |
| Tuần 10-11 | Kinh doanh hoá: phân quyền role, gate Free/Pro/Ultra, hạn mức 20/50/∞ notes, tích hợp ZeroInvoice billing thật, coupon, Tự kết nối AI |
| Tuần 12+ | Mindmap, Interactive Preview, action item, đồng bộ Notion/Calendar, spaced repetition |

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
- ✅ **Upload file lớn**: Presigned URL (client đẩy thẳng lên R2, tránh giới hạn 4.5MB Vercel); bóc tách audio client-side (Web Audio API/FFmpeg.wasm); YouTube chỉ lấy audio stream/captions
- ✅ **Job nền + Polling**: không stream token qua SSE/WebSocket — trình duyệt Polling `/api/notes/status/:jobId` mỗi 2–3s + Stepper 3 bước
- ✅ **Giới hạn AI song song**: key Gemini dùng chung chạy tối đa 1–2 job AI đồng thời (Inngest queue), user Tự kết nối AI dùng luồng riêng chạy ngay
- ✅ **Chống lộ Gemini key**: env `GEMINI_API_KEY` (KHÔNG `NEXT_PUBLIC_`), 100% gọi AI qua server-side route/worker, client không gọi Google AI trực tiếp
- ✅ **Auto Template gating**: chế độ Auto chỉ chọn template trong phạm vi gói user sở hữu (Free→3, Pro→9, Ultra→17)
- ✅ **Block-based `content_structured`**: 17 template trả về Block JSON chuẩn (heading/paragraph/cue_box/table/card_grid/callout...), Export Engine DUY NHẤT render DOCX/PDF/HTML — tránh 17×3=51 converter
- ✅ **Interactive HTML Ultra**: dùng HTML Template tĩnh mẫu + inject `window.__NOTE_DATA__`, KHÔNG để AI tự viết JS từ đầu
- ✅ **Subscription schema**: bảng `subscriptions` (bill_id, plan, amount, status, qr_data, coupon_code, paid_at, renews_at) — xem mục 6

**Còn cần xác nhận**:
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
- Đọc kỹ mục 10 (Cần chốt trước khi build). Các điểm đã chốt 2026-08-18
  phải tuân thủ nghiêm: bảng giá 3 gói, hạn mức 20/50/∞ notes, hệ thống
  templates 3/9/17, phân cấp Preview & Xuất file, KHÔNG có TTS, KHÔNG có
  Auto-Sync model free.

Bước 2 — Clone repo GitHub (Zero sẽ cung cấp link) chứa code UI đã xuất
từ Google AI Studio. Đọc kỹ mục 7.1 và 7.4 trước khi động vào code:
- Audit toàn bộ codebase theo đúng danh sách lỗi đã biết ở mục 7.4 (màu
  hardcode, pre-select sai, icon thao tác thiếu, dropdown model không
  đồng bộ provider) — xác nhận đã sửa hết trước khi build tiếp lên nền này
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
- Tự kết nối AI: validate SSRF trước khi gọi Endpoint URL tùy ý, mã hoá
  API key; chỉ có nút Test Connection + Discover Models (`/v1/models`),
  KHÔNG có Import/Sync free models, KHÔNG có provider_free_models_cache
- Giới hạn note/custom template kiểm tra server-side trước khi insert
  (Free <20/<5, Pro <50/<25, Ultra ∞/∞)
- Không dùng Google Cloud Run, không dùng Rust cho phần lõi
- Neon database là lưu trữ CHÍNH cho Text, Metadata, JSON, Profile, Notes; Cloudflare R2 là nơi lưu file media (Video/Audio/PDF/Docx/ppt...) thông qua Presigned URL.
- ✅ **Upload file lớn**: Presigned URL (client đẩy thẳng R2, tránh 4.5MB Vercel); bóc tách audio client-side (Web Audio API/FFmpeg.wasm); YouTube chỉ audio stream/captions
- ✅ **Job nền + Polling**: KHÔNG stream SSE/WebSocket — Polling `/api/notes/status/:jobId` 2–3s + Stepper 3 bước
- ✅ **Gemini key concurrency**: key dùng chung max 1–2 job AI song song (Inngest queue), user Tự kết nối AI chạy luồng riêng
- ✅ **Chống lộ Gemini key**: env `GEMINI_API_KEY` (KHÔNG `NEXT_PUBLIC_`), 100% gọi AI qua server route/worker
- ✅ **Auto Template gating**: Auto chỉ chọn template trong phạm vi gói user (Free→3, Pro→9, Ultra→17)
- ✅ **Block-based content_structured**: Block JSON chuẩn (heading/paragraph/cue_box/table/card_grid/callout...), Export Engine DUY NHẤT render DOCX/PDF/HTML
- ✅ **Interactive HTML Ultra**: HTML Template tĩnh mẫu + inject `window.__NOTE_DATA__`, KHÔNG AI tự viết JS
- ✅ **Subscription schema**: bảng `subscriptions` (bill_id, plan, amount, status, qr_data, coupon_code, paid_at, renews_at)

Bắt đầu từ việc audit + đóng gói code AI Studio (Bước 2), sau đó mới
sang Tuần 1-2: nối schema Neon (mục 6) + JWT auth thật vào nền UI đã có.
```

---

## 12. Lịch sử thay đổi

| Ngày | Nội dung |
|---|---|
| 2026-08-18 | **Bịt 5 điểm nghẽn kỹ thuật + 5 điểm cấn ngầm (Edge Cases & Architectural Traps) trước khi code**: (1) Presigned URL upload + bóc tách audio client-side (Web Audio API/FFmpeg.wasm) + YouTube chỉ audio/captions — tránh giới hạn 4.5MB Vercel; (2) giới hạn AI job song song 1–2 trên key dùng chung (Inngest queue) tránh `429 Resource Exhausted`; (3) bổ sung auth fields (email/password_hash/google_id) vào `profiles` + thêm bảng `subscriptions` (bill_id, plan, amount, status, qr_data, paid_at, renews_at); (4) Block-based `content_structured` chuẩn (heading/paragraph/cue_box/table/card_grid/callout) + Export Engine DUY NHẤT — tránh 17×3=51 converter; (5) Interactive Single-file HTML dùng template tĩnh mẫu + inject `window.__NOTE_DATA__` — không AI tự viết JS. Kèm: Auto Template gating theo gói (chống tier bypass), Polling 2–3s thay vì stream SSE/WebSocket, chống lộ Gemini key (`GEMINI_API_KEY` không `NEXT_PUBLIC_`), luồng thanh toán VietQR production chi tiết (create-bill → render QR qrcode.react → countdown 30 phút → polling 3s + webhook HMAC idempotent). |
| 2026-08-18 | **Đồng bộ Zero Tracking mới** (ZeroInvoice đổi tên): QR thanh toán render client-side bằng `qrcode.react` (EMVCo VietQR payload từ `qr_data`, amount/addInfo locked, bỏ `img.vietqr.io`); sửa `checkZeroInvoiceBillStatus` parse nested `data.bill`; webhook hỗ trợ event `bill.paid` + `data` payload; bỏ hardcode Zero Tracking API key (đọc từ env, fail-closed), webhook fail-open khi chưa set secret. Thêm mục 3.4 hướng dẫn Chrome Remote Debugging cho Hermes `browser_exec`. |
| 2026-08-18 | **Chuẩn hóa bảng giá 3 gói Free/Pro/Ultra; phân cấp Preview (Raw/Markdown/Static HTML/Interactive HTML); phân cấp Xuất file kèm Checkbox Multi-Export cho Ultra; mở rộng hệ thống 17 templates học thuật; bỏ tính năng TTS và Auto-Sync để tối ưu hóa vibe coding; đổi tên BYOK thành Tự kết nối AI.** |
| 2026-08-18 | **Hợp nhất 2 file PRD** (`PRD-Zero-AI-Note.md` + `PRD_Zero_AI_Note.md`) thành 1 file duy nhất. Cập nhật theo hiện trạng triển khai: Neon database chính + Cloudflare R2 backup, JWT auth thay Neon Auth, 3 gói giá chốt con số cụ thể (3h/50h/200h, file 30'/2h/4h — sau đó được thay bằng "không giới hạn thời lượng"), đơn vị tiền tệ theo ngôn ngữ (đ/$) |
| 2026-08-17 | Bổ sung bối cảnh Đồ án Chuyên ngành (deadline Tuần 10 & 15), quyết định storage Neon chính + R2 backup |
| 2026-08-16 | Chuyển từ Supabase sang Neon, bổ sung BYOK chi tiết (Import/Sync free models, Test Connection/Check Model — sau này bỏ Auto-Sync, đổi tên Tự kết nối AI) |
