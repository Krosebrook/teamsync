import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scenario, limit = 5 } = await req.json();

    // Get all completed simulations
    const allSimulations = await base44.entities.Simulation.filter({ status: 'completed' });

    // Use AI to find similar scenarios
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Given this scenario: "${scenario}"

And these past simulations:
${JSON.stringify(allSimulations.map(s => ({
  id: s.id,
  title: s.title,
  scenario: s.scenario,
  tensions_count: s.tensions?.length || 0
})))}

Return the ${limit} most similar simulations based on:
1. Similar decision type
2. Similar context/domain
3. Similar stakeholders involved

For each, explain why it's relevant.`,
      response_json_schema: {
        type: "object",
        properties: {
          similar_simulations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                simulation_id: { type: "string" },
                similarity_score: { type: "number" },
                reason: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Enrich with full simulation data
    const enriched = await Promise.all(
      result.similar_simulations.map(async (match) => {
        const sim = allSimulations.find(s => s.id === match.simulation_id);
        return {
          ...match,
          simulation: sim
        };
      })
    );

    return Response.json({ similar: enriched });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});