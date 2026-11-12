import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthHero from '../components/AuthHero.jsx';
import { register, useStore } from '../lib/store.js';

const EMPTY = { nama: '', kode: '', email: '', sandi: '', ulang: '' };

function validate(v) {
  const e = {};
  if (v.nama.trim().length < 3) e.nama = 'Nama sekolah wajib diisi (minimal 3 karakter).';
  if (!/^\d{8}$/.test(v.kode.trim())) e.kode = 'Kode sekolah (NPSN) harus 8 digit angka.';
  if (!v.email.trim()) e.email = 'Email wajib diisi.';
  else if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = 'Format email belum benar.';
  if (v.sandi.length < 8) e.sandi = 'Kata sandi minimal 8 karakter.';
  if (v.ulang !== v.sandi) e.ulang = 'Konfirmasi kata sandi tidak sama.';
  return e;
}

export default function Daftar() {
  const { session } = useStore();
  const navigate = useNavigate();
  const [v, setV] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = 'Daftar · EduCast'; }, []);
  if (session) return <Navigate to="/upload" replace />;

  const set = k => e => setV(s => ({ ...s, [k]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    const found = validate(v);
    setErr(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const msg = await register(v);
    setBusy(false);
    if (msg) setErr({ email: msg });
    else navigate('/upload');
  };

  const field = (k, label, props = {}) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input id={k} type="text" value={v[k]} onChange={set(k)} aria-invalid={!!err[k]} aria-describedby={`${k}Err`} {...props} />
      <span className="err" id={`${k}Err`} role="alert">{err[k]}</span>
    </div>
  );

  return (
    <main className="auth">
      <AuthHero />
      <section className="auth-form">
        <form onSubmit={submit} noValidate>
          <div className="stack" style={{ gap: 8 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800 }}>Daftar akun</h2>
            <p className="muted">Satu akun untuk satu sekolah. Kode sekolah dipakai untuk mencocokkan data yang Anda unggah.</p>
          </div>
          {field('nama', 'Nama sekolah', { placeholder: 'SMA Negeri 1 ...', autoComplete: 'organization' })}
          {field('kode', 'Kode sekolah (NPSN)', { placeholder: '8 digit angka', inputMode: 'numeric', maxLength: 8 })}
          {field('email', 'Email', { type: 'email', placeholder: 'nama@sekolah.sch.id', autoComplete: 'username' })}
          {field('sandi', 'Kata sandi', { type: 'password', placeholder: 'Minimal 8 karakter', autoComplete: 'new-password' })}
          {field('ulang', 'Ulangi kata sandi', { type: 'password', autoComplete: 'new-password' })}
          <button className="btn lg" type="submit" disabled={busy}>Daftar</button>
          <p className="muted" style={{ fontSize: 14 }}>Sudah punya akun? <Link to="/masuk">Masuk</Link></p>
        </form>
      </section>
    </main>
  );
}
