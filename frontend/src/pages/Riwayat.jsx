import { Link } from 'react-router-dom';
import Shell from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { fmtDate, fmtInt, fmtSize } from '../lib/data.js';
import { getState, notify, setState, uploadsOf, useStore } from '../lib/store.js';

const CRUMB = ['Data', 'Riwayat Unggahan'];
const plain = html => html.replace(/<[^>]+>/g, '');

export default function Riwayat() {
  const st = useStore();
  const ups = uploadsOf(st);

  const activate = u => {
    setState({ activeId: u.id, forecast: null });
    notify(`${u.name} dijadikan data aktif.`, '/forecasting');
  };
  const remove = u => {
    if (!window.confirm(`Hapus "${u.name}" dari riwayat? Tindakan ini tidak bisa dibatalkan.`)) return;
    const s = getState();
    const wasActive = s.activeId === u.id;
    setState({ uploads: uploadsOf(s).filter(x => x.id !== u.id), activeId: wasActive ? null : s.activeId, forecast: wasActive ? null : s.forecast });
  };

  return (
    <Shell nav="riwayat" crumb={CRUMB}>
      <div className="page-h">
        <div><h1>Riwayat Unggahan</h1><p className="lead">File yang pernah Anda unggah untuk sekolah ini. Pilih satu sebagai data aktif untuk forecasting.</p></div>
        <Link className="btn" to="/upload">Unggah file baru</Link>
      </div>

      {ups.length === 0 ? (
        <div className="card empty">
          <Icon name="clock" />
          <div className="card-t" style={{ fontSize: 18 }}>Belum ada unggahan</div>
          <p className="muted">Unggahan pertama Anda akan muncul di sini.</p>
          <Link className="btn" to="/upload">Unggah data rapor</Link>
        </div>
      ) : (
        <div className="card" style={{ padding: '8px 0 0' }}>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th scope="col" style={{ paddingLeft: 24 }}>Nama file</th><th scope="col">Waktu</th><th scope="col">Tahun</th><th scope="col">Status</th>
                  <th scope="col" style={{ paddingRight: 24 }}><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {ups.map(u => {
                  const ok = u.status === 'ok', isActive = ok && u.id === st.activeId;
                  return (
                    <tr key={u.id}>
                      <td style={{ paddingLeft: 24 }}>
                        <b style={{ overflowWrap: 'anywhere' }}>{u.name}</b>
                        <div className="muted" style={{ fontSize: 12 }}>{fmtSize(u.size)}{ok ? ` · ${fmtInt(u.rows)} baris` : ''}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(u.time)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{ok ? (u.years[0] === u.years[u.years.length - 1] ? u.years[0] : `${u.years[0]}–${u.years[u.years.length - 1]}`) : '–'}</td>
                      <td>{isActive ? <span className="pill act">Aktif</span> : ok ? <span className="pill ok">Lolos</span> : <span className="pill bad">Ditolak</span>}</td>
                      <td style={{ paddingRight: 24, textAlign: 'right' }}>
                        <div className="actions" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          {ok && !isActive && <button className="btn sm" type="button" onClick={() => activate(u)}>Jadikan aktif</button>}
                          {ok
                            ? <Link className="btn sec sm" to={`/upload/ringkasan?id=${u.id}`}>Ringkasan</Link>
                            : <span className="muted" style={{ fontSize: 13, alignSelf: 'center' }} title={plain(u.message)}>Alasan penolakan: arahkan kursor</span>}
                          <button className="btn danger sm" type="button" onClick={() => remove(u)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  );
}
