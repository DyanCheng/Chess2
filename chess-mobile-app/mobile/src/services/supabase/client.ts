// ============================================================
// Supabase Client Configuration
// ============================================================

// TODO: Replace with actual Supabase project URL and anon key
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

/**
 * Supabase client instance
 * Uncomment and configure when Supabase is set up:
 *
 * import { createClient } from '@supabase/supabase-js';
 * export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
 *   auth: {
 *     storage: AsyncStorage,
 *     autoRefreshToken: true,
 *     persistSession: true,
 *     detectSessionInUrl: false,
 *   },
 * });
 */

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};

// Mock Supabase client for development
export const supabase = {
  auth: {
    signUp: async (credentials: { email: string; password: string }) => {
      return { data: { user: { id: 'mock_user' } }, error: null };
    },
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      return { data: { user: { id: 'mock_user' }, session: { access_token: 'mock_token' } }, error: null };
    },
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: { access_token: 'mock_token' } }, error: null }),
  },
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => ({ data: null, error: null }),
        then: async () => ({ data: [], error: null }),
      }),
      order: (column: string, options?: any) => ({
        limit: (count: number) => ({
          then: async () => ({ data: [], error: null }),
        }),
      }),
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => ({ data: null, error: null }),
      }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        then: async () => ({ data: null, error: null }),
      }),
    }),
  }),
};
