import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  type Atleta,
  type Categoria,
  CATEGORIAS_REAIS,
  CATEGORIA_LABEL,
  FISICO_LABELS,
  TATICO_LABELS,
  TECNICO_LABELS,
  RECOMENDACAO_LABEL
} from '../types';
import { mediaFisico, mediaTatico, mediaTecnico, notaFinalAtleta } from '../lib/scoring';
import { NotaBadge } from '../components/ui';

export default function Ranking() {
  const [cat, setCat] = useState<Exclude<Categoria, 'indefinido'>>('dupla_fem');
  const [comparar, setComparar] = useState<string[]>([]);
  const atletas = useStore((s) => Object.values(s.atletas));
  const config = useStore((s) => s.config);
  const setAvaliacao = useStore((s) => s.setAvaliacao);

  const vagas = config.vagas[cat];
  const ranking = useMemo(
    () =>
      atletas
        .filter((a) => a.categoria === cat)
        .sort((a, b) => notaFinalAtleta(b, config) - notaFinalAtleta(a, config)),
    [atletas, cat, config]
  );

  function toggleComparar(id: string) {
    setComparar((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]));
  }

  const comparados = comparar.map((id) => atletas.find((a) => a.id === id)).filter(Boolean) as Atleta[];

  return (
    <div>
      <h1 className="text-2xl text-marca-vermelho mb-3">Ranking</h1>

      <div className="flex gap-1 overflow-x-auto no-scrollbar mb-4">
        {CATEGORIAS_REAIS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCat(c);
              setComparar([]);
            }}
            className={`shrink-0 btn min-h-[40px] px-3 text-sm ${
              cat === c ? 'bg-marca-vermelho text-white' : 'bg-white border border-marca-dourado/40'
            }`}
          >
            {CATEGORIA_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-marca-texto/60">
          {vagas.titulares} titulares · {vagas.reservas} reservas
        </span>
        <Link to="/config" className="text-marca-vermelho font-semibold">
          Ajustar vagas
        </Link>
      </div>

      {ranking.length === 0 ? (
        <div className="card p-6 text-center text-marca-texto/50 text-sm">
          Nenhum atleta em {CATEGORIA_LABEL[cat]}. Defina a categoria dos atletas na ficha.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {ranking.map((a, i) => {
            const zona = i < vagas.titulares ? 'titular' : i < vagas.titulares + vagas.reservas ? 'reserva' : 'fora';
            return (
              <div
                key={a.id}
                className={`card p-3 flex items-center gap-3 ${
                  zona === 'titular' ? 'border-green-500 border-2' : zona === 'reserva' ? 'border-marca-dourado border-2' : ''
                }`}
              >
                <div
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-titulo text-lg ${
                    zona === 'titular' ? 'bg-green-600 text-white' : zona === 'reserva' ? 'bg-marca-dourado text-marca-texto' : 'bg-gray-100 text-marca-texto/50'
                  }`}
                >
                  {i + 1}
                </div>
                <Link to={`/atletas/${a.id}`} className="flex-1 min-w-0">
                  <div className="font-semibold truncate flex items-center gap-1">
                    {a.avaliacao.destaque && '⭐'} {a.nome}
                  </div>
                  <div className="text-xs text-marca-texto/50">
                    {zona === 'titular' ? 'Titular' : zona === 'reserva' ? 'Reserva' : 'Fora das vagas'}
                    {a.avaliacao.recomendacao !== 'indefinido' && ` · marcado: ${RECOMENDACAO_LABEL[a.avaliacao.recomendacao]}`}
                  </div>
                </Link>
                <NotaBadge atleta={a} />
                <button
                  onClick={() => toggleComparar(a.id)}
                  className={`shrink-0 w-8 h-8 rounded-lg border text-sm ${
                    comparar.includes(a.id) ? 'bg-marca-vermelho text-white border-marca-vermelho' : 'border-marca-dourado/40'
                  }`}
                  title="Comparar"
                >
                  ⇄
                </button>
              </div>
            );
          })}
        </div>
      )}

      {ranking.length > 0 && (
        <button
          className="btn-dourado w-full mt-4"
          onClick={() => {
            ranking.forEach((a, i) => {
              const rec = i < vagas.titulares ? 'titular' : i < vagas.titulares + vagas.reservas ? 'reserva' : 'cortado';
              setAvaliacao(a.id, { recomendacao: rec });
            });
          }}
        >
          Aplicar seleção pelas vagas (titular/reserva/cortado)
        </button>
      )}

      {comparados.length >= 2 && (
        <Comparacao atletas={comparados} onFechar={() => setComparar([])} />
      )}
    </div>
  );
}

function Comparacao({ atletas, onFechar }: { atletas: Atleta[]; onFechar: () => void }) {
  const config = useStore((s) => s.config);
  const linhas: [string, (a: Atleta) => number][] = [
    ['Técnico', (a) => mediaTecnico(a.avaliacao)],
    ...Object.entries(TECNICO_LABELS).map(
      ([k, l]) => [`  ${l}`, (a: Atleta) => a.avaliacao.tecnico[k as keyof typeof a.avaliacao.tecnico]] as [string, (a: Atleta) => number]
    ),
    ['Físico', (a) => mediaFisico(a.avaliacao)],
    ...Object.entries(FISICO_LABELS).map(
      ([k, l]) => [`  ${l}`, (a: Atleta) => a.avaliacao.fisico[k as keyof typeof a.avaliacao.fisico]] as [string, (a: Atleta) => number]
    ),
    ['Tático', (a) => mediaTatico(a.avaliacao)],
    ...Object.entries(TATICO_LABELS).map(
      ([k, l]) => [`  ${l}`, (a: Atleta) => a.avaliacao.tatico[k as keyof typeof a.avaliacao.tatico]] as [string, (a: Atleta) => number]
    ),
    ['NOTA FINAL', (a) => notaFinalAtleta(a, config)]
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={onFechar}>
      <div className="card w-full max-w-lg max-h-[85vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg text-marca-vermelho">Comparar</h2>
          <button onClick={onFechar} className="text-2xl px-2">×</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left"></th>
              {atletas.map((a) => (
                <th key={a.id} className="text-center font-titulo text-marca-texto px-1 pb-2 text-xs">
                  {a.nome.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map(([label, fn], idx) => {
              const destaque = !label.startsWith('  ');
              const vals = atletas.map(fn);
              const max = Math.max(...vals);
              return (
                <tr key={idx} className={destaque ? 'font-semibold border-t border-marca-dourado/30' : 'text-marca-texto/70'}>
                  <td className={`py-1 ${destaque ? '' : 'pl-2 text-xs'}`}>{label.trim()}</td>
                  {vals.map((v, j) => (
                    <td key={j} className={`text-center tabular-nums py-1 ${v === max && max > 0 ? 'text-marca-vermelho font-bold' : ''}`}>
                      {v % 1 === 0 ? v : v.toFixed(2)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
