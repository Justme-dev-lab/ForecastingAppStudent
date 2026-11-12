/* State global kecil di atas localStorage. Dibaca di komponen lewat useStore().
   Saat backend siap, isi file ini diganti panggilan API (login, uploads, forecast). */
import { useSyncExternalStore } from 'react';

const KEY = 'pn.v1';
const listeners = new Set();
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
let snapshot = read();

export const getState = () => snapshot;
export const setState = patch => {
  snapshot = { ...snapshot, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(snapshot)); } catch { /* penyimpanan penuh atau diblokir */ }
  listeners.forEach(l => l());
};
const subscribe = l => { listeners.add(l); return () => listeners.delete(l); };
export const useStore = () => useSyncExternalStore(subscribe, getState);

export const uploadsOf = s => s.uploads || [];
export const activeUploadOf = s => uploadsOf(s).find(u => u.id === s.activeId && u.status === 'ok') || null;

export const notify = (text, href) => {
  const list = getState().notifs || [];
  setState({ notifs: [{ id: Date.now() + Math.random(), text, href, time: Date.now(), read: false }, ...list].slice(0, 20) });
};

/* ---- Akun (sementara disimpan di browser; ganti dengan API saat backend siap) ---- */
const norm = e => e.trim().toLowerCase();
const hash = async (email, sandi) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${norm(email)}:${sandi}`));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
};
const accountsOf = () => getState().accounts || [];
const sessionOf = a => ({ email: a.email, school: a.school });

/* Fungsi di bawah mengembalikan string pesan error, atau '' jika berhasil. */
export const register = async ({ email, sandi, nama, kode }) => {
  if (accountsOf().some(a => a.email === norm(email))) return 'Email ini sudah terdaftar. Silakan masuk.';
  const acc = { email: norm(email), hash: await hash(email, sandi), school: { kode: kode.trim(), nama: nama.trim() } };
  setState({ accounts: [...accountsOf(), acc], session: sessionOf(acc) });
  return '';
};
export const login = async (email, sandi) => {
  const acc = accountsOf().find(a => a.email === norm(email));
  if (!acc || acc.hash !== await hash(email, sandi)) return 'Email atau kata sandi salah.';
  setState({ session: sessionOf(acc) });
  return '';
};
export const logout = () => setState({ session: null });

export const updateSchool = ({ nama, kode }) => {
  const email = getState().session?.email;
  const school = { kode: kode.trim(), nama: nama.trim() };
  setState({
    accounts: accountsOf().map(a => a.email === email ? { ...a, school } : a),
    session: { ...getState().session, school },
  });
};
export const changePassword = async (lama, baru) => {
  const email = getState().session?.email;
  const acc = accountsOf().find(a => a.email === email);
  if (!acc || acc.hash !== await hash(email, lama)) return 'Kata sandi saat ini salah.';
  const h = await hash(email, baru);
  setState({ accounts: accountsOf().map(a => a.email === email ? { ...a, hash: h } : a) });
  return '';
};
