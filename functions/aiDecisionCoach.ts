import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scenario, selected_roles, phase } = await req.json();

    let prompt = '';

    if (phase === 'setup') {
      // Real-time suggestions during scenario writing
      prompt = `You are an AI decision coach. The user is writing this scenario:

"${scenario}"

Current roles selected: ${selected_roles.map(r => r.role).join(', ')}

Provide brief, actionable suggestions:
1. Are there any critical roles missing?
2. Are there any constraints or context they should add?
3. Any red flags or considerations they should think about?

Keep it super concise - 2-3 bullet points max.`;
    } else if (phase === 'post_simulation') {
      // Post-simulation recommendations
      prompt = `Based on this completed simulation, provide next steps:

Scenario: "${scenario}"

Provide:
1. Should they run any follow-up simulations?
2. What specific questions remain unanswered?
3. Any process improvements for next time?

Keep it actionable and specific.`;
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                message: { type: "string" },
                action: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});