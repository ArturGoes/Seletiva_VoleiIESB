import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Painel from './pages/Painel';
import Atletas from './pages/Atletas';
import FichaAtleta from './pages/FichaAtleta';
import Avaliacao from './pages/Avaliacao';
import Seletiva from './pages/Seletiva';
import Ranking from './pages/Ranking';
import Exportar from './pages/Exportar';
import Configuracoes from './pages/Configuracoes';
import Importar from './pages/Importar';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Painel />} />
        <Route path="/atletas" element={<Atletas />} />
        <Route path="/atletas/:id" element={<FichaAtleta />} />
        <Route path="/avaliar/:id" element={<Avaliacao />} />
        <Route path="/seletiva" element={<Seletiva />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/exportar" element={<Exportar />} />
        <Route path="/config" element={<Configuracoes />} />
        <Route path="/importar" element={<Importar />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
