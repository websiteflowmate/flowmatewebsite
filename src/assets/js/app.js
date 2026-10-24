/** FLOWMATE - Router SPA, halaman publik, dan widget FEM AI. Dimuat paling akhir. */
const PAGES = { // id halaman -> { render, akses }
    landing: { render: () => renderLandingPage(), roles: ['guest', 'pasien', 'admin'] },
    beranda: { render: () => renderBerandaPasien(), roles: ['pasien'] },
    walidd_screening: { render: () => renderSkriningForm(), roles: ['pasien'] },
    rekomendasi: { render: () => renderJurnalHarian(), roles: ['pasien'] },   // digabung ke Jurnal & Intervensi
    catatan_harian: { render: () => renderJurnalHarian(), roles: ['pasien'] },
    dashboard_admin: { render: () => renderDashboardAdmin(), roles: ['admin'] },
    intervensi_akun: { render: () => renderKelolaUserAdmin(), roles: ['admin'] },
};
const roleGroup = u => !u ? 'guest' : (isAdminRole(u.role) ? 'admin' : 'pasien');

function navigateTo(pageId) {
    const user = getCurrentUser(), group = roleGroup(user);
    // Tamu yang membuka halaman skrining / fitur pasien -> diarahkan ke login
    if (!PAGES[pageId]) pageId = 'landing';
    if (!PAGES[pageId].roles.includes(group)) {
        if (group === 'guest') { openLoginModal(); pageId = 'landing'; } else pageId = homeFor(user);
    }
    if (group !== 'guest' && pageId === 'landing') pageId = homeFor(user);
    $('app-content').innerHTML = PAGES[pageId].render();
    document.querySelectorAll('[data-nav]').forEach(b => { const on = b.dataset.nav === pageId; b.classList.toggle('text-brand-600', on); b.classList.toggle('font-extrabold', on); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function goPanduan() {
    if (!$('panduan')) navigateTo('landing');
    setTimeout(() => $('panduan')?.scrollIntoView({ behavior: 'smooth' }), 60);
}

/* ---------------- Landing (sebelum login): tanpa bot ---------------- */
function renderLandingPage() {
    const feat = (ic, t, d) => `<div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2"><div class="w-11 h-11 bg-rose-100 rounded-2xl flex items-center justify-center text-xl">${ic}</div><h3 class="font-extrabold text-slate-800 text-sm">${t}</h3><p class="text-xs text-slate-500 leading-relaxed">${d}</p></div>`;
    const step = (n, t, d) => `<div class="flex gap-4"><div class="w-9 h-9 shrink-0 rounded-full bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center">${n}</div><div><h4 class="font-bold text-slate-800 text-sm">${t}</h4><p class="text-xs text-slate-500 mt-0.5 leading-relaxed">${d}</p></div></div>`;
    return `
    <section class="bg-gradient-to-b from-rose-50/70 to-slate-50 py-14 lg:py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div class="lg:col-span-7 space-y-6">
          <div class="inline-flex items-center gap-2 bg-rose-100/80 border border-rose-200 px-4 py-1.5 rounded-full text-brand-700 text-xs font-bold">🌷 Pendamping Kesehatan Kewanitaan</div>
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">Pahami Siklusmu, <span class="text-brand-600">Atasi Nyeri Haid Langkah demi Langkah.</span></h1>
          <p class="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed">FLOWMATE membantumu menilai nyeri haid lewat skrining, memberi panduan perawatan mandiri tanpa obat, dan mencatat perkembanganmu setiap hari, dengan bahasa yang mudah dipahami.</p>
          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button onclick="openRegisterModal()" class="bg-brand-600 hover:bg-brand-700 text-white font-bold px-7 py-4 rounded-2xl shadow-xl transition hover:-translate-y-0.5 text-sm">Daftar & Mulai Skrining Gratis →</button>
            <button onclick="openLoginModal('masuk')" class="bg-white hover:bg-slate-50 text-slate-800 font-bold px-7 py-4 rounded-2xl border border-slate-200 shadow-sm transition text-sm">Sudah punya akun? Masuk</button>
          </div>
        </div>
        <div class="lg:col-span-5">
          <div class="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl border border-slate-100 space-y-5">
            <div class="flex items-center gap-3"><span class="text-3xl">📊</span><div><h3 class="font-extrabold text-slate-800 text-base">Contoh Ringkasan Kesehatan</h3><p class="text-xs text-slate-400">Tampilan setelah kamu masuk</p></div></div>
            <div class="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl space-y-2">
              <div class="flex justify-between text-xs"><span class="font-bold text-slate-700">Hasil skrining</span><span class="text-amber-700 font-bold">Sedang</span></div>
              <div class="bar"><i style="width:45%;background:#e11d48"></i></div>
            </div>
            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100"><p class="text-lg">♨️</p><p class="text-[11px] font-bold text-slate-700">Kompres hangat</p></div>
              <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100"><p class="text-lg">📈</p><p class="text-[11px] font-bold text-slate-700">Progres nyeri</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div class="text-center space-y-2"><p class="text-brand-600 text-xs font-extrabold uppercase tracking-wider">Informasi Layanan</p><h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Solusi sederhana untuk nyeri haid</h2></div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        ${feat('🩸', 'Skrining', 'Nilai tingkat nyeri haid dari 5 aspek, lengkap dengan kuesioner kualitas hidup, pilihan pre-test/post-test, dan pengecekan tanda bahaya.')}
        ${feat('✨', 'Rekomendasi', 'Panduan perawatan mandiri (kompres hangat, peregangan, relaksasi) dan saran obat pereda nyeri umum tanpa dosis, sesuai hasilmu.')}
        ${feat('📒', 'Jurnal & Intervensi', 'Catat nyeri dan kondisi harianmu, dapatkan rekomendasi hari itu, lalu pantau grafik perubahannya.')}
        ${feat('🤖', 'FEM AI', 'Teman ngobrol 24/7 untuk pertanyaan seputar haid. Bisa santai, formal, atau pakai English.')}
      </div>
    </section>

    <section id="panduan" class="bg-white border-y border-slate-100 py-14 scroll-mt-24">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div class="space-y-5">
          <p class="text-brand-600 text-xs font-extrabold uppercase tracking-wider">Panduan Layanan</p>
          <h2 class="text-2xl font-extrabold text-slate-900">Cara memakai FLOWMATE</h2>
          ${step(1, 'Daftar atau masuk', 'Buat akun sendiri dengan username dan kata sandi (gratis), atau masuk bila sudah punya akun.')}
          ${step(2, 'Isi Skrining', 'Pilih pre-test (sebelum intervensi) atau post-test (sesudah), lalu jawab pertanyaan nyeri haid dan kualitas hidup. Cukup 5–7 menit.')}
          ${step(3, 'Ikuti rekomendasi', 'Lihat hasil, panduan perawatan mandiri, dan saran obat umum. Centang terapi yang sudah kamu lakukan.')}
          ${step(4, 'Catat di Jurnal & Intervensi', 'Catat kondisi harianmu, dapatkan rekomendasi hari itu, lalu unduh hasil analisis dalam PDF kapan saja.')}
        </div>
        <div class="bg-rose-50/70 border border-rose-100 rounded-3xl p-6 space-y-3 self-start">
          <h3 class="font-extrabold text-brand-700 text-sm">Yang perlu kamu tahu</h3>
          <ul class="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
            <li>FLOWMATE adalah alat <b>skrining dan pendamping</b>, bukan alat diagnosis.</li>
            <li>Jika nyeri sangat berat, darah sangat banyak, pingsan, atau demam, segera ke tenaga kesehatan.</li>
            <li>Data skrining dan jurnalmu hanya dapat dilihat olehmu dan admin FLOWMATE.</li>
            <li>Analisis memakai data referensi siklus haid dan pedoman kesehatan umum.</li>
          </ul>
          <button onclick="openRegisterModal()" class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-3 rounded-xl transition mt-2">Daftar & Mulai Skrining</button>
        </div>
      </div>
    </section>`;
}

/* ---------------- FEM AI widget ---------------- */
const fmtBot = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\n)_(.+?)_(?=\n|$)/g, '$1<i class="text-slate-400">$2</i>').replace(/\n/g, '<br>');
let botReady = false;
function botBubble(who, html) {
    const box = $('fembot-widget-messages'); if (!box) return;
    box.insertAdjacentHTML('beforeend', who === 'user'
        ? `<div class="bg-brand-600 text-white p-3 rounded-2xl rounded-br-md max-w-[85%] ml-auto text-xs leading-relaxed">${html}</div>`
        : `<div class="bubble-bot p-3 rounded-2xl rounded-bl-md max-w-[88%] self-start text-slate-700 text-xs leading-relaxed">${html}</div>`);
    box.scrollTop = box.scrollHeight;
}
function toggleFloatingBot(show) {
    const w = $('floating-fembot-widget'), btn = $('floating-ai-btn'), user = getCurrentUser();
    if (show && roleGroup(user) !== 'pasien') return;
    w.classList.toggle('hidden', !show);
    if (user && roleGroup(user) === 'pasien') { btn.classList.toggle('hidden', show); btn.classList.toggle('flex', !show); }
    if (show && !botReady) {
        botReady = true;
        botBubble('bot', fmtBot(`Halo ${user.nama.split(' ')[0]}! 🌸 Aku **FEM AI**. Kamu bisa curhat atau tanya apa aja seputar mens, kram, PMS, atau hasil skriningmu. Pakai bahasa santai, formal, atau English, bebas! 😊`));
        $('fembot-chips').innerHTML = BOT_CHIPS.map(c => `<button type="button" class="chip" onclick="botAsk(this.textContent)">${esc(c)}</button>`).join('');
    }
    if (show) setTimeout(() => $('widget-input')?.focus(), 80);
}
function getBotCtx(extra) {
    const u = getCurrentUser(); if (!u) return {};
    return { lastScr: DB.lastScreening(u.username), cycle: cycleInfo(u.username), journalCount: DB.journal(u.username).length, ...extra };
}
function botAsk(text, extra) {
    text = String(text || '').trim(); if (!text) return;
    toggleFloatingBot(true);
    botBubble('user', esc(text));
    const box = $('fembot-widget-messages');
    box.insertAdjacentHTML('beforeend', '<div id="bot-typing" class="bubble-bot typing p-3 rounded-2xl self-start"><span></span><span></span><span></span></div>');
    box.scrollTop = box.scrollHeight;
    setTimeout(() => {
        $('bot-typing')?.remove();
        let reply; try { reply = femBotReply(text, getBotCtx(extra)); } catch (e) { console.error(e); reply = 'Maaf, aku lagi error 🙏 Coba tanya lagi ya.'; }
        botBubble('bot', fmtBot(reply));
    }, 450 + Math.min(text.length * 8, 500));
}
function handleWidgetChatSubmit(e) { e.preventDefault(); const i = $('widget-input'); const m = i.value; i.value = ''; botAsk(m); }
function sendScreeningToBot() { botAsk('Tolong jelasin hasil skriningku dong', { mode: 'screening' }); }
function sendInterventionToBot(iv) { botAsk('Ini catatan & rekomendasi hari ini, bisa dibahas?', { mode: 'intervention', intervention: iv }); }

document.addEventListener('DOMContentLoaded', async () => {
    const ready = initSupabase();
    $('app-content').innerHTML = '<div class="py-24 text-center text-sm text-slate-400 animate-pulse">Memuat FLOWMATE…</div>';
    let r = { ok: true, user: null };
    if (ready) r = await DB.loadAll();
    updateUserUI();
    navigateTo(homeFor(getCurrentUser()));
    if (!ready) showBanner('Supabase belum dikonfigurasi. Isi <b>src/assets/js/config.js</b> (lihat SETUP_SUPABASE.md), lalu muat ulang.');
    else if (!r.ok) showBanner(esc(r.error));
});
function showBanner(html) {
    $('app-content').insertAdjacentHTML('afterbegin', `<div class="max-w-3xl mx-auto mt-4 px-4"><div class="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl p-4">⚠️ ${html}</div></div>`);
}
