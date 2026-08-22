import {
  type Atleta,
  type Config,
  CATEGORIA_LABEL,
  PERIODO_LABEL,
  RECOMENDACAO_LABEL,
  STATUS_FASE_LABEL
} from '../types';
import { mediaFisico, mediaTatico, mediaTecnico, nota10, notaFinalAtleta } from './scoring';
import { carregarImagem } from './photo';
import { normalizarZap } from '../store/useStore';

/** Texto resumido do atleta para enviar no WhatsApp. */
export function resumoTextoAtleta(atleta: Atleta, config: Config): string {
  const av = atleta.avaliacao;
  const linhas: string[] = [];
  linhas.push(`🏐 *${atleta.nome}*`);
  if (atleta.numeroColete) linhas.push(`Colete: #${atleta.numeroColete}`);
  if (atleta.categoria !== 'indefinido') linhas.push(`Categoria: ${CATEGORIA_LABEL[atleta.categoria]}`);
  if (atleta.periodoAlocado) linhas.push(`Período: ${PERIODO_LABEL[atleta.periodoAlocado]}`);
  if (atleta.curso) linhas.push(`Curso: ${atleta.curso}`);
  if (atleta.funcaoPreferida) linhas.push(`Função: ${atleta.funcaoPreferida}`);
  if (atleta.nivelExperiencia) linhas.push(`Nível: ${atleta.nivelExperiencia}`);
  if (atleta.whatsapp) linhas.push(`WhatsApp: ${atleta.whatsapp}`);
  linhas.push('');
  linhas.push(`*Nota final: ${notaFinalAtleta(atleta, config).toFixed(2)}/${config.escalaMax}* (${nota10(atleta, config).toFixed(1)}/10)`);
  linhas.push(`• Técnico: ${mediaTecnico(av).toFixed(1)}`);
  linhas.push(`• Físico: ${mediaFisico(av).toFixed(1)}`);
  linhas.push(`• Tático: ${mediaTatico(av).toFixed(1)}`);
  if (av.destaque) linhas.push('⭐ Destaque');
  if (av.recomendacao !== 'indefinido') linhas.push(`Recomendação: ${RECOMENDACAO_LABEL[av.recomendacao]}`);
  const fases = config.fases
    .map((f) => {
      const fa = atleta.fases?.[f.id];
      if (!fa || (fa.status === 'pendente' && !fa.obs)) return null;
      const st = STATUS_FASE_LABEL[fa.status];
      return `• ${f.nome}: ${st}${fa.obs ? ` — ${fa.obs}` : ''}`;
    })
    .filter(Boolean);
  if (fases.length) {
    linhas.push('');
    linhas.push('*Fases:*');
    linhas.push(...(fases as string[]));
  }
  if (av.observacoesAvaliacao) {
    linhas.push('');
    linhas.push(`Obs: ${av.observacoesAvaliacao}`);
  }
  linhas.push('');
  linhas.push('#FirmeNaAreia · Seletiva IESB');
  return linhas.join('\n');
}

