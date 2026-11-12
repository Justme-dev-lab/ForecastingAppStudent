import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Shell from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { fmt } from '../lib/data.js';
import { getModels } from '../services/forecastService.js';

export default function Model() {
  const [defaultModel, setDefaultModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModels()
      .then(list => {
        // Ambil model default (misal E_gabungan) atau model pertama sebagai referensi galat
        const def = list.find(m => m.is_default) || list[0];
        setDefaultModel(def);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const rmseTest = defaultModel?.rmse_test || {};
  const rmsePers = defaultModel?.rmse_persistence || {};

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
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Target</th>
                    <th scope="col">RMSE uji model</th>
                    <th scope="col">RMSE persistence (pakai nilai tahun terakhir)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Numerasi (NUM)</td>
                    <td>{loading ? 'Memuat…' : (rmseTest.num != null ? fmt(rmseTest.num, 3) : '—')}</td>
                    <td>{loading ? 'Memuat…' : (rmsePers.num != null ? fmt(rmsePers.num, 3) : '—')}</td>
                  </tr>
                  <tr>
                    <td>Literasi (LIT)</td>
                    <td>{loading ? 'Memuat…' : (rmseTest.lit != null ? fmt(rmseTest.lit, 3) : '—')}</td>
                    <td>{loading ? 'Memuat…' : (rmsePers.lit != null ? fmt(rmsePers.lit, 3) : '—')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
              Tabel di atas menampilkan perbandingan galat tipikal model terhadap pendekatan <em>persistence</em> (menyalin skor tahun lalu) berdasarkan data uji. Hasil ditampilkan sebagai kisaran, dan paling berguna untuk melihat arah naik atau turun.
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