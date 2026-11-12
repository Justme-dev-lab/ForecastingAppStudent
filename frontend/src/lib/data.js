/* Logika data: baca CSV, validasi, agregasi per tahun, dan penyusunan fitur untuk API.
   Validasi dan agregasi berjalan di browser. Prediksi dilakukan backend (lib/api.js).
   Ada dua target: literasi (lit) dan numerasi (num). File cukup memuat salah satunya. */
  /* Sementara true agar data dummy dengan kd_sekolah apa pun bisa diunggah. Ubah ke false untuk
     kembali mewajibkan kd_sekolah di file sama dengan kode sekolah akun. */
  const SKIP_SCHOOL_CHECK = true;
  const MAX_BYTES = Infinity;   // sementara tanpa batas untuk uji coba FE; semula 5 * 1024 * 1024 (5 MB)

  const TARGETS = [
    {key: 'lit', nama: 'Literasi', kode: 'LIT'},
    {key: 'num', nama: 'Numerasi', kode: 'NUM'},
  ];
  const targetInfo = key => TARGETS.find(t => t.key === key);
  /* Galat uji model per target, dipakai untuk kisaran kasar.
     Angka LIT belum ada: diisi backend lewat respons (field `rmse`) atau ditambahkan di sini. */
  const LAGS = TARGETS.map(t => `${t.key}_lag1`);

  /* Unggahan lama (sebelum ada LIT) hanya punya `series` untuk NUM. */
  const targetsOf = u => u.targets || ['num'];
  const seriesOf = (u, t) => (u.seriesBy ? u.seriesBy[t] : t === 'num' ? u.series : undefined);
  const labelOf = keys => keys.map(k => targetInfo(k).kode).join(' dan ');

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (n, d = 1) => Number(n).toLocaleString('id-ID', {minimumFractionDigits: d, maximumFractionDigits: d});
  const fmtInt = n => Number(n).toLocaleString('id-ID');
  const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1).replace('.', ',') + ' KB' : (b / 1048576).toFixed(1).replace('.', ',') + ' MB';
  const fmtDate = ts => new Intl.DateTimeFormat('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}).format(new Date(ts));

  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/, 1)[0] || '';
    const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; rows.push(row); row = []; }
      else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows.filter(r => r.some(x => x.trim() !== ''));
  }

  const toNum = s => { const t = String(s).trim().replace(',', '.'); return t !== '' && /^-?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : NaN; };

  /* Hasil: {ok, kind, message, fixes, checks[], rows, cols, years[], targets[], seriesBy{}, preview[]} */
  function analyze(text, school) {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return {ok: false, kind: 'kosong', message: 'File kosong atau tidak punya baris data. Data Anda tidak berubah.',
        fixes: ['Buka file dan pastikan ada baris header serta baris data.', 'Simpan sebagai CSV, lalu unggah ulang.'], checks: []};
    }
    const header = rows[0].map(h => h.trim().toLowerCase());
    const idx = {kd: header.indexOf('kd_sekolah'), th: header.indexOf('tahun'), lit: header.indexOf('lit'), num: header.indexOf('num')};
    const found = TARGETS.filter(t => idx[t.key] >= 0);   // target yang ada di file
    const data = rows.slice(1);
    const checks = [];
    const missing = [];
    if (idx.th < 0) missing.push('<code>tahun</code>');
    if (!found.length) missing.push('salah satu dari <code>lit</code> atau <code>num</code>');

    let yearsBad = 0;
    if (idx.th >= 0) {
      yearsBad = data.filter(r => !/^\d{4}$/.test((r[idx.th] || '').trim())).length;
      checks.push({ok: yearsBad === 0, html: yearsBad === 0 ? '<code>tahun</code> ditemukan, berupa bilangan bulat' : `<code>tahun</code> ditemukan, tetapi ${fmtInt(yearsBad)} baris bukan bilangan bulat`});
    } else checks.push({ok: false, html: '<code>tahun</code> tidak ditemukan'});

    /* Sel kosong dilewati saat menghitung rata-rata (data rapor asli sering punya sel kosong).
       Yang ditolak: isi berupa teks bukan angka, atau kolom yang seluruhnya kosong. */
    const bad = {};   // jumlah baris tidak valid per target
    found.forEach(t => {
      const vals = data.map(r => (r[idx[t.key]] || '').trim());
      const blank = vals.filter(v => v === '').length;
      const text = vals.filter(v => v !== '' && isNaN(toNum(v))).length;
      const label = `<code>${t.key}</code> (${t.nama.toLowerCase()}) ditemukan`;
      if (text) { bad[t.key] = text; checks.push({ok: false, html: `${label}, tetapi ${fmtInt(text)} baris berisi teks yang bukan angka`}); }
      else if (blank === vals.length) { bad[t.key] = vals.length; checks.push({ok: false, html: `${label}, tetapi seluruh barisnya kosong`}); }
      else { bad[t.key] = 0; checks.push({ok: true, html: blank ? `${label}; ${fmtInt(blank)} baris kosong dilewati saat menghitung rata-rata` : `${label}, tanpa nilai kosong`}); }
    });
    if (!found.length) checks.push({ok: false, html: 'Kolom skor tidak ditemukan: file harus punya <code>lit</code> atau <code>num</code> (boleh keduanya)'});
    const anyBad = found.some(t => bad[t.key] > 0);

    let codes = [], matchOk = true;
    if (idx.kd >= 0 && SKIP_SCHOOL_CHECK) {
      checks.push({ok: true, html: 'Kolom <code>kd_sekolah</code> ada, pencocokan dengan akun dilewati (mode uji coba)'});
    } else if (idx.kd >= 0) {
      codes = [...new Set(data.map(r => (r[idx.kd] || '').trim()))];
      matchOk = codes.length === 1 && codes[0] === school.kode;
      let html = '<code>kd_sekolah</code> cocok dengan akun Anda';
      if (!matchOk) html = codes.length > 1
        ? `<code>kd_sekolah</code> tidak cocok dengan akun: file berisi ${codes.length} kode sekolah, akun Anda <code>${esc(school.kode)}</code>`
        : `<code>kd_sekolah</code> tidak cocok dengan akun: file berisi <code>${esc(codes[0] || '(kosong)')}</code>, akun Anda <code>${esc(school.kode)}</code>`;
      checks.push({ok: matchOk, html});
    }

    const baseOk = missing.length === 0 && yearsBad === 0 && !anyBad;
    const sums = {};   // sums[target][tahun] = daftar nilai (sel kosong dilewati)
    found.forEach(t => { sums[t.key] = {}; });
    if (baseOk) data.forEach(r => {
      const y = +r[idx.th].trim();
      found.forEach(t => {
        const v = (r[idx[t.key]] || '').trim();
        if (v !== '') (sums[t.key][y] = sums[t.key][y] || []).push(toNum(v));
      });
    });
    /* Tahun yang dipakai: yang punya nilai untuk semua kolom skor di file. */
    const years = baseOk ? Object.keys(sums[found[0].key]).map(Number).filter(y => found.every(t => sums[t.key][y])).sort((a, b) => a - b) : [];
    if (baseOk && !years.length) checks.push({ok: false, html: 'Tidak ada tahun yang punya nilai untuk semua kolom skor di file'});
    const valid = baseOk && years.length > 0;
    const seriesBy = {};
    found.forEach(t => {
      seriesBy[t.key] = {};
      years.forEach(y => { const v = sums[t.key][y]; seriesBy[t.key][y] = v.reduce((a, b) => a + b, 0) / v.length; });
    });
    /* Baris ringkas tahun terakhir (rata-rata untuk kolom angka, nilai pertama untuk teks).
       Dipakai untuk mengisi fitur tambahan model bila nama kolomnya cocok. */
    let lastRow = null;
    if (valid) {
      const lastY = years[years.length - 1];
      const rowsLast = data.filter(r => +r[idx.th].trim() === lastY);
      lastRow = {};
      header.forEach((h, c) => {
        if (!h || ['kd_sekolah', 'tahun', 'lit', 'num'].includes(h)) return;
        const vals = rowsLast.map(r => (r[c] || '').trim()).filter(v => v !== '');
        if (!vals.length) return;
        const nums = vals.map(toNum);
        lastRow[h] = nums.every(n => !isNaN(n)) ? nums.reduce((a, b) => a + b, 0) / nums.length : vals[0];
      });
    }
    if (valid) checks.push({ok: true, html: `Data mencakup ${years.length} tahun (${years[0]}–${years[years.length - 1]}), target: ${labelOf(found.map(t => t.key))}`});

    const failed = checks.find(c => !c.ok);
    const base = {checks, rows: data.length, cols: header.length};
    if (!failed) {
      const schools = idx.kd >= 0 ? new Set(data.map(r => (r[idx.kd] || '').trim())).size : 1;
      return {...base, ok: true, years, seriesBy, targets: found.map(t => t.key), schools, lastRow,
        preview: data.slice(0, 5).map(r => [(r[idx.th] || '').trim(), ...found.map(t => (r[idx[t.key]] || '').trim())])};
    }
    if (missing.length) return {...base, ok: false, kind: 'kolom',
      message: `Kolom berikut tidak ditemukan: ${missing.join(', ')}. Periksa nama kolom di baris pertama file, lalu unggah ulang. Data Anda tidak berubah.`,
      fixes: ['Buka file di Excel atau editor CSV.', 'Pastikan baris pertama berisi <code>tahun</code> dan minimal salah satu dari <code>lit</code> atau <code>num</code>.', 'Simpan, lalu unggah ulang.']};
    if (!matchOk) return {...base, ok: false, kind: 'sekolah',
      message: codes.length > 1
        ? `File ini berisi ${codes.length} kode <code>kd_sekolah</code> berbeda, sedangkan akun Anda terdaftar untuk <code>${esc(school.kode)}</code>. Hanya data sekolah Anda yang bisa diunggah. Data Anda tidak berubah.`
        : `Kode <code>kd_sekolah</code> di file (<code>${esc(codes[0] || '(kosong)')}</code>) berbeda dari akun Anda (<code>${esc(school.kode)}</code>). Hanya data sekolah Anda yang bisa diunggah. Data Anda tidak berubah.`,
      fixes: ['Buka file di Excel atau editor CSV.', `Hapus semua baris milik sekolah lain, atau hapus kolom <code>kd_sekolah</code> jika tidak diperlukan.`, 'Pastikan kolom <code>tahun</code> dan kolom skor (<code>lit</code> atau <code>num</code>) tetap ada, simpan, lalu unggah ulang.']};
    if (yearsBad || anyBad) return {...base, ok: false, kind: 'isi',
      message: `${yearsBad ? `Ada ${fmtInt(yearsBad)} baris dengan <code>tahun</code> yang bukan bilangan bulat. ` : ''}${found.filter(t => bad[t.key]).map(t => `Ada ${fmtInt(bad[t.key])} baris dengan <code>${t.key}</code> kosong atau bukan angka. `).join('')}Perbaiki baris tersebut lalu unggah ulang. Data Anda tidak berubah.`,
      fixes: ['Cari baris yang kosong atau berisi teks di kolom <code>tahun</code>, <code>lit</code>, dan <code>num</code> yang Anda pakai.', 'Isi atau hapus baris tersebut.', 'Simpan, lalu unggah ulang.']};
    return {...base, ok: false, kind: 'isi', message: 'File belum bisa dipakai. Data Anda tidak berubah.', fixes: ['Periksa isi file, lalu unggah ulang.']};
  }

  /* Susun fitur untuk POST /forecast/{model_id}. 
     Karena backend kini mewajibkan num_lag1 dan lit_lag1, kita kirim keduanya sekaligus. */
  function buildFeatures(upload, model) {
    const last = upload.years[upload.years.length - 1];
    const feats = {};
    
    // Masukkan lag untuk semua target yang tersedia di seriesBy atau default-nya
    TARGETS.forEach(t => {
      const s = seriesOf(upload, t.key);
      if (s && s[last] !== undefined) {
        feats[`${t.key}_lag1`] = s[last];
      }
    });

    const row = upload.lastRow || {};
    const pick = name => row[name] ?? row[name.replace(/__lag1$/, '')];
    
    model.numeric_fields.forEach(f => {
      if (LAGS.includes(f.name)) return;
      const v = pick(f.name);
      if (typeof v === 'number' && isFinite(v)) feats[f.name] = v;
    });
    
    model.categorical_fields.forEach(f => {
      const v = pick(f.name);
      if (v !== undefined && f.options.includes(String(v))) feats[f.name] = String(v);
    });
    
    return feats;
  }

  /* Ubah respons backend menjadi bentuk yang dipakai halaman Hasil dan Chart. */
  function toForecast(res, upload, model, features, target) {
    const clamp = v => Math.max(0, Math.min(100, v));
    const s = seriesOf(upload, target);
    const lastYear = upload.years[upload.years.length - 1];
    const value = res.forecast?.[target];
    const rmse = res.rmse_test?.[target] ?? null;
    const persistence = res.rmse_persistence?.[target] ?? null;
    const prevScore = res.previous?.[target] ?? s[lastYear];
    const changeVal = res.changes?.[target] ?? (value - prevScore);

    return {
      target, year: lastYear + 1, value, delta: changeVal,
      rmse, persistence, low: rmse == null ? null : clamp(value - rmse), high: rmse == null ? null : clamp(value + rmse),
      lastYear, lastValue: prevScore,
      modelId: res.model_id, modelName: model.name,
      nNumeric: model.numeric_fields.filter(f => !LAGS.includes(f.name) || f.name === `${target}_lag1`).length,
      nDefault: res.n_filled_by_default,
      nProvided: Object.keys(features).length,
    };
  }

  /* Contoh file untuk uji coba (deterministik). */
  function sampleCSV(kode, kind) {
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const base = {2021: [52, 56], 2022: [53.1, 57.4], 2023: [54.6, 55.8], 2024: [55.2, 58.9], 2025: [57, 60.2]};
    const withKd = kind === 'campur';
    const lines = [withKd ? 'kd_sekolah,tahun,lit,num' : 'tahun,lit,num'];
    Object.keys(base).forEach(y => { for (let i = 0; i < 12; i++) {
      let code = kode;
      if (kind === 'campur' && i % 4 === 3) code = String(+kode + (i % 3) + 1);
      const lit = (base[y][0] + (rnd() - .5) * 12).toFixed(1), num = (base[y][1] + (rnd() - .5) * 12).toFixed(1);
      lines.push((withKd ? code + ',' : '') + `${y},${lit},${num}`);
    } });
    return lines.join('\n');
  }

export {MAX_BYTES, TARGETS, targetInfo, targetsOf, seriesOf, labelOf, esc, fmt, fmtInt, fmtSize, fmtDate, parseCSV, analyze, buildFeatures, toForecast, sampleCSV};
