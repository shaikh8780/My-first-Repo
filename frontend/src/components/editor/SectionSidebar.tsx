import { useMemo, useState } from 'react';
import type { ReportSection, SectionProgressMap } from '../../data/reportSections';
import { rollForwardColors, rollForwardLabels, contentFormatIcons } from '../../data/reportSections';
import { deriveStatus } from '../../data/workflowStatus';
import type { L2SignOffState } from './ConsolidatedSectionView';

interface Props {
  sections: ReportSection[];
  selectedId: string;
  onSelect: (section: ReportSection) => void;
  // Selecting an L2 sub-topic opens the consolidated section view (all its
  // subsections as one document — where Owner/Legal review and sign off at L2).
  onSelectL2?: (topicL1: string, topicL2: string) => void;
  selectedL2?: { topicL1: string; topicL2: string } | null;
  // Live workflow state so the status dot reflects the derived workflow status
  // (edited/updated → Owner L2), not the stale `stage` field.
  progress: SectionProgressMap;
  l2SignOffs: Record<string, L2SignOffState>;
}

// The stored sections are a flat, ordered list of leaf rows carrying topicL1/L2/L3.
// The blueprint hierarchy is:
//   L1 (e.g. "Business model")            — a top-level topic, or a standalone
//                                            front-matter item with no children
//     L2 (e.g. "Corporate governance")    — a sub-topic within an L1
//       L3 (e.g. "Oversight – Board")     — the individual subsection (a leaf)
// A row with no L2 is itself the leaf (e.g. "Front Cover", "Stakeholder engagement").
interface L2Group { name: string; leaves: ReportSection[] }
interface L1Group { name: string; directLeaf?: ReportSection; l2s: L2Group[] }

function buildTree(sections: ReportSection[]): L1Group[] {
  const l1s: L1Group[] = [];
  const l1Index = new Map<string, L1Group>();
  const l2Index = new Map<string, L2Group>();

  for (const s of sections) {
    let l1 = l1Index.get(s.topicL1);
    if (!l1) { l1 = { name: s.topicL1, l2s: [] }; l1Index.set(s.topicL1, l1); l1s.push(l1); }

    if (!s.topicL2) {
      // Row is a standalone leaf at the L1 level (front matter, single-row topics).
      l1.directLeaf = s;
      continue;
    }

    const l2key = `${s.topicL1}||${s.topicL2}`;
    let l2 = l2Index.get(l2key);
    if (!l2) { l2 = { name: s.topicL2, leaves: [] }; l2Index.set(l2key, l2); l1.l2s.push(l2); }
    l2.leaves.push(s);
  }
  return l1s;
}

function StatusDots({ sec, progress, l2SignOffs }: { sec: ReportSection; progress: SectionProgressMap; l2SignOffs: Record<string, L2SignOffState> }) {
  const status = deriveStatus(sec, progress, l2SignOffs);
  return (
    <>
      <span title={`Roll-forward: ${rollForwardLabels[sec.rollForwardStatus]}`} style={{ width: '6px', height: '6px', borderRadius: '2px', background: rollForwardColors[sec.rollForwardStatus], flexShrink: 0 }} />
      <span title={`Status: ${status.label}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: status.color, flexShrink: 0 }} />
    </>
  );
}

export default function SectionSidebar({ sections, selectedId, onSelect, onSelectL2, selectedL2, progress, l2SignOffs }: Props) {
  const tree = useMemo(() => buildTree(sections), [sections]);

  // Collapsible L1 groups — default all expanded, and always keep the group
  // containing the current selection open.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (name: string) =>
    setCollapsed(prev => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });

  const leafButton = (sec: ReportSection, indent: number) => (
    <button
      key={sec.id}
      onClick={() => onSelect(sec)}
      title={`${sec.ref} · ${deriveStatus(sec, progress, l2SignOffs).label} · ${rollForwardLabels[sec.rollForwardStatus]}`}
      style={{
        width: '100%', textAlign: 'left', padding: '6px 10px', paddingLeft: `${10 + indent * 12}px`, border: 'none',
        background: selectedId === sec.id ? 'var(--accent-light)' : 'transparent',
        borderRadius: '6px', cursor: 'pointer', marginBottom: '1px',
        display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)',
      }}
    >
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '34px', fontFamily: 'monospace' }}>{sec.ref}</span>
      <span style={{ fontSize: '11px', opacity: 0.6 }}>{contentFormatIcons[sec.contentFormat]}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: '12px', fontWeight: 500, color: selectedId === sec.id ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {sec.topicL3 || sec.topicL2 || sec.title}
      </span>
      <StatusDots sec={sec} progress={progress} l2SignOffs={l2SignOffs} />
    </button>
  );

  return (
    <div className="card section-tree">
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 10px', marginBottom: '4px' }}>
        {sections.length} subsections
      </div>
      {tree.map(l1 => {
        const isCollapsed = collapsed.has(l1.name);
        const hasChildren = !!l1.l2s.length;
        return (
          <div key={l1.name} style={{ marginBottom: '6px' }}>
            {/* L1 header. If it is a standalone leaf, clicking selects it; otherwise it toggles. */}
            <div
              onClick={() => l1.directLeaf ? onSelect(l1.directLeaf) : hasChildren && toggle(l1.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', padding: '7px 10px',
                background: l1.directLeaf && selectedId === l1.directLeaf.id ? 'var(--accent-light)' : 'var(--bg-secondary)',
                borderRadius: '6px',
              }}
            >
              {hasChildren && <span style={{ fontSize: '9px', width: '10px', color: 'var(--text-muted)' }}>{isCollapsed ? '▶' : '▼'}</span>}
              {l1.directLeaf && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{l1.directLeaf.ref}</span>}
              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l1.name}</span>
              {l1.directLeaf && <StatusDots sec={l1.directLeaf} progress={progress} l2SignOffs={l2SignOffs} />}
            </div>

            {hasChildren && !isCollapsed && l1.l2s.map(l2 => {
              const isL2Selected = selectedL2?.topicL1 === l1.name && selectedL2?.topicL2 === l2.name;
              return (
              <div key={l2.name} style={{ marginTop: '2px' }}>
                {/* L2 sub-topic header — clicking opens the consolidated section view. */}
                <div
                  onClick={() => onSelectL2?.(l1.name, l2.name)}
                  title="Open consolidated section view (Owner/Legal review & sign off at this level)"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600,
                    color: isL2Selected ? 'var(--accent)' : 'var(--text-secondary)', padding: '4px 10px 4px 22px',
                    cursor: 'pointer', borderRadius: '6px',
                    background: isL2Selected ? 'var(--accent-light)' : 'transparent',
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l2.name}</span>
                  <span title="Consolidated section view" style={{ fontSize: '10px', opacity: 0.6 }}>⧉</span>
                </div>
                {l2.leaves.map(sec => leafButton(sec, 2))}
              </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
