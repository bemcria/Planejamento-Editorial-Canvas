#!/usr/bin/env python3
# © 2026 BemCria Criatividade e Estratégia. Todos os direitos reservados.
"""Gera js/data/<nome>.js a partir de assets/<nome>.png.

Por quê: ao abrir o index.html direto do disco (file://), o navegador bloqueia a exportação
(PDF/JPG/PNG) de imagens carregadas do disco. Estes arquivos entregam as mesmas imagens em base64,
e o app só os carrega no momento de exportar. Rode de novo sempre que trocar um PNG de assets/.

Uso (na pasta do projeto):  python3 tools/gerar-assets-offline.py
"""
import base64, pathlib

raiz = pathlib.Path(__file__).resolve().parent.parent
destino = raiz / "js" / "data"
destino.mkdir(parents=True, exist_ok=True)

PAGINAS = ("canvas", "infografico", "fluxograma")  # imagens usadas na exportação (o logo não entra)

for png in sorted((raiz / "assets").glob("*.png")):
    if png.stem not in PAGINAS:
        continue
    b64 = base64.b64encode(png.read_bytes()).decode("ascii")
    js = f'window.__ASSETS=window.__ASSETS||{{}};window.__ASSETS["{png.stem}"]="data:image/png;base64,{b64}";\n'
    (destino / f"{png.stem}.js").write_text(js, encoding="utf-8")
    print(f"js/data/{png.stem}.js  ({len(js) / 1024:.0f} KB)")
