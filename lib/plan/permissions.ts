/**
 * Plan Permissions & Limits Enforcement
 * Based on PRD §5 Master Pricing Matrix
 */

export type UserPlan = 'free' | 'pro' | 'ultra';

export interface PlanLimits {
  maxNotes: number | 'unlimited';
  maxCustomTemplates: number | 'unlimited';
  processingMinutesLimit: number; // per month
  templates: NoteMethod[];
  canPreviewStaticHtml: boolean;
  canPreviewInteractiveHtml: boolean;
  canExportHtml: boolean;
  canExportInteractiveHtml: boolean;
  canExportZip: boolean;
  exportFormats: string[];
}

export type NoteMethod = 
  | 'cornell' | 'outline' | 'summary' 
  | 'meeting' | 'lecture' | 'analysis' | 'qa' | 'charting' | 'boxing'
  | 'allinone' | 'mindmap' | 'flashcard' | 'deep-analysis' | 'feynman' 
  | 'first-principles' | 'syntopical' | '5w1h-action';

const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    maxNotes: 20,
    maxCustomTemplates: 5,
    processingMinutesLimit: 120,
    templates: ['cornell', 'outline', 'summary'],
    canPreviewStaticHtml: false,
    canPreviewInteractiveHtml: false,
    canExportHtml: false,
    canExportInteractiveHtml: false,
    canExportZip: false,
    exportFormats: ['pdf', 'docx', 'md'],
  },
  pro: {
    maxNotes: 50,
    maxCustomTemplates: 25,
    processingMinutesLimit: 600,
    templates: [
      'cornell', 'outline', 'summary',
      'meeting', 'lecture', 'analysis', 'qa', 'charting', 'boxing'
    ],
    canPreviewStaticHtml: true,
    canPreviewInteractiveHtml: false,
    canExportHtml: true,
    canExportInteractiveHtml: false,
    canExportZip: false,
    exportFormats: ['pdf', 'docx', 'md', 'html'],
  },
  ultra: {
    maxNotes: 'unlimited',
    maxCustomTemplates: 'unlimited',
    processingMinutesLimit: 1800,
    templates: [
      'cornell', 'outline', 'summary',
      'meeting', 'lecture', 'analysis', 'qa', 'charting', 'boxing',
      'allinone', 'mindmap', 'flashcard', 'deep-analysis', 'feynman',
      'first-principles', 'syntopical', '5w1h-action'
    ],
    canPreviewStaticHtml: true,
    canPreviewInteractiveHtml: true,
    canExportHtml: true,
    canExportInteractiveHtml: true,
    canExportZip: true,
    exportFormats: ['pdf', 'docx', 'md', 'html'],
  },
};

/**
 * Get limits for a user plan
 */
export function getPlanLimits(plan: UserPlan): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if a template method is available for user's plan
 */
export function isTemplateAllowed(method: NoteMethod, plan: UserPlan): boolean {
  const limits = getPlanLimits(plan);
  return limits.templates.includes(method);
}

/**
 * Check if user can create more custom templates
 */
export function canCreateCustomTemplate(currentCount: number, plan: UserPlan): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxCustomTemplates === 'unlimited') return true;
  return currentCount < limits.maxCustomTemplates;
}

/**
 * Check if user can create more notes
 */
export function canCreateNote(currentCount: number, plan: UserPlan): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxNotes === 'unlimited') return true;
  return currentCount < limits.maxNotes;
}

/**
 * Get processing minutes limit for plan
 */
export function getProcessingMinutesLimit(plan: UserPlan): number {
  return getPlanLimits(plan).processingMinutesLimit;
}

/**
 * Check if user has enough processing minutes remaining
 */
export function hasProcessingMinutes(minutesUsed: number, plan: UserPlan, requestedMinutes: number): boolean {
  const limit = getProcessingMinutesLimit(plan);
  return (minutesUsed + requestedMinutes) <= limit;
}

/**
 * Check preview permissions
 */
export function canPreviewStaticHtml(plan: UserPlan): boolean {
  return getPlanLimits(plan).canPreviewStaticHtml;
}

export function canPreviewInteractiveHtml(plan: UserPlan): boolean {
  return getPlanLimits(plan).canPreviewInteractiveHtml;
}

/**
 * Check export permissions
 */
export function canExportHtml(plan: UserPlan): boolean {
  return getPlanLimits(plan).canExportHtml;
}

export function canExportInteractiveHtml(plan: UserPlan): boolean {
  return getPlanLimits(plan).canExportInteractiveHtml;
}

export function canExportZip(plan: UserPlan): boolean {
  return getPlanLimits(plan).canExportZip;
}

export function getExportFormats(plan: UserPlan): string[] {
  return getPlanLimits(plan).exportFormats;
}

/**
 * Get all available templates for a plan (for UI display)
 */
export function getAvailableTemplates(plan: UserPlan): NoteMethod[] {
  return getPlanLimits(plan).templates;
}

/**
 * Check if user is on paid plan (pro or ultra)
 */
export function isPaidPlan(plan: UserPlan): boolean {
  return plan === 'pro' || plan === 'ultra';
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: UserPlan): string {
  switch (plan) {
    case 'free': return 'Free';
    case 'pro': return 'Pro';
    case 'ultra': return 'Ultra';
    default: return 'Free';
  }
}

/**
 * Get plan upgrade message for a feature
 */
export function getUpgradeMessage(feature: string, plan: UserPlan, language: 'vi' | 'en' = 'vi'): string {
  const planName = getPlanDisplayName(plan);
  
  if (language === 'vi') {
    const messages: Record<string, string> = {
      template: `Tính năng "${feature}" yêu cầu gói Pro hoặc Ultra. Gói hiện tại: ${planName}.`,
      preview: `Xem trước HTML cần gói ${planName === 'free' ? 'Pro' : 'Ultra'}. Gói hiện tại: ${planName}.`,
      export: `Xuất file ${feature} cần gói ${planName === 'free' ? 'Pro' : 'Ultra'}. Gói hiện tại: ${planName}.`,
      note_limit: `Bạn đã đạt giới hạn lưu trữ của gói ${planName}. Vui lòng nâng cấp hoặc xóa note cũ.`,
      template_limit: `Bạn đã đạt giới hạn template tùy chỉnh của gói ${planName}. Vui lòng nâng cấp.`,
      processing_minutes: `Đã hết phút xử lý tháng này (gói ${planName}). Vui lòng chờ reset hoặc nâng cấp.`,
    };
    return messages[feature] || `Tính năng này cần gói Pro hoặc Ultra. Gói hiện tại: ${planName}.`;
  }
  
  const messages: Record<string, string> = {
    template: `Feature "${feature}" requires Pro or Ultra plan. Current: ${planName}.`,
    preview: `HTML preview requires ${planName === 'free' ? 'Pro' : 'Ultra'} plan. Current: ${planName}.`,
    export: `Export ${feature} requires ${planName === 'free' ? 'Pro' : 'Ultra'} plan. Current: ${planName}.`,
    note_limit: `You've reached the note storage limit for ${planName} plan. Upgrade or delete old notes.`,
    template_limit: `You've reached the custom template limit for ${planName} plan. Please upgrade.`,
    processing_minutes: `Monthly processing minutes exhausted (${planName} plan). Wait for reset or upgrade.`,
  };
  return messages[feature] || `This feature requires Pro or Ultra plan. Current: ${planName}.`;
}

export { PLAN_LIMITS };