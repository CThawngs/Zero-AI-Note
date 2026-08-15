import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TemplateItem } from '../../types';
import { Modal } from '../common/Modal';
import { CustomTemplateModal } from '../modals/CustomTemplateModal';

export const TemplatesScreen: React.FC = () => {
  const { templates, useTemplateInChat, addToast, theme, language, t } = useApp();
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<TemplateItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isDark = theme === 'dark';

  const getTemplateIcon = (iconType: string) => {
    switch (iconType) {
      case 'cornell': return <LayoutTemplate className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'outline': return <Layers className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'qa': return <HelpCircle className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'flashcard': return <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'zap': return <Zap className="w-5 h-5 text-[var(--accent-primary)]" />;
      case 'math': return <Calculator className="w-5 h-5 text-[var(--accent-primary)]" />;
      default: return <FileText className="w-5 h-5 text-[var(--accent-primary)]" />;
    }
  };

  const builtInTemplates = templates.filter(t => !t.isCustom);
  const customTemplates = templates.filter(t => t.isCustom);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden transition-colors bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="p-4 sm:p-6 pb-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors border-[var(--border-color)] bg-[var(--bg-card)]">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {t('templatesTitle')}
          </h2>
          <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
            {language === 'vi' 
              ? 'Lựa chọn hoặc tự tạo cấu trúc dàn ý tối ưu cho từng loại tài liệu' 
              : 'Pre-designed structural frameworks and custom prompt outlines'}
          </p>
        </div>

        <button
          id="btn-create-template-header"
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] rounded-xl text-xs font-semibold shadow-md shadow-[var(--accent-primary)]/25 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('createTemplate')}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 custom-scrollbar">
        {/* Section 1: Built-in Templates */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {language === 'vi' ? 'Mẫu Tiêu Chuẩn (Có sẵn)' : 'Standard Built-in Templates'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {builtInTemplates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ y: -2 }}
                className="p-5 rounded-2xl border transition-all flex flex-col justify-between group active:scale-[0.98] bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 hover:shadow-md shadow-xs"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl border flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform bg-[var(--bg-app)] border-[var(--border-color)]">
                    {getTemplateIcon(template.iconType)}
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
                    id={`btn-preview-${template.id}`}
                    onClick={() => setSelectedPreviewTemplate(template)}
                    className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border active:scale-95 bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('viewLayout')}</span>
                  </button>
                  <button
                    id={`btn-use-${template.id}`}
                    onClick={() => useTemplateInChat(template)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-semibold flex items-center justify-center gap-1 shadow-md shadow-[var(--accent-primary)]/20 transition-colors cursor-pointer active:scale-95"
                  >
                    <span>{t('useTemplate')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 2: Custom Templates */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {language === 'vi' ? `Mẫu Tùy Chỉnh Của Bạn (${customTemplates.length})` : `Your Custom Templates (${customTemplates.length})`}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {customTemplates.map((template) => (
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
                    <span className="text-xs bg-[var(--accent-subtle)] text-[var(--accent-primary)] px-2 py-0.5 rounded-lg font-bold">
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

            {/* "+ Tạo mẫu mới" card */}
            <div
              id="card-add-template-cta"
              onClick={() => setIsCreateModalOpen(true)}
              className="p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[190px] group active:scale-[0.98] border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] group-hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] group-hover:text-[var(--accent-text)] flex items-center justify-center transition-colors mb-2">
                <Plus className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {t('createTemplate')}
              </p>
              <p className="text-xs mt-1 max-w-[200px] text-[var(--text-muted)]">
                {language === 'vi' ? 'Định nghĩa cấu trúc cho ngành nghề hoặc môn học của bạn' : 'Define personalized frameworks for your specific workflow'}
              </p>
            </div>
          </div>
        </section>
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
            {/* Columns breakdown */}
            <div className="p-3.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
              <p className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">
                {language === 'vi' ? 'Các phân mục chính:' : 'Main Sections:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedPreviewTemplate.sampleLayout.columns.map((col, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)]"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Markdown preview code */}
            <div>
              <p className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)]">
                {language === 'vi' ? 'Mô phỏng cấu trúc Markdown:' : 'Markdown Structure Simulation:'}
              </p>
              <div className="p-4 rounded-xl border font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]">
                {selectedPreviewTemplate.sampleLayout.previewMarkdown}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {t('close')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const tmpl = selectedPreviewTemplate;
                  setSelectedPreviewTemplate(null);
                  useTemplateInChat(tmpl);
                }}
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[var(--accent-primary)]/25 cursor-pointer active:scale-95"
              >
                <span>{t('useTemplate')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
