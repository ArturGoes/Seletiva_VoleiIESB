import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  baixarArquivo,
  exportarBackupJSON,
  exportarCSVCompleto,
  exportarFormacaoCSV,
  lerBackupJSON
} from '../lib/export';
import { Confirmar, useToast } from '../components/ui';
import { CATEGORIAS_REAIS, CATEGORIA_LABEL } from '../types';
import { foiAvaliado, notaFinalAtleta } from '../lib/scoring';
import { gerarCardAtleta, baixarBlob, linkWhatsAppTexto, resumoTextoGeral } from '../lib/whatsapp';
import { compartilharJSON, exportarAvaliacoes, exportarRoster } from '../lib/sync';

export default function Exportar() {
  const store = useStore();
  const { mostrar, Toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [gerando, setGerando] = useState('');

  const atletas = Object.values(store.atletas);
  const avaliados = atletas.filter((a) => foiAvaliado(a.avaliacao));

  async function baixarTodosCards() {
    const alvo = avaliados.length ? avaliados : atletas;
    for (let i = 0; i < alvo.length; i++) {
      setGerando(`Gerando cards… ${i + 1}/${alvo.length}`);
      const { blob } = await gerarCardAtleta(alvo[i], store.config);
      baixarBlob(`card_${String(i + 1).padStart(2, '0')}_${slugNome(alvo[i].nome)}.png`, blob);
      await new Promise((r) => setTimeout(r, 350));
    }
    setGerando('');
    mostrar(`${alvo.length} cards baixados`);
  }

  function estadoAtual() {
    return {
      atletas: store.atletas,
      config: store.config,
      grupos: store.grupos,
      cronograma: store.cronograma,
      proximaOrdemChegada: store.proximaOrdemChegada
    };
  }

  function onArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setConfirmRestore(String(reader.result));
    reader.readAsText(file);
    e.target.value = '';
  }

  function imprimirResumo() {
    const html = gerarResumoHTML(store);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400);
    } else {
      baixarArquivo('resumo_seletiva.html', html, 'text/html');
      mostrar('Pop-up bloqueado — baixamos o HTML.');
    }
  }

  return (
    <div>
      <h1 className="text-2xl text-marca-vermelho mb-1">Exportar & Backup</h1>
      <p className="text-sm text-marca-texto/60 mb-5">
        {atletas.length} atletas · {atletas.filter((a) => a.presente).length} presentes
      </p>

      <Grupo titulo="Trabalho em equipe (vários avaliadores)">
        <Acao
          titulo="Compartilhar lista de atletas"
          desc="Envie para os avaliadores. Eles abrem no app deles em Importar → Carregar lista compartilhada."
          onClick={async () => {
            const r = await compartilharJSON(
              `lista_atletas_${store.config.evento.nome ? '' : ''}seletiva.json`,
              exportarRoster(estadoAtual()),
              'Lista de atletas da Seletiva IESB — abra no app em Importar → Carregar lista compartilhada.',
              store.config
            );
            mostrar(r === 'compartilhado' ? 'Lista compartilhada!' : 'Lista baixada + WhatsApp aberto');
          }}
        />
        <Acao
          titulo="Enviar MINHAS avaliações ao organizador"
          desc="Gera um arquivo só com o que você avaliou neste aparelho, para o organizador juntar no aparelho central."
          onClick={async () => {
            const pacote = exportarAvaliacoes(estadoAtual());
            if (pacote.itens.length === 0) {
              mostrar('Você ainda não avaliou ninguém neste aparelho.');
              return;
            }
            const r = await compartilharJSON(
              `avaliacoes_${(store.config.avaliador || 'avaliador').replace(/\s+/g, '_')}.json`,
              JSON.stringify(pacote),
              `Avaliações de ${pacote.avaliador} — ${pacote.itens.length} atleta(s). Seletiva IESB.`,
              store.config
            );
            mostrar(r === 'compartilhado' ? `${pacote.itens.length} avaliações enviadas!` : 'Arquivo baixado + WhatsApp aberto');
          }}
        />
      </Grupo>

      <Grupo titulo="Enviar para o WhatsApp">
        <Acao
          titulo="Enviar resumo geral (texto)"
          desc={
            store.config.evento.whatsappOrganizador
              ? 'Abre sua conversa no WhatsApp com o ranking em texto.'
              : 'Configure “Meu WhatsApp” em Configurações para ir direto ao seu número.'
          }
          onClick={() => window.open(linkWhatsAppTexto(store.config, resumoTextoGeral(atletas, store.config)), '_blank')}
        />
        <Acao
          titulo={gerando || 'Baixar todos os cards (imagens)'}
          desc="Gera um card por atleta (foto + notas + fases) para você anexar/enviar no WhatsApp."
          onClick={() => {
            if (!gerando) baixarTodosCards();
          }}
        />
      </Grupo>

      <Grupo titulo="Resultados">
        <Acao
          titulo="CSV completo"
          desc="Dados + notas por critério + nota final + recomendação."
          onClick={() => {
            exportarCSVCompleto(atletas, store.config);
            mostrar('CSV exportado');
          }}
        />
        <Acao
          titulo="Formação (duplas/quarteto)"
          desc="Grupos montados com nota média."
          onClick={() => {
            exportarFormacaoCSV(store.grupos, store.atletas, store.config);
            mostrar('Formação exportada');
          }}
        />
        <Acao titulo="Resumo imprimível / PDF" desc="Titulares e reservas por categoria (use 'Salvar como PDF')." onClick={imprimirResumo} />
      </Grupo>

      <Grupo titulo="Backup (segurança)">
        <Acao
          titulo="Baixar backup completo (JSON)"
          desc="Tudo: atletas, notas, config, grupos e cronograma."
          onClick={() => {
            exportarBackupJSON(estadoAtual());
            mostrar('Backup baixado');
          }}
        />
        <Acao
          titulo="Restaurar backup (JSON)"
          desc="Substitui os dados atuais pelos do arquivo."
          onClick={() => inputRef.current?.click()}
          perigo
        />
        <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={onArquivo} />
      </Grupo>

      <Confirmar
        aberto={!!confirmRestore}
        titulo="Restaurar backup?"
        mensagem="Todos os dados atuais serão substituídos pelos do arquivo. Faça um backup antes se tiver dúvida."
        textoConfirmar="Restaurar"
        perigo
        onCancelar={() => setConfirmRestore(null)}
        onConfirmar={() => {
          try {
            const estado = lerBackupJSON(confirmRestore!);
            store.carregarEstado(estado);
            mostrar('Backup restaurado com sucesso');
          } catch (err) {
            mostrar('Falha ao ler o arquivo: ' + (err as Error).message);
          }
          setConfirmRestore(null);
        }}
      />
      <Toast />
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm text-marca-texto/50 mb-2">{titulo}</h2>
      <div className="card divide-y divide-marca-dourado/20">{children}</div>
    </div>
  );
}

