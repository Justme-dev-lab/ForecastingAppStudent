import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import Masuk from './pages/Masuk.jsx';
import Upload from './pages/Upload.jsx';
import Ringkasan from './pages/Ringkasan.jsx';
import Riwayat from './pages/Riwayat.jsx';
import Forecasting from './pages/Forecasting.jsx';
import Hasil from './pages/Hasil.jsx';
import PredictPage from './pages/PredictPage.jsx';
import Model from './pages/Model.jsx';
import Bantuan from './pages/Bantuan.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/masuk" element={<Masuk />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/upload/ringkasan" element={<Ringkasan />} />
      <Route path="/upload/riwayat" element={<Riwayat />} />
      <Route path="/forecasting" element={<Forecasting />} />
      <Route path="/forecasting/hasil" element={<Hasil />} />
      <Route path="/prediksi" element={<PredictPage />} />
      <Route path="/model" element={<Model />} />
      <Route path="/bantuan" element={<Bantuan />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
