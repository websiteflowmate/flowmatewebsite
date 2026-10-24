# Setup Supabase untuk FLOWMATE (±20 menit, tanpa install apa pun)

## 1. Buat proyek
1. Daftar/masuk di https://supabase.com → **New project**.
2. Isi nama (mis. `flowmate`), buat **Database Password** (simpan!), pilih region terdekat (mis. *Southeast Asia / Singapore*), paket **Free**.
3. Tunggu proyek selesai dibuat (±2 menit).

## 2. Matikan verifikasi email (wajib)
FLOWMATE memakai username, bukan email asli, jadi verifikasi email harus dimatikan.
**Authentication → Sign In / Providers (atau Providers) → Email** → matikan **Confirm email** → Save.
Pastikan **Allow new users to sign up** tetap aktif.

## 3. Buat tabel & aturan keamanan
**SQL Editor → New query** → tempel seluruh isi `supabase/schema.sql` → **Run**. Harus muncul "Success".

## 4. Pasang fungsi server (hapus akun / reset sandi / tambah akun oleh admin)
> Jangan tertukar dengan langkah 3: langkah 3 memakai `schema.sql` di **SQL Editor**; langkah ini memakai **`index.ts`** di **Edge Functions**.

1. Menu kiri **Edge Functions** → **Deploy a new function** → pilih **Via Editor**.
2. Nama fungsi persis: `admin-actions`.
3. Editor sudah berisi kode contoh dari Supabase. **Hapus semua kode contoh itu**, lalu tempel seluruh isi `supabase/functions/admin-actions/index.ts`.
4. Klik **Deploy**. Biarkan opsi *Verify JWT* tetap aktif. (Kunci rahasia otomatis tersedia, tidak perlu diisi.)

## 5. Hubungkan web
**Project Settings → API**: salin **Project URL** dan **anon / publishable key** ke `src/assets/js/config.js`.
(Anon key memang boleh publik; keamanan dijaga aturan RLS dari langkah 3. **Jangan** pernah memakai `service_role` key di web.)

## 6. Jadikan dirimu superadmin
1. Jalankan web (`python -m http.server 8080` atau Live Server di VS Code, lalu buka alamatnya) → tab **Daftar** → buat akun (username jangan `admin`/`superadmin`, mis. `owner`).
2. SQL Editor, jalankan (ganti `owner`):
       update public.profiles set role = 'superadmin' where username = 'owner';
3. Keluar lalu masuk lagi → kamu masuk ke panel admin.
Admin lain dibuat dari menu **Kelola User** (hanya superadmin yang bisa membuat/mengubah admin).

## 7. Ping harian (agar proyek gratis tidak dijeda setelah 7 hari tanpa aktivitas)
Daftar gratis di https://cron-job.org → buat cron job harian:
- URL: `https://PROJECT-ID.supabase.co/rest/v1/rpc/ping`
- Method: **POST**
- Headers: `apikey: ANON_KEY` dan `Authorization: Bearer ANON_KEY`, `Content-Type: application/json`
- Body: `{}`
Aktivitas dari pengguna sungguhan juga menghitung. Ping hanya jaring pengaman untuk masa sepi.

## 8. Hosting (gratis)
Unggah folder proyek ke **Cloudflare Pages** / **Netlify** / **Vercel** (static site, tanpa build command).
Folder `data/`, `scripts/`, `supabase/` boleh dibuang dari yang diunggah (hanya untuk pengembangan).

## 9. Cadangan
Tiap minggu: login admin → **Unduh Rekap Excel**. Simpan file-nya di tempat aman.

## Masalah umum
- *"Supabase belum dikonfigurasi"* → `config.js` belum diisi / belum muat ulang.
- *"…meminta verifikasi email"* → langkah 2 belum dilakukan.
- Daftar gagal terus → pastikan `schema.sql` sudah dijalankan tanpa error.
- Tombol hapus/reset/tambah akun gagal → Edge Function belum di-deploy atau namanya bukan `admin-actions`.
- `EMAIL_DOMAIN` di `config.js` dan di `index.ts` harus sama (`flowmate.app`).
