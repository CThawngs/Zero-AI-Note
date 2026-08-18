"use client";

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
  ColorPalette,
  AppNotification
} from '../types';
import {
  getNotes,
  getArchivedNotes,
  createNote,
  updateNote,
  archiveNote as archiveNoteQuery,
  restoreNote as restoreNoteQuery,
  deleteNotePermanently as deleteNotePermanentlyQuery,
  deleteAllArchivedNotes as deleteAllArchivedNotesQuery,
  purgeExpiredNotes as purgeExpiredNotesQuery,
  getSources,
  createSource,
  deleteSource as deleteSourceQuery,
  getCoupons,
  createCoupon,
  updateCoupon as updateCouponQuery,
  deleteCoupon as deleteCouponQuery,
  getUserProfile,
  applyCouponToUser
} from '../lib/apiClient';
import { initialTemplates } from '../data/mockData';
import { translations, Language, Theme } from '../i18n/translations';
import { THEME_OPTIONS } from '../utils/themeTokens';

// Empty initial states
const EMPTY_NOTES: NoteItem[] = [];
const EMPTY_ARCHIVED_NOTES: NoteItem[] = [];
const EMPTY_FILES: SourceFileItem[] = [];
const EMPTY_COUPONS: CouponItem[] = [];
const EMPTY_AI_PROVIDERS: AIProviderItem[] = [];
const EMPTY_PAYMENTS: PaymentRecord[] = [];

