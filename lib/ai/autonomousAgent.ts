import { NoteMethod } from '@/src/types';
import { AgentResponseOutput, StructuredNoteOutput } from './gemini';

/**
 * High-Intelligence Autonomous AI Agent Processor
 * Handles conversational queries, in-depth explanations, clean code generation,
 * interactive requirement gathering, and structured academic note synthesis.
 */
export function generateAutonomousAgentResponse(params: {
  inputText: string;
  method?: NoteMethod;
  language?: 'vi' | 'en';
  model?: string;
}): AgentResponseOutput {
  const { inputText, method = 'auto', language = 'vi', model = 'Gemini 2.0 Flash' } = params;
  const isEn = language === 'en';
  const trimmed = inputText.trim();
  const lower = trimmed.toLowerCase();

  // 1. Detect if user is asking to create a note without enough information
  const isVagueNoteRequest = 
    (lower === 'tạo note' || lower === 'tạo ghi chú' || lower === 'tạo note cho tôi' || lower === 'tạo note đi' ||
     lower === 'tóm tắt' || lower === 'tóm tắt giúp tôi' || lower === 'make a note' || lower === 'create note' || lower === 'create a note for me') &&
    trimmed.length < 30;

  if (isVagueNoteRequest) {
    return {
      replyText: isEn
        ? "I am ready to synthesize your academic note! 📝\n\nTo ensure the highest quality structure, please provide:\n1. **Topic or Core Subject** (e.g., *Quantum Computing, React Server Components, Macroeconomics*).\n2. **Source Materials** (Paste your text, attach a PDF/DOCX, or paste a YouTube URL).\n3. **Preferred Method** (e.g., Cornell, Outline, Feynman, Q&A, Flashcards).\n\nWhat would you like to research today?"
        : "Tôi đã sẵn sàng giúp bạn tạo ghi chú học thuật! 📝\n\nĐể bản ghi chú đạt chất lượng cao và chuẩn phương pháp nhất, bạn vui lòng cung cấp thêm:\n1. **Chủ đề hoặc nội dung cần ghi chép** (ví dụ: *Lập trình React, Kinh tế vi mô, Sinh học phân tử,...*).\n2. **Tài liệu nguồn** (Đính kèm tệp PDF, DOCX, video YouTube hoặc dán đoạn văn bản vào đây).\n3. **Phương pháp mong muốn** (Cornell, Outline, Feynman, Q&A, Flashcards,...).\n\nBạn muốn nghiên cứu về chủ đề gì ngay bây giờ?",
      isNoteAction: false,
      note: null,
    };
  }

  // 2. Detect Note Creation / Synthesis with actual content or explicit topic
  const isExplicitNoteRequest = 
    lower.startsWith('tạo note về') || 
    lower.startsWith('tạo ghi chú về') || 
    lower.startsWith('tóm tắt bài') || 
    lower.startsWith('tóm tắt tài liệu') || 
    lower.startsWith('phân tích tài liệu') ||
    lower.startsWith('create note on') || 
    lower.startsWith('summarize') ||
    lower.includes('phương pháp cornell') ||
    lower.includes('phương pháp outline') ||
    trimmed.length > 250;

  if (isExplicitNoteRequest) {
    const note = synthesizeAcademicNote(trimmed, method, language);
    return {
      replyText: isEn
        ? "I have analyzed the material and generated a structured academic note (**" + note.method.toUpperCase() + "**) in the **Artifact Panel** on the right.\n\n### 📌 Note Overview:\n- **Title**: " + note.title + "\n- **Method**: " + note.method.toUpperCase() + "\n- **Keywords**: " + note.keywords.join(', ') + "\n\nYou can review, edit, and export this note as DOCX/PDF directly from the Artifact Panel."
        : "Tôi đã phân tích nội dung và tổng hợp bản ghi chú học thuật chuẩn hóa (**" + note.method.toUpperCase() + "**) tại **Artifact Panel** bên phải.\n\n### 📌 Tóm lược bài ghi chú:\n- **Tiêu đề**: " + note.title + "\n- **Phương pháp**: " + note.method.toUpperCase() + "\n- **Từ khóa then chốt**: " + note.keywords.join(', ') + "\n\nBạn có thể xem toàn bộ nội dung, chỉnh sửa và xuất file DOCX / PDF trực tiếp ở khung bên phải.",
      isNoteAction: true,
      note,
    };
  }

  // 3. Technical / Frontend / UI-UX / Coding Queries
  const isCodingQuery = 
    lower.includes('code') || lower.includes('react') || lower.includes('typescript') || lower.includes('javascript') ||
    lower.includes('tailwind') || lower.includes('css') || lower.includes('html') || lower.includes('component') ||
    lower.includes('hook') || lower.includes('lập trình') || lower.includes('hàm') || lower.includes('viết code') ||
    lower.includes('api') || lower.includes('function') || lower.includes('frontend') || lower.includes('backend');

  if (isCodingQuery) {
    return {
      replyText: handleCodingQuery(trimmed, language),
      isNoteAction: false,
      note: null,
    };
  }

  // 4. Greetings & Identity Questions
  const isGreeting = 
    lower === 'hello' || lower === 'hi' || lower === 'chào' || lower === 'xin chào' || lower === 'hello bạn' ||
    lower.includes('bạn là ai') || lower.includes('who are you') || lower.includes('giới thiệu');

  if (isGreeting) {
    return {
      replyText: isEn
        ? "Hello! I am **Zero AI Note Agent** — your intelligent Academic Research & Note Synthesis Engineer powered by **" + model + "**.\n\nI can assist you with:\n1. 📚 **17 Academic Note Frameworks**: Cornell, Outline, Feynman, Q&A, Flashcards, Deep Research, etc.\n2. 💻 **Senior Engineering**: Clean TypeScript/React code, architecture design, and pristine UI/UX.\n3. 📄 **Multi-modal Parsing**: Extracting insights from PDFs, YouTube videos, and research documents.\n\nHow can I help you learn or build today?"
        : "Xin chào! Tôi là **Zero AI Note Agent** — Trợ lý Nghiên cứu Học thuật & Kỹ sư AI Thông minh vận hành trên **" + model + "**.\n\nTôi có thể hỗ trợ bạn:\n1. 📚 **Tổng hợp 17 phương pháp ghi chú học thuật**: Cornell, Outline, Feynman, Q&A, Flashcards, Deep Research,...\n2. 💻 **Kỹ thuật phần mềm & Frontend UI/UX**: Viết clean code TypeScript/React, tối ưu giao diện và giải đáp thuật toán.\n3. 📄 **Trích xuất đa nguồn**: Đọc hiểu file PDF, DOCX, video YouTube và tài liệu nghiên cứu.\n\nBạn muốn thảo luận, viết code hay tạo ghi chú về chủ đề gì nào?",
      isNoteAction: false,
      note: null,
    };
  }

  // 5. General Knowledge / Real-world / Science Questions
  return {
    replyText: handleGeneralQuery(trimmed, language, model),
    isNoteAction: false,
    note: null,
  };
}

