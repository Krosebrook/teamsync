import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ...params } = await req.json();
    
    const domain = Deno.env.get('JIRA_DOMAIN');
    const email = Deno.env.get('JIRA_EMAIL');
    const apiToken = Deno.env.get('JIRA_API_TOKEN');

    if (!domain || !email || !apiToken) {
      return Response.json({ error: 'Jira credentials not configured' }, { status: 500 });
    }

    const jiraRequest = async (endpoint, method = 'GET', body = null) => {
      const auth = btoa(`${email}:${apiToken}`);
      const options = {
        method,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`https://${domain}/rest/api/3/${endpoint}`, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jira API error: ${errorText}`);
      }

      return response.json();
    };

    if (action === 'importADRs') {
      // Search for issues with ADR label
      const jql = 'labels = ADR ORDER BY created DESC';
      const data = await jiraRequest(`search?jql=${encodeURIComponent(jql)}&maxResults=50`);

      const adrs = data.issues.map(issue => ({
        title: issue.fields.summary,
        description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
        source: 'jira',
        sourceId: issue.key,
        createdAt: issue.fields.created
      }));

      return Response.json({ adrs });
    }

    if (action === 'exportNextSteps') {
      const { nextSteps, projectKey } = params;

      const createdIssues = [];
      for (const step of nextSteps) {
        const issueData = {
          fields: {
            project: { key: projectKey },
            summary: step.action,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: `Priority: ${step.priority}` }
                  ]
                },
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: `Confidence: ${step.confidence}%` }
                  ]
                },
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: `Owner Role: ${step.owner_role}` }
                  ]
                }
              ]
            },
            issuetype: { name: 'Task' },
            priority: {
              name: step.priority === 'high' ? 'High' : step.priority === 'medium' ? 'Medium' : 'Low'
            }
          }
        };

        const created = await jiraRequest('issue', 'POST', issueData);
        createdIssues.push({
          id: created.id,
          key: created.key,
          url: `https://${domain}/browse/${created.key}`
        });
      }

      return Response.json({ createdIssues });
    }

    if (action === 'getProjects') {
      const data = await jiraRequest('project/search');
      return Response.json({ projects: data.values });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});