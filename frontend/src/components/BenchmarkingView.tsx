import { useState, useMemo } from 'react';
import { benchmarkAnswers, peerCompanies, type BenchmarkAnswer, type PeerCompany } from '../data/peerBenchmarking';
import { aiPeer } from '../api/aiClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: BenchmarkAnswer['citations'];
}

export default function BenchmarkingView() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<PeerCompany | null>(null);

  const findAnswer = (q: string): BenchmarkAnswer | null => {
    const lowerQ = q.toLowerCase();
    let bestMatch: BenchmarkAnswer | null = null;
    let bestScore = 0;
    for (const ba of benchmarkAnswers) {
      const score = ba.keywords.filter(kw => lowerQ.includes(kw)).length;
      if (score > bestScore) { bestScore = score; bestMatch = ba; }
    }
    return bestScore >= 1 ? bestMatch : null;
  };

  // Local (offline / fallback) answer: the keyword match, or a "topics I cover"
  // message. Returned in the { answer, citations } shape aiPeer expects.
  const localAnswer = (q: string) => {
    const a = findAnswer(q);
    if (a) return { answer: a.answer, citations: a.citations };
    return {
      answer: 'I don\'t have specific peer benchmark data on that topic in my current index. Try asking about:\n- Scope 3 emissions disclosure approaches\n- Biodiversity metrics (ESRS E4)\n- Workforce disclosures (ESRS S1)\n- TCFD governance\n- Water management in stressed regions\n- Anti-corruption and ethics (ESRS G1)\n- Circular economy metrics\n- Access to medicine and community impact\n- Supply chain human rights due diligence\n- Climate scenario analysis',
      citations: [],
    };
  };

  // Plain-text rendering of the peer corpus (companies + Q/A + citations) that
  // grounds the backend model. Built once; the backend uses ONLY this text.
  const corpus = useMemo(() => {
    const companies = peerCompanies
      .map(c => `- ${c.name} (${c.ticker}): ${c.reportTitle}, ${c.reportYear}, ${c.pages}pp`)
      .join('\n');
    const answers = benchmarkAnswers
      .map(ba => {
        const cites = ba.citations
          .map(c => `    · [${c.company}] "${c.excerpt}" (${c.pageRef}; ${c.section})`)
          .join('\n');
        return `Q: ${ba.question}\nA: ${ba.answer}\n  Citations:\n${cites}`;
      })
      .join('\n\n');
    return `PEER COMPANIES:\n${companies}\n\nBENCHMARK KNOWLEDGE:\n\n${answers}`;
  }, []);

  const handleSubmit = () => {
    if (!query.trim() || isTyping) return;
    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setQuery('');
    setIsTyping(true);
    // Real Bedrock (grounded on the corpus) when the backend is live; falls back
    // to the local keyword match offline or on error.
    void aiPeer(userMsg, corpus, () => localAnswer(userMsg))
      .then(res => {
        setMessages(prev => [...prev, { role: 'assistant', content: res.answer, citations: res.citations }]);
      })
      .finally(() => setIsTyping(false));
  };

  // Indexed sections per peer, aligned to the real reports behind the corpus.
  // Roche/AstraZeneca primary PDFs were not machine-fetchable, so their entries
  // reference the topic areas from official pages rather than exact page ranges.
  const peerSections: Record<string, string[]> = {
    'ROG.SW': ['Climate targets & performance', 'Access to healthcare (ATMI 11/20)', 'Nature (SBTN/TNFD)', 'Ethics & Compliance', 'Governance', 'Responsible supply chain (PSCI, EcoVadis Silver)'],
    'AZN.L': ['Ambition Zero Carbon (SBTi net-zero 2045)', 'Climate Change Exposure 2024', 'Our People', 'Healthy Heart Africa (access)', 'TNFD Report 2024', 'Water'],
    'PFE': ['Governance & Ethics (p.15)', 'Global Health / Accord (p.34)', 'Environmental Stewardship (p.30)', 'Carbon & Energy (p.3)', 'Supply Chain / PSCI (p.19)', 'TCFD scenarios (pp.35-36)'],
    'GSK.L': ['Climate & net-zero (p.17)', 'Carbon & Energy (pp.18,21)', 'Workforce (AR2024 p.56)', 'Supply Chain / EcoVadis (pp.25-26)', 'Ethics & CoC training (pp.25-26)', 'Circular waste & packaging (p.22)'],
    'SAN.PA': ['Nature & Biodiversity / TNFD (p.45)', 'Climate & scenarios (pp.22-34)', 'Human Rights / suppliers (pp.28,85)', 'Water (E3, p.142)', 'Access / Impact brand (p.105)', 'Ethics & Speak-Up (pp.116,120)'],
  };

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Peer Benchmarking</h1>
      </div>

      {/* Chat Interface */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 className="card-title">Ask a Question</h2>
        <p className="card-text">Query the peer sustainability reports using natural language. Get comparative insights with source citations. <span style={{ color: 'var(--text-muted)' }}>(Demo: answers are grounded on a seeded peer corpus; the production environment retrieves from the live indexed peer-report set via Bedrock.)</span></p>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', lineHeight: 1.5 }}>
          Figures are grounded in each peer's published report. <strong>Reporting years differ</strong> (Roche 2025, AstraZeneca 2024, Pfizer 2023, GSK FY2025, Sanofi 2024) — treat cross-peer numbers as indicative, not same-year. Where a figure could not be verified from the source it is stated as not separately disclosed rather than estimated.
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="chat-message-content">
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} style={{ margin: line === '' ? '8px 0' : '4px 0' }}>{line}</p>
                  ))}
                </div>
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-primary)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>SOURCES</div>
                    {msg.citations.map((cit, ci) => (
                      <div key={ci} style={{ fontSize: '12px', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '4px' }}>
                        <strong>{cit.company}</strong> — {cit.section} ({cit.pageRef})<br />
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>"{cit.excerpt.substring(0, 100)}..."</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="chat-message assistant">
                <div className="chat-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-container">
          <input
            className="chat-input"
            type="text"
            placeholder="e.g., How do pharma peers disclose ESRS E4 biodiversity metrics?"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button className="btn-primary" disabled={!query.trim() || isTyping} onClick={handleSubmit}>Ask</button>
        </div>
      </div>

      {/* Example Questions */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <h2 className="card-title">Example Questions</h2>
        <div className="example-questions">
          {benchmarkAnswers.slice(0, 5).map(ba => (
            <button key={ba.id} className="example-q" onClick={() => setQuery(ba.question)}>{ba.question}</button>
          ))}
        </div>
      </div>

      {/* Indexed Peer Reports */}
      <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
        <h2 className="card-title">Indexed Peer Reports</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Report</th>
              <th>Year</th>
              <th>Pages</th>
              <th>Chunks</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {peerCompanies.map(pc => (
              <>
                <tr key={pc.ticker} onClick={() => setSelectedPeer(selectedPeer?.ticker === pc.ticker ? null : pc)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{pc.name} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({pc.ticker})</span></td>
                  <td>{pc.reportTitle}</td>
                  <td>{pc.reportYear}</td>
                  <td>{pc.pages}</td>
                  <td>{pc.chunksIndexed.toLocaleString()}</td>
                  <td><span className="status-badge status-covered">Indexed</span></td>
                </tr>
                {selectedPeer?.ticker === pc.ticker && (
                  <tr key={`${pc.ticker}-detail`} className="row-details">
                    <td colSpan={6}>
                      <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', margin: '4px 0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Ticker</div>
                            <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{pc.ticker}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Report Year</div>
                            <div style={{ fontSize: '13px' }}>{pc.reportYear}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Pages</div>
                            <div style={{ fontSize: '13px' }}>{pc.pages}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Chunks Indexed</div>
                            <div style={{ fontSize: '13px' }}>{pc.chunksIndexed.toLocaleString()}</div>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>Indexed Sections</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(peerSections[pc.ticker] || []).map((sec, i) => (
                              <span key={i} style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '4px' }}>{sec}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px', marginTop: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Embedding Details</div>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                            <span>Model: amazon.titan-embed-text-v2:0</span>
                            <span>Chunk size: 512 tokens</span>
                            <span>Overlap: 10%</span>
                            <span>Index: OpenSearch Serverless</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
                          <a href={pc.reportUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                            View Full Report ↗
                          </a>
                          <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={(e) => { e.stopPropagation(); setQuery(`What does ${pc.name} disclose about `); }}>
                            Ask about {pc.name}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
