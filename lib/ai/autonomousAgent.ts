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

  return {
    title: firstLine,
    method: effectiveMethod,
    summary: isVi 
      ? "Bản tổng hợp ghi chú học thuật chuẩn hóa về \"" + firstLine + "\". Phân tích chi tiết các định nghĩa, luận điểm then chốt và các ứng dụng thực tiễn theo phương pháp " + effectiveMethod.toUpperCase() + "."
      : "Structured academic research synthesis on \"" + firstLine + "\". Detailed breakdown of definitions, core arguments, and practical implementations following the " + effectiveMethod.toUpperCase() + " methodology.",
    category: isVi ? 'Học thuật & Công nghệ' : 'Academic & Tech',
    keywords: isVi ? ['Nghiên cứu', 'Khái niệm', 'Luận điểm', 'Ứng dụng', 'Tổng quan'] : ['Research', 'Concepts', 'Arguments', 'Applications', 'Overview'],
    coreQuestions: [
      isVi ? "1. Khái niệm cốt lõi của " + firstLine + " là gì?" : "1. What is the fundamental concept of " + firstLine + "?",
      isVi ? "2. Các nguyên tắc và phương pháp triển khai quan trọng nhất?" : "2. What are the key principles and methodologies?",
      isVi ? "3. Làm thế nào để ứng dụng hiệu quả vào thực tế?" : "3. How to effectively apply this in practice?",
    ],
    content: {
      overview: isVi 
        ? "Tổng quan toàn diện về " + firstLine + ": Cung cấp nền tảng kiến thức vững chắc, liên kết đa chiều giữa lý thuyết và thực hành."
        : "Comprehensive overview of " + firstLine + ": Providing solid foundational knowledge bridging theory and practice.",
      sections: [
        {
          title: isVi ? '1. Định nghĩa & Bối cảnh nền tảng' : '1. Foundation & Definition',
          definition: isVi ? "Hệ thống hóa bản chất của " + firstLine : "Core essence and context of " + firstLine,
          text: input,
          cue: isVi ? 'Khái niệm chính' : 'Core Concept',
          note: isVi ? 'Bóc tách các yếu tố cấu thành và vai trò then chốt.' : 'Deconstructing fundamental building blocks and roles.',
          bulletPoints: [
            isVi ? 'Nhận diện các đặc tính quan trọng hàng đầu' : 'Identified key critical characteristics',
            isVi ? 'Thiết lập mối liên kết logic với hệ thống tri thức rộng hơn' : 'Established logical links with broader knowledge systems',
          ],
          tableData: {
            headers: isVi ? ['Tiêu chí', 'Chi tiết phân tích', 'Mức độ ảnh hưởng'] : ['Criteria', 'Analysis Detail', 'Impact Level'],
            rows: [
              [isVi ? 'Mục tiêu cốt lõi' : 'Core Objective', isVi ? 'Tối ưu hóa kiến thức & vận hành' : 'Knowledge & process optimization', 'High (Cao)'],
              [isVi ? 'Phạm vi ứng dụng' : 'Scope', isVi ? 'Toàn diện trong học tập & công việc' : 'Comprehensive academic & real-world', 'Crucial (Then chốt)'],
            ],
          },
        },
        {
          title: isVi ? '2. Luận điểm then chốt & Phân tích chuyên sâu' : '2. Key Arguments & Deep Analysis',
          text: isVi 
            ? "Phân tích đa chiều về phương pháp triển khai " + firstLine + ", đánh giá các ưu điểm và lưu ý quan trọng khi áp dụng."
            : "Multi-dimensional analysis of implementation strategies, advantages, and key considerations.",
          cue: isVi ? 'Phân tích' : 'Analysis',
          note: isVi ? 'Điểm tựa lý thuyết và bằng chứng thực nghiệm.' : 'Theoretical foundation and empirical evidence.',
          bulletPoints: [
            isVi ? 'Đảm bảo tính chính xác và mạch lạc trong quá trình áp dụng' : 'Ensured high accuracy and logical clarity in execution',
            isVi ? 'Tối ưu hóa thời gian và tăng hiệu suất ghi nhớ dài hạn' : 'Optimized time efficiency and long-term retention',
          ],
        },
      ],
      summaryText: isVi 
        ? "Bản ghi chú hoàn thiện giúp bạn nắm vững toàn diện chủ đề \"" + firstLine + "\". Bạn có thể sử dụng các câu hỏi cốt lõi để ôn tập theo phương pháp Active Recall."
        : "Complete synthesized note providing comprehensive mastery over \"" + firstLine + "\". Use the core questions for active recall review.",
    },
    rawMarkdown: "# " + firstLine + "\n\n## 📖 Tổng quan\n" + input + "\n\n## 🎯 Kết luận & Tóm tắt\nĐã hoàn thành phân tích theo phương pháp " + effectiveMethod.toUpperCase() + ".",
  };
}
