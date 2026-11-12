/* Hasil evaluasi tiap model pada data VALIDASI (ensemble), disalin dari notebook
   ft-transformer-multivariate-lit-num-forecasting.ipynb (sel "val_ens").
   Nilai ini statis: bila model dilatih ulang, perbarui angka di sini.
   id = domain di notebook = id model di backend. Urutan = RMSE makro terkecil dulu. */
export const EVALUASI_MODEL = [
  { id: 'E_sel',                            smape: 7.036323, mae: 4.168945, rmse: 5.551935, num: { smape: 6.346035, mae: 3.545775, rmse: 4.732862 }, lit: { smape: 7.726611, mae: 4.792116, rmse: 6.371008 } },
  { id: 'E_gabungan',                       smape: 7.120792, mae: 4.239136, rmse: 5.623530, num: { smape: 6.335025, mae: 3.550679, rmse: 4.792771 }, lit: { smape: 7.906558, mae: 4.927592, rmse: 6.454289 } },
  { id: 'D_sosek_agregat_iklim_akreditasi', smape: 7.261045, mae: 4.315616, rmse: 5.725156, num: { smape: 6.487079, mae: 3.634172, rmse: 4.843135 }, lit: { smape: 8.035011, mae: 4.997060, rmse: 6.607178 } },
  { id: 'C_sosek_siswa',                    smape: 7.273216, mae: 4.313211, rmse: 5.732778, num: { smape: 6.478851, mae: 3.617772, rmse: 4.835765 }, lit: { smape: 8.067581, mae: 5.008649, rmse: 6.629791 } },
  { id: 'B_sumberdaya_sekolah',             smape: 7.372096, mae: 4.368586, rmse: 5.798640, num: { smape: 6.592329, mae: 3.682595, rmse: 4.908654 }, lit: { smape: 8.151864, mae: 5.054576, rmse: 6.688626 } },
  { id: 'A_identitas_wilayah',              smape: 7.366745, mae: 4.381318, rmse: 5.872274, num: { smape: 6.558229, mae: 3.672212, rmse: 4.958515 }, lit: { smape: 8.175260, mae: 5.090423, rmse: 6.786032 } },
];

/* Pembanding "salin skor tahun lalu" (persistence) pada data VALIDASI YANG SAMA.
   Isi dari notebook bila sudah dihitung, dengan bentuk seperti satu baris di atas
   (tanpa id), misalnya:
   { smape: 0, mae: 0, rmse: 0, num: { smape: 0, mae: 0, rmse: 0 }, lit: { smape: 0, mae: 0, rmse: 0 } }
   Selama null, baris pembanding tidak ditampilkan. Jangan isi dengan angka dari data uji:
   himpunan datanya berbeda sehingga tidak sebanding. */
export const PERSISTENCE_VALIDASI = null;