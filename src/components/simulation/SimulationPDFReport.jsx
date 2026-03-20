import React from 'react';
import { format } from 'date-fns';

export default function SimulationPDFReport({ simulation, outcome }) {
  if (!simulation) return null;

  const handlePrint = () => {
    window.print();
  };

  const severityColor = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#eab308',
    low: '#9ca3af'
  };

  const severityBgColor = {
    critical: '#fee2e2',
    high: '#ffedd5',
    medium: '#fef3c7',
    low: '#f3f4f6'
  };

  return (
    <div className="print:hidden mb-4">
      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
      >
        Export PDF
      </button>

      <style>{`
        @media print {
          * { margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #000; background: #fff; }
          .pdf-report { width: 100%; max-width: 100%; }
          .pdf-page { page-break-after: always; padding: 48pt; min-height: 100vh; position: relative; }
          .pdf-page:last-child { page-break-after: avoid; }
          .pdf-footer { position: absolute; bottom: 24pt; left: 48pt; right: 48pt; font-size: 10pt; color: #666; border-top: 1pt solid #e5e7eb; padding-top: 12pt; }
          .pdf-cover { display: flex; flex-direction: column; justify-content: space-between; }
          .pdf-cover h1 { font-size: 48pt; font-weight: 700; margin: 24pt 0; line-height: 1.2; }
          .pdf-cover-meta { margin: 24pt 0; }
          .pdf-badge { display: inline-block; padding: 6pt 12pt; background: #f3f4f6; border-radius: 4pt; font-size: 11pt; margin-right: 8pt; margin-bottom: 8pt; }
          .pdf-chips { display: flex; flex-wrap: wrap; gap: 8pt; margin: 16pt 0; }
          .pdf-chip { padding: 6pt 12pt; background: #e0e7ff; border-radius: 4pt; font-size: 10pt; }
          .pdf-blockquote { border-left: 4pt solid #4f46e5; padding: 16pt; background: #f9fafb; margin: 16pt 0; font-style: italic; }
          h2 { font-size: 24pt; font-weight: 700; margin-top: 0; margin-bottom: 16pt; }
          h3 { font-size: 14pt; font-weight: 700; margin-top: 16pt; margin-bottom: 8pt; }
          .pdf-role { border-left: 4pt solid #4f46e5; padding: 16pt; margin: 16pt 0; background: #f9fafb; }
          .pdf-role-name { font-weight: 700; font-size: 14pt; margin-bottom: 8pt; }
          .pdf-position { font-weight: 600; margin-bottom: 8pt; }
          .pdf-concerns, .pdf-tags { margin: 8pt 0; padding-left: 16pt; }
          .pdf-concerns li { margin-bottom: 4pt; }
          .pdf-quote { margin: 12pt 0; font-style: italic; color: #666; padding-left: 16pt; border-left: 2pt solid #d1d5db; }
          .pdf-tension { border: 1pt solid #e5e7eb; padding: 12pt; margin: 12pt 0; border-radius: 4pt; }
          .pdf-tension-roles { font-size: 10pt; color: #666; margin-bottom: 4pt; }
          .pdf-summary { margin-bottom: 16pt; line-height: 1.6; }
          .pdf-list { margin: 12pt 0; padding-left: 20pt; }
          .pdf-list li { margin-bottom: 6pt; }
          .pdf-tradeoff { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; margin: 12pt 0; padding: 12pt; background: #f9fafb; border-radius: 4pt; }
          .pdf-tradeoff-col { font-size: 11pt; }
          .pdf-tradeoff-label { font-weight: 600; margin-bottom: 4pt; }
          .pdf-table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 11pt; }
          .pdf-table th { background: #f3f4f6; padding: 8pt; text-align: left; font-weight: 600; border-bottom: 1pt solid #d1d5db; }
          .pdf-table td { padding: 8pt; border-bottom: 1pt solid #e5e7eb; }
          .pdf-outcome { margin: 16pt 0; }
          .pdf-outcome-badge { display: inline-block; padding: 8pt 16pt; background: #dcfce7; color: #166534; border-radius: 4pt; font-weight: 600; margin-bottom: 16pt; }
          .pdf-progress-bar { width: 100%; height: 20pt; background: #e5e7eb; border-radius: 4pt; overflow: hidden; margin: 12pt 0; }
          .pdf-progress-fill { height: 100%; background: #4f46e5; display: flex; align-items: center; justify-content: center; color: white; font-size: 10pt; font-weight: 600; }
          .pdf-severity { display: inline-block; padding: 4pt 8pt; border-radius: 3pt; font-size: 9pt; font-weight: 600; margin-right: 8pt; }
        }
      `}</style>

      <div className="pdf-report print-only">
        {/* PAGE 1 - COVER */}
        <div className="pdf-page pdf-cover">
          <div>
            <div style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '24pt' }}>TeamSync</div>
            <h1>{simulation.title}</h1>
            <div className="pdf-cover-meta">
              <div className="pdf-badge">{simulation.use_case_type || 'Custom'}</div>
              <div className="pdf-badge">Completed</div>
            </div>
            <div style={{ fontSize: '12pt', color: '#666', marginBottom: '24pt' }}>
              {simulation.created_date ? format(new Date(simulation.created_date), 'MMMM d, yyyy') : 'Date unavailable'}
            </div>
            {simulation.selected_roles && simulation.selected_roles.length > 0 && (
              <div>
                <div style={{ fontSize: '11pt', color: '#666', marginBottom: '8pt' }}>Participants</div>
                <div className="pdf-chips">
                  {simulation.selected_roles.map((role, i) => (
                    <div key={i} className="pdf-chip">{role.role} (Influence: {role.influence})</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {simulation.scenario && (
            <div className="pdf-blockquote">{simulation.scenario}</div>
          )}
          <div className="pdf-footer">Generated by TeamSync · {simulation.title} · {format(new Date(), 'MMM d, yyyy')}</div>
        </div>

        {/* PAGE 2 - ROLE RESPONSES */}
        {simulation.responses && simulation.responses.length > 0 && (
          <div className="pdf-page">
            <h2>Role Perspectives</h2>
            {simulation.responses.map((response, i) => (
              <div key={i} className="pdf-role">
                <div className="pdf-role-name">{response.role}</div>
                {response.position && <div className="pdf-position">{response.position}</div>}
                {response.concerns && response.concerns.length > 0 && (
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '11pt', marginTop: '8pt' }}>Concerns</div>
                    <ul className="pdf-concerns">
                      {response.concerns.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {response.recommendation && (
                  <div style={{ marginTop: '8pt', fontStyle: 'italic', fontSize: '11pt' }}>
                    <strong>Recommendation:</strong> {response.recommendation}
                  </div>
                )}
                {response.primary_driver && (
                  <div style={{ marginTop: '8pt', fontSize: '10pt', color: '#666' }}>
                    <strong>Driver:</strong> {response.primary_driver}
                  </div>
                )}
                {response.authentic_voice_quote && (
                  <div className="pdf-quote">"{response.authentic_voice_quote}"</div>
                )}
                {response.predicted_tensions_with && response.predicted_tensions_with.length > 0 && (
                  <div style={{ marginTop: '8pt' }}>
                    <div style={{ fontSize: '10pt', color: '#666', marginBottom: '4pt' }}>Potential tensions with:</div>
                    <div className="pdf-tags">{response.predicted_tensions_with.join(', ')}</div>
                  </div>
                )}
              </div>
            ))}
            <div className="pdf-footer">Generated by TeamSync · {simulation.title} · {format(new Date(), 'MMM d, yyyy')}</div>
          </div>
        )}

        {/* PAGE 3 - TENSIONS */}
        {simulation.tensions && simulation.tensions.length > 0 && (
          <div className="pdf-page">
            <h2>Tensions Detected</h2>
            {[...simulation.tensions]
              .sort((a, b) => {
                const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
              })
              .map((tension, i) => (
                <div key={i} className="pdf-tension">
                  <div style={{ marginBottom: '8pt' }}>
                    <span 
                      className="pdf-severity"
                      style={{ background: severityBgColor[tension.severity], color: severityColor[tension.severity] }}
                    >
                      {tension.severity?.toUpperCase()}
                    </span>
                  </div>
                  <div className="pdf-tension-roles">
                    <strong>Between:</strong> {tension.between?.join(' and ') || 'Unknown'}
                  </div>
                  <div style={{ marginBottom: '8pt' }}>{tension.description}</div>
                  {tension.root_cause && (
                    <div style={{ fontSize: '10pt', color: '#666', marginBottom: '4pt' }}>
                      <strong>Root cause:</strong> {tension.root_cause}
                    </div>
                  )}
                  {tension.hidden_alignment && (
                    <div style={{ fontSize: '10pt', color: '#166534', background: '#dcfce7', padding: '8pt', borderRadius: '3pt' }}>
                      <strong>Possible alignment:</strong> {tension.hidden_alignment}
                    </div>
                  )}
                </div>
              ))}
            <div className="pdf-footer">Generated by TeamSync · {simulation.title} · {format(new Date(), 'MMM d, yyyy')}</div>
          </div>
        )}

        {/* PAGE 4 - DECISION SYNTHESIS */}
        <div className="pdf-page">
          <h2>Decision Synthesis</h2>
          {simulation.summary && (
            <div className="pdf-summary">{simulation.summary}</div>
          )}
          
          {simulation.decision_trade_offs && simulation.decision_trade_offs.length > 0 && (
            <div>
              <h3>Key Trade-offs</h3>
              {simulation.decision_trade_offs.map((tradeoff, i) => (
                <div key={i} className="pdf-tradeoff">
                  <div className="pdf-tradeoff-col">
                    <div className="pdf-tradeoff-label">Option A</div>
                    <div>{tradeoff.option_a}</div>
                  </div>
                  <div className="pdf-tradeoff-col">
                    <div className="pdf-tradeoff-label">Option B</div>
                    <div>{tradeoff.option_b}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {simulation.next_steps && simulation.next_steps.length > 0 && (
            <div>
              <h3>Next Steps</h3>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Owner</th>
                    <th>Priority</th>
                    <th>Confidence</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.next_steps.map((step, i) => (
                    <tr key={i}>
                      <td>{step.action}</td>
                      <td>{step.owner_role}</td>
                      <td>{step.priority}</td>
                      <td>{step.confidence || 0}%</td>
                      <td>{step.estimated_hours || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pdf-footer">Generated by TeamSync · {simulation.title} · {format(new Date(), 'MMM d, yyyy')}</div>
        </div>

        {/* PAGE 5 - OUTCOME (conditional) */}
        {outcome && (
          <div className="pdf-page">
            <h2>Outcome</h2>
            <div className="pdf-outcome">
              <div className="pdf-outcome-badge">{outcome.actual_outcome}</div>
              {outcome.predicted_tensions_accuracy && (
                <div>
                  <div style={{ marginBottom: '8pt', fontSize: '11pt' }}>Tension Prediction Accuracy</div>
                  <div className="pdf-progress-bar">
                    <div 
                      className="pdf-progress-fill"
                      style={{ width: `${outcome.predicted_tensions_accuracy}%` }}
                    >
                      {outcome.predicted_tensions_accuracy}%
                    </div>
                  </div>
                </div>
              )}
              {outcome.outcome_notes && (
                <div style={{ marginTop: '16pt' }}>
                  <h3>Notes</h3>
                  <div style={{ lineHeight: '1.6' }}>{outcome.outcome_notes}</div>
                </div>
              )}
              {outcome.unexpected_issues && outcome.unexpected_issues.length > 0 && (
                <div style={{ marginTop: '16pt' }}>
                  <h3>Unexpected Issues</h3>
                  <ul className="pdf-list">
                    {outcome.unexpected_issues.map((issue, i) => <li key={i}>{issue}</li>)}
                  </ul>
                </div>
              )}
              {outcome.lessons_learned && (
                <div style={{ marginTop: '16pt' }}>
                  <h3>Lessons Learned</h3>
                  <div style={{ lineHeight: '1.6' }}>{outcome.lessons_learned}</div>
                </div>
              )}
            </div>
            <div className="pdf-footer">Generated by TeamSync · {simulation.title} · {format(new Date(), 'MMM d, yyyy')}</div>
          </div>
        )}
      </div>
    </div>
  );
}