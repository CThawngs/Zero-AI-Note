import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Check, Loader2, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { BYOK_PROVIDER_PRESETS, ProviderCatalogPreset } from '../../data/modelCatalog';

export const AddProviderModal: React.FC<AddProviderModalProps> = ({ isOpen, onClose }) => {
  const { addAIProvider, setSelectedModel, language, t } = useApp();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('google');
  const [name, setName] = useState(BYOK_PROVIDER_PRESETS[0].name);
  const [providerId, setProviderId] = useState(BYOK_PROVIDER_PRESETS[0].id);
  const [endpointUrl, setEndpointUrl] = useState(BYOK_PROVIDER_PRESETS[0].endpointUrl);
  const [defaultModel, setDefaultModel] = useState(BYOK_PROVIDER_PRESETS[0].defaultModel);
  const [apiKey, setApiKey] = useState('');
  const [useForNewChats, setUseForNewChats] = useState(true);
  const [autoDiscoverModels, setAutoDiscoverModels] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number; error?: string } | null>(null);
  const [discoveredModels, setDiscoveredModels] = useState<{ id: string; name: string; desc: string }[]>(
    BYOK_PROVIDER_PRESETS[0].models
  );

  const applyPreset = (preset: ProviderCatalogPreset) => {
    setSelectedPresetId(preset.id);
    setName(preset.name);
    setProviderId(preset.id);
    setEndpointUrl(preset.endpointUrl);
    setDiscoveredModels(preset.models);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!endpointUrl) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl,
          apiKey,
          defaultModel,
          providerId,
        }),
      });

      const data = await res.json();
      setIsTesting(false);
      setTestResult({
        success: data.success,
        latency: data.latency || 120,
        error: data.error,
      });
    } catch (err) {
      setIsTesting(false);
      setTestResult({
        success: false,
        latency: 0,
        error: err instanceof Error ? err.message : 'Không thể kết nối máy chủ test',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endpointUrl.trim() || !defaultModel.trim() || !testResult?.success) return;

    const finalSlug = providerId.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'custom-provider';
    
    addAIProvider({
      name: name.trim(),
      providerId: finalSlug,
      endpointUrl: endpointUrl.trim(),
      defaultModel: defaultModel.trim(),
      apiKeyMasked: apiKey.trim() ? `${apiKey.trim().substring(0, 6)}••••••••••••` : 'None (No Auth)',
      useForNewChats,
      autoDiscoverModels,
      streaming: true,
      autoFallback: true,
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
      title={language === 'vi' ? 'Thêm Provider AI (BYOK - Bring Your Own Key)' : 'Add AI Provider (BYOK)'}
      subtitle={language === 'vi' ? 'Kết nối trực tiếp API Key riêng của bạn để không bị giới hạn token chung' : 'Connect your own API key to bypass shared rate limits'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Provider Quick Presets */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-[var(--text-primary)]">
            {language === 'vi' ? 'Chọn Nhà Cung Cấp Nhanh:' : 'Quick Select Provider:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {BYOK_PROVIDER_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left truncate ${
                  selectedPresetId === p.id
                    ? 'bg-[var(--accent-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30'
                    : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Name & Provider ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-[var(--text-primary)]">
              {language === 'vi' ? 'Tên hiển thị' : 'Display Name'}
              <span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
            <input
              id="input-provider-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Google AI (Gemini)"
              className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-[var(--text-primary)]">
              {language === 'vi' ? 'Provider ID' : 'Provider ID'}
              <span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
            <input
              id="input-provider-id"
              type="text"
              required
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="google"
              className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
            />
          </div>
        </div>

        {/* Endpoint URL */}
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-primary)]">
            {language === 'vi' ? 'Endpoint URL' : 'Endpoint URL'}
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
            className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
          />
        </div>

        {/* Model Picker & Input */}
        <div className="p-3 rounded-xl border space-y-2 bg-[var(--bg-hover)] border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Default Model (Mô hình mặc định)' : 'Default Model'}
              <span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <span className="block text-[11px] font-medium mb-1 text-[var(--text-secondary)]">
                {language === 'vi' ? 'Gợi ý từ Provider:' : 'Suggested Models:'}
              </span>
              <select
                id="select-discovered-model"
                value={discoveredModels.some(m => m.id === defaultModel) ? defaultModel : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setDefaultModel(e.target.value);
                    setTestResult(null);
                  }
                }}
                className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
              >
                <option value="">{language === 'vi' ? '— Chọn model có sẵn —' : '— Select preset model —'}</option>
                {discoveredModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.desc})</option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[11px] font-medium mb-1 text-[var(--text-secondary)]">
                {language === 'vi' ? 'Hoặc nhập tên model tùy ý:' : 'Or custom model ID:'}
              </span>
              <input
                id="input-provider-model"
                type="text"
                required
                value={defaultModel}
                onChange={(e) => {
                  setDefaultModel(e.target.value);
                  setTestResult(null);
                }}
                placeholder="gpt-4o-mini"
                className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>

        {/* API Key */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-[var(--text-primary)]">
              {language === 'vi' ? 'API Key (Khoá bí mật của bạn)' : 'API Key'}
              <span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
            <span className="text-[11px] text-[var(--text-muted)]">
              {language === 'vi' ? 'Mã hóa an toàn phía máy chủ' : 'Securely encrypted server-side'}
            </span>
          </div>
          <input
            id="input-provider-key"
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setTestResult(null);
            }}
            placeholder="AIzaSy... hoặc sk-..."
            className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>

        {/* Checkbox "Dùng cho chat mới" */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="chk-use-for-new-chats"
              type="checkbox"
              checked={useForNewChats}
              onChange={(e) => setUseForNewChats(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-0 cursor-pointer w-4 h-4"
            />
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {language === 'vi' ? 'Đặt làm mô hình mặc định cho các ghi chú mới' : 'Set as default model for new notes'}
            </span>
          </label>
        </div>

        {/* Live Test Connection */}
        <div className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors bg-[var(--bg-hover)] border-[var(--border-color)]">
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Kiểm tra kết nối (Test Ping)' : 'Connection Verification'}
            </p>
            {testResult ? (
              testResult.success ? (
                <p className="text-xs text-[var(--status-success)] font-medium flex items-center gap-1 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? `Kết nối thành công (${testResult.latency}ms)` : `Connected successfully (${testResult.latency}ms)`}</span>
                </p>
              ) : (
                <p className="text-xs text-[var(--status-error)] font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{testResult.error || (language === 'vi' ? 'Kết nối thất bại' : 'Connection failed')}</span>
                </p>
              )
            ) : (
              <p className="text-xs mt-0.5 text-[var(--text-muted)]">
                {language === 'vi' ? 'Cần bấm Test thành công trước khi lưu' : 'Must pass live test before saving'}
              </p>
            )}
          </div>

          <button
            type="button"
            id="btn-test-provider-connection"
            disabled={isTesting || !endpointUrl.trim()}
            onClick={handleTestConnection}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border active:scale-95 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-color)] shadow-2xs shrink-0"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)]" />
                <span>{language === 'vi' ? 'Đang test...' : 'Testing...'}</span>
              </>
            ) : (
              <span>{language === 'vi' ? '⚡ Test Kết Nối' : '⚡ Test Connection'}</span>
            )}
          </button>
        </div>

        {/* Action Buttons */}
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
            {language === 'vi' ? 'Lưu & Kích Hoạt Provider' : 'Save & Activate Provider'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
