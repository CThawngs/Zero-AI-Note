# DECISIONS — Zero AI Note

> Log mọi quyết định tự đưa ra theo Giao thức Mục 2 của master prompt. Format: `[HERMES QUYẾT ĐỊNH: <nội dung> — lý do: <lý do ngắn>]`

## 2026-08-15 — Bước 1: Xác nhận điểm chưa chốt (PRD mục 9)

### Q1 — Giá gói Paid/tháng [CHỐT THEO ZERO + HERMES PHÂN BỔ]
Zero chốt: **3 gói — Free / Pro 99k / Ultra 199k**. Hermes phân bổ tính năng:

[HERMES QUYẾT ĐỊNH: **Phân bổ 3 gói dựa trên chi phí vận hành thật + giá trị cảm nhận** — chi tiết trong phần "Phân bổ 3 gói" bên dưới — lý do: (1) Free giữ tính năng giữ chân (thư viện, chat tiếp, share view-only) để tối đa engagement, đúng nguyên tắc PRD mục 5; (2) Pro 99k = gói "dùng thật mỗi ngày" giá thấp dễ chuyển đổi, chứa toàn bộ tính năng lõi + giới hạn vừa phải; (3) Ultra 199k = gói "prosumer/nhóm" giá cao hơn cho nhu cầu xử lý nặng (file dài, xuất đa định dạng cao cấp, BYOK, ưu tiên tốc độ) — chênh 100k đủ để kéo người dùng nặng lên Ultra mà không quá đắt so với ChatGPT Plus ($20).]

**Phân bổ 3 gói (chi tiết)**:

| Tính năng | Free (0đ) | Pro (99k) | Ultra (199k) |
|---|---|---|---|
| Giờ xử lý/tháng | 2h | 20h | 100h |
| Số ghi chú/tháng | 15 | 200 | Không giới hạn |
| Template | Cornell, Outline, Tóm tắt nhanh | + Q&A, Flashcard | + Auto mode, Custom template |
| Xuất file | MD | MD, DOCX, PDF | MD, DOCX, PDF, HTML |
| Lưu trữ đám mây | 500MB | 5GB | 50GB |
| File dài tối đa | 1h | 4h | 12h+ (ưu tiên) |
| TTS đọc note | ❌ | ✅ | ✅ |
| Mind map/biểu đồ | ❌ | ❌ | ✅ |
| BYOK (API key riêng) | ❌ | ✅ | ✅ |
| Model cao cấp (Claude/GPT-4o) | ❌ | ✅ | ✅ |
| Ưu tiên hàng đợi xử lý | ❌ | ❌ | ✅ |
| Chat tiếp theo nguồn | ✅ | ✅ | ✅ |
| Thư viện không giới hạn | ✅ | ✅ | ✅ |
| Share link (view-only) | ✅ | ✅ | ✅ |

### Q9 — Xóa file gốc sau khi transcribe [CHỐT THEO ZERO]
[HERMES QUYẾT ĐỊNH: **Option α — XÓA SẠCH 100%** ngay sau khi transcribe xong — lý do: (1) Zero yêu cầu "free 100% hiện tại" + "nghe xong xóa"; (2) Pipeline regenerate từ transcript (PRD đã có) không cần file gốc; (3) User upload lại nếu cần — UX rõ ràng; (4) Storage cost = 0, R2 free 10GB đủ buffer.]
→ Lưu transcript (~50-200KB/video 10h) vào DB + lưu ngắn gọn content_structured
→ File gốc MP4 chỉ tồn tại **trong thời gian transcribe** (1-2h) trên R2, rồi xóa vĩnh viễn

### Database chốt [NHẤT QUÁN]
[HERMES QUYẾT ĐỊNH: Giữ **B — Neon Postgres** làm database chính — RLS đầy đủ, schema Postgres match PRD mục 6 nguyên trạng, tooling migration chuẩn (drizzle-kit) — lý do: (1) PRD bắt buộc RLS trên mọi bảng cá nhân; (2) Kinht nghiệm ZeroLLM dùng Postgres đã thành công; (3) Free 0.5GB đủ 20 user active (~25MB/user metadata).]

## Storage cho file nguồn (upload tạm) [HERMES QUYẾT ĐỊNH]
[HERMES QUYẾT ĐỊNH: **Cloudflare R2** — free 10GB/tháng + không tính egress — lý do: (1) File gốc chỉ tồn tại tạm trong pipeline transcribe (1-2h), sau đó xóa; (2) 10GB free đủ buffer cho nhiều user upload hàng loạt; (3) S3-compatible API, dùng chung signer với Vercel Blob lib nếu cần.]

