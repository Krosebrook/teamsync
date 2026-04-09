import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateBody(body) {
  if (!body || typeof body !== 'object') throw new Error('Request body must be a JSON object');
  if (!body.simulation_id || typeof body.simulation_id !== 'string') {
    throw new Error('simulation_id is required and must be a string');
  }
  if (body.fork_label != null && typeof body.fork_label !== 'string') {
    throw new Error('fork_label must be a string if provided');
  }
  if (body.fork_label && body.fork_label.length > 200) {
    throw new Error('fork_label must be 200 characters or fewer');
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, { status: 400 });
    }

    validateBody(body);

    const { simulation_id, fork_label } = body;

    // Fetch the source simulation — list filter by id is the SDK pattern here
    const results = await base44.entities.Simulation.filter({ id: simulation_id });
    if (!results || results.length === 0) {
      return Response.json(
        { error: `Simulation not found: ${simulation_id}`, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const source = results[0];

    // Only completed simulations can be forked (drafts/running are unstable)
    if (source.status !== 'completed') {
      return Response.json(
        { error: 'Only completed simulations can be forked', code: 'PRECONDITION_FAILED' },
        { status: 422 }
      );
    }

    // Determine the root lineage ID and next version number
    const rootId = source.parent_simulation_id || source.id;
    const siblings = await base44.entities.Simulation.filter({ parent_simulation_id: rootId });
    const nextVersion = (siblings?.length || 0) + 2; // root = v1, forks start at v2

    const label = (fork_label?.trim()) || `Fork of "${source.title}"`;

    const forkedData = {
      title: label,
      scenario: source.scenario || '',
      use_case_type: source.use_case_type || 'custom',

      // Deep-copy all role/env/result data
      selected_roles: source.selected_roles
        ? JSON.parse(JSON.stringify(source.selected_roles))
        : [],
      responses: source.responses
        ? JSON.parse(JSON.stringify(source.responses))
        : [],
      tensions: source.tensions
        ? JSON.parse(JSON.stringify(source.tensions))
        : [],
      decision_trade_offs: source.decision_trade_offs
        ? JSON.parse(JSON.stringify(source.decision_trade_offs))
        : [],
      summary: source.summary || '',

      // Reset step completion — fork starts fresh
      next_steps: (source.next_steps || []).map(step => ({
        ...step,
        completed: false,
        subtasks: (step.subtasks || []).map(st => ({ ...st, completed: false })),
      })),

      tags: [...new Set([...(source.tags || []), 'forked'])],
      shared_with: [], // fork is private by default

      // Lineage
      parent_simulation_id: rootId,
      version_number: nextVersion,
      version_label: `v${nextVersion} — ${label}`,

      // Fork always starts as draft
      status: 'draft',
    };

    const forked = await base44.entities.Simulation.create(forkedData);

    return Response.json({
      success: true,
      fork: {
        id: forked.id,
        title: forked.title,
        version_number: forked.version_number,
        version_label: forked.version_label,
        parent_simulation_id: forked.parent_simulation_id,
        status: forked.status,
      },
    });

  } catch (error) {
    return Response.json(
      { error: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});