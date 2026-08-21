# Seletiva de Vôlei de Areia — IESB 🏐

App **offline-first**, **mobile-first** e em **português** para usar no dia da seletiva de vôlei de
areia do Time IESB, no Parque da Cidade (Brasília). Faça **check-in**, **avalie** os atletas com uma
rubrica técnica/física/tática, organize a **dinâmica** (manhã/tarde × categorias), gere **rankings** e
**exporte** o resultado — tudo **sem internet** e **sem perder dados**.

> **#FirmeNaAreia**

## ✨ Principais recursos

- **100% offline** — roda no navegador, sem backend, sem login, sem nuvem. Instalável como **PWA**
  (ícone oficial do IESB na tela inicial).
- **Salvamento automático** em cada ação (IndexedDB, com fallback para localStorage). Nada se perde ao
  recarregar ou cair a conexão.
- **📸 Foto de cada atleta** — tira na hora pela câmera do celular (ou galeria); fica no card e no envio.
- **🧭 Fases da seletiva** — registre cada fase do dia (chegada, aquecimento, fundamentos, testes
  físicos, jogo avaliativo, decisão) com status e anotação por atleta. As fases são **editáveis**.
- **Avaliação individual** com rubrica 0–5 (Técnico/Físico/Tático), nota final ponderada e modo rápido.
- **📲 Enviar para o WhatsApp** — gera um **card com foto + dados + notas + fases** e compartilha
  direto no WhatsApp (Web Share no celular); no computador, baixa a imagem e abre sua conversa com o texto.
- **Importar CSV** do Google Forms/Sheets, com reconhecimento flexível de colunas e tela de mapeamento.
- **Check-in em um toque**; categoria e período são **opcionais** (podem ser definidos depois).
- **Ranking** por categoria, titulares/reservas por vagas, comparação lado a lado.
- **Formação** de duplas (F/M) e quarteto misto com nota média.
- **Cronograma editável**, painel de fases, listas de chamada e **cronômetro** para as estações.
- **Exportar** CSV/JSON (com fases), **resumo imprimível (PDF)** e **backup/restauração** completos.

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
2. Na ficha, toque no **avatar para tirar/anexar a foto** do atleta. Defina **categoria** e **período**
   se quiser (são opcionais — dá para deixar “a definir” e resolver depois).
3. Toque em **Avaliar**: dê notas **0–5** em cada item de Técnico, Físico e Tático. A **nota final**
   (média ponderada) é calculada automaticamente. Marque **⭐ destaque** e a **recomendação**.
4. Preencha as **Fases da seletiva** (status ✓ / ⭐ / ✕ e anotação por fase). Na aba
   **Seletiva → Fases** dá para rodar uma fase para todos os presentes de uma vez.
5. Use **Próximo →** para avaliar em sequência, ou **pular para o próximo que falta avaliar**.
6. Os **pesos**, a **escala**, as **fases** e as **vagas** são editáveis em **Configurações**.

## 📲 Enviar os dados para o seu WhatsApp

1. Em **Configurações → Evento & envio**, coloque o **seu número de WhatsApp** (para o modo texto).
2. Na ficha ou na tela de avaliação do atleta, toque em **Enviar para o WhatsApp (foto + dados)**:
   - **No celular:** abre o menu de compartilhamento com um **card em imagem** (foto + notas + fases) —
     escolha o WhatsApp e mande para você mesmo ou para o grupo.
   - **No computador:** baixa a imagem do card e abre sua conversa com o resumo em texto para colar.
3. Em **Exportar → Enviar para o WhatsApp** você também **baixa todos os cards** de uma vez e pode
   mandar o **resumo geral** (ranking em texto) para o seu número.

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

Logo oficial do **IESB**, vermelho `#C8102E`, dourado `#E9C169`, vinho `#7C0E1E`/`#5E0A15`, texto
`#241014` e fundo claro. Títulos em **Fraunces** (serifada, elegante), corpo em **Inter** e números em
**Oswald** — todas com fallback para fontes do sistema, para funcionar mesmo offline.

## 🧱 Stack

React + Vite + TypeScript · Tailwind CSS · Zustand (estado) · localforage (IndexedDB) · PapaParse (CSV)
· vite-plugin-pwa (offline/instalável). Tudo estático, sem APIs externas.

---

Feito para o **Time IESB**. **#FirmeNaAreia** 🔴🟡