## Kiểm tra free tier STT/TTS API options [KHÁM PHÁ]
- **Google Gemini 2.5-3.1 Flash TTS (preview)**: 100% free, 8K context, 15 RPM — đủ cho note tóm tắt ngắn
- **Fish Audio S2.1 Pro Free**: OpenRouter, 116M weekly tokens free — model TTS chất lượng cao
- **Deepgram Flux TTS (free)**: OpenRouter, 857K weekly tokens — backup TTS
- **Gemini 2.0 Flash (audio input)**: free tier 15 RPM — STT chính cho pipeline transcribe (nhận audio URL từ R2, không cần file local)
- **Whisper via Groq**: free 30 req/min — backup STT nếu Gemini hết quota

[HERMES QUYẾT ĐỊNH: STT chính = Gemini Flash audio input (free 15RPM) + backup Whisper Groq (30 RPM) — 2 lớp nếu 1 bị lỗi.]

### Q2 — Giới hạn giờ xử lý/phiên [HERMES QUYẾT ĐỊNH]
[HERMES QUYẾT ĐỊNH: Free = 2 giờ/tháng, Paid = 20 giờ/tháng — lý do: (1) Free 2h đủ cho 1-2 bài giảng dài để dùng thử sản phẩm thật, đủ thấp để chặn abuse/chi phí API âm; (2) Paid 20h hào phóng cho use case học tập thật (sinh viên xử lý 3-5 bài giảng/tháng), vẫn có chặn trên tránh phí API ngoài tầm kiểm soát; (3) Con số dễ truyền thông: "2 giờ miễn phí mỗi tháng"; (4) Lưu vào `profiles.processing_minutes_used` + `processing_minutes_limit`, reset theo tháng — tương lai dễ chỉnh qua config không cần đổi schema.]

### Q3 — Provider AI mặc định cho user không BYOK [CHỐT THEO ZERO]
Danh sách provider có sẵn (server-side key pool do Zero cấp, không lộ client):
- **Google AI (Gemini)** — default mặc định (rẻ, nhanh, đã có kinh nghiệm từ ZeroLLM, hỗ trợ file dài tốt)
- OpenAI, Anthropic (Claude), NVIDIA, Groq, OpenRouter, DeepSeek, Grok (xAI)
- Mỗi provider đặt key ở env server-side (`AI_PROVIDER_KEYS`), app chỉ gọi qua API route
- User chọn provider bất kỳ trong danh sách này khi không BYOK

### Q4 — Auth [CHỐT THEO ZERO — BẮT BUỘC]
- Google OAuth ngay từ đầu (bắt buộc) + email/password
- Forgot password (gửi email reset link) — "đổi mật khẩu nếu không nhớ"
- Supabase Auth native, bật cả 2 provider ngay Tuần 1-2

### Q5 — Notebook chia sẻ [HERMES QUYẾT ĐỊNH]
[HERMES QUYẾT ĐỊNH: MVP + Tuần 8-9 dùng **view-only** (share link xem note, không sửa), đồng biên tập để sau launch — lý do: (1) Đồng biên tập đòi hỏi Supabase Realtime + conflict resolution + RLS phức tạp hơn nhiều, tăng scope đáng kể; (2) Use case học tập chính là chia sẻ note cho bạn bè/đồng nghiệp xem — không cần sửa chung; (3) View-only share link đơn giản (bảng `shared_notes` + RLS read-only), launch nhanh hơn; (4) Nếu có nhu cầu thật sau launch → thêm bảng `notebook_members` với role editor, không phá schema hiện tại.]

---

## Audit code AI Studio (Bước 2) — kết quả

[HERMES QUYẾT ĐỊNH: Audit theo PRD mục 7.4 — kết quả SẠCH: (1) Màu hardcode Tailwind (blue/cyan/indigo/sky/violet/purple) = 0 match trong .tsx/.css; (2) Hex màu trong code = chỉ 4 màu logo Google chính hãng (#EA4335/#4285F4/#FBBC05/#34A853) ở LoginScreen — giữ nguyên vì là thương hiệu bắt buộc; (3) Pre-select pill: Auto là mặc định duy nhất ✓; (4) Icon thao tác bảng: đã đủ Sửa/Xoá/Khôi phục ✓ — lý do: không cần sửa gì thêm trước khi đóng gói Next.js.]

[HERMES QUYẾT ĐỊNH: Stack hiện tại là Vite + React 19 + Tailwind v4 (chưa Next.js) — sẽ đóng gói sang Next.js app router theo PRD mục 3.1, giữ nguyên component/layout/animation/theme system (12 theme), chỉ thêm `app/` router + API routes — lý do: master prompt Mục 5.1 yêu cầu giữ nguyên phần hiển thị, không thiết kế lại.]
