import type { Atleta, Avaliacao, Config } from '../types';

function mediaValores(obj: Record<string, number>): number {
  const vals = Object.values(obj);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function mediaTecnico(a: Avaliacao): number {
  return mediaValores(a.tecnico as unknown as Record<string, number>);
}
export function mediaFisico(a: Avaliacao): number {
  return mediaValores(a.fisico as unknown as Record<string, number>);
}
export function mediaTatico(a: Avaliacao): number {
  return mediaValores(a.tatico as unknown as Record<string, number>);
}

/** Nota final = média ponderada das três dimensões (na escala configurada). */
export function notaFinal(a: Avaliacao, config: Config): number {
  const { tecnico, fisico, tatico } = config.pesos;
  const soma = tecnico + fisico + tatico || 1;
  const nota =
    (mediaTecnico(a) * tecnico + mediaFisico(a) * fisico + mediaTatico(a) * tatico) / soma;
  return Math.round(nota * 100) / 100;
}

/** Verdadeiro se o atleta recebeu ao menos uma nota > 0 em qualquer critério. */
export function foiAvaliado(a: Avaliacao): boolean {
  const todos = [
    ...Object.values(a.tecnico),
    ...Object.values(a.fisico),
    ...Object.values(a.tatico)
  ];
  return todos.some((v) => v > 0) || !!a.avaliadoEm;
}

export function notaFinalAtleta(atleta: Atleta, config: Config): number {
  return notaFinal(atleta.avaliacao, config);
}

/** Nota em uma escala 0..10 para exibição amigável, respeitando a escala configurada. */
export function nota10(atleta: Atleta, config: Config): number {
  const bruta = notaFinalAtleta(atleta, config);
  return Math.round((bruta / (config.escalaMax || 5)) * 10 * 10) / 10;
}
