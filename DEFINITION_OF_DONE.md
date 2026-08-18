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
- [ ] 1 file thật → transcribe thật (không mock) → note Cornell/tóm tắt nhanh → Artifact Panel
- [ ] Copy/Download hoạt động thật (DOCX/PDF thật, không placeholder)
- [ ] `content_structured` là nguồn duy nhất (không parse ngược từ HTML)

## Tuần 5-7 — Mở rộng đầu vào/đầu ra
- [ ] Multi-file multi-định dạng qua pipeline chunk
- [ ] 5 template + Auto mode + custom template hoạt động thật
- [ ] Xuất 4 định dạng MD/DOCX/PDF/HTML, preview đúng từng loại

## Tuần 8-9 — UX giữ chân
- [ ] Thư viện, chat tiếp theo nguồn, regenerate từng phần, share link (view-only) — dữ liệu Supabase thật
- [ ] Nguồn URL/YouTube hoạt động thật

## Tuần 10-11 — Kinh doanh hoá
- [ ] Gate Free/Paid thật dựa trên `profiles.plan` (Free 2h/tháng, Paid 20h/tháng)
- [ ] Webhook ZeroInvoice test 1 giao dịch THẬT (dừng xác nhận Zero trước khi bật)
- [ ] Coupon CRUD thật qua Admin (role server-side)
- [ ] BYOK đầy đủ: Test Connection, Check Model, Import/Sync free models qua cache dùng chung

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
