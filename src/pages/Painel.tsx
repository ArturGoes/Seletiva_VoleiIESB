import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { foiAvaliado } from '../lib/scoring';
import { gerarSeed } from '../lib/seed';
import { CATEGORIAS_REAIS, CATEGORIA_LABEL, type Periodo } from '../types';
import { CategoriaChip, ProgressBar, Stat, useToast } from '../components/ui';

export default function Painel() {
  const atletas = useStore((s) => Object.values(s.atletas));
  const upsert = useStore((s) => s.upsertAtletas);
  const { mostrar, Toast } = useToast();
  const [carregando, setCarregando] = useState(false);

  const m = useMemo(() => {
    const total = atletas.length;
    const presentes = atletas.filter((a) => a.presente).length;
    const avaliados = atletas.filter((a) => foiAvaliado(a.avaliacao)).length;
    const porCat = Object.fromEntries(
      CATEGORIAS_REAIS.map((c) => [c, atletas.filter((a) => a.categoria === c).length])
    );
    const indef = atletas.filter((a) => a.categoria === 'indefinido').length;
    const porPeriodo: Record<Periodo | 'sem', number> = {
      manha: atletas.filter((a) => a.periodoAlocado === 'manha').length,
      tarde: atletas.filter((a) => a.periodoAlocado === 'tarde').length,
      sem: atletas.filter((a) => !a.periodoAlocado).length
    };
    const naoConsegue = atletas.filter((a) => a.periodoDisponivel === 'nao_consigo').length;
    const faltamAvaliar = presentes - atletas.filter((a) => a.presente && foiAvaliado(a.avaliacao)).length;
    return { total, presentes, avaliados, porCat, indef, porPeriodo, naoConsegue, faltamAvaliar };
  }, [atletas]);

  function carregarExemplo() {
    setCarregando(true);
    const r = upsert(gerarSeed());
    setCarregando(false);
    mostrar(`${r.adicionados} atletas de exemplo carregados`);
  }

  if (m.total === 0) {
    return (
      <div className="pt-8 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-marca-dourado/30 flex items-center justify-center text-4xl mb-4">
          🏐
        </div>
        <h1 className="text-2xl text-marca-vermelho mb-1">Bora começar!</h1>
        <p className="text-marca-texto/60 mb-6 max-w-sm mx-auto">
          Importe a planilha das inscrições para começar a fazer check-in e avaliar os atletas.
        </p>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <Link to="/importar" className="btn-primario">
            Importar planilha (CSV)
          </Link>
          <button className="btn-fantasma" onClick={carregarExemplo} disabled={carregando}>
            Carregar dados de exemplo
          </button>
        </div>
        <Toast />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl text-marca-vermelho">Painel</h1>
        <Link to="/importar" className="btn-fantasma text-sm px-3">
          Importar
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat titulo="Inscritos" valor={m.total} />
        <Stat titulo="Presentes" valor={m.presentes} cor="text-green-600" sub={`${pct(m.presentes, m.total)}%`} />
        <Stat titulo="Avaliados" valor={m.avaliados} cor="text-marca-escuro" />
      </div>

      <div className="card p-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold">Progresso da avaliação</span>
          <span className="text-marca-texto/60">
            {m.avaliados}/{m.total}
          </span>
        </div>
        <ProgressBar valor={m.avaliados} max={m.total} />
        {m.faltamAvaliar > 0 && (
          <Link
            to="/atletas?falta=1"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-marca-vermelho"
          >
            ⚠️ Faltam avaliar {m.faltamAvaliar} presentes →
          </Link>
        )}
      </div>

      <h2 className="text-sm text-marca-texto/50 mb-2">Por categoria</h2>
      <div className="card divide-y divide-marca-dourado/20 mb-4">
        {CATEGORIAS_REAIS.map((c) => (
          <Link
            key={c}
            to={`/atletas?cat=${c}`}
            className="flex items-center justify-between p-3 active:bg-marca-dourado/10"
          >
            <span className="flex items-center gap-2">
              <CategoriaChip cat={c} />
              <span className="text-sm">{CATEGORIA_LABEL[c]}</span>
            </span>
            <span className="font-titulo text-xl text-marca-vermelho">{m.porCat[c] ?? 0}</span>
          </Link>
        ))}
        {m.indef > 0 && (
          <Link to="/atletas?cat=indefinido" className="flex items-center justify-between p-3 active:bg-marca-dourado/10">
            <span className="text-sm text-marca-texto/60">A definir categoria</span>
            <span className="font-titulo text-xl text-marca-texto/50">{m.indef}</span>
          </Link>
        )}
      </div>

      <h2 className="text-sm text-marca-texto/50 mb-2">Por período</h2>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat titulo="Manhã" valor={m.porPeriodo.manha} cor="text-marca-texto" />
        <Stat titulo="Tarde" valor={m.porPeriodo.tarde} cor="text-marca-texto" />
        <Stat titulo="Sem período" valor={m.porPeriodo.sem} cor="text-marca-texto/50" />
      </div>

      {m.naoConsegue > 0 && (
        <div className="card p-3 mb-4 border-marca-vermelho/40 bg-marca-vermelho/5">
          <span className="text-sm text-marca-vermelho font-semibold">
            {m.naoConsegue} atleta(s) marcaram “não consigo neste domingo”.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/atletas" className="btn-primario">
          Lista de atletas
        </Link>
        <Link to="/ranking" className="btn-dourado">
          Ver ranking
        </Link>
        <Link to="/seletiva" className="btn-fantasma">
          Organizar seletiva
        </Link>
        <Link to="/config" className="btn-fantasma">
          Configurações
        </Link>
      </div>
      <Toast />
    </div>
  );
}

function pct(v: number, t: number) {
  return t > 0 ? Math.round((v / t) * 100) : 0;
}
