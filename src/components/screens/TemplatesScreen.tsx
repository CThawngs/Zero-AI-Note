import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutTemplate, 
  Plus, 
  Eye, 
  Sparkles, 
  FileText, 
  HelpCircle, 
  Zap, 
  Layers, 
  Calculator, 
  Check, 
  ArrowRight,
  BookOpen,
  Search,
  Lock,
  Boxes,
  Table,
  Brain,
  GraduationCap,
  Briefcase,
  GitBranch,
  Atom,
  Target,
  Compass,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TemplateItem } from '../../types';
import { Modal } from '../common/Modal';
import { CustomTemplateModal } from '../modals/CustomTemplateModal';

export const TemplatesScreen: React.FC = () => {
  const { templates, useTemplateInChat, addToast, user, setCurrentScreen, theme, language, t } = useApp();
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<TemplateItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const isDark = theme === 'dark';
  const userPlan = (user.plan || 'free').toLowerCase();
  const isProOrUltra = userPlan === 'pro' || userPlan === 'ultra' || user.role === 'admin';
  const isUltra = userPlan === 'ultra' || user.role === 'admin';

  const customLimit = isUltra ? Infinity : (isProOrUltra ? 25 : 5);
  const customLimitLabel = isUltra ? '∞' : (isProOrUltra ? '25' : '5');

  const getTemplateIcon = (iconType: string) => {
    switch (iconType) {
      case 'cornell': return <LayoutTemplate className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'outline': return <Layers className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'summary':
      case 'zap': return <Zap className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'meeting': return <Briefcase className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'lecture': return <GraduationCap className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'analysis': return <Compass className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'qa': return <HelpCircle className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'charting': return <Table className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'boxing': return <Boxes className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'allinone': return <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'mindmap': return <Brain className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'flashcard': return <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'deep-research': return <FileSpreadsheet className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'feynman': return <Atom className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'first-principles': return <GitBranch className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'syntopical': return <Layers className="w-5 h-5 text-[var(--accent-primary)]" />;
      case '5w1h-action': return <Target className="w-5 h-5 text-[var(--accent-primary)]" />;
      default: return <FileText className="w-5 h-5 text-[var(--accent-primary)]" />;
    }
  };

  const isTemplateLocked = (tmpl: TemplateItem) => {
    if (tmpl.isCustom) return false;
    const tier = tmpl.planTier || 'free';
    if (tier === 'free') return false;
    if (tier === 'pro') return !isProOrUltra;
    if (tier === 'ultra') return !isUltra;
    return false;
  };

  let filteredTemplates = templates.filter(tmpl => {
    if (categoryFilter === 'free' && tmpl.planTier !== 'free') return false;
    if (categoryFilter === 'pro' && tmpl.planTier !== 'pro' && tmpl.planTier !== 'free') return false;
    if (categoryFilter === 'ultra' && tmpl.isCustom) return false;
    if (categoryFilter === 'custom' && !tmpl.isCustom) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        tmpl.title.toLowerCase().includes(q) ||
        tmpl.description.toLowerCase().includes(q) ||
        tmpl.sampleLayout?.columns?.some(col => col.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const builtInTemplates = filteredTemplates.filter(t => !t.isCustom);
  const customTemplates = templates.filter(t => t.isCustom);
  const filteredCustomTemplates = filteredTemplates.filter(t => t.isCustom);

  const handleUseTemplate = (template: TemplateItem) => {
    if (isTemplateLocked(template)) {
      const requiredPlan = (template.planTier || 'pro').toUpperCase();
      addToast(
        language === 'vi' ? `Yêu cầu gói ${requiredPlan}` : `${requiredPlan} Plan Required`,
        language === 'vi' 
          ? `Mẫu "${template.title}" yêu cầu nâng cấp lên gói ${requiredPlan} để sử dụng.` 
          : `Template "${template.title}" requires ${requiredPlan} plan.`,
        'warning'
      );
      setCurrentScreen('pricing');
      return;
    }

    useTemplateInChat(template);
  };

  const handleCreateCustomClick = () => {
    if (customTemplates.length >= customLimit) {
      addToast(
        language === 'vi' ? 'Đã đạt giới hạn mẫu tùy chỉnh' : 'Custom Template Limit Reached',
        language === 'vi' 
          ? `Bạn đã dùng hết hạn mức ${customLimit} mẫu của gói ${userPlan.toUpperCase()}. Vui lòng nâng cấp để tạo thêm.` 
          : `Limit of ${customLimit} custom templates reached. Upgrade for more.`,
        'warning'
      );
      setCurrentScreen('pricing');
      return;
    }
    setIsCreateModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden transition-colors bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="p-4 sm:p-6 pb-4 border-b space-y-4 transition-colors border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {t('templatesTitle')}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                17 Chuẩn Học Thuật
              </span>
            </div>
            <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
              {language === 'vi' 
                ? 'Hệ thống 17 cấu trúc ghi chép phân cấp theo gói (3 Free / 9 Pro / 17 Ultra) + Mẫu tùy biến' 
                : '17 academic note frameworks tiered by plan (3 Free / 9 Pro / 17 Ultra) + Custom Templates'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[var(--text-muted)] hidden sm:inline">
              {language === 'vi' 
                ? `Mẫu tùy chỉnh: ${customTemplates.length}/${customLimitLabel}` 
                : `Custom: ${customTemplates.length}/${customLimitLabel}`}
            </span>
            <button
              id="btn-create-template-header"
              onClick={handleCreateCustomClick}
              className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] rounded-xl text-xs font-semibold shadow-md shadow-[var(--accent-primary)]/25 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('createTemplate')}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="input-search-templates"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm kiếm trong 17 mẫu ghi chú...' : 'Search in 17 templates...'}
              className="w-full rounded-xl pl-10 pr-8 py-2 text-xs border focus:outline-none focus:border-[var(--accent-primary)] bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm cursor-pointer p-1"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: t('all') },
              { id: 'free', label: 'Free (3)' },
              { id: 'pro', label: 'Pro (9)' },
              { id: 'ultra', label: 'Ultra (17)' },
              { id: 'custom', label: `${language === 'vi' ? 'Tùy chỉnh' : 'Custom'} (${customTemplates.length})` }
            ].map((f) => (
              <button
                key={f.id}
                id={`filter-tmpl-${f.id}`}
                onClick={() => setCategoryFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap border active:scale-95 ${
                  categoryFilter === f.id
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40 shadow-2xs'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 custom-scrollbar">
        {filteredTemplates.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-2xl border-[var(--border-color)] bg-[var(--bg-card)]">
            <LayoutTemplate className="w-10 h-10 text-[var(--text-muted)] mb-3" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Không tìm thấy mẫu phù hợp' : 'No templates found'}
            </h3>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-semibold rounded-xl"
            >
              {language === 'vi' ? 'Đặt lại bộ lọc' : 'Reset filters'}
            </button>
          </div>
        ) : (
          <>
            {/* Section 1: Standard Built-in 17 Templates */}
            {builtInTemplates.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {language === 'vi' ? `Hệ Thống Mẫu Tiêu Chuẩn (${builtInTemplates.length})` : `Built-in Academic Templates (${builtInTemplates.length})`}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {builtInTemplates.map((template) => {
                    const locked = isTemplateLocked(template);
                    const tier = template.planTier || 'free';

                    return (
                      <motion.div
                        key={template.id}
                        whileHover={{ y: -2 }}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group active:scale-[0.98] bg-[var(--bg-card)] ${
                          locked 
                            ? 'border-[var(--border-color)] opacity-85 hover:border-amber-500/40' 
                            : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            <div className="w-10 h-10 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform bg-[var(--bg-app)] border-[var(--border-color)]">
                              {getTemplateIcon(template.iconType)}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              tier === 'ultra'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : tier === 'pro'
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            }`}>
                              {tier.toUpperCase()}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold transition-colors text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] flex items-center gap-1.5">
                            <span>{template.title}</span>
                            {locked && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          </h4>
                          <p className="text-xs mt-1.5 leading-relaxed text-[var(--text-secondary)]">
                            {template.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[var(--border-color)]">
                          <button
                            id={`btn-preview-${template.id}`}
                            onClick={() => setSelectedPreviewTemplate(template)}
                            className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border active:scale-95 bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('viewLayout')}</span>
                          </button>
                          <button
                            id={`btn-use-${template.id}`}
                            onClick={() => handleUseTemplate(template)}
                            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shadow-md transition-colors cursor-pointer active:scale-95 ${
                              locked
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                                : 'bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] shadow-[var(--accent-primary)]/20'
                            }`}
                          >
                            {locked ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Mở Khóa</span>
                              </>
                            ) : (
                              <>
                                <span>{t('useTemplate')}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section 2: Custom Templates */}
            {(filteredCustomTemplates.length > 0 || categoryFilter === 'all' || categoryFilter === 'custom') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      {language === 'vi' 
                        ? `Mẫu Tùy Chỉnh Của Bạn (${customTemplates.length}/${customLimitLabel})` 
                        : `Your Custom Templates (${customTemplates.length}/${customLimitLabel})`}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {filteredCustomTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ y: -2 }}
                      className="p-5 rounded-2xl border transition-all flex flex-col justify-between group active:scale-[0.98] bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-primary)]/30 flex items-center justify-center">
                            {getTemplateIcon(template.iconType)}
                          </div>
                          <span className="text-[10px] uppercase font-bold bg-[var(--accent-subtle)] text-[var(--accent-primary)] px-2 py-0.5 rounded-md">
                            {language === 'vi' ? 'Tùy biến' : 'Custom'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold transition-colors text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">
                          {template.title}
                        </h4>
                        <p className="text-xs mt-1.5 leading-relaxed text-[var(--text-secondary)]">
                          {template.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[var(--border-color)]">
                        <button
                          onClick={() => setSelectedPreviewTemplate(template)}
                          className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border active:scale-95 bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('viewLayout')}</span>
                        </button>
                        <button
                          onClick={() => useTemplateInChat(template)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-semibold flex items-center justify-center gap-1 shadow-md shadow-[var(--accent-primary)]/20 cursor-pointer active:scale-95"
                        >
                          <span>{t('useTemplate')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* "+ Tạo mẫu mới" CTA Card */}
                  <div
                    id="card-add-template-cta"
                    onClick={handleCreateCustomClick}
                    className="p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[190px] group active:scale-[0.98] border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] group-hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] group-hover:text-[var(--accent-text)] flex items-center justify-center transition-colors mb-2">
                      <Plus className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      {t('createTemplate')}
                    </p>
                    <p className="text-[11px] mt-1 max-w-[200px] text-[var(--text-muted)]">
                      {language === 'vi' 
                        ? `Tự tạo dàn ý riêng (Đã dùng: ${customTemplates.length}/${customLimitLabel})` 
                        : `Custom outline (Used: ${customTemplates.length}/${customLimitLabel})`}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Template Preview Modal */}
      {selectedPreviewTemplate && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPreviewTemplate(null)}
          title={`${t('viewLayout')}: ${selectedPreviewTemplate.title}`}
          subtitle={selectedPreviewTemplate.description}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">
                {language === 'vi' ? 'Cấu Trúc Các Cột & Phân Vùng' : 'Columns & Architecture'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedPreviewTemplate.sampleLayout.columns.map((col, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--text-primary)]">
                {language === 'vi' ? 'Mục Đích & Cơ Chế Học Tập' : 'Pedagogical Method'}
              </h4>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)] bg-[var(--bg-app)] p-3.5 rounded-xl border border-[var(--border-color)]">
                {selectedPreviewTemplate.sampleLayout.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--text-primary)]">
                {language === 'vi' ? 'Xem Trước Dàn Bài Mẫu' : 'Markdown Blueprint Preview'}
              </h4>
              <div className="p-3.5 rounded-xl border font-mono text-xs overflow-x-auto bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]">
                <pre className="whitespace-pre-wrap">{selectedPreviewTemplate.sampleLayout.previewMarkdown}</pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  const tmpl = selectedPreviewTemplate;
                  setSelectedPreviewTemplate(null);
                  handleUseTemplate(tmpl);
                }}
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-bold shadow-md cursor-pointer"
              >
                {t('useTemplate')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Custom Template Modal */}
      <CustomTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
