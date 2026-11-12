import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Shell from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { fmt } from '../lib/data.js';
import { EVALUASI_MODEL, PERSISTENCE_VALIDASI } from '../config/evaluasiModel.js';
import { getModels } from '../services/forecastService.js';

const GRUP = [
  { key: null, label: 'Gabungan' },
  { key: 'num', label: 'NUM' },
  { key: 'lit', label: 'LIT' },
];
const METRIK = [
  { key: 'smape', label: 'SMAPE (%)', digit: 2 },
  { key: 'mae', label: 'MAE', digit: 3 },
  { key: 'rmse', label: 'RMSE', digit: 3 },
];
const nilai = (row, g, m) => (g.key ? row[g.key] : row)[m.key];

export default function Model() {
  const [models, setModels] = useState([]);
  useEffect(() => {
    let alive = true;
    getModels()
      .then(list => { if (alive) setModels(list); })
      .catch(() => {});   // tanpa daftar dari server, tabel memakai id model dan tabel data uji disembunyikan
    return () => { alive = false; };
  }, []);
  const names = Object.fromEntries(models.map(m => [m.id, m.name]));

  // Data uji: RMSE tiap model dibandingkan dengan persistence (menyalin skor tahun lalu)
  const uji = models.filter(m => m.rmse_test);
  const pers = (models.find(m => m.is_default) || models[0])?.rmse_persistence || null;
  const kesimpulan = uji.length && pers
    ? [['num', 'NUM'], ['lit', 'LIT']].filter(([k]) => pers[k] != null).map(([k, label]) => {
        const nilaiUji = uji.map(m => m.rmse_test[k]).filter(v => v != null);
        const terkecil = Math.min(...nilaiUji);
        return terkecil < pers[k]
          ? `${label}: model terbaik (${fmt(terkecil, 3)}) memiliki galat lebih kecil daripada persistence (${fmt(pers[k], 3)}).`
          : `${label}: belum ada model yang galatnya lebih kecil daripada persistence (${fmt(pers[k], 3)}). Model terbaik mencapai ${fmt(terkecil, 3)}.`;
      })
    : [];

  // nilai terkecil tiap kolom = model terbaik pada kolom itu
  const terbaik = {};
  GRUP.forEach(g => METRIK.forEach(m => {
    terbaik[`${g.key}-${m.key}`] = Math.min(...EVALUASI_MODEL.map(r => nilai(r, g, m)));
  }));
  const sel = (row, g, m, bold) => (
    <td key={`${g.key}-${m.key}`} style={bold ? { fontWeight: 700 } : undefined}>{fmt(nilai(row, g, m), m.digit)}</td>
  );

  return (
    <Shell nav="model" crumb={['Bantuan', 'Tentang Model']}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>Tentang Model</h1>
        <p className="lead">Cara kerja forecasting literasi (LIT) dan numerasi (NUM) sekolah Anda dan batas yang perlu Anda ketahui sebelum memakainya.</p>
      </div>
      <div className="row">
        <div className="grow2 stack" style={{ gap: 24 }}>
          <section className="card stack" style={{ gap: 10 }}>
            <div className="card-t" style={{ fontSize: 16 }}>Cara kerja</div>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
              Sistem memakai model FT-Transformer yang sudah dilatih pada data Rapor Pendidikan SMA. Model tidak dilatih ulang saat Anda mengunggah file. Data Anda diringkas menjadi satu nilai rata-rata untuk setiap tahun, terpisah untuk literasi (<code>lit</code>) dan numerasi (<code>num</code>). File cukup memuat salah satunya, dan forecasting dibuat untuk setiap kolom yang ada. Nilai tahun terakhir menjadi masukan utama model (<code>lit_lag1</code> atau <code>num_lag1</code>), dan kolom lain di file Anda ikut dipakai bila namanya cocok dengan fitur model. Fitur yang tidak ada diisi median data latih. Ada beberapa varian model (A sampai E) dengan kelompok fitur berbeda; Anda memilihnya di halaman Simulasi Forecasting.
            </p>
          </section>
          
          <section className="card stack" style={{ gap: 10 }}>
            <div className="card-t" style={{ fontSize: 16 }}>Seberapa akurat?</div>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
              Ada dua tabel. Tabel pertama membandingkan galat antar model pada data validasi. Tabel kedua membandingkan galat model dengan tebakan paling sederhana pada data uji. Angka yang lebih kecil berarti forecast lebih dekat ke skor yang sebenarnya.
            </p>
            <div className="card-t" style={{ fontSize: 14, marginTop: 4 }}>Data validasi: perbandingan antar model</div>
            <div className="tablewrap">
              <table style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th scope="col" rowSpan={2}>Model</th>
                    {GRUP.map(g => <th key={g.label} scope="colgroup" colSpan={3}>{g.label}</th>)}
                  </tr>
                  <tr>
                    {GRUP.flatMap(g => METRIK.map(m => <th key={`${g.label}-${m.key}`} scope="col">{m.label}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {EVALUASI_MODEL.map(r => (
                    <tr key={r.id}>
                      <td>{names[r.id] || r.id}</td>
                      {GRUP.flatMap(g => METRIK.map(m => sel(r, g, m, nilai(r, g, m) === terbaik[`${g.key}-${m.key}`])))}
                    </tr>
                  ))}
                  {PERSISTENCE_VALIDASI && (
                    <tr style={{ fontStyle: 'italic' }}>
                      <td>Pembanding: salin skor tahun lalu</td>
                      {GRUP.flatMap(g => METRIK.map(m => sel(PERSISTENCE_VALIDASI, g, m, false)))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card-t" style={{ fontSize: 14, marginTop: 8 }}>Arti angka-angkanya</div>
            <ul className="bullets">
              <li><strong>MAE</strong> (galat absolut rata-rata): rata-rata selisih antara forecast dan skor sebenarnya, dalam poin skor. MAE 4 berarti forecast rata-rata meleset sekitar 4 poin.</li>
              <li><strong>RMSE</strong>: mirip MAE, tetapi selisih besar dihukum lebih berat. Nilainya selalu sama dengan atau lebih besar dari MAE. Bila RMSE jauh lebih besar daripada MAE, ada sekolah yang meleset jauh dari rata-rata.</li>
              <li><strong>SMAPE</strong>: galat dalam persen terhadap besar skor. SMAPE 7% berarti forecast rata-rata meleset sekitar 7% dari skor. Karena berupa persen, angka ini lebih mudah dibandingkan antara NUM dan LIT yang skalanya bisa berbeda.</li>
              <li><strong>Gabungan</strong>: rata-rata galat NUM dan LIT. <strong>NUM</strong> dan <strong>LIT</strong> adalah galat untuk masing-masing target.</li>
            </ul>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
              Angka tebal adalah yang terkecil pada kolomnya. Data validasi dipakai saat memilih model, jadi galat pada data baru bisa lebih besar. LIT cenderung lebih sulit diramal daripada NUM, terlihat dari galatnya yang lebih tinggi.
            </p>

            {uji.length > 0 && (
              <>
                <div className="card-t" style={{ fontSize: 14, marginTop: 8 }}>Data uji: dibandingkan dengan persistence</div>
                <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <em>Persistence</em> adalah tebakan paling sederhana: skor tahun depan dianggap sama dengan skor tahun terakhir. Model baru terbukti berguna bila galatnya lebih kecil daripada persistence. Tabel ini memakai RMSE pada data uji, yaitu data yang sama sekali tidak dipakai saat melatih maupun memilih model.
                </p>
                <div className="tablewrap">
                  <table style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th scope="col">Model</th>
                        <th scope="col">RMSE NUM</th>
                        <th scope="col">RMSE LIT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uji.map(m => (
                        <tr key={m.id}>
                          <td>{m.name}{m.is_default ? ' (disarankan)' : ''}</td>
                          <td>{m.rmse_test.num != null ? fmt(m.rmse_test.num, 3) : '—'}</td>
                          <td>{m.rmse_test.lit != null ? fmt(m.rmse_test.lit, 3) : '—'}</td>
                        </tr>
                      ))}
                      {pers && (
                        <tr style={{ fontStyle: 'italic' }}>
                          <td>Pembanding: persistence (salin skor tahun lalu)</td>
                          <td>{pers.num != null ? fmt(pers.num, 3) : '—'}</td>
                          <td>{pers.lit != null ? fmt(pers.lit, 3) : '—'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {kesimpulan.length > 0 && <ul className="bullets">{kesimpulan.map((t, i) => <li key={i}>{t}</li>)}</ul>}
              </>
            )}
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
              Gunakan hasil forecast sebagai gambaran arah naik atau turun, bukan angka pasti.
            </p>
          </section>

          <section className="card stack" style={{ gap: 10 }}>
            <div className="card-t" style={{ fontSize: 16 }}>Kapan hasil kurang bisa diandalkan</div>
            <ul className="bullets">
              <li>Data sekolah hanya dua atau tiga tahun, sehingga tren belum stabil.</li>
              <li>Ada perubahan besar di sekolah (misalnya perubahan jumlah siswa atau kurikulum) yang tidak tercatat di data.</li>
              <li>Nilai LIT atau NUM tahun-tahun sebelumnya naik turun tajam.</li>
            </ul>
          </section>
        </div>

        <aside className="grow1 card stack" style={{ gap: 12 }}>
          <div className="card-t">Ringkas</div>
          <ul className="bullets">
            <li>Satu akun untuk satu sekolah.</li>
            <li>Forecasting 1 tahun ke depan.</li>
            <li>Tampilkan sebagai kisaran.</li>
          </ul>
          <Link className="btn sec" to="/forecasting">Ke Simulasi Forecasting</Link>
        </aside>
      </div>
    </Shell>
  );
}