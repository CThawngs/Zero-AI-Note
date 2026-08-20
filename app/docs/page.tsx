'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type ThemeMode = 'light' | 'dark';
type Language = 'vi' | 'en';

// ── Custom Scroll Reveal Hook (Zero Dependencies) ───────────────────────────
function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            observerRef.current?.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    return () => observerRef.current?.disconnect();
  }, []);

  const observe = (el: HTMLElement | null, delay = 0) => {
    if (!el || !observerRef.current) return;
    el.style.transitionDelay = `${delay}ms`;
    observerRef.current.observe(el);
  };

  return observe;
}

// ── i18n Dictionary ─────────────────────────────────────────────────────────
const i18n = {
  vi: {
    home: 'Trang chủ',
    login: 'Đăng nhập',
    toc: 'Mục lục tài liệu',
    badge: 'Tài liệu Kỹ thuật Chính thức',
    hero: 'Zero AI Note Documentation',
    heroSub: 'Hướng dẫn đầy đủ về cách sử dụng, kiến trúc kỹ thuật, hạn mức gói cước và tích hợp API của Zero AI Note.',
    cta: 'Bắt đầu miễn phí',
    ctaReady: 'Sẵn sàng dùng thử?',
    sections: ['Giới thiệu', 'Bắt đầu nhanh', 'AI Agent & Trích xuất File', 'Thư viện Ghi chú', 'Bảng giá & Hạn mức', 'Phương pháp ghi chú', 'Lưu trữ 30 ngày', 'Kiến trúc kỹ thuật', 'Bảo mật', 'Routing', 'API Endpoints', 'Liên kết'],
    intro: {
      title: 'Giới thiệu',
      p1: 'Zero AI Note là nền tảng ghi chú AI học thuật nguồn mở, chuyển đổi video, audio, PDF, YouTube thành các bài ghi chú cấu trúc cao theo các phương pháp chuẩn quốc tế.',
      p2: 'Dự án sử dụng Neon Postgres cho database (lưu trữ chính), JWT cho authentication, Cloudflare R2 làm backup storage, kiến trúc Living Note cập nhật trực tiếp trong phiên và Thư viện Ghi chú toàn diện.',
    },
    quickstart: {
      title: 'Bắt đầu nhanh',
      steps: [
        { text: 'Đăng ký tài khoản miễn phí', sub: 'Không cần thẻ tín dụng', linkText: 'Tạo tài khoản' },
        { text: 'Kéo thả file hoặc dán link YouTube vào khung chat', sub: 'Hỗ trợ video, audio, PDF, DOCX, TXT, MD, Code' },
        { text: 'Chọn phương pháp ghi chú', sub: 'Cornell, Outline, Q&A, Flashcard, Feynman, Tóm tắt nhanh' },
        { text: 'Tương tác & Xem kết quả trong Artifact Panel', sub: 'Cập nhật trực tiếp nội dung trong cùng phiên chat' },
        { text: 'Quản lý trong Thư viện Ghi chú (Notes)', sub: 'Xem chi tiết, tiếp tục chat, đổi tên, ghim, chia sẻ, lưu trữ' },
      ],
    },
    agent: {
      title: 'AI Agent Đa Chế Độ & Trích Xuất File Toàn Diện',
      desc: 'Hệ thống AI Agent thông minh tích hợp sâu đa mô hình LLM với khả năng tư duy và đọc hiểu tài liệu thực tế:',
      items: [
        { title: 'Trí Tuệ Hội Thoại & Lập Trình UI/UX', desc: 'AI tự nhận thức danh tính, mô hình đang chạy (Gemini, Claude, GPT, Groq,...), trả lời chuyên sâu và lập trình Frontend / UI-UX chuẩn clean code với Markdown & Code Blocks.' },
        { title: 'Tự Động Thu Thập Thông Tin (Autonomous Gathering)', desc: 'Khi người dùng yêu cầu tạo note nhưng thiếu tài liệu hoặc chủ đề, AI chủ động hỏi thăm và hướng dẫn bổ sung thông tin trước khi bắt đầu tạo.' },
        { title: 'Đọc Hiểu & Trích Xuất Tệp Đa Định Dạng', desc: 'Đọc trực tiếp nội dung từ file text, code, markdown (.txt, .md, .json, .py, .ts,...), tài liệu PDF, DOCX, video/audio transcripts và web/YouTube links.' },
        { title: 'Thanh Toán VietQR Tự Động 100% Zero-Click', desc: 'Quét mã VietQR Napas EMVCo qua app ngân hàng, hệ thống tự động nhận diện và nâng cấp gói cước sau 2-3s mà không cần nút xác nhận thủ công.' }
      ]
    },
    history: {
      title: 'Thư viện Ghi chú & Kiến trúc Living Note',
      desc: 'Quản lý toàn bộ bài ghi chú học thuật được AI tổng hợp với cơ chế cập nhật đè thông minh:',
      items: [
        { title: 'Kiến trúc Living Note (1 Session = 1 Note)', desc: 'Mọi yêu cầu chỉnh sửa, bổ sung trong cùng phiên chat được cập nhật trực tiếp vào file Note hiện tại, không gây sinh file rác.' },
        { title: 'Xem & Tiếp tục Chat', desc: 'Mở xem toàn bộ nội dung note hoặc tiếp tục chat đào sâu kiến thức với AI.' },
        { title: 'Cập nhật & Quản lý', desc: 'Đổi tên ghi chú, ghim các bài học quan trọng lên đầu danh sách.' },
        { title: 'Lưu trữ 30 ngày an toàn', desc: 'Chuyển vào Thùng rác & Lưu trữ với chính sách tự động xóa sau 30 ngày an toàn.' }
      ]
    },
    pricing: {
      title: 'Bảng giá & Phân cấp Hạn mức (Master Pricing Matrix)',
      desc: 'Phân cấp tính năng minh bạch theo 3 gói dịch vụ:',
      plans: [
        {
          name: 'Gói FREE (0đ)',
          badge: 'Khởi đầu',
          notes: 'Tối đa 20 Notes',
          templates: '3 templates nền tảng (Cornell, Outline, Tóm tắt)',
          custom: 'Tối đa 5 Custom Templates',
          preview: 'Markdown Rendered & Raw code',
          export: '3 định dạng cơ bản (.pdf, .docx, .md)',
          ai: 'Gemini 2.5 Flash mặc định / Tự kết nối AI (BYOK)'
        },
        {
          name: 'Gói PRO (99.000đ/tháng)',
          badge: '⚡ Phổ biến nhất',
          notes: 'Tối đa 50 Notes',
          templates: '9 templates tiêu chuẩn',
          custom: 'Tối đa 25 Custom Templates',
          preview: 'Static HTML Preview với CSS chuyên nghiệp',
          export: '4 định dạng chuẩn (PDF, DOCX, MD, HTML Webpage)',
          ai: 'Không giới hạn thời lượng, AI Engine tốc độ cao'
        },
        {
          name: 'Gói ULTRA (199.000đ/tháng)',
          badge: '👑 Tối thượng',
          notes: 'Không giới hạn Notes (∞)',
          templates: 'Toàn bộ 17 templates chuyên gia',
          custom: 'Không giới hạn Custom Templates (∞)',
          preview: 'Interactive Dynamic HTML Preview (JS, chart hover, animation)',
          export: 'Single-file Interactive HTML 100% offline, Checkbox Multi-Export & ZIP',
          ai: 'Ưu tiên xử lý cao cấp nhất & Hỗ trợ kỹ thuật 24/7'
        }
      ]
    },
    methods: {
      title: 'Hệ thống 17 Phương pháp ghi chú Chuẩn Học thuật',
      items: [
        { name: 'Cornell Method',        icon: 'view_agenda',          desc: 'Phân tách 2 cột Ý tưởng then chốt và Nội dung diễn giải, kèm Tóm tắt cuối bài tối ưu ôn thi.' },
        { name: 'Outline Framework',     icon: 'format_list_bulleted', desc: 'Cấu trúc cây phân cấp I, A, 1, a, lý tưởng cho tài liệu nghiên cứu và sách giáo trình chuyên sâu.' },
        { name: 'Tóm tắt tổng quan',    icon: 'bolt',                 desc: 'Phiên bản cô đọng nhất, trích xuất điểm cốt lõi, đọc hiểu chỉ trong 60 giây.' },
        { name: 'Tóm tắt Cuộc họp',     icon: 'groups',               desc: 'Trích xuất bối cảnh, thảo luận, quyết định và danh sách Action Items có người phụ trách.' },
        { name: 'Tóm tắt Bài giảng',     icon: 'school',               desc: 'Khái niệm, glossary thuật ngữ và liên kết dòng thời gian bài giảng.' },
        { name: 'Q&A Flashcard Matrix',  icon: 'quiz',                 desc: 'Chuyển đổi bài học thành định dạng Hỏi - Đáp tự trắc nghiệm năng lực ghi nhớ.' },
        { name: 'Boxing Method',         icon: 'grid_view',            desc: 'Khối Bento Box kiến thức độc lập: Khái niệm, Nguyên lý, Ví dụ minh họa, Cạm bẫy.' },
        { name: 'Charting Method',       icon: 'table_chart',          desc: 'Bảng ma trận so sánh đa chiều và phân loại đối tượng theo tiêu chí khoa học.' },
        { name: 'Feynman Technique',     icon: 'psychology',           desc: 'Đơn giản hóa kiến thức đa tầng: Bình dân học vụ → Ẩn dụ thực tế → Chuẩn học thuật.' },
        { name: 'First Principles',      icon: 'architecture',         desc: 'Tư duy nguyên lý cơ bản: Lọc bỏ giả định, giữ lại sự thật cốt lõi và tái cấu trúc từ đầu.' },
        { name: 'Syntopical Matrix',     icon: 'auto_stories',         desc: 'Phân tích tổng hợp đa tài liệu: Điểm đồng thuận, luận điểm tranh cãi, khoảng trống tri thức.' },
        { name: '5W1H & Actionable',     icon: 'checklist',            desc: 'Khung 5W1H, ma trận đánh giá rủi ro và lộ trình hành động có đo lường KPI cụ thể.' }
      ],
    },
    archives: {
      title: 'Chính sách Lưu trữ & Thùng rác 30 ngày',
      desc: 'Bảo vệ dữ liệu người dùng khỏi thao tác nhầm lẫn:',
      items: [
        { title: 'Lưu trữ 30 ngày tự động', desc: 'Ghi chú đưa vào mục Lưu trữ sẽ được giữ lại 30 ngày trước khi hệ thống tự động xóa vĩnh viễn.' },
        { title: 'Huy hiệu đếm ngược cảnh báo', desc: 'Hiển thị chính xác số ngày còn lại với màu sắc trực quan (Đỏ dưới 5 ngày, Vàng dưới 15 ngày).' },
        { title: 'Khôi phục 1-Click (Restore)', desc: 'Phục hồi bài ghi chú trở lại Thư viện Ghi chú ngay lập tức và hủy bỏ tiến trình xóa.' },
        { title: 'Xóa vĩnh viễn (Permanent Delete)', desc: 'Chủ động xóa vĩnh viễn trước thời hạn 30 ngày với popup xác nhận an toàn tuyệt đối.' }
      ]
    },
    tech: {
      title: 'Kiến trúc kỹ thuật',
      rows: [
        { label: 'Frontend',  value: 'Next.js 16, React 19, Tailwind CSS 4, Framer Motion, TypeScript' },
        { label: 'Database',  value: 'Neon Postgres serverless với RLS (Row-Level Security) & Drizzle ORM' },
        { label: 'Auth',      value: 'JWT (HS256) qua cookie HttpOnly, bcryptjs cho password hashing' },
        { label: 'Storage',   value: 'Cloudflare R2 (S3-compatible) — backup khi Neon database đầy' },
        { label: 'AI Engine', value: 'Google GenAI (Gemini 2.5 Flash), BYOK AI Providers (OpenAI, Anthropic, OpenRouter, Groq, NVIDIA, Ollama & Multi-Server Custom Endpoints)' },
        { label: 'Billing',   value: 'ZeroInvoice API VietQR Napas EMVCo, Hệ thống Coupon chiết khấu % tự động' },
      ],
    },
    security: {
      title: 'Bảo mật & Phân quyền',
      desc: 'Dữ liệu người dùng được bảo vệ bởi RLS (Row-Level Security) trên Neon Postgres. Mỗi user chỉ có thể truy cập dữ liệu của chính mình. API Key BYOK được bảo vệ nghiêm ngặt phía client/server và các Provider chính thức được khóa cứng endpoint chống chỉnh sửa sai lệch. Admin được xác thực qua biến môi trường',
      env: 'ADMIN_EMAIL',
      envSuffix: 'tại server-side.',
    },
    routing: {
      title: 'Routing & Điều hướng',
      rows: [
        { path: '/',     desc: 'Landing page (công khai). Đã đăng nhập → tự redirect về /app.' },
        { path: '/app',  desc: 'Dashboard chính (bắt buộc đăng nhập). Chưa đăng nhập → redirect về /.' },
        { path: '/docs', desc: 'Tài liệu kỹ thuật này (công khai, SEO-friendly).' },
      ],
    },
    api: {
      title: 'API Endpoints',
      rows: [
        { method: 'POST', path: '/api/auth/register',  desc: 'Đăng ký tài khoản. Tự gán role admin nếu email là ADMIN_EMAIL.' },
        { method: 'POST', path: '/api/auth/login',     desc: 'Đăng nhập, cấp cookie session JWT (7 ngày).' },
        { method: 'GET',  path: '/api/auth/session',   desc: 'Kiểm tra phiên đăng nhập hiện tại.' },
        { method: 'POST', path: '/api/providers/test', desc: 'Kiểm tra kết nối và xác thực API Key / Endpoint cho Cloud Providers và Custom Endpoints.' },
        { method: 'POST', path: '/api/notes/generate', desc: 'Tạo hoặc cập nhật đè (upsert) ghi chú AI theo phương pháp học thuật.' },
        { method: 'POST', path: '/api/notes/export',   desc: 'Xuất file ghi chú đa định dạng (DOCX, PDF, MD, HTML).' },
        { method: 'POST', path: '/api/billing/create-invoice', desc: 'Tạo hóa đơn thanh toán VietQR / Kích hoạt coupon 100% (0đ).' },
        { method: 'POST', path: '/api/billing/confirm', desc: 'Xác nhận thanh toán và nâng cấp gói subscription.' },
        { method: 'ANY',  path: '/api/admin/coupons',  desc: 'Quản lý mã khuyến mãi (%) dành riêng cho Admin.' },
        { method: 'GET',  path: '/api/health',         desc: 'Health check kết nối database Neon.' },
      ],
    },
    links: {
      title: 'Liên kết',
      items: [
        { href: '/',                                        icon: 'home',       label: 'Trang chủ',         sub: 'Landing page' },
        { href: '/app?screen=register',                     icon: 'person_add', label: 'Đăng ký tài khoản', sub: 'Bắt đầu miễn phí' },
        { href: '/app?screen=login',                        icon: 'login',      label: 'Đăng nhập',         sub: 'Truy cập dashboard' },
        { href: 'https://github.com/CThawngs/Zero-AI-Note', icon: 'code',      label: 'GitHub Repository',  sub: 'Nguồn mở · MIT License', external: true },
      ],
    },
    footer: '© 2026 Zero AI Note. Mọi quyền được bảo lưu.',
    backHome: 'Quay lại trang chủ',
  },
  en: {
    home: 'Home',
    login: 'Sign In',
    toc: 'Table of Contents',
    badge: 'Official Technical Documentation',
    hero: 'Zero AI Note Documentation',
    heroSub: 'Comprehensive guide to features, technical architecture, plan quotas, and API integration for Zero AI Note.',
    cta: 'Get started free',
    ctaReady: 'Ready to try it?',
    sections: ['Introduction', 'Quick Start', 'AI Agent & File Ingestion', 'Notes Library', 'Pricing & Quotas', 'Note Methods', '30-Day Retention', 'Tech Architecture', 'Security', 'Routing', 'API Endpoints', 'Links'],
    intro: {
      title: 'Introduction',
      p1: 'Zero AI Note is an open-source AI note-taking platform that transforms video, audio, PDF, and YouTube into interactive chat sessions and highly structured academic notes.',
      p2: 'Built on Neon Postgres serverless database (primary storage), JWT authentication, Cloudflare R2 backup storage, Living Note in-place update architecture, and a comprehensive Notes Library.',
    },
    quickstart: {
      title: 'Quick Start',
      steps: [
        { text: 'Create a free account', sub: 'No credit card required', linkText: 'Sign up' },
        { text: 'Drag & drop files or paste a YouTube link', sub: 'Supports video, audio, PDF, DOCX, TXT, MD, Code' },
        { text: 'Choose a note-taking method', sub: 'Cornell, Outline, Q&A, Flashcard, Feynman, Quick Summary' },
        { text: 'Interact & View results in Artifact Panel', sub: 'In-place updates within the same chat session' },
        { text: 'Manage in Notes Library', sub: 'Open details, resume chat, rename, pin, share, archive' },
      ],
    },
    agent: {
      title: 'Dual-Mode AI Agent & Full Document Extraction',
      desc: 'Intelligent AI Agent architecture powered by multi-LLM integration with deep contextual comprehension:',
      items: [
        { title: 'Conversational Intelligence & UI/UX Engineering', desc: 'Self-aware of active model (Gemini, Claude, GPT, Groq,...), provides in-depth technical explanations and clean frontend code with interactive Markdown code blocks.' },
        { title: 'Autonomous Information Gathering', desc: 'Proactively asks clarifying questions to gather missing topics or source materials before synthesizing structured notes.' },
        { title: 'Full Multi-Format File Ingestion', desc: 'Direct text extraction from code, markdown, text files (.txt, .md, .json, .py, .ts,...), PDF/Word documents, audio/video transcripts, and YouTube/Web URLs.' },
        { title: 'Zero-Click Automatic VietQR Payments', desc: 'Scan VietQR Napas EMVCo via mobile banking; the system auto-activates the upgrade in 2-3 seconds with zero manual confirmation.' }
      ]
    },
    history: {
      title: 'Notes Library & Living Note Architecture',
      desc: 'Centralized repository of all AI-synthesized academic notes with Living Note architecture:',
      items: [
        { title: 'Living Note Architecture (1 Session = 1 Note)', desc: 'All edits and expansions within the same chat session update the current note in-place without generating clutter.' },
        { title: 'View & Resume Chat', desc: 'Read complete structured notes or resume AI discussions in one click.' },
        { title: 'Update & Pin', desc: 'Rename notes, pin crucial study materials to the top of your list.' },
        { title: '30-Day Retention Archive', desc: 'Safely move old items to Trash & Archives with automatic 30-day purge protection.' }
      ]
    },
    pricing: {
      title: 'Pricing & Plan Quotas (Master Pricing Matrix)',
      desc: 'Transparent feature gating across three subscription tiers:',
      plans: [
        {
          name: 'FREE Tier (0đ)',
          badge: 'Starter',
          notes: 'Max 20 Notes',
          templates: '3 foundational templates (Cornell, Outline, Summary)',
          custom: 'Max 5 Custom Templates',
          preview: 'Markdown Rendered & Raw code',
          export: '3 basic formats (.pdf, .docx, .md)',
          ai: 'Default Gemini 2.5 Flash / BYOK Custom AI Keys'
        },
        {
          name: 'PRO Tier (99,000đ/mo - ~$4)',
          badge: '⚡ Most Popular',
          notes: 'Max 50 Notes',
          templates: '9 standard templates',
          custom: 'Max 25 Custom Templates',
          preview: 'Static HTML Preview with custom CSS',
          export: '4 formats (PDF, DOCX, MD, Webpage HTML)',
          ai: 'Unlimited processing length & High-speed AI engine'
        },
        {
          name: 'ULTRA Tier (199,000đ/mo - ~$8)',
          badge: '👑 Royal Ultra',
          notes: 'Unlimited Notes (∞)',
          templates: 'All 17 expert templates',
          custom: 'Unlimited Custom Templates (∞)',
          preview: 'Interactive Dynamic HTML Preview (JS, chart hover, animation)',
          export: 'Single-file Interactive HTML 100% offline, Checkbox Multi-Export & ZIP',
          ai: 'Highest priority processing & 24/7 dedicated support'
        }
      ]
    },
    methods: {
      title: '17 Academic Note-taking Frameworks',
      items: [
        { name: 'Cornell Method',        icon: 'view_agenda',          desc: '2-column separation for cues and notes with an overarching summary, optimal for exam prep.' },
        { name: 'Outline Framework',     icon: 'format_list_bulleted', desc: 'Hierarchical structure (I, A, 1, a) ideal for research papers and comprehensive textbooks.' },
        { name: 'Quick Summary',         icon: 'bolt',                 desc: 'The most condensed version — readable in just 60 seconds.' },
        { name: 'Meeting Synthesis',     icon: 'groups',               desc: 'Captures context, key discussions, decisions, and assigned Action Items.' },
        { name: 'Lecture Breakdown',     icon: 'school',               desc: 'Extracts core concepts, terminology glossary, and slide timeline references.' },
        { name: 'Q&A Flashcards',        icon: 'quiz',                 desc: 'Converts study material into self-testing Question & Answer matrices.' },
        { name: 'Boxing Method',         icon: 'grid_view',            desc: 'Bento Box blocks: Concept, Principles, Case Studies, Common Pitfalls.' },
        { name: 'Charting Matrix',       icon: 'table_chart',          desc: 'Multi-dimensional comparative tables and categorical classifications.' },
        { name: 'Feynman Technique',     icon: 'psychology',           desc: 'Multi-tier simplification: Plain Language → Analogy → Academic Depth.' },
        { name: 'First Principles',      icon: 'architecture',         desc: 'Deconstructs assumptions down to bedrock truths and rebuilds from scratch.' },
        { name: 'Syntopical Matrix',     icon: 'auto_stories',         desc: 'Multi-document synthesis: Shared keywords, consensus points, dissents.' },
        { name: '5W1H & Actionable',     icon: 'checklist',            desc: '5W1H analysis, risk matrix, and actionable KPI execution plan.' }
      ],
    },
    archives: {
      title: '30-Day Retention & Recovery Policy',
      desc: 'Built-in safeguards against accidental deletions:',
      items: [
        { title: 'Automatic 30-Day Retention', desc: 'Archived notes stay in Trash & Archives for 30 days before permanent purging.' },
        { title: 'Urgency Countdown Badges', desc: 'Real-time countdown indicators (Red < 5d, Yellow < 15d) for complete visibility.' },
        { title: '1-Click Restore', desc: 'Restore notes back to your Notes Library in one click and halt the purge timer.' },
        { title: 'Permanent Purge', desc: 'Instantly purge items before 30 days with a secure confirmation dialog.' }
      ]
    },
    tech: {
      title: 'Technical Architecture',
      rows: [
        { label: 'Frontend',  value: 'Next.js 16, React 19, Tailwind CSS 4, Framer Motion, TypeScript' },
        { label: 'Database',  value: 'Neon Postgres serverless with RLS (Row-Level Security) & Drizzle ORM' },
        { label: 'Auth',      value: 'JWT (HS256) via HttpOnly cookie, bcryptjs for password hashing' },
        { label: 'Storage',   value: 'Cloudflare R2 (S3-compatible) — backup when Neon database is full' },
        { label: 'AI Engine', value: 'Google GenAI (Gemini 2.5 Flash), BYOK AI Providers (OpenAI, Anthropic, OpenRouter, Groq, NVIDIA, Ollama & Multi-Server Custom Endpoints)' },
        { label: 'Billing',   value: 'ZeroInvoice API VietQR Napas EMVCo, Percentage-only (%) dynamic coupon system' },
      ],
    },
    security: {
      title: 'Security & Access Control',
      desc: 'User data is protected by RLS (Row-Level Security) on Neon Postgres. Each user can only access their own data. BYOK API Keys are secured client/server-side and official provider endpoints are strictly locked against misconfiguration. Admin is authenticated via the',
      env: 'ADMIN_EMAIL',
      envSuffix: 'server-side environment variable.',
    },
    routing: {
      title: 'Routing & Navigation',
      rows: [
        { path: '/',     desc: 'Landing page (public). Logged in → auto-redirect to /app.' },
        { path: '/app',  desc: 'Main Dashboard (login required). Not logged in → redirect to /.' },
        { path: '/docs', desc: 'This documentation (public, SEO-friendly).' },
      ],
    },
    api: {
      title: 'API Endpoints',
      rows: [
        { method: 'POST', path: '/api/auth/register',  desc: 'Register account. Auto-assigns admin role if email matches ADMIN_EMAIL.' },
        { method: 'POST', path: '/api/auth/login',     desc: 'Login, sets JWT session cookie (7 days).' },
        { method: 'GET',  path: '/api/auth/session',   desc: 'Check current session.' },
        { method: 'POST', path: '/api/providers/test', desc: 'Test and validate connection for cloud providers and custom AI endpoints.' },
        { method: 'POST', path: '/api/notes/generate', desc: 'Create or update (upsert) academic note artifact in-place.' },
        { method: 'POST', path: '/api/notes/export',   desc: 'Export structured notes to DOCX, PDF, MD, or HTML.' },
        { method: 'POST', path: '/api/billing/create-invoice', desc: 'Create VietQR invoice / 100% coupon instant activation.' },
        { method: 'POST', path: '/api/billing/confirm', desc: 'Confirm payment and upgrade subscription tier.' },
        { method: 'ANY',  path: '/api/admin/coupons',  desc: 'CRUD Percentage Coupons. Admin only — 403 for regular users.' },
        { method: 'GET',  path: '/api/health',         desc: 'Database connection health check.' },
      ],
    },
    links: {
      title: 'Links',
      items: [
        { href: '/',                                        icon: 'home',       label: 'Home',               sub: 'Landing page' },
        { href: '/app?screen=register',                     icon: 'person_add', label: 'Create Account',     sub: 'Get started free' },
        { href: '/app?screen=login',                        icon: 'login',      label: 'Sign In',            sub: 'Access dashboard' },
        { href: 'https://github.com/CThawngs/Zero-AI-Note', icon: 'code',      label: 'GitHub Repository',  sub: 'Open source · MIT License', external: true },
      ],
    },
    footer: '© 2026 Zero AI Note. All rights reserved.',
    backHome: 'Back to home',
  },
};

