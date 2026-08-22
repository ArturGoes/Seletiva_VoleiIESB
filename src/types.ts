// Modelo de dados — Seletiva de Vôlei de Areia IESB

export type Categoria = 'dupla_fem' | 'dupla_masc' | 'quarteto_misto' | 'indefinido';
export type Periodo = 'manha' | 'tarde';
export type PeriodoDisponivel = 'manha' | 'tarde' | 'tanto_faz' | 'nao_consigo' | 'indefinido';
export type Sexo = 'F' | 'M' | 'outro' | undefined;
export type NivelExperiencia = 'Iniciante' | 'Intermediário' | 'Avançado' | 'Competitivo' | '';
export type Recomendacao = 'titular' | 'reserva' | 'cortado' | 'indefinido';

export interface CriteriosTecnico {
  saque: number;
  recepcao: number;
  levantamento: number;
  ataque: number;
  defesa: number;
  bloqueio: number;
}

export interface CriteriosFisico {
  deslocamento: number;
  explosao: number;
  resistencia: number;
  recuperacao: number;
}

export interface CriteriosTatico {
  leitura: number;
  comunicacao: number;
  entrosamento: number;
}

export interface Avaliacao {
  tecnico: CriteriosTecnico;
  fisico: CriteriosFisico;
  tatico: CriteriosTatico;
  destaque: boolean;
  recomendacao: Recomendacao;
  observacoesAvaliacao: string;
  avaliador: string;
  avaliadoEm?: string; // ISO — quando recebeu ao menos uma nota
}

// Fases da seletiva (fluxo do dia). São configuráveis.
export type StatusFase = 'pendente' | 'concluido' | 'destaque' | 'nao';

export interface FaseDef {
  id: string;
  nome: string;
  descricao: string;
}

export interface FaseAtleta {
  status: StatusFase;
  obs: string;
}

export const STATUS_FASE_LABEL: Record<StatusFase, string> = {
  pendente: 'Pendente',
  concluido: 'Concluído',
  destaque: 'Destaque',
  nao: 'Não fez'
};

export interface Atleta {
  id: string;
  // Inscrição
  nome: string;
  email: string;
  whatsapp: string;
  matricula: string;
  turno: string;
  curso: string;
  nivelExperiencia: NivelExperiencia;
  funcaoPreferida: string;
  interesseQuadra: boolean; // JUDF 2027
  periodoDisponivel: PeriodoDisponivel;
  observacoesInscricao: string;
  carimboInscricao: string;
  // Definidos no dia
  sexo: Sexo;
  categoria: Categoria;
  periodoAlocado?: Periodo;
  presente: boolean;
  horarioCheckin?: string; // ISO
  numeroColete?: string;
  ordemChegada?: number;
  foto?: string; // dataURL (JPEG comprimido)
  // Avaliação
  avaliacao: Avaliacao;
  fases: Record<string, FaseAtleta>; // por fase da seletiva
  origem: 'inscricao' | 'manual';
}

export interface Pesos {
  tecnico: number; // 0..1
  fisico: number;
  tatico: number;
}

export interface VagasCategoria {
  titulares: number;
  reservas: number;
}

export interface Evento {
  nome: string;
  local: string;
  data: string;
  whatsappOrganizador: string; // número do organizador (só dígitos, com DDI/DDD)
}

export interface Config {
  pesos: Pesos;
  escalaMax: number; // default 5
  vagas: Record<Exclude<Categoria, 'indefinido'>, VagasCategoria>;
  fases: FaseDef[];
  evento: Evento;
  avaliador: string; // nome de quem usa este aparelho (avaliador)
  aparelho: string; // apelido deste aparelho (ex.: "POCO X4")
  central: boolean; // este é o aparelho central (organizador que consolida tudo)
}

export interface Grupo {
  id: string;
  nome: string;
  categoria: Exclude<Categoria, 'indefinido'>;
  atletaIds: string[];
}

export interface EstacaoCronograma {
  id: string;
  periodo: Periodo;
  horario: string;
  titulo: string;
  bloco: 'aquecimento' | 'tecnico' | 'fisico' | 'tatico' | 'jogo';
  duracaoMin: number;
}

export interface EstadoApp {
  atletas: Record<string, Atleta>;
  config: Config;
  grupos: Grupo[];
  cronograma: EstacaoCronograma[];
  proximaOrdemChegada: number;
}

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  dupla_fem: 'Dupla Feminina',
  dupla_masc: 'Dupla Masculina',
  quarteto_misto: 'Quarteto Misto',
  indefinido: 'A definir'
};

