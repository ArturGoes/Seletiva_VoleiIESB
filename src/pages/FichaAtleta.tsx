import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore, normalizarZap } from '../store/useStore';
import {
  type Categoria,
  type Periodo,
  type Sexo,
  CATEGORIAS_REAIS,
  CATEGORIA_LABEL,
  PERIODO_DISP_LABEL,
  PERIODO_LABEL
} from '../types';
import { Confirmar, NotaBadge, PresencaBadge } from '../components/ui';

export default function FichaAtleta() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const atleta = useStore((s) => s.atletas[id]);
  const updateAtleta = useStore((s) => s.updateAtleta);
  const toggleCheckin = useStore((s) => s.toggleCheckin);
  const removeAtleta = useStore((s) => s.removeAtleta);
  const [confirmar, setConfirmar] = useState(false);

  if (!atleta) {
    return (
      <div className="pt-10 text-center text-marca-texto/60">
        Atleta não encontrado.
        <div className="mt-4">
          <Link to="/atletas" className="btn-fantasma">
            Voltar à lista
          </Link>
        </div>
      </div>
    );
  }

  const zap = normalizarZap(atleta.whatsapp);
  const zapLink = zap ? `https://wa.me/${zap.startsWith('55') ? zap : '55' + zap}` : '';

  return (
    <div>
      <button onClick={() => nav(-1)} className="text-sm text-marca-vermelho font-semibold mb-3">
        ← Voltar
      </button>

      <div className="card p-4 mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl text-marca-texto leading-tight">
              {atleta.avaliacao.destaque && '⭐ '}
              {atleta.nome}
            </h1>
            <div className="text-sm text-marca-texto/60">{atleta.curso || '—'}</div>
          </div>
          <NotaBadge atleta={atleta} />
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <PresencaBadge presente={atleta.presente} />
          {atleta.horarioCheckin && (
            <span className="chip bg-green-50 text-green-700">
              {new Date(atleta.horarioCheckin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {atleta.origem === 'manual' && <span className="chip bg-marca-dourado/30 text-marca-escuro">Walk-in</span>}
        </div>
      </div>

      {/* Ações do dia */}
      <button
        onClick={() => toggleCheckin(atleta.id)}
        className={`w-full mb-4 ${atleta.presente ? 'btn-fantasma' : 'btn-primario'} text-lg min-h-[56px]`}
      >
        {atleta.presente ? '✓ Presente — tocar para desfazer' : 'Fazer Check-in'}
      </button>

      <Secao titulo="Definir no dia">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Categoria">
            <select
              className="campo"
              value={atleta.categoria}
              onChange={(e) => updateAtleta(atleta.id, { categoria: e.target.value as Categoria })}
            >
              <option value="indefinido">A definir</option>
              {CATEGORIAS_REAIS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABEL[c]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Sexo">
            <select
              className="campo"
              value={atleta.sexo || ''}
              onChange={(e) => updateAtleta(atleta.id, { sexo: (e.target.value || undefined) as Sexo })}
            >
              <option value="">—</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
              <option value="outro">Outro</option>
            </select>
          </Campo>
          <Campo label="Período">
            <select
              className="campo"
              value={atleta.periodoAlocado || ''}
              onChange={(e) =>
                updateAtleta(atleta.id, { periodoAlocado: (e.target.value || undefined) as Periodo })
              }
            >
              <option value="">—</option>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
            </select>
          </Campo>
          <Campo label="Nº colete">
            <input
              className="campo"
              inputMode="numeric"
              value={atleta.numeroColete || ''}
              onChange={(e) => updateAtleta(atleta.id, { numeroColete: e.target.value })}
              placeholder="ex: 12"
            />
          </Campo>
        </div>
        {atleta.periodoDisponivel === 'nao_consigo' && (
          <div className="mt-3 text-sm text-marca-vermelho bg-marca-vermelho/5 rounded-lg p-2">
            ⚠️ Este atleta declarou que <b>não consegue</b> neste domingo.
          </div>
        )}
      </Secao>

      <Secao titulo="Dados da inscrição">
        <dl className="text-sm divide-y divide-marca-dourado/20">
          <Item t="E-mail" v={atleta.email} />
          <Item
            t="WhatsApp"
            v={
              zapLink ? (
                <a href={zapLink} target="_blank" rel="noreferrer" className="text-green-700 font-semibold underline">
                  {atleta.whatsapp} ↗
                </a>
              ) : (
                atleta.whatsapp || '—'
              )
            }
          />
          <Item t="Matrícula" v={atleta.matricula} />
          <Item t="Turno" v={atleta.turno} />
          <Item t="Nível" v={atleta.nivelExperiencia || '—'} />
          <Item t="Função preferida" v={atleta.funcaoPreferida} />
          <Item t="Interesse quadra (JUDF 2027)" v={atleta.interesseQuadra ? 'Sim' : 'Não'} />
          <Item t="Disponibilidade" v={PERIODO_DISP_LABEL[atleta.periodoDisponivel]} />
          {atleta.observacoesInscricao && <Item t="Observações" v={atleta.observacoesInscricao} />}
          {atleta.carimboInscricao && <Item t="Inscrição em" v={atleta.carimboInscricao} />}
        </dl>
      </Secao>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link to={`/avaliar/${atleta.id}`} className="btn-primario">
          Avaliar atleta
        </Link>
        {atleta.periodoAlocado ? (
          <div className="btn-dourado pointer-events-none">
            {PERIODO_LABEL[atleta.periodoAlocado]}
          </div>
        ) : (
          <Link to="/seletiva" className="btn-fantasma">
            Alocar período
          </Link>
        )}
      </div>

      <button className="btn-perigo w-full" onClick={() => setConfirmar(true)}>
        Remover atleta
      </button>

      <Confirmar
        aberto={confirmar}
        titulo="Remover atleta?"
        mensagem={`"${atleta.nome}" e sua avaliação serão apagados. Esta ação não pode ser desfeita.`}
        textoConfirmar="Remover"
        perigo
        onCancelar={() => setConfirmar(false)}
        onConfirmar={() => {
          removeAtleta(atleta.id);
          nav('/atletas');
        }}
      />
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 mb-4">
      <h2 className="text-sm text-marca-texto/50 mb-3">{titulo}</h2>
      {children}
    </div>
  );
}
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="rotulo">{label}</label>
      {children}
    </div>
  );
}
function Item({ t, v }: { t: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-2">
      <dt className="text-marca-texto/50 shrink-0">{t}</dt>
      <dd className="text-right font-medium break-words">{v || '—'}</dd>
    </div>
  );
}
