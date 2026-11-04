/* Data tiruan untuk VITE_USE_MOCK=true. Bentuknya sama dengan respons GET /models. */
const num = (name, label, group, median, min, max, required = false) => ({ name, label, group, required, median, min, max });

export const MOCK_MODELS = [
  {
    id: 'E_gabungan', name: 'Model E: Gabungan (utama)', description: 'Contoh mock: semua kelompok fitur.', is_default: true,
    numeric_fields: [
      num('num_lag1', 'Skor NUM tahun sebelumnya', 'Skor tahun sebelumnya', 50, 10, 95, true),
      num('jumlah_peserta_didik__lag1', 'Jumlah peserta didik', 'Sumber daya sekolah', 400, 20, 2000),
      num('jumlah_pendidik__lag1', 'Jumlah pendidik', 'Sumber daya sekolah', 30, 3, 120),
      num('ses_siswa__lag1', 'Status sosial-ekonomi siswa (SES)', 'Latar belakang siswa (survei)', 0, -3, 3),
    ],
    categorical_fields: [
      { name: 'sts_sek', label: 'Status sekolah', group: 'Identitas & wilayah', required: false, options: ['negeri', 'swasta'] },
    ],
  },
  {
    id: 'A_identitas_wilayah', name: 'Model A: Identitas & Wilayah', description: 'Contoh mock: hanya identitas dan skor tahun lalu.', is_default: false,
    numeric_fields: [num('num_lag1', 'Skor NUM tahun sebelumnya', 'Skor tahun sebelumnya', 50, 10, 95, true)],
    categorical_fields: [
      { name: 'sts_sek', label: 'Status sekolah', group: 'Identitas & wilayah', required: false, options: ['negeri', 'swasta'] },
    ],
  },
];

/* Prediksi tiruan (BUKAN model asli): sedikit tarikan ke rata-rata 50. */
export function mockPredict(modelId, features) {
  const m = MOCK_MODELS.find(x => x.id === modelId);
  if (!m) throw new Error(`Model '${modelId}' tidak ditemukan`);
  const prev = Number(features.num_lag1);
  if (features.num_lag1 === undefined || features.num_lag1 === '' || !isFinite(prev)) throw new Error("Field 'num_lag1' (skor tahun sebelumnya) wajib diisi.");
  const pred = prev + (50 - prev) * 0.1;
  const nDefault = m.numeric_fields.filter(f => features[f.name] === undefined || features[f.name] === '').length;
  return { model_id: modelId, prediction: pred, previous_score: prev, change: pred - prev, n_filled_by_default: nDefault };
}
