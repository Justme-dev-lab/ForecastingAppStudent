import { Link } from 'react-router-dom';
import Shell from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import Chart from '../components/Chart.jsx';
import { PERSISTENCE, RMSE, fmt } from '../lib/data.js';
import { uploadsOf, useStore } from '../lib/store.js';

const CRUMB = ['Analisis', 'Simulasi Forecasting', 'Hasil'];
const sign = d => (d >= 0 ? '+' : '−') + fmt(Math.abs(d));

export default function Hasil() {
  const st = useStore();
  const school = st.session?.school;
  const f = st.forecast;
  const u = f && uploadsOf(st).find(x => x.id === f.uploadId && x.status === 'ok');

  if (!school) return <Shell nav="forecasting" crumb={CRUMB} />;
  if (!u) {
    return (
      <Shell nav="forecasting" crumb={CRUMB}>
        <h1>Hasil forecast</h1>
        <div className="card empty">
          <Icon name="trend" />
          <div className="card-t" style={{ fontSize: 18 }}>Belum ada hasil forecast</div>
          <p className="lead">Jalankan forecasting dari halaman Simulasi Forecasting.</p>
          <Link className="btn" to="/forecasting">Ke Simulasi Forecasting</Link>
        </div>
      </Shell>
    );
  }

  const years = u.years;
  const download = () => {
    const csv = 'kd_sekolah,tahun_prediksi,num_pred,num_bawah,num_atas\n' + [school.kode, f.year, f.value.toFixed(2), f.low.toFixed(2), f.high.toFixed(2)].join(',') + '\n';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `forecast_${school.kode}_${f.year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Shell nav="forecasting" crumb={CRUMB}>
      <div className="page-h">
        <div>
          <h1>Hasil forecast NUM {f.year}</h1>
          <p className="muted">{school.nama} · {school.kode} · data {u.name}</p>
        </div>
        <button className="btn" type="button" onClick={download}><Icon name="download" size={18} />Unduh CSV</button>
      </div>

      <div className="alert note" role="note">
        <Icon name="alert" />
        <div>
          <div className="t">Baca prediksi sebagai kisaran, bukan angka pasti.</div>
          <div className="b">Galat tipikal model sekitar 5–6 poin NUM (RMSE uji {fmt(RMSE, 3)}), dan model belum mengalahkan persistence ({fmt(PERSISTENCE, 3)}) untuk tingkat nilai. Gunakan hasil ini untuk melihat arah, bukan untuk target yang kaku.</div>
        </div>
      </div>

      {years.length === 1 && (
        <div className="callout"><Icon name="info" /><span>Data Anda baru mencakup satu tahun, jadi prediksi sama dengan nilai tahun itu dan belum menunjukkan tren. Tambahkan data tahun lain agar hasilnya lebih berarti.</span></div>
      )}

      <div className="row">
        <section className="grow2 card stack">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="card-t">NUM {years[0]}–{f.year}</div>
            <div className="legend">
              <span><i aria-hidden="true" style={{ width: 18, height: 3, background: 'var(--primary)', display: 'inline-block' }} />Data rapor</span>
              <span><i aria-hidden="true" style={{ width: 10, height: 10, border: '2px solid var(--accent)', borderRadius: '50%', display: 'inline-block' }} />Prediksi</span>
              <span><i aria-hidden="true" style={{ width: 18, height: 10, background: 'var(--accent-soft)', borderRadius: 2, display: 'inline-block' }} />Kisaran kasar</span>
            </div>
          </div>
          <Chart years={years} series={u.series} f={f} />
          <div className="muted" style={{ fontSize: 13 }}>Kisaran kasar mengikuti galat tipikal model (±{fmt(RMSE)} poin). Prediksi dihitung oleh {f.modelName ? f.modelName : 'model FT-Transformer'}: {fmt(f.nNumeric - f.nDefault, 0)} dari {fmt(f.nNumeric, 0)} fitur angka diisi dari data Anda, sisanya memakai median data latih.</div>
        </section>

        <aside className="grow1 stack" style={{ gap: 24 }}>
          <section className="card pred-card stack" style={{ gap: 6 }}>
            <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>NUM prediksi {f.year}</span>
            <span className="big">{fmt(f.value)}</span>
            <span style={{ fontSize: 14, color: 'var(--primary-dark)', fontWeight: 600 }}>{sign(f.delta)} dari {f.lastYear}</span>
            <span className="muted" style={{ fontSize: 13 }}>Kisaran kasar {fmt(f.low)} – {fmt(f.high)}</span>
          </section>
          <section className="card stack" style={{ gap: 12, paddingBottom: 12 }}>
            <div className="card-t">Data per tahun</div>
            <table>
              <thead><tr><th scope="col">Tahun</th><th scope="col">NUM</th><th scope="col">Sumber</th></tr></thead>
              <tbody>
                {years.map(y => <tr key={y}><td>{y}</td><td>{fmt(u.series[y])}</td><td className="muted">Rapor</td></tr>)}
                <tr><td><strong>{f.year}</strong></td><td><strong>{fmt(f.value)}</strong></td><td style={{ color: 'var(--warn-icon)', fontWeight: 600 }}>Prediksi</td></tr>
              </tbody>
            </table>
          </section>
        </aside>
      </div>

      <div className="actions">
        <Link className="btn sec" to="/upload/riwayat">Ganti data aktif</Link>
        <Link className="btn sec" to="/model">Tentang model</Link>
      </div>
    </Shell>
  );
}
