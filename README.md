# Planejamento Editorial — Canvas interativo

© 2026 BemCria Criatividade e Estratégia. Todos os direitos reservados.

HTML + CSS + JavaScript puros, sem dependências, sem build e sem servidor.

## Executar localmente
- Abra `index.html` no navegador (duplo clique), **ou**
- na pasta do projeto: `python3 -m http.server 8000` e acesse http://localhost:8000

Funciona em computadores, tablets e celulares (Chrome, Edge, Firefox e Safari atuais).

## Publicar gratuitamente
- **Netlify:** arraste a pasta inteira em https://app.netlify.com/drop
- **GitHub Pages:** envie os arquivos a um repositório → Settings → Pages → Branch `main` / pasta `/(root)`
- **Vercel:** `npx vercel` na pasta do projeto (framework: “Other”)

Publique a pasta inteira, mantendo `index.html`, `css/`, `js/` e `assets/` juntos.

## Novidades desta versão
- **Exportar em PDF, JPG ou PNG** (botão **Exportar**): o Canvas com os post-its, o Infográfico, o Fluxograma ou todas as páginas num único PDF de 3 páginas. O PDF sai em A3 paisagem; há duas resoluções (Alta = 3308 px de largura, Média = metade). Também exporta os dados em JSON (backup).
- **Post-its com dimensões ajustáveis:** arraste o canto inferior direito do post-it, ou abra **Editar** e use as predefinições (Pequeno, Médio, Grande, Extra grande) e os controles de largura e altura.
- **Copyright 2026 BemCria Criatividade e Estratégia** no rodapé da página, nos metadados do HTML, no rodapé de todo arquivo exportado e nos metadados do PDF (autor e direitos).
- **Logo da BemCria** no canto superior esquerdo do cabeçalho, com margens nas bordas e o título “Planejamento Editorial” ao lado. No modo escuro o logo aparece sobre uma placa branca para manter a leitura. O arquivo é `assets/logo-bemcria.png` (120 × 49 px); para trocar, substitua o arquivo mantendo o nome (se a nova imagem tiver outra proporção, ajuste `width` e `height` da tag `<img class="logo">` no `index.html`).
- **Ferramenta Mão** (botão **Mão** ao lado do zoom, nas três páginas): com zoom, o ponteiro do mouse vira uma mãozinha e, arrastando a imagem, a visualização se move para todos os lados, sem usar as barras de rolagem. No Canvas, arraste o fundo ou o corpo do post-it; a barra superior continua movendo o post-it e o canto inferior direito continua redimensionando. A ferramenta vem ligada; clique em **Mão** para desligá-la (a escolha fica salva no navegador). Em telas de toque o botão não aparece, porque o dedo já arrasta a imagem.
- **Responsivo e pronto para celular:** layout adaptável, botões com área de toque confortável, arraste e redimensionamento por toque, zoom do Canvas (−, +, Ajustar à largura) e respeito às áreas seguras do iPhone.

## Estrutura
`index.html` · `css/styles.css` · `js/app.js` · `js/data/{canvas,infografico,fluxograma}.js` · `assets/{canvas,infografico,fluxograma}.png` (3308 × 2339 px, 200 DPI) · `assets/logo-bemcria.png` · `tools/gerar-assets-offline.py`

### Sobre `js/data/` (exportar ao abrir o arquivo direto do disco)
Ao abrir o `index.html` por duplo clique (endereço `file://`), os navegadores bloqueiam a exportação de imagens que estão no disco. Por isso `js/data/*.js` guarda as mesmas imagens em base64, carregadas só na hora de exportar. Quando o projeto roda em um servidor (`http://` ou `https://`), esses arquivos não são usados e podem ser removidos para economizar espaço (~3,9 MB).
**Se você trocar um PNG de `assets/`**, rode `python3 tools/gerar-assets-offline.py` para atualizar `js/data/`.

## Dados
Os post-its ficam no `localStorage` (chave `canvasEditorial.v1`) deste navegador/endereço. Cada post-it guarda a posição (`x`, `y`, de 0 a 1 do espaço livre do Canvas) e as dimensões (`w` = fração da largura do Canvas, de 0,10 a 0,45; `h` = fração da altura, de 0,10 a 0,50). Arquivos de backup antigos, sem `w` e `h`, continuam sendo importados e recebem o tamanho padrão. Use **Exportar → Dados (JSON)** para backup e para levar a outro computador. Limpar os dados do site no navegador apaga os post-its.

## Atalhos
Mouse: com zoom, arraste a imagem com a **Mão** · roda do mouse rola na vertical · Shift + roda rola na horizontal · as áreas de visualização aceitam as setas do teclado quando focadas (Tab)

### Post-it focado
Setas = mover (Shift = passo maior) · **Alt + setas = mudar largura/altura** (Shift = passo maior) · **+ / − = ampliar/reduzir** · E/Enter = editar · D = duplicar · Delete = excluir

## Limitações
- Dados locais: não há sincronização nem colaboração.
- Em telas estreitas o Canvas abre com 1000 px de largura e rola na horizontal, para os post-its continuarem legíveis; use **Ajustar à largura** para ver tudo de uma vez e **+** para aproximar.
- No arquivo exportado, o texto que não cabe no post-it termina em “…” (na tela, o texto rola dentro do post-it). Aumente o post-it para exibir tudo.
- Tela cheia pode não existir no iPhone (Safari); use o zoom.
- Em celulares, o arquivo exportado é baixado pelo navegador; em alguns navegadores embutidos de aplicativos (WebViews) o download pode ser bloqueado — abra o endereço no Chrome ou no Safari.

## Próxima versão colaborativa
Login (Supabase/Firebase Auth), tabela `notes` com `board_id`, tempo real via websockets/Realtime, papéis (leitor/editor), histórico de alterações e cursores de presença.
