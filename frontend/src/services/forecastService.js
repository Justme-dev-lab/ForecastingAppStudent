import { api, API_BASE_URL } from '../lib/apiClient.js';
import { MOCK_MODELS, mockForecast } from '../config/mockModels.js';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const wait = ms => new Promise(r => setTimeout(r, ms));

/* Ubah error axios jadi Error berpesan Indonesia. `detail` dari FastAPI bisa string
   (404, validasi model) atau array objek {msg} (validasi bentuk body). */
function toError(e) {
  if (!e.response) return new Error(`Server forecasting tidak dapat dihubungi (${API_BASE_URL}). Pastikan backend sudah berjalan.`);
  const d = e.response.data && e.response.data.detail;
  const msg = typeof d === 'string' ? d : Array.isArray(d) ? d.map(x => x.msg).join('; ') : `Permintaan gagal (kode ${e.response.status}).`;
  return new Error(msg);
}

/* GET /models -> [{id, name, description, is_default, numeric_fields[], categorical_fields[]}] */
export async function getModels() {
  if (USE_MOCK) { await wait(300); return MOCK_MODELS; }
  try { return (await api.get('/models')).data; } catch (e) { throw toError(e); }
}

/* POST /predict/{model_id} body {features, target} -> {model_id, prediction, previous_score, change, n_filled_by_default, rmse?}
   target = 'lit' | 'num'. Fitur wajib per target: lit_lag1 atau num_lag1.
   (Bentuk body untuk LIT perlu dicocokkan dengan backend.) */
export async function runForecast(modelId, features) {
  if (USE_MOCK) { await wait(400); return mockForecast(modelId, features); }
  try { return (await api.post(`/forecast/${encodeURIComponent(modelId)}`, { features })).data; } catch (e) { throw toError(e); }
}