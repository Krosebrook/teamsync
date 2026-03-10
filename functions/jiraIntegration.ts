import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Validation ───────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = new Set(['importADRs', 'exportNextSteps', 'getProjects', 'getProjectMembers']);

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

// ─── Jira ADF builder ─────────────────────────────────────────────────────────

function buildAdfDescription(step) {
  const paragraphs = [];

  const addParagraph = (text) => {
    if (!text) return;
    paragraphs.push({
      type: 'paragraph',
      content: [{ type: 'text', text: String(text) }],
    });
  };

  // Step description (from IntegrationPanel enrichment or fallback)
  if (step.description) {
    for (const line of step.description.split('\n')) {
      addParagraph(line);
    }
  } else {
    addParagraph(`Owner Role: ${step.owner_role || '—'}`);
    addParagraph(`Priority: ${step.priority || '—'}`);
    addParagraph(`Confidence: ${step.confidence != null ? step.confidence + '%' : '—'}`);
  }

  return { type: 'doc', version: 1, content: paragraphs };
}

// ─── Rate-limited Jira request helper ────────────────────────────────────────

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

    const domain = Deno.env.get('JIRA_DOMAIN');
    const email = Deno.env.get('JIRA_EMAIL');
    const apiToken = Deno.env.get('JIRA_API_TOKEN');

    if (!domain || !email || !apiToken) {
      return Response.json(
        { error: 'Jira credentials not configured. Set JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN.', code: 'MISSING_CONFIG' },
        { status: 503 }
      );
    }

    const authHeader = `Basic ${btoa(`${email}:${apiToken}`)}`;

    const jiraRequest = async (endpoint, method = 'GET', body = null) => {
      const options = {
        method,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };
      if (body !== null) options.body = JSON.stringify(body);

      const response = await fetch(`https://${domain}/rest/api/3/${endpoint}`, options);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
        await sleep(retryAfter * 1000);
        // Retry once
        const retry = await fetch(`https://${domain}/rest/api/3/${endpoint}`, options);
        if (!retry.ok) {
          const text = await retry.text();
          throw new Error(`Jira API error (after retry): ${retry.status} — ${text.slice(0, 200)}`);
        }
        return retry.json();
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Jira API error: ${response.status} — ${text.slice(0, 200)}`);
      }

      return response.json();
    };

    // ── importADRs ────────────────────────────────────────────────────────────

    if (action === 'importADRs') {
      const jql = 'labels = ADR ORDER BY created DESC';
      const data = await jiraRequest(`search?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,description,created`);

      const adrs = (data.issues || []).map(issue => ({
        title: issue.fields.summary || '(Untitled)',
        description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
        source: 'jira',
        sourceId: issue.key,
        createdAt: issue.fields.created,
      }));

      return Response.json({ adrs });
    }

    // ── getProjects ───────────────────────────────────────────────────────────

    if (action === 'getProjects') {
      const data = await jiraRequest('project/search?maxResults=50&orderBy=name');
      const projects = (data.values || []).map(p => ({
        key: p.key,
        name: p.name,
        id: p.id,
        projectTypeKey: p.projectTypeKey,
      }));
      return Response.json({ projects });
    }

    // ── getProjectMembers ─────────────────────────────────────────────────────

    if (action === 'getProjectMembers') {
      const { projectKey } = params;
      if (!projectKey || typeof projectKey !== 'string') {
        return Response.json({ error: 'projectKey is required', code: 'MISSING_PARAM' }, { status: 400 });
      }

      // Jira Cloud: get assignable users for a project
      const data = await jiraRequest(
        `user/assignable/search?project=${encodeURIComponent(projectKey)}&maxResults=50`
      );

      const members = (Array.isArray(data) ? data : []).map(u => ({
        id: u.accountId,
        displayName: u.displayName || u.emailAddress || u.accountId,
        email: u.emailAddress || '',
        avatarUrl: u.avatarUrls?.['24x24'] || '',
      }));

      return Response.json({ members });
    }

    // ── exportNextSteps ───────────────────────────────────────────────────────

    if (action === 'exportNextSteps') {
      const { nextSteps, projectKey } = params;

      if (!projectKey || typeof projectKey !== 'string') {
        return Response.json({ error: 'projectKey is required', code: 'MISSING_PARAM' }, { status: 400 });
      }

      validateNextSteps(nextSteps);

      const JIRA_PRIORITY = { high: 'High', medium: 'Medium', low: 'Low' };

      const createdIssues = [];
      const errors = [];

      for (let i = 0; i < nextSteps.length; i++) {
        const step = nextSteps[i];

        // Polite inter-request delay to respect Jira rate limits (~10 req/s for Cloud)
        if (i > 0) await sleep(120);

        const issueData = {
          fields: {
            project: { key: projectKey },
            summary: step.action.slice(0, 255), // Jira summary max length
            description: buildAdfDescription(step),
            issuetype: { name: 'Task' },
            priority: { name: JIRA_PRIORITY[step.priority] || 'Medium' },
          },
        };

        // Assign if a Jira account ID was mapped for this step's role
        if (step.assigneeAccountId) {
          issueData.fields.assignee = { accountId: step.assigneeAccountId };
        }

        const created = await jiraRequest('issue', 'POST', issueData);
        createdIssues.push({
          id: created.id,
          key: created.key,
          url: `https://${domain}/browse/${created.key}`,
        });
      }

      return Response.json({ createdIssues, errors, total: createdIssues.length });
    }

    // Unreachable due to ALLOWED_ACTIONS check above, but satisfies linter
    return Response.json({ error: 'Invalid action', code: 'INVALID_ACTION' }, { status: 400 });

  } catch (error) {
    return Response.json(
      { error: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});