/**
 * FLOWMATE - Lapisan data (Supabase). Semua halaman membaca lewat DB.* (sinkron, dari cache memori)
 * dan menulis lewat DB.* (async, ke Supabase lalu cache diperbarui). Keamanan dijaga RLS di database.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
const pad2 = n => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const fmtDate = (iso, withTime) => {
    if (!iso) return '-';
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
        (withTime ? ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '');
};
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
const isAdminRole = r => r === 'admin' || r === 'superadmin';
const emailOf = usn => `${String(usn).trim().toLowerCase()}@${FLOWMATE_CONFIG.EMAIL_DOMAIN}`;

let sb = null; // klien Supabase
function initSupabase() {
    if (!CONFIG_OK || !window.supabase) return false;
    sb = window.supabase.createClient(FLOWMATE_CONFIG.SUPABASE_URL, FLOWMATE_CONFIG.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
    return true;
}

// ---- cache memori ----
const C = { me: null, profiles: [], screenings: [], journal: [], actions: [] };
const toProfile = r => ({ id: r.id, username: r.username, nama: r.nama, role: r.role, phone: r.phone || '', registerDate: (r.created_at || '').slice(0, 10) });
const unameOf = id => (C.profiles.find(p => p.id === id) || {}).username || (C.me && C.me.id === id ? C.me.username : '');
const toScr = r => ({ ...r.data, id: r.id, date: r.created_at });
const toJr = r => ({ id: r.id, userId: r.user_id, username: unameOf(r.user_id), date: r.entry_date, pain: r.pain, flow: r.flow, periodStart: r.period_start, mood: r.mood, sleep: Number(r.sleep), stress: r.stress, symptoms: r.symptoms || [], actions: r.actions || [], note: r.note || '', loc: r.loc || [0], impaired: !!r.impaired });
const toAct = r => ({ id: r.id, username: unameOf(r.user_id), date: r.created_at, recId: r.rec_id, title: r.title, duration: r.duration, painBefore: r.pain_before });

/** Ambil semua baris (PostgREST membatasi 1000 baris per permintaan -> halaman demi halaman). */
async function fetchAll(table, orderCol) {
    const out = [], size = 1000;
    for (let from = 0; ; from += size) {
        const { data, error } = await sb.from(table).select('*').order(orderCol, { ascending: false }).range(from, from + size - 1);
        if (error) throw error;
        out.push(...data); if (data.length < size) break;
    }
    return out;
}
const fail = (e, msg) => { console.error(e); return { ok: false, error: msg || (e && e.message) || 'Terjadi kesalahan.' }; };

