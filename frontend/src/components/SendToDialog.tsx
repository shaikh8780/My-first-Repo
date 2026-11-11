import { useState, useMemo } from 'react';
import { api } from '../api';
import { reportSections } from '../data/reportSections';
import type { CommentThread } from '../data/comments';
import { resolveRecipient } from '../data/sendTo';
import { AD_USERS } from '../data/syntheticDirectory';

// "Send To" (Adrian 2026-08-31): available on every page, to every role. Assigns
// an action/request to a person. Reuses the existing comment/request model so the
// item lands in that person's queue on the referenced subsection. A novartis.com
// recipient who is not yet in the directory is auto-provisioned as a Guest; a
// non-novartis.com address is rejected.

interface Props {
  // The seat sending the request (the current acting actor's display name).
  currentActor: string;
  onClose: () => void;
  onSent: (msg: string) => void;
}

export default function SendToDialog({ currentActor, onClose, onSent }: Props) {
  const [recipient, setRecipient] = useState('');
  const [sectionId, setSectionId] = useState(reportSections[0]?.id ?? '');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Directory suggestions for the datalist people-picker.
  const suggestions = useMemo(() => AD_USERS.map(u => ({ name: u.displayName, email: u.email })), []);

  // Live recipient preview (role / auto-guest) as they type.
  const onRecipientChange = (v: string) => {
    setRecipient(v);
    setError(null);
    if (!v.trim()) { setPreview(null); return; }
    const r = resolveRecipient(v);
    if (!r.ok) { setPreview(null); return; }
    setPreview(r.autoProvisionedGuest
      ? `New novartis.com recipient — will be added as ${r.roleLabel}`
      : `${r.displayName} · ${r.roleLabel}`);
  };

  const send = async () => {
    const r = resolveRecipient(recipient);
    if (!r.ok) { setError(r.error ?? 'Could not resolve recipient.'); return; }
    if (!body.trim()) { setError('Add a short note describing the action.'); return; }

    // Reuse the request model: an assigned request on the chosen subsection.
    const threads = await api.report.comments.get();
    const thread: CommentThread = {
      id: `st-${threads.length}-${sectionId}`,
      sectionId,
      kind: 'request',
      author: currentActor,
      authorRole: 'editor', // recorded as raised by the sender's seat; routing is via assignedTo
      createdAt: new Date().toISOString(),
      body: `[Sent to ${r.displayName}] ${body.trim()}`,
      status: 'assigned',
      assignedTo: r.displayName,
    };
    await api.report.comments.set([...threads, thread]);

    const sec = reportSections.find(s => s.id === sectionId);
    onSent(
      `Sent to ${r.displayName}${r.autoProvisionedGuest ? ' (added as Guest)' : ''}` +
      `${sec ? ` · ${sec.ref}` : ''}`,
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Send to…</h3>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '18px', padding: '2px 8px' }}>✕</button>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Assign an action or request to a colleague. Enter a name or a <strong>novartis.com</strong> email —
            a novartis.com recipient who isn’t set up yet is added automatically as a <strong>Guest</strong>.
          </div>

          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Recipient</label>
          <input
            list="sendto-people"
            value={recipient}
            onChange={e => onRecipientChange(e.target.value)}
            placeholder="Name or name@novartis.com"
            style={{ width: '100%', marginTop: '4px', marginBottom: preview ? '4px' : '10px', fontSize: '13px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          />
          <datalist id="sendto-people">
            {suggestions.map(s => <option key={s.email} value={s.name}>{s.email}</option>)}
          </datalist>
          {preview && <div style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '10px' }}>→ {preview}</div>}

          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>On subsection</label>
          <select
            value={sectionId}
            onChange={e => setSectionId(e.target.value)}
            style={{ width: '100%', marginTop: '4px', marginBottom: '10px', fontSize: '12px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            {reportSections.map(s => <option key={s.id} value={s.id}>{s.ref} — {s.topicL3 || s.title}</option>)}
          </select>

          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Action / request</label>
          <textarea
            value={body}
            onChange={e => { setBody(e.target.value); setError(null); }}
            rows={3}
            placeholder="e.g. Please confirm the FY2026 Scope 3 figure and attach the source."
            style={{ width: '100%', marginTop: '4px', fontSize: '13px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
          />

          {error && <div style={{ fontSize: '12px', color: 'var(--error, #dc2626)', marginTop: '8px', fontWeight: 600 }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button className="btn-ghost" onClick={onClose} style={{ fontSize: '12px', padding: '6px 14px' }}>Cancel</button>
            <button className="btn-primary" onClick={send} style={{ fontSize: '12px', padding: '6px 14px' }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
