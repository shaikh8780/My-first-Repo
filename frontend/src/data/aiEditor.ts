// Wave 3 — in-editor AI writing support. Two capabilities live here:
//
//  1. analyzeSection() — a lightweight, rule-based pass that flags likely typos,
//     Novartis style-guide deviations, and internal consistency issues in a
//     section's text. In production this is the style/consistency agent; in the
//     prototype it is deterministic pattern-matching so the demo is stable and
//     never hallucinates a flag. Each flag can be turned into an AI-origin
//     tracked-change suggestion the Editor accepts/rejects — nothing is applied
//     silently.
//
//  2. draftFromEvidence() / revisePrompt() — the text the in-editor AI chat
//     proposes for a prompt (optionally grounded in an attached evidence doc).
//     Returned as plain text; the panel wraps it into a tracked change.

export type FlagKind = 'typo' | 'style' | 'consistency';

export interface EditorFlag {
  id: string;
  kind: FlagKind;
  paragraphIndex: number;
  original: string;        // the exact substring to replace
  suggestion: string;      // the replacement text
  message: string;         // human explanation of the issue
}

// --- Style guide + typo rules ----------------------------------------------
// Ordered, non-overlapping surface patterns. `test` is matched case-sensitively
// against the raw paragraph; the first match per rule per paragraph is flagged
// (keeps the demo output tidy rather than dozens of near-duplicate flags).
interface Rule {
  kind: FlagKind;
  // A literal substring OR regex to find; if regex, it must be global-safe.
  find: RegExp;
  replace: (m: RegExpMatchArray) => string;
  message: string;
}

const RULES: Rule[] = [
  // Common typos / doubled words.
  { kind: 'typo', find: /\b(the)\s+\1\b/gi, replace: m => m[1], message: 'Repeated word "the the".' },
  { kind: 'typo', find: /\bteh\b/g, replace: () => 'the', message: 'Likely typo: "teh" → "the".' },
  { kind: 'typo', find: /\benviroment\b/gi, replace: m => (m[0][0] === 'E' ? 'Environment' : 'environment'), message: 'Misspelling: "enviroment" → "environment".' },
  { kind: 'typo', find: /\boccured\b/gi, replace: () => 'occurred', message: 'Misspelling: "occured" → "occurred".' },
  { kind: 'typo', find: /\bcommitted to to\b/gi, replace: () => 'committed to', message: 'Repeated word "to".' },

  // Novartis style guide: use full "Scope" wording, en-dash ranges, %/units.
  { kind: 'style', find: /\bCO2\b/g, replace: () => 'CO₂', message: 'Style guide: use the subscript "CO₂".' },
  { kind: 'style', find: /(\d)\s*-\s*(\d)/g, replace: m => `${m[1]}–${m[2]}`, message: 'Style guide: use an en-dash (–) for numeric ranges.' },
  { kind: 'style', find: /\bper cent\b/gi, replace: () => '%', message: 'Style guide: use the "%" symbol, not "per cent".' },
  { kind: 'style', find: /\bwhitelist\b/gi, replace: () => 'allowlist', message: 'Inclusive language: use "allowlist".' },
  { kind: 'style', find: /\bblacklist\b/gi, replace: () => 'denylist', message: 'Inclusive language: use "denylist".' },
];

// A consistency issue is cross-paragraph: e.g. a stale reporting year mixed with
// the current one. We detect a prior-year token ("2024"/"2025") appearing in a
// section whose dominant year is the current FY (2026), and flag it as a likely
// roll-forward miss. This is intentionally conservative.
function consistencyFlags(paragraphs: string[]): EditorFlag[] {
  const flags: EditorFlag[] = [];
  const joined = paragraphs.join(' ');
  const has2026 = /\b2026\b/.test(joined);
  if (!has2026) return flags; // only flag when the section is clearly on FY2026

  paragraphs.forEach((p, i) => {
    // "targets for 2025" style leftovers when the section otherwise says 2026.
    const m = p.match(/\b(targets?|goals?|results?)\s+for\s+2025\b/i);
    if (m) {
      flags.push({
        id: `flag-cons-${i}-${m.index}`,
        kind: 'consistency',
        paragraphIndex: i,
        original: m[0],
        suggestion: m[0].replace('2025', '2026'),
        message: 'Consistency: this section reports FY2026 but references a 2025 target year — confirm roll-forward.',
      });
    }
  });
  return flags;
}