/** Texto consolidado de todos os atletas (para envio em massa por texto). */
export function resumoTextoGeral(atletas: Atleta[], config: Config): string {
  const ranked = atletas
    .slice()
    .sort((a, b) => notaFinalAtleta(b, config) - notaFinalAtleta(a, config));
  const linhas = [`🏐 *${config.evento.nome}*`, config.evento.local, ''];
  ranked.forEach((a, i) => {
    linhas.push(
      `${i + 1}. ${a.nome} — ${notaFinalAtleta(a, config).toFixed(2)}/${config.escalaMax}${
        a.avaliacao.destaque ? ' ⭐' : ''
      }${a.avaliacao.recomendacao !== 'indefinido' ? ` (${RECOMENDACAO_LABEL[a.avaliacao.recomendacao]})` : ''}`
    );
  });
  linhas.push('', '#FirmeNaAreia');
  return linhas.join('\n');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Gera um card visual (PNG) do atleta com foto + dados + notas + fases. */
export async function gerarCardAtleta(
  atleta: Atleta,
  config: Config
): Promise<{ blob: Blob; dataUrl: string }> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Fundo gradiente da marca
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#7C0E1E');
  g.addColorStop(1, '#4A0810');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Faixa superior
  ctx.fillStyle = '#C8102E';
  ctx.fillRect(0, 0, W, 150);
  ctx.fillStyle = '#E9C169';
  ctx.fillRect(0, 150, W, 6);
  ctx.fillStyle = '#fff';
  ctx.font = '700 46px Georgia, serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('Seletiva Vôlei de Areia', 60, 62);
  ctx.fillStyle = '#E9C169';
  ctx.font = '700 30px Arial';
  ctx.fillText('TIME IESB · #FirmeNaAreia', 60, 108);

  // Foto (círculo) ou inicial
  const cx = 200;
  const cy = 340;
  const rphoto = 130;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rphoto, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (atleta.foto) {
    try {
      const img = await carregarImagem(atleta.foto);
      const s = Math.max((rphoto * 2) / img.width, (rphoto * 2) / img.height);
      const dw = img.width * s;
      const dh = img.height * s;
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    } catch {
      desenharInicial(ctx, cx, cy, rphoto, atleta.nome);
    }
  } else {
    desenharInicial(ctx, cx, cy, rphoto, atleta.nome);
  }
  ctx.restore();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#E9C169';
  ctx.beginPath();
  ctx.arc(cx, cy, rphoto, 0, Math.PI * 2);
  ctx.stroke();

  // Nome e dados ao lado da foto
  ctx.fillStyle = '#fff';
  ctx.font = '700 54px Georgia, serif';
  ctx.textBaseline = 'top';
  wrapText(ctx, atleta.nome, 370, 235, 650, 58);
  ctx.fillStyle = '#F3D9A8';
  ctx.font = '400 30px Arial';
  const infos = [
    atleta.numeroColete ? `Colete #${atleta.numeroColete}` : '',
    atleta.categoria !== 'indefinido' ? CATEGORIA_LABEL[atleta.categoria] : '',
    atleta.periodoAlocado ? PERIODO_LABEL[atleta.periodoAlocado] : '',
    atleta.curso
  ].filter(Boolean);
  ctx.fillText(infos.join('  ·  ').slice(0, 60), 370, 360);
  if (atleta.funcaoPreferida) ctx.fillText(`Função: ${atleta.funcaoPreferida}`, 370, 405);

  // Nota final grande
  let y = 520;
  roundRect(ctx, 60, y, W - 120, 180, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.fillStyle = '#E9C169';
  ctx.font = '700 34px Arial';
  ctx.textBaseline = 'top';
  ctx.fillText('NOTA FINAL', 100, y + 40);
  ctx.fillStyle = '#fff';
  ctx.font = '700 120px Georgia, serif';
  ctx.fillText(notaFinalAtleta(atleta, config).toFixed(2), 100, y + 60);
  ctx.fillStyle = '#F3D9A8';
  ctx.font = '400 40px Arial';
  ctx.fillText(`/ ${config.escalaMax}`, 400, y + 130);
  if (atleta.avaliacao.destaque) {
    ctx.fillStyle = '#E9C169';
    ctx.font = '700 60px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('⭐ DESTAQUE', W - 100, y + 60);
    ctx.textAlign = 'left';
  }

  // Barras das dimensões
  y += 230;
  const dims: [string, number][] = [
    ['Técnico', mediaTecnico(atleta.avaliacao)],
    ['Físico', mediaFisico(atleta.avaliacao)],
    ['Tático', mediaTatico(atleta.avaliacao)]
  ];
  ctx.font = '700 34px Arial';
  for (const [label, val] of dims) {
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 60, y + 26);
    const bx = 320;
    const bw = W - 320 - 160;
    roundRect(ctx, bx, y + 10, bw, 34, 17);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    roundRect(ctx, bx, y + 10, (bw * val) / config.escalaMax, 34, 17);
    ctx.fillStyle = '#E9C169';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), W - 60, y + 26);
    ctx.textAlign = 'left';
    y += 58;
  }

  // Recomendação
  if (atleta.avaliacao.recomendacao !== 'indefinido') {
    y += 12;
    const cor =
      atleta.avaliacao.recomendacao === 'titular'
        ? '#1f9d55'
        : atleta.avaliacao.recomendacao === 'reserva'
          ? '#E9C169'
          : '#C8102E';
    roundRect(ctx, 60, y, 360, 66, 33);
    ctx.fillStyle = cor;
    ctx.fill();
    ctx.fillStyle = atleta.avaliacao.recomendacao === 'reserva' ? '#241014' : '#fff';
    ctx.font = '700 34px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(RECOMENDACAO_LABEL[atleta.avaliacao.recomendacao].toUpperCase(), 240, y + 34);
    ctx.textAlign = 'left';
    y += 90;
  } else {
    y += 20;
  }

  // Fases (resumo)
  const fasesTxt = config.fases
    .map((f) => {
      const fa = atleta.fases?.[f.id];
      if (!fa || (fa.status === 'pendente' && !fa.obs)) return null;
      return `${f.nome}: ${STATUS_FASE_LABEL[fa.status]}${fa.obs ? ` — ${fa.obs}` : ''}`;
    })
    .filter(Boolean) as string[];
  if (fasesTxt.length) {
    ctx.fillStyle = '#E9C169';
    ctx.font = '700 30px Arial';
    ctx.textBaseline = 'top';
    ctx.fillText('FASES', 60, y);
    y += 44;
    ctx.fillStyle = '#fff';
    ctx.font = '400 28px Arial';
    for (const t of fasesTxt.slice(0, 6)) {
      y = wrapText(ctx, '• ' + t, 60, y, W - 120, 36) + 8;
      if (y > H - 120) break;
    }
  }

  // Observações
  if (atleta.avaliacao.observacoesAvaliacao && y < H - 160) {
    ctx.fillStyle = '#F3D9A8';
    ctx.font = 'italic 400 28px Arial';
    wrapText(ctx, '“' + atleta.avaliacao.observacoesAvaliacao + '”', 60, y + 6, W - 120, 36);
  }

  // Rodapé
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '400 26px Arial';
  ctx.textBaseline = 'bottom';
  ctx.fillText(config.evento.local || 'Seletiva IESB', 60, H - 40);

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
  return { blob, dataUrl };
}

