import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { login, useStore } from '../lib/store.js';

export default function Masuk() {
  const { session } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [err, setErr] = useState({ email: '', sandi: '' });

  useEffect(() => { document.title = 'Masuk · Rapor NUM'; }, []);
  if (session) return <Navigate to="/upload" replace />;

  const submit = e => {
    e.preventDefault();
    const em = email.trim();
    const eMsg = !em ? 'Email wajib diisi.' : !/^\S+@\S+\.\S+$/.test(em) ? 'Format email belum benar.' : '';
    const pMsg = !sandi ? 'Kata sandi wajib diisi.' : '';
    setErr({ email: eMsg, sandi: pMsg });
    if (eMsg || pMsg) return;
    login(em);
    navigate('/upload');
  };

  return (
    <main className="auth">
      <section className="auth-hero">
        <div className="brand" style={{ color: '#fff', fontSize: 20 }}><img className="logo" src="/logo.png" alt="" width="40" height="40" />Rapor NUM</div>
        <div className="stack" style={{ gap: 20, maxWidth: 480 }}>
          <h1>Perkirakan numerasi sekolah Anda untuk tahun berikutnya.</h1>
          <p>Unggah data Rapor Pendidikan SMA milik sekolah Anda, biarkan sistem memeriksanya, lalu lihat hasil forecasting sekolah Anda.</p>
        </div>
        <ol>
          <li><span aria-hidden="true">1</span>Unggah data rapor</li>
          <li><span aria-hidden="true">2</span>Periksa ringkasan data</li>
          <li><span aria-hidden="true">3</span>Jalankan forecasting</li>
        </ol>
      </section>
      <section className="auth-form">
        <form onSubmit={submit} noValidate>
          <div className="stack" style={{ gap: 8 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800 }}>Masuk</h2>
            <p className="muted">Gunakan akun sekolah Anda. Satu akun untuk satu sekolah.</p>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" placeholder="nama@sekolah.sch.id" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!err.email} aria-describedby="emailErr" />
            <span className="err" id="emailErr" role="alert">{err.email}</span>
          </div>
          <div className="field">
            <label htmlFor="sandi">Kata sandi</label>
            <input id="sandi" type="password" autoComplete="current-password" placeholder="Masukkan kata sandi" value={sandi} onChange={e => setSandi(e.target.value)} aria-invalid={!!err.sandi} aria-describedby="sandiErr" />
            <span className="err" id="sandiErr" role="alert">{err.sandi}</span>
          </div>
          <button className="btn lg" type="submit">Masuk</button>
          <p className="muted" style={{ fontSize: 13 }}>Versi demo: isi email dan kata sandi apa saja. Akun akan terhubung ke SMA Negeri 1 Contoh (kode sekolah 20100123). Data yang diunggah hanya tersimpan di browser ini.</p>
        </form>
      </section>
    </main>
  );
}
