import { 
  NoteItem, 
  TemplateItem, 
  SourceFileItem, 
  CouponItem, 
  AIProviderItem, 
  PaymentRecord, 
  UserProfile 
} from '../types';

export const initialUserProfile: UserProfile = {
  id: 'usr_001',
  name: 'Zero User',
  email: 'user@example.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  plan: 'PRO',
  nextBillingDate: '20/12/2026',
  appliedCoupon: {
    code: 'SAVE50',
    discountPercent: 50,
  }
};

export const initialNotes: NoteItem[] = [
  {
    id: 'note_macro_econ',
    title: 'Kinh tế vĩ mô - Chương 1',
    summary: 'Kinh tế học vĩ mô nghiên cứu các chỉ số tổng hợp như GDP, tỷ lệ thất nghiệp, và chỉ số giá để hiểu cách nền kinh tế hoạt động như một tổng thể.',
    method: 'cornell',
    category: 'Khoa học',
    date: '12/10/2023',
    updatedAt: 'Hôm nay, 14:30',
    sources: [
      { type: 'pdf', name: 'Macroeconomics_Ch1.pdf', size: '2.4 MB' },
      { type: 'youtube', name: 'Kinh tế vĩ mô cơ bản (Youtube)', url: 'https://youtube.com/watch?v=mock' },
      { type: 'doc', name: 'Ghi chép bài giảng.docx', size: '1.1 MB' }
    ],
    keywords: ['GDP', 'Lạm phát', 'Chính sách tiền tệ', 'Tổng cầu (AD)', 'Chỉ số CPI'],
    coreQuestions: [
      'Làm thế nào để đo lường sức khỏe nền kinh tế qua GDP?',
      'Sự khác biệt giữa GDP danh nghĩa và GDP thực tế là gì?',
      'Nguyên nhân nào dẫn đến lạm phát cầu kéo?'
    ],
    content: {
      overview: 'Kinh tế học vĩ mô nghiên cứu các chỉ số tổng hợp như GDP, tỷ lệ thất nghiệp, và chỉ số giá để hiểu cách nền kinh tế hoạt động như một tổng thể. Nó tập trung vào sự lựa chọn của các quốc gia và chính phủ.',
      sections: [
        {
          title: '1. Tổng Sản phẩm Quốc nội (GDP)',
          definition: 'GDP là giá trị thị trường của tất cả các hàng hóa và dịch vụ cuối cùng được sản xuất ra trong phạm vi một lãnh thổ quốc gia trong một thời kỳ nhất định (thường là một năm).',
          text: 'Điểm khác biệt căn bản nằm ở việc chỉ tính các hàng hóa và dịch vụ cuối cùng, loại bỏ hoàn toàn các giao dịch trung gian nhằm tránh tính trùng giá trị. Công thức tính tổng quát theo phương pháp chi tiêu: GDP = C + I + G + (X - M).',
          lowConfidenceSnippet: 'Dữ liệu điều chỉnh theo mùa có thể dao động tùy thuộc vào phương pháp nội suy thống kê quốc gia.',
          lowConfidenceReason: 'Dữ liệu cần xác minh thêm từ báo cáo Tổng cục Thống kê',
          tableData: {
            headers: ['Năm', 'GDP Danh nghĩa (Tỷ USD)', 'Tốc độ tăng trưởng (%)'],
            rows: [
              ['2021', '366.1', '+2.58%'],
              ['2022', '409.0', '+8.02%'],
              ['2023', '430.0', '+5.05%'],
            ]
          },
          bulletPoints: [
            'Rổ hàng hóa (CPI): Dựa trên một rổ hàng hóa cố định được mua bởi người tiêu dùng điển hình. Có thể bao gồm hàng nhập khẩu.',
            'GDP Deflator (Chỉ số giảm phát): Dựa trên tất cả các hàng hóa/dịch vụ được sản xuất trong nước. Rổ hàng thay đổi theo từng năm.',
            'Hàng nhập khẩu: Giá dầu thế giới tăng sẽ phản ánh ngay vào CPI nhưng không ảnh hưởng trực tiếp đến GDP Deflator của nước nhập khẩu dầu.'
          ]
        },
        {
          title: '2. Phân loại nguyên nhân lạm phát',
          text: 'Lạm phát thường bắt nguồn từ hai cơ chế chính: Demand-pull (Cầu kéo) và Cost-push (Chi phí đẩy).',
          bulletPoints: [
            'Demand-pull inflation (Lạm phát do cầu kéo): Xảy ra khi tổng cầu vượt quá khả năng sản xuất của nền kinh tế. Thường xuất hiện trong giai đoạn kinh tế tăng trưởng nóng.',
            'Cost-push inflation (Lạm phát do chi phí đẩy): Chi phí sản xuất tăng cao (giá nguyên nhiên vật liệu, tiền lương) đẩy giá bán tăng lên ngay cả khi sản lượng giảm.'
          ]
        }
      ],
      summaryText: 'GDP và CPI là hai thước đo cốt lõi giúp các nhà hoạch định chính sách tiền tệ (Ngân hàng Trung ương) điều chỉnh lãi suất tái chiết khấu và lượng cung tiền trong lưu thông.'
    },
    rawMarkdown: `# Kinh tế vĩ mô - Chương 1

## Tổng quan về Kinh tế vĩ mô
Kinh tế học vĩ mô nghiên cứu các chỉ số tổng hợp như GDP, tỷ lệ thất nghiệp, và chỉ số giá để hiểu cách nền kinh tế hoạt động như một tổng thể.

### 1. Tổng Sản phẩm Quốc nội (GDP)
> **Định nghĩa:** GDP là giá trị thị trường của tất cả các hàng hóa và dịch vụ cuối cùng được sản xuất ra trong phạm vi một lãnh thổ quốc gia trong một thời kỳ nhất định (thường là một năm).

| Năm | GDP Danh nghĩa (Tỷ USD) | Tốc độ tăng trưởng (%) |
| :--- | :--- | :--- |
| 2021 | 366.1 | +2.58% |
| 2022 | 409.0 | +8.02% |
| 2023 | 430.0 | +5.05% |

#### Phân tích chi tiết:
- **Rổ hàng hóa:** Dựa trên một rổ hàng hóa cố định được mua bởi người tiêu dùng.
- **GDP Deflator:** Dựa trên tất cả hàng hóa/dịch vụ sản xuất nội địa.
- **Hàng nhập khẩu:** Tác động trực tiếp đến CPI nhưng không tính trong GDP Deflator.

### 2. Phân loại nguyên nhân lạm phát:
1. **Demand-pull inflation (Cầu kéo):** Tổng cầu vượt quá năng lực sản xuất.
2. **Cost-push inflation (Chi phí đẩy):** Giá nguyên vật liệu đầu vào gia tăng đột ngột.`
  },
  {
    id: 'note_quantum',
    title: 'Tóm tắt: Cơ học lượng tử cơ bản',
    summary: 'Ghi chú từ bài giảng tuần 4 về nguyên lý bất định Heisenberg và phương trình Schrödinger. Cần ôn lại phần ứng dụng thực tế...',
    method: 'cornell',
    category: 'Khoa học',
    date: 'Hôm nay, 14:30',
    updatedAt: 'Hôm nay, 14:30',
    sources: [
      { type: 'pdf', name: 'Quantum_Physics_Lec4.pdf', size: '3.8 MB' },
      { type: 'youtube', name: 'Schrodinger Equation Explained', url: 'https://youtube.com/watch?v=mock' }
    ],
    keywords: ['Qubits', 'Superposition', 'Entanglement', 'Quantum Decoherence'],
    coreQuestions: [
      'Tại sao hạt lượng tử có thể ở nhiều trạng thái cùng lúc?',
      'Nguyên lý bất định Heisenberg giới hạn điều gì?'
    ],
    content: {
      overview: 'Ghi chú theo phương pháp Cornell - Trích xuất từ nguồn: Nature Journal & MIT Quantum OpenCourseWare.',
      sections: [
        {
          title: 'Nguyên lý chồng chập & Rối lượng tử',
          definition: 'Chồng chập (Superposition) cho phép qubit tồn tại đồng thời ở cả trạng thái |0⟩ và |1⟩ cho tới khi được đo đạc.',
          text: 'Sự khác biệt căn bản giữa máy tính cổ điển và máy tính lượng tử là khả năng xử lý song song nhờ hiện tượng chồng chập lượng tử. Các giao thức sửa lỗi (Quantum Error Correction) hiện là nút thắt chính để mở rộng lên quy mô hơn 1,000 qubit ổn định.',
          lowConfidenceSnippet: 'Giao thức sửa lỗi mã Surface Code yêu cầu tỷ lệ lỗi vật lý dưới 1% cho mỗi cổng lượng tử logic.',
          lowConfidenceReason: 'Cần cập nhật các nghiên cứu mới nhất năm 2025 từ IBM Quantum.'
        }
      ],
      summaryText: 'Điện toán lượng tử đang chuyển dịch từ mô hình lý thuyết sang kỷ nguyên NISQ (Noisy Intermediate-Scale Quantum), tập trung vào tối ưu hóa thuật toán VQE và QAOA.'
    },
    rawMarkdown: `# Tóm tắt: Cơ học lượng tử cơ bản\n\n## Nguyên lý chồng chập\nQubit có khả năng tồn tại ở cả 2 trạng thái |0⟩ và |1⟩ đồng thời cho đến khi có quan sát đo lường.`
  },
  {
    id: 'note_market_research',
    title: 'Nghiên cứu Thị trường Q3 & Phân tích Đối thủ',
    summary: 'Tổng hợp dữ liệu từ các báo cáo ngành, phỏng vấn người dùng và số liệu phân tích web trong quý vừa qua.',
    method: 'outline',
    category: 'Dự án Alpha',
    date: 'Hôm qua',
    updatedAt: 'Hôm qua',
    sources: [
      { type: 'doc', name: 'Report_Final_Q3.pdf', size: '4.2 MB' },
      { type: 'audio', name: 'Phỏng vấn KH_01.mp3', size: '15.4 MB' },
      { type: 'pdf', name: 'Competitor_Matrix.pdf', size: '1.8 MB' },
      { type: 'image', name: 'User_Journey_Map.png', size: '820 KB' }
    ],
    keywords: ['Thị phần Q3', 'NPS Score', 'Retention Rate', 'CAC/LTV'],
    coreQuestions: [
      'Chiến lược giá của đối thủ đang đe dọa phân khúc nào?',
      'Tỷ lệ chuyển đổi sau bản cập nhật v2.4 thay đổi ra sao?'
    ],
    content: {
      overview: 'Báo cáo hợp nhất dữ liệu đa kênh từ 4 tệp nguồn: phân tích đối thủ cạnh tranh trực tiếp và phản hồi từ 50 khách hàng doanh nghiệp.',
      sections: [
        {
          title: '1. Động lực tăng trưởng thị trường',
          text: 'Nhu cầu chuyển đổi số AI tăng 140% so với cùng kỳ năm ngoái. Khách hàng sẵn sàng chi trả cho các giải pháp tiết kiệm thời gian ghi chép và tổng hợp dữ liệu cuộc họp.'
        }
      ],
      summaryText: 'Cần tập trung vào tính năng tóm tắt âm thanh tức thì và bảo mật dữ liệu cấp doanh nghiệp để bứt phá trong Q4.'
    },
    rawMarkdown: `# Nghiên cứu Thị trường Q3\n\n- Tăng trưởng AI tổng hợp: +140%\n- Đối thủ chính: Giảm giá 20% gói năm\n- Hành động: Ra mắt tính năng tích hợp BYOK`
  },
  {
    id: 'note_self_dev',
    title: 'Ý tưởng phát triển bản thân 2024',
    summary: 'Làm sao để quản lý thời gian hiệu quả và duy trì năng lượng làm việc liên tục suốt 12 tiếng mỗi ngày?',
    method: 'qa',
    category: 'Cá nhân',
    date: 'T2, 10 Thg 10',
    updatedAt: '10/10/2023',
    sources: [
      { type: 'doc', name: 'Atomic_Habits_Notes.docx', size: '540 KB' }
    ],
    keywords: ['Time Blocking', 'Deep Work', 'Pomodoro', 'Dopamine Detox'],
    coreQuestions: [
      'Làm thế nào để duy trì thói quen thức dậy lúc 5:30 sáng?',
      'Cách ngăn chặn sao nhãng từ mạng xã hội trong giờ làm việc?'
    ],
    content: {
      overview: 'Hệ thống câu hỏi và câu trả lời tự phản chiếu dựa trên phương pháp Atomic Habits và Deep Work.',
      sections: [
        {
          title: 'Hỏi & Đáp Quản trị Năng lượng',
          text: 'Q: Tại sao tôi luôn cảm thấy kiệt sức vào lúc 3 giờ chiều?\nA: Do lượng đường huyết hạ đột ngột sau bữa trưa nhiều carbohydrate và thiếu nước. Hãy chuyển sang bữa trưa giàu protein và đi bộ 10 phút.'
        }
      ],
      summaryText: 'Tập trung vào hệ thống thay vì mục tiêu. Tối ưu hóa 1% mỗi ngày.'
    },
    rawMarkdown: `# Ý tưởng phát triển bản thân 2024\n\n## Q&A\n**Hỏi:** Làm sao để quản lý thời gian?\n**Đáp:** Áp dụng kỹ thuật Time-blocking và chia nhỏ công việc thành các phiên 45 phút.`
  },
  {
    id: 'note_podcast_english',
    title: 'Podcast Tiếng Anh - Tập 42',
    summary: 'Phân tích từ vựng nâng cao, thành ngữ thương mại và cách diễn đạt tự nhiên trong môi trường làm việc toàn cầu (Thời lượng 14:20).',
    method: 'outline',
    category: 'Học ngôn ngữ',
    date: '05 Thg 10',
    updatedAt: '05/10/2023',
    sources: [
      { type: 'audio', name: 'Business_Podcast_Ep42.mp3', size: '18.5 MB' }
    ],
    keywords: ['Idioms', 'Business Negotiation', 'Cross-cultural', 'C1 Vocabulary'],
    coreQuestions: [
      'Các cụm từ dùng để lịch sự từ chối đề xuất trong đàm phán là gì?'
    ],
    content: {
      overview: 'Trích xuất tự động từ file âm thanh podcast 14 phút 20 giây.',
      sections: [
        {
          title: 'Từ vựng & Mẫu câu trọng tâm',
          text: '1. "Touch base" = Liên lạc lại để cập nhật tình hình.\n2. "Circle back" = Thảo luận lại vấn đề vào thời điểm thích hợp hơn.\n3. "Move the needle" = Tạo ra sự thay đổi đáng kể.'
        }
      ],
      summaryText: 'Tập trung vào ngữ điệu nhấn mạnh và từ nối trang trọng khi giao tiếp với đối tác nước ngoài.'
    },
    rawMarkdown: `# Podcast Tiếng Anh - Tập 42\n\n- **Thời lượng:** 14:20\n- **Chủ đề:** Đàm phán kinh doanh quốc tế\n- **Idioms:** Touch base, Move the needle, Low-hanging fruit`
  },
  {
    id: 'note_ml_basics',
    title: 'Machine Learning Basics',
    summary: 'Tổng quan về Supervised Learning, Unsupervised Learning, Hàm mất mát (Loss Function) và Tối ưu Gradient Descent.',
    method: 'cornell',
    category: 'Khoa học',
    date: '11/10/2023',
    updatedAt: '11/10/2023',
    sources: [
      { type: 'pdf', name: 'Lecture_03_MachineLearning.pdf', size: '5.6 MB' }
    ],
    keywords: ['Gradient Descent', 'Overfitting', 'Cross-entropy', 'Regularization'],
    coreQuestions: [
      'Làm thế nào để tránh hiện tượng Overfitting khi huấn luyện mô hình?',
      'Sự khác biệt giữa L1 và L2 Regularization?'
    ],
    content: {
      overview: 'Bài giảng nhập môn Machine Learning từ Stanford CS229.',
      sections: [
        {
          title: 'Thuật toán Tối ưu hóa',
          text: 'Gradient Descent cập nhật trọng số ngược chiều gradient của hàm mất mát. Tốc độ học (Learning rate) quyết định bước nhảy mỗi vòng lặp.'
        }
      ],
      summaryText: 'Nắm vững toán đại số tuyến tính và giải tích là chìa khóa để hiểu sâu các mạng nơ-ron sâu.'
    },
    rawMarkdown: `# Machine Learning Basics\n\n## Gradient Descent\n$$w_{new} = w_{old} - \alpha \nabla L(w)$$\n\n- $\alpha$: Tốc độ học\n- $\nabla L(w)$: Đạo hàm hàm mất mát`
  },
  {
    id: 'note_ux_design',
    title: 'Thiết kế UI/UX hệ thống AI',
    summary: 'Các nguyên tắc thiết kế giao diện lấy con người làm trung tâm khi tích hợp các mô hình ngôn ngữ lớn (LLM).',
    method: 'quick-summary',
    category: 'Dự án Alpha',
    date: '09/10/2023',
    updatedAt: '09/10/2023',
    sources: [
      { type: 'pdf', name: 'AI_UX_Guidelines.pdf', size: '2.1 MB' }
    ],
    keywords: ['Transparency', 'Latency UI', 'Confidence Scoring', 'Human-in-the-loop'],
    coreQuestions: [
      'Làm sao để người dùng không cảm thấy sốt ruột khi AI xử lý tác vụ mất 5-10 giây?'
    ],
    content: {
      overview: 'Nguyên lý UX cho các ứng dụng Agentic AI.',
      sections: [
        {
          title: 'Quản lý trạng thái chờ',
          text: 'Sử dụng pipeline trạng thái từng bước (Step-by-step processing) kèm animation phản hồi thời gian thực giúp giảm cảm giác chờ đợi lên tới 60%.'
        }
      ],
      summaryText: 'Minh bạch độ tin cậy và cho phép người dùng can thiệp/chỉnh sửa là yếu tố quyết định sự tin cậy của sản phẩm AI.'
    },
    rawMarkdown: `# Thiết kế UI/UX hệ thống AI\n\n- Hiển thị từng bước xử lý (Pipeline UI)\n- Tooltip cảnh báo khi AI không chắc chắn\n- Phản hồi tức thì với Skeleton & Pulse`
  }
];

