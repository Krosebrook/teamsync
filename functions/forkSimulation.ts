import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { simulation_id, fork_label } = await req.json();

    if (!simulation_id) {
      return Response.json({ error: 'simulation_id is required' }, { status: 400 });
    }

    // Fetch the source simulation
    const results = await base44.entities.Simulation.filter({ id: simulation_id });
    if (!results || results.length === 0) {
      return Response.json({ error: 'Simulation not found' }, { status: 404 });
    }

    const source = results[0];

    // Determine version number for this fork lineage
    // Count existing forks of this parent (or this sim if it is the root)
    const rootId = source.parent_simulation_id || source.id;
    const siblings = await base44.entities.Simulation.filter({ parent_simulation_id: rootId });
    const nextVersion = (siblings?.length || 0) + 2; // parent is v1, forks start at v2

    const now = new Date().toISOString();
    const label = fork_label || `Fork of "${source.title}"`;

    // Deep-copy all simulation fields into a new draft.
    // Intentionally strip: id, created_date, updated_date, created_by (auto-set by platform)
    // Intentionally set: status=draft, parent reference, version metadata
    const forkedData = {
      title: label,
      scenario: source.scenario,
      use_case_type: source.use_case_type || 'custom',

      // Role configuration — full deep copy
      selected_roles: source.selected_roles
        ? JSON.parse(JSON.stringify(source.selected_roles))
        : [],

      // Environmental factors
      // NOTE: stored in responses[*].environmental_factors if present; also top-level field if set
      // We copy the full responses array so env context is preserved
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

      // Next steps — reset completion so the fork starts fresh
      next_steps: (source.next_steps || []).map(step => ({
        ...step,
        completed: false,
        subtasks: (step.subtasks || []).map(st => ({ ...st, completed: false })),
      })),

      tags: source.tags ? [...source.tags, 'forked'] : ['forked'],
      shared_with: [], // fork is private by default

      // Lineage tracking
      parent_simulation_id: rootId,
      version_number: nextVersion,
      version_label: `v${nextVersion} — ${label}`,

      // Fork always starts as draft so user can modify before running
      status: 'draft',
    };

    const forked = await base44.entities.Simulation.create(forkedData);

    return Response.json({
      success: true,
      fork: {
        id: forked.id,
        title: forked.title,
        version_number: forked.version_number,
        parent_simulation_id: forked.parent_simulation_id,
        status: forked.status,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});