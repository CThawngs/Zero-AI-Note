'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ScreenType, 
  NoteItem, 
  TemplateItem, 
  SourceFileItem, 
  CouponItem, 
  AIProviderItem, 
  PaymentRecord, 
  UserProfile, 
  ToastMessage, 
  NoteMethod, 
  ChatMessage,
  ColorPalette
} from '../types';
import { 
  initialUserProfile, 
  initialNotes, 
  initialArchivedNotes, 
  initialTemplates, 
  initialSourceFiles, 
  initialCoupons, 
  initialAIProviders, 
  initialPaymentRecords 
} from '../data/mockData';
import { translations, Language, Theme } from '../i18n/translations';
import { THEME_OPTIONS } from '../utils/themeTokens';

type TranslationKey = keyof typeof translations.vi;

interface AppContextType {
  // Theme, Palette & Language
  colorPalette: ColorPalette;
  setColorPalette: (palette: ColorPalette) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;

  // Responsive & Sidebar layout
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;

  // Navigation & User
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  upgradeToPro: () => void;
  upgradeToUltra: () => void;
  downgradePlan: () => void;
  
  // Notes
  notes: NoteItem[];
  archivedNotes: NoteItem[];
  activeNote: NoteItem | null;
  setActiveNote: (note: NoteItem | null) => void;
  openNoteDetail: (note: NoteItem) => void;
  archiveNote: (noteId: string) => void;
  restoreNote: (noteId: string) => void;
  deleteNotePermanently: (noteId: string) => void;
  renameNote: (noteId: string, newTitle: string) => void;
  
  // Library View States
  libraryFilter: string;
  setLibraryFilter: (filter: string) => void;
  librarySort: string;
  setLibrarySort: (sort: string) => void;
  librarySearchQuery: string;
  setLibrarySearchQuery: (query: string) => void;
  libraryViewMode: 'grid' | 'list';
  setLibraryViewMode: (mode: 'grid' | 'list') => void;
  libraryActiveTab: 'my-notes' | 'shared';
  setLibraryActiveTab: (tab: 'my-notes' | 'shared') => void;
  focusSearchInput: boolean;
  setFocusSearchInput: (focus: boolean) => void;

  // Templates
  templates: TemplateItem[];
  addCustomTemplate: (title: string, description: string, prompt?: string) => void;
  useTemplateInChat: (template: TemplateItem) => void;

  // Files
  files: SourceFileItem[];
  addSourceFile: (name: string, size: string, type: 'pdf' | 'video' | 'audio' | 'image' | 'doc') => void;
  deleteSourceFile: (fileId: string) => void;

  // AI Providers
  aiProviders: AIProviderItem[];
  addAIProvider: (provider: Omit<AIProviderItem, 'id' | 'latencyMs' | 'status'>) => void;
  toggleProviderStatus: (providerId: string) => void;
  deleteAIProvider: (providerId: string) => void;
  updateAIProvider: (providerId: string, updates: Partial<AIProviderItem>) => void;

