import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { 
  Check, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Zap, 
  Plus, 
  X, 
  Lock, 
  Server, 
  ShieldCheck, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BYOK_PROVIDER_PRESETS, ProviderCatalogPreset } from '../../data/modelCatalog';

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModelRow {
  id: string;
  tested: boolean;
  testing: boolean;
  success: boolean;
  error?: string;
}

export const AddProviderModal: React.FC<AddProviderModalProps> = ({ isOpen, onClose }) => {
  const { addAIProvider, aiProviders, setSelectedModel, language, t, addNotification } = useApp();
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>(BYOK_PROVIDER_PRESETS[0].id);
  const [name, setName] = useState(BYOK_PROVIDER_PRESETS[0].name);
  const [providerId, setProviderId] = useState(BYOK_PROVIDER_PRESETS[0].id);
  const [endpointUrl, setEndpointUrl] = useState(BYOK_PROVIDER_PRESETS[0].endpointUrl);
  const [defaultModel, setDefaultModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [useForNewChats, setUseForNewChats] = useState(true);
  const [autoDiscoverModels, setAutoDiscoverModels] = useState(true);

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; endpointUrl?: string; apiKey?: string }>({});

  // Provider-level connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number; error?: string; resolvedModel?: string } | null>(null);

  // Extra models (beyond defaultModel) — each testable independently
  const [extraModels, setExtraModels] = useState<ModelRow[]>([]);
  const [newModelInput, setNewModelInput] = useState('');

  const currentPreset = BYOK_PROVIDER_PRESETS.find(p => p.id === selectedPresetId) || BYOK_PROVIDER_PRESETS[0];
  const isVerifiedPreset = !!currentPreset.isVerified && currentPreset.id !== 'custom';
  const isCustomEndpoint = selectedPresetId === 'custom' || !isVerifiedPreset;

  const applyPreset = (preset: ProviderCatalogPreset) => {
    setSelectedPresetId(preset.id);
    setName(preset.id === 'custom' ? (language === 'vi' ? 'Máy chủ AI Riêng' : 'My Custom AI Server') : preset.name);
    setProviderId(preset.id === 'custom' ? '' : preset.id);
    setEndpointUrl(preset.endpointUrl);
    setDefaultModel('');
    setApiKey('');
    setTestResult(null);
    setExtraModels([]);
    setNewModelInput('');
    setErrors({});
  };

  // Live input validation
  const validateForm = (): boolean => {
    const newErrors: { name?: string; endpointUrl?: string; apiKey?: string } = {};

    // 1. Validate Display Name
    if (!name.trim()) {
      newErrors.name = language === 'vi' ? 'Vui lòng nhập tên hiển thị' : 'Display name is required';
    } else if (isCustomEndpoint && aiProviders.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
      newErrors.name = language === 'vi' ? 'Tên này đã tồn tại, vui lòng chọn tên khác' : 'This name already exists, choose another';
    }

    // 2. Validate Endpoint URL
    if (!endpointUrl.trim()) {
      newErrors.endpointUrl = language === 'vi' ? 'Endpoint URL không được để trống' : 'Endpoint URL is required';
    } else {
      const urlPattern = /^(https?:\/\/)/i;
      if (!urlPattern.test(endpointUrl.trim())) {
        newErrors.endpointUrl = language === 'vi' ? 'URL phải bắt đầu bằng http:// hoặc https://' : 'URL must start with http:// or https://';
      }
    }

    // 3. Validate API Key (required for cloud providers, optional for local/custom)
    if (['google', 'openai', 'anthropic', 'openrouter', 'groq', 'nvidia'].includes(selectedPresetId)) {
      if (!apiKey.trim()) {
        newErrors.apiKey = language === 'vi' ? 'Vui lòng nhập API Key cho nhà cung cấp này' : 'API Key is required for this provider';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getEffectiveModel = (): string => {
    if (defaultModel.trim()) return defaultModel.trim();
    return currentPreset.defaultModel || 'gpt-4o-mini';
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setIsTesting(true);
    setTestResult(null);

    const effectiveModel = getEffectiveModel();
    const effectiveSlug = providerId.trim() || (isCustomEndpoint 
      ? `custom_${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`
      : currentPreset.id);

    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          endpointUrl: endpointUrl.trim(), 
          apiKey: apiKey.trim(), 
          defaultModel: effectiveModel, 
          providerId: effectiveSlug 
        }),
      });
      const data = await res.json();
      setIsTesting(false);
      if (data.success) {
        setTestResult({ 
          success: true, 
          latency: data.latency || 120,
          resolvedModel: data.resolvedModel || effectiveModel
        });
        addNotification(
          language === 'vi' ? 'Kết nối Provider thành công' : 'Provider connected',
          `${name} · ${effectiveModel} (${data.latency || '?'}ms)`,
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
        body: JSON.stringify({ 
          endpointUrl: endpointUrl.trim(), 
          apiKey: apiKey.trim(), 
          defaultModel: modelId, 
          providerId: providerId.trim() || selectedPresetId 
        }),
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

  const canSave = !!testResult?.success;

  const handleSave = () => {
    if (!canSave || !validateForm()) return;

    const effectiveModel = getEffectiveModel();
    const finalSlug = isCustomEndpoint
      ? (providerId.trim() || `custom_${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`)
      : (providerId.trim() || currentPreset.id);

    const addedModels = extraModels.filter(m => m.success).map(m => m.id);
    if (!addedModels.includes(effectiveModel)) {
      addedModels.unshift(effectiveModel);
    }

    addAIProvider({
      name: name.trim(),
      providerId: finalSlug,
      endpointUrl: endpointUrl.trim(),
      defaultModel: effectiveModel,
      models: addedModels,
      logoUrl: currentPreset.logoUrl || '/assets/providers/custom.svg',
      logoEmoji: currentPreset.logoEmoji || '⚡',
      apiKeyMasked: apiKey.trim() ? `${apiKey.trim().substring(0, 6)}••••••••••••` : 'None (No Auth)',
      apiKey: apiKey.trim() || undefined,
      isCustomEndpoint: isCustomEndpoint,
      useForNewChats,
      autoDiscoverModels,
      streaming: true,
      autoFallback: true,
    });

    if (useForNewChats) {
      setSelectedModel(effectiveModel);
    }
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
        {/* Provider Quick Presets with brand avatar & Custom Endpoint option */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-[var(--text-primary)]">
            {language === 'vi' ? 'Chọn Nhà Cung Cấp:' : 'Select Provider:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {BYOK_PROVIDER_PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left truncate ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30'
                      : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 bg-[var(--bg-hover)] overflow-hidden">
                    <img 
                      src={p.logoUrl} 
                      alt={p.name} 
                      className="w-4 h-4 object-contain" 
                      onError={(e) => { 
                        (e.currentTarget.style.display = 'none'); 
                        const next = e.currentTarget.nextElementSibling as HTMLElement;
                        if (next) next.style.display = 'inline'; 
                      }} 
                    />
                    <span className="hidden text-xs">{p.logoEmoji}</span>
                  </span>
                  <span className="truncate">
                    {p.id === 'custom' ? (language === 'vi' ? 'Custom Endpoint' : 'Custom Endpoint') : p.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Name & Provider ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-[var(--text-primary)]">
              {language === 'vi' ? 'Tên hiển thị' : 'Display Name'}<span className="text-[var(--status-error)] ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); setTestResult(null); }}
              placeholder={isCustomEndpoint ? "VD: Private vLLM Server" : "Google AI Studio"}
              className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] text-[var(--text-primary)] ${
                errors.name ? 'border-[var(--status-error)]' : 'border-[var(--border-color)]'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-[var(--status-error)] mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[var(--text-primary)]">
                {language === 'vi' ? 'Provider ID' : 'Provider ID'}
                {isVerifiedPreset ? (
                  <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">({language === 'vi' ? 'Đã khóa' : 'Locked'})</span>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">({language === 'vi' ? 'Tự động' : 'Auto'})</span>
                )}
              </label>
              {isVerifiedPreset && <Lock className="w-3 h-3 text-[var(--text-muted)]" />}
            </div>
            <input
              type="text"
              disabled={isVerifiedPreset}
              value={isVerifiedPreset ? currentPreset.id : providerId}
              onChange={(e) => { setProviderId(e.target.value); setTestResult(null); }}
              placeholder={isCustomEndpoint ? (language === 'vi' ? 'Tự nhận diện theo tên' : 'Auto from name') : currentPreset.id}
              className={`w-full border rounded-xl px-3.5 py-2 text-xs font-mono transition-colors ${
                isVerifiedPreset
                  ? 'bg-[var(--bg-app)]/40 border-[var(--border-color)]/60 text-[var(--text-muted)] cursor-not-allowed select-none'
                  : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]'
              }`}
            />
          </div>
        </div>

        {/* Endpoint URL — Locked for verified providers, fully editable for custom */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-[var(--text-primary)]">
              {language === 'vi' ? 'Endpoint URL' : 'Endpoint URL'}
              <span className="text-[var(--status-error)] ml-0.5">*</span>
              {isVerifiedPreset && (
                <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1.5">
                  ({language === 'vi' ? 'Chuẩn chính thức — Đã bảo vệ' : 'Verified Endpoint — Locked'})
                </span>
              )}
            </label>
            {isVerifiedPreset && <Lock className="w-3 h-3 text-[var(--text-muted)]" />}
          </div>
          <input
            type="url"
            required
            disabled={isVerifiedPreset}
            value={endpointUrl}
            onChange={(e) => { 
              setEndpointUrl(e.target.value); 
              setErrors(prev => ({ ...prev, endpointUrl: undefined }));
              setTestResult(null); 
            }}
            placeholder="https://api.openai.com/v1"
            className={`w-full border rounded-xl px-3.5 py-2 text-xs font-mono transition-colors ${
              isVerifiedPreset
                ? 'bg-[var(--bg-app)]/40 border-[var(--border-color)]/60 text-[var(--text-muted)] cursor-not-allowed select-none'
                : errors.endpointUrl
                  ? 'border-[var(--status-error)] bg-[var(--bg-app)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]'
            }`}
          />
          {errors.endpointUrl && (
            <p className="text-[11px] text-[var(--status-error)] mt-1">{errors.endpointUrl}</p>
          )}
        </div>

        {/* Default Model (Optional) */}
        <div className="p-3.5 rounded-2xl border space-y-2 bg-[var(--bg-hover)] border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Model mặc định' : 'Default Model'}
              <span className="text-[10px] font-normal text-[var(--text-muted)] ml-1.5">
                ({language === 'vi' ? 'Tùy chọn — tự áp dụng model tối ưu' : 'Optional — auto-resolved'})
              </span>
            </label>
            <span className="text-[10px] font-mono text-[var(--accent-primary)] font-bold">
              {getEffectiveModel()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={defaultModel}
              onChange={(e) => { setDefaultModel(e.target.value); setTestResult(null); }}
              placeholder={currentPreset.defaultModel || 'gpt-4o-mini'}
              className="flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
            />
          </div>

          {/* Suggested models chips */}
          {currentPreset.models.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentPreset.models.slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setDefaultModel(m.id); setTestResult(null); }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer ${
                    (defaultModel === m.id || (!defaultModel && currentPreset.defaultModel === m.id))
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                      : 'border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* API Key */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-[var(--text-primary)]">
              {language === 'vi' ? 'API Key (Khóa bí mật)' : 'API Key'}
              {!['local', 'custom'].includes(selectedPresetId) && (
                <span className="text-[var(--status-error)] ml-0.5">*</span>
              )}
              {['local', 'custom'].includes(selectedPresetId) && (
                <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">
                  ({language === 'vi' ? 'Tùy chọn nếu server không đặt mật khẩu' : 'Optional if no auth'})
                </span>
              )}
            </label>
            <span className="text-[11px] text-[var(--text-muted)]">
              {language === 'vi' ? 'Mã hóa an toàn' : 'Securely encrypted'}
            </span>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => { 
              setApiKey(e.target.value); 
              setErrors(prev => ({ ...prev, apiKey: undefined }));
              setTestResult(null); 
            }}
            placeholder={
              selectedPresetId === 'google' 
                ? 'AIzaSy...' 
                : selectedPresetId === 'anthropic' 
                  ? 'sk-ant-...' 
                  : 'sk-...'
            }
            className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none transition-colors font-mono bg-[var(--bg-app)] text-[var(--text-primary)] placeholder-[var(--text-muted)] ${
              testResult?.success
                ? 'border-[var(--status-success)] bg-[var(--status-success)]/5'
                : errors.apiKey
                  ? 'border-[var(--status-error)]'
                  : 'border-[var(--border-color)] focus:border-[var(--accent-primary)]'
            }`}
          />
          {errors.apiKey && (
            <p className="text-[11px] text-[var(--status-error)] mt-1">{errors.apiKey}</p>
          )}
          {testResult?.success && (
            <p className="text-[11px] mt-1.5 font-semibold text-[var(--status-success)] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 
              <span>{language === 'vi' ? 'Xác thực & Kết nối thành công!' : 'Authentication & Connection successful!'} ({testResult.latency}ms)</span>
            </p>
          )}
          {testResult?.error && (
            <p className="text-[11px] mt-1.5 font-medium text-[var(--status-error)] flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{testResult.error}</span>
            </p>
          )}
        </div>

        {/* Extra LLM models */}
        <div className="p-3.5 rounded-2xl border space-y-2.5 bg-[var(--bg-hover)] border-[var(--border-color)]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
            <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>{language === 'vi' ? 'Thêm Model LLM khác (Tùy chọn)' : 'Add more LLM models (Optional)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newModelInput}
              onChange={(e) => setNewModelInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtraModel(); } }}
              placeholder="VD: gpt-4o, claude-3-7-sonnet, deepseek-r1"
              className="flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
            />
            <button
              type="button"
              onClick={addExtraModel}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] cursor-pointer active:scale-95 transition-all"
            >
              {language === 'vi' ? 'Thêm' : 'Add'}
            </button>
          </div>
          {extraModels.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {extraModels.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)]">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${m.success ? 'bg-[var(--status-success)]' : m.error ? 'bg-[var(--status-error)]' : 'bg-[var(--text-muted)]'}`} />
                  <span className="flex-1 text-xs font-mono truncate text-[var(--text-primary)]">{m.id}</span>
                  <button
                    type="button"
                    disabled={m.testing}
                    onClick={() => handleTestExtraModel(idx)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {m.testing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Test'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExtraModel(idx)}
                    className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--status-error)] cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Set as default checkbox */}
        <div className="pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
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

        {/* Actions: 1 button flow (Test Connection → Save & Activate) */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer active:scale-95 transition-all bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {t('cancel')}
          </button>

          {!testResult?.success ? (
            <button
              type="button"
              id="btn-test-provider-connection"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'vi' ? 'Đang kiểm tra kết nối...' : 'Testing connection...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{language === 'vi' ? '⚡ Test Kết Nối' : '⚡ Test Connection'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              id="btn-save-ai-provider"
              disabled={!canSave}
              className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 bg-[var(--status-success)] hover:opacity-90 text-white flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'vi' ? 'Lưu & Kích Hoạt' : 'Save & Activate'}</span>
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
