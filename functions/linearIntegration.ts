import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Validation ───────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = new Set(['importADRs', 'exportNextSteps', 'getTeams', 'getMembers']);

function validateNextSteps(nextSteps) {
  if (!Array.isArray(nextSteps) || nextSteps.length === 0) {
    throw new Error('nextSteps must be a non-empty array');
  }
  if (nextSteps.length > 50) {
    throw new Error('Cannot export more than 50 steps at once');
  }
  for (const step of nextSteps) {
    if (!step.action || typeof step.action !== 'string') {
      throw new Error('Each step must have a string "action" field');
    }
  }
}

// ─── Linear priority map ──────────────────────────────────────────────────────
// Linear priority: 0 = no priority, 1 = urgent, 2 = high, 3 = medium, 4 = low
const LINEAR_PRIORITY = { high: 2, medium: 3, low: 4 };

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...params } = body;

    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return Response.json(
        { error: `Invalid action. Allowed: ${[...ALLOWED_ACTIONS].join(', ')}`, code: 'INVALID_ACTION' },
        { status: 400 }
      );
    }

    const apiKey = Deno.env.get('LINEAR_API_KEY');
    if (!apiKey) {
      return Response.json(
        { error: 'LINEAR_API_KEY not configured', code: 'MISSING_CONFIG' },
        { status: 503 }
      );
    }

    const linearQuery = async (query, variables = {}) => {
      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (response.status === 429) {
        // Linear uses 429 with a Retry-After header
        const retryAfter = parseInt(response.headers.get('X-RateLimit-Requests-Reset') || '5000', 10);
        await sleep(Math.min(retryAfter, 10000));
        // Retry once
        const retry = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': apiKey },
          body: JSON.stringify({ query, variables }),
        });
        const result = await retry.json();
        if (result.errors) throw new Error(result.errors[0].message);
        return result.data;
      }

      if (!response.ok) {
        throw new Error(`Linear API HTTP error: ${response.status}`);
      }

      const result = await response.json();
      if (result.errors) throw new Error(result.errors[0].message);
      return result.data;
    };

    // ── getTeams ──────────────────────────────────────────────────────────────

    if (action === 'getTeams') {
      const data = await linearQuery(`
        query {
          teams {
            nodes { id name key }
          }
        }
      `);
      return Response.json({ teams: data.teams.nodes });
    }

    // ── getMembers ────────────────────────────────────────────────────────────

    if (action === 'getMembers') {
      const { teamId } = params;
      if (!teamId || typeof teamId !== 'string') {
        return Response.json({ error: 'teamId is required', code: 'MISSING_PARAM' }, { status: 400 });
      }

      const data = await linearQuery(`
        query($teamId: String!) {
          team(id: $teamId) {
            members {
              nodes { id name email displayName }
            }
          }
        }
      `, { teamId });

      const members = (data.team?.members?.nodes || []).map(m => ({
        id: m.id,
        name: m.displayName || m.name || m.email,
        email: m.email || '',
      }));

      return Response.json({ members });
    }

    // ── importADRs ────────────────────────────────────────────────────────────

    if (action === 'importADRs') {
      const data = await linearQuery(`
        query($filter: IssueFilter) {
          issues(filter: $filter, first: 50) {
            nodes {
              id title description createdAt
              labels { nodes { name } }
            }
          }
        }
      `, { filter: { labels: { name: { contains: 'ADR' } } } });

      const adrs = (data.issues.nodes || []).map(issue => ({
        title: issue.title || '(Untitled)',
        description: issue.description || '',
        source: 'linear',
        sourceId: issue.id,
        createdAt: issue.createdAt,
      }));

      return Response.json({ adrs });
    }

    // ── exportNextSteps ───────────────────────────────────────────────────────

    if (action === 'exportNextSteps') {
      const { nextSteps, teamId, projectId } = params;

      if (!teamId || typeof teamId !== 'string') {
        return Response.json({ error: 'teamId is required', code: 'MISSING_PARAM' }, { status: 400 });
      }

      validateNextSteps(nextSteps);

      const CREATE_ISSUE = `
        mutation($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue { id title url identifier }
          }
        }
      `;

      const createdIssues = [];
      const errors = [];

      for (let i = 0; i < nextSteps.length; i++) {
        const step = nextSteps[i];

        // Conservative inter-request delay: Linear allows ~50 req/10s
        if (i > 0) await sleep(200);

        const input = {
          teamId,
          title: step.action.slice(0, 512), // Linear title limit
          description: step.description || [
            `**Owner Role:** ${step.owner_role || '—'}`,
            `**Priority:** ${step.priority || '—'}`,
            `**Confidence:** ${step.confidence != null ? step.confidence + '%' : '—'}`,
          ].join('\n'),
          priority: LINEAR_PRIORITY[step.priority] ?? 3,
        };

        if (projectId) input.projectId = projectId;

        // Assign if a Linear user ID was mapped for this step's role
        if (step.assigneeId) input.assigneeId = step.assigneeId;

        const result = await linearQuery(CREATE_ISSUE, { input });

        if (result.issueCreate?.success) {
          createdIssues.push(result.issueCreate.issue);
        } else {
          errors.push({ step: step.action.slice(0, 60), reason: 'issueCreate returned success=false' });
        }
      }

      return Response.json({ createdIssues, errors, total: createdIssues.length });
    }

    return Response.json({ error: 'Invalid action', code: 'INVALID_ACTION' }, { status: 400 });

  } catch (error) {
    return Response.json(
      { error: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});