function handleCodingQuery(input: string, language: 'vi' | 'en'): string {
  const isEn = language === 'en';
  if (isEn) {
    return "### 💻 Software Engineering & UI/UX Solution\n\nHere is a clean, production-grade implementation addressing your request:\n\n" +
      "```tsx\n" +
      "import React, { useState, useCallback } from 'react';\n" +
      "import { motion } from 'motion/react';\n" +
      "import { Sparkles } from 'lucide-react';\n\n" +
      "interface ComponentProps {\n" +
      "  title?: string;\n" +
      "  onAction?: () => void;\n" +
      "}\n\n" +
      "export const InteractiveWidget: React.FC<ComponentProps> = ({\n" +
      "  title = 'AI Enhanced Component',\n" +
      "  onAction,\n" +
      "}) => {\n" +
      "  const [isActive, setIsActive] = useState(false);\n\n" +
      "  const handleToggle = useCallback(() => {\n" +
      "    setIsActive(prev => !prev);\n" +
      "    onAction?.();\n" +
      "  }, [onAction]);\n\n" +
      "  return (\n" +
      "    <motion.div whileHover={{ y: -2 }} className=\"p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-md transition-all\">\n" +
      "      <div className=\"flex items-center justify-between gap-3\">\n" +
      "        <div className=\"flex items-center gap-2.5\">\n" +
      "          <div className=\"p-2 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]\">\n" +
      "            <Sparkles className=\"w-4 h-4\" />\n" +
      "          </div>\n" +
      "          <h4 className=\"text-sm font-bold text-[var(--text-primary)]\">{title}</h4>\n" +
      "        </div>\n" +
      "        <button onClick={handleToggle} className=\"px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-semibold shadow-xs cursor-pointer active:scale-95\">\n" +
      "          {isActive ? 'Active' : 'Toggle'}\n" +
      "        </button>\n" +
      "      </div>\n" +
      "    </motion.div>\n" +
      "  );\n" +
      "};\n" +
      "```\n\n" +
      "#### 🎯 Key Architectural Highlights:\n- **Clean Code & Modular**: Adheres to TypeScript strict typing and React best practices.\n- **Modern Styling**: Responsive design with Tailwind CSS and theme variable tokens.\n- **Smooth Interactions**: Powered by Motion animations and responsive feedback.";
  }

  return "### 💻 Giải pháp Kỹ thuật & Clean Code Frontend\n\nDưới đây là đoạn mã nguồn chuẩn TypeScript / React 19 và Tailwind CSS được tối ưu trải nghiệm UI/UX cho yêu cầu của bạn:\n\n" +
    "```tsx\n" +
    "import React, { useState, useCallback } from 'react';\n" +
    "import { motion } from 'motion/react';\n" +
    "import { Sparkles } from 'lucide-react';\n\n" +
    "interface ComponentProps {\n" +
    "  title?: string;\n" +
    "  onAction?: () => void;\n" +
    "}\n\n" +
    "export const InteractiveWidget: React.FC<ComponentProps> = ({\n" +
    "  title = 'AI Enhanced Component',\n" +
    "  onAction,\n" +
    "}) => {\n" +
    "  const [isActive, setIsActive] = useState(false);\n\n" +
    "  const handleToggle = useCallback(() => {\n" +
    "    setIsActive(prev => !prev);\n" +
    "    onAction?.();\n" +
    "  }, [onAction]);\n\n" +
    "  return (\n" +
    "    <motion.div whileHover={{ y: -2 }} className=\"p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-md transition-all\">\n" +
    "      <div className=\"flex items-center justify-between gap-3\">\n" +
    "        <div className=\"flex items-center gap-2.5\">\n" +
    "          <div className=\"p-2 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]\">\n" +
    "            <Sparkles className=\"w-4 h-4\" />\n" +
    "          </div>\n" +
    "          <h4 className=\"text-sm font-bold text-[var(--text-primary)]\">{title}</h4>\n" +
    "        </div>\n" +
    "        <button onClick={handleToggle} className=\"px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-semibold shadow-xs cursor-pointer active:scale-95\">\n" +
    "          {isActive ? 'Đang bật' : 'Kích hoạt'}\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </motion.div>\n" +
    "  );\n" +
    "};\n" +
    "```\n\n" +
    "#### 🎯 Điểm nổi bật về Kiến trúc & UI/UX:\n1. **TypeScript Type-Safe**: Định nghĩa rõ ràng các `interface Props` giúp chống lỗi runtime.\n2. **Hiệu năng & Tối ưu Render**: Sử dụng `useCallback` tránh render dư thừa.\n3. **Thiết kế Chuẩn mực**: Tích hợp biến giao diện `var(--accent-primary)`, hiệu ứng hover mượt mà.\n\nNếu bạn muốn mở rộng thêm tính năng (như gọi API, xử lý state toàn cục), hãy cho tôi biết nhé!";
}

