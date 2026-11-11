import { useState, useEffect, useMemo } from 'react';
import {
  analyzeSection, applyFlag, QUICK_PROMPTS,
  type EditorFlag, type FlagKind,
} from '../../data/aiEditor';
import { aiChat, aiAnalyze } from '../../api/aiClient';
import type { EvidenceDoc } from '../../data/sectionEvidence';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  proposedText?: string;
}

interface Props {
  sectionId: string;
  sectionTitle: string;
  sectionContent: string;
  evidence: EvidenceDoc[];
  // Insert AI-proposed text as a tracked change (Editor accepts/rejects it).
  onInsertTrackedChange: (newText: string, reason: string) => void;
  // Apply a style/consistency fix as a tracked MODIFICATION on a paragraph.
  onApplyFlag: (flag: EditorFlag, paragraphIndex: number, newParagraph: string, reason: string) => void;
  // Evidence management.
  onAddEvidence: (name: string, note: string) => void;
  onRemoveEvidence: (id: string) => void;
  onClose: () => void;
}

type Tab = 'chat' | 'review' | 'evidence';

const FLAG_META: Record<FlagKind, { label: string; color: string; icon: string }> = {
  typo: { label: 'Typo', color: '#ef4444', icon: '✎' },
  style: { label: 'Style guide', color: '#8b5cf6', icon: '✦' },
  consistency: { label: 'Consistency', color: '#f59e0b', icon: '⚠' },
};

