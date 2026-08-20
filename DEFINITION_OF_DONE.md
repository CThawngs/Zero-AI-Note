# DEFINITION OF DONE — Zero AI Note

> Checklist Mục 9 của master prompt. Tick theo tiến độ thật — chỉ báo "xong" khi đạt hết.

## Giai đoạn 0 — Audit & đóng gói code AI Studio
- [x] Audit theo PRD 7.4: màu hardcode = 0, pre-select Auto đúng, icon thao tác đủ (ghi DECISIONS.md)
- [x] Đóng gói vào Next.js app router — `next build` pass (compile + TS + prerender), `next start` HTTP 200, UI render đúng (commit 3294988)
- [x] 3 file quản lý dự án tồn tại (ARCHITECTURE/DECISIONS/DEFINITION_OF_DONE)
- [x] Fix lỗi type ẩn: TranslationKey thiếu 18 keys (vi/en), t() trả string[], setSettingsActiveTab thiếu 'appearance', localStorage SSR guard

## Tuần 1-2 — Nền tảng
- [x] Auth scaffold + JWT routes (login/register/session) + bcrypt password hashing (commit ee5c502)
- [x] `/api/auth/*` hoạt động, cookie HttpOnly 7 ngày, bcrypt + jose đã cài
- [x] Google OAuth (GIS + google-auth-library token verification server-side) ✅
- [x] Schema PRD mục 6 tạo đủ (11 bảng + RLS + indexes) — trên Neon Postgres
- [x] Tạo Neon project + migrate schema thật + cập nhật `.env.local` `NEON_DATABASE_URL`
- [x] `/api/health` trả kết nối DB thật (verified 200 OK)
- [x] Gate Free/Paid/Ultra bằng `profiles.plan` + `processing_minutes_used`/`processing_minutes_limit` (Free=120, Pro=1200, Ultra=6000/phút)
- [ ] Hàng đợi job nền (Inngest/Trigger.dev) dựng xong, test 1 job giả lập chạy được

## Tuần 3-4 — MVP lõi
- [x] 1 file thật / prompt → transcribe & phân tích thật bằng Google Gemini 2.0 Flash → note Cornell/tóm tắt nhanh → Artifact Panel (commit mới)
- [x] Copy/Download hoạt động thật (DOCX thật qua docx package, PDF chuẩn print, Markdown, HTML — không placeholder)
- [x] `content_structured` là nguồn DUY NHẤT để render Preview và sinh mọi file export (MD/DOCX/PDF/HTML)

## Tuần 5-7 — Mở rộng đầu vào/đầu ra & AI Agent Engine
- [x] Đọc hiểu & Trích xuất nội dung đa định dạng: Tệp mã nguồn, text, markdown (.txt, .md, .json, .py, .ts,...), PDF, DOCX, Video/Audio transcripts và link YouTube/Web ✅
- [x] Trực quan hóa Markdown phong phú & Khối mã nguồn CodeBlock chuyên nghiệp kèm nút Sao chép 1-Click (`MarkdownView.tsx`) ✅
- [x] Kiến trúc Dual-Mode AI Agent: Hội thoại suy luận sâu, lập trình Frontend / UI-UX sạch đẹp, tự động thu thập thông tin và kiến tạo Note chuyên sâu ✅
- [x] Hệ thống 17 templates học thuật chuẩn hóa + Auto Mode + Hạn mức Custom Templates phân cấp rõ ràng ✅
- [x] Xuất 4 định dạng MD/DOCX/PDF/HTML, preview chuẩn từng cấp độ (Raw / Static HTML / Interactive HTML JS) ✅

## Tuần 8-9 — UX giữ chân & Thư viện Ghi chú
- [x] Thư viện Ghi chú (Notes Library) với kiến trúc Living Note (1 Session = 1 Living Note in-place upsert) ✅
- [x] Fast Switcher "Cuộc trò chuyện gần đây" (Recent Chats) trên Sidebar ✅
- [x] Cơ chế Lưu trữ & Thùng rác 30 ngày (Trash & Archives) với đếm ngược tự động và Khôi phục 1-Click ✅
- [x] Chia sẻ Note (Share Link view-only modal) & Ghim Note lên đầu ✅
- [x] Tối ưu hóa UI/UX: Loại bỏ scrollbar ngang Windows trên toàn bộ Tabs và Filter controls ✅

## Tuần 10-11 — Kinh doanh hoá & Phân cấp Gói
- [x] Master Pricing Matrix & Hạn mức Custom Templates (Free 5 / Pro 25 / Ultra không giới hạn) ✅
- [x] Dynamic Quota Badges & Nâng cấp thời gian thực trên Sidebar, Settings, Header ✅
- [x] Webhook ZeroInvoice & Thanh toán VietQR Napas EMVCo payload chuẩn ✅
- [x] Thanh toán VietQR Tự Động 100% Zero-Click: Polling 2.5s, không cần nút xác nhận thủ công, kích hoạt tức thì ✅
- [x] Cổng quản trị Admin Coupon bảo vệ nghiêm ngặt chỉ cho phép email chỉ định (`ADMIN_EMAIL`) ✅
- [x] Coupon CRUD thật qua Admin (role server-side, 100% chiết khấu %, kích hoạt 0đ tức thì) ✅
- [x] Ràng buộc 1 tài khoản = 1 mã coupon duy nhất (bảng `user_coupons` trên Neon) ✅
- [x] Zero Tracking realtime payee switch: combobox đổi TK/Ví (bank/MoMo/ZaloPay) per-checkout ✅
- [x] BYOK & Custom Endpoints đầy đủ: Khóa bảo vệ Verified Providers, Hỗ trợ Đa máy chủ Custom Endpoint (Auto-slug), Optional Default Model, Test connection thực tế qua /api/providers/test và tích hợp Model Selector trên Header ✅

## Tuần 12+ — Khác biệt/nâng cao
- [ ] Mind map, TTS, action item, đồng bộ Notion/Calendar, spaced repetition

## Launch
- [ ] Deploy Vercel production, domain hoạt động
- [ ] Chạy thử luồng chính trọn vẹn: đăng ký → upload → nhận note → nâng cấp → thanh toán thật

---

## Checklist chung (Mục 9 master prompt) — áp dụng cuối mỗi giai đoạn
- [ ] 1. Chạy được với dữ liệu thật, không còn mock data sót
- [ ] 2. RLS bật + test 2 tài khoản (user A không đọc được user B)
- [ ] 3. Không màu hardcode mới (đổi thử 2-3 theme)
- [ ] 4. Không API key/secret lộ client bundle (kiểm tra Network tab)
- [ ] 5. `content_structured` vẫn là nguồn duy nhất
- [ ] 6. Mọi quyết định tự đưa ra đã ghi DECISIONS.md
- [ ] 7. File này đã cập nhật đúng tiến độ
- [ ] 8. Test luồng lỗi — không crash trắng trang/treo vô hạn
