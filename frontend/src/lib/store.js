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
export const login = (email) => setState({ session: { email, school: { kode: '20100123', nama: 'SMA Negeri 1 Contoh' } } });
export const logout = () => setState({ session: null });
