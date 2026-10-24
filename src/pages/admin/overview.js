/** FLOWMATE - Admin / Super Admin: Overview sistem & rekap skrining (tanpa bot) */
let OV = { q: '', cat: 'semua', tipe: 'semua' };
function renderDashboardAdmin() { return `<div id="ov-root" class="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-fade-in">${ovBody()}</div>`; }
function ovRefreshTable() { $('ov-table').innerHTML = ovTable(); }

function ovBody() {
    const users = DB.users(), scrs = DB.screenings(), pas = users.filter(u => u.role === 'pasien'), adm = users.filter(u => isAdminRole(u.role));
    const cnt = k => scrs.filter(s => s.walidd.cat === k).length, n = scrs.length || 1;
    const avgW = scrs.length ? (scrs.reduce((s, x) => s + x.walidd.score, 0) / scrs.length).toFixed(1) : '–';
    const flags = scrs.filter(s => s.redFlags.length).length;
    const stat = (l, v, sub, c = 'text-slate-900') => `<div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm"><p class="text-[10px] font-bold text-slate-400 uppercase">${l}</p><p class="text-3xl font-extrabold ${c} mt-2">${v}</p><span class="text-[10px] text-slate-400">${sub}</span></div>`;
    const dist = (label, k, c) => `<div><div class="flex justify-between text-[11px] text-slate-600 mb-1"><span>${label}</span><b>${cnt(k)} (${Math.round(cnt(k) / n * 100)}%)</b></div><div class="bar"><i style="width:${cnt(k) / n * 100}%;background:${c}"></i></div></div>`;
    return `
    <div class="border-b border-slate-200 pb-5 flex justify-between items-center flex-wrap gap-4">
      <div><span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Panel ${getCurrentUser().role === 'superadmin' ? 'Super Admin' : 'Admin'}</span><h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">⚙️ Overview System</h2></div>
      <button onclick="downloadExcelRekap()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition">📊 Unduh Rekap Excel Skrining</button>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      ${stat('Total User', users.length, `${pas.length} pasien • ${adm.length} admin`)}
      ${stat('Total Skrining', scrs.length, 'nyeri haid + kualitas hidup', 'text-brand-600')}
      ${stat('Rata-rata Skor Nyeri', avgW, `${scrs.filter(x => (x.tipe || 'pre') === 'pre').length} pre-test • ${scrs.filter(x => x.tipe === 'post').length} post-test`)}
      ${stat('Perlu Pemeriksaan', flags, 'skrining dengan tanda bahaya', flags ? 'text-rose-600' : 'text-emerald-600')}
    </div>
    <div class="grid lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3"><h3 class="font-extrabold text-slate-800 text-sm">Sebaran Kategori Dismenore</h3>
        ${dist('Tidak ada', 'tidak', '#10b981')}${dist('Ringan', 'ringan', '#34d399')}${dist('Sedang', 'sedang', '#f59e0b')}${dist('Berat', 'berat', '#e11d48')}</div>
      <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2 text-xs text-slate-600"><h3 class="font-extrabold text-slate-800 text-sm">Data Sistem</h3>
        <p class="flex justify-between"><span>Catatan jurnal</span><b>${DB.allJournal().length}</b></p>
        <p class="flex justify-between"><span>Terapi tercatat dilakukan</span><b>${DB.allActions().length}</b></p>
        <p class="flex justify-between"><span>Data referensi (siklus)</span><b>${REF.n_log.toLocaleString('id-ID')}</b></p>
        <p class="flex justify-between"><span>Penyimpanan</span><b>Browser (lokal)</b></p>
        <p class="flex justify-between"><span>Status</span><b class="text-emerald-600">● Aktif</b></p></div>
    </div>
    <div class="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-4">
      <div class="flex flex-wrap justify-between items-center gap-3"><h3 class="font-extrabold text-slate-800 text-base">📋 Seluruh Hasil Skrining Pasien</h3>
        <div class="flex gap-2"><input oninput="OV.q=this.value;ovRefreshTable()" placeholder="Cari nama / username…" class="text-xs p-2.5 rounded-xl border border-slate-200 w-48 focus:outline-none focus:ring-2 focus:ring-brand-500">
        <select onchange="OV.tipe=this.value;ovRefreshTable()" class="text-xs p-2.5 rounded-xl border border-slate-200"><option value="semua">Pre & Post</option><option value="pre">Pre-test</option><option value="post">Post-test</option></select>
        <select onchange="OV.cat=this.value;ovRefreshTable()" class="text-xs p-2.5 rounded-xl border border-slate-200"><option value="semua">Semua kategori</option><option value="tidak">Tidak ada</option><option value="ringan">Ringan</option><option value="sedang">Sedang</option><option value="berat">Berat</option></select></div></div>
      <div id="ov-table" class="overflow-x-auto">${ovTable()}</div>
    </div>`;
}
function ovTable() {
    const q = OV.q.trim().toLowerCase();
    const rows = DB.screenings().filter(s => (OV.cat === 'semua' || s.walidd.cat === OV.cat) && (OV.tipe === 'semua' || (s.tipe || 'pre') === OV.tipe) && (!q || s.nama.toLowerCase().includes(q) || s.username.toLowerCase().includes(q)));
    if (!rows.length) return '<p class="text-xs text-slate-400 py-6 text-center">Belum ada data skrining yang cocok.</p>';
    return `<table class="w-full text-left text-xs"><thead class="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]"><tr><th class="p-3">Tanggal</th><th class="p-3">Jenis</th><th class="p-3">Nama Pasien</th><th class="p-3">Username</th><th class="p-3">WaLIDD</th><th class="p-3">Kategori</th><th class="p-3">Kualitas Hidup</th><th class="p-3">Tanda Bahaya</th><th class="p-3">Rekomendasi Utama</th><th class="p-3"></th></tr></thead><tbody class="divide-y divide-slate-100 text-slate-700">
      ${rows.map(s => { const t = TONE[s.walidd.tone]; return `<tr><td class="p-3 whitespace-nowrap">${fmtDate(s.date)}</td><td class="p-3"><span class="${(s.tipe || 'pre') === 'post' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'} px-2 py-0.5 rounded-full font-bold text-[10px]">${tipeLabel(s.tipe)}</span></td><td class="p-3 font-bold">${esc(s.nama)}</td><td class="p-3">${esc(s.username)}</td><td class="p-3 font-extrabold text-brand-600">${s.walidd.score}/${WALIDD_MAX}</td>
        <td class="p-3"><span class="${t.bg} ${t.text} px-2 py-0.5 rounded-full font-bold text-[10px]">${esc(s.walidd.label)}</span></td><td class="p-3"><span class="${TONE[qolLevel(s.qol.total).tone].bg} ${TONE[qolLevel(s.qol.total).tone].text} px-2 py-0.5 rounded-full font-bold text-[10px]">${qolLevel(s.qol.total).label}</span></td>
        <td class="p-3">${s.redFlags.length ? `<span class="text-rose-600 font-bold">🚩 ${s.redFlags.length}</span>` : '<span class="text-slate-400">–</span>'}</td><td class="p-3 min-w-[180px]">${esc(s.mainRec)}</td>
        <td class="p-3"><button onclick="ovDetail('${s.id}')" class="text-brand-600 font-bold">Detail</button></td></tr>`; }).join('')}</tbody></table>`;
}
function ovDetail(id) {
    const s = DB.screenings().find(x => x.id === id); if (!s) return;
    const row = (l, v) => `<div class="flex justify-between gap-3 py-1.5 border-b border-slate-50"><span class="text-slate-500">${l}</span><b class="text-right">${v}</b></div>`;
    document.body.insertAdjacentHTML('beforeend', `<div id="detail-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto"><div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-3 animate-fade-in my-auto text-xs">
      <div class="flex justify-between items-center border-b pb-3"><h3 class="font-extrabold text-slate-800 text-sm">Detail Skrining: ${esc(s.nama)}</h3><button onclick="$('detail-modal').remove()" class="text-slate-400">✕</button></div>
      ${row('Tanggal', fmtDate(s.date, true))}${row('Username', esc(s.username))}${row('Usia', s.basic?.usia ?? '-')}${row('Jenis', tipeLabel(s.tipe))}${row('Skor nyeri (WaLIDD)', `${s.walidd.score}/${WALIDD_MAX} (${esc(s.walidd.label)})`)}
      ${WALIDD_ITEMS.map(it => row(esc(it.title.split(' (')[0]), it.slider ? s.walidd.ans.i + '/10' : esc(it.opts[s.walidd.ans[it.key]]))).join('')}
      ${row('Kualitas hidup', qolLevel(s.qol.total).label)}${QOL_ASPECTS.map(a => row(a.label, qolLevel(s.qol.aspects[a.key]).label)).join('')}
      ${row('Tanda bahaya', s.redFlags.length ? s.redFlags.map(esc).join('; ') : 'Tidak ada')}${row('Saran nonfarmakologis', s.recs.map(esc).join(', '))}${row('Saran farmakologis', (s.farmako || []).length ? s.farmako.map(esc).join('; ') : '-')}
      <button onclick="$('detail-modal').remove()" class="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl mt-2">Tutup</button></div></div>`);
}
