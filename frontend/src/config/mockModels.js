const num = (name, label, group, median, min, max, required = false) => ({ name, label, group, required, median, min, max });
const lagLit = num('lit_lag1', 'Skor LIT tahun sebelumnya', 'Skor tahun sebelumnya', 50, 10, 95);
const lagNum = num('num_lag1', 'Skor NUM tahun sebelumnya', 'Skor tahun sebelumnya', 50, 10, 95);

export const MOCK_MODELS = [
  {
    id: 'E_gabungan', name: 'Model E: Gabungan (utama)', description: 'Contoh mock: semua kelompok fitur.', is_default: true,
    rmse_test: { num: 5.9326, lit: 8.2902 },
    rmse_persistence: { num: 5.354, lit: 7.121 },
    numeric_fields: [
      lagLit, lagNum,
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
    rmse_test: { num: 6.6111, lit: 8.1580 },
    rmse_persistence: { num: 5.354, lit: 7.121 },
    numeric_fields: [lagLit, lagNum],
    categorical_fields: [
      { name: 'sts_sek', label: 'Status sekolah', group: 'Identitas & wilayah', required: false, options: ['negeri', 'swasta'] },
    ],
  },
];

export function mockForecast(modelId, features) {
  const m = MOCK_MODELS.find(x => x.id === modelId);
  if (!m) throw new Error(`Model '${modelId}' tidak ditemukan`);

  const prevNum = Number(features['num_lag1'] ?? 50);
  const prevLit = Number(features['lit_lag1'] ?? 50);

  const predNum = prevNum + (50 - prevNum) * 0.1;
  const predLit = prevLit + (50 - prevLit) * 0.1;

  const forecast = { num: predNum, lit: predLit };
  const previous = { num: prevNum, lit: prevLit };
  const changes = { num: predNum - prevNum, lit: predLit - prevLit };

  const nDefault = m.numeric_fields.filter(f => features[f.name] === undefined || features[f.name] === '').length;

  return {
    model_id: modelId,
    forecast_num: predNum,
    previous_score: prevNum,
    change: predNum - prevNum,
    forecast,
    previous,
    changes,
    n_filled_by_default: nDefault,
    n_missing_categorical: 0,
    rmse_test: m.rmse_test,
    rmse_persistence: m.rmse_persistence,
  };
}