function desenharInicial(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, nome: string) {
  ctx.fillStyle = '#C8102E';
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = '#fff';
  ctx.font = '700 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((nome[0] || '?').toUpperCase(), cx, cy + 6);
  ctx.textAlign = 'left';
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number
): number {
  const palavras = text.split(' ');
  let linha = '';
  let yy = y;
  for (const p of palavras) {
    const teste = linha ? linha + ' ' + p : p;
    if (ctx.measureText(teste).width > maxW && linha) {
      ctx.fillText(linha, x, yy);
      linha = p;
      yy += lh;
    } else {
      linha = teste;
    }
  }
  if (linha) {
    ctx.fillText(linha, x, yy);
    yy += lh;
  }
  return yy;
}

export function baixarBlob(nome: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

export function linkWhatsAppTexto(config: Config, texto: string): string {
  const num = normalizarZap(config.evento.whatsappOrganizador);
  const base = num ? `https://wa.me/${num.startsWith('55') ? num : '55' + num}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(texto)}`;
}

export type ResultadoEnvio = 'compartilhado' | 'baixado';

/**
 * Envia o atleta ao WhatsApp:
 * 1) tenta compartilhar o card (imagem) + texto pelo menu do celular (Web Share);
 * 2) se não houver suporte, baixa o card e abre a conversa (wa.me) com o texto.
 */
export async function enviarAtletaWhatsApp(atleta: Atleta, config: Config): Promise<ResultadoEnvio> {
  const { blob, dataUrl } = await gerarCardAtleta(atleta, config);
  const texto = resumoTextoAtleta(atleta, config);
  const nomeArq = `atleta_${slug(atleta.nome)}.png`;
  const file = new File([blob], nomeArq, { type: 'image/png' });

  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: atleta.nome, text: texto });
      return 'compartilhado';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'compartilhado';
      // cai para o fallback
    }
  }
  // fallback: baixa a imagem e abre a conversa com o texto
  baixarBlob(nomeArq, blob);
  void dataUrl;
  window.open(linkWhatsAppTexto(config, texto), '_blank');
  return 'baixado';
}
