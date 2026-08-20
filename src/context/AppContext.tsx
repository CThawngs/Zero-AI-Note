"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  ChatAttachment,
  ChatSessionItem,
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
  
  // Chat Sessions & History (Unified Sessions + Note Artifacts)
  chatSessions: ChatSessionItem[];
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSessionItem[]>>;
  archivedChatSessions: ChatSessionItem[];
  setArchivedChatSessions: React.Dispatch<React.SetStateAction<ChatSessionItem[]>>;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  resumeChatSession: (sessionId: string) => void;
  renameChatSession: (sessionId: string, newTitle: string) => void;
  pinChatSession: (sessionId: string) => void;
  archiveChatSession: (sessionId: string) => Promise<void>;
  restoreChatSession: (sessionId: string) => Promise<void>;
  deleteChatSessionPermanently: (sessionId: string) => Promise<void>;

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
  addSourceFile: (name: string, size: string, type: 'pdf' | 'video' | 'audio' | 'image' | 'doc', fileUrl?: string) => void;
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
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string; discountPercent?: number; discountValue?: number; discountType?: 'percent' | 'fixed'; baseAmount?: number; finalAmount?: number }>;
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
  sendChatMessage: (text: string, attachedSources?: ChatAttachment[]) => void;
  
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
  const [chatSessions, setChatSessions] = useState<ChatSessionItem[]>([]);
  const [archivedChatSessions, setArchivedChatSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [files, setFiles] = useState<SourceFileItem[]>(EMPTY_FILES);
  const [coupons, setCoupons] = useState<CouponItem[]>(EMPTY_COUPONS);
  // Lưu yêu cầu take note chờ xác nhận user (guard AI flow thông minh)
  const pendingNoteRef = useRef<{
    text: string;
    sources: { type: 'pdf' | 'youtube' | 'doc'; name: string }[];
    method: string;
  } | null>(null);
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
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash');
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
        name: row.file_name ?? row.file_url ?? 'Tệp không tên',
        type: (row.type as SourceFileItem['type']) ?? 'doc',
        size: formattedSize,
        sizeBytes: bytes,
        fileUrl: row.file_url || null,
        sourceKey: row.file_url || null,
        uploadedAt: row.created_at || '',
        uploadDate: row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : '',
        status: (row.status as any) || 'processed',
        statusText: row.status === 'auto-delete' ? 'Tự động xóa' : 'Đã xử lý'
      };
    };

    // Map NoteItem to rich ChatSessionItem
    const mapNoteToSession = (note: NoteItem): ChatSessionItem => {
      const ts = note.updatedAt || new Date().toISOString();
      return {
        id: note.id,
        title: note.title,
        createdAt: ts,
        updatedAt: ts,
        model: 'Gemini 2.5 Flash',
        method: note.method || 'cornell',
        category: note.category || 'Học thuật',
        keywords: note.keywords || [],
        messages: [
          {
            id: `msg_user_${note.id}`,
            sender: 'user',
            text: `Tổng hợp và cấu trúc ghi chú theo phương pháp ${(note.method || 'cornell').toUpperCase()} cho chủ đề: ${note.title}`,
            timestamp: ts,
            attachments: note.sources?.map(s => ({ type: s.type as any, name: s.name }))
          },
          {
            id: `msg_ai_${note.id}`,
            sender: 'ai',
            text: `Tôi đã hoàn thành cấu trúc ghi chú theo phương pháp ${(note.method || 'cornell').toUpperCase()} cho chủ đề "${note.title}"! Bạn có thể xem và tải về ở Artifact Panel bên phải.`,
            timestamp: ts,
            noteResultId: note.id
          }
        ],
        note: note,
        sources: note.sources?.map(s => ({ type: s.type as any, name: s.name })),
        isPinned: false,
        isArchived: note.isArchived,
        archiveDaysLeft: note.archiveDaysLeft,
        isShared: note.isShared
      };
    };

  // Load data when user logs in
    useEffect(() => {
      if (!user.id) return;

      const loadData = async () => {
        try {
          // Load notes & sessions
          const userNotes = await getNotes();
          const mappedNotes = userNotes.map(mapNoteRow);
          setNotes(mappedNotes);
          setChatSessions(mappedNotes.map(mapNoteToSession));
        
          // Load archived notes & sessions
          const userArchivedNotes = await getArchivedNotes();
          const mappedArchived = userArchivedNotes.map(mapNoteRow);
          setArchivedNotes(mappedArchived);
          setArchivedChatSessions(mappedArchived.map(mapNoteToSession));
        
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

  // Load custom aiProviders & selectedModel from localStorage
  useEffect(() => {
    try {
      const storageKey = `zero_ai_providers_${user.id || 'default'}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAIProviders(parsed);
        }
      }
      const savedModel = localStorage.getItem('zero_selected_model');
      if (savedModel) {
        setSelectedModel(savedModel);
      }
    } catch {}
  }, [user.id]);

  // Persist aiProviders to localStorage whenever changed
  useEffect(() => {
    try {
      const storageKey = `zero_ai_providers_${user.id || 'default'}`;
      if (aiProviders.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(aiProviders));
      }
    } catch {}
  }, [aiProviders, user.id]);

  // Persist selectedModel to localStorage whenever changed
  useEffect(() => {
    try {
      if (selectedModel) {
        localStorage.setItem('zero_selected_model', selectedModel);
      }
    } catch {}
  }, [selectedModel]);

  const openNoteDetail = (note: NoteItem) => {
    setActiveNote(note);
    setActiveArtifactNote(note);
    setCurrentScreen('note-detail');
  };

  const resumeChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;

    setActiveSessionId(session.id);
    setChatMessages(session.messages && session.messages.length > 0 ? session.messages : [
      {
        id: 'msg_welcome_' + Date.now(),
        sender: 'ai',
        text: `Phiên hội thoại "${session.title}" đã được nạp lại.`,
        timestamp: 'Vừa xong'
      }
    ]);

    if (session.note) {
      setActiveNote(session.note);
      setActiveArtifactNote(session.note);
      setIsArtifactOpen(true);
    } else {
      setActiveArtifactNote(null);
      setIsArtifactOpen(false);
    }

    if (session.method) {
      setSelectedMethod(session.method);
    }

    setCurrentScreen('chat');
  };

  const startNewChatNote = (customPrompt?: string) => {
    const newSessionId = 'session_' + Date.now();
    setActiveSessionId(newSessionId);

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
    setActiveArtifactNote(null);
    setIsArtifactOpen(false);
    setCurrentScreen('chat');

    if (customPrompt) {
      setTimeout(() => {
        sendChatMessage(customPrompt);
      }, 300);
    }
  };

  const renameChatSession = async (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    setChatSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          title: newTitle.trim(),
          note: s.note ? { ...s.note, title: newTitle.trim() } : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    const session = chatSessions.find(s => s.id === sessionId);
    if (session?.note) {
      try {
        await updateNote(session.note.id, { title: newTitle.trim() });
        setNotes(prev => prev.map(n => n.id === session.note!.id ? { ...n, title: newTitle.trim() } : n));
      } catch (e) {
        console.warn('Could not sync note rename to backend:', e);
      }
    }

    addToast(
      language === 'vi' ? 'Đã đổi tên' : 'Renamed',
      language === 'vi' ? `Phiên hội thoại đã đổi thành "${newTitle}".` : `Session renamed to "${newTitle}".`,
      'success'
    );
  };

  const pinChatSession = (sessionId: string) => {
    setChatSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const nextPinned = !s.isPinned;
        addToast(
          nextPinned ? (language === 'vi' ? 'Đã ghim hội thoại' : 'Pinned session') : (language === 'vi' ? 'Đã bỏ ghim' : 'Unpinned session'),
          s.title,
          'info'
        );
        return { ...s, isPinned: nextPinned };
      }
      return s;
    }));
  };

  const archiveChatSession = async (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;

    const archivedItem: ChatSessionItem = {
      ...session,
      isArchived: true,
      archiveDaysLeft: 30,
      updatedAt: new Date().toISOString()
    };

    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    setArchivedChatSessions(prev => [archivedItem, ...prev.filter(s => s.id !== sessionId)]);

    if (session.note) {
      await archiveNote(session.note.id);
    } else {
      addToast(
        language === 'vi' ? 'Đã chuyển vào Thùng rác' : 'Moved to Trash',
        language === 'vi' ? 'Phiên hội thoại sẽ tự động xóa sau 30 ngày.' : 'Session will be permanently deleted after 30 days.'
      );
    }
  };

  const restoreChatSession = async (sessionId: string) => {
    const session = archivedChatSessions.find(s => s.id === sessionId);
    if (!session) return;

    const restoredItem: ChatSessionItem = {
      ...session,
      isArchived: false,
      archiveDaysLeft: undefined,
      updatedAt: new Date().toISOString()
    };

    setArchivedChatSessions(prev => prev.filter(s => s.id !== sessionId));
    setChatSessions(prev => [restoredItem, ...prev.filter(s => s.id !== sessionId)]);

    if (session.note) {
      await restoreNote(session.note.id);
    } else {
      addToast(
        language === 'vi' ? 'Khôi phục thành công' : 'Restored successfully',
        language === 'vi' ? 'Phiên hội thoại đã trở lại danh sách Lịch sử.' : 'Session restored to History.'
      );
    }
  };

  const deleteChatSessionPermanently = async (sessionId: string) => {
    const session = archivedChatSessions.find(s => s.id === sessionId) || chatSessions.find(s => s.id === sessionId);
    setArchivedChatSessions(prev => prev.filter(s => s.id !== sessionId));
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));

    if (session?.note) {
      await deleteNotePermanently(session.note.id);
    } else {
      addToast(
        language === 'vi' ? 'Đã xoá vĩnh viễn' : 'Permanently Deleted',
        language === 'vi' ? 'Phiên hội thoại đã được xoá hoàn toàn.' : 'Session has been permanently removed.',
        'info'
      );
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

  const addSourceFile = async (name: string, size: string, type: 'pdf' | 'video' | 'audio' | 'image' | 'doc', fileUrl?: string) => {
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
          size_bytes: sizeBytes,
          file_url: fileUrl
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

  const applyCouponCode = async (code: string): Promise<{ success: boolean; message: string; discountPercent?: number; discountValue?: number; discountType?: 'percent' | 'fixed'; baseAmount?: number; finalAmount?: number }> => {
    try {
      // Read-only validation against the backend. The coupon is NOT redeemed here —
      // usage_count is incremented only when a real bill is created in /api/billing/create-invoice.
      const targetPlan = (user.plan === 'ultra' ? 'ultra' : 'pro') as 'pro' | 'ultra';
      const res = await fetch('/api/billing/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code, plan: targetPlan }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        return {
          success: false,
          message: data?.error
            ? (language === 'vi' ? `Lỗi: ${data.error}` : `Error: ${data.error}`)
            : (language === 'vi' ? 'Mã giảm giá không hợp lệ.' : 'Invalid coupon code.'),
        };
      }

      const coupon = data.coupon;
      const discountVal = coupon.discount_type === 'percent' ? coupon.discount_value : Math.round((data.discount_amount / data.base_amount) * 100);
      return {
        success: true,
        message: language === 'vi'
          ? `Áp dụng thành công mã ${coupon.code} (giảm ${data.discount_amount.toLocaleString('vi-VN')}đ)`
          : `Applied coupon ${coupon.code} (save ${data.discount_amount.toLocaleString('en-US')}đ)`,
        discountPercent: discountVal,
        discountValue: coupon.discount_value,
        discountType: coupon.discount_type,
        baseAmount: data.base_amount,
        finalAmount: data.final_amount,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error
          ? (language === 'vi' ? `Lỗi: ${err.message}` : `Error: ${err.message}`)
          : (language === 'vi' ? 'Mã giảm giá không hợp lệ.' : 'Invalid coupon code.'),
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

  const downgradePlan = async () => {
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription');

      setUser(prev => ({
        ...prev,
        plan: 'free',
        nextBillingDate: undefined
      }));
      addToast(
        language === 'vi' ? 'Đã huỷ gói dịch vụ thành công' : 'Subscription Cancelled', 
        language === 'vi' ? 'Tài khoản của bạn đã được chuyển về gói Cơ bản (Free).' : 'Account successfully reverted to Free tier.',
        'info'
      );
    } catch (err: any) {
      console.error('downgradePlan error:', err);
      // Fallback local update
      setUser(prev => ({
        ...prev,
        plan: 'free',
        nextBillingDate: undefined
      }));
      addToast(
        language === 'vi' ? 'Đã huỷ gói dịch vụ' : 'Subscription Cancelled', 
        language === 'vi' ? 'Tài khoản đã chuyển về gói Cơ bản (Free).' : 'Account reverted to Free tier.',
        'info'
      );
    }
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

  const executeTakeNote = async (
    text: string,
    attachedSources: ChatAttachment[] | undefined,
    methodOverride?: string,
    originalUserText?: string
  ) => {
    return sendChatMessage(originalUserText || text, attachedSources);
  };

  const sendChatMessage = async (text: string, attachedSources?: ChatAttachment[]) => {
    if (!text.trim() && (!attachedSources || attachedSources.length === 0)) return;

    const userMsgId = 'msg_user_' + Date.now();
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const isEn = language === 'en';

    let currentMethod = selectedMethod;
    const lower = text.toLowerCase();
    if (lower.includes('cornell')) currentMethod = 'cornell';
    else if (lower.includes('outline') || lower.includes('dàn ý') || lower.includes('dan y')) currentMethod = 'outline';
    else if (lower.includes('flashcard')) currentMethod = 'flashcard';
    else if (lower.includes('q&a') || lower.includes('hỏi đáp') || lower.includes('hoi dap') || lower.includes('qa')) currentMethod = 'qa';
    else if (lower.includes('feynman')) currentMethod = 'feynman';
    else if (lower.includes('mindmap') || lower.includes('sơ đồ tư duy')) currentMethod = 'mindmap';
    else if (lower.includes('tóm tắt') || lower.includes('tom tat') || lower.includes('summary')) currentMethod = 'quick-summary';

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
    const startTime = Date.now();

    const effectiveModel = selectedModel || 'gemini-2.0-flash';
    const activeProvider = aiProviders.find(p =>
      p.defaultModel === effectiveModel || 
      p.name === effectiveModel || 
      p.models?.includes(effectiveModel) || 
      (p.providerId === 'google' && effectiveModel.startsWith('gemini')) ||
      p.providerId === effectiveModel
    );

    try {
      setTimeout(() => setProcessingStep(2), 400);

      const res = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: activeArtifactNote?.id,
          prompt: text,
          method: currentMethod,
          language: isEn ? 'en' : 'vi',
          model: effectiveModel,
          providerId: activeProvider?.providerId,
          endpointUrl: activeProvider?.endpointUrl,
          apiKey: activeProvider?.apiKey,
          sources: attachedSources || [],
        }),
      });

      setProcessingStep(3);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI processing failed');

      setProcessingStep(4);
      const durationSec = Math.max(0.4, Number(((Date.now() - startTime) / 1000).toFixed(1)));

      let generatedNote: NoteItem | undefined = undefined;
      if (data.isNoteAction && data.note) {
        generatedNote = data.note;
        setNotes(prev => [data.note, ...prev.filter(n => n.id !== data.note.id)]);
        setActiveArtifactNote(data.note);
        setIsArtifactOpen(true);
        addToast(
          isEn ? 'Academic Note Ready' : 'Ghi chú học thuật đã sẵn sàng',
          isEn ? `"${data.note.title}" opened in Artifact panel.` : `Bản ghi chú "${data.note.title}" đã mở ở Artifact Panel.`,
          'success'
        );
      }

      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai',
        text: data.replyText || (isEn ? 'I have processed your request.' : 'Tôi đã xử lý xong yêu cầu của bạn.'),
        timestamp: nowTime,
        noteResultId: generatedNote?.id,
        model: effectiveModel,
        provider: activeProvider?.name || (effectiveModel.startsWith('gemini') ? 'Google AI' : 'AI Engine'),
        thinkingDuration: durationSec,
        thoughtProcess: isEn 
          ? `Thought in ${durationSec}s · Evaluated context and formulated optimal response using ${effectiveModel}.`
          : `Suy luận trong ${durationSec}s · Đã phân tích ngữ cảnh và tổng hợp câu trả lời tối ưu qua ${effectiveModel}.`,
      };

      const updatedHistory = [...chatMessages, newUserMsg, aiMsg];
      setChatMessages(updatedHistory);

      // Update Session
      const currentSessionId = activeSessionId || generatedNote?.id || ('session_' + Date.now());
      setActiveSessionId(currentSessionId);

      const newSessionItem: ChatSessionItem = {
        id: currentSessionId,
        title: generatedNote?.title || text.substring(0, 35) || (isEn ? 'AI Conversation' : 'Cuộc trò chuyện AI'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model: effectiveModel,
        method: generatedNote?.method || currentMethod,
        category: generatedNote?.category || (isEn ? 'General' : 'Tổng hợp'),
        keywords: generatedNote?.keywords || [],
        messages: updatedHistory,
        note: generatedNote,
        sources: attachedSources?.map(s => ({ type: s.type as any, name: s.name })),
        isPinned: false
      };

      setChatSessions(prev => [newSessionItem, ...prev.filter(s => s.id !== currentSessionId)]);

    } catch (err) {
      console.error('AI chat processing failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Error processing AI response';
      const aiErrMsg: ChatMessage = {
        id: 'msg_ai_err_' + Date.now(),
        sender: 'ai',
        text: isEn ? `Error: ${errMsg}` : `Lỗi xử lý: ${errMsg}`,
        timestamp: nowTime
      };
      setChatMessages(prev => [...prev, aiErrMsg]);
      addToast(isEn ? 'AI Error' : 'Lỗi xử lý AI', errMsg, 'error');
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
      chatSessions,
      setChatSessions,
      archivedChatSessions,
      setArchivedChatSessions,
      activeSessionId,
      setActiveSessionId,
      resumeChatSession,
      renameChatSession,
      pinChatSession,
      archiveChatSession,
      restoreChatSession,
      deleteChatSessionPermanently,
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