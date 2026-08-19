import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Check, Loader2, Sparkles, AlertCircle, Zap, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { BYOK_PROVIDER_PRESETS, ProviderCatalogPreset } from '../../data/modelCatalog';

interface ModelRow {
  id: string;
  tested: boolean;
  testing: boolean;
  success: boolean;
  error?: string;
}

export const AddProviderModal: React.FC<AddProviderModalProps> = ({ isOpen, onClose }) => {
  const { addAIProvider, setSelectedModel, language, t, addNotification } = useApp();
  const [selectedPresetId, setSelectedPresetId] = useState<string>(BYOK_PROVIDER_PRESETS[0].id);
  const [name, setName] = useState(BYOK_PROVIDER_PRESETS[0].name);
  const [providerId, setProviderId] = useState(BYOK_PROVIDER_PRESETS[0].id);
  const [endpointUrl, setEndpointUrl] = useState(BYOK_PROVIDER_PRESETS[0].endpointUrl);
  const [defaultModel, setDefaultModel] = useState(BYOK_PROVIDER_PRESETS[0].defaultModel);
  const [apiKey, setApiKey] = useState('');
  const [useForNewChats, setUseForNewChats] = useState(true);
  const [autoDiscoverModels, setAutoDiscoverModels] = useState(true);

  // Provider-level connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number; error?: string } | null>(null);

  // Extra models (beyond defaultModel) — each testable independently
  const [extraModels, setExtraModels] = useState<ModelRow[]>([]);
  const [newModelInput, setNewModelInput] = useState('');

  const currentPreset = BYOK_PROVIDER_PRESETS.find(p => p.id === selectedPresetId) || BYOK_PROVIDER_PRESETS[0];

  const applyPreset = (preset: ProviderCatalogPreset) => {
    setSelectedPresetId(preset.id);
    setName(preset.name);
    setProviderId(preset.id);
    setEndpointUrl(preset.endpointUrl);
    setDefaultModel(preset.defaultModel);
    setTestResult(null);
    setExtraModels([]);
    setNewModelInput('');
  };

  const handleTestConnection = async () => {
    if (!endpointUrl.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointUrl, apiKey, defaultModel, providerId }),
      });
      const data = await res.json();
      setIsTesting(false);
      if (data.success) {
        setTestResult({ success: true, latency: data.latency || 120 });
        addNotification(
          language === 'vi' ? 'Kết nối Provider thành công' : 'Provider connected',
          `${name} · ${defaultModel} (${data.latency || '?'}ms)`,
          'success'
        );
      } else {
        setTestResult({ success: false, latency: data.latency || 0, error: data.error });
        addNotification(
          language === 'vi' ? 'Kết nối Provider thất bại' : 'Provider connection failed',
          data.error || (language === 'vi' ? 'API Key hoặc Endpoint không hợp lệ' : 'Invalid API Key or Endpoint'),
          'error'
        );
      }
    } catch (err) {
      setIsTesting(false);
      setTestResult({ success: false, latency: 0, error: err instanceof Error ? err.message : 'Không thể kết nối máy chủ test' });
      addNotification(
        language === 'vi' ? 'Lỗi kết nối Provider' : 'Provider connection error',
        err instanceof Error ? err.message : 'Network error',
        'error'
      );
    }
  };

  const handleTestExtraModel = async (idx: number) => {
    const modelId = extraModels[idx].id;
    if (!modelId.trim() || !endpointUrl.trim()) return;
    setExtraModels(prev => prev.map((m, i) => i === idx ? { ...m, testing: true, success: false, error: undefined } : m));
    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointUrl, apiKey, defaultModel: modelId, providerId }),
      });
      const data = await res.json();
      setExtraModels(prev => prev.map((m, i) => i === idx ? {
        ...m,
        testing: false,
        success: !!data.success,
        error: data.success ? undefined : (data.error || 'Failed'),
      } : m));
      if (data.success) {
        addNotification(
          language === 'vi' ? 'Test Model thành công' : 'Model test passed',
          `${modelId} · ${name}`,
          'success'
        );
      } else {
        addNotification(
          language === 'vi' ? 'Test Model thất bại' : 'Model test failed',
          `${modelId}: ${data.error || ''}`,
          'error'
        );
      }
    } catch (err) {
      setExtraModels(prev => prev.map((m, i) => i === idx ? {
        ...m, testing: false, success: false, error: err instanceof Error ? err.message : 'Network error',
      } : m));
    }
  };

  const addExtraModel = () => {
    const id = newModelInput.trim();
    if (!id || extraModels.some(m => m.id === id)) return;
    setExtraModels(prev => [...prev, { id, tested: false, testing: false, success: false }]);
    setNewModelInput('');
  };

  const removeExtraModel = (idx: number) => {
    setExtraModels(prev => prev.filter((_, i) => i !== idx));
  };

  const canSave = testResult?.success && defaultModel.trim().length > 0;

  const handleSave = () => {
    if (!canSave || !name.trim() || !endpointUrl.trim()) return;
    const finalSlug = providerId.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'custom-provider';
    const addedModels = extraModels.filter(m => m.success).map(m => m.id);

    addAIProvider({
      name: name.trim(),
      providerId: finalSlug,
      endpointUrl: endpointUrl.trim(),
      defaultModel: defaultModel.trim(),
      models: addedModels,
      logoUrl: currentPreset.logoUrl,
      logoEmoji: currentPreset.logoEmoji,
      apiKeyMasked: apiKey.trim() ? `${apiKey.trim().substring(0, 6)}••••••••••••` : 'None (No Auth)',
      useForNewChats,
      autoDiscoverModels,
      streaming: true,
      autoFallback: true,
    });

    if (useForNewChats) setSelectedModel(defaultModel.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'vi' ? 'Tự Kết Nối AI / Thêm API Key Riêng' : 'Connect Your Own AI Provider'}
      subtitle={language === 'vi' ? 'Kết nối trực tiếp API Key riêng của bạn để không bị giới hạn token chung' : 'Connect your own API key to bypass shared rate limits'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
        {/* Provider Quick Presets with brand avatar */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-[var(--text-primary)]">
            {language === 'vi' ? 'Chọn Nhà Cung Cấp:' : 'Select Provider:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {BYOK_PROVIDER_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left truncate ${
                  selectedPresetId === p.id
                    ? 'bg-[var(--accent-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30'
                    : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 bg-[var(--bg-hover)] overflow-hidden"
                >
                  <img src={p.logoUrl} alt={p.name} className="w-4 h-4 object-contain" onError={(e) => { (e.currentTarget.style.display = 'none'); (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'inline'; }} />
                  <span className="hidden">{p.logoEmoji}</span>
                </span>
                <span className="truncate">{p.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name & Provider ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-[var(--text-primary)]">
              {language === 'vi' ? 'Tên hiển thị' : 'Display Name'}<span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Google AI (Gemini)"
              className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-[var(--text-primary)]">
              {language === 'vi' ? 'Provider ID' : 'Provider ID'}<span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
            <input
              type="text" required value={providerId} onChange={(e) => setProviderId(e.target.value)}
              placeholder="google"
              className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
            />
          </div>
        </div>

        {/* Endpoint URL */}
        <div>
          <label className="block text-xs font-medium mb-1 text-[var(--text-primary)]">
            {language === 'vi' ? 'Endpoint URL' : 'Endpoint URL'}<span className="text-[var(--status-error)] ml-0.5">*</span>
          </label>
          <input
            type="url" required value={endpointUrl}
            onChange={(e) => { setEndpointUrl(e.target.value); setTestResult(null); }}
            placeholder="https://api.openai.com/v1"
            className="w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
          />
        </div>

        {/* Default Model */}
        <div className="p-3 rounded-xl border space-y-2 bg-[var(--bg-hover)] border-[var(--border-color)]">
          <label className="block text-xs font-semibold text-[var(--text-primary)]">
            {language === 'vi' ? 'Model mặc định (bắt buộc test)' : 'Default Model (must pass test)'}<span className="text-[var(--status-error)] ml-0.5">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text" required value={defaultModel}
              onChange={(e) => { setDefaultModel(e.target.value); setTestResult(null); }}
              placeholder="gpt-4o-mini"
              className="flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
            />
          </div>
          {/* Suggested models chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentPreset.models.slice(0, 6).map((m) => (
              <button
                key={m.id} type="button"
                onClick={() => { setDefaultModel(m.id); setTestResult(null); }}
                className="px-2 py-1 rounded-lg text-[10px] font-medium border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] cursor-pointer transition-colors"
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* API Key — green border when connected */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-[var(--text-primary)]">
              {language === 'vi' ? 'API Key (Khoá bí mật của bạn)' : 'API Key'}<span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
            <span className="text-[11px] text-[var(--text-muted)]">
              {language === 'vi' ? 'Mã hóa an toàn phía máy chủ' : 'Securely encrypted server-side'}
            </span>
          </div>
          <input
            type="password" value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
            placeholder="AIzaSy... hoặc sk-..."
            className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-colors font-mono bg-[var(--bg-app)] text-[var(--text-primary)] placeholder-[var(--text-muted)] ${
              testResult?.success
                ? 'border-[var(--status-success)] bg-[var(--status-success)]/5'
                : 'border-[var(--border-color)] focus:border-[var(--accent-primary)]'
            }`}
          />
          {testResult?.success && (
            <p className="text-[11px] mt-1 font-medium text-[var(--status-success)] flex items-center gap-1">
              <Check className="w-3 h-3" /> {language === 'vi' ? 'API Key đã kết nối thành công' : 'API Key connected successfully'}
            </p>
          )}
        </div>

        {/* Extra models */}
        <div className="p-3 rounded-xl border space-y-2 bg-[var(--bg-hover)] border-[var(--border-color)]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
            <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            {language === 'vi' ? 'Thêm Model LLM khác (tuỳ chọn)' : 'Add more LLM models (optional)'}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text" value={newModelInput}
              onChange={(e) => setNewModelInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtraModel(); } }}
              placeholder="model-id (vd: gpt-4o)"
              className="flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
            />
            <button
              type="button" onClick={addExtraModel}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] cursor-pointer active:scale-95 transition-all"
            >
              {language === 'vi' ? 'Thêm' : 'Add'}
            </button>
          </div>
          <div className="space-y-1.5">
            {extraModels.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)]">
                <span className={`w-2 h-2 rounded-full shrink-0 ${m.success ? 'bg-[var(--status-success)]' : m.error ? 'bg-[var(--status-error)]' : 'bg-[var(--text-muted)]'}`} />
                <span className="flex-1 text-xs font-mono truncate text-[var(--text-primary)]">{m.id}</span>
                <button
                  type="button" disabled={m.testing}
                  onClick={() => handleTestExtraModel(idx)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] cursor-pointer transition-colors disabled:opacity-50"
                >
                  {m.testing ? <Loader2 className="w-3 h-3 animate-spin" /> : (language === 'vi' ? 'Test' : 'Test')}
                </button>
                <button
                  type="button" onClick={() => removeExtraModel(idx)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--status-error)] cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox" checked={useForNewChats} onChange={(e) => setUseForNewChats(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-0 cursor-pointer w-4 h-4"
            />
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {language === 'vi' ? 'Đặt làm mô hình mặc định cho các ghi chú mới' : 'Set as default model for new notes'}
            </span>
          </label>
        </div>

        {/* Single button: Test (when not connected) → Save (when connected) */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer active:scale-95 transition-all bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {t('cancel')}
          </button>

          {!testResult?.success ? (
            <button
              type="button" id="btn-test-provider-connection"
              disabled={isTesting || !endpointUrl.trim()}
              onClick={handleTestConnection}
              className="px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isTesting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>{language === 'vi' ? 'Đang test...' : 'Testing...'}</span></> : <><Zap className="w-3.5 h-3.5" /><span>{language === 'vi' ? '⚡ Test Kết Nối' : '⚡ Test Connection'}</span></>}
            </button>
          ) : (
            <button
              type="submit" id="btn-save-ai-provider"
              disabled={!canSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 bg-[var(--status-success)] hover:opacity-90 text-white flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Lưu & Kích Hoạt' : 'Save & Activate'}</span>
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
