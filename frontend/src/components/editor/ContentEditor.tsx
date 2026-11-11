import { useState } from 'react';
import type { ReportSection } from '../../data/reportSections';

interface Props {
  section: ReportSection;
  onSave: (sectionId: string, newContent: string, reason: string) => void;
  onCancel: () => void;
}

export default function ContentEditor({ section, onSave, onCancel }: Props) {
  const [content, setContent] = useState(section.content);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reason, setReason] = useState('');

  const hasChanges = content !== section.content;

  const handleSave = () => {
    if (!reason.trim()) return;
    onSave(section.id, content, reason.trim());
    setShowSaveModal(false);
    setReason('');
  };

  return (
    <div className="content-editor">
      <div className="editor-toolbar">
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Editing: {section.title}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" disabled={!hasChanges} onClick={() => setShowSaveModal(true)}>Save Changes</button>
        </div>
      </div>

      <textarea
        className="editor-textarea"
        value={content}
        onChange={e => setContent(e.target.value)}
        spellCheck={true}
      />

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
        Tip: Use **bold** for headings, [1] for citation markers, - for bullet points. Separate paragraphs with blank lines.
      </div>

      {showSaveModal && (
        <div className="save-reason-modal">
          <div className="save-reason-content">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Save Changes</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Describe what you changed and why. This will be recorded in the audit trail.
            </p>
            <textarea
              className="approval-comment-input"
              placeholder="e.g., Updated Scope 3 figures with FY2025 actuals from CDP submission"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={!reason.trim()} onClick={handleSave}>Save with Reason</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
