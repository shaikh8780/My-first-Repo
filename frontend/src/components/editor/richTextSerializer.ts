// Bridges the canonical section-content string (the markdown-ish format used by
// ContentViewer, the track-changes diff and exportDocx) to/from the HTML that
// TipTap edits. Keeping the stored model a plain string means the rich editor is
// a drop-in: nothing downstream has to change.
//
// Supported vocabulary (must stay in sync with ContentViewer + exportDocx):
//   - paragraphs separated by a blank line ("\n\n")
//   - "## " heading line              -> <h3>
//   - "- " / "• " bullet lines        -> <ul><li>
//   - "**bold**" inline               -> <strong>
//   - "[n]" citation markers          -> kept as literal text
//   - "[Table Reference: DP_*]"       -> kept as its own paragraph, verbatim
//   - "[Image placeholder ...]" /
//     "[Infographic placeholder ...]" -> kept as its own paragraph, verbatim

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Inline: **bold** -> <strong>. Everything else (incl. [n] citation markers) is
// preserved as escaped literal text.
function inlineToHtml(text: string): string {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map(part =>
      part.startsWith('**') && part.endsWith('**')
        ? `<strong>${escapeHtml(part.slice(2, -2))}</strong>`
        : escapeHtml(part)
    )
    .join('');
}

const isReferenceBlock = (block: string): boolean =>
  block.startsWith('[Table Reference:') ||
  block.startsWith('[Image placeholder') ||
  block.startsWith('[Infographic placeholder');

/** Canonical content string -> HTML for TipTap initialisation. */
export function contentToHtml(content: string): string {
  const blocks = content.split('\n\n');
  const html: string[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    const imageMatch = block.match(/^!\[([^\]]*)\]\((.+)\)$/s);
    if (imageMatch) {
      // Uploaded image, stored as markdown ![alt](src) — render as a real <img>.
      const alt = escapeHtml(imageMatch[1]);
      const src = escapeHtml(imageMatch[2]);
      html.push(`<img src="${src}" alt="${alt}">`);
    } else if (block.startsWith('## ')) {
      // Match ContentViewer: first line is the heading, any remaining lines are
      // a paragraph that follows it within the same block.
      const lines = block.split('\n');
      html.push(`<h3>${inlineToHtml(lines[0].replace(/^#+\s*/, ''))}</h3>`);
      const rest = lines.slice(1).join('\n').trim();
      if (rest) html.push(`<p>${inlineToHtml(rest)}</p>`);
    } else if (isReferenceBlock(block)) {
      // Reference-only markers (MDD table / image / infographic) become an atomic
      // node that renders as a rich, non-editable card. The raw marker is carried
      // on the attribute so it round-trips verbatim and is replaced by the MDD
      // code on export.
      html.push(`<div data-mdd-raw="${escapeHtml(block)}"></div>`);
    } else if (/^[-•]\s+/.test(block)) {
      const items = block
        .split('\n')
        .filter(l => l.trim())
        .map(l => `<li>${inlineToHtml(l.replace(/^[-•]\s*/, ''))}</li>`)
        .join('');
      html.push(`<ul>${items}</ul>`);
    } else {
      html.push(`<p>${inlineToHtml(block)}</p>`);
    }
  }

  // Trailing-atom guard: if the document ends with an atomic reference node
  // (MDD table / image / infographic) or an <img>, append an empty paragraph so
  // the cursor has an editable home after it. Without this, clicking "at the
  // end" selects the atom and typing REPLACES it — dropping the table/image on
  // save (a real data-loss bug in both editors). htmlToContent strips empty
  // trailing paragraphs, so this round-trips cleanly.
  const lastBlock = [...blocks].reverse().find(b => b.trim());
  if (lastBlock && (isReferenceBlock(lastBlock.trim()) || /^!\[[^\]]*\]\(.+\)$/s.test(lastBlock.trim()))) {
    html.push('<p></p>');
  }

  return html.join('') || '<p></p>';
}

// True when a serialized node has no real text content. A plain .trim() is not
// enough: rich-text editors frequently leave a non-breaking space ( , from
// `&nbsp;`) or other Unicode whitespace behind when you delete a line's text, so
// an "emptied" bullet/paragraph would otherwise survive as phantom content
// (a bullet you can't remove — you cleared the text but a `- ` line persists).
// Strip all Unicode whitespace incl. nbsp before testing.
function isBlank(text: string): boolean {
  return text.replace(/[\s ]+/g, '').length === 0;
}

// Inline HTML (a node's children) -> markdown-ish text. <strong>/<b> -> **..**.
function inlineFromNode(node: Node): string {
  let out = '';
  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const inner = inlineFromNode(el);
      if (tag === 'strong' || tag === 'b') {
        out += inner.trim() ? `**${inner}**` : inner;
      } else if (tag === 'br') {
        out += '\n';
      } else {
        out += inner;
      }
    }
  });
  return out;
}

/** TipTap HTML -> canonical content string (blank-line separated blocks). */
export function htmlToContent(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: string[] = [];

  doc.body.childNodes.forEach(node => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    const mddRaw = el.getAttribute('data-mdd-raw');
    // An image node may appear at block level (<img>) or wrapped in a <p>.
    const img = tag === 'img' ? el : el.querySelector(':scope > img');
    if (mddRaw) {
      // Atomic MDD reference node — emit its marker verbatim.
      blocks.push(mddRaw);
    } else if (img) {
      const src = (img as HTMLImageElement).getAttribute('src') ?? '';
      const alt = (img as HTMLImageElement).getAttribute('alt') ?? '';
      if (src) blocks.push(`![${alt}](${src})`);
    } else if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
      const t = inlineFromNode(el).trim();
      if (t) blocks.push(`## ${t}`);
    } else if (tag === 'ul' || tag === 'ol') {
      const items: string[] = [];
      el.querySelectorAll(':scope > li').forEach(li => {
        const t = inlineFromNode(li).trim();
        // Skip an emptied item (incl. one left holding only &nbsp;) so a cleared
        // bullet doesn't persist as a phantom "- " line; if EVERY item is empty
        // the whole list is dropped (items.length stays 0).
        if (!isBlank(t)) items.push(`- ${t}`);
      });
      if (items.length) blocks.push(items.join('\n'));
    } else {
      const t = inlineFromNode(el).trim();
      if (!isBlank(t)) blocks.push(t);
    }
  });

  return blocks.join('\n\n');
}
