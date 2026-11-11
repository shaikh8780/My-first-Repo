import { useState } from 'react';
import type { ReportSection, SectionProgressMap } from '../../data/reportSections';
import { allRequiredOwnersSigned } from '../../data/reportSections';
import { contentToHtml } from './richTextSerializer';

// L2 consolidated view: shows every subsection under an L2 sub-topic as ONE
// continuous document. Editors/Owners can edit each subsection inline and it
// feeds back to the individual subsection data. The section's OWNERS review and
// sign off HERE, at the section (L2) level. Legal/Compliance owners are flagged
// separately — a single legal sign-off suffices, while every non-legal owner
// must sign (Adrian 2026-08-31). Owner sign-off unlocks once all subsections are
// marked "updated" (the Editor's confirmation that comments were addressed).

// One sign-off record per owner, keyed by owner name.
export interface OwnerSignOff { by: string; at: string; note?: string }
export type L2SignOffState = Record<string, OwnerSignOff>;

interface Props {
  topicL1: string;
  topicL2: string;
  subsections: ReportSection[];          // all leaves in this L2 group, in order
  progress: SectionProgressMap;          // section id → 'edited' | 'updated'
  canEditSubsections: boolean;           // acting seat may edit (Editor/Admin or an owner)
  currentActor: string;
  owners: string[];                      // the assigned Owner approvers for this L2 section
  legalOwners: string[];                 // subset of owners that are Legal/Compliance
  canSignOff: boolean;                   // acting seat is one of the owners (and hasn't signed yet)
  signOff: L2SignOffState;               // per-owner sign-off records
  onEditSubsection: (sectionId: string) => void;   // opens the normal subsection editor
  onComment: (sectionId: string) => void;          // jump to the subsection's comments
  onOwnerSignoff: (note: string) => void;          // record the CURRENT actor's owner sign-off
  // Release-to-audit (Adrian 2026-08-31): once fully approved, the Owner can
  // release this section to the external Auditor view.
  isApproved: boolean;
  isReleasedToAudit: boolean;
  canReleaseToAudit: boolean;
  onToggleReleaseToAudit: () => void;
}

