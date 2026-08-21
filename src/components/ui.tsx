import { type ReactNode, useEffect, useState } from 'react';
import { type Atleta, type Categoria, CATEGORIA_CURTA } from '../types';
import { useStore } from '../store/useStore';
import { nota10 } from '../lib/scoring';

const CORES_CAT: Record<Categoria, string> = {
  dupla_fem: 'bg-pink-100 text-pink-800',
  dupla_masc: 'bg-blue-100 text-blue-800',
  quarteto_misto: 'bg-marca-dourado/30 text-marca-escuro',
  indefinido: 'bg-gray-100 text-gray-500'
};

export function CategoriaChip({ cat }: { cat: Categoria }) {
  return <span className={`chip ${CORES_CAT[cat]}`}>{CATEGORIA_CURTA[cat]}</span>;
}

export function PresencaBadge({ presente }: { presente: boolean }) {
  return presente ? (
    <span className="chip bg-green-100 text-green-800">● Presente</span>
  ) : (
    <span className="chip bg-gray-100 text-gray-500">○ Ausente</span>
  );
}

export function NotaBadge({ atleta }: { atleta: Atleta }) {
  const config = useStore((s) => s.config);
  const n = nota10(atleta, config);
  if (n <= 0) return <span className="chip bg-gray-100 text-gray-400">—</span>;
  const cor = n >= 8 ? 'bg-green-600' : n >= 6 ? 'bg-marca-dourado text-marca-texto' : 'bg-marca-vermelho';
  return <span className={`chip ${cor} ${n >= 6 && n < 8 ? '' : 'text-white'} tabular-nums`}>{n.toFixed(1)}</span>;
}

export function Stat({ titulo, valor, sub, cor }: { titulo: string; valor: ReactNode; sub?: string; cor?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-marca-texto/50">{titulo}</div>
      <div className={`font-titulo text-3xl leading-none mt-1 ${cor || 'text-marca-vermelho'}`}>{valor}</div>
      {sub && <div className="text-xs text-marca-texto/50 mt-1">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ valor, max }: { valor: number; max: number }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div className="w-full h-3 rounded-full bg-marca-dourado/20 overflow-hidden">
      <div className="h-full bg-marca-vermelho rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Grupo de botões 0..max, alvo de toque grande. */
export function EscalaInput({
  valor,
  max,
  onChange,
  compacto
}: {
  valor: number;
  max: number;
  onChange: (v: number) => void;
  compacto?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max + 1 }, (_, i) => i).map((i) => {
        const ativo = i === valor;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            aria-label={`Nota ${i}`}
            className={`flex-1 ${compacto ? 'min-h-[40px]' : 'min-h-[48px]'} rounded-lg font-titulo text-lg
              transition active:scale-95 border
              ${
                ativo
                  ? 'bg-marca-vermelho text-white border-marca-vermelho shadow'
                  : i === 0
                    ? 'bg-white text-marca-texto/40 border-marca-dourado/40'
                    : 'bg-white text-marca-texto border-marca-dourado/40'
              }`}
          >
            {i}
          </button>
        );
      })}
    </div>
  );
}

export function Confirmar({
  aberto,
  titulo,
  mensagem,
  onConfirmar,
  onCancelar,
  textoConfirmar = 'Confirmar',
  perigo
}: {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  textoConfirmar?: string;
  perigo?: boolean;
}) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onCancelar}>
      <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl mb-1">{titulo}</h3>
        <p className="text-sm text-marca-texto/70 mb-4">{mensagem}</p>
        <div className="flex gap-2">
          <button className="btn-fantasma flex-1" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            className={`${perigo ? 'bg-marca-vermelho text-white' : 'bg-marca-vermelho text-white'} btn flex-1 hover:bg-marca-escuro`}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Cabeçalho de página com título e ação opcional. */
export function PageHeader({ titulo, acao }: { titulo: string; acao?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h1 className="text-2xl text-marca-vermelho">{titulo}</h1>
      {acao}
    </div>
  );
}

/** Toast simples auto-dismiss. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  const Toast = () =>
    msg ? (
      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 bg-marca-texto text-white px-4 py-2 rounded-full text-sm shadow-lg">
        {msg}
      </div>
    ) : null;
  return { mostrar: setMsg, Toast };
}
