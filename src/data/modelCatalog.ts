export interface ModelCatalogItem {
  id: string;
  name: string;
  provider: string;
  providerId: string;
  descVi: string;
  descEn: string;
  isSystem: boolean;
  status: 'active' | 'inactive';
}

export interface ProviderCatalogPreset {
  id: string;
  name: string;
  endpointUrl: string;
  defaultModel: string;
  /** Brand logo hình ảnh thật (SVG từ website chính chủ, lưu local public/assets/providers/) */
  logoUrl: string;
  /** Fallback emoji nếu logo load lỗi */
  logoEmoji: string;
  isVerified?: boolean;
  models: { id: string; name: string; descVi: string; descEn: string }[];
}

/**
 * Full Suite of Google Gemini Models for System Default Free Pool
 */
export const SYSTEM_GEMINI_MODELS: ModelCatalogItem[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (Default)',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    descVi: 'Mô hình chuẩn tốc độ cao & tối ưu hoá cho ghi chú đa phương thức',
    descEn: 'High-speed standard model optimized for multimodal note synthesis',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    descVi: 'Mô hình cân bằng tối ưu, hiệu năng cao cho trích xuất học thuật',
    descEn: 'Optimized high-efficiency model for academic extraction',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    descVi: 'Mô hình chuyên sâu cho khối lượng dữ liệu ngữ cảnh siêu lớn (2M tokens)',
    descEn: 'Deep analytical model with large 2M context window',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-2.0-flash-thinking-exp',
    name: 'Gemini 2.0 Flash Thinking (CoT)',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    descVi: 'Mô hình suy luận chuyên sâu với luồng suy nghĩ Chain-of-Thought',
    descEn: 'Deep reasoning model powered by Chain-of-Thought thinking process',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-2.0-pro-exp',
    name: 'Gemini 2.0 Pro Experimental',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    descVi: 'Mô hình Pro cho các tác vụ nghiên cứu khoa học và mã hoá phức tạp',
    descEn: 'Pro model for complex scientific research and advanced coding tasks',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    descVi: 'Phiên bản siêu nhẹ, phản hồi tức thì với độ trễ cực thấp',
    descEn: 'Ultra lightweight edition with near-instantaneous response times',
    isSystem: true,
    status: 'active',
  },
];

/**
 * Full Catalog Presets for BYOK Providers
 */
