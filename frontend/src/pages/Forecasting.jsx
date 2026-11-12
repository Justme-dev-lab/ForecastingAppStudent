import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Shell from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { buildFeatures, labelOf, targetsOf, toForecast } from '../lib/data.js';
import { getModels, runForecast } from '../services/forecastService.js';
import { activeUploadOf, notify, setState, useStore } from '../lib/store.js';

const CRUMB = ['Analisis', 'Simulasi Forecasting'];

export default function Forecasting() {
  const st = useStore();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [models, setModels] = useState(null);
  const [modelId, setModelId] = useState('');
  const [error, setError] = useState('');
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  useEffect(() => {
    getModels()
      .then(list => {
        if (!alive.current) return;
        setModels(list);
        setModelId((list.find(m => m.is_default) || list[0] || {}).id || '');
      })
      .catch(e => { if (alive.current) { setModels([]); setError(e.message); } });
  }, []);

  const u = activeUploadOf(st);
  const school = st.session?.school;

  if (!school) return <Shell nav="forecasting" crumb={CRUMB} />;
  if (!u) {
    return (
      <Shell nav="forecasting" crumb={CRUMB}>
        <h1>Simulasi Forecasting</h1>
        <div className="card empty">
          <Icon name="upload" />
          <div className="card-t" style={{ fontSize: 18 }}>Unggah data rapor dulu</div>
          <p className="lead" style={{ maxWidth: 460 }}>Forecasting memakai data rapor sekolah Anda. Unggah file yang lolos validasi, lalu kembali ke sini.</p>
          <div className="actions" style={{ justifyContent: 'center' }}>
            <Link className="btn" to="/upload">Ke halaman Unggah</Link>
            <Link className="btn sec" to="/upload/riwayat">Pilih dari riwayat</Link>
          </div>
        </div>
      </Shell>
    );
  }

  const last = u.years[u.years.length - 1];
  const targets = targetsOf(u);
  const model = models && models.find(m => m.id === modelId);

  const run = async () => {
    if (!model) return;
    setRunning(true); setError('');
    try {
      // PERBAIKAN: buildFeatures dipanggil tanpa argumen target karena mengambil kedua lag sekaligus
      const features = buildFeatures(u, model);
      const res = await runForecast(model.id, features);
      
      const entries = targets.map(t => [t, toForecast(res, u, model, features, t)]);
      if (!alive.current) return;

      setState({ forecast: { uploadId: u.id, time: Date.now(), results: Object.fromEntries(entries) } });
      notify(`Hasil forecast ${labelOf(targets)} ${last + 1} siap dilihat.`, '/forecasting/hasil');
      navigate('/forecasting/hasil');
    } catch (e) {
      if (!alive.current) return;
      setError(e.message);
      setRunning(false);
    }
  };

  return (
    <Shell nav="forecasting" crumb={CRUMB}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>Simulasi Forecasting</h1>
        <p className="lead">Sistem meramalkan literasi (LIT) dan numerasi (NUM) sekolah Anda untuk tahun berikutnya dari data yang sudah Anda unggah.</p>
      </div>

      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 32px', padding: '16px 24px', fontSize: 14, alignItems: 'center' }}>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: 'var(--primary)' }}><Icon name="file" /></span><span className="muted">Data aktif</span>
          <strong style={{ overflowWrap: 'anywhere' }}>{u.name}</strong>
          <Link to="/upload/riwayat" style={{ fontSize: 13, fontWeight: 600 }}>Ganti</Link>
        </span>
        <span><span className="muted">Target</span> <strong>{labelOf(targets)}</strong></span>
        <span><span className="muted">Tahun terakhir di data</span> <strong>{last}</strong></span>
        <span><span className="muted">Tahun yang diramalkan</span> <strong>{last + 1}</strong></span>
      </div>

      <div className="row">
        <section className="grow2 card stack" style={{ gap: 20 }}>
          <div className="card-t" style={{ fontSize: 16 }}>Sekolah yang diramal</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', background: 'var(--bg)' }}>
            <span style={{ color: 'var(--primary)' }}><Icon name="school" size={32} /></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{school.nama}</div>
              <div className="muted" style={{ fontSize: 14 }}>Kode sekolah {school.kode}</div>
            </div>
          </div>
          <div className="field">
            <label htmlFor="model">Model forecasting</label>
            <select id="model" value={modelId} disabled={!models || !models.length || running} onChange={e => setModelId(e.target.value)}>
              {!models && <option>Memuat daftar model…</option>}
              {models && !models.length && <option>Model tidak tersedia</option>}
              {models && models.map(m => <option key={m.id} value={m.id}>{m.name}{m.is_default ? ' (disarankan)' : ''}</option>)}
            </select>
            {model && <span className="muted" style={{ fontSize: 13 }}>{model.description}</span>}
            <span className="muted" style={{ fontSize: 13 }}>Ingin membandingkan model? Lihat <Link to="/model">tabel evaluasi di Tentang Model</Link>.</span>
          </div>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>Forecasting berjalan untuk sekolah akun Anda. Skor LIT dan/atau NUM tahun terakhir di data Anda menjadi masukan utama model.</p>
          {error && <div className="alert warn" role="alert"><Icon name="alert" /><div><div className="t">Forecast belum bisa dijalankan</div><div className="b">{error}</div></div></div>}
          <div className="actions"><button className="btn" type="button" disabled={running || !model} onClick={run}>Jalankan Forecast</button></div>
          <div className="muted" role="status" style={{ fontSize: 14 }}>{running && <><span className="spin" aria-hidden="true" /> Menghitung forecast…</>}</div>
        </section>

        <aside className="grow1 card stack" style={{ gap: 12 }}>
          <div className="card-t">Yang perlu diketahui</div>
          <ul className="bullets">
            <li>Model FT-Transformer memakai artefak yang sudah dilatih, tanpa latih ulang.</li>
            <li>Minimal satu tahun data. Makin banyak tahun, makin terlihat tren sekolah Anda.</li>
            <li>Hasil berupa kisaran, besar galat tiap target disesuaikan dengan data pengujian model.</li>
          </ul>
          <Link to="/model" style={{ fontSize: 14, fontWeight: 600 }}>Baca tentang model</Link>
        </aside>
      </div>
    </Shell>
  );
}