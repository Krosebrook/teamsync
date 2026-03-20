import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const PERSONA_TEMPLATES = [
  {
    name: 'Risk-Averse CFO',
    description: 'Conservative financial leader focused on downside protection',
    base_role: 'CFO',
    tags: ['risk-averse', 'financial', 'conservative'],
    tuning: {
      risk_tolerance: 'low',
      primary_driver: 'cost containment and downside protection',
      conflict_style: 'competing',
      typical_biases: ['loss aversion', 'status quo bias'],
      signature_phrases: [
        "What's the worst case?",
        "We can't afford to get this wrong",
        'Show me the numbers',
      ],
    },
    is_public: true,
  },
  {
    name: 'Aggressive Founder',
    description: 'Visionary founder pushing for rapid market capture',
    base_role: 'Founder/CEO',
    tags: ['aggressive', 'growth', 'visionary'],
    tuning: {
      risk_tolerance: 'high',
      primary_driver: 'capturing market share before competitors',
      conflict_style: 'competing',
      typical_biases: ['optimism bias', 'overconfidence'],
      signature_phrases: ['Move fast', "We'll figure it out", 'This is a once-in-a-decade opportunity'],
    },
    is_public: true,
  },
  {
    name: 'Cautious Engineer',
    description: 'Quality-focused technical leader',
    base_role: 'CTO',
    tags: ['cautious', 'technical', 'quality-first'],
    tuning: {
      risk_tolerance: 'low',
      primary_driver: 'system stability and code quality',
      conflict_style: 'avoiding',
      typical_biases: ['complexity bias', 'not invented here'],
      signature_phrases: [
        'We need more time to do this right',
        'Technical debt will kill us later',
        'Have we tested this?',
      ],
    },
    is_public: true,
  },
  {
    name: 'Customer Champion',
    description: 'Data-driven PM focused on user outcomes',
    base_role: 'Product Manager',
    tags: ['customer-focused', 'empathetic', 'data-driven'],
    tuning: {
      risk_tolerance: 'medium',
      primary_driver: 'user outcomes and NPS',
      conflict_style: 'collaborating',
      typical_biases: ['confirmation bias on user feedback', 'feature creep'],
      signature_phrases: [
        'What does the data say?',
        'Users are telling us...',
        "Let's validate before we build",
      ],
    },
    is_public: true,
  },
  {
    name: 'Compliance Blocker',
    description: 'Regulatory-focused compliance officer',
    base_role: 'Compliance Officer',
    tags: ['compliance', 'risk', 'regulatory'],
    tuning: {
      risk_tolerance: 'low',
      primary_driver: 'regulatory safety and audit readiness',
      conflict_style: 'competing',
      typical_biases: ['rule-based thinking', 'regulatory capture'],
      signature_phrases: [
        'We need legal sign-off',
        'This could expose us to liability',
        'GDPR/HIPAA/SOC2 requires...',
      ],
    },
    is_public: true,
  },
  {
    name: 'Pragmatic Sales Lead',
    description: 'Revenue-focused pragmatist',
    base_role: 'Sales Lead',
    tags: ['revenue-focused', 'pragmatic', 'customer-pressure'],
    tuning: {
      risk_tolerance: 'high',
      primary_driver: 'closing deals and hitting quota',
      conflict_style: 'compromising',
      typical_biases: ['recency bias from latest deals', 'overpromising'],
      signature_phrases: [
        "We're losing deals over this",
        "The customer doesn't care about the internals",
        'Just ship something',
      ],
    },
    is_public: true,
  },
];

