export type Role = 'user' | 'admin';
export type Plan = 'free' | 'pro' | 'ultra';

export interface SessionPayload {
  sub: string;
  email: string;
  role: Role;
  plan: Plan;
  processingMinutesUsed: number;
  processingMinutesLimit: number;
}

export const COOKIE_NAME = 'zero_ai_note_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days