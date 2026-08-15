# DECISIONS — Zero AI Note

> Log mọi quyết định tự đưa ra theo Giao thức Mục 2 của master prompt. Format: `[HERMES QUYẾT ĐỊNH: <nội dung> — lý do: <lý do ngắn>]`

## 2026-08-15 — Bước 1: Xác nhận điểm chưa chốt (PRD mục 9)

### Q1 — Giá gói Paid/tháng [ĐANG CHỜ ZERO XÁC NHẬN]
Đề xuất của Hermes: **149.000đ/tháng (~$6)**.
- Lý do: (1) Thị trường VN — mức 99k-149k là vùng giá quen thuộc cho app học tập, dễ chuyển đổi từ Free; (2) So sánh đối thủ: Fathom free, Otter $16.99 (~430k), Notion AI $10 (~250k), ChatGPT Plus $20 (~500k) — 149k nằm dưới nhóm trả phí quốc tế nhưng vẫn đủ tạo giá trị; (3) Chi phí vận hành thật: 20h xử lý/tháng qua API (Gemini Flash rẻ + Whisper chunk) ước tính $2-5/user — 149k (~$6) đủ chi phí + biên lợi nhuận, không cần tăng giá sớm; (4) Định vị "cao hơn free tools, thấp hơn premium quốc tế" — đúng phân khúc sinh viên/nhà nghiên cứu VN.
- **Cần Zero xác nhận trước khi code luồng billing** (ảnh hưởng bảng `subscriptions`, webhook ZeroInvoice, text Pricing).

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
