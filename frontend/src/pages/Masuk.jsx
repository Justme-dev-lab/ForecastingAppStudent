import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthHero from '../components/AuthHero.jsx';
import { login, useStore } from '../lib/store.js';

export default function Masuk() {
  const { session } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [err, setErr] = useState({ email: '', sandi: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.title = 'Masuk · EduCast'; }, []);
  if (session) return <Navigate to="/upload" replace />;

  const submit = async e => {
    e.preventDefault();
    const em = email.trim();
    const eMsg = !em ? 'Email wajib diisi.' : !/^\S+@\S+\.\S+$/.test(em) ? 'Format email belum benar.' : '';
    const pMsg = !sandi ? 'Kata sandi wajib diisi.' : '';
    setErr({ email: eMsg, sandi: pMsg });
    if (eMsg || pMsg) return;
    setBusy(true);
    const msg = await login(em, sandi);
    setBusy(false);
    if (msg) setErr({ email: '', sandi: msg });
    else navigate('/upload');
  };

  return (
    <main className="auth">
      <AuthHero />
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
          <button className="btn lg" type="submit" disabled={busy}>Masuk</button>
          <p className="muted" style={{ fontSize: 14 }}>Belum punya akun? <Link to="/daftar">Daftar</Link></p>
          <p className="muted" style={{ fontSize: 13 }}>Versi demo: akun dan data unggahan hanya tersimpan di browser ini.</p>
        </form>
      </section>
    </main>
  );
}
