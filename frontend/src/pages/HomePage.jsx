import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';

const CARDS = [
  ['upload', 'Unggah Data', 'Unggah CSV rapor sekolah dan periksa isinya.', '/upload'],
  ['trend', 'Simulasi Forecasting', 'Forecasting literasi dan numerasi tahun berikutnya dari data yang sudah diunggah.', '/forecasting'],
];

export default function HomePage() {
  return (
    <Layout nav="beranda" crumb={['Beranda']}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>Beranda</h1>
        <p className="lead">Unggah data rapor sekolah, lalu forecasting literasi (LIT) dan numerasi (NUM) tahun berikutnya.</p>
      </div>
      <div className="row equal">
        {CARDS.map(([icon, title, text, to]) => (
          <section key={to} className="card stack grow1" style={{ gap: 12 }}>
            <span style={{ color: 'var(--primary)' }}><Icon name={icon} size={28} /></span>
            <div className="card-t">{title}</div>
            <p className="muted" style={{ fontSize: 14 }}>{text}</p>
            <Link className="btn sec" to={to}>Buka</Link>
          </section>
        ))}
      </div>
    </Layout>
  );
}
