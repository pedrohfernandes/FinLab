/**
 * Estrutura comum a todas as páginas: topo com navegação e faixa de taxas, conteúdo da rota e rodapé.
 */
import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FaixaTaxas } from '../componentes/StatusDados';
import { MODULOS } from './modulos';

/** Rola para o topo a cada troca de página. */
function RolarParaOTopo() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function Layout() {
  return (
    <>
      <RolarParaOTopo />
      <header className="fl-topo">
        <div className="fl-topo-interno">
          <Link to="/" className="fl-marca" aria-label="FinLab — página inicial">
            <span className="fl-marca-icone" aria-hidden="true">
              <svg viewBox="0 0 64 64" width="22" height="22">
                <path d="M14 46 L26 32 L36 38 L50 18" fill="none" stroke="#75e0b6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            FinLab
          </Link>
          <nav aria-label="Módulos" className="fl-nav-modulos">
            {MODULOS.map((m) => (
              <NavLink key={m.caminho} to={m.caminho}>
                <span className="fl-nav-numero">{m.numero}</span> {m.titulo}
              </NavLink>
            ))}
          </nav>
          <NavLink to="/sobre" className="fl-nav-sobre" aria-label="Sobre o projeto">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 11v6M12 7.5v.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Sobre
          </NavLink>
        </div>
        {/* Taxas do dia e origem dos dados ficam no topo de todas as páginas. */}
        <FaixaTaxas />
      </header>

      <main className="fl-principal">
        <Outlet />
      </main>

      <footer className="fl-rodape">
        <strong>FinLab</strong>
        <p>
          Projeto educacional de Administração Financeira (CAD 167 · UFMG). Os resultados são simulações matemáticas, não recomendação de
          investimento.
        </p>
        <p>Feito por Mariana Sampaio e Pedro Fernandes</p>
      </footer>
    </>
  );
}