export const CATEGORIA_CURTA: Record<Categoria, string> = {
  dupla_fem: 'Dupla F',
  dupla_masc: 'Dupla M',
  quarteto_misto: 'Quarteto',
  indefinido: 'A definir'
};

export const PERIODO_LABEL: Record<Periodo, string> = {
  manha: 'Manhã',
  tarde: 'Tarde'
};

export const PERIODO_DISP_LABEL: Record<PeriodoDisponivel, string> = {
  manha: 'Só manhã',
  tarde: 'Só tarde',
  tanto_faz: 'Tanto faz',
  nao_consigo: 'Não consigo neste domingo',
  indefinido: 'Não informado'
};

export const RECOMENDACAO_LABEL: Record<Recomendacao, string> = {
  titular: 'Titular',
  reserva: 'Reserva',
  cortado: 'Cortado',
  indefinido: 'A definir'
};

export const CATEGORIAS_REAIS: Exclude<Categoria, 'indefinido'>[] = [
  'dupla_fem',
  'dupla_masc',
  'quarteto_misto'
];

export const TECNICO_LABELS: Record<keyof CriteriosTecnico, string> = {
  saque: 'Saque',
  recepcao: 'Recepção / Passe',
  levantamento: 'Levantamento',
  ataque: 'Ataque',
  defesa: 'Defesa',
  bloqueio: 'Bloqueio'
};

export const FISICO_LABELS: Record<keyof CriteriosFisico, string> = {
  deslocamento: 'Deslocamento na areia',
  explosao: 'Explosão / Impulsão',
  resistencia: 'Resistência',
  recuperacao: 'Recuperação'
};

export const TATICO_LABELS: Record<keyof CriteriosTatico, string> = {
  leitura: 'Leitura de jogo',
  comunicacao: 'Comunicação',
  entrosamento: 'Entrosamento / Postura'
};

export function avaliacaoVazia(): Avaliacao {
  return {
    tecnico: { saque: 0, recepcao: 0, levantamento: 0, ataque: 0, defesa: 0, bloqueio: 0 },
    fisico: { deslocamento: 0, explosao: 0, resistencia: 0, recuperacao: 0 },
    tatico: { leitura: 0, comunicacao: 0, entrosamento: 0 },
    destaque: false,
    recomendacao: 'indefinido',
    observacoesAvaliacao: '',
    avaliador: ''
  };
}

export const FASES_PADRAO: FaseDef[] = [
  { id: 'chegada', nome: 'Chegada & Check-in', descricao: 'Recepção, confirmação de presença e colete.' },
  { id: 'aquecimento', nome: 'Aquecimento', descricao: 'Aquecimento na areia e mobilidade.' },
  { id: 'fundamentos', nome: 'Fundamentos', descricao: 'Saque, recepção, levantamento, ataque e defesa.' },
  { id: 'fisico', nome: 'Testes físicos', descricao: 'Deslocamento na areia, explosão e resistência.' },
  { id: 'jogo', nome: 'Jogo avaliativo', descricao: 'Leitura de jogo, comunicação e entrosamento.' },
  { id: 'decisao', nome: 'Decisão final', descricao: 'Definição de titulares e reservas.' }
];

export function fasesVazias(fases: FaseDef[]): Record<string, FaseAtleta> {
  const r: Record<string, FaseAtleta> = {};
  for (const f of fases) r[f.id] = { status: 'pendente', obs: '' };
  return r;
}

export function eventoPadrao(): Evento {
  return {
    nome: 'Seletiva de Vôlei de Areia — Time IESB',
    local: 'Parque da Cidade · Brasília',
    data: '',
    whatsappOrganizador: ''
  };
}

export function configPadrao(): Config {
  return {
    pesos: { tecnico: 0.5, fisico: 0.25, tatico: 0.25 },
    escalaMax: 5,
    vagas: {
      dupla_fem: { titulares: 2, reservas: 1 },
      dupla_masc: { titulares: 2, reservas: 1 },
      quarteto_misto: { titulares: 4, reservas: 2 }
    },
    fases: FASES_PADRAO.map((f) => ({ ...f })),
    evento: eventoPadrao(),
    avaliador: '',
    aparelho: '',
    central: false
  };
}
