/** FLOWMATE - Daftar mandiri, login, sesi, profil. Login memakai username (dipetakan ke email internal). */
let captchaAnswer = 0, failCount = 0, lockUntil = 0, authTab = 'masuk';
const RESERVED_USERNAMES = ['admin', 'superadmin', 'root', 'flowmate'];

function generateCaptcha() {
    const a = Math.floor(Math.random() * 15) + 1, b = Math.floor(Math.random() * (20 - a)) + 1; // a + b <= 20
    captchaAnswer = a + b;
    document.querySelectorAll('.captcha-q').forEach(e => e.textContent = `${a} + ${b} = ?`);
    document.querySelectorAll('.captcha-in').forEach(e => e.value = '');
}
function getCurrentUser() { return DB.me(); }
function togglePwd(id, btn) { const i = $(id); i.type = i.type === 'password' ? 'text' : 'password'; btn.textContent = i.type === 'password' ? 'Lihat' : 'Sembunyi'; }

function switchAuthTab(tab) {
    authTab = tab;
    $('form-masuk').classList.toggle('hidden', tab !== 'masuk'); $('form-daftar').classList.toggle('hidden', tab !== 'daftar');
    $('tab-masuk').className = `flex-1 py-2.5 rounded-xl text-xs font-bold transition ${tab === 'masuk' ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`;
    $('tab-daftar').className = `flex-1 py-2.5 rounded-xl text-xs font-bold transition ${tab === 'daftar' ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`;
    $('login-guide').classList.toggle('hidden', tab !== 'masuk'); authMsg('');
    generateCaptcha();
}
function openLoginModal(tab) {
    const m = $('login-modal'); m.classList.remove('hidden'); m.classList.add('flex');
    switchAuthTab(tab || 'masuk');
    $('reg-consent').checked = false;
    setTimeout(() => $(authTab === 'daftar' ? 'reg-nama' : 'login-username').focus(), 50);
}
function openRegisterModal() { openLoginModal('daftar'); }
function closeLoginModal() { const m = $('login-modal'); m.classList.add('hidden'); m.classList.remove('flex'); }
function authMsg(msg) { const e = $('auth-error'); e.textContent = msg; e.classList.toggle('hidden', !msg); }
function authBusy(on) { document.querySelectorAll('#login-modal button[type=submit]').forEach(b => { b.disabled = on; b.classList.toggle('opacity-60', on); }); }

function checkCaptcha(inputId) {
    if (parseInt($(inputId).value, 10) === captchaAnswer) return true;
    generateCaptcha(); authMsg('Jawaban verifikasi salah. Silakan coba lagi.'); return false;
}
function needConfig() { if (!sb) { authMsg('Supabase belum dikonfigurasi. Isi src/assets/js/config.js terlebih dahulu.'); return true; } return false; }

async function afterAuth() {
    const r = await DB.loadAll();
    if (!r.ok || !r.user) { authMsg(r.error || 'Gagal memuat akun.'); return false; }
    closeLoginModal(); updateUserUI(); navigateTo(homeFor(r.user)); return true;
}

async function handleLoginSubmit(e) {
    e.preventDefault(); authMsg('');
    if (needConfig()) return;
    if (Date.now() < lockUntil) return authMsg(`Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((lockUntil - Date.now()) / 1000)} detik.`);
    if (!checkCaptcha('login-captcha')) return;
    authBusy(true);
    try {
        const { error } = await sb.auth.signInWithPassword({ email: emailOf($('login-username').value), password: $('login-password').value });
        if (error) {
            failCount++; generateCaptcha();
            if (failCount >= 5) { lockUntil = Date.now() + 30000; failCount = 0; return authMsg('Terlalu banyak percobaan. Tunggu 30 detik.'); }
            return authMsg(/network|fetch/i.test(error.message) ? 'Tidak dapat terhubung ke server. Periksa internet.' : 'Username atau kata sandi salah.');
        }
        failCount = 0; $('login-password').value = ''; await afterAuth();
    } finally { authBusy(false); }
}

