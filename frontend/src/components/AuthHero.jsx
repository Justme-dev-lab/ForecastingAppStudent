export default function AuthHero() {
  return (
    <section className="auth-hero">
      <div className="brand" style={{ color: '#fff', fontSize: 20 }}><img className="logo" src="/logo.png" alt="" width="40" height="40" />EduCast</div>
      <div className="stack" style={{ gap: 20, maxWidth: 480 }}>
        <h1>Perkirakan literasi dan numerasi sekolah Anda untuk tahun berikutnya.</h1>
        <p>Unggah data Rapor Pendidikan SMA milik sekolah Anda, biarkan sistem memeriksanya, lalu lihat hasil forecasting sekolah Anda.</p>
      </div>
      <ol>
        <li><span aria-hidden="true">1</span>Unggah data rapor</li>
        <li><span aria-hidden="true">2</span>Periksa ringkasan data</li>
        <li><span aria-hidden="true">3</span>Jalankan forecasting</li>
      </ol>
    </section>
  );
}
