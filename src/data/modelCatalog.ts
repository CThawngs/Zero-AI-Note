export interface ModelCatalogItem {
  id: string;
  name: string;
  provider: string;
  providerId: string;
  description: string;
  badge: string;
  isSystem: boolean;
  status: 'active' | 'inactive';
}

export interface ProviderCatalogPreset {
  id: string;
  name: string;
  endpointUrl: string;
  defaultModel: string;
  models: { id: string; name: string; desc: string; badge?: string }[];
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
    description: 'Mô hình chuẩn tốc độ cao & tối ưu hoá cho ghi chú đa phương thức',
    badge: 'Mặc định',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    description: 'Bản nâng cấp thế hệ mới, tối ưu độ chính xác và trích xuất học thuật',
    badge: 'Khuyên dùng',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-2.0-flash-thinking-exp',
    name: 'Gemini 2.0 Flash Thinking (CoT)',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    description: 'Mô hình suy luận chuyên sâu với luồng suy nghĩ Chain-of-Thought',
    badge: 'Suy luận cao',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-2.0-pro-exp',
    name: 'Gemini 2.0 Pro Experimental',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    description: 'Mô hình Pro cho các tác vụ nghiên cứu khoa học và mã hoá phức tạp',
    badge: 'Pro Tier',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    description: 'Phiên bản siêu nhẹ, phản hồi tức thì với độ trễ cực thấp',
    badge: 'Siêu tốc',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro (2M Context)',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    description: 'Cửa sổ ngữ cảnh khổng lồ 2 triệu tokens, xử lý sách và video dài hàng giờ',
    badge: '2M Context',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    description: 'Mô hình Flash ổn định và cân bằng tốt giữa tốc độ và chất lượng',
    badge: 'Ổn định',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-3.0-flash-preview',
    name: 'Gemini 3.0 Flash (Preview)',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    description: 'Thế hệ mô hình 3.0 thử nghiệm với kiến trúc xử lý ma trận mới',
    badge: 'Preview',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Preview)',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    description: 'Mô hình 3.1 Pro phục vụ phân tích tài liệu học thuật chuyên sâu',
    badge: 'Preview Pro',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash (Next-Gen)',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    description: 'Mô hình Flash thế hệ 3.5 tiên tiến nhất',
    badge: 'Next-Gen',
    isSystem: true,
    status: 'active',
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash (Hybrid Reasoning)',
    provider: 'Google AI (Free Pool)',
    providerId: 'google-system',
    description: 'Mô hình đa nhiệm kết hợp suy luận phân tích tự điều chỉnh linh hoạt',
    badge: 'Hybrid CoT',
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
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Nhanh & Tối ưu ghi chú' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Bản cải tiến học thuật' },
      { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking', desc: 'Suy luận CoT' },
      { id: 'gemini-2.0-pro-exp', name: 'Gemini 2.0 Pro', desc: 'Chuyên sâu & Mã nguồn' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: '2M tokens context' },
      { id: 'gemini-3.0-flash-preview', name: 'Gemini 3.0 Flash Preview', desc: 'Thế hệ 3.0' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', desc: 'Thế hệ 3.1 Pro' },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', desc: 'Next-Gen Flash' },
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', desc: 'Hybrid Reasoning' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    endpointUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Rẻ, nhanh & thông minh' },
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', desc: 'Mô hình Flagship đa phương thức' },
      { id: 'o3-mini', name: 'o3-mini (High Reasoning)', desc: 'Suy luận toán & logic cấp cao' },
      { id: 'o1', name: 'o1 (Deep Thinking)', desc: 'Tư duy sâu cho nghiên cứu' },
      { id: 'o1-mini', name: 'o1-mini', desc: 'Bản o1 nhỏ gọn' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: '128K context' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', desc: 'Tiết kiệm token' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    endpointUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-haiku-20241022',
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', desc: 'Hybrid Reasoning thế hệ mới nhất' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', desc: 'Khả năng viết & lập luận đỉnh cao' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', desc: 'Siêu tốc độ & giá rẻ' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', desc: 'Mô hình phân tích phức tạp' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Multi-Engine Aggregator)',
    endpointUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'deepseek/deepseek-r1',
    models: [
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', desc: 'Mô hình lý luận mã nguồn mở số 1' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Chat)', desc: 'Thông minh & siêu tiết kiệm' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', desc: 'Meta open weights' },
      { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', desc: 'Mô hình khổng lồ 405B' },
      { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', desc: 'Alibaba Cloud SOTA' },
      { id: 'qwen/qwq-32b-preview', name: 'QwQ 32B Preview', desc: 'Reasoning AI' },
      { id: 'mistralai/mistral-large-2411', name: 'Mistral Large 2', desc: '128K context' },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free OR)', desc: 'OpenRouter Free' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet via OR', desc: 'Router Claude' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq (LPU Inference Engine)',
    endpointUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', desc: '500+ tokens/giây' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', desc: 'Phản hồi chớp mắt' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', desc: 'Groq Reasoning' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', desc: '32K context window' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', desc: 'Google Open Weights' },
    ],
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    endpointUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'meta/llama-3.1-70b-instruct',
    models: [
      { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (NIM)', desc: 'Tăng tốc TensorRT-LLM' },
      { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B (NIM)', desc: 'NIM Microservice' },
      { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1 (NVIDIA)', desc: 'Hosted on NVIDIA Cloud' },
      { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2 (NIM)', desc: 'NVIDIA Enterprise' },
      { id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron-4 340B', desc: 'NVIDIA Synthetic Flagship' },
    ],
  },
  {
    id: 'custom',
    name: 'Local LLM (Ollama / vLLM / LM Studio)',
    endpointUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.3:latest',
    models: [
      { id: 'llama3.3:latest', name: 'Llama 3.3 (Local)', desc: 'Chạy trực tiếp trên GPU máy bạn' },
      { id: 'deepseek-r1:latest', name: 'DeepSeek R1 (Local)', desc: 'Ollama local reasoning' },
      { id: 'qwen2.5:latest', name: 'Qwen 2.5 (Local)', desc: 'Đa ngôn ngữ tiếng Việt tốt' },
      { id: 'mistral:latest', name: 'Mistral (Local)', desc: 'Local inference' },
      { id: 'phi4:latest', name: 'Phi-4 (Local)', desc: 'Microsoft Small Model' },
    ],
  },
];
