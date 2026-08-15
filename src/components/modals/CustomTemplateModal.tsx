import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

interface CustomTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomTemplateModal: React.FC<CustomTemplateModalProps> = ({ isOpen, onClose }) => {
  const { addCustomTemplate, theme, language, t } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');

  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addCustomTemplate(title.trim(), description.trim(), prompt.trim());
    setTitle('');
    setDescription('');
    setPrompt('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modalCreateTemplateTitle')}
      subtitle={language === 'vi' ? 'Thiết lập cấu trúc dàn bài và định dạng note theo phong cách riêng của bạn' : 'Define your custom structuring outline, schema, and AI prompts'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5 text-[var(--text-primary)]">
            {t('templateTitleInput')} <span className="text-[var(--status-error)]">*</span>
          </label>
          <input
            id="input-custom-template-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={language === 'vi' ? 'Ví dụ: Ghi chú Họp Sprint Scrum' : 'e.g. Sprint Retrospective Protocol'}
            className="w-full border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-[var(--text-primary)]">
            {t('templateDescInput')}
          </label>
          <input
            id="input-custom-template-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={language === 'vi' ? 'Mô tả mục đích sử dụng mẫu ghi chú...' : 'Describe template goal and usage...'}
            className="w-full border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-[var(--text-primary)]">
            {t('templatePromptInput')}
          </label>
          <textarea
            id="input-custom-template-prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={language === 'vi' ? 'Yêu cầu AI chia note thành 3 phần: 1. Mục tiêu sprint, 2. Việc đã hoàn thành, 3. Blockers và Action Items...' : 'Instruct AI: Format into 1. Sprint Goal, 2. Shipped deliverables, 3. Roadblocks & Follow-ups...'}
            className="w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-[var(--accent-primary)] custom-scrollbar resize-none transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer active:scale-95 transition-all bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            id="btn-save-custom-template"
            className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            {t('save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
