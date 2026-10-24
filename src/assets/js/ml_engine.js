/**
 * FLOWMATE - Mesin FEM AI (berbasis aturan + basis pengetahuan fembot_kb.js).
 * Memahami Indonesia formal / santai / campur English / English. Tanpa diagnosis & tanpa dosis obat.
 */
const SLANG = { gk: 'tidak', ga: 'tidak', gak: 'tidak', nggak: 'tidak', ngga: 'tidak', tdk: 'tidak', yg: 'yang', dgn: 'dengan', sm: 'sama', bgt: 'banget', bngt: 'banget', blm: 'belum', udh: 'sudah', udah: 'sudah', sdh: 'sudah', krn: 'karena', utk: 'untuk', tlt: 'telat', mens: 'mens', haidku: 'haid', menstruasi: 'haid', menstruasinya: 'haid', datangbulan: 'datang bulan', kenapa: 'kenapa', knp: 'kenapa', gmn: 'gimana', gimana: 'gimana', kalo: 'kalau', klo: 'kalau', dr: 'dari', skrg: 'sekarang', bs: 'bisa', jg: 'juga', aja: 'saja', doang: 'saja' };
const EN_WORDS = new Set(['the', 'is', 'are', 'what', 'how', 'do', 'does', 'i', 'my', 'me', 'can', 'why', 'when', 'should', 'am', 'you', 'to', 'of', 'have', 'has', 'it', 'and', 'for', 'with', 'about', 'was', 'will', 'there', 'any', 'this', 'that', 'normal', 'period', 'pain', 'help', 'tell', 'please', 'good', 'feel', 'feeling', 'bad']);
const FORMAL_WORDS = ['saya', 'anda', 'mohon', 'apakah', 'bagaimana', 'terima kasih', 'kepada', 'dapat', 'dimohon', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam', 'bolehkah', 'adakah', 'mengapa', 'sebaiknya', 'berikut', 'kiranya'];
const SOCIAL = new Set(['greet', 'thanks', 'bye']);
const SAFE_TOPICS = new Set(['cramps', 'late', 'irregular', 'heavy', 'light', 'symptoms', 'discharge', 'pcos', 'endo', 'anemia', 'pregnant', 'painkiller', 'birthcontrol', 'early', 'duration']);

function normText(t) {
    const s = String(t).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s'-]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    return s.split(' ').map(w => SLANG[w] || w).join(' ');
}
function detectStyle(raw, norm) {
    const toks = norm.split(' ').filter(Boolean);
    const en = toks.filter(w => EN_WORDS.has(w)).length;
    if (toks.length && en / toks.length >= 0.4 && en >= 2) return 'en';
    if (/^(what|how|why|when|can|do|does|is|are|hi|hello|hey|please|tell)\b/.test(norm) && en >= 1) return 'en';
    if (FORMAL_WORDS.some(w => norm.includes(w))) return 'f';
    return 'c';
}
function scoreTopic(topic, norm) {
    const padded = ' ' + norm + ' ', toks = norm.split(' ');
    let s = 0;
    for (const kwRaw of topic.kw) {
        const kw = normText(kwRaw);
        if (kw.includes(' ')) { if (padded.includes(' ' + kw + ' ') || padded.includes(' ' + kw)) s += 2 + kw.split(' ').length; }
        else if (toks.includes(kw)) s += kw.length <= 3 ? 1 : 2;
        else if (kw.length >= 6 && toks.some(t => t.startsWith(kw))) s += 2;
    }
    return s;
}
function fillRef(text) {
    const m = { cyc: REF.cycleLen.mean, mens: REF.mensesLen.mean, ov: Math.round(REF.ovulationDay.mean), bmi: REF.bmi.mean, nlog: REF.n_log.toLocaleString('id-ID'), nuser: REF.n_user.toLocaleString('id-ID'), pain: REF.pain.mean, sev: Math.round(REF.pain.pctSevere7plus) };
    return text.replace(/\{(\w+)\}/g, (_, k) => m[k] ?? '');
}
const L = (st, c, f, en) => st === 'en' ? en : st === 'f' ? f : c;

function explainScreening(scr, st) {
    if (!scr) return L(st, 'Kamu belum isi skrining 🩸 Yuk isi dulu di menu **Skrining** biar aku bisa bantu jelasin hasilnya!',
        'Anda belum mengisi skrining. Silakan isi menu Skrining terlebih dahulu agar hasil dapat dijelaskan.', 'You haven\'t done the screening yet 🩸 Take the **Screening** first and I\'ll walk you through it!');
    const q = scr.qol, recs = scr.recs.slice(0, 3).join(', '), flags = scr.redFlags.length;
    const flagTxt = flags ? L(st, `\n\n🚩 Kamu mencentang **${flags} tanda bahaya**. Tolong jadwalkan periksa ke tenaga kesehatan ya, jangan ditunda.`,
        `\n\nTerdapat ${flags} tanda bahaya yang dipilih. Disarankan segera memeriksakan diri ke tenaga kesehatan.`, `\n\n🚩 You ticked **${flags} warning sign(s)**. Please book a check-up soon.`) : '';
    const d = scr.pain != null ? datasetInsight(scr.pain) : null;
    const dTxt = d ? '\n\n📊 ' + d.text : '';
    return L(st,
        `Oke, ini hasil skriningmu 🌸\n\n• Skor WaLIDD: **${scr.walidd.score}/${WALIDD_MAX}** (${scr.walidd.label})\n• Kualitas hidup saat haid: **${qolLevel(q.total).label}**\n\n${scr.walidd.plain}${flagTxt}${dTxt}\n\nLangkah yang disarankan: ${recs}. Ini hasil skrining, bukan diagnosis ya 💗`,
        `Berikut penjelasan hasil skrining Anda:\n\n• Skor WaLIDD: ${scr.walidd.score}/${WALIDD_MAX} (${scr.walidd.label})\n• Kualitas hidup saat menstruasi: ${qolLevel(q.total).label}\n\n${scr.walidd.plain}${flagTxt}${dTxt}\n\nRekomendasi: ${recs}. Hasil ini merupakan skrining dan bukan diagnosis.`,
        `Here's your result 🌸\n\n• WaLIDD score: **${scr.walidd.score}/${WALIDD_MAX}** (${scr.walidd.label})\n• Quality of life during periods: **${({Baik:'Good',Sedang:'Moderate',Buruk:'Poor'})[qolLevel(q.total).label]}**\n\n${scr.walidd.plain}${flagTxt}${dTxt}\n\nSuggested steps: ${recs}. This is a screening result, not a diagnosis 💗`);
}
function explainIntervention(iv, st) {
    const extra = [];
    const s = (iv.symptoms || []).join(' ').toLowerCase();
    if (/pusing|mual/.test(s)) extra.push(L(st, 'Untuk pusing/mual: makan porsi kecil tapi sering, minum air hangat/jahe, dan jangan berdiri terlalu cepat.', 'Untuk pusing/mual: makan porsi kecil namun sering, minum hangat/jahe, dan bangun perlahan.', 'For dizziness/nausea: small frequent meals, warm ginger drinks, and stand up slowly.'));
    if (/kembung|begah/.test(s)) extra.push(L(st, 'Untuk kembung: kurangi garam, soda & kafein, dan coba jalan santai.', 'Untuk kembung: kurangi garam, minuman bersoda, kafein, serta berjalan ringan.', 'For bloating: less salt, fizzy drinks and caffeine, and a gentle walk.'));
    if (/punggung|pegal/.test(s)) extra.push(L(st, 'Untuk pegal punggung: kompres hangat di punggung bawah + stretching Child\'s Pose.', 'Untuk pegal punggung: kompres hangat pada punggung bawah dan peregangan Child\'s Pose.', 'For back ache: heat on the lower back plus Child\'s Pose.'));
    const flag = iv.pain >= 8 ? L(st, '\n\n🚩 Nyeri ≥8/10 itu cukup berat. Kalau nggak membaik atau makin parah, periksa ke tenaga kesehatan ya.', '\n\nNyeri ≥8/10 tergolong berat; bila tidak membaik atau memburuk, periksakan ke tenaga kesehatan.', '\n\n🚩 Pain ≥8/10 is quite severe. If it isn\'t easing or gets worse, please see a clinician.') : '';
    return L(st,
        `Siap, aku bantu bahas 🌸 Kamu lagi nyeri **${iv.pain}/10**${s ? ` dengan keluhan ${iv.symptoms.join(', ')}` : ''}. Rekomendasimu: **${iv.recs.join(', ')}**.\n\n${extra.join('\n') || 'Lakukan satu per satu, mulai dari yang paling nyaman buatmu.'}\n\nTips: centang terapi yang sudah kamu lakukan biar progresmu tercatat ✅${flag}`,
        `Baik, berikut pembahasannya. Nyeri Anda ${iv.pain}/10${s ? ` dengan keluhan ${iv.symptoms.join(', ')}` : ''}. Rekomendasi: ${iv.recs.join(', ')}.\n\n${extra.join('\n') || 'Lakukan secara bertahap sesuai kenyamanan.'}\n\nCentang terapi yang telah dilakukan agar progres tercatat.${flag}`,
        `Sure 🌸 Your pain is **${iv.pain}/10**${s ? ` with ${iv.symptoms.join(', ')}` : ''}. Recommended: **${iv.recs.join(', ')}**.\n\n${extra.join('\n') || 'Take them one at a time, starting with what feels best.'}\n\nTick the therapies you do so your progress is logged ✅${flag}`);
}
function explainJournal(ctx, st) {
    const c = ctx.cycle, n = ctx.journalCount || 0;
    if (!n) return L(st, 'Jurnalmu masih kosong 📒 Mulai catat nyeri, mood, dan terapi harianmu di menu **Jurnal & Intervensi** ya, nanti aku bantu baca polanya!', 'Jurnal Anda masih kosong. Silakan mulai mencatat pada menu Jurnal & Intervensi.', 'Your journal is empty 📒 Start logging in **Journal & Intervention** and I\'ll help read your pattern!');
    const dayTxt = c.day ? L(st, `Hari ini kira-kira **hari ke-${c.day}** siklusmu.`, `Hari ini sekitar hari ke-${c.day} siklus Anda.`, `Today is about **day ${c.day}** of your cycle.`) : '';
    const lenTxt = c.avgLen ? L(st, ` Rata-rata siklusmu ±**${c.avgLen} hari** (rata-rata data referensi ${REF.cycleLen.mean} hari).`, ` Rata-rata siklus Anda sekitar ${c.avgLen} hari (data referensi ${REF.cycleLen.mean} hari).`, ` Your average cycle is ~**${c.avgLen} days** (reference average ${REF.cycleLen.mean}).`) : '';
    return L(st, `Kamu sudah mencatat **${n} hari** 📒 ${dayTxt}${lenTxt}`, `Anda telah mencatat ${n} hari. ${dayTxt}${lenTxt}`, `You've logged **${n} days** 📒 ${dayTxt}${lenTxt}`);
}

/** @param {string} text pesan pengguna  @param {object} ctx {lastScr, cycle, journalCount, mode, intervention} */
function femBotReply(text, ctx = {}) {
    const norm = normText(text), st = detectStyle(text, norm);
    if (ctx.mode === 'screening') return explainScreening(ctx.lastScr, st);
    if (ctx.mode === 'intervention' && ctx.intervention) return explainIntervention(ctx.intervention, st);
    if (!norm) return L(st, 'Ketik pertanyaanmu dulu ya 😊', 'Silakan ketik pertanyaan Anda.', 'Type your question first 😊');

    // Pertanyaan tentang data pribadi pengguna
    if (/\b(hasil|skor|skrining|rekomendasi|analisis|result|score|screening)\b/.test(norm) && /\b(aku|ku|saya|my|punya|hasilku|hasil)\b/.test(norm) && !/apa itu|what is|arti/.test(norm)) return explainScreening(ctx.lastScr, st);
    if (/\b(jurnal|catatan|riwayat|progress|perkembangan|journal|hari ke berapa)\b/.test(norm) && /\b(aku|ku|saya|my|hari)\b/.test(norm)) return explainJournal(ctx, st);

    const scored = FEM_KB.map(t => ({ t, s: scoreTopic(t, norm) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    const toks = norm.split(' ').length;
    let pool = scored.filter(x => !SOCIAL.has(x.t.id));
    if (!pool.length && scored.length && toks <= 5) pool = scored;      // sapaan/terima kasih murni
    if (!pool.length) return L(st,
        'Hmm, aku belum nangkep maksudmu 🤔 Coba tanya dengan kata lain ya. Aku paham soal: **kram, telat haid, flek, darah banyak, PMS, mood swing, makanan, olahraga, pembalut, keputihan, PCOS, ovulasi**, atau **hasil skriningmu**. Bahasa santai / formal / English boleh semua!',
        'Mohon maaf, saya belum memahami maksud pertanyaan Anda. Silakan gunakan kata lain. Saya dapat membahas nyeri haid, keterlambatan haid, bercak, perdarahan, PMS, nutrisi, olahraga, produk menstruasi, keputihan, PCOS, ovulasi, serta hasil skrining Anda.',
        'Hmm, I didn\'t quite get that 🤔 Try rephrasing. I can help with **cramps, late periods, spotting, heavy flow, PMS, mood, food, exercise, period products, discharge, PCOS, ovulation**, or **your screening results**.');

    const top = pool[0], t = top.t;
    let out = fillRef(t[st === 'en' ? 'en' : st]);
    if (ctx.lastScr && ['cramps', 'heat', 'painkiller'].includes(t.id)) {
        const k = ctx.lastScr.walidd;
        out += L(st, `\n\n📌 Dari skriningmu terakhir: skor ${k.score}/${WALIDD_MAX} (${k.label}).`, `\n\nCatatan: skor WaLIDD terakhir Anda ${k.score}/${WALIDD_MAX} (${k.label}).`, `\n\n📌 From your last screening: ${k.score}/${WALIDD_MAX} (${k.label}).`);
    }
    const second = pool[1];
    if (second && second.s >= 3 && second.s >= top.s * 0.8 && second.t.id !== t.id) out += '\n\n➕ ' + fillRef(second.t[st === 'en' ? 'en' : st]).split('\n\n')[0];
    if (SAFE_TOPICS.has(t.id)) out += SAFE_NOTE[st === 'en' ? 'en' : st];
    return out;
}
const BOT_CHIPS = ['Kram parah, gimana? 😵', 'Telat haid kenapa?', 'Makanan yang bagus?', 'Jelasin hasil skriningku', 'Is my cycle normal?'];
