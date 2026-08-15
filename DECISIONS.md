# DECISIONS — Zero AI Note

> [HERMES QUYẾT ĐỊNH format = quyết định tự đưa + lý do ngắn]

## Q1 Giá gói [CHỐT THEO ZERO + HERMES PHÂN BỔ]
Zero chốt Free / Pro 99.000đ / Ultra 199.000đ.
Phân bổ chi tiết: Free giữ chân (thư viện, chat tiếp), Pro = dùng thật mỗi ngày, Ultra = xử lý nặng/BYOK/ưu tiên.
Đã ghi kèm bảng tính năng và lý do trong commit gắn liền với PricingScreen.

## Q2 Giới hạn giờ xử lý/phiên [HERMES QUYẾT ĐỊNH]
Free 2h/tháng, Paid/Pro 20h/tháng, Ultra 100h/tháng.
Lý do: kiểm soát chi phí API, chống abuse, dễ truyền thông, dễ giới hạn về sau.

## Q3 Provider AI mặc định [CHỐT THEO ZERO]
Google AI (Gemini) làm default; OpenAI, Anthropic, NVIDIA, Groq, OpenRouter, DeepSeek, Grok theo sau.
Lưu key server-side, không expose client.

## Q4 Auth [CHỐT THEO ZERO — BẮT BUỘC]
Google OAuth + email/password + forgot password ngay Tuần 1-2.
Không chấp nhận skip auth.

## Q5 Notebook share [HERMES QUYẾT ĐỊNH]
MVP/Tuần 8-9: view-only share link.
Đồng biên tập để sau launch, tránh RLS/Realtime phức tạp sớm.

## Q6 Chính sách lưu trữ file nguồn [CHỐT THEO ZERO]
Xóa 100% file gốc ngay sau khi transcribe xong.
Chỉ giữ transcript + content_structured + thumbnail nhỏ.
Lý do: đúng yêu cầu “free 100%”, giảm chi phí lưu trữ tối đa, UX vẫn đủ nhờ regenerate từ transcript.

## Q7 Storage cho file tạm [HERMES QUYẾT ĐỊNH]
Cloudflare R2 — free 10GB/tháng, không tính egress.
Vì file chỉ tồn tại tạm trong pipeline transcribe, R2 là lựa chọn phù hợp nhất.

## Q8 Database [NHẤT QUÁN]
Neon Postgres làm DB chính.
Lý do: RLS đầy đủ, schema chuẩn Postgres, phù hợp PRD mục 3.3, kinh nghiệm đã có.
Free tier 0.5GB đủ ~20 users; vượt ngưỡng sẽ chuyển sang paid có điều kiện.

## Q9 STT/TTS API [HERMES QUYẾT ĐỊNH]
STT chính: Gemini Flash audio input (free tier).
Backup: Whisper qua Groq.
TTS: Gemini Flash TTS preview / Deepgram Flux TTS / Fish Audio S2.1 Pro Free theo thứ tự ưu tiên, tất cả free tier.

## Q10 GitHub Token Scope [CHỐT THEO ZERO — FULL ACCOUNT]
[HERMES QUYẾT ĐỊNH: Fine-grained PAT với quyền **All repositories** trên toàn bộ account `CThawngs` — lý do: Zero muốn mình (agent) có quyền push/triển code trên mọi project trong account mà không cần cấp thêm sau này.]

## Q11 Auth flow [HERMES QUYẾT ĐỊNH]
Dùng JWT do Next.js API route phát hành sau khi xác thực với Neon DB.
Không dùng session cookie, không dùng Magic Link.
Refresh token lưu HTTP-only cookie.
Lý do: không phụ thuộc service bên ngoài, phù hợp kiến trúc Neon + Next.js + Vercel edge.

## Q12 Bảng profiles trong Neon [NHẤT QUÁN]
Thêm cột processing_minutes_used INT mặc định 0 + processing_minutes_limit INT mặc định theo plan (Free=120, Pro=1200, Ultra=6000).
Reset về 0 mỗi đầu tháng bằng job nhẹ trong API route.
Lý do: không cần thay đổi schema lớn, vẫn giữ trong bảng profiles, dễ query + enforce.

## Phiên làm việc hiện tại
- Next.js đã build pass, route /api/health đã thêm (chờ Neon env để connect).
- lib/db.ts + lib/db-types.ts đã có, chờ NEON_DATABASE_URL.
- PricingScreen 3 gói đã commit, UI đang render đúng trên Next.js.
- Đang chờ Zero tạo Neon DB + GitHub PAT để tiếp tục Tuần 1-2.

## Chờ từ Zero
- GitHub Fine-grained PAT với quyền **All repositories** ✅ đã có (ghi nhận trong session này)
- NEON_DATABASE_URL

## Phiên làm việc hiện tại (2026-08-15)
- Next.js đã build pass, route /api/health đã thêm (chờ Neon env để connect).
- lib/db.ts + lib/db-types.ts đã có, chờ NEON_DATABASE_URL.
- PricingScreen 3 gói đã commit, UI đang render đúng trên Next.js.
- đã push code lên GitHub thành công bằng cách nhúng PAT vào URL khi push, không cần cài `gh` CLI.
- Phiên đã xác nhận docs sạch — không còn nhiễm nội dung Telegram/bot lạ.

## Cách push lên GitHub mà không cần `gh` CLI
- Bước 1: đã tải `gh.msi` qua curl nhưng lệnh `msiexec` không chạy ở PowerShell do từ khoá `start` hiểu nhầm.
- Bước 2: bỏ qua việc cài `gh`, push trực tiếp bằng cách nhúng token vào URL:
  `git push https://<PAT>@github.com/CThawngs/Zero-AI-Note.git main`
- Bước 3: nếu cần push lần sau, làm tương tự với token mới. Token hiện tại được Zero cung cấp 1 lần qua chat — không lưu vào file, repo hay memory để tránh lộ.