export type ScreenType = 
  | 'login'
  | 'chat'
  | 'library'
  | 'note-detail'
  | 'files'
  | 'templates'
  | 'archives'
  | 'settings'
  | 'pricing'
  | 'admin-coupons';

export type ColorPalette = 
  | 'paper' 
  | 'dracula' 
  | 'forest' 
  | 'ocean' 
  | 'sunset'
  | 'ink'
  | 'lavender'
  | 'sakura'
  | 'mint'
  | 'wine'
  | 'mono'
  | 'gray';
export type ThemeMode = 'dark' | 'light';

export type NoteMethod = 'auto' | 'cornell' | 'outline' | 'qa' | 'flashcard' | 'quick-summary' | 'executive-summary' | 'custom';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'ultra';
  nextBillingDate?: string;
  appliedCoupon?: {
    code: string;
    discountPercent: number;
  };
  needsPasswordSetup?: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  summary: string;
  method: NoteMethod;
  category: string;
  date: string;
  updatedAt: string;
  sources: {
    type: 'pdf' | 'youtube' | 'audio' | 'doc' | 'image';
    name: string;
    size?: string;
    url?: string;
  }[];
  keywords: string[];
  coreQuestions: string[];
  content: {
    overview: string;
    sections: {
      title: string;
      definition?: string;
      text: string;
      lowConfidenceSnippet?: string;
      lowConfidenceReason?: string;
      tableData?: {
        headers: string[];
        rows: (string | number)[][];
      };
      bulletPoints?: string[];
    }[];
    summaryText: string;
  };
  rawMarkdown: string;
  isArchived?: boolean;
  archiveDaysLeft?: number;
  isShared?: boolean;
}

export interface TemplateItem {
  id: string;
  title: string;
  description: string;
  iconType: 'cornell' | 'outline' | 'qa' | 'flashcard' | 'zap' | 'executive' | 'math' | 'custom';
  isCustom?: boolean;
  sampleLayout: {
    columns: string[];
    description: string;
    previewMarkdown: string;
  };
}

export interface SourceFileItem {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'doc';
  size: string;
  uploadDate: string;
  linkedNoteId?: string;
  linkedNoteTitle?: string;
  status: 'processed' | 'auto-delete' | 'error';
  statusText: string;
}

export interface AIProviderItem {
  id: string;
  name: string;
  providerId: string;
  endpointUrl: string;
  defaultModel: string;
  apiKeyMasked: string;
  status: 'active' | 'inactive';
  latencyMs: number;
  streaming?: boolean;
  autoFallback?: boolean;
  useForNewChats?: boolean;
  autoDiscoverModels?: boolean;
  importFreeModels?: boolean;
  syncEnabled?: boolean;
  freeModelsCount?: number;
  freeModelsList?: string[];
  isCustomEndpoint?: boolean;
}

export interface CouponItem {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  applies_to: 'all' | 'paid' | 'pro';
  usage_count: number;
  usage_limit: number | null; // null for unlimited
  expires_at: string | null;
  status: 'active' | 'expired' | 'disabled';
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: string;
  status: 'success' | 'pending' | 'failed';
  invoiceId: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  attachments?: {
    type: 'pdf' | 'youtube' | 'doc';
    name: string;
  }[];
  processingStatus?: {
    isProcessing: boolean;
    currentStep: number; // 1, 2, 3
    steps: {
      title: string;
      subtitle?: string;
      completed: boolean;
      active: boolean;
    }[];
  };
  noteResultId?: string;
}
