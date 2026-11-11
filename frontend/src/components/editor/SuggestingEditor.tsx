import { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Extension } from '@tiptap/core';
import type { ReportSection } from '../../data/reportSections';
import { contentToHtml, htmlToContent } from './richTextSerializer';
import { MddReference } from './MddReferenceNode';
import {
  InsertionMark, DeletionMark, suggestingPlugin, acceptAll, rejectAll, countSuggestions,
  listSuggestions, resolveOne, loadTrackedDraft, saveTrackedDraft, clearTrackedDraft, htmlHasSuggestions,
  insertAiSuggestion,
} from './trackChanges';
import { aiChat } from '../../api/aiClient';

// Preview slice of the production track-changes engine (behind the
// `trackChangesEngine` flag). A single Word-like editing surface with
// track-changes ALWAYS ON: typing shows as a coloured insertion, deleting shows
// as a struck-through deletion, and you accept/reject in place. It persists open
// suggestions across reload and includes an in-editor AI chat whose edits arrive
// as AI-origin suggestions (like working in Word with an assistant).

interface Props {
  section: ReportSection;
  onSave: (sectionId: string, newContent: string, reason: string) => void;
  onCancel: () => void;
  currentUser: string;
}

export default function SuggestingEditor({ section, onSave, onCancel, currentUser }: Props) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reason, setReason] = useState('');
  const [suggesting, setSuggesting] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [, force] = useState(0);
  const rerender = () => force(n => n + 1);
  // Keep suggesting mode + author readable by the plugin without re-registering it.
  const cfgRef = useRef({ enabled: true, author: currentUser });
  cfgRef.current = { enabled: suggesting, author: currentUser };

  const editor = useEditor({
    extensions: [
      // Feature parity with RichContentEditor so tables/images/footnotes/align
      // in a section are recognised and NOT dropped on save (B8 hardening).
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: true }),
      MddReference,
      InsertionMark,
      DeletionMark,
      Extension.create({
        name: 'trackChangesSuggesting',
        addProseMirrorPlugins() {
          return [suggestingPlugin(() => cfgRef.current)];
        },
      }),
    ],
    // Hydrate from a saved suggestion draft (open marks survive reload) if one
    // exists for this section; otherwise start from the accepted content.
    content: loadTrackedDraft(section.id) ?? contentToHtml(section.content),
    editorProps: { attributes: { class: 'rte-surface', spellcheck: 'true' } },
    onUpdate: ({ editor: e }) => {
      // Persist open suggestions to the side-channel so they survive reload; if
      // none remain, clear the draft so we fall back to the accepted content.
      const html = e.getHTML();
      if (htmlHasSuggestions(html)) saveTrackedDraft(section.id, html);
      else clearTrackedDraft(section.id);
      rerender();
    },
    onSelectionUpdate: rerender,
  }, [section.id]);

  if (!editor) return null;

  // Test-only hook: expose the TipTap editor so E2E can position the caret
  // deterministically (synthetic key events can't reliably reach a block
  // boundary). Gated on the same build-time flag as the auth bypass, so it is
  // never present in a real deployed build.
  if (import.meta.env.VITE_E2E_AUTH_BYPASS === 'true') {
    (window as unknown as { __tcEditor?: unknown }).__tcEditor = editor;
  }

  const openCount = countSuggestions(editor);
  const suggestions = listSuggestions(editor);

  // Save persists the ACCEPTED text: accept everything into the doc, then
  // serialise. (In the full engine, open suggestions persist; this slice keeps
  // the persisted model identical to today — accepted string only.)
  const handleSave = () => {
    if (!reason.trim()) return;
    acceptAll(editor);
    const content = htmlToContent(editor.getHTML());
    // The accepted text is now the persisted content; the suggestion draft is
    // resolved, so clear its side-channel.
    clearTrackedDraft(section.id);
    onSave(section.id, content, reason.trim());
    setShowSaveModal(false);
    setReason('');
  };

  // AI chat refinement (#3): ask the AI to revise the draft. Its reply is shown,
  // and any proposed text is inserted as an AI-origin suggestion (a tracked
  // insertion, or a tracked replace of the current selection) to accept/reject.
  const askAi = (prompt?: string) => {
    const q = (prompt ?? aiPrompt).trim();
    if (!q || aiBusy) return;
    const hasSelection = !editor.state.selection.empty;
    setAiBusy(true);
    setAiReply('…');
    setAiPrompt('');
    // Real Bedrock call when the backend is live; local sim fallback otherwise
    // or on error (handled in aiChat). Grounded in the current section text.
    void aiChat({ prompt: q, sectionTitle: section.title, sectionContent: htmlToContent(editor.getHTML()) })
      .then(res => {
        // If the user selected text, treat any prompt as a "rephrase this" and use
        // the proposed text (falling back to a generic revision) as the replacement.
        const proposed = res.proposedText ?? (hasSelection ? 'revised text reflecting your instruction' : undefined);
        setAiReply(res.answer);
        if (proposed) { insertAiSuggestion(editor, proposed); rerender(); }
      })
      .finally(() => setAiBusy(false));
  };

  const hasSelection = !editor.state.selection.empty;
  const AI_QUICK = hasSelection
    ? ['Rephrase this more concisely', 'Make this more formal']
    : ['Draft a paragraph for this section', 'What do peers report here?'];

  return (
    <div className="content-editor">
      <div className="editor-toolbar" style={{ alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Editing: {section.title}</span>
        <span className="tc-preview-badge" title="Preview of the production track-changes engine">⚑ Track-changes preview</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => setShowSaveModal(true)}>Save Changes</button>
        </div>
      </div>

      {/* Track-changes control bar */}
      <div className="tc-bar">
        <label className="tc-toggle" title="When on, your edits are recorded as tracked suggestions (like Word's Track Changes)">
          <input type="checkbox" checked={suggesting} onChange={e => setSuggesting(e.target.checked)} />
          Track changes {suggesting ? 'ON' : 'OFF'}
        </label>
        <span className="tc-count">{openCount} open suggestion{openCount === 1 ? '' : 's'}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button className="btn-success btn-sm" disabled={openCount === 0} onClick={() => { acceptAll(editor); rerender(); }}>✓ Accept all</button>
          <button className="btn-danger btn-sm" disabled={openCount === 0} onClick={() => { rejectAll(editor); rerender(); }}>✕ Reject all</button>
        </div>
      </div>

      <EditorContent editor={editor} />

      {/* Per-change review list — accept/reject each suggestion individually
          (Word-style), in document order, in addition to Accept all/Reject all. */}
      {suggestions.length > 0 && (
        <div className="tc-review">
          <div className="tc-review-head">Suggestions — accept or reject each</div>
          {suggestions.map((s, i) => (
            <div key={`${s.kind}-${s.from}-${i}`} className="tc-review-item">
              <span className={`tc-chip ${s.kind}`}>{s.kind === 'insertion' ? 'Insert' : 'Delete'}</span>
              {s.origin === 'ai' && <span className="tc-chip ai">✦ AI</span>}
              <span className="tc-review-text">
                {s.kind === 'insertion'
                  ? <ins className="tc-ins">{s.text}</ins>
                  : <del className="tc-del">{s.text}</del>}
              </span>
              <span className="tc-review-actions">
                <button className="btn-success btn-sm" title="Accept this change" onClick={() => { resolveOne(editor, s, 'accept'); rerender(); }}>✓</button>
                <button className="btn-danger btn-sm" title="Reject this change" onClick={() => { resolveOne(editor, s, 'reject'); rerender(); }}>✕</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* In-editor AI chat (#3) — ask the assistant to draft or revise; its
          edits arrive as AI-origin suggestions to accept/reject. If text is
          selected, prompts act as a "rephrase this" on the selection. */}
      <div className="tc-ai">
        <div className="tc-ai-head">
          <span>✦ Ask AI to draft or revise</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
            {hasSelection ? 'acts on your selection' : 'select text first to revise a passage'}
          </span>
        </div>
        {aiReply && <div className="tc-ai-reply">{aiReply}</div>}
        <div className="tc-ai-quick">
          {AI_QUICK.map(qp => <button key={qp} className="ai-suggestion-chip" onClick={() => askAi(qp)}>{qp}</button>)}
        </div>
        <div className="chat-input-container">
          <input
            className="chat-input"
            type="text"
            placeholder={hasSelection ? 'e.g. rephrase this, keep the figures…' : 'e.g. draft a paragraph on our transition plan…'}
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askAi()}
            style={{ fontSize: '12px' }}
          />
          <button className="btn-primary" disabled={!aiPrompt.trim() || aiBusy} onClick={() => askAi()} style={{ padding: '6px 12px', fontSize: '12px' }}>{aiBusy ? 'Asking…' : 'Ask AI'}</button>
        </div>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
        <strong>Preview:</strong> single-view track-changes editor. Text you type is a
        <ins className="tc-ins"> green insertion</ins>, text you delete is a
        <del className="tc-del"> struck-through deletion</del> — accept/reject each below, or all at once. Open
        suggestions are kept if you leave and come back. The <strong>✦ Ask AI</strong> box drafts or revises the
        text and its edits arrive as AI suggestions you accept or reject. (Prototype: AI responses are simulated;
        production uses the Bedrock agents. Saving accepts all and writes the final text.)
      </div>

      {showSaveModal && (
        <div className="save-reason-modal">
          <div className="save-reason-content">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Save Changes</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              This accepts all suggestions and records the final text in the audit trail.
            </p>
            <textarea
              className="approval-comment-input"
              placeholder="e.g., Updated Scope 3 figures with FY2026 actuals"
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