export const initialArchivedNotes: NoteItem[] = [
  {
    id: 'arch_marketing_q4',
    title: 'Kế hoạch marketing Q4',
    summary: 'Chiến dịch ra mắt sản phẩm trên TikTok và Youtube Shorts cho quý 4.',
    method: 'outline',
    category: 'Marketing',
    date: '12/10/2023',
    updatedAt: '12/10/2023',
    sources: [{ type: 'doc', name: 'Marketing_Plan_Q4_v2.docx', size: '820 KB' }],
    keywords: ['Campaign Q4', 'TikTok Ads', 'KOL Booking'],
    coreQuestions: ['Ngân sách phân bổ cho paid ads là bao nhiêu?'],
    content: {
      overview: 'Bản lưu trữ kế hoạch marketing quý 4.',
      sections: [{ title: 'Mục tiêu', text: 'Đạt 50,000 lượt tải mới.' }],
      summaryText: 'Đã hoàn thành chiến dịch.'
    },
    rawMarkdown: `# Kế hoạch marketing Q4\nĐã lưu trữ`,
    isArchived: true,
    archiveDaysLeft: 28
  },
  {
    id: 'arch_ai_agents',
    title: 'Research về AI Agents',
    summary: 'Khảo sát kiến trúc ReAct, LangChain và AutoGen cho hệ thống tự động hoá tác vụ.',
    method: 'cornell',
    category: 'Nghiên cứu',
    date: '05/10/2023',
    updatedAt: '05/10/2023',
    sources: [{ type: 'pdf', name: 'ReAct_Paper_2023.pdf', size: '1.4 MB' }],
    keywords: ['ReAct', 'Agentic Workflow', 'Function Calling'],
    coreQuestions: ['Sự khác biệt giữa Single-agent và Multi-agent?'],
    content: {
      overview: 'Khảo sát kiến trúc Agentic AI.',
      sections: [{ title: 'ReAct Paradigm', text: 'Kết hợp Reasoning và Action trong từng bước lặp.' }],
      summaryText: 'Áp dụng vào hệ thống trợ lý ghi chép.'
    },
    rawMarkdown: `# Research về AI Agents\nSắp bị xoá vĩnh viễn trong 3 ngày`,
    isArchived: true,
    archiveDaysLeft: 3
  },
  {
    id: 'arch_onboard_draft',
    title: 'Draft: Quy trình onboard',
    summary: 'Hướng dẫn chào đón nhân viên mới và thiết lập môi trường phát triển phần mềm.',
    method: 'quick-summary',
    category: 'Vận hành',
    date: '08/10/2023',
    updatedAt: '08/10/2023',
    sources: [{ type: 'doc', name: 'Onboarding_Checklist.docx', size: '320 KB' }],
    keywords: ['Onboarding', 'Dev Setup', 'Company Culture'],
    coreQuestions: ['Tài liệu nào bắt buộc phải đọc trong ngày đầu tiên?'],
    content: {
      overview: 'Quy trình tiếp nhận nhân sự kỹ thuật.',
      sections: [{ title: 'Ngày 1', text: 'Cấp quyền truy cập GitHub và Slack.' }],
      summaryText: 'Đã chuyển thành tài liệu Notion chính thức.'
    },
    rawMarkdown: `# Draft: Quy trình onboard\nĐã lưu trữ`,
    isArchived: true,
    archiveDaysLeft: 15
  }
];

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

