import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Shell from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { fmt, fmtInt, labelOf, seriesOf, targetInfo, targetsOf } from '../lib/data.js';
import { activeUploadOf, setState, uploadsOf, useStore } from '../lib/store.js';

const CRUMB = ['Data', 'Unggah Data', 'Ringkasan'];

export default function Ringkasan() {
  const st = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id');
  const u = uploadsOf(st).find(x => x.id === id && x.status === 'ok') || activeUploadOf(st);

  if (!u) {
    return (
      <Shell nav="upload" crumb={CRUMB}>
        <div className="card empty">
          <Icon name="upload" />
          <h1 style={{ fontSize: 22 }}>Belum ada data yang lolos validasi</h1>
          <p className="lead">Unggah data rapor sekolah Anda dulu untuk melihat ringkasannya.</p>
          <Link className="btn" to="/upload">Ke halaman Unggah</Link>
        </div>
      </Shell>
    );
  }

  const isActive = st.activeId === u.id;
  const y0 = u.years[0], y1 = u.years[u.years.length - 1];
  const activate = () => { setState({ activeId: u.id, forecast: null }); navigate('/forecasting'); };

  return (
    <Shell nav="upload" crumb={CRUMB}>
      <div className="page-h">
        <div><h1>Ringkasan data</h1><p className="muted">{u.name}</p></div>
        <span className="pill ok" style={{ fontSize: 14, padding: '8px 16px' }}><Icon name="check" size={18} />Lolos validasi</span>
      </div>

      <section className="card stats" aria-label="Ukuran data">
        <div className="stat"><span className="v">{fmtInt(u.rows)}</span><span className="l">Jumlah baris</span></div>
        <div className="stat"><span className="v">{fmtInt(u.cols)}</span><span className="l">Jumlah kolom</span></div>
        <div className="stat"><span className="v">{y0 === y1 ? y0 : `${y0}–${y1}`}</span><span className="l">Rentang tahun</span></div>
        <div className="stat"><span className="v">{fmtInt(u.schools ?? 1)}</span><span className="l">Sekolah di file</span></div>
      </section>

      <div className="row">
        <section className="card stack" style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div className="card-t">Cek kolom wajib</div>
          <ul className="checks">
            {u.checks.map((c, i) => <li key={i}><Icon name="check" className="y" /><span dangerouslySetInnerHTML={{ __html: c.html }} /></li>)}
          </ul>
          <div className="callout"><Icon name="info" /><span>Tahun yang punya banyak baris dihitung rata-ratanya, sehingga tiap tahun menjadi satu nilai sekolah untuk setiap target ({labelOf(targetsOf(u))}).</span></div>
        </section>

        <section className="card stack" style={{ flex: '2 1 460px', minWidth: 0, gap: 12 }}>
          <div className="card-t">Rata-rata per tahun</div>
          <div className="tablewrap">
            <table>
              <thead><tr><th scope="col">Tahun</th>{targetsOf(u).map(k => <th key={k} scope="col">{targetInfo(k).nama} ({targetInfo(k).kode})</th>)}</tr></thead>
              <tbody>
                {u.years.map(y => <tr key={y}><td>{y}</td>{targetsOf(u).map(k => <td key={k}>{fmt(seriesOf(u, k)[y])}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>Nilai inilah yang dipakai sebagai dasar forecasting. Sel kosong tidak ikut dihitung.</div>
        </section>
      </div>

      <div className="actions">
        {!isActive && <button className="btn" type="button" onClick={activate}>Jadikan data aktif</button>}
        <Link className={`btn${isActive ? '' : ' sec'}`} to="/forecasting">Lanjut ke Simulasi Forecasting</Link>
        <Link className="btn sec" to="/upload">Unggah data lain</Link>
      </div>
    </Shell>
  );
}
