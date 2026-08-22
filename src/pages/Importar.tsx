import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  type CampoAtleta,
  CAMPOS,
  linhasParaAtletas,
  parseCSV,
  sugerirMapeamento,
  type ResultadoParse
} from '../lib/csv';
import { gerarSeed } from '../lib/seed';
import { lerAvaliacoes, lerRoster, mesclarAvaliacoes } from '../lib/sync';
import { Confirmar, useToast } from '../components/ui';

const OPCOES_CAMPO: [CampoAtleta, string][] = [
  ['ignorar', '— Ignorar —'],
  ...CAMPOS.map((c) => [c.campo, c.label] as [CampoAtleta, string])
];

export default function Importar() {
  const nav = useNavigate();
  const upsert = useStore((s) => s.upsertAtletas);
  const addManual = useStore((s) => s.addAtletaManual);
  const carregarEstado = useStore((s) => s.carregarEstado);
  const mesclarAtletas = useStore((s) => s.mesclarAtletas);
  const { mostrar, Toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const rosterRef = useRef<HTMLInputElement>(null);
  const avalRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ResultadoParse | null>(null);
  const [mapa, setMapa] = useState<Record<string, CampoAtleta>>({});
  const [manual, setManual] = useState(false);
  const [confirmRoster, setConfirmRoster] = useState<string | null>(null);

  async function onRoster(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setConfirmRoster(await file.text());
    e.target.value = '';
  }

  async function onAvaliacoes(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const pacote = lerAvaliacoes(await file.text());
      const atual = useStore.getState().atletas;
      const { atletas, resumo } = mesclarAvaliacoes(atual, pacote, { substituir: false });
      mesclarAtletas(atletas);
      mostrar(
        `De ${pacote.avaliador}: ${resumo.atletasAtualizados} atualizados · ${resumo.notasNovas} notas · ${resumo.fasesAplicadas} fases` +
          (resumo.naoEncontrados ? ` · ${resumo.naoEncontrados} não encontrados` : '')
      );
    } catch (err) {
      mostrar('Falha: ' + (err as Error).message);
    }
    e.target.value = '';
  }

  async function onArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const texto = await file.text();
    const res = await parseCSV(texto);
    setParsed(res);
    setMapa(sugerirMapeamento(res.cabecalhos));
    e.target.value = '';
  }

  function confirmarImportacao() {
    if (!parsed) return;
    const atletas = linhasParaAtletas(parsed.linhas, mapa);
    const r = upsert(atletas);
    mostrar(`${r.adicionados} novos · ${r.atualizados} atualizados`);
    setParsed(null);
    setTimeout(() => nav('/atletas'), 900);
  }

  return (
    <div>
      <button onClick={() => nav(-1)} className="text-sm text-marca-vermelho font-semibold mb-3">
        ← Voltar
      </button>
      <h1 className="text-2xl text-marca-vermelho mb-4">Importar atletas</h1>

      {!parsed && !manual && (
        <>
          <div className="card p-5 mb-4 text-center">
            <div className="text-4xl mb-2">📄</div>
            <h2 className="text-lg mb-1">Planilha do Google Forms</h2>
            <p className="text-sm text-marca-texto/60 mb-4">
              Exporte a planilha de respostas como <b>CSV</b> e selecione o arquivo. As colunas são
              reconhecidas automaticamente.
            </p>
            <button className="btn-primario w-full" onClick={() => fileRef.current?.click()}>
              Selecionar arquivo CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onArquivo} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="btn-fantasma" onClick={() => setManual(true)}>
              + Atleta manual
            </button>
            <button
              className="btn-fantasma"
              onClick={() => {
                const r = upsert(gerarSeed());
                mostrar(`${r.adicionados} de exemplo`);
                setTimeout(() => nav('/atletas'), 900);
              }}
            >
              Dados de exemplo
            </button>
          </div>

          <h2 className="text-sm text-marca-texto/50 mb-2">Trabalho em equipe</h2>
          <div className="card divide-y divide-marca-dourado/20 mb-3">
            <button
              className="w-full text-left p-4 active:bg-marca-dourado/10"
              onClick={() => rosterRef.current?.click()}
            >
              <div className="font-semibold">📋 Carregar lista compartilhada</div>
              <div className="text-xs text-marca-texto/50 mt-0.5">
                Para avaliadores: abre a lista de atletas enviada pelo organizador (substitui os dados deste aparelho).
              </div>
            </button>
            <button
              className="w-full text-left p-4 active:bg-marca-dourado/10"
              onClick={() => avalRef.current?.click()}
            >
              <div className="font-semibold">📥 Receber avaliações de um avaliador</div>
              <div className="text-xs text-marca-texto/50 mt-0.5">
                Para o organizador: junta ao aparelho central o arquivo de avaliações enviado por um amigo.
              </div>
            </button>
          </div>
          <input ref={rosterRef} type="file" accept="application/json,.json" className="hidden" onChange={onRoster} />
          <input ref={avalRef} type="file" accept="application/json,.json" className="hidden" onChange={onAvaliacoes} />
        </>
      )}

      <Confirmar
        aberto={!!confirmRoster}
        titulo="Carregar lista compartilhada?"
        mensagem="Isto substitui os atletas e configurações deste aparelho pela lista recebida. Use no celular do avaliador antes de começar."
        textoConfirmar="Carregar"
        onCancelar={() => setConfirmRoster(null)}
        onConfirmar={() => {
          try {
            const pacote = lerRoster(confirmRoster!);
            const meu = useStore.getState().config;
            // Quem carrega a lista entra como AVALIADOR: herda os ajustes do evento,
            // mas mantém a própria identidade e NÃO vira central.
            const config = {
              ...meu,
              pesos: pacote.config.pesos,
              escalaMax: pacote.config.escalaMax,
              vagas: pacote.config.vagas,
              fases: pacote.config.fases,
              evento: {
                ...meu.evento,
                nome: pacote.config.evento.nome,
                local: pacote.config.evento.local,
                data: pacote.config.evento.data,
                whatsappOrganizador: pacote.config.evento.whatsappOrganizador || meu.evento.whatsappOrganizador
              },
              central: false,
              centralDefinidoPor: pacote.centralAparelho || meu.centralDefinidoPor
            };
            carregarEstado({
              atletas: Object.fromEntries(pacote.atletas.map((a) => [a.id, a])),
              config,
              grupos: [],
              cronograma: [],
              proximaOrdemChegada: 1
            });
            mostrar(`${pacote.atletas.length} atletas carregados`);
            setTimeout(() => nav('/atletas'), 900);
          } catch (err) {
            mostrar('Falha: ' + (err as Error).message);
          }
          setConfirmRoster(null);
        }}
      />

      {parsed && (
        <div>
          <div className="card p-4 mb-4">
            <h2 className="text-sm text-marca-texto/50 mb-1">Conferir colunas</h2>
            <p className="text-xs text-marca-texto/50 mb-3">
              {parsed.linhas.length} linhas. Ajuste se alguma coluna não bateu. Deduplicamos por e-mail/WhatsApp e
              preservamos avaliações já feitas.
            </p>
            <div className="flex flex-col gap-2">
              {parsed.cabecalhos.map((cab) => (
                <div key={cab} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 text-sm truncate" title={cab}>
                    {cab}
                    <div className="text-[11px] text-marca-texto/40 truncate">
                      {(parsed.linhas[0]?.[cab] || '').slice(0, 40) || '—'}
                    </div>
                  </div>
                  <span className="text-marca-texto/30">→</span>
                  <select
                    value={mapa[cab] || 'ignorar'}
                    onChange={(e) => setMapa((m) => ({ ...m, [cab]: e.target.value as CampoAtleta }))}
                    className="campo py-1.5 w-40 text-sm"
                  >
                    {OPCOES_CAMPO.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-fantasma flex-1" onClick={() => setParsed(null)}>
              Cancelar
            </button>
            <button className="btn-primario flex-1" onClick={confirmarImportacao}>
              Importar {parsed.linhas.length}
            </button>
          </div>
        </div>
      )}

      {manual && (
        <FormManual
          onCancelar={() => setManual(false)}
          onSalvar={(dados) => {
            addManual(dados);
            mostrar('Atleta adicionado');
            setManual(false);
            setTimeout(() => nav('/atletas'), 600);
          }}
        />
      )}
      <Toast />
    </div>
  );
}

function FormManual({
  onSalvar,
  onCancelar
}: {
  onSalvar: (d: { nome: string; whatsapp: string; curso: string; funcaoPreferida: string; presente: boolean }) => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [curso, setCurso] = useState('');
  const [funcao, setFuncao] = useState('');
  const [presente, setPresente] = useState(true);

  return (
    <div className="card p-4">
      <h2 className="text-lg mb-3">Atleta manual (walk-in)</h2>
      <label className="rotulo">Nome *</label>
      <input className="campo mb-3" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      <label className="rotulo">WhatsApp</label>
      <input className="campo mb-3" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="rotulo">Curso</label>
          <input className="campo" value={curso} onChange={(e) => setCurso(e.target.value)} />
        </div>
        <div>
          <label className="rotulo">Função</label>
          <input className="campo" value={funcao} onChange={(e) => setFuncao(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 mb-4 text-sm">
        <input type="checkbox" checked={presente} onChange={(e) => setPresente(e.target.checked)} className="w-4 h-4 accent-marca-vermelho" />
        Já fazer check-in (presente)
      </label>
      <div className="flex gap-2">
        <button className="btn-fantasma flex-1" onClick={onCancelar}>
          Cancelar
        </button>
        <button
          className="btn-primario flex-1 disabled:opacity-40"
          disabled={!nome.trim()}
          onClick={() => onSalvar({ nome: nome.trim(), whatsapp, curso, funcaoPreferida: funcao, presente })}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
