// Type-safe helpers for Neon queries (avoid raw SQL strings everywhere)

export type QueryResult<T> = T extends Array<infer U> ? U[] : T;

export interface DbUser {
  id: string;
  email: string;
  display_name: string | null;
  role: 'user' | 'admin';
  plan: 'FREE' | 'PRO' | 'ULTRA';
  plan_renews_at: string | null;
  created_at: string;
}

export interface DbNotebook {
  id: string;
  user_id: string;
  title: string;
  tags: string[] | null;
  is_merged: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface DbSource {
  id: string;
  notebook_id: string;
  user_id: string;
  type: 'video' | 'audio' | 'pdf' | 'image' | 'slide' | 'text' | 'url' | 'youtube';
  file_url: string | null;
  original_url: string | null;
  size_bytes: number | null;
  duration_seconds: number | null;
  status: 'pending' | 'processing' | 'processed' | 'error';
  transcript: string | null;
  retention_delete_at: string | null;
  created_at: string;
}

export interface DbNote {
  id: string;
  notebook_id: string;
  user_id: string;
  method: string | null;
  custom_template_id: string | null;
  output_language: string;
  content_structured: Record<string, unknown> | null;
  confidence_flags: Record<string, unknown> | null;
  created_at: string;
}

export interface DbCustomTemplate {
  id: string;
  user_id: string;
  name: string;
  description_prompt: string;
  created_at: string;
}

export interface DbByokProvider {
  id: string;
  user_id: string;
  name: string;
  provider_id: string | null;
  endpoint_url: string | null;
  default_model: string | null;
  api_key_encrypted: string | null;
  is_default: boolean;
  last_test_status: string | null;
  import_free_models: boolean;
  sync_enabled: boolean;
  created_at: string;
}

export interface DbProviderFreeModel {
  id: string;
  provider_id: string;
  model_id: string;
  is_free: boolean;
  last_checked_at: string;
}

export interface DbCoupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  applies_to: 'all' | 'paid';
  usage_limit: number | null;
  usage_count: number;
  expires_at: string | null;
  status: 'active' | 'expired' | 'disabled';
  created_at: string;
}

export interface DbSubscription {
  id: string;
  user_id: string;
  zeroinvoice_invoice_id: string | null;
  status: 'active' | 'canceled' | 'past_due';
  amount: number | null;
  coupon_code: string | null;
  renews_at: string | null;
  created_at: string;
}
