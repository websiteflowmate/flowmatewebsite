/** FLOWMATE - Ekspor data: PDF (pasien) & Excel (admin / super admin). Butuh jsPDF & SheetJS (CDN di index.html). */
const pdfSafe = s => String(s ?? '').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/[^\x20-\x7E\u00A0-\u00FF–—•’‘“”]/g, '').replace(/\s+\n/g, '\n');

/** Saran pola makan terbaru: selalu ikut di PDF & Excel, termasuk untuk data skrining lama. */
const DIET_TITLES = ['Kurangi konsumsi gula', 'Kurangi konsumsi berbahan dasar tepung', 'Kurangi konsumsi UPF (Ultra-Processed Food)'];
const withDietRecs = titles => { const t = titles || []; return [...t, ...DIET_TITLES.filter(x => !t.includes(x))]; };

function downloadPDFAnalysis() {
    const user = getCurrentUser(); if (!user) return;
    const scr = DB.lastScreening(user.username);
    if (!scr) return alert('Belum ada hasil skrining. Isi skrining dulu ya 🌸');
    if (!window.jspdf) return alert('Library PDF belum termuat. Periksa koneksi internet lalu muat ulang halaman.');
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, M = 16, maxW = W - M * 2; let y = 0;
    const need = h => { if (y + h > 282) { doc.addPage(); y = 18; } };
    const text = (t, size = 10, bold = false, color = [30, 41, 59], indent = 0) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
        doc.splitTextToSize(pdfSafe(t), maxW - indent).forEach(line => { need(size * 0.5); doc.text(line, M + indent, y); y += size * 0.5; });
        y += 1.2;
    };
    const h2 = t => { y += 3; need(12); doc.setFillColor(255, 241, 242); doc.roundedRect(M, y - 5, maxW, 8, 2, 2, 'F'); text(t, 11, true, [190, 18, 60]); y += 1; };
    const bar = (label, pct) => {
        need(9); doc.setFontSize(9); doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal'); doc.text(pdfSafe(label), M, y);
        doc.text(pct + '%', M + maxW, y, { align: 'right' }); y += 2;
        doc.setFillColor(241, 245, 249); doc.roundedRect(M, y, maxW, 2.4, 1, 1, 'F');
        doc.setFillColor(225, 29, 72); if (pct > 0) doc.roundedRect(M, y, maxW * pct / 100, 2.4, 1, 1, 'F'); y += 6;
    };

    doc.setFillColor(225, 29, 72); doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('FLOWMATE', M, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('Laporan Hasil Analisis Skrining Dismenore', M, 21); y = 38;

    text(`Nama: ${user.nama}   |   Username: ${user.username}`, 10, true);
    text(`Tanggal skrining: ${fmtDate(scr.date, true)}   |   Dicetak: ${fmtDate(new Date().toISOString(), true)}`, 9, false, [100, 116, 139]);

    h2(`1. Hasil Skrining Nyeri Haid (${tipeLabel(scr.tipe)})`);
    text(`Skor nyeri (WaLIDD): ${scr.walidd.score} / ${WALIDD_MAX}  (${scr.walidd.label})`, 12, true);
    text(scr.walidd.plain, 10);
    WALIDD_ITEMS.forEach(it => { const v = it.slider ? `${scr.walidd.ans.i}/10` : it.opts[scr.walidd.ans[it.key]]; text(`• ${it.title}: ${v}`, 9, false, [71, 85, 105], 2); });

    h2('2. Kualitas Hidup Saat Menstruasi');
    text(`Skala kualitas hidup: ${qolLevel(scr.qol.total).label}   (Baik 76-100% | Sedang 56-75% | Buruk <=55%)`, 11, true);
    QOL_ASPECTS.forEach(a => text(`• ${a.label}: ${qolLevel(scr.qol.aspects[a.key]).label}`, 10, false, [71, 85, 105], 2));

    h2('3. Tanda Bahaya (Safety Check)');
    if (scr.redFlags.length) { text('Keluhanmu perlu diperiksa lebih lanjut oleh tenaga kesehatan. Tanda yang dipilih:', 10, true, [159, 18, 57]); scr.redFlags.forEach(f => text('• ' + f, 9, false, [71, 85, 105], 2)); }
    else text('Tidak ada tanda bahaya yang dipilih saat skrining.', 10);

    h2('4. Saran Nonfarmakologis (tanpa obat)');
    scr.recs && withDietRecs(scr.recs).forEach(title => { const r = Object.values(REC_LIB).find(x => x.title === title); text(`• ${title}${r ? ': ' + r.short : ''}`, 10, false, [30, 41, 59], 2); });

    const ph = pharmaRecs(scr.walidd.cat, scr.redFlags.length > 0);
    h2('5. Saran Farmakologis (obat umum, tanpa dosis)');
    ph.items.forEach(x => text(`• ${x.name}${x.eg ? ' (' + x.eg + ')' : ''}: ${x.why}`, 9.5, false, [30, 41, 59], 2));
    text(ph.note, 9.5); if (ph.warn) text('Perhatian: ' + ph.warn, 9, false, [146, 64, 14]);

    if (scr.tipe === 'post') {
        const pre = DB.screenings(user.username).filter(x => (x.tipe || 'pre') === 'pre' && x.date < scr.date)[0];
        if (pre) { h2('6. Perbandingan Pre-test dan Post-test'); text(`Skor nyeri: ${pre.walidd.score} (${pre.walidd.label}) -> ${scr.walidd.score} (${scr.walidd.label})   |   Kualitas hidup: ${qolLevel(pre.qol.total).label} -> ${qolLevel(scr.qol.total).label}`, 10); }
    }
    if (scr.pain != null) { h2('7. Perbandingan dengan Data Referensi'); const d = datasetInsight(scr.pain); text(d.text, 9.5); text(d.stress, 9.5); }

    const jr = DB.journal(user.username), ci = cycleInfo(user.username), acts = DB.actions(user.username);
    h2('8. Ringkasan Jurnal & Intervensi');
    if (jr.length) {
        const avg = (jr.reduce((s, j) => s + j.pain, 0) / jr.length).toFixed(1);
        text(`Hari tercatat: ${jr.length}   |   Rata-rata nyeri: ${avg}/10   |   Terapi dilakukan: ${acts.length}x` + (ci.avgLen ? `   |   Rata-rata siklus: ${ci.avgLen} hari` : ''), 10);
    } else text('Belum ada catatan jurnal.', 10);

    y += 4; text('Catatan: dokumen ini adalah hasil SKRINING, bukan diagnosis medis. Bila keluhan berat, berulang, atau ada tanda bahaya, segera konsultasikan ke tenaga kesehatan.', 8.5, false, [100, 116, 139]);
    doc.save(`FLOWMATE_Hasil_${user.username}_${todayStr()}.pdf`);
}

