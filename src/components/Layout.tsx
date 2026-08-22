import { type ReactNode, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { onSaveStatus } from '../store/storage';
import logoUrl from '../assets/iesb-logo.png';

const NAV = [
  { to: '/', label: 'Painel', icon: IconePainel, exact: true },
  { to: '/atletas', label: 'Atletas', icon: IconeAtletas },
  { to: '/seletiva', label: 'Seletiva', icon: IconeSeletiva },
  { to: '/ranking', label: 'Ranking', icon: IconeRanking },
  { to: '/exportar', label: 'Exportar', icon: IconeExportar }
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-full flex flex-col">
      <TopBar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-3 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-marca-grad text-white shadow-forte safe-top">
      <div className="h-[3px] bg-marca-dourado/90" />
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src={logoUrl}
            alt="IESB"
            className="w-9 h-9 rounded-full ring-2 ring-marca-dourado/70 bg-white/5"
          />
          <div className="leading-none">
            <div className="font-display font-bold text-lg tracking-tight">Seletiva IESB</div>
            <div className="text-[10px] tracking-[0.22em] text-marca-dourado font-semibold">
              #FIRMENAAREIA
            </div>
          </div>
        </div>
        <SaveIndicator />
      </div>
    </header>
  );
}

function SaveIndicator() {
  const [status, setStatus] = useState<'salvando' | 'salvo'>('salvo');
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const off = onSaveStatus(setStatus);
    const on = () => setOnline(true);
    const offl = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', offl);
    return () => {
      off();
      window.removeEventListener('online', on);
      window.removeEventListener('offline', offl);
    };
  }, []);
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {!online && <span className="chip bg-marca-escuro text-marca-dourado">offline</span>}
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          status === 'salvando' ? 'bg-marca-dourado animate-pulse' : 'bg-green-300'
        }`}
      />
      <span className="text-white/90">{status === 'salvando' ? 'Salvando…' : 'Salvo'}</span>
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-marca-dourado/40 safe-bottom">
      <div className="max-w-3xl mx-auto grid grid-cols-5">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[11px] font-semibold transition ${
                isActive ? 'text-marca-vermelho' : 'text-marca-texto/45'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon ativo={isActive} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

type IconProps = { ativo: boolean };
function base(ativo: boolean) {
  return { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: ativo ? 2.4 : 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
}
function IconePainel({ ativo }: IconProps) {
  return (
    <svg {...base(ativo)}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function IconeAtletas({ ativo }: IconProps) {
  return (
    <svg {...base(ativo)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 14c2.2 0 4 1.8 4 4" />
      <circle cx="17" cy="7" r="2.5" />
    </svg>
  );
}
function IconeSeletiva({ ativo }: IconProps) {
  return (
    <svg {...base(ativo)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c4 3 4 15 0 18M12 3c-4 3-4 15 0 18M3.5 9h17M3.5 15h17" />
    </svg>
  );
}
function IconeRanking({ ativo }: IconProps) {
  return (
    <svg {...base(ativo)}>
      <path d="M5 21V10M12 21V4M19 21v-7" />
    </svg>
  );
}
function IconeExportar({ ativo }: IconProps) {
  return (
    <svg {...base(ativo)}>
      <path d="M12 15V3M8 7l4-4 4 4" />
      <path d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
    </svg>
  );
}
