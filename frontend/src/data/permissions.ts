// K — structure-editing is restricted to "select users" (admins). In the real
// system this maps to a Cognito group; for the demo we treat a small allowlist
// of aliases as structure admins and default the demo user in so it's visible.
const STRUCTURE_ADMIN_ALIASES = new Set<string>([
  'jordan.avery', 'jordanavery', 'admin', 'esglead',
]);

export function canEditStructure(alias: string | null): boolean {
  if (!alias) return true; // demo default: allow when no federated identity present
  return STRUCTURE_ADMIN_ALIASES.has(alias.toLowerCase());
}

// Report-management + AI-invoking actions that are NOT tied to a single
// subsection's acting role (they live on report-agnostic views that only know
// the signed-in alias, not a per-section role). These are restricted to the
// same Editor/Admin (ESG Reporting Lead) group as structure editing — in the
// Novartis environment this maps to a Cognito group. Gating them here fixes the
// prototype gap where any authenticated user (incl. Guest) could upload to the
// knowledge base, invoke AI scans, or start a new reporting cycle.
//
// Kept as distinct named helpers (rather than one flag) so each capability can
// be described precisely in the roles matrix and split later if the customer
// wants finer control (e.g. a dedicated "KB curator" group).
export function canManageKnowledgeBase(alias: string | null): boolean {
  return canEditStructure(alias);
}
export function canRunAnalysis(alias: string | null): boolean {
  return canEditStructure(alias);
}
export function canManageReportCycle(alias: string | null): boolean {
  return canEditStructure(alias);
}