async function handleRegisterSubmit(e) {
    e.preventDefault(); authMsg('');
    if (needConfig()) return;
    const nama = $('reg-nama').value.trim(), usn = $('reg-username').value.trim().toLowerCase(), pw = $('reg-password').value;
    if (nama.length < 2) return authMsg('Isi nama lengkap.');
    if (!/^[a-z0-9._]{3,20}$/.test(usn)) return authMsg('Username 3–20 karakter: huruf kecil, angka, titik, atau garis bawah.');
    if (RESERVED_USERNAMES.includes(usn)) return authMsg('Username ini dicadangkan. Pilih yang lain.');
    if (pw.length < 6) return authMsg('Kata sandi minimal 6 karakter.');
    if (pw !== $('reg-password2').value) return authMsg('Konfirmasi kata sandi tidak sama.');
    if (!$('reg-consent').checked) return authMsg('Centang persetujuan penggunaan data untuk melanjutkan.');
    if (!checkCaptcha('reg-captcha')) return;
    authBusy(true);
    try {
        const { data: free, error: ce } = await sb.rpc('username_available', { u: usn });
        if (ce) throw ce;
        if (!free) return authMsg('Username sudah dipakai. Pilih yang lain.');
        const { data, error } = await sb.auth.signUp({ email: emailOf(usn), password: pw, options: { data: { username: usn, nama, consent: true } } });
        if (error) return authMsg(/already|registered/i.test(error.message) ? 'Username sudah dipakai.' : /rate|too many/i.test(error.message) ? 'Terlalu banyak percobaan. Coba lagi nanti.' : 'Pendaftaran gagal: ' + error.message);
        if (!data.session) return authMsg('Akun dibuat, tetapi sistem meminta verifikasi email. Matikan "Confirm email" di pengaturan Supabase (lihat SETUP_SUPABASE.md).');
        ['reg-password', 'reg-password2'].forEach(i => $(i).value = ''); await afterAuth();
    } catch (er) { console.error(er); authMsg('Tidak dapat terhubung ke server. Periksa internet.'); }
    finally { authBusy(false); }
}

const homeFor = u => (u && isAdminRole(u.role)) ? 'dashboard_admin' : (u ? 'beranda' : 'landing');
function goHome() { navigateTo(homeFor(getCurrentUser())); }
async function logoutUser() { try { await sb.auth.signOut(); } catch (e) { console.error(e); } DB.clear(); toggleFloatingBot(false); updateUserUI(); navigateTo('landing'); }

/* ---------- Profil ---------- */
function openProfileModal() {
    const u = getCurrentUser(); if (!u) return;
    const roleLabel = { pasien: 'Pasien', admin: 'Admin', superadmin: 'Super Admin' }[u.role];
    const row = (l, v) => `<div class="p-3 bg-slate-50 rounded-2xl border border-slate-100"><p class="text-[10px] text-slate-400 font-bold uppercase">${l}</p><p class="font-bold text-slate-800 text-sm">${v}</p></div>`;
    document.body.insertAdjacentHTML('beforeend', `
    <div id="profile-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-3 animate-fade-in my-auto">
        <div class="flex justify-between items-center border-b pb-3"><h3 class="font-extrabold text-slate-800 text-sm">👤 Informasi Profil</h3><button onclick="closeProfileModal()" class="text-slate-400 hover:text-slate-600">✕</button></div>
        <div class="space-y-2 text-xs text-slate-700">
          ${row('Nama lengkap', esc(u.nama))}${row('Username', esc(u.username))}${row('Peran', roleLabel)}${row('Tanggal registrasi', fmtDate(u.registerDate))}
          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100"><p class="text-[10px] text-slate-400 font-bold uppercase">Nomor telepon <span class="normal-case font-medium">(opsional)</span></p>
            <input id="profile-phone" type="tel" value="${esc(u.phone || '')}" placeholder="Contoh: 0812xxxxxxx" class="mt-1 w-full text-sm font-bold bg-transparent focus:outline-none"></div>
          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100"><p class="text-[10px] text-slate-400 font-bold uppercase">Kata sandi</p>
            <div class="flex justify-between items-center"><p class="font-bold text-slate-800 text-sm">••••••••</p><button onclick="$('pwd-change').classList.toggle('hidden')" class="text-[11px] font-bold text-brand-600">Ubah</button></div>
            <div id="pwd-change" class="hidden mt-2 space-y-2">
              <input id="pwd-old" type="password" placeholder="Kata sandi lama" class="w-full text-xs p-2.5 rounded-xl border border-slate-200">
              <input id="pwd-new" type="password" placeholder="Kata sandi baru (min. 6 karakter)" class="w-full text-xs p-2.5 rounded-xl border border-slate-200"></div></div>
        </div>
        <p id="profile-msg" class="hidden text-xs font-semibold rounded-xl p-2.5"></p>
        <div class="grid grid-cols-2 gap-2"><button onclick="closeProfileModal()" class="bg-slate-100 text-slate-700 font-bold text-xs py-2.5 rounded-xl">Tutup</button><button id="profile-save" onclick="saveProfile()" class="bg-brand-600 text-white font-bold text-xs py-2.5 rounded-xl">Simpan</button></div>
      </div></div>`);
}
function closeProfileModal() { const m = $('profile-modal'); if (m) m.remove(); }
async function saveProfile() {
    const u = getCurrentUser(), msg = $('profile-msg'), btn = $('profile-save');
    const show = (t, ok) => { msg.textContent = t; msg.className = `text-xs font-semibold rounded-xl p-2.5 ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`; };
    const phone = $('profile-phone').value.trim();
    if (phone && !/^[0-9+\-\s]{8,16}$/.test(phone)) return show('Nomor telepon tidak valid.', false);
    const np = $('pwd-new').value, op = $('pwd-old').value;
    btn.disabled = true;
    try {
        if (np || op) {
            if (np.length < 6) return show('Kata sandi baru minimal 6 karakter.', false);
            const { error: le } = await sb.auth.signInWithPassword({ email: emailOf(u.username), password: op });
            if (le) return show('Kata sandi lama salah.', false);
            const { error: ue } = await sb.auth.updateUser({ password: np });
            if (ue) return show('Gagal mengubah kata sandi: ' + ue.message, false);
        }
        const r = await DB.updateProfile({ phone: phone || null });
        if (!r.ok) return show(r.error, false);
        $('pwd-old').value = ''; $('pwd-new').value = ''; show('Profil tersimpan ✓', true);
    } finally { btn.disabled = false; }
}