export const initialSourceFiles: SourceFileItem[] = [
  {
    id: 'file_macro',
    name: 'Macroeconomics_Ch1.pdf',
    type: 'pdf',
    size: '2.4 MB',
    uploadDate: '24 Th10, 2023',
    linkedNoteId: 'note_macro_econ',
    linkedNoteTitle: 'Kinh tế vĩ mô - Chương 1',
    status: 'processed',
    statusText: 'Đã xử lý'
  },
  {
    id: 'file_ml_lec',
    name: 'Lecture_03_MachineLearning.mp4',
    type: 'video',
    size: '450.2 MB',
    uploadDate: '22 Th10, 2023',
    linkedNoteId: 'note_ml_basics',
    linkedNoteTitle: 'ML Intro Ghi chú',
    status: 'auto-delete',
    statusText: 'Xóa tự động trong 2 ngày'
  },
  {
    id: 'file_interview',
    name: 'Interview_John_Doe.mp3',
    type: 'audio',
    size: '12.5 MB',
    uploadDate: '20 Th10, 2023',
    linkedNoteId: 'note_market_research',
    linkedNoteTitle: 'Phỏng vấn John',
    status: 'processed',
    statusText: 'Đã xử lý'
  },
  {
    id: 'file_whiteboard',
    name: 'Whiteboard_Brainstorm.png',
    type: 'image',
    size: '4.1 MB',
    uploadDate: '18 Th10, 2023',
    linkedNoteId: 'note_self_dev',
    linkedNoteTitle: 'Ý tưởng SP Mới',
    status: 'processed',
    statusText: 'Đã xử lý'
  },
  {
    id: 'file_specs',
    name: 'Project_Specs_Draft.docx',
    type: 'doc',
    size: '1.2 MB',
    uploadDate: '15 Th10, 2023',
    linkedNoteId: undefined,
    linkedNoteTitle: 'Chưa liên kết',
    status: 'error',
    statusText: 'Lỗi trích xuất'
  }
];

