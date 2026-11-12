import Shell from '../components/Layout.jsx';
import { sampleCSV } from '../lib/data.js';
import { useStore } from '../lib/store.js';

function save(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Bantuan() {
  const kode = useStore().session?.school.kode;
  return (
    <Shell nav="bantuan" crumb={['Bantuan', 'Format Data']}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>Format Data</h1>
        <p className="lead">Supaya file tidak ditolak, pastikan isinya sesuai aturan berikut.</p>
      </div>
      <div className="row">
        <div className="grow2 stack" style={{ gap: 24 }}>
          <section className="card stack" style={{ gap: 12, paddingBottom: 12 }}>
            <div className="card-t">Kolom wajib</div>
            <div className="tablewrap">
              <table>
                <thead><tr><th scope="col">Kolom</th><th scope="col">Isi</th><th scope="col">Aturan</th></tr></thead>
                <tbody>
                  <tr><td><code>tahun</code></td><td>Tahun data</td><td>Bilangan bulat empat digit, misalnya 2024. Satu tahun saja sudah cukup.</td></tr>
                  <tr><td><code>lit</code> dan <code>num</code></td><td>Skor literasi (<code>lit</code>) dan skor numerasi (<code>num</code>)</td><td>Wajib memiliki kedua kolom. Angka, tidak boleh kosong. Desimal boleh memakai titik atau koma. Forecasting dibuat untuk setiap kolom yang ada.</td></tr>
                </tbody>
              </table>
            </div>
          </section>
          <section className="card stack" style={{ gap: 10 }}>
            <div className="card-t">Ketentuan file</div>
            <ul className="bullets">
              <li>Format CSV (pemisah koma atau titik koma), baris pertama berisi nama kolom.</li>
              <li>Kolom lain boleh ada. Kolom yang namanya sama dengan fitur model (misalnya <code>jumlah_peserta_didik</code> atau <code>sts_sek</code>) dipakai dari tahun terakhir untuk memperbaiki forecast; kolom lainnya diabaikan.</li>
              <li>Satu tahun boleh punya banyak baris (misalnya satu baris per siswa). Sistem menghitung rata-rata <code>lit</code> dan <code>num</code> tiap tahun secara otomatis.</li>
            </ul>
          </section>
        </div>
        <aside className="grow1 card stack" style={{ gap: 14 }}>
          <div className="card-t">Contoh file</div>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>Unduh contoh untuk mencoba alur unggah. Contoh memuat kolom <code>lit</code> dan <code>num</code> sekaligus.</p>
          <button className="btn" type="button" onClick={() => save('contoh_rapor_benar.csv', sampleCSV(kode, 'benar'))}>Contoh file yang benar</button>
          <button className="btn sec" type="button" onClick={() => save('contoh_rapor_ditolak.csv', sampleCSV(kode, 'campur'))}>Contoh file yang ditolak</button>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>Contoh yang ditolak berisi kolom <code>kd_sekolah</code> dengan beberapa kode sekolah berbeda.</p>
        </aside>
      </div>
    </Shell>
  );
}
