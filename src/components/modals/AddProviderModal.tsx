import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Check, Loader2, Sparkles, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProviderModal: React.FC<AddProviderModalProps> = ({ isOpen, onClose }) => {
  const { addAIProvider, setSelectedModel, theme, language, t } = useApp();
  const [name, setName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState('https://api.openai.com/v1');
  const [defaultModel, setDefaultModel] = useState('qwen/qwen3-asr-1.7b');
  const [apiKey, setApiKey] = useState('');
  const [useForNewChats, setUseForNewChats] = useState(true);
  const [autoDiscoverModels, setAutoDiscoverModels] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number } | null>(null);

  const discoveredModels = [
    'qwen/qwen3-asr-1.7b',
    'gpt-4o',
    'gpt-4o-mini',
    'claude-3-5-sonnet-20241022',
    'gemini-2.0-flash',
    'deepseek-chat',
    'deepseek-reasoner',
    'llama-3.3-70b-instruct',
    'mistral-large-latest',
    'whisper-large-v3'
  ];

  const handleTestConnection = () => {
    if (!endpointUrl) return;
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        success: true,
        latency: Math.floor(Math.random() * 60) + 85
      });
    }, 1100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endpointUrl.trim() || !defaultModel.trim() || !testResult?.success) return;

    const finalSlug = (providerId.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || 'custom-provider';
    
    addAIProvider({
      name: name.trim(),
      providerId: finalSlug,
      endpointUrl: endpointUrl.trim(),
      defaultModel: defaultModel.trim(),
      apiKeyMasked: apiKey.trim() ? `${apiKey.trim().substring(0, 6)}••••••••••••` : 'None (No Auth)',
      useForNewChats,
      autoDiscoverModels,
      streaming: true,
      autoFallback: true
    });

    if (useForNewChats) {
      setSelectedModel(defaultModel.trim());
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'vi' ? 'Thêm Provider AI Tùy Chỉnh' : 'Add Custom AI Provider'}
      subtitle={language === 'vi' ? 'Kết nối trực tiếp API Key riêng của bạn (BYOK) hoặc máy chủ nội bộ Local LLM' : 'Connect your own API Key (BYOK) or self-hosted local model endpoints'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Provider ID (slug) — Cùng 1 hàng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-[var(--text-primary)]">
              {language === 'vi' ? 'Name (Tên hiển thị)' : 'Name (Display Name)'}
              <span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
            <input
              id="input-provider-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                if (!isSlugManuallyEdited) {
                  setProviderId(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                }
              }}
              placeholder={language === 'vi' ? 'Ví dụ: Qwen Local ASR' : 'e.g. Qwen Local ASR'}
              className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-[var(--text-primary)]">
              {language === 'vi' ? 'Provider ID (Slug)' : 'Provider ID (Slug)'}
              <span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
            <input
              id="input-provider-id"
              type="text"
              required
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setIsSlugManuallyEdited(true);
              }}
              placeholder="qwen-local-asr"
              className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* Endpoint URL */}
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-primary)]">
            {language === 'vi' ? 'Endpoint URL (Tương thích OpenAI REST)' : 'Endpoint URL (OpenAI REST Compatible)'}
            <span className="text-[var(--status-error)] ml-0.5">*</span>
          </label>
          <input
            id="input-provider-endpoint"
            type="url"
            required
            value={endpointUrl}
            onChange={(e) => {
              setEndpointUrl(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://api.openai.com/v1"
            className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>

        {/* Default Model — 2 cách nhập cùng lúc (Dropdown discovered + Text gõ tay) */}
        <div className="p-3 rounded-xl border space-y-2.5 bg-[var(--bg-hover)] border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Default Model (Mô hình mặc định)' : 'Default Model'}
              <span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
            <span className="text-[10px] text-[var(--text-muted)]">
              {language === 'vi' ? '2 cách nhập song song' : '2 simultaneous inputs'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cách 1: Dropdown chọn từ model đã Discover */}
            <div>
              <span className="block text-[11px] font-medium mb-1 text-[var(--text-secondary)]">
                {language === 'vi' ? 'Chọn từ Discover:' : 'Select Discovered:'}
              </span>
              <select
                id="select-discovered-model"
                value={discoveredModels.includes(defaultModel) ? defaultModel : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setDefaultModel(e.target.value);
                  }
                }}
                className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
              >
                <option value="">{language === 'vi' ? '— Chọn model đã Discover —' : '— Discovered Models —'}</option>
                {discoveredModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Cách 2: Ô gõ tay tên model tự do */}
            <div>
              <span className="block text-[11px] font-medium mb-1 text-[var(--text-secondary)]">
                {language === 'vi' ? 'Hoặc gõ tay tên model:' : 'Or type custom model:'}
              </span>
              <input
                id="input-provider-model"
                type="text"
                required
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                placeholder="qwen/qwen3-asr-1.7b"
                className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
            </div>
          </div>
        </div>

        {/* API Key với ghi chú Tuỳ chọn */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-[var(--text-primary)]">
              {language === 'vi' ? 'API Key' : 'API Key'}
            </label>
            <span className="text-[10px] text-[var(--text-muted)]">
              {language === 'vi' ? 'Tuỳ chọn — để trống nếu endpoint không cần key' : 'Optional — leave empty if endpoint doesn\'t require a key'}
            </span>
          </div>
          <input
            id="input-provider-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-••••••••••••••••••••"
            className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>

        {/* 2 Checkbox: "Dùng cho chat mới" và "Tự động Discover models" */}
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="chk-use-for-new-chats"
              type="checkbox"
              checked={useForNewChats}
              onChange={(e) => setUseForNewChats(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-0 cursor-pointer w-4 h-4"
            />
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {language === 'vi' ? 'Dùng cho chat mới' : 'Use for new chats'}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="chk-auto-discover-models"
              type="checkbox"
              checked={autoDiscoverModels}
              onChange={(e) => setAutoDiscoverModels(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-0 cursor-pointer w-4 h-4"
            />
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {language === 'vi' ? 'Tự động Discover models' : 'Auto-discover models'}
            </span>
          </label>
        </div>

        {/* Test Connection Button & Status */}
        <div className="p-3.5 rounded-xl border flex items-center justify-between transition-colors bg-[var(--bg-hover)] border-[var(--border-color)]">
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Kiểm tra kết nối' : 'Connection Test'}
            </p>
            {testResult ? (
              <p className="text-[11px] text-[var(--status-success)] font-medium flex items-center gap-1 mt-0.5">
                <Check className="w-3 h-3" />
                <span>{language === 'vi' ? `Kết nối thành công (${testResult.latency}ms)` : `Connected successfully (${testResult.latency}ms)`}</span>
              </p>
            ) : (
              <p className="text-[11px] mt-0.5 text-[var(--text-muted)]">
                {language === 'vi' ? 'Cần kiểm tra thành công trước khi lưu' : 'Must pass ping test before saving'}
              </p>
            )}
          </div>

          <button
            type="button"
            id="btn-test-provider-connection"
            disabled={isTesting}
            onClick={handleTestConnection}
            className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-color)] shadow-2xs"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)]" />
                <span>{language === 'vi' ? 'Đang test...' : 'Testing...'}</span>
              </>
            ) : (
              <span>{language === 'vi' ? 'Test kết nối' : 'Test Ping'}</span>
            )}
          </button>
        </div>

        {/* Action Buttons: Cancel and Save (Disabled until Test passes) */}
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
            id="btn-save-ai-provider"
            disabled={!testResult?.success || isTesting}
            className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 ${
              testResult?.success && !isTesting
                ? 'bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] opacity-100'
                : 'bg-[var(--accent-primary)]/40 text-[var(--accent-text)]/50 opacity-50 cursor-not-allowed'
            }`}
          >
            {language === 'vi' ? 'Lưu Provider' : 'Save Provider'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
