// Trabalho em equipe: compartilhar a lista de atletas com avaliadores,
// cada avaliador envia suas avaliações, e o aparelho central mescla tudo.
import {
  type Atleta,
  type Avaliacao,
  type Config,
  type EstadoApp,
  type FaseAtleta,
  avaliacaoVazia,
  fasesVazias
} from '../types';
import { foiAvaliado } from './scoring';
import { normalizarZap } from '../store/useStore';

export const TIPO_ROSTER = 'seletiva-iesb-roster';
export const TIPO_AVALIACOES = 'seletiva-iesb-avaliacoes';

export interface ItemAvaliacao {
  id: string;
  email: string;
  nome: string;
  numeroColete?: string;
  categoria: Atleta['categoria'];
  avaliacao: Avaliacao;
  fases: Record<string, FaseAtleta>;
  foto?: string;
}

export interface PacoteAvaliacoes {
  tipo: typeof TIPO_AVALIACOES;
  versao: 1;
  avaliador: string;
  evento: string;
  geradoEm: string;
  itens: ItemAvaliacao[];
}

export interface PacoteRoster {
  tipo: typeof TIPO_ROSTER;
  versao: 1;
  evento: string;
  geradoEm: string;
  centralAparelho: string; // apelido do aparelho central que gerou a lista ('' se não definido)
  config: Config;
  atletas: Atleta[];
}

/** Um atleta "foi mexido" se recebeu nota, alguma fase ou foto. */
export function atletaTemContribuicao(a: Atleta): boolean {
  const fases = Object.values(a.fases || {});
  return foiAvaliado(a.avaliacao) || fases.some((f) => f.status !== 'pendente' || f.obs) || !!a.foto;
}

/** Lista de atletas "limpa" (sem avaliação/fases/foto) para distribuir aos avaliadores. */
export function exportarRoster(estado: EstadoApp): string {
  const atletas = Object.values(estado.atletas).map((a) => ({
    ...a,
    presente: false,
    horarioCheckin: undefined,
    ordemChegada: undefined,
    foto: undefined,
    avaliacao: avaliacaoVazia(),
    fases: fasesVazias(estado.config.fases)
  }));
  const pacote: PacoteRoster = {
    tipo: TIPO_ROSTER,
    versao: 1,
    evento: estado.config.evento.nome,
    geradoEm: new Date().toISOString(),
    centralAparelho: estado.config.central ? estado.config.aparelho || 'Aparelho central' : '',
    config: estado.config,
    atletas
  };
  return JSON.stringify(pacote);
}

export function lerRoster(texto: string): PacoteRoster {
  const obj = JSON.parse(texto);
  if (obj?.tipo !== TIPO_ROSTER || !Array.isArray(obj.atletas)) {
    throw new Error('Arquivo não é uma lista de atletas válida.');
  }
  return obj as PacoteRoster;
}

/** Pacote com as avaliações que ESTE aparelho fez (para enviar ao organizador). */
export function exportarAvaliacoes(estado: EstadoApp): PacoteAvaliacoes {
  const itens: ItemAvaliacao[] = Object.values(estado.atletas)
    .filter(atletaTemContribuicao)
    .map((a) => ({
      id: a.id,
      email: a.email,
      nome: a.nome,
      numeroColete: a.numeroColete,
      categoria: a.categoria,
      avaliacao: a.avaliacao,
      fases: a.fases,
      foto: a.foto
    }));
  return {
    tipo: TIPO_AVALIACOES,
    versao: 1,
    avaliador: estado.config.avaliador || 'Avaliador',
    evento: estado.config.evento.nome,
    geradoEm: new Date().toISOString(),
    itens
  };
}

export function lerAvaliacoes(texto: string): PacoteAvaliacoes {
  const obj = JSON.parse(texto);
  if (obj?.tipo !== TIPO_AVALIACOES || !Array.isArray(obj.itens)) {
    throw new Error('Arquivo não é um pacote de avaliações válido.');
  }
  return obj as PacoteAvaliacoes;
}

