// One-time seed extractor: imports the app's seed data modules and emits the
// JSON documents to load into DynamoDB, matching the backend store layout
// (frontend/src/api/LocalAdapter.ts is the source of truth for which seed backs
// which channel). Run via esbuild bundling (see seed-dynamo.sh) so the TS/ESM
// imports resolve exactly as the app builds them.
import { reportSections, demoIpSignedOffSeed } from '../src/data/reportSections.ts';
import { initialTrackedChanges } from '../src/data/editorChanges.ts';
import { initialApprovalRecords } from '../src/data/editorApprovals.ts';
import { initialSectionLocks } from '../src/data/sectionLocks.ts';
import { initialCommentThreads } from '../src/data/comments.ts';
import { seedEvidence } from '../src/data/sectionEvidence.ts';

// Report-scoped channels for the active report (rnfm). Keys mirror
// REPORT_RESOURCES in backend/store.py. Only channels with real seed data are
// emitted; empty-seed channels ([]/{}) are left absent so the API 404s and the
// frontend adapter uses its own fallback (same effect, less to write).
const docs = [
  { pk: 'REPORT#rnfm', sk: 'sections', value: reportSections },
  { pk: 'REPORT#rnfm', sk: 'changes', value: initialTrackedChanges },
  { pk: 'REPORT#rnfm', sk: 'approvals', value: initialApprovalRecords },
  { pk: 'REPORT#rnfm', sk: 'locks', value: initialSectionLocks },
  { pk: 'REPORT#rnfm', sk: 'ip-signoff', value: demoIpSignedOffSeed },
  { pk: 'REPORT#rnfm', sk: 'comments', value: initialCommentThreads },
  { pk: 'REPORT#rnfm', sk: 'evidence', value: seedEvidence },
];

process.stdout.write(JSON.stringify(docs));