// Default user profile (empty)
const DEFAULT_USER_PROFILE: UserProfile = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  role: 'user',
  plan: 'free',
  nextBillingDate: undefined,
  appliedCoupon: undefined
};

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
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  logout: () => Promise<void>;
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
  emptyTrash: () => Promise<void>;
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
    setCoupons: React.Dispatch<React.SetStateAction<CouponItem[]>>;
    addCoupon: (coupon: Omit<CouponItem, 'id' | 'usage_count'>) => void;
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

  // Notifications Center (Per Account)
  notifications: AppNotification[];
  hasUnreadNotifications: boolean;
  addNotification: (title: string, content: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
  markNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  deleteNotification: (id: string) => void;

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
  // Default is Theme "Monochrome" (mono) in Light mode for new accounts
  const [colorPalette, setColorPaletteState] = useState<ColorPalette>('mono');
  const [theme, setThemeState] = useState<Theme>('light');
  const [language, setLanguageState] = useState<Language>('vi');
  const [mounted, setMounted] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Hydrate saved settings on client mount safely
  useEffect(() => {
    setMounted(true);
    try {
      const savedPalette = window.localStorage.getItem('zero_ai_palette') as ColorPalette;
      if (savedPalette) {
        setColorPaletteState(savedPalette);
        document.documentElement.setAttribute('data-theme', savedPalette);
      } else {
        document.documentElement.setAttribute('data-theme', 'mono');
      }

      const savedTheme = window.localStorage.getItem('zero_ai_theme') as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
        if (savedTheme === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      } else {
        document.documentElement.classList.add('light');
      }

      const savedLang = window.localStorage.getItem('zero_ai_lang') as Language;
      if (savedLang) setLanguageState(savedLang);
    } catch (e) {
      console.warn('Failed to hydrate local storage settings:', e);
    }
  }, []);

  // Sync color palette to documentElement
  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem('zero_ai_palette', colorPalette);
      document.documentElement.setAttribute('data-theme', colorPalette);
    } catch {}
  }, [colorPalette, mounted]);

  // Sync theme dark/light class to document
  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem('zero_ai_theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    } catch {}
  }, [theme, mounted]);

  // Sync language
  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem('zero_ai_lang', language);
    } catch {}
  }, [language, mounted]);

  const setColorPalette = (newPalette: ColorPalette) => {
    setColorPaletteState(newPalette);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.vi;
    const val = dict[key] !== undefined ? dict[key] : (translations.vi[key] || key);
    return Array.isArray(val) ? String(val[0]) : val;
  };

  const [currentScreen, setCurrentScreenState] = useState<ScreenType>('login'); // Start with login screen
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  // Check auth session on startup
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.displayName || data.user.email.split('@')[0],
            avatar: '',
            role: data.user.role || 'user',
            plan: data.user.plan || 'free',
            needsPasswordSetup: Boolean(data.user.needsPasswordSetup),
          });
          setCurrentScreenState('chat');
        }
      } catch (err) {
        console.error('Session check failed:', err);
      }
    }
    checkSession();
  }, []);

  // Read query param ?screen=login|register when no user
  useEffect(() => {
    if (typeof window !== 'undefined' && !user.id) {
      const params = new URLSearchParams(window.location.search);
      const screen = params.get('screen');
      if (screen === 'login' || screen === 'register') {
        setAuthMode(screen);
      }
    }
  }, [user.id]);
  const [notes, setNotes] = useState<NoteItem[]>(EMPTY_NOTES);
  const [archivedNotes, setArchivedNotes] = useState<NoteItem[]>(EMPTY_ARCHIVED_NOTES);
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [files, setFiles] = useState<SourceFileItem[]>(EMPTY_FILES);
  const [coupons, setCoupons] = useState<CouponItem[]>(EMPTY_COUPONS);
  const [aiProviders, setAIProviders] = useState<AIProviderItem[]>(EMPTY_AI_PROVIDERS);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>(EMPTY_PAYMENTS);
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
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Tiếng Việt');
  const [selectedMethod, setSelectedMethod] = useState<NoteMethod>('auto');
  const [autoSelectedMethod, setAutoSelectedMethod] = useState<NoteMethod>('cornell');
  const [isProcessingChat, setIsProcessingChat] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(0);

  // Artifact
  const [activeArtifactNote, setActiveArtifactNote] = useState<NoteItem | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState<boolean>(false);
  const [isArtifactFullscreen, setIsArtifactFullscreen] = useState<boolean>(false);

  // Chat conversation
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Initial default notifications
  const DEFAULT_INITIAL_NOTIFICATIONS: AppNotification[] = [
    {
      id: 'notif_welcome',
      title: 'Chào mừng bạn đến với Zero AI Note',
      content: 'Bắt đầu nghiên cứu, tạo ghi chú Cornell và xuất file DOCX/PDF chuyên nghiệp.',
      time: 'Hôm nay',
      timestamp: Date.now(),
      type: 'success',
      read: false,
    },
    {
      id: 'notif_gemini_pool',
      title: 'Google Gemini 2.0 Flash Sẵn Sàng',
      content: 'Mô hình AI đa năng đã được kích hoạt mặc định trên hệ thống.',
      time: 'Hôm nay',
      timestamp: Date.now() - 300000,
      type: 'info',
      read: false,
    },
  ];

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load account-specific notifications
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = user.email ? `zero_ai_notifications_${user.email}` : 'zero_ai_notifications_guest';
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        setNotifications(DEFAULT_INITIAL_NOTIFICATIONS);
        localStorage.setItem(storageKey, JSON.stringify(DEFAULT_INITIAL_NOTIFICATIONS));
      }
    } catch {
      setNotifications(DEFAULT_INITIAL_NOTIFICATIONS);
    }
  }, [user.email]);

  const saveNotifications = (newList: AppNotification[]) => {
    setNotifications(newList);
    if (typeof window !== 'undefined') {
      const storageKey = user.email ? `zero_ai_notifications_${user.email}` : 'zero_ai_notifications_guest';
      try {
        localStorage.setItem(storageKey, JSON.stringify(newList));
      } catch {}
    }
  };

  const addNotification = (title: string, content: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    const newNotif: AppNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title,
      content,
      time: 'Vừa xong',
      timestamp: Date.now(),
      type,
      read: false,
    };
    saveNotifications([newNotif, ...notifications]);
  };

  const markNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  const hasUnreadNotifications = notifications.some(n => !n.read);

  // Silent addToast (No popup on normal actions; errors route to Bell Notifications)
  const addToast = (title: string, description?: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    if (type === 'error' || type === 'warning') {
      addNotification(title, description || '', type);
    }
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

    // Map Neon DB note row → UI NoteItem
    const mapNoteRow = (row: any): NoteItem => {
      const structured = row.content_structured ?? {};
      const deletedAt = row.deleted_at ? new Date(row.deleted_at).getTime() : null;
      let archiveDaysLeft = 30;
      if (deletedAt) {
        const daysPassed = (Date.now() - deletedAt) / (1000 * 60 * 60 * 24);
        archiveDaysLeft = Math.max(0, Math.ceil(30 - daysPassed));
      }
      return {
        id: row.id,
        title: row.title ?? 'Chưa có tiêu đề',
        summary: structured.overview ?? '',
        method: (row.method as NoteMethod) ?? 'cornell',
        category: 'Tài liệu',
        date: row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : 'Hôm nay',
        updatedAt: row.created_at ? new Date(row.created_at).toLocaleString('vi-VN') : '',
        sources: [],
        keywords: [],
        coreQuestions: [],
        archiveDaysLeft,
        content: {
          overview: structured.overview ?? '',
          sections: structured.sections ?? [],
          summaryText: structured.summaryText ?? ''
        },
        rawMarkdown: structured.rawMarkdown ?? ''
      };
    };

    // Map Neon DB source row → UI SourceFileItem
    const mapSourceRow = (row: any): SourceFileItem => {
      const bytes = Number(row.size_bytes) || 0;
      let formattedSize = '0 KB';
      if (bytes >= 1024 * 1024 * 1024) {
        formattedSize = `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      } else if (bytes >= 1024 * 1024) {
        formattedSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      } else if (bytes >= 1024) {
        formattedSize = `${(bytes / 1024).toFixed(0)} KB`;
      } else if (bytes > 0) {
        formattedSize = `${bytes} B`;
      }
      return {
        id: row.id,
        name: row.file_url ?? 'Tệp không tên',
        type: (row.type as SourceFileItem['type']) ?? 'doc',
        size: formattedSize,
        sizeBytes: bytes,
        uploadedAt: row.created_at || '',
        uploadDate: row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : '',
        status: (row.status as any) || 'processed',
        statusText: row.status === 'auto-delete' ? 'Tự động xóa' : 'Đã xử lý'
      };
    };

  // Load data when user logs in
    useEffect(() => {
      if (!user.id) return;

      const loadData = async () => {
        try {
          // Load notes
          const userNotes = await getNotes();
          setNotes(userNotes.map(mapNoteRow));
        
          // Load archived notes
          const userArchivedNotes = await getArchivedNotes();
          setArchivedNotes(userArchivedNotes.map(mapNoteRow));
        
          // Load files
          const userFiles = await getSources();
          setFiles(userFiles.map(mapSourceRow));
        
          // Load coupons (admin only)
          if (user.role === 'admin') {
            const allCoupons = await getCoupons();
            setCoupons(allCoupons);
          }
        
          // Load user profile
          const profile = await getUserProfile();
          if (profile) {
            setUser(prev => ({
              ...prev,
              id: profile.id,
              email: profile.email,
              name: profile.display_name ?? prev.name,
              role: (profile.role as 'user' | 'admin') ?? 'user',
              plan: (profile.plan as 'free' | 'pro' | 'ultra') ?? 'free'
            }));
          }
      } catch (err) {
        addToast(
          language === 'vi' ? 'Lỗi tải dữ liệu' : 'Data loading failed',
          err instanceof Error ? err.message : 'Unknown error',
          'error'
        );
      }
    };

    loadData();
  }, [user.id, user.role, language]);

  // Load custom templates from localStorage
  useEffect(() => {
    try {
      const storageKey = `zero_ai_custom_templates_${user.id || 'default'}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates([...initialTemplates, ...parsed]);
        }
      }
    } catch {}
  }, [user.id]);

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

  const archiveNote = async (noteId: string) => {
    try {
      await archiveNoteQuery(noteId);
      const updatedNotes = await getNotes();
      setNotes(updatedNotes.map(mapNoteRow));
      
      const updatedArchivedNotes = await getArchivedNotes();
      setArchivedNotes(updatedArchivedNotes.map(mapNoteRow));
      
      addToast(
        language === 'vi' ? 'Đã lưu trữ' : 'Archived', 
        language === 'vi' ? 'Ghi chú đã được chuyển vào Lưu trữ.' : 'Note moved to Archives.'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi lưu trữ' : 'Archive failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const restoreNote = async (noteId: string) => {
    try {
      await restoreNoteQuery(noteId);
      const updatedNotes = await getNotes();
      setNotes(updatedNotes.map(mapNoteRow));
      
      const updatedArchivedNotes = await getArchivedNotes();
      setArchivedNotes(updatedArchivedNotes.map(mapNoteRow));
      
      addToast(
        language === 'vi' ? 'Khôi phục thành công' : 'Restored successfully', 
        language === 'vi' ? 'Ghi chú đã được đưa trở lại Thư viện.' : 'Note returned to Library.'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi khôi phục' : 'Restore failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const deleteNotePermanently = async (noteId: string) => {
    try {
      await deleteNotePermanentlyQuery(noteId);
      const updatedNotes = await getNotes();
      setNotes(updatedNotes.map(mapNoteRow));
      
      const updatedArchivedNotes = await getArchivedNotes();
      setArchivedNotes(updatedArchivedNotes.map(mapNoteRow));
      
      addToast(
        language === 'vi' ? 'Đã xoá vĩnh viễn' : 'Permanently Deleted', 
        language === 'vi' ? 'Ghi chú đã được xoá hoàn toàn.' : 'Note has been completely removed.',
        'info'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi xoá ghi chú' : 'Delete failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const emptyTrash = async () => {
    try {
      await deleteAllArchivedNotesQuery();
      setArchivedNotes([]);
      addToast(
        language === 'vi' ? 'Đã làm sạch thùng rác' : 'Trash Emptied', 
        language === 'vi' ? 'Toàn bộ ghi chú trong mục lưu trữ đã được xóa vĩnh viễn.' : 'All archived notes have been permanently deleted.',
        'info'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi dọn thùng rác' : 'Empty trash failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const renameNote = async (noteId: string, newTitle: string) => {
    try {
      await updateNote(noteId, { title: newTitle });
      const updatedNotes = await getNotes();
      setNotes(updatedNotes.map(mapNoteRow));
      
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
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi đổi tên' : 'Rename failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const addCustomTemplate = (title: string, description: string, prompt?: string) => {
    const userPlan = (user.plan || 'free').toLowerCase();
    const isUltra = userPlan === 'ultra' || user.role === 'admin';
    const customLimit = isUltra ? Infinity : (userPlan === 'pro' ? 25 : 5);
    const existingCustom = templates.filter(t => t.isCustom);
    if (existingCustom.length >= customLimit) {
      addToast(
        language === 'vi' ? 'Đã đạt giới hạn mẫu tùy chỉnh' : 'Custom Template Limit Reached',
        language === 'vi' 
          ? `Bạn đã đạt giới hạn tối đa ${customLimit} mẫu của gói ${userPlan.toUpperCase()}. Vui lòng nâng cấp.`
          : `Custom template limit of ${customLimit} reached. Upgrade for more.`,
        'warning'
      );
      setCurrentScreen('pricing');
      return;
    }

    const newTmpl: TemplateItem = {
      id: 'tmpl_' + Date.now(),
      title,
      description,
      iconType: 'custom',
      isCustom: true,
      planTier: 'free',
      sampleLayout: {
        columns: language === 'vi' ? ['Phần 1: Cốt lõi', 'Phần 2: Mở rộng', 'Phần 3: Đúc kết'] : ['Part 1: Core', 'Part 2: Deep Dive', 'Part 3: Summary'],
        description: description || (language === 'vi' ? 'Mẫu tùy chỉnh do bạn tự thiết kế.' : 'Custom user template.'),
        previewMarkdown: `# ${title}\n\n${prompt || (language === 'vi' ? 'Cấu trúc tùy chỉnh được tối ưu cho phong cách học tập của bạn.' : 'Custom structure optimized for your workflow.')}`
      }
    };
    setTemplates(prev => {
      const updated = [...prev, newTmpl];
      const customOnly = updated.filter(t => t.isCustom);
      try {
        const storageKey = `zero_ai_custom_templates_${user.id || 'default'}`;
        localStorage.setItem(storageKey, JSON.stringify(customOnly));
      } catch {}
      return updated;
    });
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

  const addSourceFile = async (name: string, size: string, type: 'pdf' | 'video' | 'audio' | 'image' | 'doc') => {
      try {
        let sizeBytes = 0;
        const match = size.match(/([\d.]+)\s*(GB|MB|KB|B)?/i);
        if (match) {
          const val = parseFloat(match[1]);
          const unit = (match[2] || '').toUpperCase();
          if (unit === 'GB') sizeBytes = Math.round(val * 1024 * 1024 * 1024);
          else if (unit === 'MB') sizeBytes = Math.round(val * 1024 * 1024);
          else if (unit === 'KB') sizeBytes = Math.round(val * 1024);
          else sizeBytes = Math.round(val);
        } else {
          sizeBytes = parseInt(size) || 0;
        }

        await createSource({
          type,
          file_name: name,
          size_bytes: sizeBytes
        });
      
        const updatedFiles = await getSources();
        setFiles(updatedFiles.map(mapSourceRow));
      
        addToast(
          language === 'vi' ? 'Tải lên hoàn tất' : 'Upload Complete', 
          language === 'vi' ? `Tệp "${name}" đã sẵn sàng để trích xuất.` : `File "${name}" ready for extraction.`
        );
      } catch (err) {
        addToast(
          language === 'vi' ? 'Lỗi tải lên' : 'Upload failed',
          err instanceof Error ? err.message : 'Unknown error',
          'error'
        );
      }
    };

  const deleteSourceFile = async (fileId: string) => {
    try {
      await deleteSourceQuery(fileId);
      const updatedFiles = await getSources();
      setFiles(updatedFiles.map(mapSourceRow));
      
      addToast(
        language === 'vi' ? 'Đã xoá tệp' : 'File Removed', 
        language === 'vi' ? 'Tệp nguồn đã được loại bỏ.' : 'Source file removed.',
        'info'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi xoá tệp' : 'Delete failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
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
      language === 'vi' ? 'Đã gỡ bỏ nhà cung cấp.' : 'Provider removed.',
      'info'
    );
  };

  const updateAIProvider = (providerId: string, updates: Partial<AIProviderItem>) => {
    setAIProviders(prev => prev.map(p => p.id === providerId ? { ...p, ...updates } : p));
  };

  const addCoupon = async (couponData: Omit<CouponItem, 'id' | 'usage_count'>) => {
    try {
      const newCoupon = await createCoupon({
        code: couponData.code,
        discount_type: couponData.discount_type,
        discount_value: couponData.discount_value,
        applies_to: couponData.applies_to,
        usage_limit: couponData.usage_limit,
        expires_at: couponData.expires_at,
        status: 'active'
      });
      
      if (user.role === 'admin') {
        const updatedCoupons = await getCoupons();
        setCoupons(updatedCoupons);
      }
      
      addToast(
        language === 'vi' ? 'Tạo Coupon thành công' : 'Coupon Created', 
        language === 'vi' ? `Mã ${couponData.code} đã được kích hoạt.` : `Code ${couponData.code} is now active.`
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi tạo Coupon' : 'Coupon creation failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const updateCoupon = async (couponId: string, data: Partial<CouponItem>) => {
    try {
      await updateCouponQuery(couponId, data);
      
      if (user.role === 'admin') {
        const updatedCoupons = await getCoupons();
        setCoupons(updatedCoupons);
      }
      
      addToast(
        language === 'vi' ? 'Cập nhật Coupon' : 'Coupon Updated', 
        language === 'vi' ? 'Thông tin mã giảm giá đã được lưu.' : 'Coupon updated successfully.'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi cập nhật Coupon' : 'Update failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      await deleteCouponQuery(couponId);
      
      if (user.role === 'admin') {
        const updatedCoupons = await getCoupons();
        setCoupons(updatedCoupons);
      }
      
      addToast(
        language === 'vi' ? 'Đã xoá Coupon' : 'Coupon Deleted', 
        language === 'vi' ? 'Mã giảm giá đã được gỡ.' : 'Coupon removed.',
        'info'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi xoá Coupon' : 'Delete failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const applyCouponCode = async (code: string): Promise<{ success: boolean; message: string; discountPercent?: number }> => {
    try {
      const coupon = await applyCouponToUser(code);
      
      // Update user profile
      const profile = await getUserProfile();
      if (profile) {
        setUser(prev => ({
          ...prev,
          id: profile.id,
          email: profile.email,
          name: profile.display_name ?? prev.name,
          role: (profile.role as 'user' | 'admin') ?? 'user',
          plan: (profile.plan as 'free' | 'pro' | 'ultra') ?? 'free'
        }));
      }
      
      const discountVal = coupon.discount_type === 'percent' ? coupon.discount_value : 50;
      return {
        success: true,
        message: language === 'vi' 
          ? `Áp dụng thành công mã ${coupon.code} (-${discountVal}%)`
          : `Applied coupon ${coupon.code} (-${discountVal}%)`,
        discountPercent: discountVal
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error 
          ? (language === 'vi' ? `Lỗi: ${err.message}` : `Error: ${err.message}`)
          : (language === 'vi' ? 'Mã giảm giá không hợp lệ.' : 'Invalid coupon code.')
      };
    }
  };

  const removeAppliedCoupon = async () => {
    try {
      // In a real app, you would call an API to remove the coupon
      const profile = await getUserProfile();
      if (profile) {
        setUser(prev => ({
          ...prev,
          id: profile.id,
          email: profile.email,
          name: profile.display_name ?? prev.name,
          role: (profile.role as 'user' | 'admin') ?? 'user',
          plan: (profile.plan as 'free' | 'pro' | 'ultra') ?? 'free'
        }));
      }
      
      addToast(
        language === 'vi' ? 'Đã gỡ mã giảm giá' : 'Coupon Removed', 
        language === 'vi' ? 'Ưu đãi đã được huỷ bỏ.' : 'Coupon discount has been removed.',
        'info'
      );
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi gỡ mã' : 'Remove failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
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
        plan: 'pro',
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
        plan: 'ultra',
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
      plan: 'free',
      nextBillingDate: undefined
    }));
    addToast(
      language === 'vi' ? 'Đã huỷ gói Pro' : 'Pro Plan Cancelled', 
      language === 'vi' ? 'Tài khoản đã chuyển về gói Cơ bản (Free).' : 'Account reverted to Free tier.',
      'info'
    );
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API call error:', e);
    }
    setUser(DEFAULT_USER_PROFILE);
    addToast(
      language === 'vi' ? 'Đã đăng xuất' : 'Logged Out',
      language === 'vi' ? 'Hẹn gặp lại bạn lần sau!' : 'See you next time!',
      'info'
    );
    window.location.href = '/';
  };

  const sendChatMessage = async (text: string, attachedSources?: { type: 'pdf' | 'youtube' | 'doc'; name: string }[]) => {
    if (!text.trim()) return;
    if (!user.id) {
      addToast(
        language === 'vi' ? 'Chưa đăng nhập' : 'Not logged in',
        language === 'vi' ? 'Vui lòng đăng nhập để tạo ghi chú.' : 'Please log in to create notes.',
        'error'
      );
      return;
    }

    const userPlan = (user.plan || 'free').toLowerCase();
    const isUltra = userPlan === 'ultra' || user.role === 'admin';
    const noteLimit = isUltra ? Infinity : (userPlan === 'pro' ? 50 : 20);
    if (notes.length >= noteLimit) {
      addToast(
        language === 'vi' ? 'Đã đạt giới hạn lưu trữ ghi chú' : 'Note Storage Limit Reached',
        language === 'vi' 
          ? `Bạn đã đạt giới hạn tối đa ${noteLimit} ghi chú của gói ${userPlan.toUpperCase()}. Vui lòng nâng cấp hoặc dọn dẹp ghi chú cũ.`
          : `Note limit of ${noteLimit} reached for ${userPlan.toUpperCase()}. Please upgrade or delete old notes.`,
        'warning'
      );
      setCurrentScreen('pricing');
      return;
    }

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

    const isEn = language === 'en';

    const activeProvider = aiProviders.find(p => p.defaultModel === selectedModel || p.name === selectedModel);

    try {
      setTimeout(() => setProcessingStep(2), 600);

      const res = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          method: currentMethod,
          language: isEn ? 'en' : 'vi',
          model: selectedModel || 'gemini-2.5-flash',
          providerId: activeProvider?.providerId,
          endpointUrl: activeProvider?.endpointUrl,
          sources: attachedSources || [],
        }),
      });

      setProcessingStep(3);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate note');
      }

      const generatedNote: NoteItem = data.note;

      // Update state with generated note
      setNotes(prev => [generatedNote, ...prev.filter(n => n.id !== generatedNote.id)]);
      setActiveArtifactNote(generatedNote);
      setIsArtifactOpen(true);
      setProcessingStep(4);

      setChatMessages(prev => [
        ...prev,
        {
          id: 'msg_ai_done_' + Date.now(),
          sender: 'ai',
          text: isEn 
            ? (isAuto 
                ? `AI analyzed your source and auto-selected ${generatedNote.method.toUpperCase()} method as the optimal structure! You can view and export it in the Artifact Panel on the right.`
                : `I have completed structuring the note with ${generatedNote.method.toUpperCase()} method! You can view and export it in the Artifact Panel on the right.`)
            : (isAuto
                ? `AI đã phân tích nội dung và tự động chọn phương pháp ${generatedNote.method.toUpperCase()} phù hợp nhất! Bạn có thể xem và tải về ở Artifact Panel bên phải.`
                : `Tôi đã hoàn thành cấu trúc ghi chú theo phương pháp ${generatedNote.method.toUpperCase()}! Bạn có thể xem và tải về ở Artifact Panel bên phải.`),
          timestamp: nowTime,
          noteResultId: generatedNote.id
        }
      ]);

      addToast(
        isEn ? 'Note Generated' : 'Tạo ghi chú thành công', 
        isEn ? `"${generatedNote.title}" is ready.` : `Ghi chú "${generatedNote.title}" đã sẵn sàng.`, 
        'success'
      );
    } catch (err) {
      console.error('Note generation failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Error generating note';
      setChatMessages(prev => [
        ...prev,
        {
          id: 'msg_ai_err_' + Date.now(),
          sender: 'ai',
          text: isEn ? `Error: ${errMsg}` : `Lỗi: ${errMsg}`,
          timestamp: nowTime,
        }
      ]);
      addToast(
        isEn ? 'Generation Error' : 'Lỗi tạo ghi chú',
        errMsg,
        'error'
      );
    } finally {
      setIsProcessingChat(false);
    }
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
      authMode,
      setAuthMode,
      user,
      setUser,
      logout,
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
      emptyTrash,
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
            setCoupons,
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
      notifications,
      hasUnreadNotifications,
      addNotification,
      markNotificationsAsRead,
      clearAllNotifications,
      deleteNotification,
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