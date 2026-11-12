import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { changePassword, logout, updateSchool, useStore } from '../lib/store.js';

const field = (id, label, value, onChange, error, props = {}) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="text" value={value} onChange={onChange} aria-invalid={!!error} aria-describedby={`${id}Err`} {...props} />
    <span className="err" id={`${id}Err`} role="alert">{error}</span>
  </div>
);

export default function Profil() {
  const { session } = useStore();
  const navigate = useNavigate();
  const school = session?.school || { nama: '', kode: '' };

  const [sk, setSk] = useState({ nama: school.nama, kode: school.kode });
  const [skErr, setSkErr] = useState({});
  const [skOk, setSkOk] = useState(false);

  const [pw, setPw] = useState({ lama: '', baru: '', ulang: '' });
  const [pwErr, setPwErr] = useState({});
  const [pwOk, setPwOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const saveSchool = e => {
    e.preventDefault();
    const x = {};
    if (sk.nama.trim().length < 3) x.nama = 'Nama sekolah wajib diisi (minimal 3 karakter).';
    if (!/^\d{8}$/.test(sk.kode.trim())) x.kode = 'Kode sekolah (NPSN) harus 8 digit angka.';
    setSkErr(x); setSkOk(false);
    if (Object.keys(x).length) return;
    updateSchool(sk);
    setSkOk(true);
  };

  const savePw = async e => {
    e.preventDefault();
    const x = {};
    if (!pw.lama) x.lama = 'Kata sandi saat ini wajib diisi.';
    if (pw.baru.length < 8) x.baru = 'Kata sandi baru minimal 8 karakter.';
    if (pw.ulang !== pw.baru) x.ulang = 'Konfirmasi kata sandi tidak sama.';
    setPwErr(x); setPwOk(false);
    if (Object.keys(x).length) return;
    setBusy(true);
    const msg = await changePassword(pw.lama, pw.baru);
    setBusy(false);
    if (msg) setPwErr({ lama: msg });
    else { setPwOk(true); setPw({ lama: '', baru: '', ulang: '' }); }
  };

  const editSk = k => e => { setSk(s => ({ ...s, [k]: e.target.value })); setSkOk(false); };
  const editPw = k => e => { setPw(s => ({ ...s, [k]: e.target.value })); setPwOk(false); };

  return (
    <Shell nav="profil" crumb={['Akun', 'Profil']}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>Profil</h1>
        <p className="lead">Kelola data sekolah dan keamanan akun Anda.</p>
      </div>
      <div className="row">
        <div className="grow2 stack" style={{ gap: 24 }}>
          <form className="card stack" style={{ gap: 16 }} onSubmit={saveSchool} noValidate>
            <div className="card-t">Data sekolah</div>
            {field('p-nama', 'Nama sekolah', sk.nama, editSk('nama'), skErr.nama)}
            {field('p-kode', 'Kode sekolah (NPSN)', sk.kode, editSk('kode'), skErr.kode, { inputMode: 'numeric', maxLength: 8 })}
            <div className="callout" role="note"><span>Kode sekolah dipakai untuk mencocokkan kolom <code>kd_sekolah</code> pada file yang diunggah. Jika diubah, unggahan lama tetap memakai kode sebelumnya.</span></div>
            <div className="actions">
              <button className="btn" type="submit">Simpan perubahan</button>
              {skOk && <span className="pill ok" role="status"><Icon name="check" size={16} />Tersimpan</span>}
            </div>
          </form>

          <form className="card stack" style={{ gap: 16 }} onSubmit={savePw} noValidate>
            <div className="card-t">Ganti kata sandi</div>
            {field('pw-lama', 'Kata sandi saat ini', pw.lama, editPw('lama'), pwErr.lama, { type: 'password', autoComplete: 'current-password' })}
            {field('pw-baru', 'Kata sandi baru', pw.baru, editPw('baru'), pwErr.baru, { type: 'password', autoComplete: 'new-password' })}
            {field('pw-ulang', 'Ulangi kata sandi baru', pw.ulang, editPw('ulang'), pwErr.ulang, { type: 'password', autoComplete: 'new-password' })}
            <div className="actions">
              <button className="btn" type="submit" disabled={busy}>Ganti kata sandi</button>
              {pwOk && <span className="pill ok" role="status"><Icon name="check" size={16} />Kata sandi diperbarui</span>}
            </div>
          </form>
        </div>

        <aside className="grow1 stack" style={{ gap: 24 }}>
          <section className="card stack" style={{ gap: 8 }}>
            <div className="card-t">Akun</div>
            <span className="muted" style={{ fontSize: 13 }}>Email</span>
            <strong style={{ overflowWrap: 'anywhere' }}>{session?.email}</strong>
            <span className="muted" style={{ fontSize: 13, marginTop: 8 }}>Sekolah</span>
            <strong>{school.nama}</strong>
            <span className="muted" style={{ fontSize: 13 }}>Kode {school.kode}</span>
          </section>
          <button className="btn danger" type="button" onClick={() => { logout(); navigate('/masuk'); }}>Keluar dari akun</button>
        </aside>
      </div>
    </Shell>
  );
}
