import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CATEGORIAS_REAIS, CATEGORIA_LABEL, configPadrao, type Categoria } from '../types';
import { Confirmar, useToast } from '../components/ui';

export default function Configuracoes() {
  const nav = useNavigate();
  const config = useStore((s) => s.config);
  const setConfig = useStore((s) => s.setConfig);
  const limparTudo = useStore((s) => s.limparTudo);
  const { mostrar, Toast } = useToast();
  const [confirmarLimpar, setConfirmarLimpar] = useState(false);

  const somaPesos = config.pesos.tecnico + config.pesos.fisico + config.pesos.tatico;

  function setPeso(dim: 'tecnico' | 'fisico' | 'tatico', pct: number) {
    setConfig({ pesos: { ...config.pesos, [dim]: pct / 100 } });
  }

  function setVaga(cat: Exclude<Categoria, 'indefinido'>, campo: 'titulares' | 'reservas', v: number) {
    setConfig({ vagas: { ...config.vagas, [cat]: { ...config.vagas[cat], [campo]: Math.max(0, v) } } });
  }

  return (
    <div>
      <button onClick={() => nav(-1)} className="text-sm text-marca-vermelho font-semibold mb-3">
        ← Voltar
      </button>
      <h1 className="text-2xl text-marca-vermelho mb-4">Configurações</h1>

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-marca-texto/50">Pesos das dimensões</h2>
          <span className={`chip ${Math.abs(somaPesos - 1) < 0.001 ? 'bg-green-100 text-green-700' : 'bg-marca-vermelho/15 text-marca-vermelho'}`}>
            soma {Math.round(somaPesos * 100)}%
          </span>
        </div>
        {([['tecnico', 'Técnico'], ['fisico', 'Físico'], ['tatico', 'Tático']] as const).map(([k, label]) => (
          <div key={k} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{label}</span>
              <span className="tabular-nums text-marca-vermelho font-semibold">{Math.round(config.pesos[k] * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(config.pesos[k] * 100)}
              onChange={(e) => setPeso(k, Number(e.target.value))}
              className="w-full accent-marca-vermelho"
            />
          </div>
        ))}
        <p className="text-xs text-marca-texto/50">A nota final é a média ponderada. Ideal a soma dar 100%.</p>
        <button
          className="btn-fantasma w-full mt-3 text-sm"
          onClick={() => setConfig({ pesos: configPadrao().pesos })}
        >
          Restaurar 50/25/25
        </button>
      </div>

      <div className="card p-4 mb-4">
        <h2 className="text-sm text-marca-texto/50 mb-3">Escala das notas</h2>
        <div className="flex gap-2">
          {[5, 10].map((v) => (
            <button
              key={v}
              onClick={() => setConfig({ escalaMax: v })}
              className={`btn flex-1 ${config.escalaMax === v ? 'bg-marca-vermelho text-white' : 'bg-white border border-marca-dourado/40'}`}
            >
              0 – {v}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h2 className="text-sm text-marca-texto/50 mb-3">Vagas por categoria</h2>
        <div className="flex flex-col gap-3">
          {CATEGORIAS_REAIS.map((cat) => (
            <div key={cat} className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium flex-1">{CATEGORIA_LABEL[cat]}</span>
              <NumSpin label="Tit." valor={config.vagas[cat].titulares} onChange={(v) => setVaga(cat, 'titulares', v)} />
              <NumSpin label="Res." valor={config.vagas[cat].reservas} onChange={(v) => setVaga(cat, 'reservas', v)} />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 border-marca-vermelho/30">
        <h2 className="text-sm text-marca-vermelho mb-2">Zona de perigo</h2>
        <button className="btn-perigo w-full" onClick={() => setConfirmarLimpar(true)}>
          Apagar todos os dados
        </button>
      </div>

      <Confirmar
        aberto={confirmarLimpar}
        titulo="Apagar tudo?"
        mensagem="Todos os atletas, avaliações e configurações serão apagados. Faça um backup antes (aba Exportar)."
        textoConfirmar="Apagar tudo"
        perigo
        onCancelar={() => setConfirmarLimpar(false)}
        onConfirmar={() => {
          limparTudo();
          setConfirmarLimpar(false);
          mostrar('Dados apagados');
          setTimeout(() => nav('/'), 700);
        }}
      />
      <Toast />
    </div>
  );
}

function NumSpin({ label, valor, onChange }: { label: string; valor: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-marca-texto/40">{label}</span>
      <button onClick={() => onChange(valor - 1)} className="w-8 h-8 rounded-lg border border-marca-dourado/40 font-bold">
        −
      </button>
      <span className="w-6 text-center tabular-nums font-semibold">{valor}</span>
      <button onClick={() => onChange(valor + 1)} className="w-8 h-8 rounded-lg border border-marca-dourado/40 font-bold">
        +
      </button>
    </div>
  );
}