/* ---------- Navigasi sesuai peran ---------- */
const NAV = {
    guest: [['landing', 'Tentang FLOWMATE'], ['#panduan', 'Panduan Layanan']],
    pasien: [['beranda', '🌸 Beranda'], ['walidd_screening', '🩸 Skrining'], ['catatan_harian', '📊 Jurnal & Intervensi']],
    admin: [['dashboard_admin', '📊 Overview System'], ['intervensi_akun', '🛡️ Kelola User']],
};
function navButton([target, label], mobile) {
    const act = target.startsWith('#') ? `goPanduan()` : `navigateTo('${target}')`;
    return `<button data-nav="${target}" onclick="${act}" class="${mobile ? 'whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100' : ''} hover:text-brand-600 transition">${label}</button>`;
}
function updateUserUI() {
    const user = getCurrentUser();
    const role = !user ? 'guest' : (isAdminRole(user.role) ? 'admin' : 'pasien');
    $('main-nav').innerHTML = NAV[role].map(n => navButton(n)).join('');
    $('mobile-nav').innerHTML = NAV[role].map(n => navButton(n, true)).join('');
    const fab = $('floating-ai-btn');
    fab.classList.toggle('hidden', role !== 'pasien'); fab.classList.toggle('flex', role === 'pasien');
    if (role !== 'pasien') $('floating-fembot-widget').classList.add('hidden');
    $('auth-nav-action').innerHTML = user ? `
        <button onclick="openProfileModal()" class="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full border border-rose-200 transition">
            <span class="text-base">🌸</span>
            <span class="text-left text-xs"><span class="block font-bold text-slate-800 leading-none max-w-[110px] truncate">${esc(user.nama)}</span>
            <span class="block text-[10px] text-brand-600 leading-none mt-0.5 font-bold">${{ pasien: 'Pasien', admin: 'Admin', superadmin: 'Super Admin' }[user.role]}</span></span>
        </button>
        <button onclick="logoutUser()" class="text-xs text-slate-500 hover:text-brand-600 font-bold">Keluar</button>` : `
        <button onclick="openLoginModal('masuk')" class="text-xs font-bold text-slate-700 hover:text-brand-600 px-3 py-2 transition">Masuk</button>
        <button onclick="openRegisterModal()" class="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 sm:px-5 py-2.5 rounded-full shadow-md transition">Daftar & Mulai</button>`;
}
