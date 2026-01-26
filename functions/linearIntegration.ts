import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ...params } = await req.json();
    const apiKey = Deno.env.get('LINEAR_API_KEY');

    if (!apiKey) {
      return Response.json({ error: 'LINEAR_API_KEY not configured' }, { status: 500 });
    }

    const linearQuery = async (query, variables = {}) => {
      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey
        },
        body: JSON.stringify({ query, variables })
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      return result.data;
    };

    if (action === 'importADRs') {
      // Import issues tagged as ADR
      const query = `
        query($filter: IssueFilter) {
          issues(filter: $filter, first: 50) {
            nodes {
              id
              title
              description
              createdAt
              labels {
                nodes {
                  name
                }
              }
            }
          }
        }
      `;

      const data = await linearQuery(query, {
        filter: { labels: { name: { contains: 'ADR' } } }
      });

      const adrs = data.issues.nodes.map(issue => ({
        title: issue.title,
        description: issue.description,
        source: 'linear',
        sourceId: issue.id,
        createdAt: issue.createdAt
      }));

      return Response.json({ adrs });
    }

    if (action === 'exportNextSteps') {
      // Create Linear issues from next steps
      const { nextSteps, teamId, projectId } = params;

      const createMutation = `
        mutation($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              title
              url
            }
          }
        }
      `;

      const createdIssues = [];
      for (const step of nextSteps) {
        const input = {
          teamId,
          title: step.action,
          description: `Priority: ${step.priority}\nConfidence: ${step.confidence}%\nOwner Role: ${step.owner_role}`,
          priority: step.priority === 'high' ? 1 : step.priority === 'medium' ? 2 : 3
        };

        if (projectId) {
          input.projectId = projectId;
        }

        const result = await linearQuery(createMutation, { input });
        if (result.issueCreate.success) {
          createdIssues.push(result.issueCreate.issue);
        }
      }

      return Response.json({ createdIssues });
    }

    if (action === 'getTeams') {
      const query = `
        query {
          teams {
            nodes {
              id
              name
            }
          }
        }
      `;

      const data = await linearQuery(query);
      return Response.json({ teams: data.teams.nodes });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});