export const initialCoupons: CouponItem[] = [
  {
    id: 'cp_001',
    code: 'SUMMER2024',
    type: 'percentage',
    value: 20,
    appliedTo: 'all',
    usedCount: 45,
    usageLimit: 100,
    expiryDate: '31/12/2026',
    status: 'active'
  },
  {
    id: 'cp_002',
    code: 'WELCOME50K',
    type: 'fixed',
    value: 50000,
    appliedTo: 'paid',
    usedCount: 892,
    usageLimit: null,
    expiryDate: 'Không giới hạn',
    status: 'active'
  },
  {
    id: 'cp_003',
    code: 'NEWYEAR24',
    type: 'percentage',
    value: 50,
    appliedTo: 'all',
    usedCount: 500,
    usageLimit: 500,
    expiryDate: '01/01/2024',
    status: 'expired'
  },
  {
    id: 'cp_004',
    code: 'BETA_TEST',
    type: 'fixed',
    value: 100000,
    appliedTo: 'all',
    usedCount: 12,
    usageLimit: 50,
    expiryDate: '30/06/2024',
    status: 'disabled'
  }
];

export const initialAIProviders: AIProviderItem[] = [
  {
    id: 'prov_openai',
    name: 'OpenAI Direct API',
    providerId: 'openai-gpt4o',
    endpointUrl: 'https://api.openai.com/v1',
    defaultModel: 'GPT-4o (Omni)',
    apiKeyMasked: 'sk-proj-••••••••••••••••••••3X9q',
    status: 'active',
    latencyMs: 135,
    streaming: true,
    autoFallback: true,
    importFreeModels: false,
    syncEnabled: false,
    freeModelsCount: 2,
    freeModelsList: ['gpt-4o-mini', 'gpt-3.5-turbo']
  },
  {
    id: 'prov_anthropic',
    name: 'Anthropic Claude',
    providerId: 'anthropic-sonnet',
    endpointUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'Claude 3.5 Sonnet',
    apiKeyMasked: 'sk-ant-••••••••••••••••••••8K1m',
    status: 'active',
    latencyMs: 180,
    streaming: true,
    autoFallback: true,
    importFreeModels: true,
    syncEnabled: false,
    freeModelsCount: 1,
    freeModelsList: ['claude-3-haiku-free']
  },
  {
    id: 'prov_gemini',
    name: 'Google Gemini',
    providerId: 'google-gemini-pro',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'Gemini 2.0 Flash',
    apiKeyMasked: 'AIzaSy••••••••••••••••••••4J2k',
    status: 'active',
    latencyMs: 95,
    streaming: true,
    autoFallback: false,
    importFreeModels: true,
    syncEnabled: true,
    freeModelsCount: 3,
    freeModelsList: ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-exp']
  },
  {
    id: 'prov_ollama',
    name: 'Ollama Local Server',
    providerId: 'ollama-local',
    endpointUrl: 'http://localhost:11434/v1',
    defaultModel: 'Llama-3.3-70B-Instruct',
    apiKeyMasked: 'None (Local Network)',
    status: 'inactive',
    latencyMs: 25,
    streaming: true,
    autoFallback: false,
    isCustomEndpoint: true,
    importFreeModels: false,
    syncEnabled: false,
    freeModelsCount: 0,
    freeModelsList: []
  }
];

export const initialPaymentRecords: PaymentRecord[] = [
  {
    id: 'pay_01',
    date: '20/11/2024',
    amount: '250.000đ',
    status: 'success',
    invoiceId: 'INV-2024-11-8921'
  },
  {
    id: 'pay_02',
    date: '20/10/2024',
    amount: '250.000đ',
    status: 'success',
    invoiceId: 'INV-2024-10-7412'
  }
];