export default function AiAssistantPanel({
  sectionId, sectionTitle, sectionContent, evidence,
  onInsertTrackedChange, onApplyFlag, onAddEvidence, onRemoveEvidence, onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>('chat');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [attachedId, setAttachedId] = useState<string | null>(null);
  const [dismissedFlags, setDismissedFlags] = useState<string[]>([]);
  // Model-found review flags (real AI). null until fetched; falls back to the
  // deterministic regex analyzer below when null (offline / error / not-yet-loaded).
  const [aiFlags, setAiFlags] = useState<EditorFlag[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    setMessages([]);
    setAttachedId(null);
    setDismissedFlags([]);
    setTab('chat');
  }, [sectionId]);

  // Fetch the real AI review for this section's content. Debounced-ish: runs on
  // section/content change; regex analyzer is the immediate fallback until (and
  // if) model flags arrive.
  useEffect(() => {
    let alive = true;
    setAnalyzing(true);
    setAiFlags(null);
    void aiAnalyze(sectionContent)
      .then(f => { if (alive) setAiFlags(f); })
      .finally(() => { if (alive) setAnalyzing(false); });
    return () => { alive = false; };
  }, [sectionId, sectionContent]);

  const attached = evidence.find(e => e.id === attachedId) || null;

  // Use the model flags when available, else the deterministic regex analyzer.
  // Hide ones the user dismissed.
  const flags = useMemo(() => {
    const base = aiFlags ?? analyzeSection(sectionContent);
    return base.filter(f => !dismissedFlags.includes(f.id));
  }, [aiFlags, sectionContent, dismissedFlags]);

  const handleSubmit = (q?: string) => {
    const question = q || query.trim();
    if (!question || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setQuery('');
    setIsTyping(true);
    // Real Bedrock call when the backend is live (VITE_API_MODE=rest); falls back
    // to the deterministic local sim offline or on error (handled in aiChat).
    void aiChat({ prompt: question, sectionTitle, sectionContent, evidenceName: attached?.name })
      .then(res => {
        setMessages(prev => [...prev, { role: 'assistant', content: res.answer, proposedText: res.proposedText }]);
      })
      .finally(() => setIsTyping(false));
  };

  const paras = sectionContent.split('\n\n');

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700 }}>✦ AI Assistant</span>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '16px', padding: '2px 6px' }}>✕</button>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Context: {sectionTitle}</div>
        {/* Tabs */}
        <div className="ai-tabs" style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
          <button className={`ai-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>Chat</button>
          <button className={`ai-tab ${tab === 'review' ? 'active' : ''}`} onClick={() => setTab('review')}>
            Review {flags.length > 0 && <span className="ai-tab-badge">{flags.length}</span>}
          </button>
          <button className={`ai-tab ${tab === 'evidence' ? 'active' : ''}`} onClick={() => setTab('evidence')}>
            Evidence {evidence.length > 0 && <span className="ai-tab-badge">{evidence.length}</span>}
          </button>
        </div>
      </div>

      {/* ===== CHAT TAB ===== */}
      {tab === 'chat' && (
        <>
          <div className="ai-panel-messages">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 12px' }}>
                <div style={{ fontSize: '26px', marginBottom: '10px', opacity: 0.4 }}>✦</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Ask about requirements or peers, or attach an evidence document and ask me to update the text to reflect it. Proposed edits are inserted as tracked changes for the Editor to accept.
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`} style={{ marginBottom: '10px' }}>
                <div className="chat-message-content">
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} style={{ margin: line === '' ? '6px 0' : '3px 0', fontSize: '13px' }}>{line}</p>
                  ))}
                </div>
                {msg.proposedText && (
                  <div className="ai-proposed">
                    <div className="ai-proposed-label">Proposed text</div>
                    <div className="ai-proposed-text">{msg.proposedText}</div>
                    <button
                      className="ai-apply-btn"
                      onClick={() => onInsertTrackedChange(msg.proposedText!, `AI-drafted text${attached ? ` grounded in ${attached.name}` : ''} — inserted from AI Assistant`)}
                    >
                      ✎ Insert as tracked change
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="chat-message assistant" style={{ marginBottom: '10px' }}>
                <div className="chat-typing"><span></span><span></span><span></span></div>
              </div>
            )}
          </div>

          {/* Attached-evidence chip */}
          {attached && (
            <div className="ai-attached">
              📎 Grounding in <strong>{attached.name}</strong>
              <button className="btn-ghost" onClick={() => setAttachedId(null)} style={{ fontSize: '11px', padding: '0 4px', marginLeft: 'auto' }}>✕</button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="ai-suggestions">
              {QUICK_PROMPTS.map((s, i) => (
                <button key={i} className="ai-suggestion-chip" onClick={() => handleSubmit(s)}>{s}</button>
              ))}
            </div>
          )}

          <div className="ai-panel-input">
            {evidence.length > 0 && !attached && (
              <div style={{ marginBottom: '6px' }}>
                <select
                  value=""
                  onChange={e => { if (e.target.value) { setAttachedId(e.target.value); } }}
                  style={{ width: '100%', fontSize: '11px', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                >
                  <option value="">📎 Attach evidence document…</option>
                  {evidence.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            )}
            <div className="chat-input-container">
              <input
                className="chat-input"
                type="text"
                placeholder="Ask about this section…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ fontSize: '12px' }}
              />
              <button className="btn-primary" disabled={!query.trim() || isTyping} onClick={() => handleSubmit()} style={{ padding: '6px 12px', fontSize: '12px' }}>Send</button>
            </div>
          </div>
        </>
      )}

      {/* ===== REVIEW TAB (typo / style / consistency flags) ===== */}
      {tab === 'review' && (
        <div className="ai-panel-messages" style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
            {analyzing ? '✦ AI is reviewing this section…' : `${aiFlags ? '✦ AI' : 'Automated'} typo, style-guide and consistency checks.`} Applying a fix inserts an AI-origin tracked change — the Editor still accepts it.
          </div>
          {analyzing && flags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>Analysing…</div>
          ) : flags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', fontSize: '12px', color: 'var(--success)' }}>
              ✓ No issues found in this section.
            </div>
          ) : (
            flags.map(flag => {
              const meta = FLAG_META[flag.kind];
              return (
                <div key={flag.id} className="ai-flag" style={{ borderLeft: `3px solid ${meta.color}` }}>
                  <div className="ai-flag-head">
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: meta.color }}>{meta.icon} {meta.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>¶{flag.paragraphIndex + 1}</span>
                  </div>
                  <div style={{ fontSize: '12px', margin: '4px 0' }}>{flag.message}</div>
                  <div className="ai-flag-diff">
                    <span className="ai-flag-old">{flag.original}</span>
                    <span style={{ margin: '0 4px' }}>→</span>
                    <span className="ai-flag-new">{flag.suggestion}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button
                      className="ai-apply-btn"
                      style={{ margin: 0 }}
                      onClick={() => {
                        const para = paras[flag.paragraphIndex] ?? '';
                        const next = applyFlag(para, flag);
                        onApplyFlag(flag, flag.paragraphIndex, next, `AI ${meta.label.toLowerCase()} fix: ${flag.message}`);
                        setDismissedFlags(prev => [...prev, flag.id]);
                      }}
                    >
                      ✎ Apply as tracked change
                    </button>
                    <button className="btn-ghost" style={{ fontSize: '11px' }} onClick={() => setDismissedFlags(prev => [...prev, flag.id])}>Dismiss</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===== EVIDENCE TAB ===== */}
      {tab === 'evidence' && (
        <EvidenceTab
          evidence={evidence}
          onAddEvidence={onAddEvidence}
          onRemoveEvidence={onRemoveEvidence}
          onGround={(id) => { setAttachedId(id); setTab('chat'); }}
        />
      )}
    </div>
  );
}

function EvidenceTab({ evidence, onAddEvidence, onRemoveEvidence, onGround }: {
  evidence: EvidenceDoc[];
  onAddEvidence: (name: string, note: string) => void;
  onRemoveEvidence: (id: string) => void;
  onGround: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="ai-panel-messages" style={{ padding: '12px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
        Documents attached as evidence for this section. The AI grounds its drafting in these — attach one, then ask it to "update the text to reflect this document".
      </div>

      {evidence.length === 0 && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>No evidence documents yet.</div>
      )}

      {evidence.map(e => (
        <div key={e.id} className="ai-evidence-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>{e.source === 'upload' ? '📄' : '🗂'}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, wordBreak: 'break-all' }}>{e.name}</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {e.docType} · added by {e.addedBy}{e.sizeLabel ? ` · ${e.sizeLabel}` : ''}
          </div>
          {e.note && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '3px' }}>{e.note}</div>}
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <button className="ai-apply-btn" style={{ margin: 0 }} onClick={() => onGround(e.id)}>Ground AI in this</button>
            <button className="btn-ghost" style={{ fontSize: '11px' }} onClick={() => onRemoveEvidence(e.id)}>Remove</button>
          </div>
        </div>
      ))}

      {/* Add evidence (simulated upload / KB pick) */}
      <div className="ai-evidence-add">
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Attach a document</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Document name (e.g. Water-EHS-Audit-2026.pdf)"
          style={{ width: '100%', fontSize: '11px', padding: '5px 7px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '6px' }}
        />
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Why is it relevant? (optional)"
          style={{ width: '100%', fontSize: '11px', padding: '5px 7px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '6px' }}
        />
        <button
          className="btn-primary"
          disabled={!name.trim()}
          onClick={() => { onAddEvidence(name.trim(), note.trim()); setName(''); setNote(''); }}
          style={{ fontSize: '11px', padding: '5px 12px' }}
        >
          + Attach evidence
        </button>
      </div>
    </div>
  );
}
