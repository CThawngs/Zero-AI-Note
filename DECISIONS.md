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