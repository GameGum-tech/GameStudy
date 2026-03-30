import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedClient = null;

export const getSupabaseAdmin = () => {
  if (cachedClient) {
    return cachedClient;
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
};
