import { TemplateItem, UserProfile, NoteItem, SourceFileItem, CouponItem, AIProviderItem, PaymentRecord } from '../types';

export const initialTemplates: TemplateItem[] = [
  // ==========================================
  // FREE TIER — 3 TEMPLATES NỀN TẢNG
  // ==========================================
  {
    id: 'tmpl_cornell',
    title: 'Cornell',
    description: 'Phương pháp chia 2 cột kinh điển: Từ khóa gợi nhớ (Cues), Ghi chép chi tiết (Notes) và Đúc kết (Summary).',
    iconType: 'cornell',
    planTier: 'free',
    sampleLayout: {
      columns: ['Từ khóa / Câu hỏi (Cột trái)', 'Ghi chép chi tiết (Cột phải)', 'Tóm tắt cốt lõi (Dưới cùng)'],
      description: 'Kích hoạt phương pháp gợi nhớ chủ động (Active Recall), tối ưu cho sinh viên và người tự học.',
      previewMarkdown: `### Bố cục Cornell Note:\n| Cột Từ khóa & Gợi nhớ | Cột Ghi chép Nội dung |\n| :--- | :--- |\n| **Khái niệm cốt lõi** | Diễn giải chi tiết nội dung bài giảng |\n| **Câu hỏi tự vấn** | Ví dụ minh hoạ thực tế, số liệu dẫn chứng |\n\n---\n**📌 Tóm tắt (Summary):** Đúc kết 2-3 câu quan trọng nhất của toàn bộ bài học.`
    }
  },
  {
    id: 'tmpl_outline',
    title: 'Outline',
    description: 'Ghi chép theo cấu trúc phân cấp dàn ý I, A, 1, a, thích hợp cho tài liệu nhiều cấp độ luận điểm.',
    iconType: 'outline',
    planTier: 'free',
    sampleLayout: {
      columns: ['Chủ đề lớn (I, II)', 'Ý chính (A, B)', 'Chi tiết (1, 2, a, b)'],
      description: 'Cấu trúc cây logic rõ ràng, lý tưởng cho sách giáo trình, tài liệu học thuật và dàn ý bài viết.',
      previewMarkdown: `# I. Khái niệm và Bối cảnh\n## A. Luận điểm trọng tâm\n- 1. Dữ liệu thực nghiệm\n  - a. Báo cáo thống kê chi tiết\n- 2. Đánh giá và nhận xét sơ bộ`
    }
  },
  {
    id: 'tmpl_summary',
    title: 'Tóm tắt tổng quan',
    description: 'Trích xuất nhanh các ý chính then chốt và kết luận cốt lõi (TL;DR) chỉ trong 60 giây.',
    iconType: 'summary',
    planTier: 'free',
    sampleLayout: {
      columns: ['3 Điểm then chốt (TL;DR)', 'Chi tiết rút gọn', 'Hành động đề xuất'],
      description: 'Dành cho người bận rộn cần nắm bắt nhanh nội dung bài báo, email dài hoặc video.',
      previewMarkdown: `⚡ **TL;DR (Tóm tắt nhanh):**\n1. Luận điểm then chốt số 1\n2. Số liệu hoặc kết quả khảo sát chính\n3. Định hướng hoặc kết luận thực thi`
    }
  },

  // ==========================================
  // PRO TIER — KẾ THỪA FREE + 6 CHUYÊN SÂU (9 TỔNG)
  // ==========================================
  {
    id: 'tmpl_meeting',
    title: 'Tóm tắt cuộc họp',
    description: 'Bố cục chuyên sâu cho biên bản họp: Bối cảnh, Người tham dự, Thảo luận, Quyết định và Action Items.',
    iconType: 'meeting',
    planTier: 'pro',
    sampleLayout: {
      columns: ['Mục tiêu cuộc họp', 'Quyết định đã thống nhất', 'Action Items & Deadline'],
      description: 'Định dạng chuẩn cho quản lý dự án, ghi nhận đầy đủ người phụ trách và lộ trình cam kết.',
      previewMarkdown: `### 📋 Biên bản Cuộc họp:\n- **Mục tiêu:** Thống nhất kế hoạch triển khai Q3\n- **Quyết định:** Thông qua phương án tích hợp hệ thống mới\n- **Action Items:**\n  - [ ] @Thắng: Hoàn thiện tài liệu kiến trúc (Deadline: Thứ 6)\n  - [ ] @Team: Review API specs`
    }
  },
  {
    id: 'tmpl_lecture',
    title: 'Tóm tắt bài giảng',
    description: 'Chuyên biệt cho bài giảng dài: Khái niệm, Glossary thuật ngữ chuyên ngành và đối chiếu slide/audio.',
    iconType: 'lecture',
    planTier: 'pro',
    sampleLayout: {
      columns: ['Khái niệm trọng tâm', 'Thuật ngữ (Glossary)', 'Mốc thời gian đối chiếu'],
      description: 'Tự động tạo danh mục thuật ngữ song ngữ và liên kết các điểm nhấn trong bài giảng.',
      previewMarkdown: `### 🎓 Nội dung Bài giảng:\n- **Chương:** Giải tích vi phân & Ứng dụng\n- **Glossary:** *Gradient Descent* (Thuật toán hạ độ dốc)\n- **Timeline:** [14:20] Thầy giải thích bài toán tối ưu hóa cục bộ`
    }
  },
  {
    id: 'tmpl_analysis',
    title: 'Phân tích chi tiết',
    description: 'Mẫu phân tích đa chiều: Bối cảnh, Nguyên nhân gốc rễ, Diễn biến, Dẫn chứng định lượng và Tác động.',
    iconType: 'analysis',
    planTier: 'pro',
    sampleLayout: {
      columns: ['Nguyên nhân gốc rễ (Root Cause)', 'Dữ liệu minh chứng', 'Dự báo tác động'],
      description: 'Phục vụ báo cáo chuyên môn, nghiên cứu tình huống (case study) và đánh giá thị trường.',
      previewMarkdown: `### 🔍 Báo cáo Phân tích Chi tiết:\n1. **Bối cảnh:** Biến động thị trường công nghệ tài chính\n2. **Nguyên nhân:** Lãi suất tăng và chi phí vốn mở rộng\n3. **Dữ liệu:** Tăng trưởng chậm lại 8.5% so với cùng kỳ\n4. **Đánh giá rủi ro:** Khả năng thanh khoản giảm`
    }
  },
  {
    id: 'tmpl_qa',
    title: 'Q&A (Hỏi - Đáp)',
    description: 'Tự động biên soạn bộ câu hỏi và câu trả lời ôn tập phục vụ thi cử hoặc phỏng vấn tuyển dụng.',
    iconType: 'qa',
    planTier: 'pro',
    sampleLayout: {
      columns: ['Câu hỏi nghi vấn (?)', 'Câu trả lời chi tiết (✓)', 'Ghi chú mở rộng'],
      description: 'Biến tài liệu phức tạp thành các câu hỏi phản biện để luyện tập vấn đáp tự tin.',
      previewMarkdown: `### ❓ Bộ Câu hỏi Ôn tập:\n**Q1:** Sự khác biệt cốt lõi giữa A và B là gì?\n**A1:** A tập trung vào cơ chế mở rộng, trong khi B tối ưu cho hiệu năng nội bộ.\n\n**Q2:** Trường hợp nào nên áp dụng mô hình này?\n**A2:** Khi hệ thống yêu cầu độ khả dụng cao trên 99.9%.`
    }
  },
  {
    id: 'tmpl_charting',
    title: 'Charting Method',
    description: 'Phương pháp bảng ma trận so sánh đa chiều: Phân loại đối tượng, tính năng và tiêu chí đối đầu.',
    iconType: 'charting',
    planTier: 'pro',
    sampleLayout: {
      columns: ['Đối tượng so sánh', 'Tiêu chí đánh giá', 'Ưu / Nhược điểm'],
      description: 'Bố cục dạng bảng trực quan, giúp dễ dàng nhận diện điểm mạnh yếu giữa các phương án.',
      previewMarkdown: `| Tiêu chí | Giải pháp A | Giải pháp B |\n| :--- | :--- | :--- |\n| **Hiệu năng** | Cao (O(log n)) | Trung bình (O(n)) |\n| **Chi phí** | Thấp | Cao |\n| **Độ phức tạp** | Dễ bảo trì | Phức tạp |`
    }
  },
  {
    id: 'tmpl_boxing',
    title: 'Boxing Method',
    description: 'Khối Bento Box kiến thức độc lập: Khái niệm, Nguyên lý, Ví dụ thực tế và Cạm bẫy cần tránh.',
    iconType: 'boxing',
    planTier: 'pro',
    sampleLayout: {
      columns: ['Box 1: Khái niệm', 'Box 2: Nguyên lý', 'Box 3: Ví dụ', 'Box 4: Cạm bẫy'],
      description: 'Chia nhỏ kiến thức thành các ô đóng gói trực quan, ngăn chặn tình trạng quá tải thông tin.',
      previewMarkdown: `📦 **BOX 1 — Định nghĩa:** Khái niệm cơ sở...\n📦 **BOX 2 — Cơ chế:** Các bước vận hành từ A -> B -> C\n📦 **BOX 3 — Case Study:** Ứng dụng tại doanh nghiệp thực tế\n⚠️ **BOX 4 — Lưu ý:** 3 sai lầm thường gặp khi áp dụng`
    }
  },

  // ==========================================
  // ULTRA TIER — KẾ THỪA PRO + 8 CHUYÊN GIA (17 TỔNG)
  // ==========================================
  {
    id: 'tmpl_allinone',
    title: 'Take Note tổng hợp (All-in-One)',
    description: 'Bản ghi chú siêu cấp kết hợp đồng thời Cornell + Outline + Tóm tắt điều hành cho các dự án phức tạp.',
    iconType: 'allinone',
    planTier: 'ultra',
    sampleLayout: {
      columns: ['Cornell Cues', 'Phân cấp Outline', 'Ma trận hành động'],
      description: 'Đầy đủ mọi góc nhìn từ khái quát đến chi tiết, phù hợp cho đề án môn học và báo cáo cấp cao.',
      previewMarkdown: `# 🌟 Báo cáo Nghiên cứu Tổng hợp\n## 1. Tóm tắt Điều hành (Executive Summary)\n...\n## 2. Bố cục Cornell & Phân tích Chi tiết\n...\n## 3. Lộ trình Hành động & KPI Đo lường`
    }
  },
  {
    id: 'tmpl_mindmap',
    title: 'Mindmap',
    description: 'Sơ đồ tư duy phân nhánh logic trực quan từ chủ đề trung tâm sang các nhánh ý tưởng phụ.',
    iconType: 'mindmap',
    planTier: 'ultra',
    sampleLayout: {
      columns: ['Chủ đề trung tâm', 'Nhánh cấp 1 (Key Themes)', 'Nhánh cấp 2 (Sub-branches)'],
      description: 'Tái hiện luồng suy nghĩ dạng mạng lưới neuron, kích thích tư duy sáng tạo và liên kết tri thức.',
      previewMarkdown: `🧠 **MINDMAP ARCHITECTURE:**\n[Chủ đề cốt lõi]\n ├── 🌿 Nhánh 1: Cơ sở lý thuyết\n │    ├── Định lý nền tảng\n │    └── Giả định biên\n └── 🌿 Nhánh 2: Ứng dụng thực tế\n      ├── Triển khai hệ thống\n      └── Kiểm thử thực nghiệm`
    }
  },
  {
    id: 'tmpl_flashcard',
    title: 'Flashcard thông minh',
    description: 'Bộ thẻ ghi nhớ 2 mặt (Front / Back) có phân loại độ khó, tối ưu cho ôn thi chuyên ngành cấp tốc.',
    iconType: 'flashcard',
    planTier: 'ultra',
    sampleLayout: {
      columns: ['Mặt trước: Câu hỏi / Thuật ngữ', 'Mặt sau: Định nghĩa / Đáp án', 'Mức độ khó'],
      description: 'Hỗ trợ tính năng lật thẻ tương tác ngay trên Web và xuất bộ thẻ học tập.',
      previewMarkdown: `🎴 **Thẻ #1 (Độ khó: ⭐⭐⭐):**\n- [Mặt trước]: Định lý Giới hạn Trung tâm (CLT) là gì?\n- [Mặt sau]: Tổng của một số lượng lớn các biến ngẫu nhiên độc lập sẽ có phân phối tiệm cận chuẩn.`
    }
  },
  {
    id: 'tmpl_deep_research',
    title: 'Phân tích chuyên sâu',
    description: 'Khung nghiên cứu học thuật chuẩn mực: Tổng quan tài liệu, Phương pháp luận, Đối sánh dữ liệu và Khuyến nghị.',
    iconType: 'deep-research',
    planTier: 'ultra',
    sampleLayout: {
      columns: ['Phương pháp luận', 'Đối sánh thực nghiệm', 'Khoảng trống tri thức'],
      description: 'Định dạng học thuật khắt khe dành cho nghiên cứu sinh, giảng viên và chuyên gia phân tích.',
      previewMarkdown: `### 🔬 Phân tích Chuyên sâu (Deep Academic Research):\n- **Giả thuyết nghiên cứu:** H1 & H2\n- **Phương pháp luận:** Định lượng qua hồi quy dữ liệu bảng\n- **Kết quả:** P-value < 0.01 khẳng định giả thuyết\n- **Hạn chế đề tài:** Cỡ mẫu giới hạn trong giai đoạn 2020-2025`
    }
  },
  {
    id: 'tmpl_feynman',
    title: 'Feynman Technique',
    description: 'Phương pháp Feynman 4 tầng: Giải thích bình dân → Ẩn dụ đời sống → Chuẩn hóa học thuật → Vá lỗ hổng tri thức.',
    iconType: 'feynman',
    planTier: 'ultra',
    sampleLayout: {
      columns: ['Tầng 1: Bình dân 10 tuổi', 'Tầng 2: Ẩn dụ thực tế', 'Tầng 3: Chuẩn học thuật', 'Tầng 4: Lỗ hổng cần vá'],
      description: 'Kiểm tra độ hiểu sâu thực sự của bạn bằng cách diễn giải khái niệm phức tạp một cách đơn giản nhất.',
      previewMarkdown: `💡 **FEYNMAN BREAKDOWN:**\n👶 **Tầng 1 (Giải thích cho bé 10 tuổi):** Hãy tưởng tượng bộ nhớ máy tính giống như ngăn kéo tủ...\n🧩 **Tầng 2 (Ẩn dụ đời sống):** Giống như cách người đầu bếp sắp xếp gia vị trên bàn...\n📚 **Tầng 3 (Thuật ngữ chính xác):** Cơ chế Caching L1/L2 với độ trễ bus 3ns...\n🔧 **Tầng 4 (Điểm còn mơ hồ):** Cần làm rõ chính sách ghi đè (Write-back vs Write-through).`
    }
  },
  {
    id: 'tmpl_first_principles',
    title: 'First Principles Breakdown',
    description: 'Tư duy từ nguyên lý đầu tiên (First Principles): Bóc tách giả định, giữ lại sự thật cốt lõi và tái tạo từ số 0.',
    iconType: 'first-principles',
    planTier: 'ultra',
    sampleLayout: {
      columns: ['Giả định thông thường (Assumptions)', 'Sự thật bất biến (Fundamental Truths)', 'Giải pháp đột phá mới'],
      description: 'Phong cách tư duy của các nhà phát minh lỗi lạc (Elon Musk, Aristotle) để giải quyết bài toán hóc búa.',
      previewMarkdown: `🧱 **FIRST PRINCIPLES ANALYSIS:**\n❌ **Giả định thông thường:** Chi phí phát triển phần mềm này luôn đắt đỏ vì cần đội ngũ 20 người.\n✅ **Sự thật vật lý:** Phần việc thực chất chỉ gồm 4 pipeline xử lý I/O cơ bản.\n🚀 **Tái cấu trúc từ số 0:** Tự động hóa qua Serverless + AI Orchestration, giảm 85% chi phí vận hành.`
    }
  },
  {
    id: 'tmpl_syntopical',
    title: 'Syntopical Matrix',
    description: 'Phân tích tổng hợp đa tài liệu: Nhận diện từ khóa chung, điểm đồng thuận, luận điểm tranh cãi và khoảng trống.',
    iconType: 'syntopical',
    planTier: 'ultra',
    sampleLayout: {
      columns: ['Khái niệm giao thoa', 'Điểm đồng thuận', 'Luận điểm tranh cãi', 'Khoảng trống tri thức'],
      description: 'Đọc và tổng hợp đồng thời nhiều nguồn sách/bài báo để xây dựng bức tranh toàn cảnh khách quan.',
      previewMarkdown: `📊 **SYNTOPICAL COMPARATIVE MATRIX:**\n- **Chủ đề chung:** Trí tuệ nhân tạo và Tác động đến Thị trường Lao động\n- **Đồng thuận giữa Tác giả A & B:** Tự động hóa công việc lặp đi lặp lại\n- **Tranh cãi:** Tác giả A dự báo tạo thêm việc làm mới, Tác giả B cảnh báo sa thải hàng loạt\n- **Khoảng trống:** Chưa có nghiên cứu sâu tại các nước đang phát triển`
    }
  },
  {
    id: 'tmpl_5w1h_action',
    title: '5W1H & Actionable Matrix',
    description: 'Khung 5W1H (Who, What, When, Where, Why, How), ma trận đánh giá rủi ro và lộ trình hành động có KPI.',
    iconType: '5w1h-action',
    planTier: 'ultra',
    sampleLayout: {
      columns: ['Khung 5W1H', 'Ma trận rủi ro (Risk Matrix)', 'Lộ trình hành động (Action Plan & KPI)'],
      description: 'Biến mọi lý thuyết thành kế hoạch thực thi cụ thể, có thể đo lường và theo dõi tiến độ chính xác.',
      previewMarkdown: `🎯 **5W1H & ACTIONABLE MATRIX:**\n- **Who / What / Why:** Đội ngũ Core ra mắt tính năng Multi-Export để phục vụ người dùng nghiên cứu chuyên sâu.\n- **When / Where:** Triển khai trực tiếp trên Production trong tuần này.\n- **How & KPI:** Đo lường tỷ lệ tải file thành công đạt 99.9%, thời gian phản hồi < 800ms.`
    }
  }
];

// ============================================================
// EMPTY STATES (for type safety)
// ============================================================

export const initialUserProfile: UserProfile = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  role: 'user',
  plan: 'free',
  nextBillingDate: undefined,
  appliedCoupon: undefined
};

export const initialNotes: NoteItem[] = [];
export const initialArchivedNotes: NoteItem[] = [];
export const initialSourceFiles: SourceFileItem[] = [];
export const initialCoupons: CouponItem[] = [];
export const initialAIProviders: AIProviderItem[] = [];
export const initialPaymentRecords: PaymentRecord[] = [];