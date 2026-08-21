import Papa from 'papaparse';
import {
  type Atleta,
  type NivelExperiencia,
  type PeriodoDisponivel,
  avaliacaoVazia
} from '../types';

export type CampoAtleta =
  | 'carimboInscricao'
  | 'nome'
  | 'email'
  | 'whatsapp'
  | 'matricula'
  | 'turno'
  | 'curso'
  | 'nivelExperiencia'
  | 'funcaoPreferida'
  | 'interesseQuadra'
  | 'periodoDisponivel'
  | 'observacoesInscricao'
  | 'ignorar';

export interface DefinicaoCampo {
  campo: CampoAtleta;
  label: string;
  palavras: string[]; // termos (sem acento, minúsculo) para casar cabeçalho
}

export const CAMPOS: DefinicaoCampo[] = [
  { campo: 'carimboInscricao', label: 'Carimbo de data/hora', palavras: ['carimbo', 'timestamp', 'data/hora', 'data hora'] },
  { campo: 'nome', label: 'Nome completo', palavras: ['nome completo', 'nome'] },
  { campo: 'email', label: 'E-mail', palavras: ['e-mail', 'email', 'e mail'] },
  { campo: 'whatsapp', label: 'WhatsApp (com DDD)', palavras: ['whatsapp', 'whats', 'telefone', 'celular', 'ddd', 'zap'] },
  { campo: 'matricula', label: 'Matrícula IESB', palavras: ['matricula', 'matrícula', 'ra'] },
  { campo: 'turno', label: 'Turno', palavras: ['turno'] },
  { campo: 'curso', label: 'Curso', palavras: ['curso'] },
  { campo: 'nivelExperiencia', label: 'Nível de experiência', palavras: ['nivel de experiencia', 'nivel', 'experiencia'] },
  { campo: 'funcaoPreferida', label: 'Função preferida', palavras: ['funcao preferida', 'funcao', 'posicao', 'posição'] },
  { campo: 'interesseQuadra', label: 'Vôlei de quadra (JUDF 2027)', palavras: ['volei de quadra', 'quadra', 'judf'] },
  { campo: 'periodoDisponivel', label: 'Disponibilidade (manhã/tarde)', palavras: ['consegue ir', 'disponibilidade', 'periodo', 'turno da seletiva', 'domingo', 'manha ou tarde'] },
  { campo: 'observacoesInscricao', label: 'Observações', palavras: ['observacoes', 'observação', 'comentarios', 'obs'] }
];

export function normalizarTexto(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export interface ResultadoParse {
  cabecalhos: string[];
  linhas: Record<string, string>[];
}

export function parseCSV(texto: string): Promise<ResultadoParse> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(texto, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const cabecalhos = (res.meta.fields || []).map((f) => f.trim());
        resolve({ cabecalhos, linhas: res.data });
      },
      error: (err: unknown) => reject(err)
    });
  });
}

/** Sugere um mapeamento cabeçalho -> campo, casando por palavras (flexível a acentos/maiúsculas). */
export function sugerirMapeamento(cabecalhos: string[]): Record<string, CampoAtleta> {
  const mapa: Record<string, CampoAtleta> = {};
  const usados = new Set<CampoAtleta>();
  for (const cab of cabecalhos) {
    const n = normalizarTexto(cab);
    let melhor: { campo: CampoAtleta; score: number } | null = null;
    for (const def of CAMPOS) {
      if (usados.has(def.campo)) continue;
      let score = 0;
      for (const p of def.palavras) {
        if (n.includes(p)) score = Math.max(score, p.length);
      }
      if (score > 0 && (!melhor || score > melhor.score)) {
        melhor = { campo: def.campo, score };
      }
    }
    if (melhor) {
      mapa[cab] = melhor.campo;
      usados.add(melhor.campo);
    } else {
      mapa[cab] = 'ignorar';
    }
  }
  return mapa;
}

function parseNivel(v: string): NivelExperiencia {
  const n = normalizarTexto(v);
  if (n.includes('compet')) return 'Competitivo';
  if (n.includes('avanc')) return 'Avançado';
  if (n.includes('interm')) return 'Intermediário';
  if (n.includes('inic')) return 'Iniciante';
  return '';
}

function parseInteresse(v: string): boolean {
  const n = normalizarTexto(v);
  return n.includes('sim') || n.includes('quero') || n.includes('interesse') || n === 'x' || n === 'true';
}

function parsePeriodoDisp(v: string): PeriodoDisponivel {
  const n = normalizarTexto(v);
  if (!n) return 'indefinido';
  if (n.includes('nao consigo') || n.includes('não consigo') || n.includes('nenhum') || n.includes('nao poderei')) return 'nao_consigo';
  const temManha = n.includes('manha');
  const temTarde = n.includes('tarde');
  if (temManha && temTarde) return 'tanto_faz';
  if (n.includes('tanto faz') || n.includes('qualquer') || n.includes('ambos') || n.includes('os dois')) return 'tanto_faz';
  if (temManha) return 'manha';
  if (temTarde) return 'tarde';
  return 'indefinido';
}

function uid(): string {
  return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Converte linhas + mapeamento em atletas prontos para importar. */
export function linhasParaAtletas(
  linhas: Record<string, string>[],
  mapeamento: Record<string, CampoAtleta>
): Atleta[] {
  const invertido: Partial<Record<CampoAtleta, string>> = {};
  for (const [cab, campo] of Object.entries(mapeamento)) {
    if (campo !== 'ignorar' && !invertido[campo]) invertido[campo] = cab;
  }
  const val = (linha: Record<string, string>, campo: CampoAtleta): string => {
    const cab = invertido[campo];
    return cab ? (linha[cab] || '').trim() : '';
  };

  const atletas: Atleta[] = [];
  for (const linha of linhas) {
    const nome = val(linha, 'nome');
    const email = val(linha, 'email');
    const whatsapp = val(linha, 'whatsapp');
    if (!nome && !email && !whatsapp) continue; // linha vazia
    atletas.push({
      id: uid(),
      nome: nome || 'Sem nome',
      email,
      whatsapp,
      matricula: val(linha, 'matricula'),
      turno: val(linha, 'turno'),
      curso: val(linha, 'curso'),
      nivelExperiencia: parseNivel(val(linha, 'nivelExperiencia')),
      funcaoPreferida: val(linha, 'funcaoPreferida'),
      interesseQuadra: parseInteresse(val(linha, 'interesseQuadra')),
      periodoDisponivel: parsePeriodoDisp(val(linha, 'periodoDisponivel')),
      observacoesInscricao: val(linha, 'observacoesInscricao'),
      carimboInscricao: val(linha, 'carimboInscricao'),
      sexo: undefined,
      categoria: 'indefinido',
      periodoAlocado: undefined,
      presente: false,
      avaliacao: avaliacaoVazia(),
      origem: 'inscricao'
    });
  }
  return atletas;
}
