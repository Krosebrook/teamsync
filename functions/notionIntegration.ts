import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ...params } = await req.json();
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('notion');

    if (!accessToken) {
      return Response.json({ error: 'Notion not connected' }, { status: 401 });
    }

    const notionRequest = async (endpoint, method = 'POST', body = null) => {
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`https://api.notion.com/v1/${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Notion API error');
      }

      return data;
    };

    if (action === 'createSimulationPage') {
      const { simulation, pageId } = params;

      const children = [
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: simulation.title } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: `Scenario: ${simulation.scenario}` } }]
          }
        }
      ];

      if (simulation.summary) {
        children.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Executive Summary' } }]
          }
        });
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: simulation.summary } }]
          }
        });
      }

      if (simulation.next_steps && simulation.next_steps.length > 0) {
        children.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Next Steps' } }]
          }
        });

        simulation.next_steps.forEach(step => {
          children.push({
            object: 'block',
            type: 'to_do',
            to_do: {
              rich_text: [{ 
                type: 'text', 
                text: { content: `${step.action} (${step.priority} - ${step.confidence}% confidence)` } 
              }],
              checked: false
            }
          });
        });
      }

      const page = await notionRequest('pages', 'POST', {
        parent: { page_id: pageId },
        properties: {
          title: {
            title: [{ text: { content: simulation.title } }]
          }
        },
        children
      });

      return Response.json({ pageId: page.id, url: page.url });
    }

    if (action === 'searchPages') {
      const data = await notionRequest('search', 'POST', {
        filter: { property: 'object', value: 'page' },
        page_size: 20
      });

      return Response.json({ pages: data.results });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});