export function analyzeSection(content: string): EditorFlag[] {
  const paragraphs = content.split('\n\n');
  const flags: EditorFlag[] = [];

  paragraphs.forEach((para, i) => {
    for (const rule of RULES) {
      rule.find.lastIndex = 0;
      const m = rule.find.exec(para);
      if (m) {
        flags.push({
          id: `flag-${rule.kind}-${i}-${m.index}`,
          kind: rule.kind,
          paragraphIndex: i,
          original: m[0],
          suggestion: rule.replace(m),
          message: rule.message,
        });
      }
    }
  });

  flags.push(...consistencyFlags(paragraphs));
  // Stable order: by paragraph, then typo → style → consistency.
  const order: Record<FlagKind, number> = { typo: 0, style: 1, consistency: 2 };
  return flags.sort((a, b) => a.paragraphIndex - b.paragraphIndex || order[a.kind] - order[b.kind]);
}

// Apply a flag's fix to a paragraph string (used to build the tracked change's
// newText). Only the first occurrence of `original` is replaced.
export function applyFlag(paragraph: string, flag: EditorFlag): string {
  const idx = paragraph.indexOf(flag.original);
  if (idx === -1) return paragraph;
  return paragraph.slice(0, idx) + flag.suggestion + paragraph.slice(idx + flag.original.length);
}

// --- Prompt-driven drafting -------------------------------------------------
// Deterministic, convincing responses for the in-editor chat. Grounded in an
// attached evidence doc name when provided. These are prototype responses (same
// honest posture as the rest of the demo): real generation is a Bedrock agent.

export interface DraftResult {
  answer: string;          // conversational reply shown in the chat
  proposedText?: string;   // text offered as an "Insert as tracked change"
}

export function respondToPrompt(
  prompt: string,
  sectionTitle: string,
  evidenceName?: string,
): DraftResult {
  const q = prompt.toLowerCase();

  if (q.includes('minimum') || q.includes('requirement') || q.includes('must')) {
    return {
      answer: `For "${sectionTitle}", the minimum disclosure expectations are: (1) the required ESRS/ISSB data points tagged on this subsection, each with a current-year figure and a prior-year comparative; (2) the methodology and boundary for any quantitative metric; and (3) a source citation for every factual claim. Open the "📖 View requirement text" chips on the assigned datapoints for the verbatim wording.`,
    };
  }

  if (q.includes('peer') || q.includes('benchmark') || q.includes('competitor')) {
    return {
      answer: `Indexed pharma peers (Roche, AstraZeneca, Pfizer, GSK, Sanofi) typically pair the headline metric for "${sectionTitle}" with an explicit methodology note and a prior-year comparative, and cross-reference their assurance scope. See the Peer benchmarking tab for the cited figures. I can draft a comparable sentence for this section if you'd like.`,
      proposedText: `In line with disclosure practice among European pharmaceutical peers, this metric is reported on a like-for-like basis with the prior year and is within the scope of our external limited assurance engagement.`,
    };
  }

  if (evidenceName && (q.includes('update') || q.includes('reflect') || q.includes('incorporate') || q.includes('this document') || q.includes('this doc'))) {
    return {
      answer: `I've reviewed "${evidenceName}" and drafted a revision for "${sectionTitle}" that incorporates its figures and framing. It is grounded strictly in that document — review the proposed text below and insert it as a tracked change for the Editor to accept.`,
      proposedText: `Reflecting the latest evidence in ${evidenceName}, the reported figures and narrative for this section have been updated to the current reporting period, with methodology and assurance scope stated in line with the source document.`,
    };
  }

  if (q.includes('draft') || q.includes('write') || q.includes('add') || q.includes('paragraph')) {
    return {
      answer: `Here is proposed text for "${sectionTitle}"${evidenceName ? `, grounded in ${evidenceName}` : ''}. Insert it as a tracked change and the Editor can accept or reject it.`,
      proposedText: `This section is drafted in line with the applicable ESRS/ISSB disclosure requirements, reporting current-period figures with prior-year comparatives and stating the methodology and assurance boundary for each metric.`,
    };
  }

  // Fallback — offer the standard capabilities.
  return {
    answer: `I can help with "${sectionTitle}". Try:\n\n- "What are the minimum requirements for this section?"\n- "What do peers report here?"\n- Attach an evidence document, then "update the text to reflect this document"\n- "Draft a paragraph on …"`,
  };
}

export const QUICK_PROMPTS = [
  'What are the minimum requirements for this section?',
  'What do peers report here?',
  'Draft a paragraph grounded in the attached evidence',
];
