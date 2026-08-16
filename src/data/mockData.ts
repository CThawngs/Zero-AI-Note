import { 
  NoteItem, 
  TemplateItem, 
  SourceFileItem, 
  CouponItem, 
  AIProviderItem, 
  PaymentRecord, 
  UserProfile 
} from '../types';

// ============================================================
// TEMPLATES (keep for UI)
// ============================================================

export const initialTemplates: TemplateItem[] = [
  {
    id: 'tmpl_cornell',
    title: 'Cornell',
    description: 'Phương pháp ghi chép chia 2 cột kinh điển, tối ưu cho việc ôn tập và ghi nhớ.',
    iconType: 'cornell',
    sampleLayout: {
      columns: ['Từ khóa / Câu hỏi (Cột trái)', 'Ghi chép chi tiết (Cột phải)', 'Tóm tắt (Dưới cùng)'],
      description: 'Phân tách rõ ràng giữa ý tưởng cốt lõi và nội dung diễn giải giúp kích hoạt trí nhớ chủ động (Active Recall).',
      previewMarkdown: `### Bố cục Cornell Note:\n| Cột Câu hỏi & Từ khóa | Cột Ghi chép Nội dung |\n| :--- | :--- |\n| **Từ khóa chính** | Diễn giải chi tiết ý tưởng |\n| **Câu hỏi ôn tập** | Công thức, ví dụ minh hoạ |\n\n---\n**Tóm tắt cốt lõi:** Đúc kết 2-3 câu quan trọng nhất.`
    }
  },
  {
    id: 'tmpl_outline',
    title: 'Outline',
    description: 'Ghi chép theo cấu trúc phân cấp, thích hợp cho bài giảng nhiều ý chính và phụ.',
    iconType: 'outline',
    sampleLayout: {
      columns: ['Chủ đề lớn (I, II)', 'Ý chính (A, B)', 'Chi tiết (1, 2, a, b)'],
      description: 'Cấu trúc cây phân cấp rõ ràng, lý tưởng cho sách giáo trình và tài liệu nghiên cứu chuyên sâu.',
      previewMarkdown: `# I. Tiêu đề lớn\n## A. Luận điểm 1\n- 1. Dẫn chứng và dữ liệu\n  - a. Chi tiết thống kê\n- 2. Kết luận bộ phận`
    }
  },
  {
    id: 'tmpl_qa',
    title: 'Q&A',
    description: 'Chuyển đổi bài học thành định dạng Hỏi - Đáp để kiểm tra kiến thức.',
    iconType: 'qa',
    sampleLayout: {
      columns: ['Câu hỏi nghi vấn (?)', 'Câu trả lời đầy đủ (✓)', 'Ghi chú mở rộng'],
      description: 'Mô phỏng bài thi hoặc buổi phỏng vấn vấn đáp, tự động trắc nghiệm năng lực ghi nhớ.',
      previewMarkdown: `### Hệ thống Hỏi - Đáp:\n**Q1:** Khái niệm cốt lõi là gì?\n**A1:** Khái niệm này được định nghĩa bởi...\n\n**Q2:** Sự khác nhau giữa A và B là gì?\n**A2:** A tập trung vào..., trong khi B tối ưu cho...`
    }
  },
  {
    id: 'tmpl_flashcard',
    title: 'Flashcard',
    description: 'Chuyển ghi chú thành bộ thẻ ghi nhớ thông minh với hai mặt câu hỏi và đáp án.',
    iconType: 'flashcard',
    sampleLayout: {
      columns: ['Mặt trước (Front)', 'Mặt sau (Back)', 'Độ khó (Easy/Medium/Hard)'],
      description: 'Tối ưu cho ôn tập từ vựng, thuật ngữ y khoa, luật pháp, công thức toán lý hóa.',
      previewMarkdown: `🎴 **Thẻ #1:**\n- [Mặt trước]: Định luật 1 Newton là gì?\n- [Mặt sau]: Định luật quán tính: Vật giữ nguyên trạng thái nếu không có ngoại lực tác dụng.`
    }
  },
  {
    id: 'tmpl_quick_summary',
    title: 'Tóm tắt nhanh',
    description: 'Phiên bản cô đọng nhất của nội dung chính, đọc hiểu chỉ trong 60 giây.',
    iconType: 'zap',
    sampleLayout: {
      columns: ['3 Điểm chính (TL;DR)', 'Hành động cần làm', 'Trích dẫn đắt giá'],
      description: 'Dành cho người bận rộn cần nắm bắt nội dung cuộc họp hoặc bài báo khoa học trong tích tắc.',
      previewMarkdown: `⚡ **TL;DR:**\n1. Doanh thu tăng trưởng 25%\n2. Chi phí tiếp thị giảm 12%\n3. Kế hoạch ra mắt sản phẩm mới vào tháng 11`
    }
  },
  {
    id: 'tmpl_executive',
    title: 'Tóm tắt điều hành',
    description: 'Bản tóm tắt chuyên sâu cho báo cáo và dự án dành cho cấp quản lý ra quyết định.',
    iconType: 'executive',
    sampleLayout: {
      columns: ['Bối cảnh dự án', 'Phân tích định lượng', 'Khuyến nghị chiến lược'],
      description: 'Định dạng chuẩn cho C-level và nhà đầu tư, kết hợp biểu đồ và bảng dữ liệu tài chính.',
      previewMarkdown: `## Executive Summary\n- **Vấn đề:** Khách hàng rời bỏ dịch vụ tăng 5%\n- **Nguyên nhân cốt lõi:** Thời gian phản hồi hỗ trợ chậm\n- **Giải pháp đề xuất:** Triển khai AI Chatbot tự động phản hồi 24/7`
    }
  },
  {
    id: 'tmpl_math',
    title: 'Ghi chú Toán học',
    description: 'Mẫu chuyên biệt cho công thức LaTeX, chứng minh định lý và vẽ đồ thị hàm số.',
    iconType: 'math',
    isCustom: true,
    sampleLayout: {
      columns: ['Định lý & Giả thiết', 'Chứng minh đại số (LaTeX)', 'Ý nghĩa hình học'],
      description: 'Tích hợp cú pháp KaTeX/LaTeX chuẩn và các bước suy luận logic toán học.',
      previewMarkdown: `### Định lý Pytago:\n$$a^2 + b^2 = c^2$$\n*Chứng minh:* Xét tam giác vuông có hai cạnh góc vuông $a, b$ và cạnh huyền $c$...`
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