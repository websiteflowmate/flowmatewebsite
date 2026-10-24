/** FLOWMATE - Konfigurasi Supabase. Isi dari Dashboard -> Project Settings -> API. */
const FLOWMATE_CONFIG = {
    SUPABASE_URL: 'https://jfdhonzcyfcpyyernrdt.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZGhvbnpjeWZjcHl5ZXJucmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MzczMzgsImV4cCI6MjEwODQxMzMzOH0.bR7G4_RDR8uDEe8SQyjJYqDkHpeidsXFGHhCzUcpZy4',   // anon key aman dipublikasikan; keamanan dijaga RLS di database
    EMAIL_DOMAIN: 'flowmate.app',                        // username dipetakan ke username@EMAIL_DOMAIN (harus sama dengan Edge Function)
};
const CONFIG_OK = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(FLOWMATE_CONFIG.SUPABASE_URL) && !/GANTI/.test(FLOWMATE_CONFIG.SUPABASE_ANON_KEY);
