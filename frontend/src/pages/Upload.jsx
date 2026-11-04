import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Shell from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { MAX_BYTES, analyze, fmtSize } from '../lib/data.js';
import { getState, notify, setState, uploadsOf, useStore } from '../lib/store.js';

const CRUMB = ['Data', 'Unggah Data'];

export default function Upload() {
  const { session } = useStore();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const token = useRef(0);
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | selected | uploading | checking | fail
  const [progress, setProgress] = useState(0);
  const [fileErr, setFileErr] = useState('');
  const [fail, setFail] = useState(null);
  const [over, setOver] = useState(false);

  useEffect(() => () => { token.current++; }, []);
  if (!session) return <Shell nav="upload" crumb={CRUMB} />;
  const school = session.school;
  const busy = phase === 'uploading' || phase === 'checking';

  function choose(f) {
    setFileErr(''); setFail(null);
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) return setFileErr('Format file harus CSV.');
    if (f.size > MAX_BYTES) return setFileErr(`Ukuran file ${fmtSize(f.size)} melebihi batas 5 MB.`);
    if (f.size === 0) return setFileErr('File kosong.');
    setFile(f); setPhase('selected'); setProgress(0);
  }
  function reset() {
    token.current++;
    setFile(null); setPhase('idle'); setProgress(0); setFail(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function start() {
    if (!file || busy) return;
    const my = ++token.current, f = file;
    setFail(null); setPhase('uploading'); setProgress(0);
    let text = null, p = 0;
    const reader = new FileReader();
    reader.onload = () => { text = reader.result; };
    reader.readAsText(f);
    const timer = setInterval(() => {
      if (my !== token.current) return clearInterval(timer);
      p = Math.min(100, p + 8);
      setProgress(p);
      if (p >= 100 && text !== null) {
        clearInterval(timer);
        setPhase('checking');
        setTimeout(() => { if (my === token.current) finish(f, text); }, 600);
      }
    }, 70);
  }

  function finish(f, text) {
    const r = analyze(text, school);
    const rec = { id: 'u' + Date.now(), name: f.name, size: f.size, time: Date.now(), status: r.ok ? 'ok' : 'gagal', checks: r.checks, rows: r.rows || 0, cols: r.cols || 0 };
    if (r.ok) Object.assign(rec, { years: r.years, series: r.series, preview: r.preview });
    else Object.assign(rec, { kind: r.kind, message: r.message, fixes: r.fixes });
    setState({ uploads: [rec, ...uploadsOf(getState())].slice(0, 30) });
    if (r.ok) {
      setState({ activeId: rec.id, forecast: null });
      notify(`Validasi selesai: ${f.name} lolos dan dipakai sebagai data aktif.`, '/upload/ringkasan?id=' + rec.id);
      navigate('/upload/ringkasan?id=' + rec.id);
      return;
    }
    notify(`Validasi gagal: ${f.name} ditolak.`, '/upload/riwayat');
    setFail(rec); setPhase('fail'); setProgress(0);
  }

  const status = phase === 'uploading' ? `Mengunggah ${progress}%` : phase === 'checking' ? 'Memeriksa…' : phase === 'fail' ? 'Ditolak' : file ? fmtSize(file.size) : '';
  const hint = busy
    ? <><span className="spin" aria-hidden="true" />{phase === 'uploading' ? 'Mengunggah file…' : 'Memeriksa kolom dan isi data…'}</>
    : phase === 'fail' ? 'Pilih file lain atau perbaiki file ini, lalu unggah ulang.'
    : <><Icon name="info" size={16} />Tekan Unggah File untuk memeriksa kolom dan isi data.</>;

  return (
    <Shell nav="upload" crumb={CRUMB}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>Unggah Data Rapor</h1>
        <p className="lead">Unggah satu file berisi data rapor sekolah Anda untuk semua tahun. Sistem memeriksa kolom wajib dan memastikan datanya milik sekolah Anda.</p>
      </div>

      <div role="alert">
        {fail && (
          <div className="alert warn">
            <Icon name="alert" />
            <div><div className="t">File belum bisa dipakai</div><div className="b" dangerouslySetInnerHTML={{ __html: fail.message }} /></div>
          </div>
        )}
      </div>

      <div className="row">
        <div className="grow2 stack" style={{ gap: 20 }}>
          <div className={`drop${over ? ' over' : ''}`}
            onDragEnter={e => { e.preventDefault(); setOver(true); }}
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={e => { e.preventDefault(); setOver(false); }}
            onDrop={e => { e.preventDefault(); setOver(false); choose(e.dataTransfer.files[0]); }}>
            <Icon name="upload" className="big" />
            <div className="drop-t">Seret file ke sini</div>
            <div className="muted" style={{ fontSize: 14 }}>atau</div>
            <button className="btn sec" type="button" onClick={() => inputRef.current.click()}>Pilih File</button>
            <input type="file" ref={inputRef} accept=".csv,text/csv" hidden onChange={e => choose(e.target.files[0])} />
            <div className="muted" style={{ fontSize: 13 }}>Format CSV, maksimal 5 MB. <Link to="/bantuan">Lihat format data</Link></div>
            <div className="err" role="alert">{fileErr}</div>
          </div>

          {file && (
            <div className="card stack">
              <div className="card-t">File dipilih</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--primary)' }}><Icon name="file" size={28} /></span>
                <div style={{ flex: '1 1 220px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                    <b style={{ overflowWrap: 'anywhere' }}>{file.name}</b><span className="muted">{status}</span>
                  </div>
                  <div className="prog" role="progressbar" aria-label="Progres unggah" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div style={{ width: progress + '%' }} /></div>
                </div>
                <button className="btn sec sm" type="button" onClick={reset}>{busy ? 'Batalkan' : 'Hapus'}</button>
              </div>
              <div className="muted" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>{hint}</div>
            </div>
          )}

          <div className="actions">
            <button className="btn" type="button" disabled={!file || busy} onClick={start}>Unggah File</button>
            <Link className="btn sec" to="/bantuan">Lihat format data</Link>
          </div>
        </div>

        <aside className="grow1 card stack">
          <div className="card-t">Kolom wajib</div>
          <div className="stack" style={{ gap: 14, fontSize: 14, lineHeight: 1.5 }}>
            <div><code>tahun</code><div className="muted">Bilangan bulat, misalnya 2024.</div></div>
            <div><code>num</code><div className="muted">Skor numerasi, tidak boleh kosong.</div></div>
          </div>
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            Minimal satu tahun data. Jika satu tahun punya banyak baris (misalnya satu baris per siswa), sistem menghitung rata-rata <code>num</code> tiap tahun secara otomatis.
          </div>
        </aside>
      </div>

      {fail && (
        <section className="row">
          <div className="grow2 card stack">
            <div className="card-t">Hasil pemeriksaan</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div className="fileinfo"><span className="muted"><Icon name="file" /></span><b>{fail.name}</b></div>
              <span className="pill bad">Ditolak</span>
            </div>
            <ul className="checks">
              {fail.checks.map((c, i) => (
                <li key={i}><Icon name={c.ok ? 'check' : 'x'} className={c.ok ? 'y' : 'n'} /><span dangerouslySetInnerHTML={{ __html: c.html }} /></li>
              ))}
            </ul>
          </div>
          <aside className="grow1 card stack" style={{ gap: 12 }}>
            <div className="card-t">Cara memperbaiki</div>
            <ol className="steps">{fail.fixes.map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}</ol>
          </aside>
        </section>
      )}
    </Shell>
  );
}
