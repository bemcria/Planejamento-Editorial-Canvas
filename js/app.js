'use strict';
/* Planejamento Editorial — Canvas interativo. Sem dependências. */
const KEY = 'canvasEditorial.v1';
const MAX_TEXT = 500;
const COLORS = [['Amarelo', '#fff176'], ['Verde', '#b9f6ca'], ['Azul', '#90caf9'], ['Rosa', '#f8bbd0'], ['Laranja', '#ffcc80'], ['Lilás', '#d1c4e9']];
const svg = p => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON = {
  edit: svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>'),
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/>'),
  del: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'),
  grip: svg('<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>')
};
const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
const fmtDate = iso => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const stage = $('#stage'), layer = $('#layer');
let notes = [], editingId = null, drag = null, zTop = 1;

/* ---------- Mensagens ---------- */
let toastTimer;
function toast(msg, type = 'ok') {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 5000);
}
function ask(message, okLabel) {
  return new Promise(resolve => {
    const dlg = $('#confirmDialog');
    $('#confirmMsg').textContent = message;
    $('#confirmOk').textContent = okLabel;
    dlg.returnValue = '';
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
    dlg.showModal();
  });
}

/* ---------- Persistência e validação ---------- */
function validate(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.notes)) return { error: 'O arquivo não contém a lista “notes” de post-its.' };
  const seen = new Set(), out = [];
  for (const [i, n] of data.notes.entries()) {
    const at = `Post-it ${i + 1}: `;
    if (!n || typeof n !== 'object') return { error: at + 'formato inválido.' };
    if (typeof n.text !== 'string' || n.text.length > MAX_TEXT) return { error: at + `texto ausente ou maior que ${MAX_TEXT} caracteres.` };
    if (typeof n.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(n.color)) return { error: at + 'cor inválida (use #RRGGBB).' };
    if (![n.x, n.y].every(v => typeof v === 'number' && v >= 0 && v <= 1)) return { error: at + 'posição x/y deve ser um número entre 0 e 1.' };
    if (typeof n.createdAt !== 'string' || isNaN(Date.parse(n.createdAt))) return { error: at + 'data de criação inválida.' };
    const id = typeof n.id === 'string' && n.id && !seen.has(n.id) ? n.id : uid();
    seen.add(id);
    const upd = typeof n.updatedAt === 'string' && !isNaN(Date.parse(n.updatedAt)) ? n.updatedAt : n.createdAt;
    out.push({ id, text: n.text, color: n.color.toLowerCase(), x: n.x, y: n.y, createdAt: n.createdAt, updatedAt: upd });
  }
  return { notes: out };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const r = validate(JSON.parse(raw));
    if (r.notes) notes = r.notes; else throw new Error(r.error);
  } catch (e) { toast('Não foi possível ler os post-its salvos neste navegador.', 'error'); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ version: 1, notes })); }
  catch (e) { toast('Não foi possível salvar: o armazenamento do navegador está cheio ou bloqueado.', 'error'); }
}
const find = id => notes.find(n => n.id === id);

/* ---------- Renderização ---------- */
function noteEl(n) {
  const el = document.createElement('article');
  el.className = 'note'; el.dataset.id = n.id; el.tabIndex = 0;
  el.style.background = n.color;
  el.style.setProperty('--x', n.x); el.style.setProperty('--y', n.y);
  el.setAttribute('aria-label', `Post-it: ${n.text.slice(0, 80)}. Setas movem, E edita, D duplica, Delete exclui.`);
  el.innerHTML = `<div class="note-bar"><span class="handle" title="Arrastar">${ICON.grip}</span><span class="acts">
    <button type="button" data-act="edit" title="Editar" aria-label="Editar post-it">${ICON.edit}</button>
    <button type="button" data-act="dup" title="Duplicar" aria-label="Duplicar post-it">${ICON.copy}</button>
    <button type="button" data-act="del" title="Excluir" aria-label="Excluir post-it">${ICON.del}</button></span></div>
    <p class="note-text"></p><time class="note-date"></time>`;
  $('.note-text', el).textContent = n.text;
  const t = $('.note-date', el);
  t.dateTime = n.createdAt; t.textContent = fmtDate(n.createdAt) + (n.updatedAt !== n.createdAt ? ' · editado' : '');
  return el;
}
function render(focusId) {
  layer.replaceChildren(...notes.map(noteEl));
  $('#count').textContent = notes.length === 1 ? '1 post-it' : `${notes.length} post-its`;
  if (focusId) $(`.note[data-id="${focusId}"]`, layer)?.focus({ preventScroll: true });
}
function sizeNotes() {
  const w = clamp(stage.clientWidth * 0.13, 128, 190);
  stage.style.setProperty('--nw', w + 'px'); stage.style.setProperty('--nh', w * 0.89 + 'px');
}
new ResizeObserver(sizeNotes).observe(stage);