export const BYOK_PROVIDER_PRESETS: ProviderCatalogPreset[] = [
  {
    id: 'google',
    name: 'Google AI Studio (Gemini BYOK)',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
    logoUrl: '/assets/providers/google.svg',
    logoEmoji: '✦',
    isVerified: true,
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', descVi: 'Nhanh & Tối ưu ghi chú', descEn: 'Fast & Note-taking optimized' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', descVi: 'Bản cải tiến học thuật', descEn: 'Academic synthesis upgrade' },
      { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking', descVi: 'Suy luận Chain-of-Thought', descEn: 'Chain-of-Thought reasoning' },
      { id: 'gemini-2.0-pro-exp', name: 'Gemini 2.0 Pro', descVi: 'Chuyên sâu & Nghiên cứu', descEn: 'Deep research & coding' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', descVi: '2M tokens context', descEn: '2M token context window' },
      { id: 'gemini-3.0-flash-preview', name: 'Gemini 3.0 Flash Preview', descVi: 'Thế hệ 3.0', descEn: 'Generation 3.0 preview' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', descVi: 'Thế hệ 3.1 Pro', descEn: 'Generation 3.1 Pro preview' },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', descVi: 'Next-Gen Flash', descEn: 'Next-Gen Flash architecture' },
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', descVi: 'Hybrid Reasoning', descEn: 'Hybrid adaptive reasoning' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    endpointUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    logoUrl: '/assets/providers/openai.svg',
    logoEmoji: '◈',
    isVerified: true,
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', descVi: 'Nhanh, thông minh & tiết kiệm', descEn: 'Fast, intelligent and cost-effective' },
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', descVi: 'Mô hình Flagship đa phương thức', descEn: 'Flagship multimodal intelligence' },
      { id: 'o3-mini', name: 'o3-mini (High Reasoning)', descVi: 'Suy luận logic & toán học cao cấp', descEn: 'High-tier math and logic reasoning' },
      { id: 'o1', name: 'o1 (Deep Thinking)', descVi: 'Tư duy sâu cho nghiên cứu phức tạp', descEn: 'Deep thinking for complex problems' },
      { id: 'o1-mini', name: 'o1-mini', descVi: 'Bản o1 nhỏ gọn', descEn: 'Compact reasoning model' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', descVi: '128K context', descEn: '128K token context window' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', descVi: 'Tiết kiệm token', descEn: 'Standard baseline model' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    endpointUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-haiku-20241022',
    logoUrl: '/assets/providers/anthropic.svg',
    logoEmoji: '✱',
    isVerified: true,
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', descVi: 'Hybrid Reasoning thế hệ mới nhất', descEn: 'Latest hybrid thinking model' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', descVi: 'Khả năng viết & lập luận xuất sắc', descEn: 'Industry-leading writing and coding' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', descVi: 'Siêu tốc độ & giá rẻ', descEn: 'Lightning speed and great value' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', descVi: 'Mô hình phân tích chuyên sâu', descEn: 'Deep analytical capabilities' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Multi-Engine)',
    endpointUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'deepseek/deepseek-r1',
    logoUrl: '/assets/providers/openrouter.svg',
    logoEmoji: '⬡',
    isVerified: true,
    models: [
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', descVi: 'Mô hình lý luận mã nguồn mở số 1', descEn: 'Top open-weights reasoning model' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Chat)', descVi: 'Thông minh & siêu tiết kiệm', descEn: 'High intelligence and low cost' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', descVi: 'Meta open weights', descEn: 'Meta flagship open weights' },
      { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', descVi: 'Mô hình khổng lồ 405B', descEn: 'Frontier-scale 405B open model' },
      { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', descVi: 'Alibaba Cloud SOTA', descEn: 'Alibaba SOTA multilingual model' },
      { id: 'qwen/qwq-32b-preview', name: 'QwQ 32B Preview', descVi: 'Reasoning AI', descEn: 'Open reasoning model' },
      { id: 'mistralai/mistral-large-2411', name: 'Mistral Large 2', descVi: '128K context', descEn: '128K context reasoning' },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free OR)', descVi: 'OpenRouter Free Tier', descEn: 'OpenRouter free endpoint' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet via OR', descVi: 'Router Claude', descEn: 'Routed Claude endpoint' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq (LPU Ultra-Fast)',
    endpointUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    logoUrl: '/assets/providers/groq.svg',
    logoEmoji: '▰',
    isVerified: true,
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', descVi: '500+ tokens/giây', descEn: '500+ tokens/sec inference' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', descVi: 'Phản hồi chớp mắt', descEn: 'Sub-second latency response' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', descVi: 'Groq Reasoning', descEn: 'Fast distilled reasoning' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', descVi: '32K context window', descEn: '32K context mixture of experts' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', descVi: 'Google Open Weights', descEn: 'Google open weights on Groq' },
    ],
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    endpointUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'meta/llama-3.1-70b-instruct',
    logoUrl: '/assets/providers/nvidia.svg',
    logoEmoji: '❖',
    isVerified: true,
    models: [
      { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (NIM)', descVi: 'Tăng tốc TensorRT-LLM', descEn: 'TensorRT-LLM accelerated' },
      { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B (NIM)', descVi: 'NIM Microservice', descEn: 'Lightweight NIM microservice' },
      { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1 (NVIDIA)', descVi: 'Chạy trên NVIDIA Cloud', descEn: 'Hosted on NVIDIA Cloud' },
      { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2 (NIM)', descVi: 'NVIDIA Enterprise', descEn: 'Enterprise high-scale model' },
      { id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron-4 340B', descVi: 'NVIDIA Synthetic Flagship', descEn: 'NVIDIA synthetic flagship model' },
    ],
  },
  {
    id: 'local',
    name: 'Local LLM (Ollama / LM Studio)',
    endpointUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.3:latest',
    logoUrl: '/assets/providers/ollama.svg',
    logoEmoji: '🦙',
    isVerified: true,
    models: [
      { id: 'llama3.3:latest', name: 'Llama 3.3 (Local)', descVi: 'Chạy trực tiếp trên máy của bạn', descEn: 'Runs directly on your machine' },
      { id: 'deepseek-r1:latest', name: 'DeepSeek R1 (Local)', descVi: 'Ollama local reasoning', descEn: 'Local reasoning on Ollama' },
      { id: 'qwen2.5:latest', name: 'Qwen 2.5 (Local)', descVi: 'Đa ngôn ngữ & code tốt', descEn: 'Strong multilingual local model' },
      { id: 'mistral:latest', name: 'Mistral (Local)', descVi: 'Local inference', descEn: 'Local inference baseline' },
      { id: 'phi4:latest', name: 'Phi-4 (Local)', descVi: 'Microsoft Small Model', descEn: 'Microsoft high-efficiency small model' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    endpointUrl: 'https://api.your-domain.com/v1',
    defaultModel: 'gpt-4o-mini',
    logoUrl: '/assets/providers/custom.svg',
    logoEmoji: '⚡',
    isVerified: false,
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', descVi: 'OpenAI-compatible default', descEn: 'OpenAI-compatible default' },
      { id: 'deepseek-chat', name: 'DeepSeek Chat', descVi: 'DeepSeek v3 compatible', descEn: 'DeepSeek v3 compatible' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', descVi: 'Claude proxy', descEn: 'Claude proxy endpoint' },
    ],
  },
];
