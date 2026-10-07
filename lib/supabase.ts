import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// EXPO_PUBLIC_* is preferred for local/prod configuration.
// These fallback values match the ByteLearn Supabase project used by the
// GitHub Pages build, so the app does not silently fall back to local data
// when running directly with Expo.
const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://gekygmrwrdkfxrvkwgtl.supabase.co';

const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  'sb_publishable_cEusXQPG0C_PzWQaa_PWrQ_lyvv1Sca';

export const hasSupabaseConfig = Boolean(url && key);

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
