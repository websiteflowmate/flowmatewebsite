/** FLOWMATE - Pasien: Beranda / Dashboard */
function renderBerandaPasien() {
    const u = getCurrentUser(), scr = DB.lastScreening(u.username), ci = cycleInfo(u.username), rec = todayRec(scr);
    const sub = ci.day ? `Hari ini adalah <b>Hari ke-${ci.day}</b> siklus menstruasimu. Tetap jaga hidrasi dan kenyamanan tubuh ya!`
        : `Catat hari pertama haidmu di <b>Jurnal Harian</b> supaya aku bisa menghitung hari siklusmu.`;
    const tone = scr ? TONE[scr.walidd.tone] : null;
    return `
    <div class="max-w-7xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <div class="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex justify-between items-center flex-wrap gap-6">
        <div class="space-y-2">
          <span class="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Dashboard Pasien</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold">Selamat Datang, ${esc(u.nama)}! 🌸</h1>
          <p class="text-rose-100 text-sm max-w-xl">${sub}</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button onclick="navigateTo('walidd_screening')" class="bg-white text-brand-600 hover:bg-rose-50 font-extrabold px-6 py-3.5 rounded-2xl text-xs shadow-lg transition">🩸 Isi Skrining Hari Ini</button>
          <button onclick="downloadPDFAnalysis()" class="bg-slate-900/90 text-white hover:bg-slate-900 font-extrabold px-5 py-3.5 rounded-2xl text-xs shadow-lg transition">📄 Unduh Hasil Analisis (PDF)</button>
        </div>
      </div>

      ${scr && scr.redFlags.length ? `<div class="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex gap-3 items-start"><span class="text-lg">🚩</span><p><b>Keluhanmu perlu diperiksa lebih lanjut.</b> Ada tanda bahaya pada skrining terakhirmu. Sebaiknya hubungi puskesmas, bidan, atau dokter kandungan.</p></div>` : ''}

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400 uppercase">Hasil Skrining Terakhir</span><span class="text-xl">📊</span></div>
          ${scr ? `
          <div class="flex items-baseline gap-2"><span class="text-4xl font-extrabold text-brand-600">${scr.walidd.score}</span><span class="text-slate-400 text-xs font-bold">/ ${WALIDD_MAX}</span></div>
          <div class="flex flex-wrap gap-1.5"><span class="${tone.bg} ${tone.text} text-[11px] font-extrabold px-3 py-1 rounded-full inline-block">${esc(scr.walidd.label)}</span><span class="${(scr.tipe || 'pre') === 'post' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'} text-[11px] font-extrabold px-3 py-1 rounded-full">${tipeLabel(scr.tipe)}</span><span class="${TONE[qolLevel(scr.qol.total).tone].bg} ${TONE[qolLevel(scr.qol.total).tone].text} text-[11px] font-extrabold px-3 py-1 rounded-full">Kualitas hidup: ${qolLevel(scr.qol.total).label}</span></div>
          <p class="text-xs text-slate-500 pt-1">Terakhir diperbarui: ${fmtDate(scr.date, true)}</p>` : `
          <p class="text-sm text-slate-500 leading-relaxed">Belum ada hasil skrining. Yuk mulai agar kamu tahu kondisimu.</p>
          <button onclick="navigateTo('walidd_screening')" class="text-xs text-brand-600 font-extrabold hover:underline">Mulai Skrining →</button>`}
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400 uppercase">Rekomendasi Hari Ini</span><span class="text-xl">✨</span></div>
          <h4 class="font-bold text-slate-800 text-sm">${esc(rec.title)}</h4>
          <p class="text-xs text-slate-600 leading-relaxed">${esc(rec.text)}</p>
          <button onclick="navigateTo('${rec.go}')" class="text-xs text-brand-600 font-extrabold hover:underline block pt-1">${esc(rec.cta)} →</button>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400 uppercase">Asisten Pintar</span><span class="text-xl">🤖</span></div>
          <h4 class="font-bold text-slate-800 text-sm">Ada Keluhan Hari Ini?</h4>
          <p class="text-xs text-slate-500 italic">“Nyeri kram makin berasa atau butuh saran makanan?”</p>
          <button onclick="toggleFloatingBot(true)" class="w-full bg-rose-50 text-brand-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold py-2.5 rounded-xl transition">💬 Tanya FEM AI Sekarang</button>
        </div>
      </div>
    </div>`;
}
