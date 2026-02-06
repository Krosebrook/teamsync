// Comprehensive B2B Solutions Corporation Roles
// Front of House (Customer-Facing) and Back of House (Internal Operations)

import {
  Users, Briefcase, Headphones, TrendingUp, Target, Award, 
  Code, Database, Cloud, Shield, Settings, Wrench,
  DollarSign, PieChart, FileText, Scale, UserCheck, Building,
  Lightbulb, Rocket, Package, Truck, ClipboardCheck, BookOpen
} from 'lucide-react';

// ============ CORPORATION ROLES ============

export const CORPORATION_FRONT_OF_HOUSE = [
  // Sales & Business Development
  {
    id: 'corp_account_executive',
    name: 'Account Executive',
    icon: 'Briefcase',
    color: 'blue',
    default_influence: 8,
    category: 'Sales & BD',
    description: 'Drives new business, negotiates contracts, manages client relationships'
  },
  {
    id: 'corp_sales_engineer',
    name: 'Sales Engineer',
    icon: 'Settings',
    color: 'cyan',
    default_influence: 7,
    category: 'Sales & BD',
    description: 'Provides technical expertise during sales process, demos, and proof-of-concepts'
  },
  {
    id: 'corp_business_dev_manager',
    name: 'Business Development Manager',
    icon: 'TrendingUp',
    color: 'violet',
    default_influence: 8,
    category: 'Sales & BD',
    description: 'Identifies partnership opportunities, explores new markets'
  },

  // Customer Success
  {
    id: 'corp_customer_success_manager',
    name: 'Customer Success Manager',
    icon: 'Users',
    color: 'emerald',
    default_influence: 7,
    category: 'Customer Success',
    description: 'Ensures customers achieve desired outcomes, manages renewals and expansion'
  },
  {
    id: 'corp_onboarding_specialist',
    name: 'Onboarding Specialist',
    icon: 'Rocket',
    color: 'amber',
    default_influence: 6,
    category: 'Customer Success',
    description: 'Guides new customers through implementation and initial setup'
  },
  {
    id: 'corp_technical_account_manager',
    name: 'Technical Account Manager',
    icon: 'Shield',
    color: 'indigo',
    default_influence: 8,
    category: 'Customer Success',
    description: 'Provides technical guidance to enterprise customers, bridges product and customer needs'
  },

  // Support
  {
    id: 'corp_support_engineer',
    name: 'Support Engineer',
    icon: 'Headphones',
    color: 'rose',
    default_influence: 6,
    category: 'Support',
    description: 'Resolves technical issues, provides troubleshooting and customer assistance'
  },
  {
    id: 'corp_solutions_architect',
    name: 'Solutions Architect',
    icon: 'Lightbulb',
    color: 'purple',
    default_influence: 8,
    category: 'Support',
    description: 'Designs custom solutions for enterprise clients, technical consulting'
  }
];

export const CORPORATION_BACK_OF_HOUSE = [
  // Product & Engineering
  {
    id: 'corp_product_manager',
    name: 'Product Manager',
    icon: 'Target',
    color: 'violet',
    default_influence: 9,
    category: 'Product',
    description: 'Defines product strategy, prioritizes features, manages roadmap'
  },
  {
    id: 'corp_engineering_manager',
    name: 'Engineering Manager',
    icon: 'Code',
    color: 'blue',
    default_influence: 8,
    category: 'Engineering',
    description: 'Leads engineering team, manages technical execution and delivery'
  },
  {
    id: 'corp_staff_engineer',
    name: 'Staff Engineer',
    icon: 'Database',
    color: 'cyan',
    default_influence: 7,
    category: 'Engineering',
    description: 'Senior technical leadership, architecture decisions, mentors team'
  },
  {
    id: 'corp_devops_engineer',
    name: 'DevOps Engineer',
    icon: 'Cloud',
    color: 'orange',
    default_influence: 6,
    category: 'Engineering',
    description: 'Manages infrastructure, CI/CD, deployment, and system reliability'
  },
  {
    id: 'corp_security_engineer',
    name: 'Security Engineer',
    icon: 'Shield',
    color: 'rose',
    default_influence: 7,
    category: 'Engineering',
    description: 'Ensures product security, compliance, conducts security audits'
  },
  {
    id: 'corp_qa_engineer',
    name: 'QA Engineer',
    icon: 'ClipboardCheck',
    color: 'teal',
    default_influence: 6,
    category: 'Engineering',
    description: 'Tests product quality, automated testing, bug identification'
  },

  // Operations
  {
    id: 'corp_operations_manager',
    name: 'Operations Manager',
    icon: 'Settings',
    color: 'slate',
    default_influence: 7,
    category: 'Operations',
    description: 'Streamlines internal processes, manages operational efficiency'
  },
  {
    id: 'corp_implementation_manager',
    name: 'Implementation Manager',
    icon: 'Wrench',
    color: 'amber',
    default_influence: 7,
    category: 'Operations',
    description: 'Oversees customer implementations, coordinates cross-functional delivery'
  },
  {
    id: 'corp_data_analyst',
    name: 'Data Analyst',
    icon: 'PieChart',
    color: 'indigo',
    default_influence: 6,
    category: 'Operations',
    description: 'Analyzes product usage, customer data, provides insights for decision-making'
  },

  // Finance & Legal
  {
    id: 'corp_finance_director',
    name: 'Finance Director',
    icon: 'DollarSign',
    color: 'emerald',
    default_influence: 8,
    category: 'Finance',
    description: 'Manages budgets, financial planning, pricing strategy'
  },
  {
    id: 'corp_legal_counsel',
    name: 'Legal Counsel',
    icon: 'Scale',
    color: 'slate',
    default_influence: 7,
    category: 'Legal',
    description: 'Reviews contracts, ensures compliance, manages legal risks'
  },

  // HR & People
  {
    id: 'corp_hr_business_partner',
    name: 'HR Business Partner',
    icon: 'UserCheck',
    color: 'pink',
    default_influence: 6,
    category: 'HR',
    description: 'Supports hiring, team development, organizational culture'
  },

  // Marketing
  {
    id: 'corp_product_marketing_manager',
    name: 'Product Marketing Manager',
    icon: 'Award',
    color: 'purple',
    default_influence: 7,
    category: 'Marketing',
    description: 'Positions product in market, creates go-to-market strategies, messaging'
  }
];

