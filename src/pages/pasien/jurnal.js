/** FLOWMATE - Pasien: Jurnal & Intervensi (catat kondisi harian -> analisis & rekomendasi hari itu -> checklist terapi -> grafik & riwayat) */
let JR = null;
const chipBtn = (on, label, click) => `<button type="button" class="opt !w-auto !py-2 ${on ? 'on' : ''}" onclick="${click}">${esc(label)}</button>`;
const JR_FLOW = [['none', 'Tidak ada'], ['spotting', 'Flek'], ['light', 'Ringan'], ['medium', 'Sedang'], ['heavy', 'Deras']];
const JR_SYM = ['Kram', 'Pegal punggung', 'Sakit kepala', 'Pusing', 'Mual', 'Kembung / perut begah', 'Lemas', 'Jerawat', 'Payudara nyeri', 'Mood swing', 'Diare / sembelit'];
const JR_LOC = ['Perut bagian bawah', 'Pinggang / punggung bawah', 'Paha / selangkangan'];
const JR_MOOD = ['😭', '😕', '😐', '🙂', '😄'];
function jrDraft(date) {
    const u = getCurrentUser(), ex = DB.journal(u.username).find(j => j.date === date);
    const base = { username: u.username, date, pain: 0, flow: 'none', periodStart: false, mood: 3, sleep: 7, stress: 5, symptoms: [], actions: [], note: '', loc: [0], impaired: false };
    return ex ? { ...base, ...ex, symptoms: [...ex.symptoms], actions: [...(ex.actions || [])], loc: [...(ex.loc || [0])], _saved: true } : base;
}
function renderJurnalHarian() { JR = jrDraft(todayStr()); JR._show = false; return `<div id="jr-root" class="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-fade-in">${jrBody()}</div>`; }
function jrRefresh() { $('jr-root').innerHTML = jrBody(); }

