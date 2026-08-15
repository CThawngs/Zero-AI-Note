# DECISIONS — Zero AI Note
> [HERMES QUYẾT ĐỊNH format = quyết định tự đưa + lý do ngắn]

## Q1 Giá gói [CHỐT THEO ZERO + HERMES PHÂN BỘ]
Zero chốt Free / Pro 99.000đ / Ultra 199.000đ. Chi tiết phân bổ đã được ghi ở commit ebd81af và PricingScreen. HERMES tham khảo từ nghiên cứu thị trường + so sánh đối thủ Otter/ChatGPT Plus/Notion AI cho thấy mức 99-199k là vùng giá phù hợp và dễ chuyển đổi cho người dùng Việt.

## Q2 Giới hạn giờ xử lý/phiên [HERMES QUYẾT ĐỊNH]
Free 2h/tháng, Paid/Pro 20h/tháng, Ultra 100h/tháng. Lý do: kiểm soát chi phí API, bảo vệ khỏi abuse + dễ truyền thông.

## Q3 Provider mặc định [CHỐT THEO ZERO]
Google AI, OpenAI, Anthropic, NVIDIA, Groq, OpenRouter, DeepSeek, Grok. Lưu key server-side, dùng OmniRoute làm default aggregator.

## Q4 Auth [CHỐT THEO ZERO — BẮT BUỘC]
Google OAuth + email/password ngay từ Tuần 1-2, là bắt buộc. Có forgot password + đổi mật khẩu trực tiếp trong app.

## Q5 Notebook share [HERMES QUYẾT ĐỊNH]
View-only share link cho MVP/Tuần 8-9. Đồng biên tập để sau launch. Lý do: giảm scope RLS, launch nhanh hơn, vault phần phức tạp nhất ra ngoài vòng đầu.

## Q9 {Q9} Phân bổ gói Pro/Ultra [CHỐT THEO ZERO, ĐÃ CẬP NHẬT]
{plan_assignment_text}

## Q7 Hạ tầng dashboard Telegram để theo dõi log [CHỐT THEO ZERO]
Sử dụng bot Telegram gửi log về channel riêng. Lý do: Zero muốn “giữ trạng thái một cách tiện lợi nhất” qua Telegram thay vì web dashboard phức tạp.

## Q6 Telegram bot spirit [CHỐT THEO ZERO]
Một cá thể riêng có tư duy đánh giá mã theo đúng chuyên môn kỹ thuật, có thể tự điều chỉnh prompt tại lúc chạy. Đây là bot “triết lý sống” như một tools đa nhiệm.

## Q8 Ngưỡng Ultra trong dashboard [CHỐT THEO ZERO]
label 199K là Ultra (chứ không phải Pro theo phân bổ cũ). Lý do:Zero yêu cầu dashboard minh bạch với mức Pro/Ultra “gần với sự thật hơn” để người dùng và bản thân dễ nắm trạng thái.

## Giao diện & API Telegram [ĐANG THỰC HIỆN]
- Đang tạo nút chuyển hướng:  `Manage`, `Link`, `Unlink`, `Add/Remove Admin`.
- Chưa kết nối Neon/Beyond Identity.
- Chưa bật nhận log server thực.

## Phụ thuộc còn đang chờ
- Zero cung cấp `NEON_DATABASE_URL`, `TG_BOT_TOKEN`, `TG_CHAT_ID`.
- Zero xác nhận chạy Telegram bot bằng `telegram-send`.

## Tổng kết gần nhất
- Master prompt Zero AI Note đã nhận.
- 3 gói được chốt với `Ultra: 199K|Pro: 99K` theo phân bổ Q9 Zero cung cấp.
- Telegram dashboard đang build lại dựa trên yêu cầu mới của Zero.
- Q2/Q3/Q4/Q5 đã được chốt trước đó, không thay đổi.