export default function ConsolidatedSectionView({
  topicL1, topicL2, subsections, progress, canEditSubsections, currentActor,
  owners, legalOwners, canSignOff, signOff, onEditSubsection, onComment, onOwnerSignoff,
  isApproved, isReleasedToAudit, canReleaseToAudit, onToggleReleaseToAudit,
}: Props) {
  const [ownerNote, setOwnerNote] = useState('');

  const total = subsections.length;
  const updatedDone = subsections.filter(s => progress[s.id] === 'updated').length;
  const allUpdated = total > 0 && updatedDone === total;

  const ownersSigned = owners.filter(o => !!signOff[o]);
  // Approval rule (Adrian 2026-08-31): every non-legal owner signs; one legal
  // owner sign-off suffices. Shared with deriveStatus via allRequiredOwnersSigned.
  const isLegal = (o: string) => legalOwners.includes(o);
  const allOwnersSigned = allRequiredOwnersSigned(
    { inputProviders: [], owners, legalOwners },
    o => !!signOff[o],
  );
  const currentAlreadySigned = !!signOff[currentActor];
  // Any owner may sign in any order, once all subsections are marked "updated".
  const ownerCanActNow = allUpdated && canSignOff && !currentAlreadySigned;

  return (
    <div className="card" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{topicL1} › consolidated section</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>⧉ {topicL2}</h2>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {total} subsections as one document · the section owners review and sign off at this level
        </div>
      </div>

      {/* L2 sign-off progress + gate */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px 16px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
          <span>Subsections updated: <strong style={{ color: allUpdated ? 'var(--success)' : 'var(--text-primary)' }}>{updatedDone}/{total}</strong></span>
          <span>·</span>
          <span>Owner sign-off (L2): <strong style={{ color: allOwnersSigned ? 'var(--success)' : 'var(--text-muted)' }}>{ownersSigned.length}/{owners.length}</strong></span>
        </div>

        {/* Who signs off at this level — always shown, so the L2 owners are visible
            even before the section is unlocked. Every non-legal owner must sign;
            among Legal/Compliance owners a single sign-off suffices. */}
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-primary)' }}>
          {legalOwners.length > 0 ? (
            <>Approved at the <strong>section (L2)</strong> level once <strong>every non-legal owner</strong> and <strong>at least one Legal/Compliance owner</strong> have signed off:</>
          ) : (
            <>This section is approved at the <strong>section (L2)</strong> level once <strong>all {owners.length} owner{owners.length !== 1 ? 's' : ''}</strong> have signed off:</>
          )}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
            {owners.map((o, i) => {
              const signed = !!signOff[o];
              const legal = isLegal(o);
              return (
                <span key={o} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', border: `1px solid ${signed ? 'var(--success)' : 'var(--border-primary)'}`, borderRadius: '6px', padding: '4px 10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: signed ? '#16a34a' : legal ? '#b45309' : '#7c3aed', textTransform: 'uppercase' }}>{signed ? '✓' : `${i + 1} ·`} {legal ? 'Legal' : 'Owner'}</span>
                  <strong style={{ fontSize: '12px' }}>{o}</strong>
                  {legal && <span title="One Legal/Compliance sign-off suffices" style={{ fontSize: '10px', color: '#b45309' }}>(1 of {legalOwners.length} required)</span>}
                  {signed && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>signed</span>}
                </span>
              );
            })}
          </div>
        </div>

        {!allUpdated && (
          <div style={{ fontSize: '12px', color: '#b45309', marginTop: '10px' }}>
            Owner sign-off unlocks once all {total} subsections are marked “updated” by the Editor ({total - updatedDone} remaining).
          </div>
        )}

        {/* Owner sign-off — available to any assigned owner who hasn't signed yet */}
        {allUpdated && !allOwnersSigned && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Owner sign-off (section level)</div>
            {ownerCanActNow ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input value={ownerNote} onChange={e => setOwnerNote(e.target.value)} placeholder="Optional sign-off note" style={{ flex: 1, minWidth: '220px', fontSize: '12px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                <button className="btn-success btn-sm" onClick={() => onOwnerSignoff(ownerNote.trim())}>Sign off as {currentActor}</button>
              </div>
            ) : currentAlreadySigned ? (
              <div style={{ fontSize: '12px', color: 'var(--success)' }}>✓ You ({currentActor}) have signed off. Awaiting the remaining owner(s).</div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assigned to the section owners ({owners.join(', ')}). Switch “View as” to an owner seat to sign off.</div>
            )}
          </div>
        )}

        {allOwnersSigned && (
          <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600, marginTop: '10px' }}>
            ✓ Section fully approved at L2 — signed by {ownersSigned.map(o => signOff[o].by).join(', ')}.
          </div>
        )}

        {/* Release to Audit — an Owner releases the approved section to the
            external Auditor view (Adrian 2026-08-31). */}
        {isApproved && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-primary)' }}>
            {isReleasedToAudit ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>🔍 Released to the Audit view — visible to Auditors.</span>
                {canReleaseToAudit && (
                  <button className="btn-ghost btn-sm" onClick={onToggleReleaseToAudit} style={{ fontSize: '11px' }}>Withdraw from audit</button>
                )}
              </div>
            ) : canReleaseToAudit ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>This section is approved. Release it to the external Auditor view for assurance.</span>
                <button className="btn-primary btn-sm" onClick={onToggleReleaseToAudit} style={{ fontSize: '11px' }}>🔍 Release to Audit</button>
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Approved — a section Owner can release this to the Audit view.</span>
            )}
          </div>
        )}
      </div>

      {/* Continuous document — each subsection rendered in order */}
      {subsections.map((sec, i) => {
        const prog = progress[sec.id];
        const progLabel = prog === 'updated' ? '· ✓ updated' : prog === 'edited' ? '· ✎ edited' : '';
        return (
          <div key={sec.id} style={{ marginBottom: '22px', paddingBottom: '18px', borderBottom: i < subsections.length - 1 ? '1px dashed var(--border-primary)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{sec.ref}</span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{sec.topicL3 || sec.title}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>· Input Provider{sec.roles.inputProviders.length > 1 ? 's' : ''}: {sec.roles.inputProviders.join(', ')} {progLabel}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                {canEditSubsections && (
                  <button className="btn-secondary" onClick={() => onEditSubsection(sec.id)} style={{ fontSize: '11px', padding: '3px 10px' }}>Edit</button>
                )}
                <button className="btn-ghost" onClick={() => onComment(sec.id)} style={{ fontSize: '11px', padding: '3px 10px' }}>💬 Comment</button>
              </div>
            </div>
            <div
              className="consolidated-body"
              style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}
              dangerouslySetInnerHTML={{ __html: contentToHtml(sec.content) }}
            />
          </div>
        );
      })}
    </div>
  );
}
