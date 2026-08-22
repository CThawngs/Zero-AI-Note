/**
 * E2E test hierarchical summarization trên production — N sources thật.
 * Gửi 3 nguồn dài (text type) vượt ngưỡng 24k chars → kỳ vọng hierarchical path.
 */
const BASE = 'https://zero-ai-note.vercel.app/api/notes/generate';

const longDoc1 = `Báo cáo tài chính Q3 2026 của công ty SaaS Alpha:
- Doanh thu quý 3 đạt 12.5 tỷ VND, tăng 40% so với cùng kỳ năm ngoái.
- Chi phí CAC (Customer Acquisition Cost) trung bình là 20 USD/khách hàng mới.
- Tỷ lệ giữ chân khách hàng (retention) đạt 85% sau 12 tháng.
- Biên lợi nhuận gộp 72%, cải thiện 5 điểm phần trăm nhờ tối ưu hạ tầng cloud.
- Kế hoạch Q4: mở rộng sang thị trường Đông Nam Á, mục tiêu 500 khách hàng mới.
- Đội ngũ bán hàng tăng từ 12 lên 20 người.
- Chi phí marketing chiếm 28% doanh thu, giảm từ mức 35% của Q1.
- Nợ phải trả giảm còn 2.1 tỷ VND.
- Dự báo doanh thu cả năm vượt 45 tỷ VND.`.repeat(20);

const longDoc2 = `Slide thuyết trình hội đồng quản trị — Đánh giá hiệu quả marketing:
- Chi phí CAC hiện tại chỉ còn 15 USD nhờ tối ưu phễu chuyển đổi.
- Doanh thu Q3 ghi nhận 9.8 tỷ VND (chưa tính doanh thu deferred).
- Tỷ lệ churn giảm còn 12%/tháng, tốt nhất từ trước đến nay.
- ROI kênh Google Ads đạt 340%, kênh Facebook chỉ đạt 120%.
- Đề xuất tái phân bổ 30% ngân sách marketing sang kênh content organic.
- Chiến dịch remarketing có conversion rate 4.2%, cao gấp đôi industry average.
- Khách hàng enterprise chiếm 35% doanh thu dù chỉ là 8% số khách.`.repeat(20);

const longDoc3 = `Nghiên cứu thị trường SaaS Đông Nam Á 2026:
- Quy mô thị trường SaaS khu vực đạt 8.4 tỷ USD, tăng trưởng CAGR 24%.
- Việt Nam đứng thứ 3 về tốc độ tăng trưởng sau Indonesia và Thái Lan.
- Chi phí CAC trung bình ngành tại Đông Nam Á dao động 18-25 USD.
- 62% doanh nghiệp SME dự định tăng ngân sách SaaS trong 12 tháng tới.
- Rào cản lớn nhất: thanh toán (45% user không có thẻ quốc tế) và ngôn ngữ.
- Localisation tăng conversion rate trung bình 38%.
- Đối thủ chính: các nền tảng bản địa hóa giá rẻ, cạnh tranh về giá -30%.`.repeat(20);

const body = {
  prompt: 'Tạo note cornell tổng hợp phân tích tài chính và thị trường từ 3 nguồn đính kèm. Nếu có số liệu mâu thuẫn giữa các nguồn hãy trình bày trung lập cả các phía.',
  method: 'cornell',
  language: 'vi',
  sources: [
    { type: 'text', name: 'Báo cáo tài chính Q3 — Alpha', content: longDoc1 },
    { type: 'text', name: 'Slide HĐQT — Đánh giá marketing', content: longDoc2 },
    { type: 'text', name: 'Nghiên cứu thị trường SEA 2026', content: longDoc3 },
  ],
};

console.log('total chars:', longDoc1.length + longDoc2.length + longDoc3.length);
const res = await fetch(BASE, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const data = await res.json();
console.log('HTTP', res.status);
console.log('reply:', (data.replyText || '').substring(0, 200));
if (data.note) {
  console.log('note title:', data.note.title);
  const cs = JSON.stringify(data.note);
  // Bằng chứng hierarchical: note nhắc cả 3 nguồn + conflict trung lập
  console.log('mentions CAC 20:', cs.includes('20'));
  console.log('mentions CAC 15:', cs.includes('15'));
  console.log('conflict-neutral wording:', /mâu thuẫn|khác nhau|tùy nguồn|theo (báo cáo|slide)|trung lập/i.test(cs));
}
