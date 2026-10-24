/** FLOWMATE - Pasien: Skrining (pilih pre/post -> data dasar -> nyeri haid -> tanda bahaya -> kualitas hidup -> hasil) */
let SC = null; // state skrining
const SC_STEPS = ['Data Dasar', 'Nyeri Haid', 'Tanda Bahaya', 'Kualitas Hidup'];
function scReset() { SC = { tipe: null, step: 0, basic: { usia: '', status: 'sedang', riwayat: '' }, w: { w: null, l: null, i: 5, d: null, dys: null }, iTouched: false, flags: [], qol: Array(15).fill(null), result: null }; }

function renderSkriningForm() {
    if (!SC || SC.result) scReset();
    return `<div class="max-w-3xl mx-auto py-8 px-4 space-y-5 animate-fade-in" id="scr-root">${scBody()}</div>`;
}
function scRefresh() { $('scr-root').innerHTML = scBody(); window.scrollTo({ top: 0, behavior: 'smooth' }); }


function scChooser() {
    const card = (t, icon, title, desc) => `<button type="button" onclick="SC.tipe='${t}';scRefresh()" class="opt !p-5 space-y-2 !text-left">
        <span class="text-3xl block">${icon}</span><span class="block text-sm font-extrabold text-slate-800">${title}</span><span class="block text-[11px] font-normal text-slate-500 leading-relaxed">${desc}</span></button>`;
    const u = getCurrentUser(), mine = DB.screenings(u.username), nPre = mine.filter(x => (x.tipe || 'pre') === 'pre').length, nPost = mine.filter(x => x.tipe === 'post').length;
    return `<div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
      <div><h2 class="text-xl font-extrabold text-slate-900">🩺 Skrining Nyeri Haid & Kualitas Hidup</h2>
      <p class="text-xs text-slate-500 mt-1">Pertanyaannya sama untuk keduanya. Pilihanmu menentukan bagaimana hasil dikelompokkan dan dibandingkan.</p></div>
      <p class="text-xs font-bold text-slate-700">Kamu mau mengisi yang mana?</p>
      <div class="grid sm:grid-cols-2 gap-3">
        ${card('pre', '📝', 'Pre-test', 'Diisi <b>sebelum</b> menjalani intervensi. Menggambarkan kondisi awalmu.')}
        ${card('post', '✅', 'Post-test', 'Diisi <b>sesudah</b> menjalani intervensi. Hasilnya dibandingkan dengan pre-test-mu.')}
      </div>
      <p class="text-[11px] text-slate-400">Riwayatmu: ${nPre} pre-test • ${nPost} post-test</p></div>`;
}

function scProgress() {
    return `<div class="space-y-2"><div class="flex justify-between text-[11px] font-bold"><span class="text-brand-600">${tipeLabel(SC.tipe)} • Langkah ${SC.step + 1} dari ${SC_STEPS.length}: ${SC_STEPS[SC.step]}</span><span class="text-slate-400">${Math.round((SC.step) / SC_STEPS.length * 100)}%</span></div>
    <div class="bar"><i style="width:${(SC.step + 1) / SC_STEPS.length * 100}%;background:#e11d48"></i></div></div>`;
}
function scBody() {
    if (SC.result) return scResultView(SC.result);
    if (!SC.tipe) return scChooser();
    const head = `<div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
      <div><h2 class="text-xl font-extrabold text-slate-900 flex items-center gap-2">🩺 Cek Nyeri Haid & Kualitas Hidupmu</h2>
      <p class="text-xs text-slate-500 mt-1">Jawab sesuai yang kamu rasakan. Tidak ada jawaban benar atau salah. Hasilnya berupa <b>skrining</b>, bukan diagnosis.</p></div>${scProgress()}`;
    const steps = [scStep0, scStep1, scStep2, scStep3];
    return head + steps[SC.step]() + '</div>';
}
const scErr = () => `<p id="sc-err" class="hidden text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3"></p>`;
const scNav = (back, next) => `${scErr()}<div class="flex justify-between gap-3 pt-2">${back ? `<button onclick="scGo(-1)" class="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">← Kembali</button>` : '<span></span>'}<button onclick="scGo(1)" class="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition">${next}</button></div>`;

