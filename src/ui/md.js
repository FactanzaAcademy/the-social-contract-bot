// Mini-markdown per le risposte del bot: grassetto, corsivo, elenchi, citazioni, separatori.
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|\s)_(.+?)_(?=\s|$|[.,;:!?])/g, '$1<em>$2</em>');

export function md(text) {
  const out = [];
  let list = null;
  const close = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const line of text.split('\n')) {
    const t = line.trim();
    let m;
    if (!t) { close(); continue; }
    if (t === '---') { close(); out.push('<hr>'); continue; }
    if ((m = t.match(/^- (.*)/))) {
      if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    if ((m = t.match(/^\d+\. (.*)/))) {
      if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    close();
    if ((m = t.match(/^> (.*)/))) out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    else out.push(`<p>${inline(t)}</p>`);
  }
  close();
  return out.join('');
}

export { esc };
