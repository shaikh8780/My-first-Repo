import { useState } from 'react';
import type { TrackedChange } from '../../data/editorChanges';
import { diffWords } from '../../utils/wordDiff';

// Render a modification as a single inline word-level redline so a partial edit
// (e.g. a few deleted words) reads clearly — removed words struck-through, added
// words underlined — instead of the whole old paragraph struck + whole new
// paragraph added, which buried small deletions (2026-07-15 feedback).
function WordRedline({ original, next }: { original: string; next: string }) {
  const tokens = diffWords(original, next);
  return (
    <div className="diff-line" style={{ fontFamily: 'inherit' }}>
      {tokens.map((t, i) =>
        t.op === 'equal' ? <span key={i}>{t.text}</span>
        : t.op === 'del' ? <span key={i} className="tc-del" style={{ textDecoration: 'line-through' }}>{t.text}</span>
        : <span key={i} className="tc-ins">{t.text}</span>,
      )}
    </div>
  );
}

// An uploaded image is stored in the content string as markdown `![alt](dataurl)`.
// The data URL is a multi-KB base64 blob that, shown raw in the diff, is unreadable
// noise. Detect an image-only paragraph and surface a human-readable summary
// (filename + a small thumbnail) instead of the encoded bytes.
const IMAGE_BLOCK = /^!\[([^\]]*)\]\((data:[^)]+|[^)]+)\)$/s;

interface ImageInfo { alt: string; src: string; }

function imageInfo(text: string | undefined): ImageInfo | null {
  if (!text) return null;
  const m = text.trim().match(IMAGE_BLOCK);
  if (!m) return null;
  return { alt: m[1] || 'image', src: m[2] };
}

// A friendly line for an image side of a diff: a thumbnail + the file name,
// coloured to match insertion (green) / deletion (red).
function ImageDiffLine({ info, kind }: { info: ImageInfo; kind: 'insertion' | 'deletion' }) {
  const isDel = kind === 'deletion';
  return (
    <div
      className={`diff-line ${kind}`}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'inherit' }}
    >
      <img
        src={info.src}
        alt=""
        aria-hidden="true"
        style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-primary)', flexShrink: 0 }}
      />
      <span style={{ textDecoration: 'none' }}>
        {isDel ? '🖼 Image removed' : '🖼 Image inserted'}: <strong>{info.alt}</strong>
      </span>
    </div>
  );
}

interface Props {
  changes: TrackedChange[];
  canReview?: boolean;      // is the current actor the responsible stage reviewer?
  reviewerHint?: string;    // tooltip shown when review is not permitted
  onAccept: (changeId: string) => void;
  onReject: (changeId: string) => void;
  // Accept after editing the change's text (Editor modifies before accepting).
  onAcceptEdited?: (changeId: string, editedText: string) => void;
  // When embedded in a CollapsibleCard, the card provides the title + collapse
  // chrome, so suppress this panel's own header/wrapper.
  embedded?: boolean;
}