const DB = {
    // ---------- baca (sinkron, dari cache) ----------
    me() { return C.me; },
    users() { return C.profiles; },
    user(username) { const u = String(username || '').trim().toLowerCase(); return C.profiles.find(x => x.username === u) || null; },
    screenings(username) { return (username ? C.screenings.filter(s => s.username === username) : [...C.screenings]).sort((a, b) => b.date.localeCompare(a.date)); },
    lastScreening(username) { return DB.screenings(username)[0] || null; },
    journal(username) { return C.journal.filter(j => j.username === username).sort((a, b) => b.date.localeCompare(a.date)); },
    allJournal() { return C.journal; },
    actions(username) { return C.actions.filter(a => a.username === username).sort((a, b) => b.date.localeCompare(a.date)); },
    allActions() { return C.actions; },

    // ---------- muat data setelah login ----------
    async loadAll() {
        try {
            const { data: { session } } = await sb.auth.getSession();
            if (!session) { DB.clear(); return { ok: true, user: null }; }
            const { data: prof, error: pe } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
            if (pe || !prof) { await sb.auth.signOut(); DB.clear(); return { ok: true, user: null }; }
            C.me = toProfile(prof);
            const [profiles, scr, jr, act] = await Promise.all([fetchAll('profiles', 'created_at'), fetchAll('screenings', 'created_at'), fetchAll('journal_entries', 'entry_date'), fetchAll('actions', 'created_at')]);
            C.profiles = profiles.map(toProfile); C.screenings = scr.map(toScr);
            C.journal = jr.map(toJr); C.actions = act.map(toAct);
            return { ok: true, user: C.me };
        } catch (e) { return fail(e, 'Gagal memuat data. Periksa koneksi internet.'); }
    },
    clear() { C.me = null; C.profiles = []; C.screenings = []; C.journal = []; C.actions = []; },
    async refreshProfiles() { const rows = await fetchAll('profiles', 'created_at'); C.profiles = rows.map(toProfile); },

    // ---------- tulis ----------
    async addScreening(rec) {
        try {
            const { data, error } = await sb.from('screenings').insert({
                user_id: C.me.id, username: C.me.username, nama: C.me.nama, tipe: rec.tipe || 'pre', walidd_score: rec.walidd.score, category: rec.walidd.cat,
                qol_total: rec.qol.total, has_red_flag: rec.redFlags.length > 0, data: rec,
            }).select().single();
            if (error) throw error;
            const saved = toScr(data); C.screenings.push(saved); return { ok: true, rec: saved };
        } catch (e) { return fail(e, 'Gagal menyimpan hasil skrining. Coba lagi.'); }
    },
    async saveJournal(e) {
        try {
            const { data, error } = await sb.from('journal_entries').upsert({
                user_id: C.me.id, entry_date: e.date, pain: e.pain, flow: e.flow, period_start: !!e.periodStart, mood: e.mood, sleep: e.sleep, stress: e.stress,
                symptoms: e.symptoms, actions: e.actions, loc: e.loc || [0], impaired: !!e.impaired, note: e.note || null, updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,entry_date' }).select().single();
            if (error) throw error;
            C.journal = C.journal.filter(j => !(j.userId === C.me.id && j.date === e.date)); C.journal.push(toJr(data)); return { ok: true };
        } catch (er) { return fail(er, 'Gagal menyimpan catatan. Coba lagi.'); }
    },
    async deleteJournal(date) {
        try {
            const { error } = await sb.from('journal_entries').delete().eq('user_id', C.me.id).eq('entry_date', date);
            if (error) throw error;
            C.journal = C.journal.filter(j => !(j.userId === C.me.id && j.date === date)); return { ok: true };
        } catch (er) { return fail(er, 'Gagal menghapus catatan.'); }
    },
    async addAction(a) {
        try {
            const { data, error } = await sb.from('actions').insert({ user_id: C.me.id, rec_id: a.recId, title: a.title, duration: a.duration, pain_before: a.painBefore }).select().single();
            if (error) throw error;
            C.actions.push(toAct(data)); return { ok: true };
        } catch (er) { return fail(er, 'Gagal mencatat terapi.'); }
    },
    async updateProfile(fields) { // {phone, nama}
        try {
            const { data, error } = await sb.from('profiles').update(fields).eq('id', C.me.id).select().single();
            if (error) throw error;
            C.me = toProfile(data); const i = C.profiles.findIndex(p => p.id === C.me.id); if (i >= 0) C.profiles[i] = C.me; return { ok: true };
        } catch (er) { return fail(er, 'Gagal menyimpan profil. Pastikan nomor telepon valid.'); }
    },
    async setRole(username, role) { // hanya superadmin (dijaga trigger database)
        try {
            const u = DB.user(username);
            const { data, error } = await sb.from('profiles').update({ role }).eq('id', u.id).select();
            if (error) throw error;
            if (!data || !data.length) return { ok: false, error: 'Tidak diizinkan: hanya superadmin yang boleh mengubah peran.' };   // RLS menolak diam-diam
            u.role = role; return { ok: true };
        } catch (er) { return fail(er, 'Gagal mengubah peran (hanya superadmin yang boleh).'); }
    },
    /** action: 'create' | 'delete' | 'reset' -> Edge Function admin (lihat ADMIN_FUNCTION di config.js) */
    async adminAction(body) {
        try {
            const { data, error } = await sb.functions.invoke(FLOWMATE_CONFIG.ADMIN_FUNCTION, { body });
            if (error) throw error;
            if (!data || !data.ok) return { ok: false, error: (data && data.error) || 'Aksi gagal.' };
            await DB.refreshProfiles(); return { ok: true };
        } catch (er) { return fail(er, 'Fungsi server belum aktif atau tidak bisa dihubungi.'); }
    },
};
