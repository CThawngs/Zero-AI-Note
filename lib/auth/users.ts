import { getSql } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface UserRecord {
  id: string;
  email: string;
  display_name: string | null;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'ultra';
  password_hash: string | null;
  processing_minutes_used: number;
  processing_minutes_limit: number;
}

// In-memory fallback cache if external Neon DB has connection/auth issues
const memoryUsers = new Map<string, UserRecord>();

// Pre-populate with default admin if needed
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'nguyenchithang2804@gmail.com').toLowerCase();

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.toLowerCase().trim();
  try {
    const sql = getSql();
    const rows = await sql`
      select id, email, display_name, role, plan, password_hash,
             processing_minutes_used, processing_minutes_limit
      from profiles
      where email = ${normalized}
    `;
    if (Array.isArray(rows) && rows.length > 0) {
      const r = rows[0] as any;
      const user: UserRecord = {
        id: r.id,
        email: r.email,
        display_name: r.display_name ?? null,
        role: (r.role as 'user' | 'admin') ?? 'user',
        plan: (r.plan as 'free' | 'pro' | 'ultra') ?? 'free',
        password_hash: r.password_hash ?? null,
        processing_minutes_used: r.processing_minutes_used ?? 0,
        processing_minutes_limit: r.processing_minutes_limit ?? 120,
      };
      // Keep memory cache in sync
      memoryUsers.set(normalized, user);
      return user;
    }
  } catch (err) {
    console.warn('Neon DB lookup failed, falling back to memory store:', err);
  }

  // Fallback to memory store
  return memoryUsers.get(normalized) || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  try {
    const sql = getSql();
    const rows = await sql`
      select id, email, display_name, role, plan, password_hash,
             processing_minutes_used, processing_minutes_limit
      from profiles
      where id = ${id}
    `;
    if (Array.isArray(rows) && rows.length > 0) {
      const r = rows[0] as any;
      const user: UserRecord = {
        id: r.id,
        email: r.email,
        display_name: r.display_name ?? null,
        role: (r.role as 'user' | 'admin') ?? 'user',
        plan: (r.plan as 'free' | 'pro' | 'ultra') ?? 'free',
        password_hash: r.password_hash ?? null,
        processing_minutes_used: r.processing_minutes_used ?? 0,
        processing_minutes_limit: r.processing_minutes_limit ?? 120,
      };
      memoryUsers.set(user.email.toLowerCase(), user);
      return user;
    }
  } catch (err) {
    console.warn('Neon DB lookup failed, falling back to memory store:', err);
  }

  // Fallback search in memory
  for (const user of memoryUsers.values()) {
    if (user.id === id) return user;
  }
  return null;
}

export async function createUser(data: {
  id?: string;
  email: string;
  displayName?: string | null;
  role?: 'user' | 'admin';
  plan?: 'free' | 'pro' | 'ultra';
  passwordHash?: string | null;
}): Promise<UserRecord> {
  const normalized = data.email.toLowerCase().trim();
  const userId = data.id || uuidv4();
  const role = data.role || (normalized === ADMIN_EMAIL ? 'admin' : 'user');
  const plan = data.plan || 'free';
  const displayName = data.displayName ?? normalized.split('@')[0];
  const passwordHash = data.passwordHash ?? null;

  const newUser: UserRecord = {
    id: userId,
    email: normalized,
    display_name: displayName,
    role,
    plan,
    password_hash: passwordHash,
    processing_minutes_used: 0,
    processing_minutes_limit: 120,
  };

  memoryUsers.set(normalized, newUser);

  try {
    const sql = getSql();
    await sql`
      insert into profiles (id, email, display_name, role, plan, password_hash, processing_minutes_used, processing_minutes_limit)
      values (${userId}, ${normalized}, ${displayName}, ${role}, ${plan}, ${passwordHash}, 0, 120)
    `;
  } catch (err) {
    console.warn('Neon DB insert failed, saved to memory store:', err);
  }

  return newUser;
}

export async function updateUserPassword(userIdOrEmail: string, passwordHash: string): Promise<boolean> {
  const normalized = userIdOrEmail.toLowerCase().trim();
  let updated = false;

  // Update in memory
  for (const [key, user] of memoryUsers.entries()) {
    if (user.id === userIdOrEmail || user.email === normalized) {
      user.password_hash = passwordHash;
      memoryUsers.set(key, user);
      updated = true;
    }
  }

  // Update in DB
  try {
    const sql = getSql();
    await sql`
      update profiles
      set password_hash = ${passwordHash}
      where id = ${userIdOrEmail} or email = ${normalized}
    `;
    return true;
  } catch (err) {
    console.warn('Neon DB update password failed, updated in memory store:', err);
    return updated;
  }
}
