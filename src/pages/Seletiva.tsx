import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  type EstacaoCronograma,
  type Periodo,
  PERIODO_LABEL,
  PERIODO_DISP_LABEL
} from '../types';
import { Avatar, CategoriaChip, NotaBadge, PresencaBadge } from '../components/ui';
import { notaFinalAtleta } from '../lib/scoring';

const BLOCOS: Record<EstacaoCronograma['bloco'], { label: string; cor: string }> = {
  aquecimento: { label: 'Aquecimento', cor: 'bg-orange-100 text-orange-800' },
  tecnico: { label: 'Técnico', cor: 'bg-blue-100 text-blue-800' },
  fisico: { label: 'Físico', cor: 'bg-green-100 text-green-800' },
  tatico: { label: 'Tático', cor: 'bg-purple-100 text-purple-800' },
  jogo: { label: 'Jogo', cor: 'bg-marca-vermelho/15 text-marca-vermelho' }
};

export default function Seletiva() {
  const [aba, setAba] = useState<'chamada' | 'fases' | 'cronograma' | 'duplas' | 'timer'>('chamada');
  const LABEL: Record<typeof aba, string> = {
    chamada: 'Chamada',
    fases: 'Fases',
    cronograma: 'Cronograma',
    duplas: 'Duplas',
    timer: 'Cronômetro'
  };
  return (
    <div>
      <h1 className="text-2xl text-marca-vermelho mb-3">Seletiva</h1>
      <div className="flex gap-1 bg-marca-dourado/15 rounded-xl p-1 mb-4 overflow-x-auto no-scrollbar">
        {(['chamada', 'fases', 'cronograma', 'duplas', 'timer'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`flex-1 shrink-0 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              aba === a ? 'bg-white shadow text-marca-vermelho' : 'text-marca-texto/60'
            }`}
          >
            {LABEL[a]}
          </button>
        ))}
      </div>
      {aba === 'chamada' && <Chamada />}
      {aba === 'fases' && <FasesPainel />}
      {aba === 'cronograma' && <Cronograma />}
      {aba === 'duplas' && <Formacao />}
      {aba === 'timer' && <Cronometro />}
    </div>
  );
}

