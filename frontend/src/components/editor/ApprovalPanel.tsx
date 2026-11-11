import { useState } from 'react';
import type { ReportSection } from '../../data/reportSections';
import { allRequiredOwnersSigned } from '../../data/reportSections';
import type { L2SignOffState } from './ConsolidatedSectionView';

interface Props {
  section: ReportSection;
  currentActor: string;
  // Pre-sign-off phase for THIS subsection: has the Editor marked it "updated"
  // (all comments addressed) after the Input Provider(s) edited it?
  contentUpdated: boolean;
  // L2 status for the section this subsection belongs to (Owners incl. Legal).
  l2SignOff?: L2SignOffState;
  l2Label?: string;                 // the L2 sub-topic name (section this rolls up to)
  // Whether to show the L2 (Owner) action + detail. Hidden for the
  // Input-Provider seat, which sees a simplified view (13 Jul 2026 feedback #12).
  showL2?: boolean;
  // Open the L2 consolidated section view, where Owners sign off.
  onOpenSectionView?: (section: ReportSection) => void;
}

// Approval model (Adrian 2026-08-31):
//   Content updated (Editor confirms comments addressed) → Owner sign-off at L2.
//   Input Providers no longer sign off at L3; among Legal owners one sign-off
//   suffices. Presented as a horizontal stepper with expandable details.

type StepState = 'done' | 'current' | 'pending';

interface StepModel {
  key: string;
  label: string;
  levelBadge: string;                 // "L3" / "L2"
  name: string;
  state: StepState;
  at?: string;                        // ISO timestamp of the sign-off, if recorded
  note?: string;                      // optional sign-off note
  stateText: string;                  // "Signed off" / "Awaiting…" etc.
}

const STEP_COLOR: Record<StepState, string> = {
  done: '#16a34a',        // green
  current: '#8b5cf6',     // purple accent (matches L2 palette)
  pending: '#9ca3af',     // grey
};

function fmtDate(iso?: string): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
}

export default function ApprovalPanel({ section, currentActor, contentUpdated, l2SignOff, l2Label, showL2 = true, onOpenSectionView }: Props) {
  const [open, setOpen] = useState(false);
  if (section.stage === 'exported') return null;

  const owners = section.roles.owners;
  const legalOwners = section.roles.legalOwners;
  const sectionLabel = l2Label ?? section.topicL2 ?? section.topicL1;

  // Steps: "Content updated" (Editor confirms comments addressed) then one step
  // per assigned Owner (L2). The "current" step is the first not-yet-done one.
  // Owners may sign in any order, so an owner is "done" once its own record
  // exists; the first unsigned owner after the updated step is shown as current.
  const ownerDoneFlags = owners.map(o => !!l2SignOff?.[o]);
  const doneFlags = [contentUpdated, ...ownerDoneFlags];
  const currentIndex = doneFlags.findIndex(d => !d); // -1 if all done
  const stateFor = (i: number): StepState =>
    doneFlags[i] ? 'done' : i === currentIndex ? 'current' : 'pending';

  const steps: StepModel[] = [
    {
      key: 'updated', label: 'Content updated', levelBadge: 'L3',
      name: section.roles.inputProviders.join(', ') || 'Unassigned', state: stateFor(0),
      stateText: contentUpdated ? 'Updated' : currentIndex === 0 ? 'Awaiting Editor' : 'Pending',
    },
    ...owners.map((owner, i) => {
      const rec = l2SignOff?.[owner];
      const idx = i + 1;
      const legal = legalOwners.includes(owner);
      return {
        key: `owner-${i}`,
        label: legal ? 'Legal owner' : owners.length > 1 ? `Owner ${i + 1}` : 'Owner',
        levelBadge: 'L2',
        name: rec?.by ?? owner,
        state: stateFor(idx),
        at: rec?.at, note: rec?.note,
        stateText: rec ? 'Signed off' : currentIndex === idx ? 'Awaiting sign-off' : 'Pending',
      } as StepModel;
    }),
  ];

  const signedOwnerCount = ownerDoneFlags.filter(Boolean).length;
  const allOwnersSigned = allRequiredOwnersSigned(section.roles, o => !!l2SignOff?.[o]);

  // Headline status pill (one glance = where we are).
  const headline = allOwnersSigned ? { text: 'Approved', color: '#16a34a' }
    : signedOwnerCount > 0 ? { text: `Owners signed ${signedOwnerCount}/${owners.length}`, color: '#8b5cf6' }
    : contentUpdated ? { text: 'Updated — awaiting Owners', color: '#0ea5e9' }
    : { text: 'In progress', color: '#f59e0b' };

  const doneCount = doneFlags.filter(Boolean).length;
  const progressPct = (doneCount / steps.length) * 100;

  const glyph = (s: StepState) => (s === 'done' ? '✓' : s === 'current' ? '●' : '○');

  return (
    <div className="approval-panel">
      <div className="appr-head">
        <span className="appr-title">Approval workflow · {section.ref}</span>
        <span className="appr-status" style={{ background: headline.color }}>{headline.text}</span>
      </div>

      {/* Horizontal stepper */}
      <div className="appr-stepper" role="list">
        {/* connecting track + progress fill behind the nodes */}
        <div className="appr-track"><div className="appr-track-fill" style={{ width: `${progressPct}%` }} /></div>
        {steps.map(step => (
          <div className="appr-step" role="listitem" key={step.key}>
            <div className="appr-node" style={{ background: STEP_COLOR[step.state], boxShadow: step.state === 'current' ? `0 0 0 4px ${STEP_COLOR.current}22` : 'none' }}>
              {glyph(step.state)}
            </div>
            <div className="appr-step-label">
              {step.label}
              {step.key !== 'ip' && <span className="appr-level">{step.levelBadge}</span>}
            </div>
            <div className="appr-step-name" title={step.name}>{step.name}</div>
            <div className="appr-step-state" style={{ color: STEP_COLOR[step.state] }}>{step.stateText}</div>
          </div>
        ))}
      </div>

      {/* Expandable details */}
      <button className="appr-details-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s', display: 'inline-block' }}>▸</span>
        {open ? 'Hide details' : 'Details'}
      </button>

      {open && (
        <div className="appr-details">
          {steps.map(step => {
            const when = fmtDate(step.at);
            return (
              <div className="appr-detail-row" key={step.key}>
                <span className="appr-detail-dot" style={{ background: STEP_COLOR[step.state] }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>
                    {step.label} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {step.name}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {step.state === 'done'
                      ? (when ? `Signed off ${when}` : 'Signed off')
                      : step.state === 'current' ? 'Awaiting sign-off' : 'Pending earlier sign-offs'}
                    {step.key === 'updated' && step.state === 'done' && ' · comments addressed; ready for owner sign-off'}
                  </div>
                  {step.note && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>“{step.note}”</div>}
                </div>
              </div>
            );
          })}

          {showL2 && (
            <div className="appr-l2-note">
              The section owners review and sign off at the <strong>section (L2)</strong> level — across all subsections of “{sectionLabel}” at once — not on this individual subsection. Every non-legal owner must sign; among Legal/Compliance owners a single sign-off suffices.
            </div>
          )}

          {showL2 && onOpenSectionView && (
            <button className="btn-secondary" onClick={() => onOpenSectionView(section)} style={{ fontSize: '12px', padding: '6px 12px', marginTop: '10px' }}>
              ⧉ Open “{sectionLabel}” section view {section.roles.owners.includes(currentActor) ? 'to sign off' : 'to review'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
