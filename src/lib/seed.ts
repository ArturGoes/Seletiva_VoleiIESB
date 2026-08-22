import {
  type Atleta,
  type Categoria,
  type NivelExperiencia,
  type PeriodoDisponivel,
  type Sexo,
  avaliacaoVazia
} from '../types';

const nomesF = [
  'Ana Beatriz Souza', 'Mariana Costa Lima', 'Júlia Fernandes', 'Camila Rocha', 'Larissa Alves',
  'Beatriz Menezes', 'Gabriela Martins', 'Rafaela Dias', 'Letícia Barbosa', 'Isabela Nunes',
  'Sofia Andrade', 'Yasmin Cardoso', 'Helena Ribeiro', 'Clara Monteiro', 'Vitória Gomes'
];
const nomesM = [
  'Lucas Oliveira', 'Pedro Henrique Silva', 'Gabriel Santos', 'Matheus Araújo', 'Rafael Carvalho',
  'João Vitor Pereira', 'Bruno Almeida', 'Felipe Ramos', 'Thiago Moreira', 'Vinícius Teixeira',
  'Guilherme Pinto', 'Eduardo Farias', 'Daniel Correia', 'Leonardo Castro', 'Caio Barros'
];
const cursos = [
  'Educação Física', 'Direito', 'Engenharia de Software', 'Administração', 'Psicologia',
  'Nutrição', 'Fisioterapia', 'Jornalismo', 'Medicina Veterinária', 'Arquitetura'
];
const turnos = ['Matutino', 'Vespertino', 'Noturno'];
const funcoes = ['Ataque', 'Defesa', 'Levantador', 'Ponteiro', 'Líbero', 'Tanto faz'];
const niveis: NivelExperiencia[] = ['Iniciante', 'Intermediário', 'Avançado', 'Competitivo'];
const disp: PeriodoDisponivel[] = ['manha', 'tarde', 'tanto_faz', 'tanto_faz', 'nao_consigo'];

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function slug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '.');
}
function uid(): string {
  return `seed_${Math.random().toString(36).slice(2, 10)}`;
}

function fazAtleta(nome: string, sexo: Exclude<Sexo, undefined>): Atleta {
  const cat: Categoria = 'indefinido'; // definido no dia — igual à realidade
  return {
    id: uid(),
    nome,
    email: `${slug(nome)}@sempreceub.com`,
    whatsapp: `619${ri(10000000, 99999999)}`,
    matricula: `2024${ri(100000, 999999)}`,
    turno: rnd(turnos),
    curso: rnd(cursos),
    nivelExperiencia: rnd(niveis),
    funcaoPreferida: rnd(funcoes),
    interesseQuadra: Math.random() < 0.5,
    periodoDisponivel: rnd(disp),
    observacoesInscricao: Math.random() < 0.3 ? 'Já jogo em ligas amadoras.' : '',
    carimboInscricao: new Date(Date.now() - ri(1, 20) * 86400000).toLocaleString('pt-BR'),
    sexo,
    categoria: cat,
    presente: false,
    avaliacao: avaliacaoVazia(),
    fases: {},
    origem: 'inscricao'
  };
}

/** Gera atletas de exemplo (para testar antes do dia). Categoria/sexo ficam "a definir". */
export function gerarSeed(): Atleta[] {
  const atletas: Atleta[] = [];
  nomesF.forEach((n) => atletas.push(fazAtleta(n, 'F')));
  nomesM.forEach((n) => atletas.push(fazAtleta(n, 'M')));
  // No seed, o sexo vem preenchido só para facilitar o teste; no CSV real vem vazio.
  return atletas;
}
