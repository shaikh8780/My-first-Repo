import { useState, useMemo, useRef } from 'react';
import { kbDocuments, kbStats, docTypeLabels, type DocType, type DocStatus, type KBDocument } from '../data/knowledgeBaseDocuments';
import { useAuth } from '../auth/useAuth';
import { canManageKnowledgeBase } from '../data/permissions';

type TypeFilter = 'all' | DocType;

export default function KnowledgeBaseView() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DocStatus>('all');
  const [selectedDoc, setSelectedDoc] = useState<KBDocument | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; status: 'uploading' | 'processing' | 'done' | 'error'; progress: number }[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { alias } = useAuth();
  // Uploading/managing KB source documents is an Editor/Admin (ESG Lead)
  // capability — a Cognito group in production. Other roles browse read-only.
  const canManage = canManageKnowledgeBase(alias);

  const filtered = useMemo(() => {
    return kbDocuments.filter(d => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      return true;
    });
  }, [typeFilter, statusFilter]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleUploadClick = () => {
    if (!canManageKnowledgeBase(alias)) return; // gate: Editors/Admins only
    fileInputRef.current?.click();
  };

  const simulateUpload = (files: FileList) => {
    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
      status: 'uploading' as const,
      progress: 0,
    }));
    setUploadedFiles(prev => [...newFiles, ...prev]);

    newFiles.forEach((file, idx) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'processing', progress: 100 } : f));
          setTimeout(() => {
            setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'done' } : f));
            if (idx === 0) showToast(`${newFiles.length} file(s) uploaded — ingestion queued`);
          }, 2000 + idx * 500);
        }
        setUploadedFiles(prev => prev.map(f => f.name === file.name && f.status === 'uploading' ? { ...f, progress: Math.min(progress, 100) } : f));
      }, 400);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      simulateUpload(e.dataTransfer.files);
    }
  };

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Knowledge Base</h1>
        {canManage ? (
          <button className="btn-primary" onClick={handleUploadClick}>Upload Documents</button>
        ) : (
          <span title="Uploading source documents is restricted to Editors/Admins (ESG Reporting Lead)" style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>👁 Read-only — browse only</span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.pptx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{kbStats.indexed}</div>
          <div className="stat-label">Documents Indexed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>{kbStats.pending}</div>
          <div className="stat-label">Pending Ingestion</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ef4444' }}>{kbStats.failed}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{kbStats.totalChunks.toLocaleString()}</div>
          <div className="stat-label">Total Chunks</div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600 }}>Recent Uploads</h3>
            <button className="btn-ghost" onClick={() => setUploadedFiles([])} style={{ fontSize: '11px' }}>Clear</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadedFiles.slice(0, 5).map((f, i) => (
              <div key={`${f.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <span style={{ fontSize: '18px', opacity: 0.5 }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.size}</div>
                  {f.status === 'uploading' && (
                    <div style={{ height: '3px', borderRadius: '2px', background: 'var(--border-primary)', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${f.progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }}></div>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 500, color: f.status === 'done' ? '#16a34a' : f.status === 'error' ? '#ef4444' : 'var(--accent)' }}>
                  {f.status === 'uploading' && 'Uploading...'}
                  {f.status === 'processing' && 'Processing...'}
                  {f.status === 'done' && '✓ Queued'}
                  {f.status === 'error' && '✗ Failed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Categories */}
      <div className="card" style={{ padding: '24px', marginTop: '20px' }}>
        <h2 className="card-title">Document Sources</h2>
        <div className="doc-categories">
          {(Object.entries(kbStats.byType) as [DocType, number][]).map(([type, count]) => (
            <div key={type} className="doc-category" onClick={() => setTypeFilter(type)} style={{ cursor: 'pointer', border: typeFilter === type ? '2px solid var(--accent)' : '1px solid var(--border-primary)' }}>
              <div className="doc-category-header">{docTypeLabels[type]}</div>
              <div className="doc-category-desc">{type === 'internal_policy' ? 'Environmental, social, and governance policy documents' : type === 'reporting_standard' ? 'ESRS, GRI, TCFD, ISSB standard texts' : type === 'prior_report' ? 'Previous years\' sustainability reports' : type === 'peer_report' ? 'Competitor and industry peer sustainability reports' : 'CDP, assurance statements, and other public filings'}</div>
              <div className="doc-category-count">{count} documents</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginTop: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-tabs">
            <button className={`filter-tab ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
            {(Object.keys(docTypeLabels) as DocType[]).map(t => (
              <button key={t} className={`filter-tab ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>{docTypeLabels[t]}</button>
            ))}
          </div>
          <div className="filter-tabs">
            <button className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All Status</button>
            <button className={`filter-tab ${statusFilter === 'indexed' ? 'active' : ''}`} onClick={() => setStatusFilter('indexed')}>Indexed</button>
            <button className={`filter-tab ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>Pending</button>
            <button className={`filter-tab ${statusFilter === 'failed' ? 'active' : ''}`} onClick={() => setStatusFilter('failed')}>Failed</button>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>{filtered.length} documents</div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card" style={{ padding: '0', marginTop: '16px', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Source</th>
              <th>Year</th>
              <th>Pages</th>
              <th>Chunks</th>
              <th>Status</th>
              <th>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => (
              <>
                <tr key={doc.id} onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</td>
                  <td style={{ fontSize: '11px' }}>{docTypeLabels[doc.type]}</td>
                  <td>{doc.sourceOrg}</td>
                  <td>{doc.year}</td>
                  <td>{doc.pages}</td>
                  <td>{doc.chunks > 0 ? doc.chunks.toLocaleString() : '—'}</td>
                  <td><span className={`status-badge ${doc.status === 'indexed' ? 'status-covered' : doc.status === 'pending' ? 'status-partial' : 'status-missing'}`}>{doc.status}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(doc.uploadDate).toLocaleDateString()}</td>
                </tr>
                {selectedDoc?.id === doc.id && (
                  <tr key={`${doc.id}-detail`} className="row-details">
                    <td colSpan={8}>
                      <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', margin: '4px 0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Document ID</div>
                            <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{doc.id}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>File Size</div>
                            <div style={{ fontSize: '13px' }}>{doc.fileSize}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Uploaded By</div>
                            <div style={{ fontSize: '13px' }}>{doc.uploadedBy}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Upload Date</div>
                            <div style={{ fontSize: '13px' }}>{new Date(doc.uploadDate).toLocaleString()}</div>
                          </div>
                          {doc.framework && (
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Framework</div>
                              <div style={{ fontSize: '13px' }}><span className="framework-badge">{doc.framework}</span></div>
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Chunking</div>
                            <div style={{ fontSize: '13px' }}>{doc.chunks > 0 ? `${doc.chunks} chunks (512 tokens, 10% overlap)` : 'Not yet processed'}</div>
                          </div>
                        </div>
                        {doc.status === 'indexed' && doc.chunks > 0 && (
                          <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Embedding Details</div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              <span>Model: amazon.titan-embed-text-v2:0</span>
                              <span>Vector dims: 1024</span>
                              <span>Index: OpenSearch Serverless</span>
                            </div>
                          </div>
                        )}
                        {doc.status === 'failed' && (
                          <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>Ingestion Error</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Document parsing failed — unsupported format or corrupted file. Please re-upload or convert to PDF.</div>
                          </div>
                        )}
                        {doc.status === 'pending' && (
                          <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b', marginBottom: '4px' }}>Pending Ingestion</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Document is queued for processing. Expected completion within 5-10 minutes.</div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Zone */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <h2 className="card-title">Upload New Documents</h2>
        <div
          className="upload-zone"
          onClick={handleUploadClick}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ fontSize: '32px', opacity: 0.4, marginBottom: '12px' }}>📄</div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Drag & drop files here or click to browse</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Supported formats: PDF, DOCX, PPTX (max 50 MB)</div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