/* ---------------- Painel de fases (rodar o dia) ---------------- */
function FasesPainel() {
  const fases = useStore((s) => s.config.fases);
  const atletas = useStore((s) => Object.values(s.atletas));
  const setFase = useStore((s) => s.setFase);
  const [faseId, setFaseId] = useState<string>(fases[0]?.id || '');
  const fase = fases.find((f) => f.id === faseId) || fases[0];

  const presentes = atletas
    .filter((a) => a.presente)
    .sort((a, b) => (a.ordemChegada ?? 1e9) - (b.ordemChegada ?? 1e9) || a.nome.localeCompare(b.nome, 'pt-BR'));

  if (!fase) {
    return <div className="card p-6 text-center text-marca-texto/50 text-sm">Nenhuma fase configurada.</div>;
  }

  const conta = (st: string) =>
    presentes.filter((a) => (a.fases?.[fase.id]?.status || 'pendente') === st).length;

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar mb-3">
        {fases.map((f) => (
          <button
            key={f.id}
            onClick={() => setFaseId(f.id)}
            className={`shrink-0 btn min-h-[38px] px-3 text-sm ${
              faseId === f.id ? 'bg-marca-vermelho text-white' : 'bg-white border border-black/10'
            }`}
          >
            {f.nome}
          </button>
        ))}
      </div>

      <div className="card-ouro p-3 mb-3">
        <div className="text-sm text-marca-texto/70">{fase.descricao || 'Marque o status de cada atleta nesta fase.'}</div>
        <div className="flex gap-3 mt-2 text-xs">
          <span className="text-green-700 font-semibold">✓ {conta('concluido')}</span>
          <span className="text-marca-escuro font-semibold">⭐ {conta('destaque')}</span>
          <span className="text-marca-vermelho font-semibold">✕ {conta('nao')}</span>
          <span className="text-marca-texto/40">○ {conta('pendente')}</span>
        </div>
      </div>

      {presentes.length === 0 && (
        <div className="card p-6 text-center text-marca-texto/50 text-sm">
          Faça o check-in dos atletas para rodar as fases.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {presentes.map((a) => {
          const st = a.fases?.[fase.id]?.status || 'pendente';
          return (
            <div key={a.id} className="card p-2.5 flex items-center gap-2">
              <Avatar atleta={a} size={38} />
              <Link to={`/atletas/${a.id}`} className="flex-1 min-w-0 font-semibold truncate text-sm">
                {a.numeroColete && <span className="text-marca-texto/40">#{a.numeroColete} </span>}
                {a.nome}
              </Link>
              {(
                [
                  ['concluido', '✓', 'bg-green-600 text-white'],
                  ['destaque', '⭐', 'bg-marca-dourado text-marca-texto'],
                  ['nao', '✕', 'bg-marca-vermelho text-white']
                ] as const
              ).map(([v, icone, cor]) => (
                <button
                  key={v}
                  onClick={() => setFase(a.id, fase.id, { status: st === v ? 'pendente' : v })}
                  className={`w-9 h-9 rounded-lg text-sm font-bold border transition ${
                    st === v ? cor : 'bg-white text-marca-texto/50 border-black/10'
                  }`}
                >
                  {icone}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Formação de duplas / quarteto ---------------- */
function Formacao() {
  const grupos = useStore((s) => s.grupos);
  const atletas = useStore((s) => s.atletas);
  const config = useStore((s) => s.config);
  const addGrupo = useStore((s) => s.addGrupo);
  const updateGrupo = useStore((s) => s.updateGrupo);
  const removeGrupo = useStore((s) => s.removeGrupo);
  const [cat, setCat] = useState<'dupla_fem' | 'dupla_masc' | 'quarteto_misto'>('dupla_fem');
  const [escolhendo, setEscolhendo] = useState<string | null>(null);

  const gruposCat = grupos.filter((g) => g.categoria === cat);
  const disponiveis = Object.values(atletas)
    .filter((a) => a.categoria === cat)
    .sort((a, b) => notaFinalAtleta(b, config) - notaFinalAtleta(a, config));
  const emGrupos = new Set(grupos.flatMap((g) => g.atletaIds));

  const catLabel: Record<typeof cat, string> = {
    dupla_fem: 'Dupla Feminina',
    dupla_masc: 'Dupla Masculina',
    quarteto_misto: 'Quarteto Misto'
  };

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar mb-4">
        {(['dupla_fem', 'dupla_masc', 'quarteto_misto'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 btn min-h-[40px] px-3 text-sm ${cat === c ? 'bg-marca-vermelho text-white' : 'bg-white border border-marca-dourado/40'}`}
          >
            {catLabel[c]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {gruposCat.map((g) => {
          const membros = g.atletaIds.map((id) => atletas[id]).filter(Boolean);
          const media = membros.length
            ? membros.reduce((s, m) => s + notaFinalAtleta(m, config), 0) / membros.length
            : 0;
          return (
            <div key={g.id} className="card p-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={g.nome}
                  onChange={(e) => updateGrupo(g.id, { nome: e.target.value })}
                  className="font-titulo text-lg flex-1 bg-transparent outline-none"
                />
                <span className="chip bg-marca-dourado/25 text-marca-escuro tabular-nums">
                  méd {media.toFixed(1)}
                </span>
                <button onClick={() => removeGrupo(g.id)} className="text-marca-vermelho text-xl px-1" aria-label="Remover grupo">
                  ×
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {membros.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{m.avaliacao.destaque && '⭐ '}{m.nome}</span>
                    <NotaBadge atleta={m} />
                    <button
                      onClick={() => updateGrupo(g.id, { atletaIds: g.atletaIds.filter((x) => x !== m.id) })}
                      className="text-marca-texto/40"
                    >
                      remover
                    </button>
                  </div>
                ))}
                {membros.length === 0 && <div className="text-xs text-marca-texto/40">Vazio — adicione atletas.</div>}
              </div>
              <button
                onClick={() => setEscolhendo(escolhendo === g.id ? null : g.id)}
                className="btn-fantasma w-full mt-2 text-sm py-1.5"
              >
                {escolhendo === g.id ? 'Fechar' : '+ Adicionar atleta'}
              </button>
              {escolhendo === g.id && (
                <div className="mt-2 border-t border-marca-dourado/20 pt-2 flex flex-col gap-1 max-h-56 overflow-auto">
                  {disponiveis
                    .filter((a) => !g.atletaIds.includes(a.id))
                    .map((a) => (
                      <button
                        key={a.id}
                        onClick={() => updateGrupo(g.id, { atletaIds: [...g.atletaIds, a.id] })}
                        className="flex items-center gap-2 text-sm text-left py-1.5 px-2 rounded-lg active:bg-marca-dourado/10"
                      >
                        <span className={`flex-1 truncate ${emGrupos.has(a.id) ? 'text-marca-texto/40' : ''}`}>
                          {a.nome} {emGrupos.has(a.id) && '(já em outro grupo)'}
                        </span>
                        <NotaBadge atleta={a} />
                      </button>
                    ))}
                  {disponiveis.filter((a) => !g.atletaIds.includes(a.id)).length === 0 && (
                    <div className="text-xs text-marca-texto/40 px-2 py-1">Ninguém disponível nesta categoria.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn-primario w-full" onClick={() => addGrupo(cat, `${catLabel[cat]} ${gruposCat.length + 1}`)}>
        + Novo {cat === 'quarteto_misto' ? 'quarteto' : 'dupla'}
      </button>
      {disponiveis.length === 0 && (
        <p className="text-xs text-marca-texto/50 mt-3 text-center">
          Defina a categoria dos atletas (na ficha) para montar os grupos.
        </p>
      )}
    </div>
  );
}

/* ---------------- Chamada ---------------- */
function Chamada() {
  const [periodo, setPeriodo] = useState<Periodo>('manha');
  const atletas = useStore((s) => Object.values(s.atletas));
  const updateAtleta = useStore((s) => s.updateAtleta);
  const toggleCheckin = useStore((s) => s.toggleCheckin);

  const doPeriodo = atletas
    .filter((a) => a.periodoAlocado === periodo)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const semPeriodo = atletas.filter((a) => !a.periodoAlocado);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['manha', 'tarde'] as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`flex-1 btn min-h-[48px] ${periodo === p ? 'bg-marca-vermelho text-white' : 'bg-white border border-marca-dourado/40'}`}
          >
            {PERIODO_LABEL[p]} ({atletas.filter((a) => a.periodoAlocado === p).length})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 mb-6">
        {doPeriodo.map((a) => (
          <div key={a.id} className="card p-3 flex items-center gap-3">
            <button
              onClick={() => toggleCheckin(a.id)}
              className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold ${
                a.presente ? 'bg-green-600 text-white' : 'bg-marca-dourado/25 text-marca-escuro border border-marca-dourado/50'
              }`}
            >
              {a.presente ? '✓' : '＋'}
            </button>
            <Link to={`/atletas/${a.id}`} className="flex-1 min-w-0">
              <div className="font-semibold truncate">{a.nome}</div>
              <div className="flex gap-1.5 mt-1">
                <CategoriaChip cat={a.categoria} />
                <PresencaBadge presente={a.presente} />
              </div>
            </Link>
            <button
              onClick={() => updateAtleta(a.id, { periodoAlocado: periodo === 'manha' ? 'tarde' : 'manha' })}
              className="shrink-0 text-xs font-semibold text-marca-vermelho border border-marca-dourado/40 rounded-lg px-2 py-1.5"
              title="Mover de período"
            >
              → {periodo === 'manha' ? 'Tarde' : 'Manhã'}
            </button>
          </div>
        ))}
        {doPeriodo.length === 0 && (
          <div className="card p-6 text-center text-marca-texto/50 text-sm">
            Ninguém alocado para {PERIODO_LABEL[periodo].toLowerCase()} ainda.
          </div>
        )}
      </div>

      {semPeriodo.length > 0 && (
        <div>
          <h2 className="text-sm text-marca-texto/50 mb-2">Sem período ({semPeriodo.length}) — alocar</h2>
          <div className="flex flex-col gap-2">
            {semPeriodo.map((a) => (
              <div key={a.id} className="card p-3 flex items-center gap-2">
                <Link to={`/atletas/${a.id}`} className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{a.nome}</div>
                  <div className="text-xs text-marca-texto/50">
                    Disponível: {PERIODO_DISP_LABEL[a.periodoDisponivel]}
                  </div>
                </Link>
                <button
                  onClick={() => updateAtleta(a.id, { periodoAlocado: 'manha' })}
                  className="text-xs font-semibold border border-marca-dourado/40 rounded-lg px-2 py-2"
                >
                  Manhã
                </button>
                <button
                  onClick={() => updateAtleta(a.id, { periodoAlocado: 'tarde' })}
                  className="text-xs font-semibold border border-marca-dourado/40 rounded-lg px-2 py-2"
                >
                  Tarde
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Cronograma ---------------- */
function Cronograma() {
  const cronograma = useStore((s) => s.cronograma);
  const addEstacao = useStore((s) => s.addEstacao);
  const updateEstacao = useStore((s) => s.updateEstacao);
  const removeEstacao = useStore((s) => s.removeEstacao);
  const resetCronograma = useStore((s) => s.resetCronograma);
  const [periodo, setPeriodo] = useState<Periodo>('manha');

  const doPeriodo = useMemo(
    () => cronograma.filter((e) => e.periodo === periodo).sort((a, b) => a.horario.localeCompare(b.horario)),
    [cronograma, periodo]
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['manha', 'tarde'] as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`flex-1 btn min-h-[44px] ${periodo === p ? 'bg-marca-vermelho text-white' : 'bg-white border border-marca-dourado/40'}`}
          >
            {PERIODO_LABEL[p]}
          </button>
        ))}
      </div>

      {cronograma.length === 0 && (
        <div className="card p-6 text-center mb-4">
          <p className="text-marca-texto/60 text-sm mb-3">Nenhuma estação ainda.</p>
          <button className="btn-dourado" onClick={resetCronograma}>
            Usar cronograma sugerido
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4">
        {doPeriodo.map((e) => (
          <div key={e.id} className="card p-3">
            <div className="flex gap-2 items-center">
              <input
                type="time"
                value={e.horario}
                onChange={(ev) => updateEstacao(e.id, { horario: ev.target.value })}
                className="campo w-28 py-1.5"
              />
              <input
                value={e.titulo}
                onChange={(ev) => updateEstacao(e.id, { titulo: ev.target.value })}
                className="campo flex-1 py-1.5"
              />
              <button onClick={() => removeEstacao(e.id)} className="text-marca-vermelho px-2 text-xl" aria-label="Remover">
                ×
              </button>
            </div>
            <div className="flex gap-2 items-center mt-2">
              <select
                value={e.bloco}
                onChange={(ev) => updateEstacao(e.id, { bloco: ev.target.value as EstacaoCronograma['bloco'] })}
                className={`chip ${BLOCOS[e.bloco].cor} border-0`}
              >
                {Object.entries(BLOCOS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <label className="text-xs text-marca-texto/50 ml-auto flex items-center gap-1">
                <input
                  type="number"
                  value={e.duracaoMin}
                  min={0}
                  onChange={(ev) => updateEstacao(e.id, { duracaoMin: Number(ev.target.value) })}
                  className="w-16 campo py-1 text-center"
                />
                min
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          className="btn-fantasma flex-1"
          onClick={() =>
            addEstacao({ periodo, horario: '12:00', titulo: 'Nova estação', bloco: 'tecnico', duracaoMin: 20 })
          }
        >
          + Estação
        </button>
        {cronograma.length > 0 && (
          <button className="btn-fantasma flex-1" onClick={resetCronograma}>
            Restaurar sugerido
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Cronômetro ---------------- */
function Cronometro() {
  const [restante, setRestante] = useState(300); // segundos
  const [rodando, setRodando] = useState(false);
  const [inicial, setInicial] = useState(300);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (rodando) {
      ref.current = window.setInterval(() => {
        setRestante((r) => {
          if (r <= 1) {
            setRodando(false);
            try {
              navigator.vibrate?.([200, 100, 200]);
            } catch {
              /* ignore */
            }
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [rodando]);

  const mm = String(Math.floor(restante / 60)).padStart(2, '0');
  const ss = String(restante % 60).padStart(2, '0');
  const preset = (min: number) => {
    setInicial(min * 60);
    setRestante(min * 60);
    setRodando(false);
  };

  return (
    <div className="text-center">
      <div className={`card py-10 mb-4 ${restante === 0 ? 'bg-marca-vermelho text-white' : ''}`}>
        <div className="font-titulo text-7xl tabular-nums tracking-tight">
          {mm}:{ss}
        </div>
        {restante === 0 && <div className="mt-2 font-semibold">Tempo esgotado!</div>}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {[1, 3, 5, 10].map((m) => (
          <button key={m} onClick={() => preset(m)} className="btn-fantasma">
            {m}min
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="btn-primario flex-1 text-lg" onClick={() => setRodando((r) => !r)}>
          {rodando ? '⏸ Pausar' : '▶ Iniciar'}
        </button>
        <button
          className="btn-fantasma flex-1"
          onClick={() => {
            setRestante(inicial);
            setRodando(false);
          }}
        >
          ↺ Zerar
        </button>
      </div>
    </div>
  );
}
