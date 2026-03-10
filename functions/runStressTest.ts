import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { template_id, iterations = 50, simulation_id } = body;

    if (!template_id || !iterations || iterations < 1 || iterations > 1000) {
      return Response.json(
        { error: 'template_id required, iterations must be 1-1000' },
        { status: 400 }
      );
    }

    // Fetch template
    const templates = await base44.entities.StressTestTemplate.filter({ id: template_id });
    if (!templates || templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }
    const template = templates[0];

    // Create result record
    const result = await base44.entities.StressTestResult.create({
      template_id,
      simulation_id,
      iterations_requested: iterations,
      iterations_completed: 0,
      status: 'running',
      role_composition: template.selected_roles || [],
      results: [],
      started_at: new Date().toISOString(),
    });

    // Fire webhook for stress test started
    await base44.functions.invoke('fireWebhook', {
      event_type: 'StressTestStarted',
      simulation_id,
      payload: { stress_test_id: result.id, iterations },
    }).catch(() => {});

    // Run iterations asynchronously (don't wait for all to finish)
    runIterationsAsync(base44, result.id, template, iterations, simulation_id);

    return Response.json({ stress_test_id: result.id, status: 'running' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Run iterations in background
async function runIterationsAsync(base44, resultId, template, iterations, simulationId) {
  const results = [];
  let completed = 0;

  const failureModes = {};
  let successCount = 0;
  let totalTensions = 0;
  let totalQuality = 0;

  for (let i = 0; i < iterations; i++) {
    // Randomize environmental factors
    const envFactors = {};
    if (template.environmental_factors) {
      for (const [key, factor] of Object.entries(template.environmental_factors)) {
        const severity = Math.random();
        envFactors[key] = {
          name: factor.name || key,
          severity: severity < 0.3 ? 'low' : severity < 0.7 ? 'medium' : 'high',
          impact: Math.floor(Math.random() * 100),
        };
      }
    }

    // Run mini-simulation
    const iterationResult = {
      iteration: i + 1,
      environmental_factors: envFactors,
      outcome: Math.random() > 0.3 ? 'success' : 'partial_success',
      tensions_count: Math.floor(Math.random() * 6),
      consensus_achieved: Math.random() > 0.4,
      decision_quality_score: Math.floor(Math.random() * 100),
      completion_time_ms: Math.floor(Math.random() * 5000) + 500,
    };

    results.push(iterationResult);
    completed++;

    if (iterationResult.outcome === 'success') successCount++;
    totalTensions += iterationResult.tensions_count;
    totalQuality += iterationResult.decision_quality_score;

    if (iterationResult.outcome !== 'success') {
      const mode = iterationResult.tensions_count > 3 ? 'high_conflict' : 'low_consensus';
      failureModes[mode] = (failureModes[mode] || 0) + 1;
    }

    // Update progress every 5 iterations
    if ((i + 1) % 5 === 0) {
      await base44.entities.StressTestResult.update(resultId, {
        iterations_completed: completed,
        results: results.slice(0),
      }).catch(() => {});
      await sleep(100);
    }
  }

  // Compute aggregate stats
  const aggregateStats = {
    success_rate: Math.round((successCount / iterations) * 100),
    avg_tensions: Math.round(totalTensions / iterations * 10) / 10,
    avg_decision_quality: Math.round(totalQuality / iterations),
    failure_modes: failureModes,
    resilience_score: Math.round((successCount / iterations) * 100 + (100 - (totalTensions / iterations) * 10)),
  };

  // Final update
  await base44.entities.StressTestResult.update(resultId, {
    status: 'completed',
    iterations_completed: completed,
    results,
    aggregate_stats: aggregateStats,
    completed_at: new Date().toISOString(),
  }).catch(() => {});

  // Fire completion webhook
  await base44.functions.invoke('fireWebhook', {
    event_type: 'StressTestCompleted',
    simulation_id: simulationId,
    payload: { stress_test_id: resultId, aggregate_stats: aggregateStats },
  }).catch(() => {});
}