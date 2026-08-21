import { useStore } from '../store/useStore';
import { type Atleta, type StatusFase, STATUS_FASE_LABEL } from '../types';

const OPCOES: { v: StatusFase; icone: string; cor: string }[] = [
  { v: 'concluido', icone: '✓', cor: 'bg-green-600 text-white border-green-600' },
  { v: 'destaque', icone: '⭐', cor: 'bg-marca-dourado text-marca-texto border-marca-dourado' },
  { v: 'nao', icone: '✕', cor: 'bg-marca-vermelho text-white border-marca-vermelho' }
];

/** Timeline editável das fases da seletiva para um atleta. */
export function FasesAtleta({ atleta }: { atleta: Atleta }) {
  const fases = useStore((s) => s.config.fases);
  const setFase = useStore((s) => s.setFase);

  return (
    <div className="flex flex-col gap-3">
      {fases.map((f, i) => {
        const fa = atleta.fases?.[f.id] || { status: 'pendente' as StatusFase, obs: '' };
        const concluida = fa.status !== 'pendente';
        return (
          <div key={f.id} className="relative pl-7">
            {/* linha da timeline */}
            {i < fases.length - 1 && <span className="absolute left-[9px] top-6 bottom-[-12px] w-0.5 bg-marca-dourado/30" />}
            <span
              className={`absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full border-2 ${
                concluida ? 'bg-marca-vermelho border-marca-vermelho' : 'bg-white border-marca-dourado/60'
              }`}
            />
            <div className="font-semibold text-[15px] leading-tight">{f.nome}</div>
            {f.descricao && <div className="text-xs text-marca-texto/50 mb-2">{f.descricao}</div>}
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {OPCOES.map((o) => (
                <button
                  key={o.v}
                  onClick={() => setFase(atleta.id, f.id, { status: fa.status === o.v ? 'pendente' : o.v })}
                  className={`chip border transition min-h-[32px] px-3 ${
                    fa.status === o.v ? o.cor : 'bg-white text-marca-texto/60 border-black/10'
                  }`}
                >
                  {o.icone} {STATUS_FASE_LABEL[o.v]}
                </button>
              ))}
            </div>
            <input
              className="campo py-2 text-sm"
              placeholder="Anotação da fase…"
              value={fa.obs}
              onChange={(e) => setFase(atleta.id, f.id, { obs: e.target.value })}
            />
          </div>
        );
      })}
    </div>
  );
}