function buildRekapRows() {
    const scrs = DB.screenings().sort((a, b) => a.date.localeCompare(b.date));
    const rekap = scrs.map((s, i) => ({
        'No': i + 1, 'Tanggal Skrining': fmtDate(s.date, true), 'Jenis': tipeLabel(s.tipe), 'Username': s.username, 'Nama Lengkap': s.nama, 'Usia': s.basic?.usia ?? '',
        'Skor Nyeri WaLIDD (0-12)': s.walidd.score, 'Kategori Dismenore': s.walidd.label, 'Intensitas Nyeri (0-10)': s.pain ?? '',
        'Kualitas Hidup': qolLevel(s.qol.total).label,
        ...Object.fromEntries(QOL_ASPECTS.map(a => [a.label, qolLevel(s.qol.aspects[a.key]).label])),
        'Tanda Bahaya': s.redFlags.length ? s.redFlags.join('; ') : 'Tidak ada', 'Rekomendasi Utama': s.mainRec, 'Saran Nonfarmakologis': withDietRecs(s.recs).join('; '),
        'Saran Farmakologis (tanpa dosis)': (s.farmako && s.farmako.length) ? s.farmako.join('; ') : (pharmaRecs(s.walidd.cat, s.redFlags.length > 0).items.map(x => x.name).join('; ') || 'Tidak diperlukan'),
    }));
    // Pre vs Post per pengguna (pre terakhir vs post terakhir)
    const prepost = DB.users().filter(u => u.role === 'pasien').map(u => {
        const mine = scrs.filter(s => s.username === u.username), pre = mine.filter(s => (s.tipe || 'pre') === 'pre').pop(), post = mine.filter(s => s.tipe === 'post').pop();
        if (!pre && !post) return null;
        return { 'Username': u.username, 'Nama': u.nama, 'Tgl Pre': pre ? fmtDate(pre.date) : '-', 'Skor Nyeri Pre': pre ? pre.walidd.score : '-', 'Kategori Pre': pre ? pre.walidd.label : '-', 'Kualitas Hidup Pre': pre ? qolLevel(pre.qol.total).label : '-',
            'Tgl Post': post ? fmtDate(post.date) : '-', 'Skor Nyeri Post': post ? post.walidd.score : '-', 'Kategori Post': post ? post.walidd.label : '-', 'Kualitas Hidup Post': post ? qolLevel(post.qol.total).label : '-',
            'Selisih Skor Nyeri (Post-Pre)': pre && post ? post.walidd.score - pre.walidd.score : '-' };
    }).filter(Boolean);
    // Data mentah untuk analisis (persentase kualitas hidup & jawaban butir)
    const jawaban = scrs.map(s => ({
        'Tanggal': fmtDate(s.date, true), 'Jenis': tipeLabel(s.tipe), 'Username': s.username, 'Nama': s.nama,
        ...Object.fromEntries(WALIDD_ITEMS.map(it => ['WaLIDD-' + it.key.toUpperCase(), s.walidd.ans[it.key]])),
        'Kualitas Hidup (%)': s.qol.total, ...Object.fromEntries(QOL_ASPECTS.map(a => [a.label + ' (%)', s.qol.aspects[a.key]])),
        ...Object.fromEntries(s.qol.answers.map((v, i) => ['Q' + (i + 1), v])),
    }));
    const pengguna = DB.users().map(u => ({ 'Username': u.username, 'Nama Lengkap': u.nama, 'Peran': u.role, 'No. Telepon': u.phone || '', 'Tanggal Registrasi': fmtDate(u.registerDate), 'Jumlah Pre-test': scrs.filter(s => s.username === u.username && (s.tipe || 'pre') === 'pre').length, 'Jumlah Post-test': scrs.filter(s => s.username === u.username && s.tipe === 'post').length }));
    return { rekap, prepost, jawaban, pengguna };
}
function downloadExcelRekap() {
    if (!window.XLSX) return alert('Library Excel belum termuat. Periksa koneksi internet lalu muat ulang halaman.');
    const { rekap, prepost, jawaban, pengguna } = buildRekapRows();
    if (!rekap.length) return alert('Belum ada data skrining untuk direkap.');
    const wb = XLSX.utils.book_new();
    const add = (rows, name) => { const ws = XLSX.utils.json_to_sheet(rows); ws['!cols'] = Object.keys(rows[0] || {}).map(k => ({ wch: Math.min(40, Math.max(10, k.length + 2)) })); XLSX.utils.book_append_sheet(wb, ws, name); };
    add(rekap, 'Rekap Skrining'); if (prepost.length) add(prepost, 'Pre vs Post'); add(jawaban, 'Data Mentah'); add(pengguna, 'Pengguna');
    XLSX.writeFile(wb, `FLOWMATE_Rekap_Skrining_${todayStr()}.xlsx`);
}
