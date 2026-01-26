import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { simulation_id } = await req.json();
    
    const simulation = await base44.entities.Simulation.filter({ id: simulation_id });
    if (!simulation || simulation.length === 0) {
      return Response.json({ error: 'Simulation not found' }, { status: 404 });
    }

    const sim = simulation[0];
    const doc = new jsPDF();
    let y = 20;

    // Title Page
    doc.setFontSize(24);
    doc.text('Decision Simulation Report', 20, y);
    y += 15;

    doc.setFontSize(12);
    doc.text(sim.title, 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
    y += 5;
    doc.text(`Participants: ${sim.selected_roles?.length || 0} roles`, 20, y);
    y += 15;

    // Executive Summary
    doc.setFontSize(14);
    doc.text('Executive Summary', 20, y);
    y += 8;

    doc.setFontSize(10);
    if (sim.summary) {
      const summaryLines = doc.splitTextToSize(sim.summary, 170);
      doc.text(summaryLines, 20, y);
      y += summaryLines.length * 5 + 10;
    }

    // Key Tensions
    if (sim.tensions && sim.tensions.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text('Identified Tensions', 20, y);
      y += 8;

      doc.setFontSize(10);
      sim.tensions.forEach((tension, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFont(undefined, 'bold');
        doc.text(`${tension.between?.join(' vs ')} (${tension.severity})`, 20, y);
        y += 5;

        doc.setFont(undefined, 'normal');
        const tensionLines = doc.splitTextToSize(tension.description, 170);
        doc.text(tensionLines, 25, y);
        y += tensionLines.length * 5 + 5;
      });
    }

    // Recommended Actions
    if (sim.next_steps && sim.next_steps.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text('Recommended Actions', 20, y);
      y += 8;

      doc.setFontSize(10);
      sim.next_steps.forEach((step, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.text(`${idx + 1}. ${step.action}`, 20, y);
        y += 5;
        doc.setFontSize(8);
        doc.text(`   Owner: ${step.owner_role} | Priority: ${step.priority} | Confidence: ${step.confidence}%`, 20, y);
        doc.setFontSize(10);
        y += 8;
      });
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sim.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});