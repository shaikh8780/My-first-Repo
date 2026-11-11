import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import {
  parseChecklistCsv, checklistSummary,
  type DatapointChecklistStore, type DatapointChecklist, type ChecklistDatapoint,
} from '../data/datapointChecklist';

// Customer-maintained disclosure-checklist upload (Thevi/Adrian, 21 Aug 2026).
// Real, versioned ingestion: read the file in the browser, parse the CSV into
// datapoints, and persist through the backend (api.report.datapointChecklist).
// This is the authoritative datapoint source of truth; the system does not
// independently decide which datapoints are relevant.
//
// Manual versioned upload is deliberate (the safer option from the call): a live
// SharePoint sync would propagate spreadsheet errors straight into the tool. A
// SharePoint/URL connector is a documented roadmap seam (see Architecture).

interface Props {
  canManage: boolean;
  onToast: (msg: string) => void;
}

export default function DatapointChecklistPanel({ canManage, onToast }: Props) {
  const [store, setStore] = useState<DatapointChecklistStore>({ current: null, history: [] });
  const [loaded, setLoaded] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void api.report.datapointChecklist.get().then(s => { if (alive) { setStore(s); setLoaded(true); } });
    return () => { alive = false; };
  }, []);

  const persist = (next: DatapointChecklistStore) => { setStore(next); void api.report.datapointChecklist.set(next); };

  const handleFile = async (file: File) => {
    if (!canManage) return;
    setParseErrors([]);
    const text = await file.text();
    const { datapoints, errors } = parseChecklistCsv(text);
    if (datapoints.length === 0) {
      setParseErrors(errors.length ? errors : ['No datapoints could be parsed from the file.']);
      onToast('Checklist not ingested — no valid datapoints found');
      return;
    }
    const version = (store.current?.version ?? 0) + 1;
    const next: DatapointChecklist = {
      version,
      uploadedBy: 'ESG Lead',
      uploadedAt: new Date().toISOString(),
      sourceFileName: file.name,
      rowCount: datapoints.length,
      datapoints,
    };
    // Immutable history: push the prior current before replacing.
    const history = store.current ? [...store.history, store.current] : store.history;
    persist({ current: next, history });
    setParseErrors(errors);
    onToast(`Checklist v${version} ingested — ${datapoints.length} datapoints now drive the gap analysis`);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    e.target.value = '';
  };

  const cur = store.current;
  const summary = cur ? checklistSummary(cur.datapoints) : null;

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '18px', marginBottom: '4px' }}>Disclosure checklist — datapoint source of truth</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.6 }}>
            Upload the Novartis-maintained disclosure-checklist (CSV export of the master Excel, DMA-filtered for relevance).
            The system ingests it as the <strong>authoritative list of datapoints</strong> for the gap analysis and cross-references each against the published standards — it does not decide relevance itself.
            Uploads are <strong>versioned</strong>; a live SharePoint sync is on the roadmap but deferred (manual upload avoids propagating spreadsheet errors).
          </div>
        </div>
        {canManage && (
          <div>
            <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onPick} style={{ display: 'none' }} />
            <button className="btn-primary" onClick={() => inputRef.current?.click()} style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
              ⬆ Upload checklist (CSV)
            </button>
          </div>
        )}
      </div>

      {parseErrors.length > 0 && (
        <div style={{ marginTop: '14px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>Ingested with {parseErrors.length} data-quality note(s):</div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {parseErrors.slice(0, 6).map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {!loaded ? (
        <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>Loading…</div>
      ) : !cur ? (
        <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          No checklist ingested yet — the gap analysis currently uses the built-in standards dataset. Upload the customer checklist to make it the source of truth.
          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Expected columns (header names are flexible): <code>DR ID, Framework, Standard, Requirement, Materiality, Mandatory, Note</code>.
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <Stat label="Version" value={`v${cur.version}`} />
            <Stat label="Datapoints" value={String(summary!.total)} />
            <Stat label="Material (DMA)" value={String(summary!.material)} />
            <Stat label="Mandatory" value={String(summary!.mandatory)} />
            <Stat label="Frameworks" value={String(Object.keys(summary!.byFramework).length)} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Source: <strong>{cur.sourceFileName}</strong> · uploaded {new Date(cur.uploadedAt).toLocaleString()} by {cur.uploadedBy}
            {store.history.length > 0 && <> · {store.history.length} previous version{store.history.length !== 1 ? 's' : ''} retained</>}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {Object.entries(summary!.byFramework).map(([fw, n]) => (
              <span key={fw} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '12px', background: 'var(--accent-light)', color: 'var(--accent)' }}>{fw}: {n}</span>
            ))}
          </div>
          <PreviewTable datapoints={cur.datapoints.slice(0, 8)} total={cur.datapoints.length} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
    </div>
  );
}

function PreviewTable({ datapoints, total }: { datapoints: ChecklistDatapoint[]; total: number }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="data-table">
        <thead>
          <tr><th>DR ID</th><th>Framework</th><th>Requirement</th><th>Materiality</th><th>Mandatory</th></tr>
        </thead>
        <tbody>
          {datapoints.map(d => (
            <tr key={d.drId}>
              <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{d.drId}</td>
              <td style={{ fontSize: '12px' }}>{d.framework}</td>
              <td style={{ fontSize: '12px' }}>{d.title}</td>
              <td style={{ fontSize: '12px' }}>{d.materiality.replace('_', ' ')}</td>
              <td style={{ fontSize: '12px' }}>{d.mandatory ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {total > datapoints.length && (
        <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>…and {total - datapoints.length} more datapoints.</div>
      )}
    </div>
  );
}
