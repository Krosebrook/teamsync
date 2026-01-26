import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import pptxgen from 'npm:pptxgenjs@3.12.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { simulation, insights, stats } = await req.json();

    const pres = new pptxgen();

    // Slide 1: Title
    const slide1 = pres.addSlide();
    slide1.background = { color: '1e293b' };
    slide1.addText(simulation.title, {
      x: 0.5, y: 2.0, w: 9, h: 1.5,
      fontSize: 36, color: 'ffffff', bold: true, align: 'center'
    });
    slide1.addText(`Decision Simulation Report`, {
      x: 0.5, y: 3.5, w: 9, h: 0.5,
      fontSize: 18, color: '94a3b8', align: 'center'
    });
    slide1.addText(new Date().toLocaleDateString(), {
      x: 0.5, y: 4.5, w: 9, h: 0.3,
      fontSize: 12, color: '64748b', align: 'center'
    });

    // Slide 2: Overview & Stats
    if (stats) {
      const slide2 = pres.addSlide();
      slide2.addText('Overview', {
        x: 0.5, y: 0.3, w: 9, h: 0.6,
        fontSize: 28, bold: true, color: '1e293b'
      });

      const statsData = [
        [
          { text: 'Total Simulations', options: { bold: true, fontSize: 12, color: '475569' } },
          { text: stats.totalSimulations.toString(), options: { fontSize: 20, bold: true, color: '8b5cf6' } }
        ],
        [
          { text: 'Critical Tensions', options: { bold: true, fontSize: 12, color: '475569' } },
          { text: stats.criticalTensions.toString(), options: { fontSize: 20, bold: true, color: 'f43f5e' } }
        ],
        [
          { text: 'Unique Roles', options: { bold: true, fontSize: 12, color: '475569' } },
          { text: stats.uniqueRoles.toString(), options: { fontSize: 20, bold: true, color: '3b82f6' } }
        ],
        [
          { text: 'Avg Roles/Sim', options: { bold: true, fontSize: 12, color: '475569' } },
          { text: stats.avgRolesPerSim.toString(), options: { fontSize: 20, bold: true, color: '10b981' } }
        ]
      ];

      slide2.addTable(statsData, {
        x: 0.5, y: 1.2, w: 9, h: 2.5,
        colW: [2.25, 2.25, 2.25, 2.25],
        border: { pt: 1, color: 'e2e8f0' },
        fill: { color: 'ffffff' }
      });
    }

    // Slide 3: Scenario
    const slide3 = pres.addSlide();
    slide3.addText('Scenario', {
      x: 0.5, y: 0.3, w: 9, h: 0.6,
      fontSize: 28, bold: true, color: '1e293b'
    });
    slide3.addText(simulation.scenario, {
      x: 0.5, y: 1.2, w: 9, h: 3.5,
      fontSize: 14, color: '334155', valign: 'top'
    });

    // Slide 4: Executive Summary
    if (simulation.summary) {
      const slide4 = pres.addSlide();
      slide4.addText('Executive Summary', {
        x: 0.5, y: 0.3, w: 9, h: 0.6,
        fontSize: 28, bold: true, color: '1e293b'
      });
      slide4.addText(simulation.summary, {
        x: 0.5, y: 1.2, w: 9, h: 4,
        fontSize: 12, color: '475569', valign: 'top'
      });
    }

    // Slide 5: Role Responses
    if (simulation.responses) {
      simulation.responses.forEach((response, idx) => {
        const slide = pres.addSlide();
        slide.addText(`Role: ${response.role.replace(/_/g, ' ').toUpperCase()}`, {
          x: 0.5, y: 0.3, w: 9, h: 0.6,
          fontSize: 24, bold: true, color: '1e293b'
        });

        slide.addText('Position', {
          x: 0.5, y: 1.1, w: 9, h: 0.3,
          fontSize: 12, bold: true, color: '8b5cf6'
        });
        slide.addText(response.position, {
          x: 0.5, y: 1.5, w: 9, h: 0.8,
          fontSize: 11, color: '334155'
        });

        slide.addText('Key Concerns', {
          x: 0.5, y: 2.5, w: 9, h: 0.3,
          fontSize: 12, bold: true, color: '8b5cf6'
        });
        const concerns = response.concerns?.map((c, i) => `• ${c}`).join('\n') || '';
        slide.addText(concerns, {
          x: 0.5, y: 2.9, w: 9, h: 1.5,
          fontSize: 10, color: '475569'
        });

        slide.addText('Recommendation', {
          x: 0.5, y: 4.6, w: 9, h: 0.3,
          fontSize: 12, bold: true, color: '8b5cf6'
        });
        slide.addText(response.recommendation, {
          x: 0.5, y: 5.0, w: 9, h: 0.8,
          fontSize: 10, color: '334155'
        });
      });
    }

    // Slide: Tensions
    if (simulation.tensions && simulation.tensions.length > 0) {
      const slide = pres.addSlide();
      slide.addText('Identified Tensions', {
        x: 0.5, y: 0.3, w: 9, h: 0.6,
        fontSize: 28, bold: true, color: '1e293b'
      });

      const tensionRows = simulation.tensions.map(t => [
        { text: t.between.join(' vs '), options: { fontSize: 11, bold: true } },
        { text: t.severity.toUpperCase(), options: { fontSize: 11, color: t.severity === 'critical' ? 'dc2626' : 'f97316' } },
        { text: t.description, options: { fontSize: 10 } }
      ]);

      slide.addTable([
        [
          { text: 'Between', options: { bold: true, fontSize: 12, fill: 'f1f5f9' } },
          { text: 'Severity', options: { bold: true, fontSize: 12, fill: 'f1f5f9' } },
          { text: 'Description', options: { bold: true, fontSize: 12, fill: 'f1f5f9' } }
        ],
        ...tensionRows
      ], {
        x: 0.5, y: 1.2, w: 9, h: 4,
        colW: [1.5, 1, 6.5],
        border: { pt: 1, color: 'e2e8f0' }
      });
    }

    // Slide: Next Steps
    if (simulation.next_steps && simulation.next_steps.length > 0) {
      const slide = pres.addSlide();
      slide.addText('Recommended Actions', {
        x: 0.5, y: 0.3, w: 9, h: 0.6,
        fontSize: 28, bold: true, color: '1e293b'
      });

      const stepsRows = simulation.next_steps.map(step => [
        { text: step.action, options: { fontSize: 11 } },
        { text: step.owner_role?.replace(/_/g, ' ') || '', options: { fontSize: 10, color: '8b5cf6' } },
        { text: step.priority?.toUpperCase() || '', options: { fontSize: 10, bold: true } },
        { text: `${step.confidence}%`, options: { fontSize: 10, color: '10b981' } }
      ]);

      slide.addTable([
        [
          { text: 'Action', options: { bold: true, fontSize: 12, fill: 'f1f5f9' } },
          { text: 'Owner', options: { bold: true, fontSize: 12, fill: 'f1f5f9' } },
          { text: 'Priority', options: { bold: true, fontSize: 12, fill: 'f1f5f9' } },
          { text: 'Confidence', options: { bold: true, fontSize: 12, fill: 'f1f5f9' } }
        ],
        ...stepsRows
      ], {
        x: 0.5, y: 1.2, w: 9, h: 4,
        colW: [4, 2.5, 1.5, 1],
        border: { pt: 1, color: 'e2e8f0' }
      });
    }

    // Analytics Insights
    if (insights) {
      // Predictive Analysis
      if (insights.predictions && insights.predictions.length > 0) {
        const slide = pres.addSlide();
        slide.background = { color: 'f8fafc' };
        slide.addText('Predictive Analysis', {
          x: 0.5, y: 0.3, w: 9, h: 0.6,
          fontSize: 28, bold: true, color: '8b5cf6'
        });

        let y = 1.2;
        insights.predictions.forEach(pred => {
          slide.addText(pred.scenario_type, {
            x: 0.5, y, w: 9, h: 0.3,
            fontSize: 14, bold: true, color: '1e293b'
          });
          y += 0.4;
          slide.addText(`Confidence: ${pred.confidence}%`, {
            x: 0.5, y, w: 9, h: 0.2,
            fontSize: 10, color: '10b981'
          });
          y += 0.3;
          slide.addText(pred.predicted_outcome, {
            x: 0.5, y, w: 9, h: 0.6,
            fontSize: 11, color: '475569'
          });
          y += 0.8;
        });
      }

      // Recommendations
      if (insights.recommendations && insights.recommendations.length > 0) {
        const slide = pres.addSlide();
        slide.addText('Process Recommendations', {
          x: 0.5, y: 0.3, w: 9, h: 0.6,
          fontSize: 28, bold: true, color: '10b981'
        });

        const recs = insights.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n\n');
        slide.addText(recs, {
          x: 0.5, y: 1.2, w: 9, h: 4,
          fontSize: 11, color: '334155', valign: 'top'
        });
      }
    }

    const pptxBytes = await pres.write({ outputType: 'arraybuffer' });

    return new Response(pptxBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${simulation.title.replace(/[^a-z0-9]/gi, '_')}_Report.pptx"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});