function scStep0() {
    const b = SC.basic, opt = (v, l) => `<button type="button" class="opt ${b.riwayat === v ? 'on' : ''}" onclick="SC.basic.riwayat='${v}';scRefresh()">${l}</button>`;
    const st = (v, l) => `<button type="button" class="opt ${b.status === v ? 'on' : ''}" onclick="SC.basic.status='${v}';scRefresh()">${l}</button>`;
    return `<div class="space-y-5 text-xs">
      <div><label class="block font-bold text-slate-700 mb-2">Berapa usiamu saat ini?</label>
        <input id="sc-usia" type="number" min="10" max="60" value="${esc(b.usia)}" oninput="SC.basic.usia=this.value" placeholder="Contoh: 21" class="w-full sm:w-40 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"></div>
      <div><label class="block font-bold text-slate-700 mb-2">Apakah kamu sedang haid sekarang?</label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">${st('sedang', 'Ya, sedang haid')}${st('belum', 'Tidak, haid sudah selesai')}${st('menjelang', 'Belum, menjelang haid')}</div></div>
      <div><label class="block font-bold text-slate-700 mb-2">Apakah kamu pernah merasa nyeri saat haid?</label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">${opt('tidak', 'Hampir tidak pernah')}${opt('kadang', 'Kadang-kadang')}${opt('sering', 'Sering / setiap haid')}</div></div>
    </div>${scNav(false, 'Lanjut →')}`;
}
function scStep1() {
    const w = SC.w;
    const q = it => {
        if (it.slider) return `<div class="space-y-2"><label class="block font-bold text-slate-700">${esc(it.q)}</label>
          <input type="range" min="0" max="10" value="${w.i}" oninput="SC.w.i=+this.value;SC.iTouched=true;$('sc-i-val').textContent=this.value;$('sc-i-emo').textContent=['😊','🙂','🙂','😐','😐','😕','😣','😣','😖','😭','😭'][this.value]" class="w-full">
          <div class="flex justify-between items-center text-[11px] text-slate-400"><span>0 tidak nyeri</span><span class="text-base font-extrabold text-brand-600"><span id="sc-i-emo">${['😊','🙂','🙂','😐','😐','😕','😣','😣','😖','😭','😭'][w.i]}</span> <span id="sc-i-val">${w.i}</span>/10</span><span>10 paling sakit</span></div></div>`;
        return `<div class="space-y-2"><label class="block font-bold text-slate-700">${esc(it.q)}</label><div class="grid gap-2">${it.opts.map((o, v) => `<button type="button" class="opt ${w[it.key] === v ? 'on' : ''}" onclick="SC.w['${it.key}']=${v};scRefresh()">${esc(o)}</button>`).join('')}</div></div>`;
    };
    return `<div class="space-y-6 text-xs">${WALIDD_ITEMS.map((it, n) => `<div><p class="text-[10px] font-extrabold text-brand-600 uppercase mb-1">${n + 1}. ${esc(it.title)}</p>${q(it)}</div>`).join('')}</div>${scNav(true, 'Lanjut →')}`;
}
function scStep2() {
    return `<div class="space-y-4 text-xs"><div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 leading-relaxed">🛡️ <b>Pengecekan keselamatan.</b> Centang bila kamu mengalami salah satu hal berikut. Bila tidak ada, langsung lanjut.</div>
      <div class="grid gap-2">${RED_FLAGS.map((f, i) => `<button type="button" class="opt flex items-start gap-3 ${SC.flags.includes(i) ? 'on' : ''}" onclick="scFlag(${i})"><span class="mt-0.5 w-4 h-4 shrink-0 rounded border ${SC.flags.includes(i) ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'} flex items-center justify-center text-[10px]">${SC.flags.includes(i) ? '✓' : ''}</span><span>${esc(f)}</span></button>`).join('')}</div></div>${scNav(true, 'Lanjut →')}`;
}
function scFlag(i) { SC.flags = SC.flags.includes(i) ? SC.flags.filter(x => x !== i) : [...SC.flags, i]; scRefresh(); }
function scStep3() {
    const legend = LIKERT.map((l, i) => `${i + 1} = ${l}`).join(' • ');
    return `<div class="space-y-5 text-xs"><div class="bg-rose-50/70 border border-rose-100 rounded-2xl p-3 text-[11px] text-slate-600 leading-relaxed"><b>Skala:</b> ${legend}</div>
      ${QOL_ASPECTS.map(a => `<div class="space-y-3"><p class="font-extrabold text-brand-700 text-xs">${a.icon} ${a.label}</p>
        ${QOL_ITEMS.slice(a.from, a.to).map((q, k) => { const i = a.from + k; return `<div class="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2" data-q="${i}"><p class="text-slate-700 leading-relaxed"><b>${i + 1}.</b> ${esc(q)}</p>
          <div class="likert">${[1, 2, 3, 4, 5].map(v => `<button type="button" title="${LIKERT[v - 1]}" class="${SC.qol[i] === v ? 'on' : ''}" onclick="scQol(${i},${v},this)">${v}</button>`).join('')}</div>
          <div class="flex justify-between text-[10px] text-slate-400"><span>Sangat tidak setuju</span><span>Sangat setuju</span></div></div>`; }).join('')}</div>`).join('')}</div>
      ${scNav(true, '✨ Analisis Kondisi Saya')}`;
}
function scQol(i, v, btn) { SC.qol[i] = v; btn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn)); }

