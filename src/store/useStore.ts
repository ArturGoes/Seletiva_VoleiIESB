import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { localforageStorage } from './storage';
import {
  type Atleta,
  type Avaliacao,
  type Categoria,
  type Config,
  type EstacaoCronograma,
  type EstadoApp,
  type Evento,
  type FaseAtleta,
  type FaseDef,
  type Grupo,
  type Periodo,
  avaliacaoVazia,
  configPadrao,
  fasesVazias
} from '../types';
import { foiAvaliado } from '../lib/scoring';

function uid(prefix = 'a'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface Acoes {
  // Atletas
  upsertAtletas: (novos: Atleta[]) => { adicionados: number; atualizados: number };
  addAtletaManual: (dados: Partial<Atleta>) => string;
  updateAtleta: (id: string, patch: Partial<Atleta>) => void;
  removeAtleta: (id: string) => void;
  toggleCheckin: (id: string) => void;
  setFoto: (id: string, dataUrl: string | undefined) => void;
  setFase: (id: string, faseId: string, patch: Partial<FaseAtleta>) => void;
  // Avaliação
  setAvaliacao: (id: string, patch: Partial<Avaliacao>) => void;
  setCriterio: (
    id: string,
    dim: 'tecnico' | 'fisico' | 'tatico',
    chave: string,
    valor: number
  ) => void;
  // Config
  setConfig: (patch: Partial<Config>) => void;
  setEvento: (patch: Partial<Evento>) => void;
  addFase: () => void;
  updateFase: (id: string, patch: Partial<FaseDef>) => void;
  removeFase: (id: string) => void;
  resetFases: () => void;
  // Grupos
  addGrupo: (categoria: Grupo['categoria'], nome?: string) => string;
  updateGrupo: (id: string, patch: Partial<Grupo>) => void;
  removeGrupo: (id: string) => void;
  // Cronograma
  addEstacao: (est: Omit<EstacaoCronograma, 'id'>) => void;
  updateEstacao: (id: string, patch: Partial<EstacaoCronograma>) => void;
  removeEstacao: (id: string) => void;
  resetCronograma: () => void;
  // Global
  carregarEstado: (estado: EstadoApp) => void;
  limparTudo: () => void;
}

export type Store = EstadoApp & Acoes;

function estadoInicial(): EstadoApp {
  return {
    atletas: {},
    config: configPadrao(),
    grupos: [],
    cronograma: [],
    proximaOrdemChegada: 1
  };
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...estadoInicial(),

      upsertAtletas: (novos) => {
        let adicionados = 0;
        let atualizados = 0;
        set((s) => {
          const atletas = { ...s.atletas };
          const existentes = Object.values(atletas);
          for (const nv of novos) {
            const emailKey = nv.email?.trim().toLowerCase();
            const zapKey = normalizarZap(nv.whatsapp);
            const match = existentes.find(
              (e) =>
                (emailKey && e.email?.trim().toLowerCase() === emailKey) ||
                (zapKey && normalizarZap(e.whatsapp) === zapKey)
            );
            if (match) {
              // Importação incremental: atualiza dados de inscrição, preserva avaliação/dia.
              atletas[match.id] = {
                ...match,
                nome: nv.nome || match.nome,
                email: nv.email || match.email,
                whatsapp: nv.whatsapp || match.whatsapp,
                matricula: nv.matricula || match.matricula,
                turno: nv.turno || match.turno,
                curso: nv.curso || match.curso,
                nivelExperiencia: nv.nivelExperiencia || match.nivelExperiencia,
                funcaoPreferida: nv.funcaoPreferida || match.funcaoPreferida,
                interesseQuadra: nv.interesseQuadra ?? match.interesseQuadra,
                periodoDisponivel:
                  nv.periodoDisponivel !== 'indefinido'
                    ? nv.periodoDisponivel
                    : match.periodoDisponivel,
                observacoesInscricao: nv.observacoesInscricao || match.observacoesInscricao,
                carimboInscricao: nv.carimboInscricao || match.carimboInscricao
              };
              atualizados++;
            } else {
              atletas[nv.id] = {
                ...nv,
                fases: Object.keys(nv.fases || {}).length ? nv.fases : fasesVazias(s.config.fases)
              };
              adicionados++;
            }
          }
          return { atletas };
        });
        return { adicionados, atualizados };
      },

      addAtletaManual: (dados) => {
        const id = uid();
        set((s) => {
          const ordem = s.proximaOrdemChegada;
          const atleta: Atleta = {
            id,
            nome: dados.nome || 'Sem nome',
            email: dados.email || '',
            whatsapp: dados.whatsapp || '',
            matricula: dados.matricula || '',
            turno: dados.turno || '',
            curso: dados.curso || '',
            nivelExperiencia: dados.nivelExperiencia || '',
            funcaoPreferida: dados.funcaoPreferida || '',
            interesseQuadra: dados.interesseQuadra ?? false,
            periodoDisponivel: dados.periodoDisponivel || 'indefinido',
            observacoesInscricao: dados.observacoesInscricao || '',
            carimboInscricao: dados.carimboInscricao || '',
            sexo: dados.sexo,
            categoria: dados.categoria || 'indefinido',
            periodoAlocado: dados.periodoAlocado,
            presente: dados.presente ?? false,
            horarioCheckin: dados.horarioCheckin,
            numeroColete: dados.numeroColete,
            ordemChegada: dados.presente ? ordem : undefined,
            foto: dados.foto,
            avaliacao: dados.avaliacao || avaliacaoVazia(),
            fases: dados.fases || fasesVazias(s.config.fases),
            origem: 'manual'
          };
          return {
            atletas: { ...s.atletas, [id]: atleta },
            proximaOrdemChegada: dados.presente ? ordem + 1 : ordem
          };
        });
        return id;
      },

      updateAtleta: (id, patch) =>
        set((s) => {
          const atual = s.atletas[id];
          if (!atual) return {};
          return { atletas: { ...s.atletas, [id]: { ...atual, ...patch } } };
        }),

      removeAtleta: (id) =>
        set((s) => {
          const atletas = { ...s.atletas };
          delete atletas[id];
          const grupos = s.grupos.map((g) => ({
            ...g,
            atletaIds: g.atletaIds.filter((x) => x !== id)
          }));
          return { atletas, grupos };
        }),

      toggleCheckin: (id) =>
        set((s) => {
          const atual = s.atletas[id];
          if (!atual) return {};
          if (atual.presente) {
            return {
              atletas: {
                ...s.atletas,
                [id]: { ...atual, presente: false, horarioCheckin: undefined }
              }
            };
          }
          const ordem = s.proximaOrdemChegada;
          return {
            atletas: {
              ...s.atletas,
              [id]: {
                ...atual,
                presente: true,
                horarioCheckin: new Date().toISOString(),
                ordemChegada: atual.ordemChegada ?? ordem
              }
            },
            proximaOrdemChegada: atual.ordemChegada ? ordem : ordem + 1
          };
        }),

      setFoto: (id, dataUrl) =>
        set((s) => {
          const atual = s.atletas[id];
          if (!atual) return {};
          return { atletas: { ...s.atletas, [id]: { ...atual, foto: dataUrl } } };
        }),

      setFase: (id, faseId, patch) =>
        set((s) => {
          const atual = s.atletas[id];
          if (!atual) return {};
          const faseAtual = atual.fases?.[faseId] || { status: 'pendente', obs: '' };
          const fases = { ...atual.fases, [faseId]: { ...faseAtual, ...patch } };
          return { atletas: { ...s.atletas, [id]: { ...atual, fases } } };
        }),

      setAvaliacao: (id, patch) =>
        set((s) => {
          const atual = s.atletas[id];
          if (!atual) return {};
          const avaliacao = { ...atual.avaliacao, ...patch };
          return { atletas: { ...s.atletas, [id]: { ...atual, avaliacao } } };
        }),

      setCriterio: (id, dim, chave, valor) =>
        set((s) => {
          const atual = s.atletas[id];
          if (!atual) return {};
          const avaliacao: Avaliacao = {
            ...atual.avaliacao,
            [dim]: { ...(atual.avaliacao[dim] as unknown as Record<string, number>), [chave]: valor }
          };
          if (!avaliacao.avaliadoEm && foiAvaliado(avaliacao)) {
            avaliacao.avaliadoEm = new Date().toISOString();
          }
          return { atletas: { ...s.atletas, [id]: { ...atual, avaliacao } } };
        }),

      setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),

      setEvento: (patch) =>
        set((s) => ({ config: { ...s.config, evento: { ...s.config.evento, ...patch } } })),

      addFase: () =>
        set((s) => ({
          config: {
            ...s.config,
            fases: [
              ...s.config.fases,
              { id: uid('f'), nome: `Fase ${s.config.fases.length + 1}`, descricao: '' }
            ]
          }
        })),

      updateFase: (id, patch) =>
        set((s) => ({
          config: {
            ...s.config,
            fases: s.config.fases.map((f) => (f.id === id ? { ...f, ...patch } : f))
          }
        })),

      removeFase: (id) =>
        set((s) => {
          const fases = s.config.fases.filter((f) => f.id !== id);
          const atletas = { ...s.atletas };
          for (const k of Object.keys(atletas)) {
            const { [id]: _omit, ...resto } = atletas[k].fases || {};
            void _omit;
            atletas[k] = { ...atletas[k], fases: resto };
          }
          return { config: { ...s.config, fases }, atletas };
        }),

      resetFases: () =>
        set((s) => ({ config: { ...s.config, fases: configPadrao().fases } })),

      addGrupo: (categoria, nome) => {
        const id = uid('g');
        set((s) => ({
          grupos: [
            ...s.grupos,
            { id, categoria, nome: nome || `Grupo ${s.grupos.length + 1}`, atletaIds: [] }
          ]
        }));
        return id;
      },

      updateGrupo: (id, patch) =>
        set((s) => ({
          grupos: s.grupos.map((g) => (g.id === id ? { ...g, ...patch } : g))
        })),

      removeGrupo: (id) => set((s) => ({ grupos: s.grupos.filter((g) => g.id !== id) })),

      addEstacao: (est) =>
        set((s) => ({ cronograma: [...s.cronograma, { ...est, id: uid('e') }] })),

      updateEstacao: (id, patch) =>
        set((s) => ({
          cronograma: s.cronograma.map((e) => (e.id === id ? { ...e, ...patch } : e))
        })),

      removeEstacao: (id) =>
        set((s) => ({ cronograma: s.cronograma.filter((e) => e.id !== id) })),

      resetCronograma: () => set(() => ({ cronograma: cronogramaSugerido() })),

      carregarEstado: (estado) => set(() => normalizarEstado(estado)),

      limparTudo: () => set(() => estadoInicial())
    }),
    {
      name: 'estado-app',
      version: 2,
      storage: createJSONStorage(() => localforageStorage),
      migrate: (persisted) => normalizarEstado(persisted as Partial<EstadoApp>),
      partialize: (s) => ({
        atletas: s.atletas,
        config: s.config,
        grupos: s.grupos,
        cronograma: s.cronograma,
        proximaOrdemChegada: s.proximaOrdemChegada
      })
    }
  )
);