/* ---------- Criar / editar ---------- */
const dlg = $('#noteDialog'), txt = $('#noteText');
$('#colors').innerHTML = COLORS.map(([name, hex], i) =>
  `<label><input type="radio" name="color" value="${hex}" ${i ? '' : 'checked'}><span class="sw" style="background:${hex}"></span><span class="sr" style="position:absolute;left:-999px">${name}</span></label>`).join('');
$('#colors').querySelectorAll('label').forEach((l, i) => l.title = COLORS[i][0]);
const pickedColor = () => $('input[name=color]:checked').value;

function openDialog(id) {
  editingId = id || null;
  const n = id && find(id);
  $('#noteTitle').textContent = n ? 'Editar post-it' : 'Novo post-it';
  $('#noteSubmit').textContent = n ? 'Salvar alterações' : 'Criar post-it';
  txt.value = n ? n.text : ''; $('#noteErr').textContent = ''; txt.removeAttribute('aria-invalid');
  const hex = n ? n.color : COLORS[0][1];
  const radio = [...document.querySelectorAll('input[name=color]')].find(r => r.value === hex);
  if (radio) radio.checked = true;
  $('#noteLen').textContent = `${txt.value.length}/${MAX_TEXT}`;
  dlg.showModal(); txt.focus();
}
function visibleCenter() {
  const r = layer.getBoundingClientRect();
  const nw = parseFloat(getComputedStyle(stage).getPropertyValue('--nw')), nh = nw * 0.89;
  const cx = (Math.max(r.left, 0) + Math.min(r.right, innerWidth)) / 2, cy = (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2;
  return { x: clamp((cx - r.left - nw / 2) / (r.width - nw)), y: clamp((cy - r.top - nh / 2) / (r.height - nh)) };
}
$('#noteForm').addEventListener('submit', e => {
  e.preventDefault();
  const text = txt.value.trim();
  if (!text) { $('#noteErr').textContent = 'Escreva o conteúdo do post-it antes de continuar.'; txt.setAttribute('aria-invalid', 'true'); txt.focus(); return; }
  const now = new Date().toISOString(), color = pickedColor();
  let id = editingId;
  if (id) { Object.assign(find(id), { text, color, updatedAt: now }); toast('Post-it atualizado.'); }
  else { id = uid(); notes.push({ id, text, color, ...visibleCenter(), createdAt: now, updatedAt: now }); toast('Post-it criado no centro da área visível. Arraste para posicionar.'); }
  save(); dlg.close(); render(id);
});
txt.addEventListener('input', () => { $('#noteLen').textContent = `${txt.value.length}/${MAX_TEXT}`; $('#noteErr').textContent = ''; txt.removeAttribute('aria-invalid'); });
$('#noteCancel').addEventListener('click', () => dlg.close());
$('#btnAdd').addEventListener('click', () => openDialog());

function duplicate(id) {
  const n = find(id), now = new Date().toISOString();
  const copy = { ...n, id: uid(), x: clamp(n.x + 0.03), y: clamp(n.y + 0.04), createdAt: now, updatedAt: now };
  notes.push(copy); save(); render(copy.id); toast('Post-it duplicado.');
}
async function remove(id) {
  if (!(await ask('Excluir este post-it? Esta ação não pode ser desfeita.', 'Excluir'))) { $(`.note[data-id="${id}"]`, layer)?.focus(); return; }
  notes = notes.filter(n => n.id !== id); save(); render(); toast('Post-it excluído.');
  $('#btnAdd').focus();
}

/* ---------- Ações, teclado e arraste ---------- */
layer.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const id = b.closest('.note').dataset.id, act = b.dataset.act;
  if (act === 'edit') openDialog(id); else if (act === 'dup') duplicate(id); else remove(id);
});
layer.addEventListener('keydown', e => {
  if (!e.target.classList.contains('note') || e.altKey || e.ctrlKey || e.metaKey) return;
  const id = e.target.dataset.id, n = find(id), step = e.shiftKey ? 0.05 : 0.01;
  const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (mv) {
    e.preventDefault(); n.x = clamp(n.x + mv[0]); n.y = clamp(n.y + mv[1]);
    e.target.style.setProperty('--x', n.x); e.target.style.setProperty('--y', n.y); save();
  } else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') { e.preventDefault(); openDialog(id); }
  else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); duplicate(id); }
  else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(id); }
});
layer.addEventListener('pointerdown', e => {
  const bar = e.target.closest('.note-bar');
  if (!bar || e.target.closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const el = bar.parentElement, n = find(el.dataset.id), r = layer.getBoundingClientRect();
  drag = { el, n, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, rw: r.width - el.offsetWidth, rh: r.height - el.offsetHeight };
  bar.setPointerCapture(e.pointerId);
  el.classList.add('dragging'); el.style.zIndex = ++zTop; el.focus({ preventScroll: true }); e.preventDefault();
});
layer.addEventListener('pointermove', e => {
  if (!drag) return;
  drag.n.x = clamp(drag.ox + (e.clientX - drag.sx) / drag.rw);
  drag.n.y = clamp(drag.oy + (e.clientY - drag.sy) / drag.rh);
  drag.el.style.setProperty('--x', drag.n.x); drag.el.style.setProperty('--y', drag.n.y);
});
const endDrag = () => { if (!drag) return; drag.el.classList.remove('dragging'); drag = null; save(); };
layer.addEventListener('pointerup', endDrag);
layer.addEventListener('pointercancel', endDrag);

/* ---------- Exportar, importar, limpar ---------- */
$('#btnExport').addEventListener('click', () => {
  const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), notes }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = 'postits-planejamento-editorial.json';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`${notes.length} post-it(s) exportado(s).`);
});
$('#btnImport').addEventListener('click', () => $('#fileImport').click());
$('#fileImport').addEventListener('change', async e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  let data;
  try { data = JSON.parse(await file.text()); } catch (err) { return toast('Arquivo inválido: não é um JSON legível.', 'error'); }
  const r = validate(data);
  if (r.error) return toast('Importação cancelada. ' + r.error, 'error');
  if (notes.length && !(await ask(`Importar ${r.notes.length} post-it(s)? Os ${notes.length} atuais serão substituídos.`, 'Importar'))) return;
  notes = r.notes; save(); render(); toast(`${notes.length} post-it(s) importado(s) com sucesso.`);
});
$('#btnClear').addEventListener('click', async () => {
  if (!notes.length) return toast('O Canvas já está vazio.');
  if (!(await ask(`Apagar todos os ${notes.length} post-its? Esta ação não pode ser desfeita. Considere exportar os dados antes.`, 'Apagar tudo'))) return;
  notes = []; save(); render(); toast('Canvas limpo.');
});