function scGo(dir) {
    const err = msg => { const e = $('sc-err'); e.textContent = msg; e.classList.remove('hidden'); e.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    if (dir > 0) {
        if (SC.step === 0) {
            const u = parseInt(SC.basic.usia, 10);
            if (!(u >= 10 && u <= 60)) return err('Isi usia dengan benar (10–60 tahun).');
            if (!SC.basic.riwayat) return err('Pilih seberapa sering kamu merasa nyeri saat haid.');
        }
        if (SC.step === 1) {
            if (!SC.iTouched) return err('Geser skala nyeri (pertanyaan 3) sesuai yang kamu rasakan, boleh 0 bila tidak nyeri.');
            const miss = WALIDD_ITEMS.filter(it => !it.slider && SC.w[it.key] === null);
            if (miss.length) return err('Masih ada pertanyaan yang belum dijawab: ' + miss.map(m => m.title.split(' (')[0]).join(', ') + '.');
        }
        if (SC.step === 3) {
            const miss = SC.qol.map((v, i) => v === null ? i + 1 : null).filter(Boolean);
            if (miss.length) { const first = document.querySelector(`[data-q="${miss[0] - 1}"]`); first?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return err(`Masih ada ${miss.length} pernyataan yang belum dijawab (no. ${miss.slice(0, 6).join(', ')}${miss.length > 6 ? ', …' : ''}).`); }
            return scFinish();
        }
    }
    SC.step += dir; scRefresh();
}

function scFinish() {
    const u = getCurrentUser(), wal = scoreWalidd(SC.w), qol = scoreQol(SC.qol);
    const redFlags = SC.flags.map(i => RED_FLAGS[i]);
    const recs = buildRecs(wal.cat, SC.w.l, redFlags.length > 0);
    const rec = {
        id: 's' + Date.now(), username: u.username, nama: u.nama, date: new Date().toISOString(), tipe: SC.tipe,
        basic: { ...SC.basic, usia: parseInt(SC.basic.usia, 10) }, pain: SC.w.i,
        walidd: { ans: { ...SC.w }, pts: wal.pts, score: wal.score, cat: wal.cat, label: wal.label, tone: wal.tone, plain: wal.plain },
        qol: { answers: [...SC.qol], aspects: qol.aspects, total: qol.total, level: qol.level },
        redFlags, recs: recs.map(r => r.title), mainRec: mainRecText(wal.cat, redFlags.length > 0),
        farmako: pharmaRecs(wal.cat, redFlags.length > 0).items.map(x => x.name + (x.eg ? ' (' + x.eg + ')' : '')),
    };
    if (SC.saving) return; SC.saving = true;
    DB.addScreening(rec).then(r => {
        SC.saving = false;
        if (!r.ok) return alert(r.error);
        SC.result = r.rec; scRefresh();
    });
}

function scResultView(s) {
    const t = TONE[s.walidd.tone], lv = qolLevel(s.qol.total), q = TONE[lv.tone], d = datasetInsight(s.pain), tipe = s.tipe || 'pre';
    const recs = buildRecs(s.walidd.cat, s.walidd.ans.l, s.redFlags.length > 0), ph = pharmaRecs(s.walidd.cat, s.redFlags.length > 0);
    const ptsMax = { w: 3, l: 2, i: 3, d: 3, dys: 1 };
    const prev = tipe === 'post' ? DB.screenings(s.username).filter(x => (x.tipe || 'pre') === 'pre' && x.date < s.date)[0] : null;
    const badge = (l, tone) => `<span class="${TONE[tone].bg} ${TONE[tone].text} text-[11px] font-extrabold px-3 py-1 rounded-full inline-block">${esc(l)}</span>`;
    const compare = tipe === 'post' ? (prev ? (() => {
        const dScore = s.walidd.score - prev.walidd.score, pl = qolLevel(prev.qol.total);
        const arrow = dScore < 0 ? '↓ membaik' : dScore > 0 ? '↑ meningkat' : '→ tetap';
        return `<div class="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-xs text-emerald-900 space-y-2"><p class="font-extrabold">📈 Perbandingan Pre-test → Post-test</p>
          <div class="grid grid-cols-3 gap-2 text-center"><div></div><div class="font-bold text-slate-500">Pre-test</div><div class="font-bold text-slate-500">Post-test</div>
          <div class="text-left font-bold">Skor nyeri (0–${WALIDD_MAX})</div><div>${prev.walidd.score} (${esc(prev.walidd.label)})</div><div><b>${s.walidd.score}</b> (${esc(s.walidd.label)})</div>
          <div class="text-left font-bold">Kualitas hidup</div><div>${pl.label}</div><div><b>${lv.label}</b></div></div>
          <p>Skor nyeri ${arrow}${dScore ? ' (' + (dScore > 0 ? '+' : '') + dScore + ' poin)' : ''}. Pre-test diisi pada ${fmtDate(prev.date)}.</p></div>`;
    })() : `<div class="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-900">Belum ada pre-test sebelumnya, jadi perbandingan belum bisa ditampilkan. Isi pre-test untuk kondisi awalmu.</div>`)
        : `<div class="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-xs text-sky-900">Ini hasil <b>pre-test</b> (kondisi awal). Setelah menjalani intervensi, isi <b>post-test</b> lewat menu Skrining untuk melihat perubahannya.</div>`;
    return `<div class="space-y-5">
      <div class="bg-white p-6 sm:p-8 rounded-3xl border-2 border-rose-100 shadow-xl space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3"><h3 class="text-lg font-extrabold text-slate-900">🌸 Hasil Analisis Kesehatan Kamu</h3>
          <div class="flex items-center gap-2"><span class="${tipe === 'post' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'} text-[11px] font-extrabold px-3 py-1 rounded-full">${tipeLabel(tipe)}</span><span class="text-[11px] text-slate-400">${fmtDate(s.date, true)}</span></div></div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Tingkat Nyeri Haid (WaLIDD)</p>
            <p class="text-4xl font-extrabold text-brand-600">${s.walidd.score}<span class="text-sm text-slate-400 font-bold"> / ${WALIDD_MAX}</span></p>${badge(s.walidd.label, s.walidd.tone)}</div>
          <div class="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-2"><p class="text-[10px] font-bold text-slate-400 uppercase">Kualitas Hidup Saat Haid</p>
            <p class="text-3xl font-extrabold ${q.text}">${lv.label}</p>${badge('Skala: ' + lv.label, lv.tone)}</div>
        </div>
        <p class="text-sm text-slate-600 leading-relaxed">${esc(s.walidd.plain)}</p>
        ${compare}
        ${s.redFlags.length ? `<div class="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 space-y-1.5"><p class="font-extrabold">🚩 Keluhanmu perlu diperiksa lebih lanjut.</p><p>Kamu memilih tanda bahaya berikut. Sebaiknya segera ke puskesmas, bidan, atau dokter kandungan:</p><ul class="list-disc pl-5">${s.redFlags.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}

        <details open class="rounded-2xl border border-slate-100 p-4"><summary class="cursor-pointer text-xs font-extrabold text-slate-700">Rincian skor nyeri</summary><div class="mt-3 space-y-3">
          ${WALIDD_ITEMS.map(it => `<div><div class="flex justify-between text-[11px] text-slate-600 mb-1"><span>${esc(it.title)}</span><b>${s.walidd.pts[it.key]}/${ptsMax[it.key]}</b></div><div class="bar"><i style="width:${s.walidd.pts[it.key] / ptsMax[it.key] * 100}%;background:${t.bar}"></i></div></div>`).join('')}</div></details>
        <details open class="rounded-2xl border border-slate-100 p-4"><summary class="cursor-pointer text-xs font-extrabold text-slate-700">Kualitas hidup per aspek</summary><div class="mt-3 space-y-3">
          ${QOL_ASPECTS.map(a => { const al = qolLevel(s.qol.aspects[a.key]); return `<div><div class="flex justify-between items-center text-[11px] text-slate-600 mb-1"><span>${a.icon} ${a.label}</span>${badge(al.label, al.tone)}</div><div class="bar"><i style="width:${s.qol.aspects[a.key]}%;background:${TONE[al.tone].bar}"></i></div></div>`; }).join('')}
          <p class="text-[10px] text-slate-400">Skala: Baik (76–100%) • Sedang (56–75%) • Buruk (≤55%). Skor keseluruhan = rata-rata 5 aspek.</p></div></details>

        <div class="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-xs text-sky-900 space-y-1.5"><p class="font-extrabold">📊 Dibanding data referensi</p><p>${esc(d.text)}</p><p>${esc(d.stress)}</p></div>

        <div class="space-y-3"><p class="text-xs font-extrabold text-slate-700">✨ Saran nonfarmakologis (tanpa obat)</p>
          <div class="grid sm:grid-cols-2 gap-3">${recs.map(r => `<div class="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-1"><div class="flex items-center gap-2"><span class="text-xl">${r.icon}</span><h4 class="font-bold text-slate-800 text-xs">${esc(r.title)}</h4></div><p class="text-[11px] text-slate-500 leading-relaxed">${esc(r.short)}</p></div>`).join('')}</div></div>

        ${pharmaBox(ph)}

        <div class="grid sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <button onclick="sendScreeningToBot()" class="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl text-xs transition">🤖 Tanya & Diskusi dengan FEM AI</button>
          <button onclick="navigateTo('catatan_harian')" class="bg-rose-50 hover:bg-rose-100 text-brand-700 border border-rose-200 font-bold py-3.5 rounded-xl text-xs transition">📊 Lanjut ke Jurnal & Intervensi</button>
          <button onclick="downloadPDFAnalysis()" class="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs transition">📄 Unduh PDF</button>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">Ini adalah hasil <b>skrining</b>, bukan diagnosis. Kategori dan bobot skor masih dalam tahap validasi. Hasil tersimpan di akunmu dan dapat dilihat admin FLOWMATE.</p>
        <button onclick="scReset();scRefresh()" class="text-xs font-bold text-slate-500 hover:text-brand-600">↻ Isi skrining baru</button>
      </div></div>`;
}
/** Kotak saran farmakologis (dipakai juga di Jurnal & Intervensi) */
function pharmaBox(ph) {
    return `<div class="space-y-3"><p class="text-xs font-extrabold text-slate-700">💊 Saran farmakologis (obat umum pereda nyeri, tanpa dosis)</p>
      <div class="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3 text-xs text-amber-950">
        ${ph.items.length ? ph.items.map(x => `<div><p class="font-bold">• ${esc(x.name)}${x.eg ? ` <span class="font-normal">(${esc(x.eg)})</span>` : ''}</p><p class="text-[11px] text-amber-900/80 pl-3 leading-relaxed">${esc(x.why)}</p></div>`).join('') : ''}
        <p class="leading-relaxed">${esc(ph.note)}</p>
        ${ph.warn ? `<p class="text-[11px] bg-white/70 border border-amber-200 rounded-xl p-3 leading-relaxed">⚠️ ${esc(ph.warn)}</p>` : ''}
      </div></div>`;
}
