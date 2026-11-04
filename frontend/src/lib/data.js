/* Logika data: baca CSV, validasi, agregasi per tahun, dan penyusunan fitur untuk API.
   Validasi dan agregasi berjalan di browser. Prediksi dilakukan backend (lib/api.js). */
  const MAX_BYTES = 5 * 1024 * 1024;
  const RMSE = 5.786;          // galat uji model, dipakai untuk kisaran kasar
  const PERSISTENCE = 5.354;

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

  /* Hasil: {ok, kind, message, fixes, checks[], rows, cols, years[], series{}, preview[]} */
  function analyze(text, school) {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return {ok: false, kind: 'kosong', message: 'File kosong atau tidak punya baris data. Data Anda tidak berubah.',
        fixes: ['Buka file dan pastikan ada baris header serta baris data.', 'Simpan sebagai CSV, lalu unggah ulang.'], checks: []};
    }
    const header = rows[0].map(h => h.trim().toLowerCase());
    const idx = {kd: header.indexOf('kd_sekolah'), th: header.indexOf('tahun'), num: header.indexOf('num')};
    const data = rows.slice(1);
    const checks = [];
    const missing = [['tahun', idx.th], ['num', idx.num]].filter(x => x[1] < 0).map(x => x[0]);

    let yearsBad = 0, numBad = 0;
    if (idx.th >= 0) {
      yearsBad = data.filter(r => !/^\d{4}$/.test((r[idx.th] || '').trim())).length;
      checks.push({ok: yearsBad === 0, html: yearsBad === 0 ? '<code>tahun</code> ditemukan, berupa bilangan bulat' : `<code>tahun</code> ditemukan, tetapi ${fmtInt(yearsBad)} baris bukan bilangan bulat`});
    } else checks.push({ok: false, html: '<code>tahun</code> tidak ditemukan'});
    if (idx.num >= 0) {
      numBad = data.filter(r => isNaN(toNum(r[idx.num] || ''))).length;
      checks.push({ok: numBad === 0, html: numBad === 0 ? '<code>num</code> ditemukan, tanpa nilai kosong' : `<code>num</code> ditemukan, tetapi ${fmtInt(numBad)} baris kosong atau bukan angka`});
    } else checks.push({ok: false, html: '<code>num</code> tidak ditemukan'});

    let codes = [], matchOk = true;
    if (idx.kd >= 0) {
      codes = [...new Set(data.map(r => (r[idx.kd] || '').trim()))];
      matchOk = codes.length === 1 && codes[0] === school.kode;
      let html = '<code>kd_sekolah</code> cocok dengan akun Anda';
      if (!matchOk) html = codes.length > 1
        ? `<code>kd_sekolah</code> tidak cocok dengan akun: file berisi ${codes.length} kode sekolah, akun Anda <code>${esc(school.kode)}</code>`
        : `<code>kd_sekolah</code> tidak cocok dengan akun: file berisi <code>${esc(codes[0] || '(kosong)')}</code>, akun Anda <code>${esc(school.kode)}</code>`;
      checks.push({ok: matchOk, html});
    }

    const valid = missing.length === 0 && yearsBad === 0 && numBad === 0;
    const sums = {};
    if (valid) data.forEach(r => { const y = +r[idx.th].trim(); (sums[y] = sums[y] || []).push(toNum(r[idx.num])); });
    const years = Object.keys(sums).map(Number).sort((a, b) => a - b);
    const series = {}; years.forEach(y => series[y] = sums[y].reduce((a, b) => a + b, 0) / sums[y].length);
    /* Baris ringkas tahun terakhir (rata-rata untuk kolom angka, nilai pertama untuk teks).
       Dipakai untuk mengisi fitur tambahan model bila nama kolomnya cocok. */
    let lastRow = null;
    if (valid) {
      const lastY = years[years.length - 1];
      const rowsLast = data.filter(r => +r[idx.th].trim() === lastY);
      lastRow = {};
      header.forEach((h, c) => {
        if (!h || ['kd_sekolah', 'tahun', 'num'].includes(h)) return;
        const vals = rowsLast.map(r => (r[c] || '').trim()).filter(v => v !== '');
        if (!vals.length) return;
        const nums = vals.map(toNum);
        lastRow[h] = nums.every(n => !isNaN(n)) ? nums.reduce((a, b) => a + b, 0) / nums.length : vals[0];
      });
    }
    if (valid) checks.push({ok: true, html: `Data mencakup ${years.length} tahun (${years[0]}–${years[years.length - 1]})`});

    const failed = checks.find(c => !c.ok);
    const base = {checks, rows: data.length, cols: header.length};
    if (!failed) {
      return {...base, ok: true, years, series, lastRow,
        preview: data.slice(0, 5).map(r => [(r[idx.th] || '').trim(), (r[idx.num] || '').trim()])};
    }
    if (missing.length) return {...base, ok: false, kind: 'kolom',
      message: `Kolom berikut tidak ditemukan: ${missing.map(m => `<code>${m}</code>`).join(', ')}. Periksa nama kolom di baris pertama file, lalu unggah ulang. Data Anda tidak berubah.`,
      fixes: ['Buka file di Excel atau editor CSV.', 'Pastikan baris pertama berisi <code>tahun</code> dan <code>num</code>.', 'Simpan, lalu unggah ulang.']};
    if (!matchOk) return {...base, ok: false, kind: 'sekolah',
      message: codes.length > 1
        ? `File ini berisi ${codes.length} kode <code>kd_sekolah</code> berbeda, sedangkan akun Anda terdaftar untuk <code>${esc(school.kode)}</code>. Hanya data sekolah Anda yang bisa diunggah. Data Anda tidak berubah.`
        : `Kode <code>kd_sekolah</code> di file (<code>${esc(codes[0] || '(kosong)')}</code>) berbeda dari akun Anda (<code>${esc(school.kode)}</code>). Hanya data sekolah Anda yang bisa diunggah. Data Anda tidak berubah.`,
      fixes: ['Buka file di Excel atau editor CSV.', `Hapus semua baris milik sekolah lain, atau hapus kolom <code>kd_sekolah</code> jika tidak diperlukan.`, 'Pastikan kolom <code>tahun</code> dan <code>num</code> tetap ada, simpan, lalu unggah ulang.']};
    if (yearsBad || numBad) return {...base, ok: false, kind: 'isi',
      message: `${yearsBad ? `Ada ${fmtInt(yearsBad)} baris dengan <code>tahun</code> yang bukan bilangan bulat. ` : ''}${numBad ? `Ada ${fmtInt(numBad)} baris dengan <code>num</code> kosong atau bukan angka. ` : ''}Perbaiki baris tersebut lalu unggah ulang. Data Anda tidak berubah.`,
      fixes: ['Cari baris yang kosong atau berisi teks di kolom <code>tahun</code> dan <code>num</code>.', 'Isi atau hapus baris tersebut.', 'Simpan, lalu unggah ulang.']};
    return {...base, ok: false, kind: 'isi', message: 'File belum bisa dipakai. Data Anda tidak berubah.', fixes: ['Periksa isi file, lalu unggah ulang.']};
  }

  /* Susun fitur untuk POST /predict/{model_id} dari data aktif.
     - num_lag1 (wajib) = rata-rata NUM tahun terakhir di file.
     - Kolom lain di file dipakai bila namanya sama dengan field model, atau sama
       dengan nama field tanpa akhiran "__lag1". Nilainya diambil dari tahun terakhir.
     - Field yang tidak ada di file dibiarkan kosong: backend mengisinya dengan median training. */
  function buildFeatures(upload, model) {
    const last = upload.years[upload.years.length - 1];
    const feats = {num_lag1: upload.series[last]};
    const row = upload.lastRow || {};
    const pick = name => row[name] ?? row[name.replace(/__lag1$/, '')];
    model.numeric_fields.forEach(f => {
      if (f.name === 'num_lag1') return;
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
  function toForecast(res, upload, model, features) {
    const clamp = v => Math.max(0, Math.min(100, v));
    const lastYear = upload.years[upload.years.length - 1];
    const value = res.prediction;
    return {
      year: lastYear + 1, value, delta: res.change ?? value - upload.series[lastYear],
      low: clamp(value - RMSE), high: clamp(value + RMSE),
      lastYear, lastValue: res.previous_score ?? upload.series[lastYear],
      modelId: res.model_id, modelName: model.name,
      nNumeric: model.numeric_fields.length, nDefault: res.n_filled_by_default,
      nProvided: Object.keys(features).length,
    };
  }

  /* Contoh file untuk uji coba (deterministik). */
  function sampleCSV(kode, kind) {
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const base = {2021: 56, 2022: 57.4, 2023: 55.8, 2024: 58.9, 2025: 60.2};
    const withKd = kind === 'campur';
    const lines = [withKd ? 'kd_sekolah,tahun,num' : 'tahun,num'];
    Object.keys(base).forEach(y => { for (let i = 0; i < 12; i++) {
      let code = kode;
      if (kind === 'campur' && i % 4 === 3) code = String(+kode + (i % 3) + 1);
      lines.push((withKd ? code + ',' : '') + `${y},${(base[y] + (rnd() - .5) * 12).toFixed(1)}`);
    } });
    return lines.join('\n');
  }

export {MAX_BYTES, RMSE, PERSISTENCE, esc, fmt, fmtInt, fmtSize, fmtDate, parseCSV, analyze, buildFeatures, toForecast, sampleCSV};
