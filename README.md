# Planejamento Editorial — Canvas interativo

HTML + CSS + JavaScript puros, sem dependências, sem build e sem servidor.

## Executar localmente
- Abra `index.html` no navegador (duplo clique), **ou**
- na pasta do projeto: `python3 -m http.server 8000` e acesse http://localhost:8000

## Publicar gratuitamente
- **Netlify:** arraste a pasta inteira em https://app.netlify.com/drop
- **GitHub Pages:** envie os arquivos a um repositório → Settings → Pages → Branch `main` / pasta `/(root)`
- **Vercel:** `npx vercel` na pasta do projeto (framework: “Other”)

## Estrutura
`index.html` · `css/styles.css` · `js/app.js` · `assets/{canvas,infografico,fluxograma}.png` (3308 × 2339 px, 200 DPI, extraídas do PDF A3)

## Dados
Os post-its ficam no `localStorage` (chave `canvasEditorial.v1`) deste navegador/endereço, com posição em fração (0–1) da área do Canvas. Use **Exportar dados** para backup e para levar a outro computador. Limpar os dados do site no navegador apaga os post-its.

## Atalhos (post-it focado)
Setas = mover (Shift = passo maior) · E/Enter = editar · D = duplicar · Delete = excluir

## Limitações
- Dados locais: não há sincronização nem colaboração.
- Em telas estreitas o Canvas mantém largura mínima de 720 px e rola na horizontal, para os post-its continuarem legíveis.
- Tela cheia pode não existir no iPhone (Safari); use o zoom.

## Próxima versão colaborativa
Login (Supabase/Firebase Auth), tabela `notes` com `board_id`, tempo real via websockets/Realtime, papéis (leitor/editor), histórico de alterações e cursores de presença.