// ============ CLIENT ROLES ============

export const CLIENT_FRONT_OF_HOUSE = [
  {
    id: 'client_procurement_manager',
    name: 'Procurement Manager',
    icon: 'Package',
    color: 'blue',
    default_influence: 7,
    category: 'Procurement',
    description: 'Manages vendor selection, contract negotiations, purchasing decisions'
  },
  {
    id: 'client_business_analyst',
    name: 'Business Analyst',
    icon: 'FileText',
    color: 'cyan',
    default_influence: 6,
    category: 'Business',
    description: 'Analyzes business requirements, evaluates solution fit'
  },
  {
    id: 'client_operations_lead',
    name: 'Operations Lead',
    icon: 'Settings',
    color: 'amber',
    default_influence: 8,
    category: 'Operations',
    description: 'Oversees day-to-day operations, evaluates operational impact of solutions'
  },
  {
    id: 'client_department_head',
    name: 'Department Head',
    icon: 'Building',
    color: 'violet',
    default_influence: 9,
    category: 'Leadership',
    description: 'Makes strategic decisions for department, approves major investments'
  }
];

export const CLIENT_BACK_OF_HOUSE = [
  {
    id: 'client_it_director',
    name: 'IT Director',
    icon: 'Cloud',
    color: 'blue',
    default_influence: 8,
    category: 'IT',
    description: 'Manages IT strategy, infrastructure, and technology decisions'
  },
  {
    id: 'client_systems_admin',
    name: 'Systems Administrator',
    icon: 'Database',
    color: 'cyan',
    default_influence: 6,
    category: 'IT',
    description: 'Manages internal systems, integration, technical implementation'
  },
  {
    id: 'client_security_officer',
    name: 'Security Officer',
    icon: 'Shield',
    color: 'rose',
    default_influence: 7,
    category: 'Security',
    description: 'Evaluates security compliance, data protection, risk management'
  },
  {
    id: 'client_compliance_manager',
    name: 'Compliance Manager',
    icon: 'Scale',
    color: 'slate',
    default_influence: 7,
    category: 'Compliance',
    description: 'Ensures regulatory compliance, policy adherence'
  },
  {
    id: 'client_finance_controller',
    name: 'Finance Controller',
    icon: 'DollarSign',
    color: 'emerald',
    default_influence: 8,
    category: 'Finance',
    description: 'Manages budget approvals, ROI analysis, financial oversight'
  },
  {
    id: 'client_training_manager',
    name: 'Training Manager',
    icon: 'BookOpen',
    color: 'purple',
    default_influence: 5,
    category: 'Training',
    description: 'Coordinates user training, change management, adoption'
  }
];

// ============ PARTNER/INTEGRATOR ROLES ============

export const PARTNER_ROLES = [
  {
    id: 'partner_integration_engineer',
    name: 'Integration Engineer',
    icon: 'Code',
    color: 'cyan',
    default_influence: 7,
    category: 'Technical',
    description: 'Builds and maintains integrations between systems'
  },
  {
    id: 'partner_consulting_manager',
    name: 'Consulting Manager',
    icon: 'Users',
    color: 'violet',
    default_influence: 8,
    category: 'Consulting',
    description: 'Advises on best practices, implementation strategies'
  },
  {
    id: 'partner_technical_lead',
    name: 'Technical Lead',
    icon: 'Wrench',
    color: 'orange',
    default_influence: 7,
    category: 'Technical',
    description: 'Leads technical delivery for partner implementations'
  },
  {
    id: 'partner_account_manager',
    name: 'Partner Account Manager',
    icon: 'Briefcase',
    color: 'blue',
    default_influence: 6,
    category: 'Partnership',
    description: 'Manages partnership relationship, coordinates joint efforts'
  }
];

// Icon name mapping for dynamic icon rendering
export const B2B_ICON_MAP = {
  Briefcase, Headphones, TrendingUp, Target, Award,
  Code, Database, Cloud, Shield, Settings, Wrench,
  DollarSign, PieChart, FileText, Scale, UserCheck, Building,
  Lightbulb, Rocket, Package, Truck, ClipboardCheck, BookOpen,
  Users
};

export const ALL_B2B_ROLES = [
  ...CORPORATION_FRONT_OF_HOUSE,
  ...CORPORATION_BACK_OF_HOUSE,
  ...CLIENT_FRONT_OF_HOUSE,
  ...CLIENT_BACK_OF_HOUSE,
  ...PARTNER_ROLES
];