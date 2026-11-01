# Cabeçalhador de Atividades A4 — Colégio Franciscano Santa Isabel (CFSI)

Aplicativo web PWA simples, rápido e 100% offline para montagem de atividades pedagógicas em folha A4 com cabeçalho oficial, ajuste e recorte de imagem e exportação em **PDF** (300 DPI) e **Microsoft Word (.docx)**.

---

## 🚀 Como usar

1. Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Brave, etc.) ou acesse pelo GitHub Pages.
2. No primeiro acesso, preencha seu nome e turma (os dados são salvos no seu computador automaticamente).
3. Cole a imagem da atividade com `Ctrl + V`, arraste para a folha ou escolha pelo botão.
4. Ajuste margens, recorte bordas indesejadas (ou rodapés como "Nome: ___") e clique em **Baixar PDF** ou **Baixar Word (.docx)**.

---

## 📌 PWA e Modo Offline

- Funciona totalmente offline após o primeiro carregamento.
- Pode ser instalado na Área de Trabalho com o botão "Criar Atalho no Computador".
- Ao publicar alterações no repositório, lembre-se de incrementar a versão do cache em `sw.js` (ex: de `v1` para `v2`).
