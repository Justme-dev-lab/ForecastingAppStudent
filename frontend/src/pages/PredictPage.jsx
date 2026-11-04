import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import DynamicForm from '../components/DynamicForm.jsx';
import Icon from '../components/Icon.jsx';
import { RMSE, fmt } from '../lib/data.js';
import { getModels, predict } from '../services/predictionService.js';

const CRUMB = ['Analisis', 'Prediksi Manual'];
const sign = d => (d >= 0 ? '+' : '−') + fmt(Math.abs(d));

/* Prediksi satu sekolah dengan mengisi fitur model secara manual (tanpa unggah CSV). */
export default function PredictPage() {
  const [models, setModels] = useState(null);
  const [modelId, setModelId] = useState('');
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let alive = true;
    getModels()
      .then(list => { if (alive) { setModels(list); setModelId((list.find(m => m.is_default) || list[0] || {}).id || ''); } })
      .catch(e => { if (alive) { setModels([]); setError(e.message); } });
    return () => { alive = false; };
  }, []);

  const model = models && models.find(m => m.id === modelId);

  const submit = async e => {
    e.preventDefault();
    if (!model) return;
    const features = {};
    model.numeric_fields.forEach(f => {
      const raw = String(values[f.name] ?? '').trim().replace(',', '.');
      if (raw !== '' && isFinite(Number(raw))) features[f.name] = Number(raw);
    });
    model.categorical_fields.forEach(f => { if (values[f.name]) features[f.name] = values[f.name]; });
    if (features.num_lag1 === undefined) { setError('Skor NUM tahun sebelumnya wajib diisi.'); setResult(null); return; }
    setLoading(true); setError('');
    try {
      setResult({ ...(await predict(model.id, features)), modelName: model.name, nNumeric: model.numeric_fields.length });
    } catch (err) { setError(err.message); setResult(null); }
    setLoading(false);
  };

  const low = result && Math.max(0, result.prediction - RMSE), high = result && Math.min(100, result.prediction + RMSE);

  return (
    <Layout nav="prediksi" crumb={CRUMB}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>Prediksi Manual</h1>
        <p className="lead">Isi data sekolah secara langsung untuk memprediksi NUM tahun berikutnya. Hanya skor tahun sebelumnya yang wajib; field kosong diisi median data latih.</p>
      </div>
      <div className="row">
        <form className="grow2 card stack" style={{ gap: 20 }} onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="model">Model prediksi</label>
            <select id="model" value={modelId} disabled={!models || !models.length || loading} onChange={e => { setModelId(e.target.value); setValues({}); setResult(null); }}>
              {!models && <option>Memuat daftar model…</option>}
              {models && !models.length && <option>Model tidak tersedia</option>}
              {models && models.map(m => <option key={m.id} value={m.id}>{m.name}{m.is_default ? ' (disarankan)' : ''}</option>)}
            </select>
            {model && <span className="muted" style={{ fontSize: 13 }}>{model.description}</span>}
          </div>
          {model && <DynamicForm model={model} values={values} disabled={loading} onChange={(k, v) => setValues(s => ({ ...s, [k]: v }))} />}
          {error && <div className="alert warn" role="alert"><Icon name="alert" /><div><div className="t">Prediksi belum bisa dijalankan</div><div className="b">{error}</div></div></div>}
          <div className="actions"><button className="btn" type="submit" disabled={loading || !model}>Prediksi</button></div>
          <div className="muted" role="status" style={{ fontSize: 14 }}>{loading && <><span className="spin" aria-hidden="true" /> Menghitung…</>}</div>
        </form>
        <aside className="grow1 stack" style={{ gap: 24 }}>
          {result ? (
            <section className="card pred-card stack" style={{ gap: 6 }}>
              <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>NUM prediksi · {result.modelName}</span>
              <span className="big">{fmt(result.prediction)}</span>
              {result.change != null && <span style={{ fontSize: 14, color: 'var(--primary-dark)', fontWeight: 600 }}>{sign(result.change)} dari skor sebelumnya ({fmt(result.previous_score)})</span>}
              <span className="muted" style={{ fontSize: 13 }}>Kisaran kasar {fmt(low)} – {fmt(high)}</span>
              <span className="muted" style={{ fontSize: 13 }}>{fmt(result.nNumeric - result.n_filled_by_default, 0)} dari {fmt(result.nNumeric, 0)} fitur angka diisi manual, sisanya median.</span>
            </section>
          ) : (
            <section className="card stack" style={{ gap: 8 }}>
              <div className="card-t">Hasil</div>
              <p className="muted" style={{ fontSize: 14 }}>Hasil prediksi muncul di sini. Baca sebagai kisaran, galat tipikal model sekitar 5–6 poin NUM.</p>
            </section>
          )}
        </aside>
      </div>
    </Layout>
  );
}
