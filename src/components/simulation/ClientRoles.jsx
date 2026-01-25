import { 
  Users, 
  Headphones, 
  TrendingUp, 
  DollarSign, 
  Award,
  UserCheck,
  MessageSquare,
  Settings,
  GitBranch,
  Shield,
  BarChart3,
  Database,
  Zap,
  Package,
  FileCheck
} from "lucide-react";

// Front of House (5 roles) - Client-facing
export const FRONT_OF_HOUSE_ROLES = [
  { 
    id: "account_manager", 
    name: "Account Manager", 
    icon: UserCheck, 
    color: "emerald", 
    defaultInfluence: 8,
    description: "Manages client relationships, ensures satisfaction, drives renewals and upsells. Prioritizes client happiness and account growth."
  },
  { 
    id: "customer_success", 
    name: "Customer Success Manager", 
    icon: Headphones, 
    color: "blue", 
    defaultInfluence: 7,
    description: "Ensures clients achieve desired outcomes with the product. Focuses on adoption, engagement, and long-term value realization."
  },
  { 
    id: "sales", 
    name: "Sales Executive", 
    icon: TrendingUp, 
    color: "violet", 
    defaultInfluence: 7,
    description: "Closes deals and brings in new business. Prioritizes revenue targets, deal velocity, and competitive positioning."
  },
  { 
    id: "support_lead", 
    name: "Support Lead", 
    icon: MessageSquare, 
    color: "cyan", 
    defaultInfluence: 6,
    description: "Manages support tickets and client issues. Focuses on response times, resolution rates, and client satisfaction scores."
  },
  { 
    id: "professional_services", 
    name: "Professional Services", 
    icon: Award, 
    color: "orange", 
    defaultInfluence: 6,
    description: "Delivers implementation, training, and consulting. Prioritizes successful deployments and time-to-value."
  }
];

// Back of House (10 roles) - Internal operations
export const BACK_OF_HOUSE_ROLES = [
  // Inner-facing
  { 
    id: "finance", 
    name: "Finance Controller", 
    icon: DollarSign, 
    color: "rose", 
    defaultInfluence: 8,
    description: "Manages budgets, forecasts, and financial health. Prioritizes profitability, cost control, and ROI."
  },
  { 
    id: "hr", 
    name: "HR/People Ops", 
    icon: Users, 
    color: "pink", 
    defaultInfluence: 7,
    description: "Handles hiring, retention, and culture. Focuses on team satisfaction, bandwidth, and organizational design."
  },
  { 
    id: "operations", 
    name: "Operations Manager", 
    icon: Settings, 
    color: "slate", 
    defaultInfluence: 7,
    description: "Optimizes processes and operational efficiency. Prioritizes scalability, automation, and resource utilization."
  },
  { 
    id: "legal", 
    name: "Legal/Compliance", 
    icon: Shield, 
    color: "indigo", 
    defaultInfluence: 8,
    description: "Ensures regulatory compliance and manages risk. Focuses on contracts, data privacy, and liability mitigation."
  },
  { 
    id: "data_analytics", 
    name: "Data Analytics Lead", 
    icon: BarChart3, 
    color: "purple", 
    defaultInfluence: 6,
    description: "Analyzes metrics and drives data-informed decisions. Prioritizes measurement accuracy and actionable insights."
  },
  
  // Outward-facing
  { 
    id: "bizdev", 
    name: "Business Development", 
    icon: GitBranch, 
    color: "teal", 
    defaultInfluence: 7,
    description: "Pursues partnerships and new market opportunities. Focuses on strategic alliances and channel development."
  },
  { 
    id: "partnerships", 
    name: "Partnerships Manager", 
    icon: Zap, 
    color: "amber", 
    defaultInfluence: 6,
    description: "Manages integration partners and ecosystem. Prioritizes partner satisfaction and co-marketing opportunities."
  },
  
  // Combination (inner + outer)
  { 
    id: "procurement", 
    name: "Procurement/Vendor Relations", 
    icon: Package, 
    color: "lime", 
    defaultInfluence: 6,
    description: "Manages vendor relationships and contracts. Balances cost optimization with vendor reliability and service quality."
  },
  { 
    id: "infrastructure", 
    name: "Infrastructure/DevOps", 
    icon: Database, 
    color: "cyan", 
    defaultInfluence: 7,
    description: "Maintains systems reliability and scalability. Prioritizes uptime, performance, and infrastructure costs."
  },
  { 
    id: "compliance_audit", 
    name: "Compliance & Audit", 
    icon: FileCheck, 
    color: "rose", 
    defaultInfluence: 7,
    description: "Ensures adherence to standards and certifications. Focuses on audit readiness, documentation, and risk mitigation."
  }
];

export const CLIENT_SUITE_ROLES = [...FRONT_OF_HOUSE_ROLES, ...BACK_OF_HOUSE_ROLES];