/** Garante que estado (persistido ou importado) tenha todos os campos novos. */
function normalizarEstado(estado: Partial<EstadoApp> | undefined): EstadoApp {
  const padrao = configPadrao();
  const config: Config = {
    ...padrao,
    ...(estado?.config || {}),
    pesos: { ...padrao.pesos, ...(estado?.config?.pesos || {}) },
    vagas: { ...padrao.vagas, ...(estado?.config?.vagas || {}) },
    fases: estado?.config?.fases?.length ? estado.config.fases : padrao.fases,
    evento: { ...padrao.evento, ...(estado?.config?.evento || {}) }
  };
  const atletasIn = estado?.atletas || {};
  const atletas: Record<string, Atleta> = {};
  for (const [id, a] of Object.entries(atletasIn)) {
    atletas[id] = {
      ...a,
      avaliacao: a.avaliacao || avaliacaoVazia(),
      fases: a.fases && Object.keys(a.fases).length ? a.fases : fasesVazias(config.fases)
    };
  }
  return {
    atletas,
    config,
    grupos: estado?.grupos || [],
    cronograma: estado?.cronograma || [],
    proximaOrdemChegada: estado?.proximaOrdemChegada || 1
  };
}

export function normalizarZap(zap: string | undefined): string {
  if (!zap) return '';
  return zap.replace(/\D/g, '').replace(/^0+/, '');
}

