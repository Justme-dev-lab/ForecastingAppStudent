import { Link } from 'react-router-dom';
import Shell from '../components/Layout.jsx';

export default function Model() {
  return (
    <Shell nav="model" crumb={['Bantuan', 'Tentang Model']}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>Tentang Model</h1>
        <p className="lead">Cara kerja prediksi NUM sekolah Anda dan batas yang perlu Anda ketahui sebelum memakainya.</p>
      </div>
      <div className="row">
        <div className="grow2 stack" style={{ gap: 24 }}>
          <section className="card stack" style={{ gap: 10 }}>
            <div className="card-t" style={{ fontSize: 16 }}>Cara kerja</div>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
              Sistem memakai model FT-Transformer yang sudah dilatih pada data Rapor Pendidikan SMA. Model tidak dilatih ulang saat Anda mengunggah file. Data Anda diringkas menjadi satu nilai rata-rata <code>num</code> untuk setiap tahun. Nilai tahun terakhir menjadi masukan utama model (<code>num_lag1</code>), dan kolom lain di file Anda ikut dipakai bila namanya cocok dengan fitur model. Fitur yang tidak ada diisi median data latih. Ada beberapa varian model (A sampai E) dengan kelompok fitur berbeda; Anda memilihnya di halaman Simulasi Forecasting.
            </p>
          </section>
          <section className="card stack" style={{ gap: 10 }}>
            <div className="card-t" style={{ fontSize: 16 }}>Seberapa akurat?</div>
            <div className="stats" style={{ gap: 16 }}>
              <div className="stat"><span className="v">5,786</span><span className="l">RMSE uji model</span></div>
              <div className="stat"><span className="v">5,354</span><span className="l">RMSE persistence (pakai nilai tahun terakhir)</span></div>
            </div>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>
              Galat tipikal sekitar 5–6 poin NUM. Untuk tingkat nilai, model belum mengalahkan persistence. Karena itu hasil ditampilkan sebagai kisaran, dan paling berguna untuk melihat arah naik atau turun.
            </p>
          </section>
          <section className="card stack" style={{ gap: 10 }}>
            <div className="card-t" style={{ fontSize: 16 }}>Kapan hasil kurang bisa diandalkan</div>
            <ul className="bullets">
              <li>Data sekolah hanya dua atau tiga tahun, sehingga tren belum stabil.</li>
              <li>Ada perubahan besar di sekolah (misalnya perubahan jumlah siswa atau kurikulum) yang tidak tercatat di data.</li>
              <li>Nilai NUM tahun-tahun sebelumnya naik turun tajam.</li>
            </ul>
          </section>
        </div>
        <aside className="grow1 card stack" style={{ gap: 12 }}>
          <div className="card-t">Ringkas</div>
          <ul className="bullets"><li>Satu akun untuk satu sekolah.</li><li>Prediksi 1 tahun ke depan.</li><li>Tampilkan sebagai kisaran.</li></ul>
          <Link className="btn sec" to="/forecasting">Ke Simulasi Forecasting</Link>
        </aside>
      </div>
    </Shell>
  );
}
