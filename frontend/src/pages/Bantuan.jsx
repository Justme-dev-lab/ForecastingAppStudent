import Shell from '../components/Layout.jsx';
import { HEADER, KATEGORI, BG, sampleCSV } from '../lib/data.js';
import { useStore } from '../lib/store.js';

function save(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- tampilan ----------

function Chips({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((v) => <code key={v}>{v}</code>)}
    </div>
  );
}

function PilihanTable({ rows }) {
  return (
    <div className="tablewrap">
      <table>
        <thead><tr><th scope="col">Kolom</th><th scope="col">Pilihan yang diizinkan</th></tr></thead>
        <tbody>
          {rows.map(({ kolom, v1, v2 }) => (
            <tr key={kolom}>
              <td><code>{kolom}</code></td>
              <td>
                {v2 ? (
                  <div className="stack" style={{ gap: 6 }}>
                    <div><span className="muted">v1:</span> <Chips items={v1} /></div>
                    <div><span className="muted">v2:</span> <Chips items={v2} /></div>
                  </div>
                ) : <Chips items={v1} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Bantuan() {
  const kode = useStore().session?.school.kode;
  return (
    <Shell nav="bantuan" crumb={['Bantuan', 'Format Data']}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>Format Data</h1>
        <p className="lead">Supaya file tidak ditolak, pastikan header dan isi kolom kategori sesuai aturan berikut.</p>
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

          <section className="card stack" style={{ gap: 12 }}>
            <div className="card-t">Header kolom ({HEADER.length} kolom)</div>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>Nama kolom harus persis seperti berikut (huruf kecil, tanpa spasi).</p>
            <Chips items={HEADER} />
          </section>

          <section className="card stack" style={{ gap: 12, paddingBottom: 12 }}>
            <div className="card-t">Kolom kategori sekolah dan wilayah</div>
            <PilihanTable rows={KATEGORI} />
          </section>

          <section className="card stack" style={{ gap: 12, paddingBottom: 12 }}>
            <div className="card-t">Latar belakang siswa (bg*)</div>
            <PilihanTable rows={BG} />
          </section>

          <section className="card stack" style={{ gap: 10 }}>
            <div className="card-t">Ketentuan file</div>
            <ul className="bullets">
              <li>Format CSV (pemisah koma atau titik koma), baris pertama berisi nama kolom.</li>
              <li>Isi kolom kategori hanya boleh salah satu dari pilihan pada tabel di atas. Nilai lain akan ditolak.</li>
              <li>Kolom yang namanya sama dengan fitur model (misalnya <code>jumlah_peserta_didik</code> atau <code>sts_sek</code>) dipakai dari tahun terakhir untuk memperbaiki forecast.</li>
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
          <hr style={{ width: '100%', border: 0, borderTop: '1px solid var(--border)', margin: '4px 0' }} />
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>Definisi resmi setiap kolom data siswa (nama indikator, definisi, dan rentang nilai), sesuai kamus data Rapor Pendidikan.</p>
          <a className="btn sec" href="/codebook_siswa.csv" download="codebook_siswa.csv">Unduh Codebook Siswa</a>
        </aside>
      </div>
    </Shell>
  );
}