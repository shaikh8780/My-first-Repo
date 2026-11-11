import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../api';
import type { UploadedFileRecord as UploadedFile } from '../api/ports';
import { useAuth } from '../auth/useAuth';
import { canManageKnowledgeBase } from '../data/permissions';
import DatapointChecklistPanel from './DatapointChecklistPanel';

export default function UploadView() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [checklistToast, setChecklistToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { alias } = useAuth();
  // Uploading prior-year source reports feeds the knowledge base, so it is an
  // Editor/Admin (ESG Lead) capability — same group as KB management.
  const canManage = canManageKnowledgeBase(alias);

  // Hydrate the uploaded-files list from the data-access layer on mount.
  useEffect(() => {
    let alive = true;
    void api.uploads.get().then(f => { if (alive) setFiles(f); });
    return () => { alive = false; };
  }, []);

  const saveFiles = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
    void api.uploads.set(newFiles);
  };

  const simulateUpload = (file: File) => {
    const entry: UploadedFile = {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      progress: 0,
    };
    setFiles(prev => {
      const updated = [entry, ...prev];
      void api.uploads.set(updated);
      return updated;
    });

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => {
          const updated = prev.map(f => f.name === file.name && f.status === 'uploading' ? { ...f, progress: 100, status: 'processing' as const } : f);
          void api.uploads.set(updated);
          return updated;
        });
        setTimeout(() => {
          setFiles(prev => {
            const updated = prev.map(f => f.name === file.name && f.status === 'processing' ? { ...f, status: 'complete' as const } : f);
            void api.uploads.set(updated);
            return updated;
          });
        }, 2000);
      } else {
        setFiles(prev => {
          const updated = prev.map(f => f.name === file.name && f.status === 'uploading' ? { ...f, progress: Math.min(progress, 95) } : f);
          return updated;
        });
      }
    }, 400);
  };

  const handleFiles = (fileList: FileList) => {
    if (!canManage) return; // gate: Editors/Admins only
    const validExts = ['.pdf', '.docx', '.pptx', '.doc'];
    Array.from(fileList).forEach(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (validExts.includes(ext)) {
        simulateUpload(file);
      }
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, []);

  const clearFiles = () => { saveFiles([]); };

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Upload Prior-Year RNFM</h1>
        {canManage
          ? files.length > 0 && <button className="btn-secondary" onClick={clearFiles}>Clear All</button>
          : <span title="Uploading source documents is restricted to Editors/Admins (ESG Reporting Lead)" style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>👁 Read-only — browse only</span>}
      </div>

      {/* Customer-maintained disclosure-checklist as the datapoint source of truth (21-Aug). */}
      <DatapointChecklistPanel canManage={canManage} onToast={(m) => { setChecklistToast(m); setTimeout(() => setChecklistToast(null), 4000); }} />
      {checklistToast && <div className="toast">{checklistToast}</div>}

      <div className="card" style={{ padding: '24px' }}>
        <h2 className="card-title">Upload Source Report</h2>
        <p className="card-text">
          Upload your prior-year RNFM (Report on Nonfinancial Matters) or other source documents here.
          In the production Novartis environment these are indexed into the Knowledge Base to enable AI
          draft generation with continuity from previous reporting cycles.
        </p>
        <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          ⓘ Demo: uploads are recorded for illustration only — file contents are not sent to a backend or indexed in this prototype.
        </div>

        {/* Drop Zone — interactive only for Editors/Admins; read-only note otherwise */}
        {!canManage ? (
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            👁 Uploading source documents is restricted to Editors/Admins (the ESG Reporting Lead group). You can view previously uploaded files below.
          </div>
        ) : (
        <>
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: '48px', opacity: 0.4, marginBottom: '12px' }}>📄</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            {dragging ? 'Drop files here' : 'Drag & drop your report files'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            or click to browse
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Supported: PDF, DOCX, PPTX — Max 50 MB per file
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.pptx,.doc"
          style={{ display: 'none' }}
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        </>
        )}
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
          <h2 className="card-title">Uploaded Files ({files.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {files.map((f, i) => (
              <div key={i} style={{ padding: '12px 16px', border: '1px solid var(--border-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{f.size} · Uploaded {new Date(f.uploadedAt).toLocaleString()}</div>
                  {(f.status === 'uploading') && (
                    <div style={{ marginTop: '6px', height: '4px', borderRadius: '2px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <div style={{ width: `${f.progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.3s' }}></div>
                    </div>
                  )}
                </div>
                <span className={`status-badge ${f.status === 'complete' ? 'status-covered' : f.status === 'error' ? 'status-missing' : 'status-partial'}`}>
                  {f.status === 'uploading' ? `${Math.round(f.progress)}%` : f.status === 'processing' ? 'Processing...' : f.status === 'complete' ? 'Recorded (demo)' : 'Error'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <h2 className="card-title">What happens after upload — in production</h2>
        <p className="card-text" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '12px' }}>
          The pipeline below runs in the production Novartis environment. This prototype does not execute these steps.
        </p>
        <div className="steps-list">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">Document Parsing</div>
              <div className="step-desc">Text is extracted using Amazon Textract (PDF) or python-docx (DOCX)</div>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-title">Chunking & Embedding</div>
              <div className="step-desc">Content is split into 512-token chunks with 10% overlap, then embedded via Amazon Titan</div>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-title">Vector Indexing</div>
              <div className="step-desc">Embeddings are stored in OpenSearch Serverless for semantic retrieval</div>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">4</div>
            <div className="step-content">
              <div className="step-title">Ready for AI Drafting</div>
              <div className="step-desc">Prior-year sections become available as context for new RNFM generation</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
