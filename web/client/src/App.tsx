import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import SintesePage from './pages/SintesePage';
import EmentaPage from './pages/EmentaPage';
import RevisaoPage from './pages/RevisaoPage';
import HistoricoPage from './pages/HistoricoPage';
import ConfigPage from './pages/ConfigPage';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sintese" element={<SintesePage />} />
        <Route path="/ementa" element={<EmentaPage />} />
        <Route path="/revisao" element={<RevisaoPage />} />
        <Route path="/historico" element={<HistoricoPage />} />
        <Route path="/config" element={<ConfigPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
