import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import jsPDF from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { simulationId } = await req.json();
    
    if (!simulationId) {
      return Response.json({ error: 'Missing simulationId' }, { status: 400 });
    }

    const simulation = await base44.entities.Simulation.filter({ id: simulationId });
    if (!simulation || simulation.length === 0) {
      return Response.json({ error: 'Simulation not found' }, { status: 404 });
    }

    const sim = simulation[0];
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // PAGE 1 — COVER
    doc.setFontSize(28);
    doc.text(sim.title || 'Untitled Simulation', 20, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Use Case: ${sim.use_case_type || 'Custom'}`, 20, yPos);
    yPos += 8;

    const runDate = new Date(sim.created_date).toLocaleDateString();
    doc.text(`Run Date: ${runDate}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Scenario:', 20, yPos);
    yPos += 5;
    
    const scenarioLines = doc.splitTextToSize(sim.scenario || '', pageWidth - 40);
    doc.setFontSize(9);
    doc.text(scenarioLines.slice(0, 8), 20, yPos);
    yPos += scenarioLines.length * 4 + 10;

    doc.setFontSize(10);
    doc.text('Participants:', 20, yPos);
    yPos += 5;
    
    if (sim.selected_roles && sim.selected_roles.length > 0) {
      sim.selected_roles.forEach(role => {
        doc.setFontSize(9);
        doc.text(`• ${role.role} (Influence: ${role.influence}/10)`, 25, yPos);
        yPos += 5;
      });
    }

    // PAGE 2 — ROLE RESPONSES
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.text('Role Perspectives', 20, yPos);
    yPos += 12;

    if (sim.responses && sim.responses.length > 0) {
      sim.responses.forEach((response, idx) => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${response.role}`, 20, yPos);
        yPos += 6;

        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(`Position: ${response.position || 'N/A'}`, 25, yPos);
        yPos += 5;

        if (response.concerns && response.concerns.length > 0) {
          doc.text('Concerns:', 25, yPos);
          yPos += 4;
          response.concerns.slice(0, 3).forEach(concern => {
            doc.text(`  • ${concern}`, 28, yPos);
            yPos += 4;
          });
        }

        doc.setTextColor(0);
        if (response.recommendation) {
          doc.text(`Recommendation: ${response.recommendation}`, 25, yPos);
          yPos += 5;
        }

        if (response.authentic_voice_quote) {
          doc.setFontStyle('italic');
          doc.setTextColor(100);
          const quoteLines = doc.splitTextToSize(`"${response.authentic_voice_quote}"`, pageWidth - 50);
          doc.text(quoteLines, 30, yPos);
          yPos += quoteLines.length * 4 + 2;
          doc.setFontStyle('normal');
          doc.setTextColor(0);
        }

        yPos += 4;
      });
    }

    // PAGE 3 — TENSIONS
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.text('Identified Tensions', 20, yPos);
    yPos += 12;

    if (sim.tensions && sim.tensions.length > 0) {
      const sortedTensions = [...sim.tensions].sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
      });

      sortedTensions.forEach((tension) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`${tension.between?.join(' ↔ ') || 'Unknown roles'} — ${tension.severity?.toUpperCase() || 'UNKNOWN'}`, 20, yPos);
        yPos += 6;

        doc.setFontSize(9);
        doc.setTextColor(60);
        const descLines = doc.splitTextToSize(tension.description || '', pageWidth - 40);
        doc.text(descLines, 25, yPos);
        yPos += descLines.length * 4 + 3;

        if (tension.root_cause) {
          doc.text(`Root Cause: ${tension.root_cause}`, 25, yPos);
          yPos += 5;
        }

        if (tension.hidden_alignment) {
          doc.text(`Hidden Alignment: ${tension.hidden_alignment}`, 25, yPos);
          yPos += 5;
        }

        yPos += 3;
      });
    }

    // PAGE 4 — SYNTHESIS
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.text('Decision Synthesis', 20, yPos);
    yPos += 12;

    doc.setFontSize(10);
    doc.setTextColor(0);
    if (sim.summary) {
      const summaryLines = doc.splitTextToSize(sim.summary, pageWidth - 40);
      doc.text(summaryLines, 20, yPos);
      yPos += summaryLines.length * 5 + 5;
    }

    if (sim.decision_trade_offs && sim.decision_trade_offs.length > 0) {
      doc.setFontSize(11);
      doc.text('Key Trade-Offs:', 20, yPos);
      yPos += 6;
      
      doc.setFontSize(9);
      sim.decision_trade_offs.forEach(tradeoff => {
        doc.text(`${tradeoff.trade_off}`, 25, yPos);
        yPos += 4;
        doc.text(`  A: ${tradeoff.option_a}`, 28, yPos);
        yPos += 4;
        doc.text(`  B: ${tradeoff.option_b}`, 28, yPos);
        yPos += 5;
      });
    }

    if (sim.next_steps && sim.next_steps.length > 0) {
      yPos += 3;
      doc.setFontSize(11);
      doc.text('Recommended Actions:', 20, yPos);
      yPos += 6;

      doc.setFontSize(8);
      sim.next_steps.slice(0, 5).forEach(step => {
        const action = doc.splitTextToSize(step.action || '', 60);
        doc.text(action, 25, yPos);
        yPos += action.length * 3 + 2;
        doc.text(`Owner: ${step.owner_role} | Priority: ${step.priority} | Confidence: ${step.confidence}%`, 28, yPos);
        yPos += 4;
      });
    }

    // PAGE 5 — OUTCOME (if exists)
    // (Would fetch SimulationOutcome record if it exists)

    const pdfBytes = doc.output('arraybuffer');
    const filename = `${sim.title?.replace(/\s+/g, '-').toLowerCase() || 'simulation'}-teamsync-${new Date().toISOString().split('T')[0]}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('generateSimulationPDF error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});