import { useState } from 'react';
import type { CommentThread, ThreadKind } from '../../data/comments';
import { recommendHandling, isUnresolved } from '../../data/comments';
import { EDITOR_TEAM, isEditor } from '../../data/workflowRoles';

interface Props {
  sectionId: string;
  sectionRef: string;
  currentActor: string;
  actingIsEditor: boolean;
  canEditHere: boolean;        // whether the current seat can edit this subsection
  threads: CommentThread[];    // all threads (component filters to this section)
  onAdd: (t: CommentThread) => void;
  onUpdate: (t: CommentThread) => void;
  // Apply the (possibly Editor-adjusted) suggested text as a tracked change.
  onApplyAsTrackedChange: (sectionId: string, suggestedText: string, sourceThread: CommentThread) => void;
  // When embedded in a CollapsibleCard the card supplies the title + border, so
  // drop this panel's own top border/margin and internal title row.
  embedded?: boolean;
}

const kindLabel: Record<ThreadKind, string> = { comment: 'Comment', request: 'Change request' };

export default function CommentsPanel({
  sectionId, sectionRef, currentActor, actingIsEditor, canEditHere, threads, onAdd, onUpdate, onApplyAsTrackedChange, embedded = false,
}: Props) {
  const [draftBody, setDraftBody] = useState('');
  const [draftQuote, setDraftQuote] = useState('');
  // Roles that cannot edit here raise a "request"; others may still leave a plain
  // comment. Default the kind accordingly.
  const [draftKind, setDraftKind] = useState<ThreadKind>(canEditHere ? 'comment' : 'request');
  // Per-thread editable copy of the AI-suggested text (Editor can tweak before applying).
  const [editText, setEditText] = useState<Record<string, string>>({});

  // Per-thread "send back" note the Editor is drafting.
  const [sendBackText, setSendBackText] = useState<Record<string, string>>({});

  const sectionThreads = threads.filter(t => t.sectionId === sectionId);
  const openCount = sectionThreads.filter(t => isUnresolved(t.status)).length;

  const roleOf = (): CommentThread['authorRole'] => {
    if (isEditor(currentActor)) return 'editor';
    return canEditHere ? 'input_provider' : 'owner'; // demo heuristic; owner/legal both comment-only
  };

  const handleAdd = () => {
    if (!draftBody.trim()) return;
    const t: CommentThread = {
      id: `cr-${Date.now()}`,
      sectionId,
      kind: draftKind,
      author: currentActor,
      authorRole: roleOf(),
      createdAt: new Date().toISOString(),
      quote: draftQuote.trim() || undefined,
      body: draftBody.trim(),
      status: 'open',
    };
    onAdd(t);
    setDraftBody('');
    setDraftQuote('');
  };

  // Editor assigns a request to themselves / a team member and generates the AI
  // recommendation for how to handle it.
  const assignAndRecommend = (t: CommentThread, assignee: string) => {
    const ai = recommendHandling(t);
    onUpdate({ ...t, status: 'assigned', assignedTo: assignee, aiRecommendation: ai.recommendation, aiSuggestedText: ai.suggestedText });
    setEditText(prev => ({ ...prev, [t.id]: ai.suggestedText }));
  };

  // Resolve a request. The Editor may FIRST edit the suggested text (in the
  // textarea) — that edited text is applied to the document as a tracked change,
  // which the Editor can then further modify/accept in the editor (Adrian
  // 2026-08-31: "modify content in track changes before accepting"). Resolving
  // with an empty suggestion just closes the request without a text change.
  const resolve = (t: CommentThread, editedText: string, edited: boolean) => {
    const applied = editedText.trim().length > 0;
    if (applied) onApplyAsTrackedChange(sectionId, editedText, t);
    onUpdate({
      ...t,
      status: 'resolved',
      resolvedBy: currentActor,
      resolvedAt: new Date().toISOString(),
      resolutionNote: applied
        ? (edited
          ? 'Editor adjusted the suggestion, then resolved (applied as a tracked change to refine/accept).'
          : 'Editor resolved and applied the suggestion as a tracked change.')
        : 'Editor marked the request resolved (no text change).',
      aiSuggestedText: applied ? editedText : t.aiSuggestedText,
    });
  };

  const dismiss = (t: CommentThread) => {
    onUpdate({ ...t, status: 'dismissed', resolvedBy: currentActor, resolvedAt: new Date().toISOString(), resolutionNote: 'Dismissed by Editor.' });
  };

  // Send the request back to its author with a comment (Adrian 2026-08-31).
  const sendBack = (t: CommentThread, note: string) => {
    onUpdate({
      ...t,
      status: 'sent_back',
      resolvedBy: currentActor,
      resolvedAt: new Date().toISOString(),
      sentBackNote: note.trim() || undefined,
      resolutionNote: `Sent back to ${t.author}${note.trim() ? `: “${note.trim()}”` : ''}`,
    });
    setSendBackText(prev => ({ ...prev, [t.id]: '' }));
  };

  return (
    <div className="comments-panel" style={embedded ? undefined : { borderTop: '1px solid var(--border-primary)', marginTop: '20px', paddingTop: '16px' }}>
      {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700 }}>Comments &amp; Requests · {sectionRef} {openCount > 0 ? `(${openCount} open)` : ''}</span>
        </div>
      )}

      {/* Add a comment / request */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
          <select value={draftKind} onChange={e => setDraftKind(e.target.value as ThreadKind)} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <option value="comment">Comment</option>
            <option value="request">Change request (routes to Editors)</option>
          </select>
          {!canEditHere && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              You can’t edit this subsection — raise a request and an Editor/Admin will action it.
            </span>
          )}
        </div>
        <input
          value={draftQuote}
          onChange={e => setDraftQuote(e.target.value)}
          placeholder="Optional: quote the passage this refers to"
          style={{ width: '100%', fontSize: '12px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '6px' }}
        />
        <textarea
          value={draftBody}
          onChange={e => setDraftBody(e.target.value)}
          placeholder={draftKind === 'request' ? 'Describe the change you’d like an Editor to make…' : 'Add a comment…'}
          rows={2}
          style={{ width: '100%', fontSize: '13px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn-primary" disabled={!draftBody.trim()} onClick={handleAdd} style={{ fontSize: '12px', padding: '6px 14px' }}>
            {draftKind === 'request' ? 'Raise request' : 'Add comment'}
          </button>
        </div>
      </div>

      {/* Thread list */}
      {sectionThreads.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No comments or requests on this subsection yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sectionThreads.map(t => (
            <div key={t.id} style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', borderLeft: `3px solid ${t.kind === 'request' ? '#f59e0b' : 'var(--accent)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: t.kind === 'request' ? '#b45309' : 'var(--accent)', background: t.kind === 'request' ? '#fef3c7' : 'var(--accent-light)', padding: '1px 6px', borderRadius: '4px' }}>{kindLabel[t.kind]}</span>
                <strong style={{ fontSize: '12px' }}>{t.author}</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {new Date(t.createdAt).toLocaleDateString()}</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', color: '#fff', background: t.status === 'resolved' ? '#16a34a' : t.status === 'assigned' ? '#3b82f6' : t.status === 'dismissed' ? '#9ca3af' : t.status === 'sent_back' ? '#8b5cf6' : '#f59e0b' }}>{t.status === 'sent_back' ? 'sent back' : t.status}</span>
              </div>
              {t.quote && <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)', borderLeft: '2px solid var(--border-primary)', paddingLeft: '8px', margin: '4px 0' }}>“{t.quote}”</div>}
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.body}</div>

              {/* Editor actions for a request */}
              {t.kind === 'request' && actingIsEditor && (t.status === 'open' || t.status === 'assigned') && (
                <div style={{ marginTop: '10px' }}>
                  {t.status === 'open' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Assign to Editor/Admin:</span>
                      {EDITOR_TEAM.map(e => (
                        <button key={e} className="btn-secondary" onClick={() => assignAndRecommend(t, e)} style={{ fontSize: '11px', padding: '4px 10px' }}>{e}</button>
                      ))}
                      <button className="btn-secondary" onClick={() => assignAndRecommend(t, currentActor)} style={{ fontSize: '11px', padding: '4px 10px' }}>Me ({currentActor})</button>
                    </div>
                  )}

                  {t.status === 'assigned' && t.aiRecommendation && (
                    <div style={{ marginTop: '8px', background: 'var(--accent-light)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>✦ AI RECOMMENDATION · assigned to {t.assignedTo}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>{t.aiRecommendation}</div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>SUGGESTED TEXT (edit before approving if needed)</div>
                      <textarea
                        value={editText[t.id] ?? t.aiSuggestedText ?? ''}
                        onChange={e => setEditText(prev => ({ ...prev, [t.id]: e.target.value }))}
                        rows={3}
                        style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                      />
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Editing the suggested text applies it as a tracked change you can further refine and accept in the editor.
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <button className="btn-success btn-sm" onClick={() => resolve(t, editText[t.id] ?? t.aiSuggestedText ?? '', (editText[t.id] ?? t.aiSuggestedText) !== t.aiSuggestedText)} style={{ fontSize: '11px' }}>
                          ✓ Resolved
                        </button>
                        <button className="btn-ghost" onClick={() => dismiss(t)} style={{ fontSize: '11px' }}>Dismiss</button>
                      </div>
                      {/* Send back to the requester with a comment */}
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-primary)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>SEND BACK TO {t.author.toUpperCase()} (WITH COMMENTS)</div>
                        <textarea
                          value={sendBackText[t.id] ?? ''}
                          onChange={e => setSendBackText(prev => ({ ...prev, [t.id]: e.target.value }))}
                          rows={2}
                          placeholder="Explain what the requester should clarify or change…"
                          style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                        />
                        <button className="btn-secondary btn-sm" disabled={!(sendBackText[t.id] ?? '').trim()} onClick={() => sendBack(t, sendBackText[t.id] ?? '')} style={{ fontSize: '11px', marginTop: '6px' }}>
                          ↩ Send back
                        </button>
                      </div>
                    </div>
                  )}

                  {/* An 'open' request can be sent back or dismissed even before the
                      AI recommendation is generated (Editor's call). */}
                  {t.status === 'open' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <button className="btn-ghost btn-sm" onClick={() => dismiss(t)} style={{ fontSize: '11px' }}>Dismiss without assigning</button>
                    </div>
                  )}
                </div>
              )}

              {/* Non-editor viewing a request that hasn't been picked up yet */}
              {t.kind === 'request' && !actingIsEditor && t.status === 'open' && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Routed to Editors/Admins — awaiting action. Switch “View as” to Editor / Admin to action it.</div>
              )}

              {/* Sent-back requests are highlighted for the original author to action */}
              {t.status === 'sent_back' && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px', padding: '8px 10px' }}>
                  ↩ <strong>Sent back to {t.author}</strong> by {t.resolvedBy}{t.resolvedAt ? ` · ${new Date(t.resolvedAt).toLocaleDateString()}` : ''}
                  {t.sentBackNote && <div style={{ fontStyle: 'italic', marginTop: '4px' }}>“{t.sentBackNote}”</div>}
                </div>
              )}

              {/* Resolution audit line */}
              {(t.status === 'resolved' || t.status === 'dismissed') && t.resolutionNote && (
                <div style={{ fontSize: '11px', color: t.status === 'resolved' ? 'var(--success)' : 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>
                  {t.status === 'resolved' ? '✓' : '✕'} {t.resolutionNote} — {t.resolvedBy}{t.resolvedAt ? ` · ${new Date(t.resolvedAt).toLocaleDateString()}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
