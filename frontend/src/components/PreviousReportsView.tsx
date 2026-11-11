import { useState, useRef } from 'react';

interface PreviousReport {
  id: string;
  title: string;
  year: number;
  status: 'published' | 'in_progress' | 'archived';
  reportingPeriod: string;
  frameworks: string[];
  sections: number;
  wordCount: number;
  pages: number;
  publishDate?: string;
  approvedBy?: string;
  fileSize?: string;
  uploadedFile?: string;
  highlights?: string[];
}

const initialReports: PreviousReport[] = [
  {
    id: 'report-2026',
    title: 'Report on Nonfinancial Matters (RNFM) — FY2026',
    year: 2026,
    status: 'in_progress',
    reportingPeriod: 'January 1, 2026 – December 31, 2026',
    frameworks: ['Swiss CO Art. 964a', 'GRI (with reference)', 'TCFD / Swiss Climate Ordinance', 'ESRS (2027 readiness)'],
    sections: 93,
    wordCount: 147820,
    pages: 0,
    highlights: [
      'AI-assisted draft generation for all 86 subsections',
      'Swiss CO Art. 964a basis with GRI (with reference) and TCFD alignment',
      'Structure mirrors FY2025 RNFM (ESRS readiness overlay for 2027)',
      'Currently in Legal Review stage',
    ],
  },
  {
    id: 'report-2025',
    title: 'Report on Nonfinancial Matters (RNFM) — FY2025',
    year: 2025,
    status: 'published',
    reportingPeriod: 'January 1, 2025 – December 31, 2025',
    frameworks: ['Swiss CO Art. 964a', 'GRI (with reference)', 'TCFD / Swiss Climate Ordinance'],
    sections: 18,
    wordCount: 33700,
    pages: 51,
    publishDate: '2026-03-06',
    approvedBy: 'Jordan Avery (ESG Reporting Lead)',
    fileSize: '4.2 MB',
    uploadedFile: 'Q1_novartis-report-nonfinancial-matters-2025.pdf',
    highlights: [
      'Legal basis: Art. 964a-c Swiss Code of Obligations',
      'GRI Standards (with reference), TCFD-aligned, GHG Protocol',
      'External assurance: KPMG AG — limited assurance (ISAE 3000/3410)',
      '8 material topics covered: E1, E2, S1, S2, S4, G1 + access to medicines + human rights',
      'AGM advisory vote: March 6, 2026',
      'Ground truth for FY2026 report generation',
    ],
  },
  {
    id: 'report-2024',
    title: 'Report on Nonfinancial Matters (RNFM) — FY2024',
    year: 2024,
    status: 'published',
    reportingPeriod: 'January 1, 2024 – December 31, 2024',
    frameworks: ['GRI Standards 2021', 'TCFD', 'ISSB IFRS S2'],
    sections: 12,
    wordCount: 132450,
    pages: 128,
    publishDate: '2025-04-15',
    approvedBy: 'Jordan Avery (ESG Lead)',
    fileSize: '8.9 MB',
    highlights: [
      'Report structure "looked quite different" from 2025 — limited reference value for prototype',
      'First voluntary ESRS alignment (pre-mandatory period)',
      'Expanded Scope 3 disclosure across all 15 categories',
      'TNFD LEAP pilot assessment at 5 priority manufacturing sites',
      'CDP Climate A-list recognition',
    ],
  },
  {
    id: 'report-2023',
    title: 'Report on Nonfinancial Matters (RNFM) — FY2023',
    year: 2023,
    status: 'published',
    reportingPeriod: 'January 1, 2023 – December 31, 2023',
    frameworks: ['GRI Standards 2021', 'TCFD'],
    sections: 10,
    wordCount: 116200,
    pages: 116,
    publishDate: '2024-04-10',
    approvedBy: 'Jordan Avery (ESG Lead)',
    fileSize: '7.8 MB',
    highlights: [
      'SBTi near-term targets validated',
      'RE100 membership — 100% renewable electricity commitment',
      'Enhanced TCFD scenario analysis (1.5°C, 2.5°C, 4°C)',
      'Human rights saliency assessment across value chain',
      'First ISSB IFRS S2 voluntary alignment',
    ],
  },
  {
    id: 'report-2022',
    title: 'Report on Nonfinancial Matters (RNFM) — FY2022',
    year: 2022,
    status: 'archived',
    reportingPeriod: 'January 1, 2022 – December 31, 2022',
    frameworks: ['GRI Standards 2016', 'TCFD'],
    sections: 9,
    wordCount: 98400,
    pages: 104,
    publishDate: '2023-04-12',
    approvedBy: 'Dr. Taylor Brenner (Legal)',
    fileSize: '6.4 MB',
    highlights: [
      'Net-zero commitment announced (Scope 1+2 by 2030, Scope 3 by 2040)',
      'Biodiversity Position Statement published',
      'Circular Economy Roadmap 2024–2030 introduced',
      'First standalone TCFD disclosure',
    ],
  },
  {
    id: 'report-2021',
    title: 'Report on Nonfinancial Matters (RNFM) — FY2021',
    year: 2021,
    status: 'archived',
    reportingPeriod: 'January 1, 2021 – December 31, 2021',
    frameworks: ['GRI Standards 2016'],
    sections: 8,
    wordCount: 82600,
    pages: 92,
    publishDate: '2022-04-08',
    approvedBy: 'Dr. Taylor Brenner (Legal)',
    fileSize: '5.6 MB',
    highlights: [
      'COVID-19 impact and response reporting',
      'First comprehensive Scope 3 emissions inventory',
      'Access to medicine programs expanded to 45 LMICs',
      'Environmental targets baseline established',
    ],
  },
];