export function cronogramaSugerido(): EstacaoCronograma[] {
  const base: Omit<EstacaoCronograma, 'id' | 'periodo'>[] = [
    { horario: '08:00', titulo: 'Recepção e check-in', bloco: 'aquecimento', duracaoMin: 30 },
    { horario: '08:30', titulo: 'Aquecimento na areia', bloco: 'aquecimento', duracaoMin: 20 },
    { horario: '08:50', titulo: 'Saque e recepção', bloco: 'tecnico', duracaoMin: 30 },
    { horario: '09:20', titulo: 'Levantamento e ataque', bloco: 'tecnico', duracaoMin: 30 },
    { horario: '09:50', titulo: 'Defesa e bloqueio', bloco: 'tecnico', duracaoMin: 25 },
    { horario: '10:15', titulo: 'Testes físicos (deslocamento/impulsão)', bloco: 'fisico', duracaoMin: 20 },
    { horario: '10:35', titulo: 'Jogos avaliativos', bloco: 'jogo', duracaoMin: 55 }
  ];
  const manha = base.map((b) => ({ ...b, id: uid('e'), periodo: 'manha' as Periodo }));
  const tarde = base.map((b, i) => ({
    ...b,
    id: uid('e'),
    periodo: 'tarde' as Periodo,
    horario: ['13:30', '14:00', '14:20', '14:50', '15:20', '15:45', '16:05'][i] || b.horario
  }));
  return [...manha, ...tarde];
}

// Seletores utilitários
export function listaAtletas(s: Store): Atleta[] {
  return Object.values(s.atletas);
}

export function atletasPorCategoria(s: Store, cat: Categoria): Atleta[] {
  return listaAtletas(s).filter((a) => a.categoria === cat);
}
