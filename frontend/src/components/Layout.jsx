import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { fmtDate } from '../lib/data.js';
import { USE_MOCK } from '../services/forecastService.js';
import { getState, logout, setState, useStore } from '../lib/store.js';

const NAV = [
  { h: 'Data', items: [['upload', '/upload', 'upload', 'Unggah Data'], ['riwayat', '/upload/riwayat', 'clock', 'Riwayat Unggahan']] },
  { h: 'Analisis', items: [['forecasting', '/forecasting', 'trend', 'Simulasi Forecasting']] },
  { h: 'Akun', items: [['profil', '/profil', 'school', 'Profil']] },
  { h: 'Bantuan', items: [['bantuan', '/bantuan', 'file', 'Format Data'], ['model', '/model', 'info', 'Tentang Model']] },
];

/* Kerangka halaman setelah login: sidebar, breadcrumb, notifikasi, profil.
   nav = kunci menu yang aktif, crumb = daftar breadcrumb. */
export default function Shell({ nav, crumb, children }) {
  const st = useStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pop, setPop] = useState(null); // 'bell' | 'avatar' | null
  const actionsRef = useRef(null);

  useEffect(() => { document.title = `${crumb[crumb.length - 1]} · EduCast`; }, [crumb]);
  useEffect(() => {
    const onClick = e => { if (!actionsRef.current?.contains(e.target)) setPop(null); };
    const onKey = e => { if (e.key === 'Escape') { setPop(null); setMenuOpen(false); } };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => { setMenuOpen(false); }, [nav, crumb]);

  if (!st.session) return <Navigate to="/masuk" replace />;
  const { email, school } = st.session;
  const notifs = st.notifs || [];

  const toggleBell = e => {
    e.stopPropagation();
    const open = pop !== 'bell';
    setPop(open ? 'bell' : null);
    if (open) setTimeout(() => setState({ notifs: (getState().notifs || []).map(n => ({ ...n, read: true })) }), 600);
  };

  return (
    <div className={`app${menuOpen ? ' nav-open' : ''}`}>
      <aside className="side" id="side">
        <Link className="brand" to="/"><img className="logo" src="/logo.png" alt="" width="36" height="36" />EduCast</Link>
        <div className="school-chip"><b>{school.nama}</b><span className="muted">Kode sekolah {school.kode}</span></div>
        {USE_MOCK && <div className="callout" role="note"><span>Mode mock aktif: hasil forecasting bukan dari model asli.</span></div>}
        <nav className="nav" aria-label="Menu utama">
          {NAV.map(g => (
            <div key={g.h} style={{ display: 'contents' }}>
              <div className="navh">{g.h}</div>
              {g.items.map(([k, to, icon, label]) => (
                <Link key={k} to={to} className={k === nav ? 'on' : ''} aria-current={k === nav ? 'page' : undefined}><Icon name={icon} />{label}</Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button className="iconbtn menu-btn" type="button" aria-label="Buka menu" aria-controls="side" onClick={() => setMenuOpen(o => !o)}><Icon name="menu" /></button>
            <span className="crumb">
              {crumb.map((c, i) => (
                <span key={c}>{i > 0 && ' / '}{i === crumb.length - 1 ? <strong>{c}</strong> : c}</span>
              ))}
            </span>
          </div>
          <div className="top-actions" ref={actionsRef}>
            <button className="iconbtn" type="button" aria-label="Notifikasi" aria-expanded={pop === 'bell'} onClick={toggleBell}>
              <Icon name="bell" />{notifs.some(n => !n.read) && <span className="dot" />}
            </button>
            <button className="avatar" type="button" aria-label="Profil" aria-expanded={pop === 'avatar'} onClick={e => { e.stopPropagation(); setPop(pop === 'avatar' ? null : 'avatar'); }}>
              {(email || 'A')[0].toUpperCase()}
            </button>
            {pop === 'bell' && (
              <div className="pop" role="region" aria-label="Notifikasi">
                <div className="pop-h">Notifikasi</div>
                {notifs.length === 0 && <div className="pop-empty">Belum ada notifikasi.</div>}
                {notifs.map(n => (
                  <Link key={n.id} className={`notif${n.read ? '' : ' new'}`} to={n.href || '#'} onClick={() => setPop(null)}>
                    {n.text}<small>{fmtDate(n.time)}</small>
                  </Link>
                ))}
              </div>
            )}
            {pop === 'avatar' && (
              <div className="pop" style={{ width: 260 }}>
                <div className="pop-h" style={{ fontWeight: 600, fontSize: 14, overflowWrap: 'anywhere' }}>{email}<div className="muted" style={{ fontWeight: 400, fontSize: 13 }}>{school.nama}</div></div>
                <Link className="pop-item" to="/profil" onClick={() => setPop(null)} style={{ textDecoration: 'none' }}><Icon name="school" />Profil</Link>
                <button className="pop-item" type="button" onClick={() => { logout(); navigate('/masuk'); }}><Icon name="out" />Keluar</button>
              </div>
            )}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