export default function ChangeTracker({ changes, canReview = true, reviewerHint, onAccept, onReject, onAcceptEdited, embedded = false }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  // Which change is being edited before accept, and the working text.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const filtered = changes.filter(c => filter === 'all' || c.status === filter);
  const pendingCount = changes.filter(c => c.status === 'pending').length;

  if (changes.length === 0) return embedded ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No tracked changes on this subsection.</div> : null;

  const body = (
    <>
      <div className="filter-tabs" style={{ marginBottom: '12px' }}>
            <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({changes.length})</button>
            <button className={`filter-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending ({pendingCount})</button>
            <button className={`filter-tab ${filter === 'accepted' ? 'active' : ''}`} onClick={() => setFilter('accepted')}>Accepted</button>
            <button className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Rejected</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(change => {
              // Prefer a readable image summary over the raw base64 data URL.
              const delImage = imageInfo(change.originalText);
              const insImage = imageInfo(change.newText);
              return (
              <div key={change.id} className={`change-item ${change.status}`} style={change.origin === 'ai' ? { borderLeft: '3px solid #8b5cf6', paddingLeft: '10px' } : undefined}>
                <div className="change-meta">
                  {change.origin === 'ai' && (
                    <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.12)', padding: '1px 6px', borderRadius: '4px', marginRight: '6px' }}>✦ AI DRAFT</span>
                  )}
                  {change.drRef && (
                    <span style={{ display: 'inline-block', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '1px 6px', borderRadius: '4px', marginRight: '6px' }}>{change.drRef}</span>
                  )}
                  <strong>{change.author}</strong> · {new Date(change.timestamp).toLocaleDateString()} · <em>{change.reason}</em>
                </div>

                {change.type === 'deletion' && (
                  delImage
                    ? <ImageDiffLine info={delImage} kind="deletion" />
                    : <div className="diff-line deletion">{change.originalText}</div>
                )}
                {change.type === 'insertion' && (
                  insImage
                    ? <ImageDiffLine info={insImage} kind="insertion" />
                    : <div className="diff-line insertion">+ {change.newText}</div>
                )}
                {change.type === 'modification' && (
                  (delImage || insImage) ? (
                    <>
                      {delImage
                        ? <ImageDiffLine info={delImage} kind="deletion" />
                        : <div className="diff-line deletion">- {change.originalText}</div>}
                      {insImage
                        ? <ImageDiffLine info={insImage} kind="insertion" />
                        : <div className="diff-line insertion">+ {change.newText}</div>}
                    </>
                  ) : (
                    // Text modification → inline word-level redline so removed
                    // words are clearly struck-through, not buried in a full
                    // old-paragraph/new-paragraph block.
                    <WordRedline original={change.originalText} next={change.newText} />
                  )
                )}

                {change.status === 'pending' && editingId !== change.id && (
                  <div className="change-actions" title={canReview ? '' : reviewerHint}>
                    <button className="btn-success btn-sm" disabled={!canReview} onClick={() => onAccept(change.id)}>Accept</button>
                    {/* Editor may modify the change text before accepting it — not
                        offered for image blocks (edited as raw markdown is unhelpful). */}
                    {onAcceptEdited && !delImage && !insImage && (
                      <button
                        className="btn-secondary btn-sm"
                        disabled={!canReview}
                        onClick={() => { setEditingId(change.id); setEditDraft(change.type === 'deletion' ? change.originalText : change.newText); }}
                      >
                        Edit &amp; accept
                      </button>
                    )}
                    <button className="btn-danger btn-sm" disabled={!canReview} onClick={() => onReject(change.id)}>Reject</button>
                  </div>
                )}
                {change.status === 'pending' && editingId === change.id && onAcceptEdited && (
                  <div style={{ marginTop: '8px' }}>
                    <textarea
                      value={editDraft}
                      onChange={e => setEditDraft(e.target.value)}
                      rows={3}
                      style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                    />
                    <div className="change-actions" style={{ marginTop: '6px' }}>
                      <button className="btn-success btn-sm" disabled={!editDraft.trim()} onClick={() => { onAcceptEdited(change.id, editDraft); setEditingId(null); }}>Accept edited</button>
                      <button className="btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
                {change.status === 'accepted' && (
                  <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '6px', fontWeight: 600 }}>✓ Accepted</div>
                )}
                {change.status === 'rejected' && (
                  <div style={{ fontSize: '11px', color: 'var(--error)', marginTop: '6px', fontWeight: 600 }}>✗ Rejected</div>
                )}
              </div>
              );
            })}
          </div>
    </>
  );

  if (embedded) return body;

  return (
    <div className="change-tracker">
      <div className="change-tracker-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="change-tracker-title">
          Tracked Changes ({pendingCount} pending)
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
          {collapsed ? '▸ Show' : '▾ Hide'}
        </span>
      </div>
      {!collapsed && body}
    </div>
  );
}
