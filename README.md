# FLOWMATE (versi Supabase)

Web intervensi dismenore: Skrining (pre-test / post-test), kuesioner kualitas hidup, rekomendasi nonfarmakologis & farmakologis umum,
Jurnal & Intervensi, FEM AI. Backend: **Supabase** (Postgres + Auth + Edge Function). Frontend statis.

## Mulai
1. Ikuti **SETUP_SUPABASE.md** (buat proyek, matikan Confirm email, jalankan `supabase/schema.sql`, deploy fungsi, isi `config.js`).
2. Jalankan lokal: `python -m http.server 8080` (atau Live Server) lalu buka alamatnya.
3. Daftar akun di web, jadikan superadmin lewat SQL (langkah 6 di SETUP_SUPABASE.md).

## Struktur
- supabase/schema.sql                      tabel, RLS, trigger (SQL Editor)
- supabase/functions/admin-actions/        Edge Function: tambah/hapus akun, reset sandi
- src/assets/js/config.js                  URL & anon key Supabase
- src/assets/js/db.js                      lapisan data (cache memori + tulis ke Supabase)
- src/assets/js/auth.js                    daftar mandiri, login (username), profil, navigasi per peran
- src/assets/js/walidd.js                  skor nyeri, kuesioner 15 butir, skala kualitas hidup, red flag, rekomendasi (DRAFT; validasi pakar)
- src/assets/js/fembot_kb.js, ml_engine.js FEM AI
- src/assets/js/ref_data.js                statistik dataset (scripts/build_reference.py)
- src/pages/pasien | admin                 halaman per peran
