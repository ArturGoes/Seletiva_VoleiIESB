import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { foiAvaliado, notaFinalAtleta } from '../lib/scoring';
import {
  type Atleta,
  type Categoria,
  CATEGORIAS_REAIS,
  CATEGORIA_LABEL,
  PERIODO_LABEL
} from '../types';
import { Avatar, CategoriaChip, NotaBadge, PresencaBadge } from '../components/ui';

type Ordenacao = 'nome' | 'nota' | 'chegada';

export default function Atletas() {
  const [params, setParams] = useSearchParams();
  const atletas = useStore((s) => Object.values(s.atletas));
  const config = useStore((s) => s.config);
  const toggleCheckin = useStore((s) => s.toggleCheckin);

  const [busca, setBusca] = useState('');
  const cat = (params.get('cat') || 'todas') as Categoria | 'todas';
  const periodo = params.get('periodo') || 'todos';
  const presenca = params.get('presenca') || 'todos';
  const soFalta = params.get('falta') === '1';
  const nivel = params.get('nivel') || 'todos';
  const [ordem, setOrdem] = useState<Ordenacao>('nome');

  function setParam(k: string, v: string) {
    const p = new URLSearchParams(params);
    if (v === '' || v === 'todas' || v === 'todos' || v === '0') p.delete(k);
    else p.set(k, v);
    setParams(p, { replace: true });
  }

  const lista = useMemo(() => {
    let r = atletas.slice();
    const q = busca
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
    if (q) r = r.filter((a) => a.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q));
    if (cat !== 'todas') r = r.filter((a) => a.categoria === cat);
    if (periodo !== 'todos') r = r.filter((a) => a.periodoAlocado === periodo);
    if (presenca === 'presentes') r = r.filter((a) => a.presente);
    if (presenca === 'ausentes') r = r.filter((a) => !a.presente);
    if (nivel !== 'todos') r = r.filter((a) => a.nivelExperiencia === nivel);
    if (soFalta) r = r.filter((a) => a.presente && !foiAvaliado(a.avaliacao));

    r.sort((a, b) => {
      if (ordem === 'nota') return notaFinalAtleta(b, config) - notaFinalAtleta(a, config);
      if (ordem === 'chegada') return (a.ordemChegada ?? 1e9) - (b.ordemChegada ?? 1e9);
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
    return r;
  }, [atletas, busca, cat, periodo, presenca, nivel, soFalta, ordem, config]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl text-marca-vermelho">Atletas</h1>
        <Link to="/importar" className="btn-fantasma text-sm px-3">
          + Adicionar
        </Link>
      </div>

      <input
        className="campo mb-3"
        placeholder="Buscar por nome…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        inputMode="search"
      />

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-1 no-scrollbar">
        <Select valor={cat} onChange={(v) => setParam('cat', v)} opcoes={[['todas', 'Todas categorias'], ...CATEGORIAS_REAIS.map((c) => [c, CATEGORIA_LABEL[c]] as [string, string]), ['indefinido', 'A definir']]} />
        <Select valor={periodo} onChange={(v) => setParam('periodo', v)} opcoes={[['todos', 'Todo período'], ['manha', 'Manhã'], ['tarde', 'Tarde']]} />
        <Select valor={presenca} onChange={(v) => setParam('presenca', v)} opcoes={[['todos', 'Presença'], ['presentes', 'Presentes'], ['ausentes', 'Ausentes']]} />
        <Select valor={nivel} onChange={(v) => setParam('nivel', v)} opcoes={[['todos', 'Nível'], ['Iniciante', 'Iniciante'], ['Intermediário', 'Intermediário'], ['Avançado', 'Avançado'], ['Competitivo', 'Competitivo']]} />
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <label className="flex items-center gap-2 text-marca-texto/70">
          <input type="checkbox" checked={soFalta} onChange={(e) => setParam('falta', e.target.checked ? '1' : '0')} className="w-4 h-4 accent-marca-vermelho" />
          Faltam avaliar
        </label>
        <div className="flex items-center gap-1">
          <span className="text-marca-texto/50">Ordenar:</span>
          <select className="bg-transparent font-semibold text-marca-vermelho" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordenacao)}>
            <option value="nome">Nome</option>
            <option value="nota">Nota</option>
            <option value="chegada">Chegada</option>
          </select>
        </div>
      </div>

      <div className="text-xs text-marca-texto/50 mb-2">{lista.length} atleta(s)</div>

      <div className="flex flex-col gap-2">
        {lista.map((a) => (
          <LinhaAtleta key={a.id} atleta={a} onCheckin={() => toggleCheckin(a.id)} />
        ))}
        {lista.length === 0 && (
          <div className="card p-6 text-center text-marca-texto/50">Nenhum atleta com esses filtros.</div>
        )}
      </div>
    </div>
  );
}

function LinhaAtleta({ atleta, onCheckin }: { atleta: Atleta; onCheckin: () => void }) {
  return (
    <div className="card p-3 flex items-center gap-3">
      <button
        onClick={onCheckin}
        aria-label={atleta.presente ? 'Desfazer check-in' : 'Fazer check-in'}
        className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold transition active:scale-95 ${
          atleta.presente ? 'bg-green-600 text-white' : 'bg-marca-dourado/25 text-marca-escuro border border-marca-dourado/50'
        }`}
      >
        {atleta.presente ? '✓' : '＋'}
      </button>
      <Link to={`/atletas/${atleta.id}`} className="flex-1 min-w-0 flex items-center gap-3">
        <Avatar atleta={atleta} size={40} />
        <div className="min-w-0">
        <div className="font-semibold truncate flex items-center gap-1.5">
          {atleta.avaliacao.destaque && <span>⭐</span>}
          {atleta.numeroColete && (
            <span className="chip bg-marca-texto text-white text-[10px]">#{atleta.numeroColete}</span>
          )}
          <span className="truncate">{atleta.nome}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <CategoriaChip cat={atleta.categoria} />
          {atleta.periodoAlocado && (
            <span className="chip bg-gray-100 text-gray-600">{PERIODO_LABEL[atleta.periodoAlocado]}</span>
          )}
          <PresencaBadge presente={atleta.presente} />
        </div>
        </div>
      </Link>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <NotaBadge atleta={atleta} />
        <Link to={`/avaliar/${atleta.id}`} className="text-xs font-semibold text-marca-vermelho">
          Avaliar
        </Link>
      </div>
    </div>
  );
}

function Select({
  valor,
  onChange,
  opcoes
}: {
  valor: string;
  onChange: (v: string) => void;
  opcoes: [string, string][];
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="shrink-0 rounded-full border border-marca-dourado/50 bg-white px-3 py-1.5 text-sm font-semibold text-marca-texto"
    >
      {opcoes.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}