function Acao({ titulo, desc, onClick, perigo }: { titulo: string; desc: string; onClick: () => void; perigo?: boolean }) {
  return (
    <button onClick={onClick} className="w-full text-left p-4 flex items-center justify-between gap-3 active:bg-marca-dourado/10">
      <div>
        <div className={`font-semibold ${perigo ? 'text-marca-vermelho' : ''}`}>{titulo}</div>
        <div className="text-xs text-marca-texto/50 mt-0.5">{desc}</div>
      </div>
      <span className="text-marca-texto/30 text-xl">↓</span>
    </button>
  );
}

/* ---- Resumo imprimível ---- */
function gerarResumoHTML(store: ReturnType<typeof useStore.getState>): string {
  const { config } = store;
  const atletas = Object.values(store.atletas);
  const secoes = CATEGORIAS_REAIS.map((cat) => {
    const vagas = config.vagas[cat];
    const ranked = atletas
      .filter((a) => a.categoria === cat)
      .sort((a, b) => notaFinalAtleta(b, config) - notaFinalAtleta(a, config));
    const linhas = ranked
      .map((a, i) => {
        const zona = i < vagas.titulares ? 'Titular' : i < vagas.titulares + vagas.reservas ? 'Reserva' : '—';
        const cor = zona === 'Titular' ? '#0a7d34' : zona === 'Reserva' ? '#B8860B' : '#999';
        return `<tr>
          <td>${i + 1}</td>
          <td>${escapar(a.nome)} ${a.avaliacao.destaque ? '⭐' : ''}</td>
          <td style="text-align:center">${notaFinalAtleta(a, config).toFixed(2)}</td>
          <td style="color:${cor};font-weight:600">${zona}</td>
        </tr>`;
      })
      .join('');
    return `<h2>${CATEGORIA_LABEL[cat]} <small>(${vagas.titulares} titulares + ${vagas.reservas} reservas)</small></h2>
      <table><thead><tr><th>#</th><th>Atleta</th><th>Nota</th><th>Situação</th></tr></thead>
      <tbody>${linhas || '<tr><td colspan=4 style="color:#999">Sem atletas</td></tr>'}</tbody></table>`;
  }).join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Resumo — Seletiva IESB</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;color:#241014;max-width:720px;margin:24px auto;padding:0 16px}
    h1{color:#C8102E;border-bottom:3px solid #E9C169;padding-bottom:8px;text-transform:uppercase}
    h2{color:#7C0E1E;margin-top:24px}small{font-weight:400;color:#888}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th,td{border-bottom:1px solid #eee;padding:6px 8px;text-align:left;font-size:14px}
    th{background:#faf1e6}
    .tag{color:#C8102E;font-weight:700;letter-spacing:2px}
    @media print{body{margin:0}}
  </style></head><body>
  <h1>Seletiva de Vôlei de Areia — IESB</h1>
  <p>Parque da Cidade · ${new Date().toLocaleDateString('pt-BR')} · <span class="tag">#FirmeNaAreia</span></p>
  ${secoes}
  <p style="margin-top:32px;color:#999;font-size:12px">Gerado pelo app da Seletiva IESB.</p>
  </body></html>`;
}

function slugNome(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function escapar(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] || c);
}
