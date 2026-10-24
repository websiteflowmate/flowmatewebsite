// FLOWMATE - Edge Function "admin-actions": buat / hapus akun dan reset kata sandi oleh admin.
// Memakai service-role key (otomatis tersedia di lingkungan Edge Function, tidak pernah ke browser).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
const reply = (body: unknown) => new Response(JSON.stringify(body), { headers: cors });   // selalu HTTP 200; hasil di field ok/error
const EMAIL_DOMAIN = 'flowmate.app';                                                      // harus sama dengan config.js
const RESERVED = ['admin', 'superadmin', 'root', 'flowmate'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1) Siapa yang memanggil?
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: auth, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !auth.user) return reply({ ok: false, error: 'Tidak terautentikasi.' });
    const { data: caller } = await sb.from('profiles').select('id, role').eq('id', auth.user.id).single();
    if (!caller || !['admin', 'superadmin'].includes(caller.role)) return reply({ ok: false, error: 'Hanya admin yang boleh.' });
    const isSuper = caller.role === 'superadmin';

    const { action, username, password, nama, role } = await req.json();
    const usn = String(username || '').toLowerCase();

    // 2) Buat akun baru
    if (action === 'create') {
      if (!/^[a-z0-9._]{3,20}$/.test(usn) || RESERVED.includes(usn)) return reply({ ok: false, error: 'Username tidak valid / dicadangkan.' });
      if (String(password || '').length < 6) return reply({ ok: false, error: 'Kata sandi minimal 6 karakter.' });
      const newRole = role === 'admin' ? 'admin' : 'pasien';
      if (newRole === 'admin' && !isSuper) return reply({ ok: false, error: 'Hanya superadmin yang boleh membuat admin.' });
      const { data: created, error } = await sb.auth.admin.createUser({
        email: `${usn}@${EMAIL_DOMAIN}`, password, email_confirm: true,
        user_metadata: { username: usn, nama: String(nama || usn).slice(0, 60), consent: false },
      });
      if (error) return reply({ ok: false, error: /already/i.test(error.message) ? 'Username sudah dipakai.' : error.message });
      if (newRole === 'admin') await sb.from('profiles').update({ role: 'admin' }).eq('id', created.user!.id);
      return reply({ ok: true });
    }

    // 3) Hapus / reset: cari target
    const { data: target } = await sb.from('profiles').select('id, role').eq('username', usn).maybeSingle();
    if (!target) return reply({ ok: false, error: 'Pengguna tidak ditemukan.' });
    if (target.role === 'superadmin') return reply({ ok: false, error: 'Akun superadmin tidak boleh diubah.' });
    if (target.role === 'admin' && !isSuper) return reply({ ok: false, error: 'Hanya superadmin yang boleh mengelola admin.' });

    if (action === 'delete') {
      if (target.id === auth.user.id) return reply({ ok: false, error: 'Tidak bisa menghapus akun sendiri.' });
      const { error } = await sb.auth.admin.deleteUser(target.id);          // profil & seluruh datanya ikut terhapus (cascade)
      return reply(error ? { ok: false, error: error.message } : { ok: true });
    }
    if (action === 'reset') {
      if (String(password || '').length < 6) return reply({ ok: false, error: 'Kata sandi minimal 6 karakter.' });
      const { error } = await sb.auth.admin.updateUserById(target.id, { password });
      return reply(error ? { ok: false, error: error.message } : { ok: true });
    }
    return reply({ ok: false, error: 'Aksi tidak dikenal.' });
  } catch (e) {
    return reply({ ok: false, error: 'Kesalahan server: ' + (e as Error).message });
  }
});
