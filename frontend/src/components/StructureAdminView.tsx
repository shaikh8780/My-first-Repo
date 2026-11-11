import { useMemo, useState, useEffect } from 'react';
import { drsForSection } from '../data/complianceMappings';
import { canEditStructure } from '../data/permissions';
import { useAuth } from '../auth/useAuth';
import {
  type StructRow, type StructVersion, type PublishedVersion, type PublishedStructure,
  baselineRows, rowTitle,
  diffStructures, summarizeDiff, type StructDiff,
} from '../data/structureStore';
import type { ContentFormat } from '../data/reportSections';
import { reportSections } from '../data/reportSections';
import { api } from '../api';

// Which section refs currently hold authored content, so removing one warns the
// admin (review 21 Aug 2026: removing a section with content needs a safeguard).
// A section counts as "has content" when its narrative is more than a short
// stub/placeholder. Cross-referenced by ref from the report's sections.
const CONTENT_BY_REF: Record<string, { title: string; words: number }> = Object.fromEntries(
  reportSections.map(s => {
    const stub = /^(Draft narrative for|\[Table Reference|\[Infographic|\[Image)/.test(s.content.trim());
    const words = stub ? 0 : s.content.trim().split(/\s+/).filter(Boolean).length;
    return [s.ref, { title: s.title, words }];
  }),
);
function sectionHasContent(ref: string): number {
  return CONTENT_BY_REF[ref]?.words ?? 0;
}

// Build the L1 -> L2 -> L3 tree from the flat, ordered rows. A row with no L2 is
// a standalone L1 leaf (front matter); a row with L2 but no L3 is an L2 leaf.
interface L2Node { name: string; rows: StructRow[] }
interface L1Node { name: string; directRows: StructRow[]; l2s: L2Node[] }

function buildTree(rows: StructRow[]): L1Node[] {
  const l1s: L1Node[] = [];
  const l1i = new Map<string, L1Node>();
  const l2i = new Map<string, L2Node>();
  for (const r of rows) {
    let l1 = l1i.get(r.topicL1);
    if (!l1) { l1 = { name: r.topicL1, directRows: [], l2s: [] }; l1i.set(r.topicL1, l1); l1s.push(l1); }
    if (!r.topicL2) { l1.directRows.push(r); continue; }
    const k = `${r.topicL1}||${r.topicL2}`;
    let l2 = l2i.get(k);
    if (!l2) { l2 = { name: r.topicL2, rows: [] }; l2i.set(k, l2); l1.l2s.push(l2); }
    l2.rows.push(r);
  }
  return l1s;
}

let uidCounter = 0;
const newId = (seed: string) => `sub-new-${seed}-${uidCounter++}`;

// Focus-safe editable name. Defined at module scope (not inside the render) so
// React keeps it mounted across re-renders; it holds local draft text and only
// commits on blur or Enter, so typing never loses focus even though committing
// re-groups the tree.
function EditableName({ value, onCommit, className, placeholder }: {
  value: string;
  onCommit: (next: string) => void;
  className: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  // Keep in sync when the underlying value changes from elsewhere (e.g. reset).
  useEffect(() => { setDraft(value); }, [value]);
  const commit = () => { const t = draft.trim(); if (t && t !== value) onCommit(t); else setDraft(value); };
  return (
    <input
      className={className}
      value={draft}
      placeholder={placeholder}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
    />
  );
}

export default function StructureAdminView() {
  const { alias } = useAuth();
  const allowed = canEditStructure(alias);

  // Seed with the code baseline / empty history (the same fallbacks the store
  // used), then hydrate from the data-access layer on mount. `published` is
  // cached so the publish-diff can be computed synchronously in a useMemo.
  const [rows, setRows] = useState<StructRow[]>(() => baselineRows());
  const [versions, setVersions] = useState<StructVersion[]>([]);
  const [pubVersions, setPubVersions] = useState<PublishedVersion[]>([]);
  const [published, setPublished] = useState<PublishedStructure | null>(null);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [flagged, setFlagged] = useState<{ ref: string; title: string; drCount: number }[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Publish confirmation: the diff vs the last published structure + an optional note.
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  // Section pending a remove-confirmation because it still has authored content.
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; ref: string; title: string; words: number; drCount: number } | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([
      api.structure.draft.get(),
      api.structure.versions.get(),
      api.structure.publishedVersions.get(),
      api.structure.published.get(),
    ]).then(([d, v, pv, p]) => {
      if (!alive) return;
      setRows(d); setVersions(v); setPubVersions(pv); setPublished(p);
    });
    return () => { alive = false; };
  }, []);

  const tree = useMemo(() => buildTree(rows), [rows]);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000); };
  const persist = (next: StructRow[]) => { setRows(next); setDirty(true); void api.structure.draft.set(next); };
  const toggle = (key: string) => setCollapsed(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  if (!allowed) {
    return (
      <>
        <div className="view-header"><h1 className="view-title">Section Structure</h1></div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            🔒 Editing the report section structure is restricted to <strong>select users</strong> (structure administrators). Your account does not have this permission. Contact the ESG Reporting Lead to request access.
          </div>
        </div>
      </>
    );
  }

  // ---- mutations (operate on the flat ordered rows) -------------------------

  // Rename a single L3 leaf row.
  const renameRow = (id: string, title: string) => persist(rows.map(r => r.id === id ? { ...r, topicL3: title } : r));

  // Rename a standalone L1 leaf (front-matter items, and freshly-added top-level
  // sections) — its identity lives in topicL1, not topicL3, so the editor groups
  // and labels it correctly. Writing to topicL3 here would leave topicL1 as the
  // default ("New section"), which is what surfaces in the Report Editor.
  const renameStandaloneL1 = (id: string, title: string) => persist(rows.map(r => r.id === id ? { ...r, topicL1: title } : r));

  // Rename an L1 chapter — updates topicL1 on every row in that chapter.
  const renameL1 = (l1: string, title: string) =>
    persist(rows.map(r => r.topicL1 === l1 ? { ...r, topicL1: title } : r));

  // Rename an L2 sub-topic — updates topicL2 on every row in that L1+L2 group.
  const renameL2 = (l1: string, l2: string, title: string) =>
    persist(rows.map(r => (r.topicL1 === l1 && r.topicL2 === l2) ? { ...r, topicL2: title } : r));

  // Apply the actual removal (also flags any DR coverage that was lost).
  const doRemoveRow = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    const drs = drsForSection(id);
    if (drs.length > 0) setFlagged(f => [...f.filter(x => x.ref !== row.ref), { ref: row.ref, title: rowTitle(row), drCount: drs.length }]);
    persist(rows.filter(r => r.id !== id));
  };

  // Removing a section with authored content requires confirmation (review 21 Aug 2026):
  // an empty/stub section is removed straight away; one with content opens a
  // guard modal showing the word count + any disclosure coverage that will be lost.
  const removeRow = (id: string) => {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    const words = sectionHasContent(row.ref);
    if (words > 0) {
      setPendingRemoval({ id, ref: row.ref, title: rowTitle(row), words, drCount: drsForSection(id).length });
      return;
    }
    doRemoveRow(id);
  };

  // Move a single L3 leaf up/down among its siblings in the same L1+L2 group.
  const moveRow = (id: string, dir: -1 | 1) => {
    const idx = rows.findIndex(r => r.id === id);
    if (idx < 0) return;
    const row = rows[idx];
    const sameGroup = (c: StructRow) => c.topicL1 === row.topicL1 && (c.topicL2 || '') === (row.topicL2 || '');
    let j = idx + dir;
    while (j >= 0 && j < rows.length && !sameGroup(rows[j])) j += dir;
    if (j < 0 || j >= rows.length || !sameGroup(rows[j])) return;
    const next = rows.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    persist(next);
  };

  // Reorder a whole contiguous block (an L1 chapter or an L2 sub-topic) relative
  // to its sibling blocks, moving all of its rows together.
  const moveBlock = (pred: (r: StructRow) => boolean, siblingKey: (r: StructRow) => string, dir: -1 | 1) => {
    // Identify contiguous blocks by their sibling key, preserving order.
    const blocks: { key: string; rows: StructRow[] }[] = [];
    for (const r of rows) {
      const k = siblingKey(r);
      const last = blocks[blocks.length - 1];
      if (last && last.key === k) last.rows.push(r);
      else blocks.push({ key: k, rows: [r] });
    }
    const bi = blocks.findIndex(b => b.rows.some(pred));
    if (bi < 0) return;
    const bj = bi + dir;
    if (bj < 0 || bj >= blocks.length) return;
    [blocks[bi], blocks[bj]] = [blocks[bj], blocks[bi]];
    persist(blocks.flatMap(b => b.rows));
  };

  const moveL1 = (l1: string, dir: -1 | 1) => moveBlock(r => r.topicL1 === l1, r => r.topicL1, dir);
  const moveL2 = (l1: string, l2: string, dir: -1 | 1) =>
    // Reorder L2 blocks only within their L1 chapter.
    moveBlock(r => r.topicL1 === l1 && r.topicL2 === l2, r => `${r.topicL1}||${r.topicL2 || ''}`, dir);

  // Add an L3 subsection at the end of an L2 group.
  const addSubsection = (l1: string, l2: string) => {
    const group = rows.filter(r => r.topicL1 === l1 && r.topicL2 === l2);
    const lastIdx = rows.lastIndexOf(group[group.length - 1]);
    const newRow: StructRow = {
      id: newId('l3'), ref: 'new', topicL1: l1, topicL2: l2,
      topicL3: 'New subsection', contentFormat: 'Text',
    };
    const next = rows.slice();
    next.splice(lastIdx + 1, 0, newRow);
    persist(next);
  };

  // Add a new L2 sub-topic (with one starter L3) at the end of an L1 chapter.
  // Works for a childless L1 too (turns it into a chapter).
  const addSubTopic = (l1: string) => {
    const group = rows.filter(r => r.topicL1 === l1);
    const lastIdx = group.length ? rows.lastIndexOf(group[group.length - 1]) : rows.length - 1;
    const newRow: StructRow = {
      id: newId('l2'), ref: 'new', topicL1: l1, topicL2: 'New sub-topic',
      topicL3: 'New subsection', contentFormat: 'Text',
    };
    const next = rows.slice();
    next.splice(lastIdx + 1, 0, newRow);
    persist(next);
  };

  // Add a brand-new top-level section (L1) at the end.
  const addTopLevel = () => {
    persist([...rows, { id: newId('l1'), ref: 'new', topicL1: 'New section', contentFormat: 'Text' }]);
  };

  const setFormat = (id: string, fmt: ContentFormat) => persist(rows.map(r => r.id === id ? { ...r, contentFormat: fmt } : r));

  // ---- versioning + publish -------------------------------------------------
  const commit = () => {
    const version: StructVersion = {
      id: versions.length + 1,
      label: `v${versions.length + 1} — ${rows.length} subsections`,
      timestamp: new Date().toISOString(),
      rows: rows.slice(),
    };
    const nv = [...versions, version];
    setVersions(nv); void api.structure.versions.set(nv); setDirty(false);
    showToast(`Structure committed as ${version.label}`);
  };

  // The change set this publish would introduce, measured against the LAST
  // published structure (or the code baseline for a first publish). Drives the
  // confirmation dialog and the change summary recorded in the publish history.
  const publishDiff: StructDiff = useMemo(() => {
    const prev = published?.rows ?? baselineRows();
    return diffStructures(prev, rows);
  }, [rows, published, showPublishConfirm]);

  // Step 1: open the confirmation dialog (does NOT publish yet).
  const requestPublish = () => { setPublishNote(''); setShowPublishConfirm(true); };

  // Step 2: the admin confirmed — write the publish + append an immutable history entry.
  const confirmPublish = () => {
    const publishedBy = alias ? alias.charAt(0).toUpperCase() + alias.slice(1) : 'Structure Admin';
    const publishedAt = new Date().toISOString();
    const note = publishNote.trim() || undefined;
    const pub: PublishedStructure = { rows: rows.slice(), publishedBy, publishedAt, note };
    setPublished(pub); void api.structure.published.set(pub);

    const entry: PublishedVersion = {
      id: pubVersions.length + 1,
      label: `Publish v${pubVersions.length + 1}`,
      publishedBy,
      publishedAt,
      rows: rows.slice(),
      summary: summarizeDiff(publishDiff),
      note,
    };
    const nextPub = [...pubVersions, entry];
    setPubVersions(nextPub); void api.structure.publishedVersions.set(nextPub);

    setDirty(false);
    setShowPublishConfirm(false);
    showToast('Published to Report Editor — the editor will prompt to review & apply the changes');
  };

  // Roll back the DRAFT to a previously published structure (re-publish still
  // requires an explicit Publish + confirm, so this is non-destructive).
  const rollbackToPublished = (v: PublishedVersion) => {
    persist(v.rows.slice()); setFlagged([]);
    showToast(`Draft reset to ${v.label} — review, then Publish to apply`);
  };

  const rollback = (v: StructVersion) => { persist(v.rows.slice()); setDirty(false); showToast(`Rolled back to ${v.label}`); };
  const resetToBase = () => { const b = baselineRows(); persist(b); setFlagged([]); showToast('Structure reset to the current report baseline'); };

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Section Structure</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost" onClick={resetToBase}>Reset</button>
          <button className="btn-secondary" onClick={commit} disabled={!dirty}>Commit version</button>
          <button className="btn-primary" onClick={requestPublish}>Publish to Report Editor</button>
        </div>
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--accent-light)', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--accent)', fontSize: '12px', color: 'var(--accent)' }}>
        <strong>Structure admin.</strong> The report is organised in three levels — <strong>L1 chapter → L2 sub-topic → L3 subsection</strong>. Add, rename, reorder or remove nodes to match the report blueprint (e.g. the 2027 ESRS structure). <strong>Commit</strong> snapshots a version (with rollback); <strong>Publish to Report Editor</strong> sends the structure to the editor, where it is reviewed and applied. Existing section content is preserved.
      </div>

      {flagged.length > 0 && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#b45309' }}>⚠ Compliance mappings flagged for review</div>
          {flagged.map(f => (
            <div key={f.ref} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {f.ref} “{f.title}” removed — {f.drCount} disclosure requirement mapping(s) need to be re-pointed.
            </div>
          ))}
        </div>
      )}

      {/* Tree */}
      <div className="card" style={{ padding: '10px 8px' }}>
        {tree.map(l1 => {
          const l1key = `L1:${l1.name}`;
          const l1collapsed = collapsed.has(l1key);
          const hasChildren = l1.l2s.length > 0;
          const standaloneLeaf = l1.directRows.length === 1 && !hasChildren ? l1.directRows[0] : null;
          // Stable React key: identity of the group's first row, not its (editable) name.
          const l1RowKey = (l1.directRows[0] ?? l1.l2s[0]?.rows[0])?.id ?? l1.name;
          return (
            <div key={l1RowKey} className="struct-l1-block">
              <div className="struct-node struct-l1">
                {hasChildren
                  ? <button className="struct-caret" onClick={() => toggle(l1key)}>{l1collapsed ? '▶' : '▼'}</button>
                  : <span className="struct-caret" />}
                <EditableName
                  className="struct-title-input struct-l1-input"
                  value={l1.name}
                  onCommit={t => standaloneLeaf ? renameStandaloneL1(standaloneLeaf.id, t) : renameL1(l1.name, t)}
                />
                <span style={{ display: 'inline-flex', gap: '4px', marginLeft: 'auto' }}>
                  <button className="btn-ghost struct-act" title="Move chapter up" onClick={() => moveL1(l1.name, -1)}>↑</button>
                  <button className="btn-ghost struct-act" title="Move chapter down" onClick={() => moveL1(l1.name, 1)}>↓</button>
                  <button className="btn-ghost struct-act" title="Add sub-topic (L2)" onClick={() => addSubTopic(l1.name)}>＋ sub-topic</button>
                  {standaloneLeaf && <button className="btn-ghost struct-act" title="Remove" style={{ color: '#ef4444' }} onClick={() => removeRow(standaloneLeaf.id)}>✕</button>}
                </span>
              </div>

              {!l1collapsed && l1.l2s.map(l2 => {
                const l2key = `L2:${l1.name}||${l2.name}`;
                const l2collapsed = collapsed.has(l2key);
                return (
                  <div key={l2.rows[0]?.id ?? l2.name} className="struct-l2-block">
                    <div className="struct-node struct-l2">
                      <button className="struct-caret" onClick={() => toggle(l2key)}>{l2collapsed ? '▶' : '▼'}</button>
                      <EditableName
                        className="struct-title-input struct-l2-input"
                        value={l2.name}
                        onCommit={t => renameL2(l1.name, l2.name, t)}
                      />
                      <span style={{ display: 'inline-flex', gap: '4px', marginLeft: 'auto' }}>
                        <button className="btn-ghost struct-act" title="Move sub-topic up" onClick={() => moveL2(l1.name, l2.name, -1)}>↑</button>
                        <button className="btn-ghost struct-act" title="Move sub-topic down" onClick={() => moveL2(l1.name, l2.name, 1)}>↓</button>
                        <button className="btn-ghost struct-act" title="Add subsection (L3)" onClick={() => addSubsection(l1.name, l2.name)}>＋ subsection</button>
                      </span>
                    </div>
                    {!l2collapsed && l2.rows.map(r => (
                      <div key={r.id} className="struct-node struct-l3">
                        <span className="struct-ref">{r.ref}</span>
                        <EditableName
                          className="struct-title-input"
                          value={r.topicL3 || r.topicL2 || r.topicL1}
                          onCommit={t => renameRow(r.id, t)}
                        />
                        <select className="struct-fmt" value={r.contentFormat} onChange={e => setFormat(r.id, e.target.value as ContentFormat)}>
                          {(['Text', 'Table', 'Infographic', 'Image', 'Mixed'] as ContentFormat[]).map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <span style={{ display: 'inline-flex', gap: '2px', marginLeft: 'auto' }}>
                          <button className="btn-ghost struct-act" title="Move up" onClick={() => moveRow(r.id, -1)}>↑</button>
                          <button className="btn-ghost struct-act" title="Move down" onClick={() => moveRow(r.id, 1)}>↓</button>
                          <button className="btn-ghost struct-act" title="Remove" style={{ color: '#ef4444' }} onClick={() => removeRow(r.id)}>✕</button>
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}

        <div style={{ padding: '10px 8px 4px' }}>
          <button className="btn-secondary" onClick={addTopLevel}>＋ Add top-level section (L1)</button>
        </div>
      </div>

      {/* Version history */}
      <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
        <h2 className="card-title">Version history</h2>
        {versions.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No committed versions yet. Make changes and click “Commit version”.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {versions.slice().reverse().map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{v.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(v.timestamp).toLocaleString()}</span>
                <button className="btn-ghost" onClick={() => rollback(v)} style={{ marginLeft: 'auto', fontSize: '11px' }}>Roll back</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Published version history — a permanent record of every publish */}
      <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
        <h2 className="card-title">Published to Report Editor — history</h2>
        {pubVersions.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nothing published yet. Use “Publish to Report Editor” to send the structure to the editor; each publish is recorded here.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pubVersions.slice().reverse().map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{v.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v.summary}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.publishedBy} · {new Date(v.publishedAt).toLocaleString()}</span>
                {v.note && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>“{v.note}”</span>}
                <button className="btn-ghost" onClick={() => rollbackToPublished(v)} style={{ marginLeft: 'auto', fontSize: '11px' }}>Restore to draft</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish confirmation — lists the permanent changes before sending them on */}
      {showPublishConfirm && (
        <div className="modal-overlay" onClick={() => setShowPublishConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Publish to Report Editor?</h3>
              <button className="btn-ghost" onClick={() => setShowPublishConfirm(false)} style={{ fontSize: '18px', padding: '2px 8px' }}>✕</button>
            </div>
            <div style={{ padding: '0 24px 24px', maxHeight: '64vh', overflowY: 'auto' }}>
              <div style={{ padding: '10px 12px', background: '#fef3c7', color: '#b45309', borderRadius: '6px', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
                ⚠ These changes are permanent. Publishing sends the structure to the Report Editor and records this version in the publish history. Existing section content, roles and workflow state are preserved.
              </div>

              {publishDiff.total === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  No structural changes since the last publish. You can still re-publish to re-notify the editor.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>{summarizeDiff(publishDiff)} — since the last publish</div>
                  {publishDiff.added.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', marginBottom: '4px' }}>Added ({publishDiff.added.length})</div>
                      {publishDiff.added.map(r => <div key={r.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>+ {[r.topicL1, r.topicL2, r.topicL3].filter(Boolean).join(' › ')}</div>)}
                    </div>
                  )}
                  {publishDiff.removed.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>Removed ({publishDiff.removed.length})</div>
                      {publishDiff.removed.map(r => <div key={r.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>− {[r.topicL1, r.topicL2, r.topicL3].filter(Boolean).join(' › ')}</div>)}
                    </div>
                  )}
                  {publishDiff.moved.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>Moved ({publishDiff.moved.length})</div>
                      {publishDiff.moved.map(r => <div key={r.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>↕ {[r.topicL1, r.topicL2, r.topicL3].filter(Boolean).join(' › ')}</div>)}
                    </div>
                  )}
                  {publishDiff.renamed.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>Renamed ({publishDiff.renamed.length})</div>
                      {publishDiff.renamed.map((r, i) => <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>“{r.from}” → “{r.to}”</div>)}
                    </div>
                  )}
                  {publishDiff.reformatted.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Reformatted ({publishDiff.reformatted.length})</div>
                      {publishDiff.reformatted.map((r, i) => <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '8px' }}>{rowTitle(r.row)}: {r.from} → {r.to}</div>)}
                    </div>
                  )}
                </>
              )}

              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginTop: '8px', marginBottom: '4px' }}>Release note (optional)</label>
              <input
                className="struct-title-input"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '12px' }}
                placeholder="e.g. 2027 ESRS structure — front matter reordered"
                value={publishNote}
                onChange={e => setPublishNote(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn-ghost" onClick={() => setShowPublishConfirm(false)}>Cancel</button>
                <button className="btn-primary" onClick={confirmPublish}>Confirm &amp; Publish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove-with-content safeguard (review 21 Aug 2026) */}
      {pendingRemoval && (
        <div className="modal-overlay" onClick={() => setPendingRemoval(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Remove section with content?</h3>
              <button className="btn-ghost" onClick={() => setPendingRemoval(null)} style={{ fontSize: '18px', padding: '2px 8px' }}>✕</button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>⚠ {pendingRemoval.ref} “{pendingRemoval.title}” has authored content</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  This subsection contains <strong>~{pendingRemoval.words} words</strong> of drafted content
                  {pendingRemoval.drCount > 0 && <> and is mapped to <strong>{pendingRemoval.drCount} disclosure requirement{pendingRemoval.drCount !== 1 ? 's' : ''}</strong></>}.
                  Removing it from the structure drops the section on the next publish. The removal is recorded in the version history and can be rolled back, but the drafted content will not be carried forward.
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Consider exporting the section first, or reassigning its content, before removing it.
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-ghost" onClick={() => setPendingRemoval(null)}>Cancel</button>
                <button className="btn-primary" style={{ background: '#dc2626' }} onClick={() => { doRemoveRow(pendingRemoval.id); setPendingRemoval(null); }}>Remove anyway</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
