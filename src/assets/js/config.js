/** FLOWMATE - Konfigurasi Supabase. Isi dari Dashboard -> Project Settings -> API. */
const FLOWMATE_CONFIG = {
    SUPABASE_URL: 'https://acckcqgncvhuziferltk.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_jQyGQWVULyNdlqlz_Or7OQ_KGzHbBCq',   // publishable/anon key: aman dipublikasikan; keamanan dijaga RLS di database
    ADMIN_FUNCTION: 'super-action',                                      // slug Edge Function admin (harus sama dengan nama fungsi yang di-deploy)
    EMAIL_DOMAIN: 'flowmate.app',                                        // username dipetakan ke username@EMAIL_DOMAIN (harus sama dengan Edge Function)
};
const CONFIG_OK = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(FLOWMATE_CONFIG.SUPABASE_URL) && !/GANTI/.test(FLOWMATE_CONFIG.SUPABASE_ANON_KEY);
