# Seletiva de Vôlei de Areia — IESB 🏐

App **offline-first**, **mobile-first** e em **português** para usar no dia da seletiva de vôlei de
areia do Time IESB, no Parque da Cidade (Brasília). Faça **check-in**, **avalie** os atletas com uma
rubrica técnica/física/tática, organize a **dinâmica** (manhã/tarde × categorias), gere **rankings** e
**exporte** o resultado — tudo **sem internet** e **sem perder dados**.

> **#FirmeNaAreia**

## ✨ Principais recursos

- **100% offline** — roda no navegador, sem backend, sem login, sem nuvem. Instalável como **PWA**.
- **Salvamento automático** em cada ação (IndexedDB, com fallback para localStorage). Nada se perde ao
  recarregar ou cair a conexão.
- **Importar CSV** do Google Forms/Sheets, com reconhecimento flexível de colunas e tela de mapeamento.
- **Check-in em um toque**, categorias e período definidos no dia.
- **Avaliação** com rubrica 0–5 (Técnico/Físico/Tático), nota final ponderada e modo rápido.
- **Ranking por categoria**, titulares/reservas por vagas, comparação lado a lado.
- **Formação** de duplas (F/M) e quarteto misto com nota média.
- **Cronograma editável**, listas de chamada e **cronômetro** para as estações.
- **Exportar** CSV/JSON, **resumo imprimível (PDF)** e **backup/restauração** completos.

## 🚀 Rodando o projeto

```bash
npm install      # instala as dependências
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build estático em dist/
npm run preview  # pré-visualiza o build
```

O `npm run build` gera uma pasta `dist/` estática que pode ser hospedada no **GitHub Pages** ou aberta
localmente. O `base` já está configurado como relativo (`./`), então funciona em subpasta.

> Os ícones do PWA são gerados por script: `npm run icons` (já versionados em `public/icons`).

## 📥 Como importar o CSV do formulário

1. No Google Sheets das respostas: **Arquivo → Fazer download → Valores separados por vírgula (.csv)**.
2. No app, abra **Importar** (no Painel ou na lista de Atletas) → **Selecionar arquivo CSV**.
3. O app reconhece as colunas automaticamente (nome, e-mail, WhatsApp, turno, nível, etc.), ignorando
   diferenças de acento e maiúsculas. Confira/ajuste o mapeamento e confirme.
4. **Categoria e sexo não vêm do formulário** — ficam como “a definir” e você preenche no check-in.
5. **Reimportação incremental:** importar a planilha atualizada **não apaga** avaliações já feitas
   (o casamento é por e-mail/WhatsApp). Atletas que aparecem sem inscrição podem ser adicionados com
   **+ Atleta manual**.

## 📝 Como avaliar

1. Faça o **check-in** do atleta (na lista, na ficha ou na chamada da Seletiva).
2. Na ficha, defina **categoria**, **período** (manhã/tarde) e, se precisar, **sexo** e **nº de colete**.
3. Toque em **Avaliar**: dê notas **0–5** em cada item de Técnico, Físico e Tático. A **nota final**
   (média ponderada) é calculada automaticamente. Marque **⭐ destaque** e a **recomendação**
   (titular/reserva/cortado), se quiser.
4. Use **Próximo →** para avaliar em sequência, ou **pular para o próximo que falta avaliar**.
5. Os **pesos** das dimensões e o **nº de vagas** por categoria são editáveis em **Configurações**.

## 📊 Ranking e seleção

- Em **Ranking**, escolha a categoria: a lista já vem ordenada pela nota, destacando **titulares**
  (verde) e **reservas** (dourado) conforme as vagas configuradas.
- **Comparar** até 3 atletas lado a lado (botão ⇄).
- **Aplicar seleção pelas vagas** marca automaticamente titular/reserva/cortado.
- Monte **duplas e quarteto** na aba **Seletiva → Duplas**.

## 📤 Exportar e fazer backup

Na aba **Exportar**:

- **CSV completo** — todos os dados + notas por critério + nota final + recomendação.
- **Formação** — grupos montados com nota média.
- **Resumo imprimível / PDF** — titulares e reservas por categoria (use “Salvar como PDF”).
- **Backup (JSON)** — baixa **tudo**. Para **restaurar**, é só selecionar o arquivo JSON.

> 💡 **Dica para o dia:** instale o app na tela inicial do celular (menu do navegador → “Adicionar à
> tela inicial”) e faça um **backup JSON** de tempos em tempos. É a sua rede de segurança.

## 🎨 Identidade visual

Vermelho `#C8102E`, dourado `#E9C169`, vermelho escuro `#7C0E1E`, texto `#241014` e fundo claro
`#FFF7F3`. Títulos em **Oswald**, corpo em **Inter** (com fallback para fontes do sistema, para
funcionar mesmo offline).

## 🧱 Stack

React + Vite + TypeScript · Tailwind CSS · Zustand (estado) · localforage (IndexedDB) · PapaParse (CSV)
· vite-plugin-pwa (offline/instalável). Tudo estático, sem APIs externas.

---

Feito para o **Time IESB**. **#FirmeNaAreia** 🔴🟡
