import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  type Recomendacao,
  FISICO_LABELS,
  TATICO_LABELS,
  TECNICO_LABELS
} from '../types';
import { EscalaInput, NotaBadge } from '../components/ui';
import { foiAvaliado, mediaFisico, mediaTatico, mediaTecnico, notaFinalAtleta } from '../lib/scoring';

const RECS: { v: Recomendacao; label: string; cor: string }[] = [
  { v: 'titular', label: 'Titular', cor: 'bg-green-600 text-white' },
  { v: 'reserva', label: 'Reserva', cor: 'bg-marca-dourado text-marca-texto' },
  { v: 'cortado', label: 'Cortado', cor: 'bg-marca-vermelho text-white' }
];

export default function Avaliacao() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const atleta = useStore((s) => s.atletas[id]);
  const config = useStore((s) => s.config);
  const setCriterio = useStore((s) => s.setCriterio);
  const setAvaliacao = useStore((s) => s.setAvaliacao);
  const atletas = useStore((s) => Object.values(s.atletas));

  // Fila do "modo rápido": presentes por ordem de chegada (ou todos, se ninguém marcado presente).
  const fila = useMemo(() => {
    const presentes = atletas.filter((a) => a.presente);
    const base = presentes.length > 0 ? presentes : atletas;
    return base.slice().sort((a, b) => (a.ordemChegada ?? 1e9) - (b.ordemChegada ?? 1e9) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [atletas]);

  if (!atleta) {
    return (
      <div className="pt-10 text-center text-marca-texto/60">
        Atleta não encontrado.
        <div className="mt-4">
          <Link to="/atletas" className="btn-fantasma">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const idx = fila.findIndex((a) => a.id === atleta.id);
  const anterior = idx > 0 ? fila[idx - 1] : null;
  const proximo = idx >= 0 && idx < fila.length - 1 ? fila[idx + 1] : null;
  const proximoFalta = fila.find((a) => a.id !== atleta.id && !foiAvaliado(a.avaliacao));

  const av = atleta.avaliacao;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => nav(-1)} className="text-sm text-marca-vermelho font-semibold">
          ← Voltar
        </button>
        {idx >= 0 && (
          <span className="text-xs text-marca-texto/50">
            {idx + 1} de {fila.length}
          </span>
        )}
      </div>

      <Link to={`/atletas/${atleta.id}`} className="card p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-marca-texto/50">Avaliando</div>
          <h1 className="text-2xl text-marca-texto leading-tight">{atleta.nome}</h1>
          <div className="text-sm text-marca-texto/60">{atleta.funcaoPreferida || 'Função não informada'}</div>
        </div>
        <div className="text-center">
          <NotaBadge atleta={atleta} />
          <div className="text-[10px] text-marca-texto/50 mt-1">nota 0-10</div>
        </div>
      </Link>

      <BlocoDim
        titulo="Técnico"
        media={mediaTecnico(av)}
        max={config.escalaMax}
        labels={TECNICO_LABELS}
        valores={av.tecnico as unknown as Record<string, number>}
        onChange={(k, v) => setCriterio(atleta.id, 'tecnico', k, v)}
        peso={config.pesos.tecnico}
      />
      <BlocoDim
        titulo="Físico"
        media={mediaFisico(av)}
        max={config.escalaMax}
        labels={FISICO_LABELS}
        valores={av.fisico as unknown as Record<string, number>}
        onChange={(k, v) => setCriterio(atleta.id, 'fisico', k, v)}
        peso={config.pesos.fisico}
      />
      <BlocoDim
        titulo="Tático"
        media={mediaTatico(av)}
        max={config.escalaMax}
        labels={TATICO_LABELS}
        valores={av.tatico as unknown as Record<string, number>}
        onChange={(k, v) => setCriterio(atleta.id, 'tatico', k, v)}
        peso={config.pesos.tatico}
      />

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-titulo text-lg">Nota final</span>
          <span className="font-titulo text-3xl text-marca-vermelho tabular-nums">
            {notaFinalAtleta(atleta, config).toFixed(2)}
            <span className="text-sm text-marca-texto/40"> / {config.escalaMax}</span>
          </span>
        </div>

        <label className="rotulo">Recomendação</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {RECS.map((r) => (
            <button
              key={r.v}
              onClick={() => setAvaliacao(atleta.id, { recomendacao: av.recomendacao === r.v ? 'indefinido' : r.v })}
              className={`btn min-h-[44px] ${av.recomendacao === r.v ? r.cor : 'bg-white border border-marca-dourado/40 text-marca-texto'}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setAvaliacao(atleta.id, { destaque: !av.destaque })}
          className={`btn w-full min-h-[44px] mb-4 ${av.destaque ? 'bg-marca-dourado text-marca-texto' : 'bg-white border border-marca-dourado/40'}`}
        >
          {av.destaque ? '⭐ Destaque marcado' : '☆ Marcar destaque'}
        </button>

        <label className="rotulo">Avaliador</label>
        <input
          className="campo mb-3"
          placeholder="Seu nome (opcional)"
          value={av.avaliador}
          onChange={(e) => setAvaliacao(atleta.id, { avaliador: e.target.value })}
        />
        <label className="rotulo">Observações</label>
        <textarea
          className="campo min-h-[80px]"
          placeholder="Anotações sobre o atleta…"
          value={av.observacoesAvaliacao}
          onChange={(e) => setAvaliacao(atleta.id, { observacoesAvaliacao: e.target.value })}
        />
      </div>

      {/* Modo rápido */}
      <div className="flex gap-2 mb-2">
        <button
          disabled={!anterior}
          onClick={() => anterior && nav(`/avaliar/${anterior.id}`)}
          className="btn-fantasma flex-1 disabled:opacity-40"
        >
          ← Anterior
        </button>
        <button
          disabled={!proximo}
          onClick={() => proximo && nav(`/avaliar/${proximo.id}`)}
          className="btn-primario flex-1 disabled:opacity-40"
        >
          Próximo →
        </button>
      </div>
      {proximoFalta && (
        <button onClick={() => nav(`/avaliar/${proximoFalta.id}`)} className="btn-dourado w-full">
          Pular p/ próximo que falta avaliar →
        </button>
      )}
    </div>
  );
}

function BlocoDim({
  titulo,
  media,
  max,
  labels,
  valores,
  onChange,
  peso
}: {
  titulo: string;
  media: number;
  max: number;
  labels: Record<string, string>;
  valores: Record<string, number>;
  onChange: (k: string, v: number) => void;
  peso: number;
}) {
  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-titulo text-lg text-marca-vermelho">
          {titulo} <span className="text-xs text-marca-texto/40 font-corpo normal-case">peso {Math.round(peso * 100)}%</span>
        </h2>
        <span className="chip bg-marca-dourado/25 text-marca-escuro tabular-nums">média {media.toFixed(1)}</span>
      </div>
      <div className="flex flex-col gap-3">
        {Object.entries(labels).map(([k, label]) => (
          <div key={k}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">{label}</span>
              <span className="text-marca-texto/40 tabular-nums">{valores[k]}</span>
            </div>
            <EscalaInput valor={valores[k]} max={max} onChange={(v) => onChange(k, v)} compacto />
          </div>
        ))}
      </div>
    </div>
  );
}
