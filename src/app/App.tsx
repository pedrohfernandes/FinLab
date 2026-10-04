import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TaxasProvider } from '../dados/TaxasContext';
import AvistaParceladoPagina from '../modulos/avista-parcelado/AvistaParceladoPagina';
import PoupancaCdbPagina from '../modulos/poupanca-cdb/PoupancaCdbPagina';
import SacPricePagina from '../modulos/sac-price/SacPricePagina';
import Inicio from '../paginas/Inicio';
import Sobre from '../paginas/Sobre';
import Layout from './Layout';

/**
 * HashRouter: as rotas ficam depois do "#" (ex.: /#/sac-price). Isso permite recarregar
 * qualquer página no GitHub Pages ou abrindo o build localmente, sem configurar servidor.
 */
export default function App() {
  return (
    <TaxasProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="poupanca-cdb" element={<PoupancaCdbPagina />} />
            <Route path="avista-parcelado" element={<AvistaParceladoPagina />} />
            <Route path="sac-price" element={<SacPricePagina />} />
            <Route path="sobre" element={<Sobre />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </TaxasProvider>
  );
}