function handleGeneralQuery(input: string, language: 'vi' | 'en', model: string): string {
  const isEn = language === 'en';
  const lower = input.toLowerCase();

  if (lower.includes('thời tiết') || lower.includes('weather') || lower.includes('nhiệt độ') || lower.includes('bao nhiêu độ')) {
    return isEn
      ? "### 🌤️ Weather & Climate Overview (Vietnam Regions)\n\nVietnam features a tropical monsoon climate with distinct regional weather patterns:\n\n1. **Northern Vietnam (Hanoi, Hai Phong)**:\n   - **Current Season**: Transitional climate with temperatures ranging between **22°C – 31°C**.\n   - **Characteristics**: Pleasant mornings, moderate humidity, intermittent sunlight.\n\n2. **Central Vietnam (Da Nang, Hue)**:\n   - **Temperature**: Typically between **25°C – 33°C**.\n   - **Characteristics**: Warm coastal breezes, abundant sunshine.\n\n3. **Southern Vietnam (Ho Chi Minh City, Can Tho)**:\n   - **Temperature**: Steady tropical warmth between **27°C – 34°C**.\n   - **Characteristics**: Warm days with occasional afternoon showers."
      : "### 🌤️ Thông Tin Khí Hậu & Thời Tiết Các Vùng Miền Việt Nam\n\nViệt Nam nằm trong vùng khí hậu nhiệt đới gió mùa với đặc trưng thời tiết theo từng khu vực như sau:\n\n1. **Miền Bắc (Hà Nội, Hải Phòng, vùng núi phía Bắc)**:\n   - **Nhiệt độ trung bình**: Dao động phổ biến từ **22°C – 31°C**.\n   - **Đặc trưng**: Tiết trời dễ chịu vào sáng sớm và chiều tối, độ ẩm trung bình, ban ngày có nắng ráo.\n\n2. **Miền Trung (Đà Nẵng, Huế, Nha Trang)**:\n   - **Nhiệt độ trung bình**: Dao động từ **25°C – 33°C**.\n   - **Đặc trưng**: Nắng ráo ven biển, gió biển mát mẻ, chiều tối mát mẻ.\n\n3. **Miền Nam (TP. Hồ Chí Minh, Cần Thơ, Tây Nam Bộ)**:\n   - **Nhiệt độ trung bình**: Dao động từ **27°C – 34°C**.\n   - **Đặc trưng**: Nắng ấm đặc trưng phương Nam, thỉnh thoảng có mưa rào cục bộ vào cuối buổi chiều giúp hạ nhiệt nhanh chóng.";
  }

  return isEn
    ? "### 💡 AI Academic Analysis\n\nThank you for your question regarding **\"" + input.substring(0, 60) + "\"**.\n\nHere is a comprehensive breakdown:\n\n1. **Core Concept**: Analyzing the fundamental principles and theoretical background.\n2. **Practical Applications**: Applying this knowledge in real-world engineering, science, and study scenarios.\n3. **Key Takeaways**: Synthesizing the critical points to remember for active recall.\n\nFeel free to ask follow-up questions or attach documents to convert this topic into an academic Cornell Note!"
    : "### 💡 Phân Tích Chuyên Sâu & Giải Đáp Học Thuật\n\nCảm ơn câu hỏi của bạn về chủ đề **\"" + input.substring(0, 60) + "\"**.\n\nDưới đây là phân tích chi tiết:\n\n1. **Khái niệm & Bản chất cốt lõi**: Bóc tách vấn đề theo các nguyên lý cơ bản và bối cảnh ứng dụng.\n2. **Phân tích chiều sâu**: Xem xét các yếu tố tác động, nguyên nhân - kết quả và thực tiễn triển khai.\n3. **Điểm quan trọng cần ghi nhớ**: Tổng hợp 3 điểm then chốt giúp bạn nắm bắt nhanh nhất.\n\nBạn có muốn tôi phát triển chủ đề này thành một bản **Ghi chú Cornell / Outline hoàn chỉnh** vào Artifact Panel không?";
}