export default function PreviousReportsView() {
  const [reports, setReports] = useState<PreviousReport[]>(initialReports);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleUploadClick = (reportId?: string) => {
    setUploadingFor(reportId || 'new');
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      simulateUpload(file);
      e.target.value = '';
    }
  };

  const simulateUpload = (file: File) => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const next = prev + Math.random() * 20 + 10;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(0);
            if (uploadingFor && uploadingFor !== 'new') {
              setReports(prev => prev.map(r =>
                r.id === uploadingFor ? { ...r, uploadedFile: file.name, fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB` } : r
              ));
              showToast(`"${file.name}" uploaded for report preview`);
            } else {
              const newReport: PreviousReport = {
                id: `report-upload-${Date.now()}`,
                title: file.name.replace(/\.(pdf|docx)$/i, ''),
                year: new Date().getFullYear(),
                status: 'published',
                reportingPeriod: 'Customer-provided report',
                frameworks: ['ESRS (CSRD)', 'GRI Standards 2021'],
                sections: 0,
                wordCount: 0,
                pages: 0,
                publishDate: new Date().toISOString().split('T')[0],
                fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                uploadedFile: file.name,
                highlights: ['Customer-uploaded report — available for preview and Knowledge Base ingestion'],
              };
              setReports(prev => [newReport, ...prev]);
              showToast(`"${file.name}" added to Previous Reports`);
            }
            setUploadingFor(null);
          }, 500);
          return 100;
        }
        return next;
      });
    }, 300);
  };

  const statusLabel = (s: PreviousReport['status']) => s === 'published' ? 'Published' : s === 'in_progress' ? 'In Progress' : 'Archived';
  const statusClass = (s: PreviousReport['status']) => s === 'published' ? 'status-covered' : s === 'in_progress' ? 'status-partial' : 'status-missing';

  const publishedCount = reports.filter(r => r.status === 'published').length;
  const totalPages = reports.reduce((sum, r) => sum + r.pages, 0);

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Previous Reports</h1>
        <button className="btn-primary" onClick={() => handleUploadClick()}>Upload Report</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload Progress */}
      {uploadingFor && uploadProgress > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '16px', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Uploading report...</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{Math.round(uploadProgress)}%</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }}></div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{publishedCount}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports.filter(r => r.status === 'in_progress').length}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalPages > 0 ? totalPages.toLocaleString() : '—'}</div>
          <div className="stat-label">Total Pages</div>
        </div>
      </div>

      {/* Reports List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
        {reports.map(report => (
          <div key={report.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Report Header */}
            <div
              onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
              style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{report.title}</h3>
                  <span className={`status-badge ${statusClass(report.status)}`}>{statusLabel(report.status)}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>{report.reportingPeriod}</span>
                  {report.pages > 0 && <span>{report.pages} pages</span>}
                  {report.wordCount > 0 && <span>{report.wordCount.toLocaleString()} words</span>}
                  {report.publishDate && <span>Published: {new Date(report.publishDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {report.frameworks.map(f => (
                  <span key={f} className="framework-badge" style={{ fontSize: '10px' }}>{f}</span>
                ))}
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  {expandedReport === report.id ? '▾' : '▸'}
                </span>
              </div>
            </div>

            {/* Expanded Detail */}
            {expandedReport === report.id && (
              <div style={{ borderTop: '1px solid var(--border-primary)', padding: '24px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Reporting Year</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>FY{report.year}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Sections</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{report.sections > 0 ? report.sections : '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Word Count</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{report.wordCount > 0 ? report.wordCount.toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>File Size</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{report.fileSize || '—'}</div>
                  </div>
                  {report.approvedBy && (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Approved By</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{report.approvedBy}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{statusLabel(report.status)}</div>
                  </div>
                </div>

                {/* Highlights */}
                {report.highlights && report.highlights.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>Key Highlights</div>
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {report.highlights.map((h, i) => (
                        <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Frameworks */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>Reporting Frameworks</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {report.frameworks.map(f => (
                      <span key={f} className="framework-badge">{f}</span>
                    ))}
                  </div>
                </div>

                {/* Uploaded file or upload option */}
                {report.uploadedFile ? (
                  <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{report.uploadedFile}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{report.fileSize}</div>
                    </div>
                    <span className="status-badge status-covered">Available</span>
                  </div>
                ) : report.status !== 'in_progress' ? (
                  <div
                    onClick={() => handleUploadClick(report.id)}
                    style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '2px dashed var(--border-primary)', textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '20px', opacity: 0.4, marginBottom: '6px' }}>📄</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>Upload Report PDF/DOCX</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Attach the published document for preview and reference</div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', background: 'var(--accent-light)', borderRadius: '8px', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>✦</span>
                    <div style={{ fontSize: '12px', color: 'var(--accent)' }}>
                      This report is currently being authored in the Report Editor. Once all sections are approved and exported, it will appear here as a published report.
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  {report.status === 'published' && report.uploadedFile && (
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => window.open(report.uploadedFile === 'Q1_novartis-report-nonfinancial-matters-2025.pdf' ? 'https://www.novartis.com/sites/novartis_com/files/novartis-report-nonfinancial-matters-2025.pdf' : '#', '_blank')}>View Report</button>
                  )}
                  {report.status !== 'in_progress' && !report.uploadedFile && (
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => handleUploadClick(report.id)}>Upload Document</button>
                  )}
                  {report.status === 'published' && (
                    <button className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}>Ingest to Knowledge Base</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="card" style={{ padding: '20px 24px', marginTop: '16px', borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          <strong>How it works:</strong> When a report cycle is completed (all sections reach "Exported" stage), it automatically appears in this archive. You can also upload historical report documents directly using the "Upload Report" button — uploaded PDFs/DOCX files are available for preview and can be ingested into the Knowledge Base for use in future AI draft generation.
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
