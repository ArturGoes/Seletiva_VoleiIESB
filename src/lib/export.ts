import Papa from 'papaparse';
import {
  type Atleta,
  type Config,
  type EstadoApp,
  type Grupo,
  CATEGORIA_LABEL,
  PERIODO_DISP_LABEL,
  RECOMENDACAO_LABEL,
  TECNICO_LABELS,
  FISICO_LABELS,
  TATICO_LABELS
} from '../types';
import { mediaFisico, mediaTatico, mediaTecnico, notaFinalAtleta } from './scoring';

export function baixarArquivo(nome: string, conteudo: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function dataArquivo(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

export function exportarBackupJSON(estado: EstadoApp) {
  const payload = { app: 'seletiva-iesb', versao: 1, exportadoEm: new Date().toISOString(), estado };
  baixarArquivo(`backup_seletiva_${dataArquivo()}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

export function lerBackupJSON(texto: string): EstadoApp {
  const obj = JSON.parse(texto);
  const estado = obj?.estado ?? obj;
  if (!estado || typeof estado !== 'object' || !('atletas' in estado)) {
    throw new Error('Arquivo de backup inválido: não contém "atletas".');
  }
  return estado as EstadoApp;
}

/** CSV completo: inscrição + notas por critério + nota final + recomendação. */
export function exportarCSVCompleto(atletas: Atleta[], config: Config) {
  const linhas = atletas.map((a) => {
    const av = a.avaliacao;
    const base: Record<string, string | number> = {
      Nome: a.nome,
      Email: a.email,
      WhatsApp: a.whatsapp,
      Matricula: a.matricula,
      Turno: a.turno,
      Curso: a.curso,
      Nivel: a.nivelExperiencia,
      FuncaoPreferida: a.funcaoPreferida,
      InteresseQuadraJUDF: a.interesseQuadra ? 'Sim' : 'Não',
      Categoria: CATEGORIA_LABEL[a.categoria],
      Sexo: a.sexo || '',
      Periodo: a.periodoAlocado === 'manha' ? 'Manhã' : a.periodoAlocado === 'tarde' ? 'Tarde' : '',
      Disponibilidade: PERIODO_DISP_LABEL[a.periodoDisponivel],
      Presente: a.presente ? 'Sim' : 'Não',
      HorarioCheckin: a.horarioCheckin ? new Date(a.horarioCheckin).toLocaleString('pt-BR') : '',
      Colete: a.numeroColete || ''
    };
    for (const [k, label] of Object.entries(TECNICO_LABELS)) {
      base[`Tec_${label}`] = av.tecnico[k as keyof typeof av.tecnico];
    }
    for (const [k, label] of Object.entries(FISICO_LABELS)) {
      base[`Fis_${label}`] = av.fisico[k as keyof typeof av.fisico];
    }
    for (const [k, label] of Object.entries(TATICO_LABELS)) {
      base[`Tat_${label}`] = av.tatico[k as keyof typeof av.tatico];
    }
    base['Media_Tecnico'] = round(mediaTecnico(av));
    base['Media_Fisico'] = round(mediaFisico(av));
    base['Media_Tatico'] = round(mediaTatico(av));
    base['Nota_Final'] = notaFinalAtleta(a, config);
    base['Destaque'] = av.destaque ? '⭐' : '';
    base['Recomendacao'] = RECOMENDACAO_LABEL[av.recomendacao];
    base['Avaliador'] = av.avaliador;
    base['Observacoes'] = av.observacoesAvaliacao;
    return base;
  });
  const csv = Papa.unparse(linhas);
  baixarArquivo(`seletiva_completo_${dataArquivo()}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
}

export function exportarFormacaoCSV(grupos: Grupo[], atletas: Record<string, Atleta>, config: Config) {
  const linhas: Record<string, string | number>[] = [];
  for (const g of grupos) {
    const membros = g.atletaIds.map((id) => atletas[id]).filter(Boolean);
    const media = membros.length
      ? round(membros.reduce((s, m) => s + notaFinalAtleta(m, config), 0) / membros.length)
      : 0;
    membros.forEach((m, i) => {
      linhas.push({
        Grupo: g.nome,
        Categoria: CATEGORIA_LABEL[g.categoria],
        Posicao: i + 1,
        Atleta: m.nome,
        NotaAtleta: notaFinalAtleta(m, config),
        MediaGrupo: media
      });
    });
  }
  const csv = Papa.unparse(linhas);
  baixarArquivo(`formacao_${dataArquivo()}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
