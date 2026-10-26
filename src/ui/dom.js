// Piccolo helper per creare elementi DOM.
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function cardImage(kind, page) {
  const prefix = kind === 'project' ? 'p' : kind === 'event' ? 'e' : 't';
  return `cards/${prefix}-${String(page).padStart(2, '0')}.jpg`;
}

export function select(options, { value, onchange, placeholder, label } = {}) {
  const s = h('select', { onchange: (e) => onchange && onchange(e.target.value), 'aria-label': label });
  if (placeholder != null) s.append(h('option', { value: '' }, placeholder));
  for (const o of options) {
    if (o.group) {
      const g = h('optgroup', { label: o.group });
      o.items.forEach((it) => g.append(h('option', { value: it.value }, it.label)));
      s.append(g);
    } else s.append(h('option', { value: o.value }, o.label));
  }
  if (value != null) s.value = value;
  return s;
}