/* ---------- Abas ---------- */
const tabs = [...document.querySelectorAll('[role=tab]')];
function selectTab(tab) {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  document.getElementById(tab.getAttribute('aria-controls')).querySelector('.viewer')?.dispatchEvent(new Event('shown'));
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; selectTab(n); n.focus(); }
  });
});

/* ---------- Visualizadores estáticos (páginas 2 e 3) ---------- */
document.querySelectorAll('.viewer-mount').forEach(m => {
  const v = $('#viewerTpl').content.firstElementChild.cloneNode(true);
  const img = $('img', v), box = $('.vbox', v), label = $('.zoom-label', v), dl = $('[data-v=dl]', v);
  img.src = m.dataset.src; img.alt = m.dataset.alt; dl.href = m.dataset.src; dl.download = m.dataset.file;
  box.setAttribute('aria-label', `${m.dataset.label}: imagem ampliável, role para navegar`);
  let width = 0, fitMode = true;
  const fitW = () => Math.max(box.clientWidth - 2, 200);
  const apply = () => { img.style.width = width + 'px'; label.textContent = Math.round(width / fitW() * 100) + '%'; };
  const fit = () => { fitMode = true; width = fitW(); apply(); };
  const zoom = f => { fitMode = false; width = clamp(width * f, 200, (img.naturalWidth || 3308) * 2); apply(); };
  v.addEventListener('click', e => {
    const a = e.target.closest('[data-v]')?.dataset.v;
    if (a === 'in') zoom(1.25); else if (a === 'out') zoom(0.8); else if (a === 'fit') fit();
    else if (a === 'orig') { fitMode = false; width = img.naturalWidth || 3308; apply(); }
    else if (a === 'full') {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (v.requestFullscreen) v.requestFullscreen().catch(() => toast('Seu navegador bloqueou a tela cheia.', 'error'));
      else toast('Tela cheia não é suportada neste navegador. Use o zoom.', 'error');
    }
  });
  v.addEventListener('shown', () => { if (fitMode) fit(); });
  new ResizeObserver(() => { if (fitMode && box.clientWidth) fit(); }).observe(box);
  m.replaceWith(v);
});

load(); sizeNotes(); render();
