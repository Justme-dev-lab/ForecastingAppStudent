import { Link } from 'react-router-dom';
import Shell from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import Chart from '../components/Chart.jsx';
import { TARGETS, fmt, labelOf, seriesOf, targetInfo, targetsOf } from '../lib/data.js';
import { uploadsOf, useStore } from '../lib/store.js';

const CRUMB = ['Analisis', 'Simulasi Forecasting', 'Hasil'];
const sign = d => (d >= 0 ? '+' : '−') + fmt(Math.abs(d));

export default function Hasil() {
  const st = useStore();
  const school = st.session?.school;
  const f = st.forecast;
  const u = f && f.results && uploadsOf(st).find(x => x.id === f.uploadId && x.status === 'ok');

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
  const keys = TARGETS.map(t => t.key).filter(k => f.results[k] && targetsOf(u).includes(k));
  const year = f.results[keys[0]].year;
  const download = () => {
    const head = ['kd_sekolah', 'tahun_forecast', ...keys.flatMap(k => [`${k}_forecast`, `${k}_bawah`, `${k}_atas`])].join(',');
    const cells = [school.kode, year, ...keys.flatMap(k => {
      const r = f.results[k];
      return [r.value.toFixed(2), r.low == null ? '' : r.low.toFixed(2), r.high == null ? '' : r.high.toFixed(2)];
    })];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([head + '\n' + cells.join(',') + '\n'], { type: 'text/csv' }));
    a.download = `forecast_${school.kode}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Shell nav="forecasting" crumb={CRUMB}>
      <div className="page-h">
        <div>
          <h1>Hasil forecast {labelOf(keys)} {year}</h1>
          <p className="muted">{school.nama} · {school.kode} · data {u.name}</p>
        </div>
        <button className="btn" type="button" onClick={download}><Icon name="download" size={18} />Unduh CSV</button>
      </div>

      <div className="alert note" role="note">
        <Icon name="alert" />
        <div>
          <div className="t">Baca forecast sebagai kisaran, bukan angka pasti.</div>
          <div className="b">
            Gunakan hasil ini untuk melihat arah, bukan untuk target yang kaku.
            <ul className="bullets" style={{ marginTop: 6 }}>
              {keys.map(k => {
                const r = f.results[k], info = targetInfo(k);
                if (r.rmse == null) return <li key={k}>{info.kode}: angka galat model belum tersedia, jadi kisaran kasar belum ditampilkan.</li>;
                return <li key={k}>{info.kode}: galat uji model (RMSE) {fmt(r.rmse, 3)}{r.persistence ? `, dan model dibandingkan dengan persistence (${fmt(r.persistence, 3)})` : ''}.</li>;
              })}
            </ul>
          </div>
        </div>
      </div>

      {years.length === 1 && (
        <div className="callout"><Icon name="info" /><span>Data Anda baru mencakup satu tahun, jadi forecasting sama dengan nilai tahun itu dan belum menunjukkan tren. Tambahkan data tahun lain agar hasilnya lebih berarti.</span></div>
      )}

      {keys.map(k => {
        const r = f.results[k], info = targetInfo(k), series = seriesOf(u, k);
        return (
          <div className="row" key={k}>
            <section className="grow2 card stack">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="card-t">{info.nama} ({info.kode}) {years[0]}–{r.year}</div>
                <div className="legend">
                  <span><i aria-hidden="true" style={{ width: 18, height: 3, background: 'var(--primary)', display: 'inline-block' }} />Data rapor</span>
                  <span><i aria-hidden="true" style={{ width: 10, height: 10, border: '2px solid var(--accent)', borderRadius: '50%', display: 'inline-block' }} />Forecasting</span>
                  {r.low != null && <span><i aria-hidden="true" style={{ width: 18, height: 10, background: 'var(--accent-soft)', borderRadius: 2, display: 'inline-block' }} />Kisaran kasar</span>}
                </div>
              </div>
              <Chart years={years} series={series} f={r} label={info.nama} />
              <div className="muted" style={{ fontSize: 13 }}>
                {r.rmse != null ? `Kisaran kasar mengikuti galat tipikal model (±${fmt(r.rmse)} poin). ` : ''}Forecasting dihitung oleh {r.modelName ? r.modelName : 'model FT-Transformer'}: {fmt(r.nNumeric - r.nDefault, 0)} dari {fmt(r.nNumeric, 0)} fitur angka diisi dari data Anda, sisanya memakai median data latih.
              </div>
            </section>

            <aside className="grow1 stack" style={{ gap: 24 }}>
              <section className="card pred-card stack" style={{ gap: 6 }}>
                <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{info.kode} forecast {r.year}</span>
                <span className="big">{fmt(r.value)}</span>
                <span style={{ fontSize: 14, color: 'var(--primary-dark)', fontWeight: 600 }}>{sign(r.delta)} dari {r.lastYear}</span>
                {r.low != null && <span className="muted" style={{ fontSize: 13 }}>Kisaran kasar {fmt(r.low)} – {fmt(r.high)}</span>}
              </section>
            </aside>
          </div>
        );
      })}

      <section className="card stack" style={{ gap: 12, paddingBottom: 12 }}>
        <div className="card-t">Data per tahun</div>
        <div className="tablewrap">
          <table>
            <thead><tr><th scope="col">Tahun</th>{keys.map(k => <th key={k} scope="col">{targetInfo(k).kode}</th>)}<th scope="col">Sumber</th></tr></thead>
            <tbody>
              {years.map(y => <tr key={y}><td>{y}</td>{keys.map(k => <td key={k}>{fmt(seriesOf(u, k)[y])}</td>)}<td className="muted">Rapor</td></tr>)}
              <tr><td><strong>{year}</strong></td>{keys.map(k => <td key={k}><strong>{fmt(f.results[k].value)}</strong></td>)}<td style={{ color: 'var(--warn-icon)', fontWeight: 600 }}>Forecast</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="actions">
        <Link className="btn sec" to="/upload/riwayat">Ganti data aktif</Link>
        <Link className="btn sec" to="/model">Tentang model</Link>
      </div>
    </Shell>
  );
}