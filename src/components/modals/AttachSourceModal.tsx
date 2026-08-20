import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Upload, Link as LinkIcon, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { uploadFileToR2 } from '../../lib/apiClient';

import { ChatAttachment } from '../../types';

interface AttachSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (source: ChatAttachment) => void;
}

export const AttachSourceModal: React.FC<AttachSourceModalProps> = ({ isOpen, onClose, onAttach }) => {
  const { addSourceFile, theme, language, t, addToast } = useApp();
  const [tab, setTab] = useState<'upload' | 'link' | 'raw'>('upload');
  const [linkInput, setLinkInput] = useState('');
  const [rawTextInput, setRawTextInput] = useState('');
  const [rawTitle, setRawTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const isDark = theme === 'dark';

  const handleFileUpload = async (file: File) => {
    try {
      let textContent = '';
      const isTextFile = file.type.startsWith('text/') || 
        file.name.endsWith('.txt') || 
        file.name.endsWith('.md') || 
        file.name.endsWith('.json') || 
        file.name.endsWith('.csv') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.html') ||
        file.name.endsWith('.css');

      if (isTextFile) {
        textContent = await file.text();
      }

      let publicUrl: string | undefined = undefined;
      try {
        const uploadRes = await uploadFileToR2(file);
        publicUrl = uploadRes.publicUrl;
      } catch (uploadErr) {
        console.warn('Direct R2 upload skipped/failed:', uploadErr);
      }
      
      const fileType = file.type.includes('video') ? 'video' : file.type.includes('audio') ? 'audio' : file.type.includes('pdf') ? 'pdf' : 'doc';
      await addSourceFile(file.name, file.size.toString(), fileType, publicUrl);

      onAttach({ 
        type: fileType, 
        name: file.name,
        url: publicUrl,
        content: textContent || undefined,
        size: `${(file.size / 1024).toFixed(1)} KB`
      });
      onClose();
    } catch (err) {
      addToast(
        language === 'vi' ? 'Lỗi tải lên' : 'Upload failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;
    const isYt = linkInput.includes('youtube') || linkInput.includes('youtu.be');
    onAttach({
      type: isYt ? 'youtube' : 'doc',
      name: isYt ? 'YouTube Video (' + linkInput.substring(0, 25) + '...)' : 'Web Article (' + linkInput.substring(0, 25) + '...)',
      url: linkInput.trim()
    });
    setLinkInput('');
    onClose();
  };

  const handleRawTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawTextInput.trim()) return;
    onAttach({
      type: 'doc',
      name: rawTitle.trim() || (language === 'vi' ? 'Văn bản đính kèm' : 'Attached Document'),
      content: rawTextInput.trim()
    });
    setRawTextInput('');
    setRawTitle('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'vi' ? 'Đính kèm nguồn dữ liệu' : 'Attach Data Source'}
      subtitle={language === 'vi' ? 'Chọn tài liệu, liên kết video hoặc dán văn bản để AI trích xuất nội dung' : 'Choose documents, multimedia links, or raw text for AI synthesis'}
      maxWidth="max-w-xl"
    >
      {/* Tabs */}
      <div className="flex p-1 rounded-xl border mb-6 transition-colors bg-[var(--bg-app)] border-[var(--border-color)]">
        <button
          id="attach-tab-upload"
          onClick={() => setTab('upload')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            tab === 'upload' 
              ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? 'Tải file lên' : 'Upload File'}</span>
        </button>
        <button
          id="attach-tab-link"
          onClick={() => setTab('link')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            tab === 'link' 
              ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? 'Dán link URL/Video' : 'Paste URL/Video'}</span>
        </button>
        <button
          id="attach-tab-raw"
          onClick={() => setTab('raw')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            tab === 'raw' 
              ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? 'Dán văn bản' : 'Paste Text'}</span>
        </button>
      </div>

      {tab === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)]' 
                : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 bg-[var(--bg-app)]'
            }`}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.mp4,.wav,.ogg,.webm,.txt"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent-primary)] flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {language === 'vi' ? 'Kéo thả tệp vào đây, hoặc ' : 'Drag and drop files here, or '}
              <span className="text-[var(--accent-primary)] underline font-semibold">{language === 'vi' ? 'chọn tệp' : 'browse'}</span>
            </p>
            <p className="text-xs mt-1 text-[var(--text-muted)]">
              {t('supportedFormats')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { name: 'Kinh_Te_Vi_Mo_Chuong1.pdf', size: '2.4 MB' },
              { name: 'Machine_Learning_CS229.pdf', size: '5.1 MB' },
              { name: 'Recording_Meeting_Q3.mp3', size: '14.2 MB' },
              { name: 'AI_Agents_Research_Paper.pdf', size: '1.8 MB' }
            ].map((f, i) => (
              <button
                key={i}
                id={`sample-file-upload-${i}`}
                onClick={() => handleFileUpload(new File([], f.name, { type: f.name.endsWith('.pdf') ? 'application/pdf' : f.name.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream' }))}
                className="flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 shadow-2xs"
              >
                <div className="truncate mr-2">
                  <p className="text-xs font-medium truncate text-[var(--text-primary)]">{f.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{f.size}</p>
                </div>
                <span className="text-xs bg-[var(--accent-subtle)] text-[var(--accent-primary)] px-2 py-0.5 rounded font-medium shrink-0">
                  {language === 'vi' ? 'Dùng thử' : 'Sample'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'link' && (
        <form onSubmit={handleLinkSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[var(--text-primary)]">
              {language === 'vi' ? 'Đường dẫn URL bài viết, video YouTube hoặc Podcast' : 'Article URL, YouTube Video, or Podcast link'}
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="input-source-link"
                type="url"
                required
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
            </div>
            <p className="text-xs mt-1.5 text-[var(--text-muted)]">
              {language === 'vi' ? 'Hệ thống tự động trích xuất phụ đề, transcript và tóm tắt nội dung chính xác.' : 'System automatically extracts transcripts and provides accurate summaries.'}
            </p>
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
              id="btn-submit-link"
              className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              {language === 'vi' ? 'Đính kèm liên kết' : 'Attach Link'}
            </button>
          </div>
        </form>
      )}

      {tab === 'raw' && (
        <form onSubmit={handleRawTextSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[var(--text-primary)]">
              {language === 'vi' ? 'Tiêu đề văn bản (Tùy chọn)' : 'Document Title (Optional)'}
            </label>
            <input
              id="input-raw-title"
              type="text"
              value={rawTitle}
              onChange={(e) => setRawTitle(e.target.value)}
              placeholder={language === 'vi' ? 'Ví dụ: Ghi chép buổi họp chiến lược' : 'e.g. Q3 Strategy Discussion Notes'}
              className="w-full border rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-[var(--text-primary)]">
              {language === 'vi' ? 'Nội dung văn bản thô' : 'Raw Text Content'}
            </label>
            <textarea
              id="input-raw-content"
              required
              rows={5}
              value={rawTextInput}
              onChange={(e) => setRawTextInput(e.target.value)}
              placeholder={language === 'vi' ? 'Dán toàn bộ ghi chép, email hoặc tài liệu của bạn vào đây...' : 'Paste your notes, draft, or article text here...'}
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
              id="btn-submit-raw"
              className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              {language === 'vi' ? 'Đính kèm văn bản' : 'Attach Text'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