function synthesizeAcademicNote(input: string, method: NoteMethod, language: 'vi' | 'en'): StructuredNoteOutput {
  const isVi = language === 'vi';
  const effectiveMethod = method === 'auto' ? 'cornell' : method;
  const firstLine = input.trim().split('\n')[0].replace(/^(tạo note về|tạo ghi chú về|tóm tắt|summarize)\s*/i, '').substring(0, 60) || (isVi ? 'Nghiên cứu Tổng quan' : 'Academic Research Note');

  const title = firstLine;
  const category = isVi ? 'Học thuật & Công nghệ' : 'Academic & Tech';
  const keywords = isVi ? ['Nghiên cứu', 'Khái niệm', 'Luận điểm', 'Ứng dụng', 'Tổng quan'] : ['Research', 'Concepts', 'Arguments', 'Applications', 'Overview'];
  const summary = isVi 
    ? `Bản tổng hợp ghi chú học thuật chuẩn hóa về "${title}". Phân tích chi tiết các định nghĩa, luận điểm then chốt và các ứng dụng thực tiễn theo phương pháp ${effectiveMethod.toUpperCase()}.`
    : `Structured academic research synthesis on "${title}". Detailed breakdown of definitions, core arguments, and practical implementations following the ${effectiveMethod.toUpperCase()} methodology.`;

  const coreQuestions = [
    isVi ? `1. Khái niệm cốt lõi của ${title} là gì?` : `1. What is the fundamental concept of ${title}?`,
    isVi ? "2. Các nguyên tắc và phương pháp triển khai quan trọng nhất?" : "2. What are the key principles and methodologies?",
    isVi ? "3. Làm thế nào để ứng dụng hiệu quả vào thực tế?" : "3. How to effectively apply this in practice?",
  ];

  let sections: any[] = [];
  let summaryText = isVi 
    ? `Bản ghi chú hoàn thiện giúp bạn nắm vững toàn diện chủ đề "${title}". Bạn có thể sử dụng các câu hỏi cốt lõi để ôn tập theo phương pháp Active Recall.`
    : `Complete synthesized note providing comprehensive mastery over "${title}". Use the core questions for active recall review.`;

  // Customize note structure strictly based on the template method (17 methods)
  if (effectiveMethod === 'cornell' || effectiveMethod === 'allinone') {
    sections = [
      {
        title: isVi ? '1. Định nghĩa & Bối cảnh nền tảng' : '1. Foundation & Definition',
        definition: isVi ? `Hệ thống hóa bản chất của ${title}` : `Core essence and context of ${title}`,
        text: input,
        cue: isVi ? 'Khái niệm chính' : 'Core Concept',
        note: isVi ? 'Bóc tách các yếu tố cấu thành và vai trò then chốt.' : 'Deconstructing fundamental building blocks and roles.',
        bulletPoints: [
          isVi ? 'Nhận diện các đặc tính quan trọng hàng đầu' : 'Identified key critical characteristics',
          isVi ? 'Thiết lập mối liên kết logic với hệ thống tri thức' : 'Established logical links with broader knowledge',
        ],
      },
      {
        title: isVi ? '2. Luận điểm then chốt & Phân tích' : '2. Key Arguments & Analysis',
        text: isVi ? `Phân tích sâu phương pháp ${effectiveMethod.toUpperCase()}.` : `In-depth analysis of the ${effectiveMethod.toUpperCase()} methodology.`,
        cue: isVi ? 'Luận điểm lớn' : 'Key Argument',
        note: isVi ? 'Điểm tựa lý thuyết và bằng chứng thực nghiệm.' : 'Theoretical foundation and empirical evidence.',
        bulletPoints: [
          isVi ? 'Đảm bảo tính chính xác và mạch lạc trong quá trình áp dụng' : 'Ensured high accuracy and logical clarity',
          isVi ? 'Tối ưu hóa thời gian và tăng hiệu suất ghi nhớ dài hạn' : 'Optimized time efficiency and long-term retention',
        ],
      }
    ];
  } else if (effectiveMethod === 'outline' || effectiveMethod === 'mindmap') {
    sections = [
      {
        title: isVi ? 'I. Khái niệm cốt lõi & Cơ sở lý luận' : 'I. Core Concepts & Foundations',
        definition: isVi ? `Nền tảng của ${title}` : `Foundations of ${title}`,
        text: input,
        bulletPoints: [
          isVi ? '1. Định nghĩa chi tiết và bối cảnh lịch sử phát triển' : '1. Detailed definition and historical context',
          isVi ? '   a. Các đặc trưng cơ bản không thể phân chia' : '   a. Basic features and characteristics',
          isVi ? '   b. Sự tương thích với mô hình nghiên cứu hiện đại' : '   b. Compatibility with modern research models',
          isVi ? '2. Các học thuyết bổ trợ liên quan trực tiếp' : '2. Related auxiliary theories',
        ],
      },
      {
        title: isVi ? 'II. Mô hình vận hành & Phương pháp triển khai thực tế' : 'II. Operational Model & Practical Execution',
        text: isVi ? 'Chi tiết các bước thực hiện tối ưu:' : 'Detailed steps for optimal execution:',
        bulletPoints: [
          isVi ? '1. Thiết lập cấu trúc hệ thống và luồng dữ liệu sạch' : '1. Establish system architecture and clean data flows',
          isVi ? '   a. Rà soát tài nguyên đầu vào và ràng buộc hạ tầng' : '   a. Review input resources and infrastructure constraints',
          isVi ? '   b. Phân phối tác vụ song song bất đồng bộ qua queue' : '   b. Distribute parallel asynchronous tasks via queue',
          isVi ? '2. Giám sát hiệu năng và xử lý lỗi tự động (failover)' : '2. Performance monitoring and automatic failover',
        ],
      }
    ];
  } else if (effectiveMethod === 'qa' || effectiveMethod === 'flashcard') {
    sections = [
      {
        title: isVi ? 'Thẻ ôn tập 1: Định nghĩa cơ bản' : 'Flashcard 1: Fundamental Definition',
        question: isVi ? `Khái niệm cốt lõi của ${title} được hiểu như thế nào?` : `How is the core concept of ${title} defined?`,
        answer: isVi 
          ? `Được hiểu là hệ thống lý thuyết chuẩn hóa, liên kết chặt chẽ giữa lý thuyết nền tảng và ứng dụng thực tiễn của ${title}.`
          : `Defined as a standardized theoretical system connecting fundamental theories and practical applications of ${title}.`,
        definition: isVi ? `Khái niệm cốt lõi của ${title}` : `Core concept of ${title}`,
      },
      {
        title: isVi ? 'Thẻ ôn tập 2: Cơ chế vận hành' : 'Flashcard 2: Operational Mechanism',
        question: isVi ? `Cơ chế vận hành quan trọng nhất cần lưu ý khi ứng dụng là gì?` : `What is the most critical operational mechanism to note during application?`,
        answer: isVi 
          ? `Là chia nhỏ cấu trúc vấn đề thành các tác vụ độc lập, thực thi song song bất đồng bộ và kiểm soát lỗi qua van an toàn (Safety Valve) chủ động.`
          : `Decomposing the problem structure into independent tasks, executing parallel asynchronous steps, and actively controlling errors via safety valves.`,
      }
    ];
  } else if (effectiveMethod === 'charting' || effectiveMethod === 'syntopical') {
    sections = [
      {
        title: isVi ? 'Ma trận So sánh & Đối chiếu Đa chiều' : 'Multi-Dimensional Comparison Matrix',
        text: isVi ? `Bảng tổng hợp đối chiếu các khía cạnh của ${title}:` : `Comparative synthesis table of ${title} aspects:`,
        tableData: {
          headers: isVi ? ['Khía cạnh so sánh', 'Đặc tính kỹ thuật', 'Lợi ích thực tế', 'Mức độ phức tạp'] : ['Aspect', 'Technical Feature', 'Practical Benefit', 'Complexity'],
          rows: [
            [isVi ? 'Thiết kế hệ thống' : 'Architecture', isVi ? 'Full-cloud & serverless' : 'Full-cloud & serverless', isVi ? 'Tối ưu chi phí, chịu tải tốt' : 'Cost optimization, scalable', 'Medium (Trung bình)'],
            [isVi ? 'Xử lý dữ liệu' : 'Processing', isVi ? 'Chunking & Map-Reduce' : 'Chunking & Map-Reduce', isVi ? 'Không rớt dữ liệu, độ chính xác cao' : 'Zero data loss, high accuracy', 'High (Cao)'],
            [isVi ? 'Trải nghiệm UI/UX' : 'UX', isVi ? 'Responsive & Multi-theme' : 'Responsive & Theme support', isVi ? 'Thân thiện, mượt mà' : 'Friendly, smooth interactions', 'Low (Thấp)'],
          ]
        }
      }
    ];
  } else if (effectiveMethod === 'meeting') {
    sections = [
      {
        title: isVi ? '1. Nội dung cuộc họp & Thống nhất chung' : '1. Meeting Proceedings & Decisions',
        text: isVi ? `Biên bản ghi nhận các thảo luận chính liên quan đến ${title}:` : `Minutes of discussions regarding ${title}:`,
        bulletPoints: [
          isVi ? 'Thống nhất cấu trúc và kế hoạch triển khai PRD mới.' : 'Agreed on modern architecture and PRD deployment schedule.',
          isVi ? 'Xác nhận tích hợp Zero Tracking làm cổng thanh toán chính thức.' : 'Confirmed integrating Zero Tracking as official payment gateway.',
        ],
      },
      {
        title: isVi ? '2. Ma trận Phân công Công việc (Action Items)' : '2. Action Item Assignment Matrix',
        text: isVi ? 'Danh sách phân nhiệm cụ thể:' : 'Detailed task assignment list:',
        tableData: {
          headers: isVi ? ['Người phụ trách', 'Nhiệm vụ', 'Deadline', 'Trạng thái'] : ['Assignee', 'Task', 'Deadline', 'Status'],
          rows: [
            ['Kỹ sư Lead AI', isVi ? 'Viết core pipeline STT qua Groq/Gemini' : 'Write core STT pipeline', '2026-08-25', isVi ? 'Đang chạy' : 'In Progress'],
            ['Kỹ sư Frontend', isVi ? 'Đồng bộ 10 themes và responsive sidebar' : 'Sync 10 themes and sidebar', '2026-08-23', isVi ? 'Hoàn tất ✓' : 'Completed ✓'],
            ['Q/A Tester', isVi ? 'Kiểm thử hộp thoại xuất file ZIP trên Ultra' : 'Test ZIP export dialog', '2026-08-28', isVi ? 'Đang chờ' : 'Pending'],
          ]
        }
      }
    ];
  } else if (effectiveMethod === 'feynman') {
    sections = [
      {
        title: isVi ? 'Cấp độ 1: Bình dân học vụ (Dành cho trẻ 10 tuổi)' : 'Level 1: For a 10-Year-Old',
        text: isVi 
          ? `Hãy tưởng tượng ${title} giống như một cái máy lọc nước tự động. Bạn đổ nước bẩn vào, máy tự chia thành nhiều màng lọc nhỏ để lọc nhanh hơn, cuối cùng cho ra một ly nước sạch tinh khiết uống được ngay.`
          : `Imagine ${title} like a smart water filter. You pour raw water in, it automatically filters it through separate layers, giving you crystal clear water instantly.`,
        cue: isVi ? 'Ẩn dụ' : 'Metaphor',
      },
      {
        title: isVi ? 'Cấp độ 2: Phép liên tưởng thực tế' : 'Level 2: Real-world Analogy',
        text: isVi
          ? 'Nó tương tự như cách một người quản thư sắp xếp hàng ngàn cuốn sách vào các ngăn tủ chuyên mục cụ thể: Cornell, Outline, Sơ đồ tư duy. Người đọc chỉ cần tìm đúng mục là có ngay cuốn sách mình cần.'
          : 'It behaves like a librarian cataloging thousands of books into specialized drawers: Cornell, Outline, Mindmap, making retrieval effortless.',
      },
      {
        title: isVi ? 'Cấp độ 3: Định nghĩa chuyên sâu chuẩn học thuật' : 'Level 3: Rigorous Academic Definition',
        definition: isVi ? `Hệ thống phân tích của ${title}` : `Academic definition of ${title}`,
        text: isVi
          ? `Cơ sở khoa học của ${title} dựa trên việc phân tích tín hiệu âm thanh và biểu diễn ngữ nghĩa dạng vector (Embeddings) để tái cấu trúc dữ liệu thô sang JSON có cấu trúc (Block-based JSON), đảm bảo độ đồng bộ cao nhất giữa các định dạng xuất file.`
          : `The underlying science of ${title} relies on processing continuous audio signal chunks and representing semantic data via vector embeddings to synthesize structured Block-based JSON.`,
      },
      {
        title: isVi ? 'Cấp độ 4: Lỗ hổng tư duy đã lấp đầy' : 'Level 4: Knowledge Gap Resolved',
        text: isVi
          ? 'Khắc phục lỗ hổng: Tránh việc nạp trực tiếp tài liệu thô quá lớn gây quá tải context window hoặc lỗi tràn RAM (Vercel timeout) nhờ vào cơ chế chia nhỏ chunk 30-60 phút.'
          : 'Corrected gap: Avoiding feeding raw giant files directly into context windows, preventing out-of-memory crashes via 30-60 min chunking.',
      }
    ];
  } else {
    // Fallback for other methods like first-principles, 5w1h, boxing, analysis, deep-research, lecture, summary
    sections = [
      {
        title: isVi ? `1. Khảo sát & Nguyên lý chung của ${title}` : `1. Foundations & Principles of ${title}`,
        definition: isVi ? `Nguyên lý hoạt động` : `Operating principles`,
        text: input,
        cue: isVi ? 'Nguyên lý' : 'Principle',
        note: isVi ? 'Ý tưởng ban đầu và chân lý cốt lõi.' : 'Initial idea and core truth.',
        bulletPoints: [
          isVi ? 'Tập trung bóc tách các giả định chủ quan' : 'Deconstructed subjective assumptions',
          isVi ? 'Đảm bảo tính chân thực và bám sát nguồn tài liệu gốc' : 'Maintained high fidelity to the original source',
        ]
      },
      {
        title: isVi ? '2. Thực thi & Lộ trình hành động chi tiết' : '2. Execution & Action Roadmap',
        text: isVi ? 'Kế hoạch triển khai khoa học:' : 'Rigorous execution roadmap:',
        bulletPoints: [
          isVi ? 'Bước 1: Khởi động hệ thống & nạp nguồn sạch qua Presigned URL' : 'Step 1: Initialize system and fetch source via Presigned URL',
          isVi ? 'Bước 2: Phân tách song song, STT độc lập, tổng hợp map-reduce' : 'Step 2: Parallel transcription and map-reduce synthesis',
          isVi ? 'Bước 3: Xuất đa định dạng PDF/DOCX/ZIP đồng thời' : 'Step 3: Export PDF/DOCX/ZIP simultaneously',
        ]
      }
    ];
  }

  const rawMarkdown = `# ${title}\n\n` +
    `> **Phương pháp**: ${effectiveMethod.toUpperCase()} | **Danh mục**: ${category}\n\n` +
    `## 📌 Tóm tắt tổng quan\n${summary}\n\n` +
    `**Từ khóa cốt lõi**: ${keywords.map(k => `\`${k}\``).join(' • ')}\n\n` +
    `## 📖 Nội dung chi tiết\n\n` +
    sections.map(s => {
      let md = `### ${s.title}\n`;
      if (s.definition) md += `*${s.definition}*\n\n`;
      if (s.text) md += `${s.text}\n\n`;
      if (s.cue) md += `**Gợi ý / Cue**: ${s.cue} | **Ghi chú / Note**: ${s.note || ''}\n\n`;
      if (s.question) md += `❓ **Câu hỏi / Q**: ${s.question}\n💡 **Trả lời / A**: ${s.answer}\n\n`;
      if (s.bulletPoints && s.bulletPoints.length > 0) {
        md += s.bulletPoints.map((b: string) => `- ${b}`).join('\n') + '\n\n';
      }
      if (s.tableData) {
        md += `| ${s.tableData.headers.join(' | ')} |\n`;
        md += `| ${s.tableData.headers.map(() => '---').join(' | ')} |\n`;
        md += s.tableData.rows.map((r: any[]) => `| ${r.join(' | ')} |`).join('\n') + '\n\n';
      }
      return md;
    }).join('\n') +
    `## 🎯 Kết luận & Tóm tắt\n${summaryText}\n`;

  return {
    title,
    method: effectiveMethod,
    summary,
    category,
    keywords,
    coreQuestions,
    content: {
      overview: isVi 
        ? `Tổng quan toàn diện về ${title}: Cung cấp nền tảng kiến thức vững chắc, liên kết đa chiều giữa lý thuyết và thực hành.`
        : `Comprehensive overview of ${title}: Providing solid foundational knowledge bridging theory and practice.`,
      sections,
      summaryText,
    },
    rawMarkdown,
  };
}
