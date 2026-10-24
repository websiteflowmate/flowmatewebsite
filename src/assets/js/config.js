/** FLOWMATE - Konfigurasi Supabase. Isi dari Dashboard -> Project Settings -> API. */
const FLOWMATE_CONFIG = {
    SUPABASE_URL: 'https://GANTI-DENGAN-PROJECT-ID.supabase.co',
    SUPABASE_ANON_KEY: 'GANTI-DENGAN-ANON-PUBLIC-KEY',   // anon key aman dipublikasikan; keamanan dijaga RLS di database
    EMAIL_DOMAIN: 'flowmate.app',                        // username dipetakan ke username@EMAIL_DOMAIN (harus sama dengan Edge Function)
};
const CONFIG_OK = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(FLOWMATE_CONFIG.SUPABASE_URL) && !/GANTI/.test(FLOWMATE_CONFIG.SUPABASE_ANON_KEY);