export interface ResumoMerge {
  atletasAtualizados: number;
  notasNovas: number;
  notasEmConflito: number;
  fasesAplicadas: number;
  fotosAdicionadas: number;
  naoEncontrados: number;
}

function chaveEmail(e: string) {
  return (e || '').trim().toLowerCase();
}

/**
 * Mescla um pacote de avaliações no estado atual (aparelho central).
 * Casa por id e, se não achar, por e-mail. Por padrão preenche o que estiver
 * vazio; com substituir=true, as notas do avaliador sobrescrevem as suas.
 */
export function mesclarAvaliacoes(
  atletasAtual: Record<string, Atleta>,
  pacote: PacoteAvaliacoes,
  opts: { substituir: boolean }
): { atletas: Record<string, Atleta>; resumo: ResumoMerge } {
  const atletas = { ...atletasAtual };
  const lista = Object.values(atletas);
  const resumo: ResumoMerge = {
    atletasAtualizados: 0,
    notasNovas: 0,
    notasEmConflito: 0,
    fasesAplicadas: 0,
    fotosAdicionadas: 0,
    naoEncontrados: 0
  };

  for (const item of pacote.itens) {
    let alvo: Atleta | undefined = atletas[item.id];
    if (!alvo) {
      const email = chaveEmail(item.email);
      alvo = email ? lista.find((a) => chaveEmail(a.email) === email) : undefined;
    }
    if (!alvo) {
      resumo.naoEncontrados++;
      continue;
    }

    let mudou = false;
    const novo: Atleta = { ...alvo, fases: { ...alvo.fases }, avaliacao: { ...alvo.avaliacao } };

    // Foto
    if (item.foto && !novo.foto) {
      novo.foto = item.foto;
      resumo.fotosAdicionadas++;
      mudou = true;
    }

    // Fases
    for (const [faseId, fa] of Object.entries(item.fases || {})) {
      if (fa.status === 'pendente' && !fa.obs) continue;
      const atualFase = novo.fases[faseId];
      const vazia = !atualFase || (atualFase.status === 'pendente' && !atualFase.obs);
      if (vazia || opts.substituir) {
        novo.fases[faseId] = { status: fa.status, obs: fa.obs };
        resumo.fasesAplicadas++;
        mudou = true;
      }
    }

    // Notas (rubrica)
    if (foiAvaliado(item.avaliacao)) {
      const jaAvaliado = foiAvaliado(novo.avaliacao);
      if (!jaAvaliado || opts.substituir) {
        const avaliadorAntigo = novo.avaliacao.avaliador;
        novo.avaliacao = { ...item.avaliacao };
        // registra quem avaliou (mantém histórico de nomes)
        const nomes = new Set(
          [avaliadorAntigo, item.avaliacao.avaliador, pacote.avaliador].filter(Boolean).flatMap((s) => s.split(',').map((x) => x.trim()))
        );
        novo.avaliacao.avaliador = Array.from(nomes).join(', ');
        resumo.notasNovas++;
        mudou = true;
      } else {
        resumo.notasEmConflito++;
      }
    }

    if (mudou) {
      atletas[novo.id] = novo;
      resumo.atletasAtualizados++;
    }
  }

  return { atletas, resumo };
}

/* ---------- Compartilhamento (WhatsApp / arquivo) ---------- */

function baixar(nome: string, texto: string) {
  const blob = new Blob([texto], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export type ResultadoEnvio = 'compartilhado' | 'baixado';

/** Compartilha um arquivo JSON (via menu do celular) ou baixa + abre wa.me. */
export async function compartilharJSON(
  nomeArquivo: string,
  conteudo: string,
  legenda: string,
  config: Config
): Promise<ResultadoEnvio> {
  const file = new File([conteudo], nomeArquivo, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: nomeArquivo, text: legenda });
      return 'compartilhado';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'compartilhado';
    }
  }
  baixar(nomeArquivo, conteudo);
  const num = normalizarZap(config.evento.whatsappOrganizador);
  const base = num ? `https://wa.me/${num.startsWith('55') ? num : '55' + num}` : 'https://wa.me/';
  window.open(`${base}?text=${encodeURIComponent(legenda)}`, '_blank');
  return 'baixado';
}