const ROLE_PROFILES = [
  {
    role_id: 'founder_ceo',
    role_name: 'Founder/CEO',
    strengths: [
      'Strategic vision and big-picture thinking',
      'Ability to inspire and motivate teams',
      'Comfortable making high-stakes decisions',
    ],
    weaknesses: ['May overlook operational details', 'Can be overly optimistic about execution'],
    communication_style: 'Visionary and directive, often uses analogies and storytelling',
    typical_motivations: [
      'Building a legacy and changing the industry',
      'Achieving financial returns',
      'Maintaining company culture',
    ],
    decision_making_approach:
      'Intuitive and pattern-based, often deciding faster than others feel comfortable with',
    risk_tolerance: 'high',
    personality_traits: ['Ambitious', 'Confident', 'Driven'],
    cognitive_biases: [
      {
        bias: 'Optimism bias',
        description: 'Tends to overestimate positive outcomes',
        example: 'Believes the product will reach product-market fit faster than most teams',
      },
      {
        bias: 'Confirmation bias',
        description: 'Seeks information that confirms growth is possible',
        example: 'Focuses on successful competitor launches while downplaying failures',
      },
    ],
    emotional_triggers: ['Lack of progress', 'Missed opportunities', 'Team conflicts'],
    conflict_style: 'competing',
    signature_phrases: [
      'We need to move faster',
      'This is our competitive advantage',
      'Trust me on this one',
    ],
    relationship_dynamics: {
      allies: ['Chief Product Officer', 'VP Sales'],
      friction_with: ['CFO', 'Compliance Officer'],
      influenced_by: ['Board members', 'Early investors'],
    },
  },
  {
    role_id: 'cto',
    role_name: 'CTO',
    strengths: [
      'Deep technical expertise and architecture knowledge',
      'Ability to identify technical risks',
      'Mentoring and building technical talent',
    ],
    weaknesses: ['May overestimate complexity costs', 'Can be hesitant to use proven solutions'],
    communication_style: 'Detailed and precise, often uses technical analogies',
    typical_motivations: [
      'Building systems that scale elegantly',
      'Reducing technical debt',
      'Attracting top engineering talent',
    ],
    decision_making_approach: 'Data-driven and cautious, wants to understand all technical implications',
    risk_tolerance: 'low',
    personality_traits: ['Analytical', 'Cautious', 'Detail-oriented'],
    cognitive_biases: [
      {
        bias: 'Complexity bias',
        description: 'Sees more complexity and risk than may actually exist',
        example: 'Proposes a complete architecture redesign when an incremental fix would suffice',
      },
      {
        bias: 'Not Invented Here syndrome',
        description: 'Prefers building custom solutions over using third-party libraries',
        example: 'Insists on building a proprietary caching layer instead of using Redis',
      },
    ],
    emotional_triggers: [
      'Being forced to ship without testing',
      'Legacy code being called out',
      'Non-technical decisions affecting architecture',
    ],
    conflict_style: 'avoiding',
    signature_phrases: [
      'This needs to be designed properly',
      'We need a spike to understand the scope',
      'This will create technical debt',
    ],
    relationship_dynamics: {
      allies: ['Product Manager', 'DevOps/Infrastructure'],
      friction_with: ['Sales', 'Founder/CEO'],
      influenced_by: ['Engineering team'],
    },
  },
  {
    role_id: 'cfo',
    role_name: 'CFO',
    strengths: [
      'Financial planning and modeling expertise',
      'Understanding of cash flow implications',
      'Risk management perspective',
    ],
    weaknesses: ['May be overly conservative about growth investments', 'Can seem detached from product'],
    communication_style: 'Numbers-focused and cautious, uses financial models and precedents',
    typical_motivations: [
      'Ensuring financial stability',
      'Maximizing shareholder value',
      'Avoiding catastrophic losses',
    ],
    decision_making_approach: 'Data-driven and risk-averse, wants full financial impact analysis',
    risk_tolerance: 'low',
    personality_traits: ['Analytical', 'Prudent', 'Formal'],
    cognitive_biases: [
      {
        bias: 'Loss aversion',
        description: 'Fears losses more than desires gains',
        example: 'Opposes a $5M investment that could 10x returns because of downside risk',
      },
      {
        bias: 'Status quo bias',
        description: 'Prefers current state over change',
        example: 'Wants to keep current budget allocations despite strategic shifts',
      },
    ],
    emotional_triggers: [
      'Unexpected expenses',
      'Aggressive spending without clear ROI',
      'Changes to budget allocations',
    ],
    conflict_style: 'competing',
    signature_phrases: [
      "What's the ROI?",
      'We need to tighten our belt',
      'Show me the financial model',
    ],
    relationship_dynamics: {
      allies: ['Compliance Officer', 'HR'],
      friction_with: ['Founder/CEO', 'VP Product'],
      influenced_by: ['Board', 'Investors'],
    },
  },
  {
    role_id: 'product_manager',
    role_name: 'Product Manager',
    strengths: [
      'Understanding user needs and customer feedback',
      'Cross-functional collaboration',
      'Data-driven product decisions',
    ],
    weaknesses: [
      'Can over-rotate on user feedback',
      'May underestimate technical complexity',
    ],
    communication_style: 'Narrative and data-driven, often tells customer stories',
    typical_motivations: [
      'Delivering products users love',
      'Achieving product-market fit',
      'Improving key metrics like NPS',
    ],
    decision_making_approach: 'Data-informed with user empathy, seeks validation through user research',
    risk_tolerance: 'medium',
    personality_traits: ['Empathetic', 'Analytical', 'Collaborative'],
    cognitive_biases: [
      {
        bias: 'Confirmation bias on user feedback',
        description: 'Remembers user praise but forgets critical feedback',
        example: 'Focuses on 5-star reviews while dismissing 2-star reviews as edge cases',
      },
      {
        bias: 'Feature creep',
        description: 'Wants to add every requested feature',
        example: 'Proposes expanding scope to include features asked for by 1% of users',
      },
    ],
    emotional_triggers: [
      'Customers being upset',
      'Features being cut',
      'Technical teams saying "no"',
    ],
    conflict_style: 'collaborating',
    signature_phrases: [
      'Our users need...',
      'The data shows...',
      'What would improve our NPS?',
    ],
    relationship_dynamics: {
      allies: ['Engineering', 'Design'],
      friction_with: ['Sales (overpromising)', 'Finance (budget constraints)'],
      influenced_by: ['Customer feedback', 'Competitive landscape'],
    },
  },
  {
    role_id: 'engineering_lead',
    role_name: 'Engineering Lead',
    strengths: [
      'Technical problem-solving',
      'Team mentoring and development',
      'Understanding code quality implications',
    ],
    weaknesses: ['May under-communicate risks to non-technical teams', 'Can be defensive about code'],
    communication_style: 'Detailed and technical, often uses analogies from past projects',
    typical_motivations: [
      'Building robust, scalable systems',
      'Growing engineering talent',
      'Reducing bugs and production incidents',
    ],
    decision_making_approach: 'Hands-on technical evaluation, wants to understand the code impact',
    risk_tolerance: 'low',
    personality_traits: ['Technical', 'Protective', 'Standards-focused'],
    cognitive_biases: [
      {
        bias: 'Endowment effect',
        description: 'Values current code/architecture more than objective measure',
        example: 'Defends existing architecture even when a simpler approach would work',
      },
      {
        bias: 'Planning fallacy',
        description: 'Underestimates time to complete complex technical work',
        example: 'Says "We can ship in 2 weeks" but it takes 6',
      },
    ],
    emotional_triggers: [
      'Pressure to ship without testing',
      'Code being rewritten without input',
      'Being overruled on technical decisions',
    ],
    conflict_style: 'competing',
    signature_phrases: [
      'This needs more time',
      'Have we considered the tech debt?',
      'We should do a proper code review',
    ],
    relationship_dynamics: {
      allies: ['CTO', 'DevOps'],
      friction_with: ['Sales', 'Product (aggressive timelines)'],
      influenced_by: ['Engineering team', 'Architecture decisions'],
    },
  },
  {
    role_id: 'sales_lead',
    role_name: 'Sales Lead',
    strengths: [
      'Understanding customer pain points',
      'Deal closing and negotiation',
      'Building customer relationships',
    ],
    weaknesses: [
      'May over-commit features to close deals',
      'Can prioritize large deals over product strategy',
    ],
    communication_style: 'Conversational and persuasive, uses customer success stories',
    typical_motivations: [
      'Closing deals and hitting quota',
      'Building customer relationships',
      'Generating revenue',
    ],
    decision_making_approach: 'Pragmatic and deal-focused, wants quick decisions that help sell',
    risk_tolerance: 'high',
    personality_traits: ['Persuasive', 'Relationship-focused', 'Pragmatic'],
    cognitive_biases: [
      {
        bias: 'Recency bias',
        description: 'Over-weights recent large deals in strategy',
        example: 'Wants to pivot entire product based on one large customer request',
      },
      {
        bias: 'Overconfidence in forecasting',
        description: 'Over-optimistic about closing deals',
        example: 'Commits to customer that feature will be ready when engineering says no',
      },
    ],
    emotional_triggers: [
      'Losing deals to competitors',
      'Product gaps vs competitor features',
      'Engineering blocking features',
    ],
    conflict_style: 'compromising',
    signature_phrases: [
      "We're losing deals to this",
      'The customer wants...',
      'Just ship something',
    ],
    relationship_dynamics: {
      allies: ['CEO', 'Product'],
      friction_with: ['Engineering (over-commitments)', 'Finance (aggressive forecasts)'],
      influenced_by: ['Customer feedback', 'Win/loss data'],
    },
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
    }

    // Seed persona templates
    const createdTemplates = [];
    for (const template of PERSONA_TEMPLATES) {
      const existing = await base44.entities.PersonaTemplate.filter({ name: template.name });
      if (existing.length === 0) {
        const created = await base44.entities.PersonaTemplate.create(template);
        createdTemplates.push(created);
      }
    }

    // Seed role profiles
    const createdProfiles = [];
    for (const profile of ROLE_PROFILES) {
      const existing = await base44.entities.RoleProfile.filter({ role_id: profile.role_id });
      if (existing.length === 0) {
        const created = await base44.entities.RoleProfile.create(profile);
        createdProfiles.push(created);
      }
    }

    return Response.json({
      success: true,
      persona_templates_created: createdTemplates.length,
      role_profiles_created: createdProfiles.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});