function jrChart(list) {
    const pts = list.slice(0, 14).reverse(); if (pts.length < 2) return '<p class="text-xs text-slate-400 py-8 text-center">Grafik muncul setelah kamu mencatat minimal 2 hari.</p>';
    const W = 560, H = 160, px = 28, py = 14, x = i => px + i * (W - px * 2) / (pts.length - 1), y = v => H - py - v * (H - py * 2) / 10;
    const ref = y(REF.pain.mean);
    return `<svg viewBox="0 0 ${W} ${H + 18}" class="w-full"><g stroke="#f1f5f9">${[0, 5, 10].map(v => `<line x1="${px}" x2="${W - px}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
      <g font-size="9" fill="#94a3b8">${[0, 5, 10].map(v => `<text x="4" y="${y(v) + 3}">${v}</text>`).join('')}</g>
      <line x1="${px}" x2="${W - px}" y1="${ref}" y2="${ref}" stroke="#38bdf8" stroke-dasharray="4 4"/><text x="${W - px}" y="${ref - 3}" font-size="9" fill="#0ea5e9" text-anchor="end">rata-rata data referensi ${REF.pain.mean}</text>
      <polyline fill="none" stroke="#e11d48" stroke-width="2.5" stroke-linejoin="round" points="${pts.map((p, i) => `${x(i)},${y(p.pain)}`).join(' ')}"/>
      ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.pain)}" r="3.5" fill="#e11d48"/><text x="${x(i)}" y="${H + 12}" font-size="8" fill="#94a3b8" text-anchor="middle">${p.date.slice(8)}/${p.date.slice(5, 7)}</text>`).join('')}</svg>`;
}
function jrBody() {
    const u = getCurrentUser(), list = DB.journal(u.username), ci = cycleInfo(u.username), acts = DB.actions(u.username);
    const avg = list.length ? (list.reduce((s, j) => s + j.pain, 0) / list.length) : null;
    const last30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; });
    const cons = Math.round(last30.filter(d => list.some(j => j.date === d)).length / 30 * 100);
    const stat = (l, v, s) => `<div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p class="text-[10px] font-bold text-slate-400 uppercase">${l}</p><p class="text-2xl font-extrabold text-slate-800 mt-1">${v}</p><p class="text-[10px] text-slate-400">${s}</p></div>`;
    const j = JR, chip = (on, l, c) => chipBtn(on, l, c);
    return `
    <div class="border-b border-slate-200 pb-4"><h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">📊 Jurnal & Intervensi</h2><p class="text-xs text-slate-500 mt-1">Catat kondisimu tiap hari, dapatkan rekomendasi untuk hari itu, lalu centang terapi yang kamu lakukan.</p></div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      ${stat('Hari siklus', ci.day ? 'Ke-' + ci.day : '–', ci.lastStart ? 'Haid terakhir ' + fmtDate(ci.lastStart) : 'Tandai hari pertama haid')}
      ${stat('Rata-rata nyeri', avg !== null ? avg.toFixed(1) + '/10' : '–', `Data referensi: ${REF.pain.mean}/10`)}
      ${stat('Siklus rata-rata', ci.avgLen ? ci.avgLen + ' hari' : '–', `Data referensi: ${REF.cycleLen.mean} hari`)}
      ${stat('Hari tercatat', cons + '%', `30 hari terakhir • ${acts.length} terapi dilakukan`)}
    </div>

    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-5 text-xs">
      <div class="flex flex-wrap justify-between items-center gap-3"><h3 class="font-extrabold text-slate-800 text-sm">📝 Catatan untuk tanggal</h3>
        <input type="date" value="${j.date}" max="${todayStr()}" onchange="JR=jrDraft(this.value);jrRefresh()" class="p-2 rounded-xl border border-slate-200 text-xs font-bold"></div>
      <div class="grid md:grid-cols-2 gap-5">
        <div class="space-y-2"><label class="font-bold text-slate-700">Nyeri hari ini: <span class="text-brand-600 text-sm" id="jr-pain">${j.pain}</span>/10</label><input type="range" min="0" max="10" value="${j.pain}" oninput="JR.pain=+this.value;$('jr-pain').textContent=this.value" class="w-full"></div>
        <div class="space-y-2"><label class="font-bold text-slate-700">Darah haid</label><div class="flex flex-wrap gap-1.5">${JR_FLOW.map(([k, l]) => chip(j.flow === k, l, `JR.flow='${k}';jrRefresh()`)).join('')}</div></div>
        <div class="space-y-2"><label class="font-bold text-slate-700">Mood</label><div class="flex gap-1.5">${JR_MOOD.map((e, i) => `<button type="button" class="opt !w-12 !text-lg !text-center !px-0 ${j.mood === i + 1 ? 'on' : ''}" onclick="JR.mood=${i + 1};jrRefresh()">${e}</button>`).join('')}</div></div>
        <div class="space-y-2"><label class="font-bold text-slate-700">Tidur semalam: <span class="text-brand-600" id="jr-sleep">${j.sleep}</span> jam</label><input type="range" min="2" max="12" step="0.5" value="${j.sleep}" oninput="JR.sleep=+this.value;$('jr-sleep').textContent=this.value" class="w-full"></div>
        <div class="space-y-2"><label class="font-bold text-slate-700">Tingkat stres: <span class="text-brand-600" id="jr-stress">${j.stress}</span>/10</label><input type="range" min="0" max="10" value="${j.stress}" oninput="JR.stress=+this.value;$('jr-stress').textContent=this.value" class="w-full"></div>
        <div class="space-y-2"><label class="font-bold text-slate-700">Hari pertama haid?</label>${chip(j.periodStart, '🩸 Ya, hari ini mulai haid', `JR.periodStart=!JR.periodStart;jrRefresh()`)}</div>
      </div>
      <div class="space-y-2"><p class="font-bold text-slate-700">Gejala</p><div class="flex flex-wrap gap-1.5">${JR_SYM.map(s => chip(j.symptoms.includes(s), s, `jrTog('symptoms','${s}')`)).join('')}</div></div>
      <div class="grid md:grid-cols-2 gap-5">
        <div class="space-y-2"><p class="font-bold text-slate-700">Lokasi nyeri <span class="font-normal text-slate-400">(boleh lebih dari satu)</span></p><div class="flex flex-wrap gap-1.5">${JR_LOC.map((l, i) => chip(j.loc.includes(i), l, `jrTogLoc(${i})`)).join('')}</div></div>
        <div class="space-y-2"><p class="font-bold text-slate-700">Aktivitasmu terganggu hari ini?</p><div class="flex gap-1.5">${chip(j.impaired, 'Ya, terganggu', 'JR.impaired=true;jrRefresh()')}${chip(!j.impaired, 'Tidak terganggu', 'JR.impaired=false;jrRefresh()')}</div></div>
      </div>
      <div><label class="font-bold text-slate-700">Catatan singkat</label><textarea maxlength="300" oninput="JR.note=this.value" rows="2" class="mt-1 w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Opsional">${esc(j.note)}</textarea></div>
      <div class="flex items-center gap-3"><button onclick="jrSave()" class="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition">💾 Simpan & Lihat Rekomendasi</button><span id="jr-msg" class="text-emerald-600 font-semibold hidden">Tersimpan ✓</span></div>
    </div>

    ${j._show ? jrRecPanel() : ''}

    <div class="grid lg:grid-cols-5 gap-6">
      <div class="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><h3 class="font-extrabold text-slate-800 text-sm mb-3">📈 Grafik nyeri (14 catatan terakhir)</h3>${jrChart(list)}</div>
      <div class="lg:col-span-2 bg-sky-50 border border-sky-100 p-6 rounded-3xl text-xs text-sky-900 space-y-2"><h3 class="font-extrabold text-sm">💡 Insight dari data referensi</h3>
        <p>${REF.pain.pctSevere7plus}% siklus di data referensi bernyeri berat (≥7/10).</p>
        <p>Stres tinggi → nyeri rata-rata <b>${REF.stressPain.tinggi}/10</b>; stres rendah → <b>${REF.stressPain.rendah}/10</b>.</p>
        <p>Tidur &lt;6 jam → nyeri <b>${REF.sleepPain.kurang}/10</b>; tidur cukup → <b>${REF.sleepPain.cukup}/10</b>.</p>
        ${avg !== null ? `<p class="font-bold pt-1">Rata-rata nyerimu ${avg.toFixed(1)}/10, ${avg > REF.pain.mean ? 'sedikit di atas' : 'di bawah / setara'} rata-rata data referensi.</p>` : ''}</div>
    </div>

    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3"><h3 class="font-extrabold text-slate-800 text-sm">🗂️ Riwayat catatan</h3>
      ${list.length ? `<div class="overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]"><tr><th class="p-3">Tanggal</th><th class="p-3">Nyeri</th><th class="p-3">Darah</th><th class="p-3">Mood</th><th class="p-3">Gejala & terapi</th><th class="p-3"></th></tr></thead><tbody class="divide-y divide-slate-100">
        ${list.slice(0, 30).map(e => `<tr><td class="p-3 font-bold whitespace-nowrap">${fmtDate(e.date)}${e.periodStart ? ' 🩸' : ''}</td><td class="p-3 font-extrabold text-brand-600">${e.pain}/10</td><td class="p-3">${JR_FLOW.find(f => f[0] === e.flow)?.[1] || '-'}</td><td class="p-3 text-base">${JR_MOOD[e.mood - 1]}</td><td class="p-3 text-slate-500">${[...e.symptoms, ...(e.actions || []).map(a => '✔ ' + a)].map(esc).join(', ') || '-'}</td>
        <td class="p-3 whitespace-nowrap"><button onclick="JR=jrDraft('${e.date}');jrRefresh();window.scrollTo({top:0,behavior:'smooth'})" class="text-brand-600 font-bold mr-2">Ubah</button><button onclick="jrDelete('${e.date}')" class="text-slate-400 hover:text-rose-600 font-bold">Hapus</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="text-xs text-slate-400 py-4">Belum ada catatan. Simpan catatan pertamamu di atas 🌸</p>'}</div>`;
}
function jrTog(k, v) { const a = JR[k]; JR[k] = a.includes(v) ? a.filter(x => x !== v) : [...a, v]; jrRefresh(); }
function jrTogLoc(i) { JR.loc = JR.loc.includes(i) ? JR.loc.filter(x => x !== i) : [...JR.loc, i]; jrRefresh(); }
async function jrSave() {
    if (!JR.loc.length && JR.pain > 0) return alert('Pilih lokasi nyeri, atau geser nyeri ke 0 bila tidak nyeri.');
    const { _saved, _show, ...entry } = JR;
    const r = await DB.saveJournal(entry); if (!r.ok) return alert(r.error);
    JR._saved = true; JR._show = true; jrRefresh();
    $('jr-rec').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function jrDelete(date) {
    if (!confirm('Hapus catatan tanggal ' + fmtDate(date) + '?')) return;
    const r = await DB.deleteJournal(date); if (!r.ok) return alert(r.error);
    JR = jrDraft(todayStr()); jrRefresh();
}

/* ---------- Analisis & rekomendasi untuk catatan ini ---------- */
function jrRecs() {
    const u = getCurrentUser(), last = DB.lastScreening(u.username), j = JR;
    const level = j.pain >= 7 ? 'berat' : j.pain >= 4 ? 'sedang' : j.pain >= 1 ? 'ringan' : 'tidak';
    const flag = j.pain >= 8 || (last && last.redFlags.length > 0);
    const lokasi = j.loc.some(i => i >= 1) ? 1 : 0;
    let recs = buildRecs(level, lokasi, flag);
    if (/Lemas|Pusing/.test(j.symptoms.join()) && j.pain >= 6) recs = recs.filter(r => r.id !== 'gerak');
    return { level, flag, recs, last };
}
function jrRecPanel() {
    const j = JR, r = jrRecs(), done = j.actions || [];
    const tone = { tidak: 'emerald', ringan: 'emerald', sedang: 'amber', berat: 'rose' }[r.level], t = TONE[tone];
    const text = { tidak: 'Hari ini kamu tidak merasakan nyeri. Pertahankan kebiasaan sehat dan tetap catat kondisimu.',
        ringan: 'Nyerimu tergolong ringan. Perawatan mandiri biasanya cukup membantu.',
        sedang: 'Nyerimu tergolong sedang. Perawatan mandiri yang rutin biasanya membantu. Pantau perkembangannya di jurnal.',
        berat: 'Nyerimu tergolong berat. Mulailah dengan langkah di bawah, dan bila tidak membaik atau makin parah, sebaiknya periksa ke tenaga kesehatan.' }[r.level];
    return `<div id="jr-rec" class="bg-white p-6 sm:p-8 rounded-3xl border-2 border-rose-100 shadow-md space-y-6 animate-fade-in">
      <div class="bg-rose-50/60 p-5 rounded-2xl border border-rose-100 space-y-2"><span class="text-[10px] font-bold text-brand-600 uppercase">Analisis & Rekomendasi · ${fmtDate(j.date)}</span>
        <div class="flex flex-wrap items-center gap-2"><h4 class="font-extrabold text-slate-800 text-sm">Nyeri ${j.pain}/10</h4><span class="${t.bg} ${t.text} text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize">${r.level === 'tidak' ? 'tidak nyeri' : r.level}</span>${j.impaired ? '<span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Aktivitas terganggu</span>' : ''}</div>
        <p class="text-xs text-slate-600 leading-relaxed">${text}</p>
        ${j.symptoms.length ? `<p class="text-[11px] text-slate-500">Gejala: <b>${j.symptoms.map(esc).join(', ')}</b></p>` : ''}
        ${r.flag ? `<p class="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mt-1">🚩 Keluhanmu perlu diperiksa lebih lanjut. Segera hubungi tenaga kesehatan bila nyeri hebat, pingsan, atau perdarahan sangat banyak.</p>` : ''}</div>
      <div class="space-y-3"><span class="text-[10px] font-bold text-slate-400 uppercase">Terapi mandiri (nonfarmakologis) · centang yang sudah kamu lakukan</span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${r.recs.map(rc => `
          <div class="p-5 rounded-2xl border ${done.includes(rc.title) ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-slate-50'} space-y-3"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-xl">${rc.icon}</div><h4 class="font-bold text-slate-800 text-sm">${esc(rc.title)}</h4></div>
            <p class="text-[11px] text-slate-500">${esc(rc.short)}</p>
            <details class="text-[11px] text-slate-600"><summary class="cursor-pointer font-bold text-brand-600">Lihat langkah-langkah</summary><ol class="list-decimal pl-4 mt-2 space-y-1 leading-relaxed">${rc.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>${rc.caution ? `<p class="mt-2 text-amber-700 bg-amber-50 rounded-lg p-2">⚠️ ${esc(rc.caution)}</p>` : ''}</details>
            ${rc.id !== 'periksa' ? `<div class="flex items-center gap-2 pt-1"><select id="dur-${rc.id}" class="text-[11px] p-2 rounded-lg border border-slate-200 bg-white"><option value="5">5 menit</option><option value="10">10 menit</option><option value="15" selected>15 menit</option><option value="20">20 menit</option><option value="30">30 menit</option></select>
              <button onclick="jrToggleAct('${rc.id}')" class="flex-1 ${done.includes(rc.title) ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700'} border font-bold text-[11px] py-2 rounded-lg transition">${done.includes(rc.title) ? '✅ Sudah dilakukan (klik untuk batal)' : '☐ Sudah saya lakukan'}</button></div>` : ''}
          </div>`).join('')}</div></div>
      ${pharmaBox(pharmaRecs(r.level, r.flag))}
      <div class="pt-3 border-t border-slate-100 flex justify-between items-center flex-wrap gap-4"><p class="text-xs text-slate-600 font-medium">Mau bahas lebih lanjut rekomendasi ini?</p>
        <button onclick="jrSendBot()" class="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition">🤖 Kirim ke FEM AI</button></div></div>`;
}
async function jrToggleAct(id) {
    const title = REC_LIB[id].title, had = JR.actions.includes(title), dur = +$('dur-' + id).value;
    const next = had ? JR.actions.filter(a => a !== title) : [...JR.actions, title];
    const { _saved, _show, ...entry } = { ...JR, actions: next };
    const r = await DB.saveJournal(entry); if (!r.ok) return alert(r.error);
    JR.actions = next;
    if (!had) { const r2 = await DB.addAction({ recId: id, title, duration: dur, painBefore: JR.pain }); if (!r2.ok) alert(r2.error); }
    const y = window.scrollY; jrRefresh(); window.scrollTo(0, y);
}
function jrSendBot() { const r = jrRecs(); sendInterventionToBot({ pain: JR.pain, symptoms: [...JR.symptoms], recs: r.recs.map(x => x.title) }); }