  // Coupons & Admin
  coupons: CouponItem[];
  addCoupon: (coupon: Omit<CouponItem, 'id' | 'usedCount'>) => void;
  updateCoupon: (couponId: string, data: Partial<CouponItem>) => void;
  deleteCoupon: (couponId: string) => void;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string; discountPercent?: number }>;
  removeAppliedCoupon: () => void;

  // Payments
  paymentHistory: PaymentRecord[];

  // Chat & AI Generation
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  selectedMethod: NoteMethod;
  setSelectedMethod: (method: NoteMethod) => void;
  autoSelectedMethod: NoteMethod;
  chatMessages: ChatMessage[];
  isProcessingChat: boolean;
  processingStep: number;
  startNewChatNote: (customPrompt?: string) => void;
  sendChatMessage: (text: string, attachedSources?: { type: 'pdf' | 'youtube' | 'doc'; name: string }[]) => void;
  
  // Artifact Panel
  activeArtifactNote: NoteItem | null;
  setActiveArtifactNote: (note: NoteItem | null) => void;
  isArtifactOpen: boolean;
  setIsArtifactOpen: (open: boolean) => void;
  isArtifactFullscreen: boolean;
  setIsArtifactFullscreen: (fullscreen: boolean) => void;

  // Settings tab
  settingsActiveTab: 'account' | 'appearance' | 'ai-providers' | 'notifications';
  setSettingsActiveTab: (tab: 'account' | 'appearance' | 'ai-providers' | 'notifications') => void;

  // Global Toasts
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;

  // Screen Loading skeleton helper
  isLoadingScreen: boolean;
  triggerScreenLoading: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme & Language states with local storage caching (guard for SSR/Next.js prerender)
  const getLocal = (key: string) => {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  };

  // Default is Theme "Giấy" (paper) in Dark mode as requested
  const [colorPalette, setColorPaletteState] = useState<ColorPalette>(() => {
    return (getLocal('zero_ai_palette') as ColorPalette) || 'paper';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    return (getLocal('zero_ai_theme') as Theme) || 'dark';
  });
  
  const [language, setLanguageState] = useState<Language>(() => {
    return (getLocal('zero_ai_lang') as Language) || 'vi';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Sync color palette and theme mode to documentElement
  useEffect(() => {
    localStorage.setItem('zero_ai_palette', colorPalette);
    document.documentElement.setAttribute('data-theme', colorPalette);
  }, [colorPalette]);

  // Sync theme dark/light class to document body
  useEffect(() => {
    localStorage.setItem('zero_ai_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Sync language
  useEffect(() => {
    localStorage.setItem('zero_ai_lang', language);
  }, [language]);

  const setColorPalette = (newPalette: ColorPalette) => {
    setColorPaletteState(newPalette);
    const targetOpt = THEME_OPTIONS.find(t => t.id === newPalette);
    const themeName = language === 'vi' ? targetOpt?.nameVi : targetOpt?.nameEn;
    addToast(
      language === 'vi' ? 'Đã đổi Theme' : 'Theme Switched',
      language === 'vi' ? `Bảng màu: ${themeName || newPalette}` : `Palette: ${themeName || newPalette}`,
      'info'
    );
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    addToast(
      language === 'vi' ? 'Đã đổi giao diện' : 'Theme mode updated',
      newTheme === 'dark' 
        ? (language === 'vi' ? 'Chế độ Tối (Dark)' : 'Dark Mode') 
        : (language === 'vi' ? 'Chế độ Sáng (Light)' : 'Light Mode'),
      'info'
    );
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    addToast(
      newLang === 'vi' ? 'Đã chuyển ngôn ngữ' : 'Language switched',
      newLang === 'vi' ? 'Tiếng Việt' : 'English',
      'info'
    );
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.vi;
    const val = dict[key] !== undefined ? dict[key] : (translations.vi[key] || key);
    return Array.isArray(val) ? String(val[0]) : val;
  };

  const [currentScreen, setCurrentScreenState] = useState<ScreenType>('chat');
  const [user, setUser] = useState<UserProfile>(initialUserProfile);
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [archivedNotes, setArchivedNotes] = useState<NoteItem[]>(initialArchivedNotes);
  const [activeNote, setActiveNote] = useState<NoteItem | null>(initialNotes[0]);
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [files, setFiles] = useState<SourceFileItem[]>(initialSourceFiles);
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [aiProviders, setAIProviders] = useState<AIProviderItem[]>(initialAIProviders);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(initialPaymentRecords);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoadingScreen, setIsLoadingScreen] = useState<boolean>(false);

  // Library states
  const [libraryFilter, setLibraryFilter] = useState<string>('all');
  const [librarySort, setLibrarySort] = useState<string>('recent');
  const [librarySearchQuery, setLibrarySearchQuery] = useState<string>('');
  const [libraryViewMode, setLibraryViewMode] = useState<'grid' | 'list'>('grid');
  const [libraryActiveTab, setLibraryActiveTab] = useState<'my-notes' | 'shared'>('my-notes');
  const [focusSearchInput, setFocusSearchInput] = useState<boolean>(false);

  // Settings
  const [settingsActiveTab, setSettingsActiveTab] = useState<'account' | 'appearance' | 'ai-providers' | 'notifications'>('account');

  // AI & Chat States
  const [selectedModel, setSelectedModel] = useState<string>('Claude 3.5 Sonnet');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Tiếng Việt');
  const [selectedMethod, setSelectedMethod] = useState<NoteMethod>('auto');
  const [autoSelectedMethod, setAutoSelectedMethod] = useState<NoteMethod>('cornell');
  const [isProcessingChat, setIsProcessingChat] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(0);

  // Artifact
  const [activeArtifactNote, setActiveArtifactNote] = useState<NoteItem | null>(initialNotes[0]);
  const [isArtifactOpen, setIsArtifactOpen] = useState<boolean>(true);
  const [isArtifactFullscreen, setIsArtifactFullscreen] = useState<boolean>(false);

  // Chat conversation
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: 'Xin chào. Kéo thả file PDF, link bài viết hoặc video vào đây để tôi tạo ghi chú cấu trúc cao cho bạn.',
      timestamp: '14:28'
    },
    {
      id: 'msg_sample_user',
      sender: 'user',
      text: 'Tạo note Cornell cho file bài giảng này và video phân tích lạm phát.',
      timestamp: '14:29',
      attachments: [
        { type: 'pdf', name: 'Macro_Econ_Lec1.pdf' },
        { type: 'youtube', name: 'Inflation_Analysis_Vid.mp4' }
      ]
    },
    {
      id: 'msg_sample_ai_ask',
      sender: 'ai',
      text: 'Bạn muốn note theo phương pháp nào? Cornell, Outline, hay Tóm tắt nhanh?',
      timestamp: '14:29'
    }
  ]);

  const addToast = (title: string, description?: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerScreenLoading = () => {
    setIsLoadingScreen(true);
    setTimeout(() => {
      setIsLoadingScreen(false);
    }, 400);
  };

  const setCurrentScreen = (screen: ScreenType) => {
    triggerScreenLoading();
    setCurrentScreenState(screen);
    setIsMobileSidebarOpen(false); // Close mobile drawer when navigating
  };

  const openNoteDetail = (note: NoteItem) => {
    setActiveNote(note);
    setActiveArtifactNote(note);
    setCurrentScreen('note-detail');
  };

  const startNewChatNote = (customPrompt?: string) => {
    const welcomeTxt = language === 'vi' 
      ? 'Xin chào. Kéo thả file PDF, link bài viết hoặc video vào đây để tôi tạo ghi chú cấu trúc cao cho bạn.'
      : 'Hello. Drag & drop PDF files, article links, or YouTube videos here to create high-structure notes.';
    
    setChatMessages([
      {
        id: 'msg_welcome_' + Date.now(),
        sender: 'ai',
        text: welcomeTxt,
        timestamp: language === 'vi' ? 'Vừa xong' : 'Just now'
      }
    ]);
    setIsProcessingChat(false);
    setProcessingStep(0);
    setIsArtifactOpen(false);
    setCurrentScreen('chat');

    if (customPrompt) {
      setTimeout(() => {
        sendChatMessage(customPrompt);
      }, 300);
    }
  };

  const archiveNote = (noteId: string) => {
    const target = notes.find(n => n.id === noteId);
    if (!target) return;
    setNotes(prev => prev.filter(n => n.id !== noteId));
    setArchivedNotes(prev => [{ ...target, isArchived: true, archiveDaysLeft: 30 }, ...prev]);
    addToast(
      language === 'vi' ? 'Đã lưu trữ' : 'Archived', 
      language === 'vi' ? `Đã chuyển "${target.title}" vào mục Lưu trữ.` : `Moved "${target.title}" to Archives.`
    );
  };

  const restoreNote = (noteId: string) => {
    const target = archivedNotes.find(n => n.id === noteId);
    if (!target) return;
    setArchivedNotes(prev => prev.filter(n => n.id !== noteId));
    setNotes(prev => [{ ...target, isArchived: false }, ...prev]);
    addToast(
      language === 'vi' ? 'Khôi phục thành công' : 'Restored successfully', 
      language === 'vi' ? `"${target.title}" đã được đưa trở lại Thư viện.` : `"${target.title}" returned to Library.`
    );
  };

  const deleteNotePermanently = (noteId: string) => {
    setArchivedNotes(prev => prev.filter(n => n.id !== noteId));
    setNotes(prev => prev.filter(n => n.id !== noteId));
    addToast(
      language === 'vi' ? 'Đã xoá vĩnh viễn' : 'Permanently Deleted', 
      language === 'vi' ? 'Ghi chú đã được xoá hoàn toàn khỏi hệ thống.' : 'Note has been completely removed.',
      'info'
    );
  };

  const renameNote = (noteId: string, newTitle: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: newTitle } : n));
    if (activeNote && activeNote.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, title: newTitle } : null);
    }
    if (activeArtifactNote && activeArtifactNote.id === noteId) {
      setActiveArtifactNote(prev => prev ? { ...prev, title: newTitle } : null);
    }
    addToast(
      language === 'vi' ? 'Đã đổi tên' : 'Renamed', 
      language === 'vi' ? `Ghi chú đã được cập nhật thành "${newTitle}".` : `Note updated to "${newTitle}".`
    );
  };

  const addCustomTemplate = (title: string, description: string, prompt?: string) => {
    const newTmpl: TemplateItem = {
      id: 'tmpl_' + Date.now(),
      title,
      description,
      iconType: 'custom',
      isCustom: true,
      sampleLayout: {
        columns: language === 'vi' ? ['Phần 1: Cốt lõi', 'Phần 2: Mở rộng', 'Phần 3: Đúc kết'] : ['Part 1: Core', 'Part 2: Deep Dive', 'Part 3: Summary'],
        description: description || (language === 'vi' ? 'Mẫu tùy chỉnh do bạn tự thiết kế.' : 'Custom user template.'),
        previewMarkdown: `# ${title}\n\n${prompt || (language === 'vi' ? 'Cấu trúc tùy chỉnh được tối ưu cho phong cách học tập của bạn.' : 'Custom structure optimized for your workflow.')}`
      }
    };
    setTemplates(prev => [...prev, newTmpl]);
    addToast(
      language === 'vi' ? 'Tạo mẫu thành công' : 'Template Created', 
      language === 'vi' ? `Mẫu "${title}" đã được thêm vào danh sách.` : `Template "${title}" added to your list.`
    );
  };

  const useTemplateInChat = (template: TemplateItem) => {
    startNewChatNote(
      language === 'vi' 
        ? `Tạo ghi chú theo mẫu "${template.title}": ${template.description}`
        : `Create note using template "${template.title}": ${template.description}`
    );
  };

  const addSourceFile = (name: string, size: string, type: 'pdf' | 'video' | 'audio' | 'image' | 'doc') => {
    const newFile: SourceFileItem = {
      id: 'file_' + Date.now(),
      name,
      size,
      type,
      uploadDate: (language === 'vi' ? 'Hôm nay, ' : 'Today, ') + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'processed',
      statusText: language === 'vi' ? 'Đã xử lý' : 'Processed'
    };
    setFiles(prev => [newFile, ...prev]);
    addToast(
      language === 'vi' ? 'Tải lên hoàn tất' : 'Upload Complete', 
      language === 'vi' ? `Tệp "${name}" đã sẵn sàng để trích xuất.` : `File "${name}" ready for extraction.`
    );
  };

  const deleteSourceFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    addToast(
      language === 'vi' ? 'Đã xoá tệp' : 'File Removed', 
      language === 'vi' ? 'Tệp nguồn đã được loại bỏ khỏi kho lưu trữ.' : 'Source file removed from repository.',
      'info'
    );
  };

  const addAIProvider = (providerData: Omit<AIProviderItem, 'id' | 'latencyMs' | 'status'>) => {
    const newProv: AIProviderItem = {
      ...providerData,
      id: 'prov_' + Date.now(),
      latencyMs: Math.floor(Math.random() * 100) + 80,
      status: 'active'
    };
    setAIProviders(prev => [...prev, newProv]);
    if (providerData.useForNewChats && providerData.defaultModel) {
      setSelectedModel(providerData.defaultModel);
    }
    addToast(
      language === 'vi' ? 'Thêm Provider thành công' : 'Provider Added', 
      language === 'vi' ? `Đã kết nối với ${providerData.name}.` : `Connected to ${providerData.name}.`
    );
  };

  const toggleProviderStatus = (providerId: string) => {
    setAIProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        const nextStatus = p.status === 'active' ? 'inactive' : 'active';
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  const deleteAIProvider = (providerId: string) => {
    setAIProviders(prev => prev.filter(p => p.id !== providerId));
    addToast(
      language === 'vi' ? 'Đã gỡ Provider' : 'Provider Removed', 
      language === 'vi' ? 'Đã gỡ bỏ nhà cung cấp khỏi danh sách.' : 'Provider removed from list.',
      'info'
    );
  };

  const updateAIProvider = (providerId: string, updates: Partial<AIProviderItem>) => {
    setAIProviders(prev => prev.map(p => p.id === providerId ? { ...p, ...updates } : p));
  };

  const addCoupon = (couponData: Omit<CouponItem, 'id' | 'usedCount'>) => {
    const newCp: CouponItem = {
      ...couponData,
      id: 'cp_' + Date.now(),
      usedCount: 0
    };
    setCoupons(prev => [newCp, ...prev]);
    addToast(
      language === 'vi' ? 'Tạo Coupon thành công' : 'Coupon Created', 
      language === 'vi' ? `Mã ${couponData.code} đã được kích hoạt.` : `Code ${couponData.code} is now active.`
    );
  };

  const updateCoupon = (couponId: string, data: Partial<CouponItem>) => {
    setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, ...data } : c));
    addToast(
      language === 'vi' ? 'Cập nhật Coupon' : 'Coupon Updated', 
      language === 'vi' ? 'Thông tin mã giảm giá đã được lưu.' : 'Coupon updated successfully.'
    );
  };

  const deleteCoupon = (couponId: string) => {
    setCoupons(prev => prev.filter(c => c.id !== couponId));
    addToast(
      language === 'vi' ? 'Đã xoá Coupon' : 'Coupon Deleted', 
      language === 'vi' ? 'Mã giảm giá đã được gỡ khỏi hệ thống.' : 'Coupon removed from system.',
      'info'
    );
  };

  const applyCouponCode = async (code: string): Promise<{ success: boolean; message: string; discountPercent?: number }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const trimmed = code.trim().toUpperCase();
    const found = coupons.find(c => c.code.toUpperCase() === trimmed);

    if (found) {
      if (found.status !== 'active') {
        return { 
          success: false, 
          message: language === 'vi' ? 'Mã giảm giá đã hết hạn hoặc bị tạm ngưng.' : 'Coupon code is expired or inactive.' 
        };
      }
      const discountVal = found.type === 'percentage' ? found.value : 50;
      setUser(prev => ({
        ...prev,
        appliedCoupon: {
          code: found.code,
          discountPercent: discountVal
        }
      }));
      return { 
        success: true, 
        message: language === 'vi' ? `Áp dụng thành công mã ${found.code} (-${discountVal}%)` : `Applied coupon ${found.code} (-${discountVal}%)`, 
        discountPercent: discountVal 
      };
    }

    if (trimmed === 'SAVE50' || trimmed === 'PRO50') {
      setUser(prev => ({
        ...prev,
        appliedCoupon: {
          code: trimmed,
          discountPercent: 50
        }
      }));
      return { 
        success: true, 
        message: language === 'vi' ? `Áp dụng thành công mã ${trimmed} (-50%)` : `Applied coupon ${trimmed} (-50%)`, 
        discountPercent: 50 
      };
    }

    return { 
      success: false, 
      message: language === 'vi' ? 'Mã giảm giá không tồn tại hoặc không hợp lệ.' : 'Coupon code invalid or not found.' 
    };
  };

  const removeAppliedCoupon = () => {
    setUser(prev => ({ ...prev, appliedCoupon: undefined }));
    addToast(
      language === 'vi' ? 'Đã gỡ mã giảm giá' : 'Coupon Removed', 
      language === 'vi' ? 'Ưu đãi đã được huỷ bỏ.' : 'Coupon discount has been removed.',
      'info'
    );
  };

  const upgradeToPro = () => {
    addToast(
      language === 'vi' ? 'Đang chuyển tới trang thanh toán...' : 'Redirecting to payment...', 
      language === 'vi' ? 'Vui lòng chờ trong giây lát...' : 'Please wait a moment...',
      'info'
    );
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        plan: 'PRO',
        nextBillingDate: '20/12/2026'
      }));
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      addToast(
        language === 'vi' ? 'Nâng cấp thành công!' : 'Upgrade Successful!', 
        language === 'vi' ? 'Tài khoản của bạn đã được nâng cấp lên gói Pro.' : 'Your account is now Pro tier.',
        'success'
      );
      setCurrentScreen('settings');
      setSettingsActiveTab('account');
    }, 1200);
  };

  const upgradeToUltra = () => {
    addToast(
      language === 'vi' ? 'Đang chuyển tới trang thanh toán...' : 'Redirecting to payment...', 
      language === 'vi' ? 'Vui lòng chờ trong giây lát...' : 'Please wait a moment...',
      'info'
    );
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        plan: 'ULTRA',
        nextBillingDate: '20/12/2026'
      }));
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });
      addToast(
        language === 'vi' ? 'Nâng cấp thành công!' : 'Upgrade Successful!', 
        language === 'vi' ? 'Tài khoản của bạn đã được nâng cấp lên gói Ultra.' : 'Your account is now Ultra tier.',
        'success'
      );
      setCurrentScreen('settings');
      setSettingsActiveTab('account');
    }, 1200);
  };

  const downgradePlan = () => {
    setUser(prev => ({
      ...prev,
      plan: 'FREE',
      nextBillingDate: undefined
    }));
    addToast(
      language === 'vi' ? 'Đã huỷ gói Pro' : 'Pro Plan Cancelled', 
      language === 'vi' ? 'Tài khoản đã chuyển về gói Cơ bản (Free).' : 'Account reverted to Free tier.',
      'info'
    );
  };

  const sendChatMessage = (text: string, attachedSources?: { type: 'pdf' | 'youtube' | 'doc'; name: string }[]) => {
    if (!text.trim()) return;

    const userMsgId = 'msg_user_' + Date.now();
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Explicit manual method override from user prompt if detected
    let currentMethod = selectedMethod;
    const lower = text.toLowerCase();
    if (lower.includes('cornell')) {
      currentMethod = 'cornell';
      setSelectedMethod('cornell');
    } else if (lower.includes('outline') || lower.includes('dàn ý') || lower.includes('dan y')) {
      currentMethod = 'outline';
      setSelectedMethod('outline');
    } else if (lower.includes('flashcard')) {
      currentMethod = 'flashcard';
      setSelectedMethod('flashcard');
    } else if (lower.includes('q&a') || lower.includes('hỏi đáp') || lower.includes('hoi dap') || lower.includes('qa')) {
      currentMethod = 'qa';
      setSelectedMethod('qa');
    } else if (lower.includes('tóm tắt') || lower.includes('tom tat') || lower.includes('summary')) {
      currentMethod = 'quick-summary';
      setSelectedMethod('quick-summary');
    }

    const isAuto = currentMethod === 'auto';
    const finalChosenMethod: NoteMethod = isAuto ? 'cornell' : currentMethod;
    if (isAuto) {
      setAutoSelectedMethod('cornell');
    }

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: nowTime,
      attachments: attachedSources
    };

    setChatMessages(prev => [...prev, newUserMsg]);
    setIsProcessingChat(true);
    setProcessingStep(1);

    // AI Multi-step Pipeline simulation
    setTimeout(() => {
      setProcessingStep(2);
      setTimeout(() => {
        setProcessingStep(3);
        setTimeout(() => {
          setIsProcessingChat(false);
          setProcessingStep(4);

          // Generate or select a matching generated Note
          const isEn = language === 'en';
          const newGeneratedNote: NoteItem = {
            id: 'note_gen_' + Date.now(),
            title: text.length > 40 ? text.substring(0, 40) + '...' : text,
            summary: isEn 
              ? (isAuto 
                  ? `Note synthesized automatically using AI-selected ${finalChosenMethod.toUpperCase()} methodology from your input sources.`
                  : `Note synthesized automatically using ${finalChosenMethod.toUpperCase()} methodology from your input sources.`)
              : (isAuto
                  ? `Ghi chú được tạo tự động theo phương pháp ${finalChosenMethod.toUpperCase()} (AI phân tích và chọn tối ưu) từ nguồn dữ liệu của bạn.`
                  : `Ghi chú được tạo tự động theo phương pháp ${finalChosenMethod.toUpperCase()} từ nguồn dữ liệu của bạn.`),
            method: finalChosenMethod,
            category: isEn ? 'New Research' : 'Nghiên cứu mới',
            date: isEn ? 'Today' : 'Hôm nay',
            updatedAt: (isEn ? 'Today, ' : 'Hôm nay, ') + nowTime,
            sources: attachedSources && attachedSources.length > 0 
              ? attachedSources.map(s => ({ type: s.type, name: s.name, size: '2.5 MB' }))
              : [{ type: 'pdf', name: isEn ? 'Source_Document.pdf' : 'Nguon_Tai_Lieu.pdf', size: '2.1 MB' }],
            keywords: isEn 
              ? ['Artificial Intelligence', 'Natural Language Processing', 'Knowledge Structuring', 'Deep Learning']
              : ['Trí tuệ nhân tạo', 'Xử lý ngôn ngữ tự nhiên', 'Cấu trúc hóa kiến thức', 'Deep Learning'],
            coreQuestions: isEn
              ? ['What is the core takeaway of this document?', 'How can these findings be applied practically?']
              : ['Điểm mấu chốt của tài liệu này là gì?', 'Làm sao để áp dụng kiến thức này vào thực tiễn?'],
            content: {
              overview: isEn
                ? `Detailed structured note deconstructed from prompt "${text}". Complies with ${finalChosenMethod.toUpperCase()} methodology standards.`
                : `Bản ghi chú chi tiết được trích xuất từ câu hỏi "${text}". Cấu trúc tuân theo chuẩn phương pháp ${finalChosenMethod.toUpperCase()}.`,
              sections: [
                {
                  title: isEn ? '1. Core Conceptual Pillars' : '1. Luận điểm trọng tâm',
                  definition: isEn
                    ? 'Automated classification of primary takeaways and key statistical metrics.'
                    : 'Hệ thống tự động phân loại các ý tưởng then chốt và trích dẫn số liệu quan trọng.',
                  text: isEn
                    ? 'The synthesis provides a comprehensive breakdown of workflow efficiency and active recall. Structural hierarchy increases knowledge retention by up to 70%.'
                    : 'Tài liệu cung cấp cái nhìn toàn diện về tối ưu hóa quy trình làm việc và ghi nhớ chủ động. Các phân tích chỉ ra rằng việc cấu trúc thông tin dạng phân cấp giúp gia tăng khả năng ghi nhớ lên 70%.',
                  lowConfidenceSnippet: isEn
                    ? 'This ratio may fluctuate depending on experimental methodologies.'
                    : 'Tỷ lệ này có thể thay đổi tùy theo phương pháp đo lường của từng nghiên cứu.',
                  lowConfidenceReason: isEn
                    ? 'Data requires further citation verification against raw audio source.'
                    : 'Dữ liệu cần xác minh thêm từ nguồn gốc.',
                  tableData: {
                    headers: isEn ? ['Metric', 'Baseline', 'Post-Implementation (%)'] : ['Chỉ số', 'Trước áp dụng', 'Sau áp dụng (%)'],
                    rows: isEn ? [
                      ['Comprehension Speed', '150 wpm', '+120%'],
                      ['7-Day Retention', '35%', '+85%'],
                      ['Review Time Required', '45 mins', '-60%']
                    ] : [
                      ['Tốc độ đọc hiểu', '150 từ/phút', '+120%'],
                      ['Độ nhớ sau 7 ngày', '35%', '+85%'],
                      ['Thời gian ôn tập', '45 phút', '-60%']
                    ]
                  },
                  bulletPoints: isEn ? [
                    'Automated multi-modal parsing across videos, podcasts and long-form papers.',
                    'Precise millisecond timestamp synchronization and citation anchor tags.',
                    'Multi-format export capabilities (Markdown, DOCX, PDF, HTML, Flashcards).'
                  ] : [
                    'Trích xuất tự động từ video và văn bản dài.',
                    'Liên kết trực tiếp tới mốc thời gian timestamp chính xác.',
                    'Dễ dàng xuất ra nhiều định dạng (Markdown, Word, PDF, HTML).'
                  ]
                }
              ],
              summaryText: isEn
                ? 'Note is fully formatted and primed for structured review or export.'
                : 'Ghi chú đã được tối ưu hóa sẵn sàng để ôn tập hoặc xuất bản tài liệu nghiên cứu.'
            },
            rawMarkdown: `# ${text}\n\n## 1. ${isEn ? 'Core Pillars' : 'Luận điểm trọng tâm'}\n- ${isEn ? 'Synthesized via' : 'Trích xuất tự động theo phương pháp'} ${finalChosenMethod.toUpperCase()}\n- ${isEn ? 'Retention boost' : 'Tăng hiệu suất ghi nhớ'}`
          };

          setNotes(prev => [newGeneratedNote, ...prev]);
          setActiveArtifactNote(newGeneratedNote);
          setIsArtifactOpen(true);

          setChatMessages(prev => [
            ...prev,
            {
              id: 'msg_ai_done_' + Date.now(),
              sender: 'ai',
              text: isEn 
                ? (isAuto 
                    ? `AI analyzed your source and auto-selected CORNELL method as the optimal structure! You can view and export it in the Artifact Panel on the right.`
                    : `I have completed structuring the note with ${finalChosenMethod.toUpperCase()} method! You can view and export it in the Artifact Panel on the right.`)
                : (isAuto
                    ? `AI đã phân tích nội dung và tự động chọn phương pháp CORNELL phù hợp nhất! Bạn có thể xem và tải về ở Artifact Panel bên phải.`
                    : `Tôi đã hoàn thành cấu trúc ghi chú theo phương pháp ${finalChosenMethod.toUpperCase()}! Bạn có thể xem và tải về ở Artifact Panel bên phải.`),
              timestamp: nowTime,
              noteResultId: newGeneratedNote.id
            }
          ]);

          addToast(
            isEn ? 'Note Generated' : 'Tạo note thành công', 
            isEn ? 'Artifact panel opened with new note.' : 'Artifact Panel đã mở với nội dung ghi chú mới.', 
            'success'
          );
        }, 1200);
      }, 1500);
    }, 1500);
  };

  return (
    <AppContext.Provider value={{
      colorPalette,
      setColorPalette,
      theme,
      setTheme,
      toggleTheme,
      language,
      setLanguage,
      toggleLanguage,
      t,
      isMobileSidebarOpen,
      setIsMobileSidebarOpen,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      currentScreen,
      setCurrentScreen,
      user,
      setUser,
      upgradeToPro,
      upgradeToUltra,
      downgradePlan,
      notes,
      archivedNotes,
      activeNote,
      setActiveNote,
      openNoteDetail,
      archiveNote,
      restoreNote,
      deleteNotePermanently,
      renameNote,
      libraryFilter,
      setLibraryFilter,
      librarySort,
      setLibrarySort,
      librarySearchQuery,
      setLibrarySearchQuery,
      libraryViewMode,
      setLibraryViewMode,
      libraryActiveTab,
      setLibraryActiveTab,
      focusSearchInput,
      setFocusSearchInput,
      templates,
      addCustomTemplate,
      useTemplateInChat,
      files,
      addSourceFile,
      deleteSourceFile,
      aiProviders,
      addAIProvider,
      toggleProviderStatus,
      deleteAIProvider,
      updateAIProvider,
      coupons,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      applyCouponCode,
      removeAppliedCoupon,
      paymentHistory,
      selectedModel,
      setSelectedModel,
      selectedLanguage,
      setSelectedLanguage,
      selectedMethod,
      setSelectedMethod,
      autoSelectedMethod,
      chatMessages,
      isProcessingChat,
      processingStep,
      startNewChatNote,
      sendChatMessage,
      activeArtifactNote,
      setActiveArtifactNote,
      isArtifactOpen,
      setIsArtifactOpen,
      isArtifactFullscreen,
      setIsArtifactFullscreen,
      settingsActiveTab,
      setSettingsActiveTab,
      toasts,
      addToast,
      removeToast,
      isLoadingScreen,
      triggerScreenLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