const sectionIds = ['intro', 'quickstart', 'ai-agent', 'history', 'pricing', 'methods', 'archives', 'tech', 'security', 'routing', 'api', 'links'];

const methodColor: Record<string, string> = {
  POST: 'text-emerald-400 bg-emerald-400/10',
  GET:  'text-sky-400 bg-sky-400/10',
  ANY:  'text-violet-400 bg-violet-400/10',
};
const methodColorLight: Record<string, string> = {
  POST: 'text-emerald-700 bg-emerald-50',
  GET:  'text-sky-700 bg-sky-50',
  ANY:  'text-violet-700 bg-violet-50',
};

export default function DocsPage() {
  const [theme,         setTheme]         = useState<ThemeMode>('light');
  const [lang,          setLang]          = useState<Language>('vi');
  const [mounted,       setMounted]       = useState(false);
  const [activeSection, setActiveSection] = useState('intro');
  const [tocOpen,       setTocOpen]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const observe = useScrollReveal();

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('zero-note-theme') as ThemeMode;
      const savedLang  = localStorage.getItem('zero-note-lang')  as Language;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.className = savedTheme === 'dark' ? 'dark' : 'light';
      } else {
        document.documentElement.className = 'light';
      }
      if (savedLang) setLang(savedLang);
    } catch {}
    setMounted(true);
  }, []);

  // IntersectionObserver for active section highlight
  useEffect(() => {
    if (!mounted) return;
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.25, rootMargin: '-80px 0px -50% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [mounted]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('zero-note-theme', next);
      document.documentElement.className = next === 'dark' ? 'dark' : 'light';
    } catch {}
  };

  const toggleLang = () => {
    const next = lang === 'vi' ? 'en' : 'vi';
    setLang(next);
    try {
      localStorage.setItem('zero-note-lang', next);
    } catch {}
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
    setMobileMenuOpen(false);
  };

  const isDark = theme === 'dark';
  const t = i18n[lang];

  // ── Style tokens ─────────────────────────────────────────────────────────
  const bg      = isDark ? 'bg-[#0a0a0a] text-white'        : 'bg-white text-black';
  const surface = isDark ? 'bg-[#0f0f0f]'                   : 'bg-gray-50';
  const border  = isDark ? 'border-white/10'                 : 'border-gray-200';
  const muted   = isDark ? 'text-neutral-400'                : 'text-gray-500';
  const code    = isDark ? 'bg-white/8 text-neutral-300'     : 'bg-gray-100 text-gray-700';
  const hdr     = isDark ? 'bg-[#0a0a0a]/90 border-white/10' : 'bg-white/90 border-gray-200';
  const reveal: React.CSSProperties = {
    opacity: 0,
    transform: 'translateY(22px)',
    transition: 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)',
  };

  // shared toggle pill (lang + theme)
  const togglePill = `flex items-center gap-1 rounded-lg border px-1 py-0.5 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-100'}`;
  const toggleBtn  = `text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-200 ${isDark ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-white'}`;
  const dividerV   = `w-px h-3.5 ${isDark ? 'bg-white/15' : 'bg-gray-300'}`;

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 overflow-x-hidden ${bg}`}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-300 ${hdr}`}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 max-w-7xl mx-auto">

          {/* Logo */}
          <Link href="/" className={`flex items-center gap-2 font-bold text-base sm:text-lg shrink-0 transition-opacity hover:opacity-80 ${isDark ? 'text-white' : 'text-black'}`}>
            <img src="/logo.png" alt="Zero AI Note Logo" className="w-7 h-7 rounded-full object-contain shrink-0" />
            <span className="hidden xs:inline sm:inline">Zero AI Note</span>
          </Link>

          {/* Desktop nav (sm+) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Back to home pill */}
            <Link
              href="/"
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                isDark
                  ? 'border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:text-black hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-outlined leading-none" style={{ fontSize: '16px' }}>arrow_back</span>
              <span>{t.home}</span>
            </Link>

            {/* Lang + Theme grouped pill */}
            <div className={togglePill}>
              <button onClick={toggleLang} className={toggleBtn} title="Switch Language">
                {lang === 'vi' ? 'VI' : 'EN'}
              </button>
              <div className={dividerV} />
              <button
                onClick={toggleTheme}
                className={`p-1 rounded-md transition-all duration-200 flex items-center justify-center ${isDark ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-white'}`}
                aria-label="Toggle theme"
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '17px' }}>
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>

            {/* Login CTA */}
            <Link
              href="/app?screen=login"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              {t.login}
            </Link>
          </div>

          {/* Mobile hamburger (< sm) */}
          <button
            className={`sm:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              isDark ? 'text-neutral-200 hover:bg-white/8' : 'text-gray-800 hover:bg-gray-100'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: '22px' }}>
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className={`sm:hidden ${isDark ? 'bg-[#0d0d0d] border-white/8' : 'bg-white border-gray-100'} border-t`}>
            <div className="px-3 pt-3 pb-1 space-y-0.5">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  isDark ? 'text-neutral-200 hover:bg-white/6' : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>home</span>
                </span>
                <span className="text-[15px] font-medium flex-1">{t.home}</span>
                <span className="material-symbols-outlined leading-none opacity-30" style={{ fontSize: '14px' }}>chevron_right</span>
              </Link>
              <Link
                href="/app?screen=login"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  isDark ? 'text-neutral-200 hover:bg-white/6' : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>login</span>
                </span>
                <span className="text-[15px] font-medium flex-1">{t.login}</span>
                <span className="material-symbols-outlined leading-none opacity-30" style={{ fontSize: '14px' }}>chevron_right</span>
              </Link>
            </div>

            <div className={`mx-4 my-2 h-px ${isDark ? 'bg-white/8' : 'bg-gray-100'}`} />

            <div className="px-4 py-2 flex items-center gap-2">
              <button
                onClick={toggleLang}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                  isDark ? 'bg-white/6 text-neutral-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '15px' }}>language</span>
                <span>{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
              </button>
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={`w-10 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors ${
                  isDark ? 'bg-white/6 text-neutral-300 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>

            <div className="px-4 pt-1 pb-4">
              <Link
                href="/app?screen=register"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                  isDark ? 'bg-white text-black' : 'bg-black text-white'
                }`}
              >
                <span>{t.cta}</span>
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '16px' }}>arrow_forward</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ══ BODY WRAPPER ═════════════════════════════════════════════════════ */}
      <div className="pt-14 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex gap-8 lg:gap-12">

          {/* ── Left Sidebar (TOC) — xl+ ─────────────────────────────────── */}
          <aside className="hidden xl:block w-64 shrink-0 py-8 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              <p className={`text-[11px] font-bold uppercase tracking-wider px-3 mb-3 ${muted}`}>{t.toc}</p>
              {sectionIds.map((id, idx) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
                    activeSection === id
                      ? isDark
                        ? 'bg-white/10 text-white font-semibold'
                        : 'bg-black/5 text-black font-semibold'
                      : isDark
                        ? 'text-neutral-400 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-black hover:bg-gray-100'
                  }`}
                >
                  {t.sections[idx]}
                </button>
              ))}
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 pt-8 pb-24">

            {/* TOC accordion — below xl */}
            <div className="xl:hidden mb-6">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  isDark ? 'border-white/10 bg-white/5 text-neutral-300' : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>toc</span>
                <span>{t.toc}</span>
                <span
                  className={`material-symbols-outlined ml-auto leading-none transition-transform duration-200 ${tocOpen ? 'rotate-180' : ''}`}
                  style={{ fontSize: '18px' }}
                >expand_more</span>
              </button>
              {tocOpen && (
                <div className={`mt-1 rounded-xl border overflow-hidden ${isDark ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-white'}`}>
                  {sectionIds.map((id, idx) => (
                    <button
                      key={id}
                      onClick={() => scrollTo(id)}
                      className={`w-full text-left px-4 py-2.5 text-[13px] font-medium border-b last:border-b-0 transition-colors ${
                        activeSection === id
                          ? isDark ? 'bg-white/8 text-white' : 'bg-gray-100 text-black'
                          : isDark ? 'border-white/5 text-neutral-300 hover:bg-white/5' : 'border-gray-100 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t.sections[idx]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <div ref={(el) => observe(el, 0)} style={reveal} className="mb-10 sm:mb-12">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-4 ${isDark ? 'bg-white/5 border-white/10 text-neutral-400' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '14px' }}>menu_book</span>
                {t.badge}
              </div>
              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                {t.hero}
              </h1>
              <p className={`text-sm sm:text-base leading-relaxed max-w-2xl ${muted}`}>{t.heroSub}</p>
            </div>

            {/* ── 1. Introduction ───────────────────────────────────────── */}
            <section id="intro" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.intro.title}</h2>
              <div ref={(el) => observe(el, 80)} style={reveal} className={`rounded-2xl border p-5 sm:p-6 ${surface} ${border}`}>
                <p className={`text-sm sm:text-base leading-relaxed mb-3 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  <strong className={isDark ? 'text-white' : 'text-black'}>Zero AI Note</strong> {t.intro.p1.replace('Zero AI Note ', '')}
                </p>
                <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{t.intro.p2}</p>
              </div>
            </section>

            {/* ── 2. Quick Start ────────────────────────────────────────── */}
            <section id="quickstart" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.quickstart.title}</h2>
              <div className="space-y-2.5">
                {t.quickstart.steps.map((item, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 60)}
                    style={reveal}
                    className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] ${surface} ${border}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{item.text}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{item.sub}</p>
                    </div>
                    {i === 0 && 'linkText' in item && (
                      <Link href="/app?screen=register" className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap transition-colors ${isDark ? 'bg-white/8 text-neutral-300 hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {(item as any).linkText}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── 3. AI Agent & Document Ingestion ───────────────────────── */}
            <section id="ai-agent" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.agent.title}</h2>
              <p className={`text-xs sm:text-sm mb-4 leading-relaxed ${muted}`}>{t.agent.desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {t.agent.items.map((item, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 60)}
                    style={reveal}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${surface} ${border}`}
                  >
                    <h3 className={`text-sm font-bold mb-1.5 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${muted}`}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 4. Notes Library & Living Note ────────────────────────── */}
            <section id="history" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.history.title}</h2>
              <p className={`text-xs sm:text-sm mb-4 leading-relaxed ${muted}`}>{t.history.desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {t.history.items.map((item, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 60)}
                    style={reveal}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${surface} ${border}`}
                  >
                    <h3 className={`text-sm font-bold mb-1.5 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${muted}`}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 4. Pricing & Master Matrix ────────────────────────────── */}
            <section id="pricing" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.pricing.title}</h2>
              <p className={`text-xs sm:text-sm mb-4 leading-relaxed ${muted}`}>{t.pricing.desc}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {t.pricing.plans.map((p, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 80)}
                    style={reveal}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${surface} ${border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{p.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">{p.badge}</span>
                      </div>
                      <div className="space-y-2 text-xs divide-y divide-white/5 pt-2">
                        <div className="pt-1.5"><span className="font-semibold block text-[11px] opacity-70">Dung lượng:</span> {p.notes}</div>
                        <div className="pt-1.5"><span className="font-semibold block text-[11px] opacity-70">Templates có sẵn:</span> {p.templates}</div>
                        <div className="pt-1.5"><span className="font-semibold block text-[11px] opacity-70">Custom Templates:</span> {p.custom}</div>
                        <div className="pt-1.5"><span className="font-semibold block text-[11px] opacity-70">Xem trước:</span> {p.preview}</div>
                        <div className="pt-1.5"><span className="font-semibold block text-[11px] opacity-70">Xuất file:</span> {p.export}</div>
                        <div className="pt-1.5"><span className="font-semibold block text-[11px] opacity-70">AI Engine:</span> {p.ai}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 5. Note Methods ───────────────────────────────────────── */}
            <section id="methods" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.methods.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {t.methods.items.map((m, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 40)}
                    style={reveal}
                    className={`p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] ${surface} ${border}`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-lg ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                        <span className="material-symbols-outlined leading-none" style={{ fontSize: '16px' }}>{m.icon}</span>
                      </span>
                      <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>{m.name}</h3>
                    </div>
                    <p className={`text-[11px] sm:text-xs leading-relaxed ${muted}`}>{m.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 6. 30-Day Trash & Retention ───────────────────────────── */}
            <section id="archives" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.archives.title}</h2>
              <p className={`text-xs sm:text-sm mb-4 leading-relaxed ${muted}`}>{t.archives.desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {t.archives.items.map((item, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 60)}
                    style={reveal}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${surface} ${border}`}
                  >
                    <h3 className={`text-sm font-bold mb-1.5 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${muted}`}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 7. Tech Architecture ──────────────────────────────────── */}
            <section id="tech" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.tech.title}</h2>
              <div ref={(el) => observe(el, 80)} style={reveal} className={`rounded-2xl border overflow-hidden ${border}`}>
                {t.tech.rows.map((row, i) => (
                  <div key={i} className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-4 sm:px-5 py-3 border-b last:border-b-0 ${border} ${isDark ? i % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-white/3' : i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wide shrink-0 sm:w-24 sm:pt-0.5 ${muted}`}>{row.label}</span>
                    <span className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-200' : 'text-gray-800'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 8. Security ───────────────────────────────────────────── */}
            <section id="security" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.security.title}</h2>
              <div ref={(el) => observe(el, 80)} style={reveal} className={`rounded-2xl border p-5 sm:p-6 ${surface} ${border}`}>
                <div className="flex items-start gap-3">
                  <span className={`material-symbols-outlined mt-0.5 shrink-0 ${muted}`} style={{ fontSize: '20px' }}>shield</span>
                  <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    {t.security.desc}{' '}
                    <code className={`px-1.5 py-0.5 rounded text-[12px] sm:text-[13px] font-mono ${code}`}>{t.security.env}</code>
                    {' '}{t.security.envSuffix}
                  </p>
                </div>
              </div>
            </section>

            {/* ── 9. Routing ────────────────────────────────────────────── */}
            <section id="routing" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.routing.title}</h2>
              <div ref={(el) => observe(el, 80)} style={reveal} className={`rounded-2xl border overflow-hidden ${border}`}>
                {t.routing.rows.map((r, i) => (
                  <div key={i} className={`flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 px-4 sm:px-5 py-3 border-b last:border-b-0 ${border} ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    <code className={`text-[11px] sm:text-[12px] font-mono font-semibold shrink-0 ${code} px-2 py-0.5 rounded`}>{r.path}</code>
                    <span className={`text-xs sm:text-sm ${muted}`}>{r.desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 10. API Endpoints ─────────────────────────────────────── */}
            <section id="api" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.api.title}</h2>
              <div ref={(el) => observe(el, 80)} style={reveal} className={`rounded-2xl border overflow-hidden ${border}`}>
                {t.api.rows.map((r, i) => {
                  const badgeCls = isDark
                    ? methodColor[r.method] || 'text-neutral-400 bg-white/5'
                    : methodColorLight[r.method] || 'text-gray-700 bg-gray-100';
                  return (
                    <div key={i} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3.5 border-b last:border-b-0 ${border} ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${badgeCls}`}>{r.method}</span>
                        <code className={`text-[11px] sm:text-[12px] font-mono font-semibold ${code} px-2 py-0.5 rounded`}>{r.path}</code>
                      </div>
                      <span className={`text-xs sm:text-sm ${muted}`}>{r.desc}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── 11. Links ─────────────────────────────────────────────── */}
            <section id="links" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.links.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {t.links.items.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    target={'external' in link ? '_blank' : undefined}
                    rel={'external' in link ? 'noopener noreferrer' : undefined}
                    ref={(el) => observe(el, i * 60)}
                    style={reveal}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.02] cursor-pointer group ${surface} ${border}`}
                  >
                    <span className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 ${isDark ? 'bg-white/8 text-white' : 'bg-gray-100 text-black'}`}>
                      <span className="material-symbols-outlined leading-none" style={{ fontSize: '20px' }}>{link.icon}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold group-hover:underline ${isDark ? 'text-white' : 'text-black'}`}>{link.label}</p>
                      <p className={`text-xs ${muted}`}>{link.sub}</p>
                    </div>
                    <span className="material-symbols-outlined leading-none opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ fontSize: '18px' }}>
                      {'external' in link ? 'open_in_new' : 'arrow_forward'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <footer className={`pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${border} ${muted}`}>
              <p>{t.footer}</p>
              <Link href="/" className={`font-semibold hover:underline ${isDark ? 'text-white' : 'text-black'}`}>
                {t.backHome} →
              </Link>
            </footer>

          </main>
        </div>
      </div>
    </div>
  );
}