import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, 
  Code2, 
  Shield, 
  Palette, 
  TestTube, 
  Users, 
  BarChart3, 
  Megaphone,
  Settings,
  Eye,
  Plus,
  Trash2,
  Edit2,
  Briefcase,
  User,
  Building,
  Award,
  Target,
  TrendingUp,
  Zap,
  Star,
  Heart,
  Crown,
  Headphones,
  UserCheck,
  MessageSquare,
  DollarSign,
  GitBranch,
  Package,
  Database,
  FileCheck,
  Globe,
  FileText,
  PenTool,
  BarChart,
  Workflow,
  Server,
  Lock,
  Cpu,
  Calculator,
  Scale,
  FileSpreadsheet,
  Handshake,
  Bot
} from "lucide-react";
import CustomRoleDialog from './CustomRoleDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLIENT_SUITE_ROLES, FRONT_OF_HOUSE_ROLES, BACK_OF_HOUSE_ROLES } from './ClientRoles';
import {
  CORPORATION_FRONT_OF_HOUSE,
  CORPORATION_BACK_OF_HOUSE,
  CLIENT_FRONT_OF_HOUSE,
  CLIENT_BACK_OF_HOUSE,
  PARTNER_ROLES,
  B2B_ICON_MAP
} from './B2BRoles';

const PRODUCT_TEAM_ROLES = [
  { id: "founder", name: "Founder / CEO", icon: Rocket, color: "violet", defaultInfluence: 10 },
  { id: "backend_dev", name: "Backend Developer", icon: Code2, color: "blue", defaultInfluence: 6 },
  { id: "frontend_dev", name: "Frontend Developer", icon: Palette, color: "cyan", defaultInfluence: 5 },
  { id: "security", name: "Security Engineer", icon: Shield, color: "rose", defaultInfluence: 7 },
  { id: "qa", name: "QA Specialist", icon: TestTube, color: "amber", defaultInfluence: 5 },
  { id: "eng_manager", name: "Engineering Manager", icon: Settings, color: "slate", defaultInfluence: 8 },
  { id: "ux_designer", name: "UX Designer", icon: Eye, color: "pink", defaultInfluence: 6 },
  { id: "product_manager", name: "Product Manager", icon: BarChart3, color: "emerald", defaultInfluence: 8 },
  { id: "devrel", name: "Developer Relations", icon: Megaphone, color: "orange", defaultInfluence: 4 },
  { id: "analytics", name: "Analytics Lead", icon: Users, color: "indigo", defaultInfluence: 5 },
];

const INT_FRONT_OF_HOUSE_ROLES = [
  { id: "int_web_services", name: "Web Services Director", icon: Globe, color: "blue", defaultInfluence: 7 },
  { id: "int_branding", name: "Branding & Identity Lead", icon: PenTool, color: "purple", defaultInfluence: 7 },
  { id: "int_marketing", name: "Marketing Services Manager", icon: Megaphone, color: "orange", defaultInfluence: 7 },
  { id: "int_content", name: "Content Creation Strategist", icon: FileText, color: "cyan", defaultInfluence: 6 },
  { id: "int_operations", name: "Operations Manager", icon: Workflow, color: "emerald", defaultInfluence: 8 },
  { id: "int_client_success", name: "Client Success Manager", icon: Handshake, color: "pink", defaultInfluence: 7 },
];

const INT_BACK_OF_HOUSE_ROLES = [
  { id: "int_technology", name: "Technology Director", icon: Cpu, color: "blue", defaultInfluence: 8 },
  { id: "int_infosec", name: "Information Security Lead", icon: Lock, color: "rose", defaultInfluence: 9 },
  { id: "int_it_support", name: "IT Support Specialist", icon: Server, color: "slate", defaultInfluence: 5 },
  { id: "int_network_admin", name: "Network Administrator", icon: GitBranch, color: "indigo", defaultInfluence: 6 },
  { id: "int_data_analyst", name: "Data Analytics Specialist", icon: BarChart, color: "violet", defaultInfluence: 6 },
  { id: "int_devops", name: "DevOps Engineer", icon: Settings, color: "teal", defaultInfluence: 7 },
];

const INT_CORPORATE_ROLES = [
  { id: "int_ceo", name: "Chief Executive Officer", icon: Crown, color: "violet", defaultInfluence: 10 },
  { id: "int_cfo", name: "Chief Financial Officer", icon: DollarSign, color: "emerald", defaultInfluence: 9 },
  { id: "int_cto", name: "Chief Technology Officer", icon: Cpu, color: "blue", defaultInfluence: 9 },
  { id: "int_ciso", name: "Chief Information Security Officer", icon: Shield, color: "rose", defaultInfluence: 9 },
  { id: "int_hr_director", name: "HR Director", icon: Users, color: "pink", defaultInfluence: 7 },
  { id: "int_finance_controller", name: "Finance Controller", icon: Calculator, color: "amber", defaultInfluence: 7 },
  { id: "int_legal_counsel", name: "Legal Counsel", icon: Scale, color: "slate", defaultInfluence: 8 },
  { id: "int_compliance", name: "Compliance Officer", icon: FileCheck, color: "indigo", defaultInfluence: 7 },
  { id: "int_accounting", name: "Accounting Manager", icon: FileSpreadsheet, color: "lime", defaultInfluence: 6 },
  { id: "int_procurement", name: "Procurement Manager", icon: Package, color: "orange", defaultInfluence: 6 },
];

const INT_AIAAS_ROLES = [
  { id: "int_ai_product", name: "AI Product Manager", icon: Bot, color: "purple", defaultInfluence: 8 },
  { id: "int_ml_engineer", name: "ML Engineer", icon: Cpu, color: "violet", defaultInfluence: 7 },
  { id: "int_ai_architect", name: "AI Solutions Architect", icon: Zap, color: "blue", defaultInfluence: 8 },
  { id: "int_data_scientist", name: "Data Scientist", icon: Database, color: "cyan", defaultInfluence: 7 },
  { id: "int_ai_ethics", name: "AI Ethics & Compliance Lead", icon: Shield, color: "rose", defaultInfluence: 7 },
  { id: "int_prompt_engineer", name: "Prompt Engineer", icon: MessageSquare, color: "amber", defaultInfluence: 6 },
];

const colorClasses = {
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  lime: "bg-lime-100 text-lime-700 border-lime-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

const ICON_MAP = {
  Rocket, Code2, Shield, Palette, TestTube, Users, BarChart3, 
  Megaphone, Settings, Eye, Briefcase, User, Building, Award, 
  Target, TrendingUp, Zap, Star, Heart, Crown, Headphones,
  UserCheck, MessageSquare, DollarSign, GitBranch, Package,
  Database, FileCheck, Globe, FileText, PenTool, BarChart, 
  Workflow, Server, Lock, Cpu, Calculator, Scale, FileSpreadsheet,
  Handshake, Bot,
  ...B2B_ICON_MAP
};

const ROLES = [
  ...PRODUCT_TEAM_ROLES, 
  ...CLIENT_SUITE_ROLES,
  ...CORPORATION_FRONT_OF_HOUSE.map(r => ({ 
    id: r.id, 
    name: r.name, 
    icon: ICON_MAP[r.icon] || User, 
    color: r.color, 
    defaultInfluence: r.default_influence 
  })),
  ...CORPORATION_BACK_OF_HOUSE.map(r => ({ 
    id: r.id, 
    name: r.name, 
    icon: ICON_MAP[r.icon] || User, 
    color: r.color, 
    defaultInfluence: r.default_influence 
  })),
  ...CLIENT_FRONT_OF_HOUSE.map(r => ({ 
    id: r.id, 
    name: r.name, 
    icon: ICON_MAP[r.icon] || User, 
    color: r.color, 
    defaultInfluence: r.default_influence 
  })),
  ...CLIENT_BACK_OF_HOUSE.map(r => ({ 
    id: r.id, 
    name: r.name, 
    icon: ICON_MAP[r.icon] || User, 
    color: r.color, 
    defaultInfluence: r.default_influence 
  })),
  ...PARTNER_ROLES.map(r => ({ 
    id: r.id, 
    name: r.name, 
    icon: ICON_MAP[r.icon] || User, 
    color: r.color, 
    defaultInfluence: r.default_influence 
  }))
];

export default function RoleSelector({ selectedRoles, onRolesChange }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const { data: customRoles = [] } = useQuery({
    queryKey: ['customRoles'],
    queryFn: () => base44.entities.CustomRole.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomRole.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRoles'] });
      toast.success('Custom role created');
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomRole.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRoles'] });
      toast.success('Custom role updated');
      setDialogOpen(false);
      setEditingRole(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomRole.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRoles'] });
      toast.success('Custom role deleted');
    },
  });

  const allRoles = [
    ...ROLES,
    ...customRoles.map(cr => ({
      id: `custom_${cr.id}`,
      name: cr.name,
      icon: ICON_MAP[cr.icon_name] || User,
      color: cr.color,
      defaultInfluence: cr.default_influence,
      isCustom: true,
      customData: cr
    }))
  ];

  const handleToggleRole = (roleId) => {
    const exists = selectedRoles.find(r => r.role === roleId);
    if (exists) {
      onRolesChange(selectedRoles.filter(r => r.role !== roleId));
    } else {
      const roleData = allRoles.find(r => r.id === roleId);
      onRolesChange([...selectedRoles, { role: roleId, influence: roleData.defaultInfluence }]);
    }
  };

  const handleInfluenceChange = (roleId, value) => {
    onRolesChange(selectedRoles.map(r => 
      r.role === roleId ? { ...r, influence: value[0] } : r
    ));
  };

  const isSelected = (roleId) => selectedRoles.some(r => r.role === roleId);
  const getInfluence = (roleId) => selectedRoles.find(r => r.role === roleId)?.influence || 5;

  const handleSaveRole = (roleData) => {
    if (roleData.id) {
      updateMutation.mutate({ id: roleData.id, data: roleData });
    } else {
      createMutation.mutate(roleData);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role.customData);
    setDialogOpen(true);
  };

  const handleDeleteRole = (roleId) => {
    const customId = roleId.replace('custom_', '');
    deleteMutation.mutate(customId);
    // Remove from selected roles if selected
    onRolesChange(selectedRoles.filter(r => r.role !== roleId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700 tracking-tight">Team Roles</h3>
        <Badge variant="outline" className="text-xs font-normal">
          {selectedRoles.length} selected
        </Badge>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setEditingRole(null);
          setDialogOpen(true);
        }}
        className="w-full gap-2 mb-3"
      >
        <Plus className="w-4 h-4" />
        Create Custom Role
      </Button>

      <Tabs defaultValue="product" className="w-full">
        <TabsList className="w-full grid grid-cols-6 text-[10px]">
          <TabsTrigger value="product" className="text-[10px]">Product</TabsTrigger>
          <TabsTrigger value="client" className="text-[10px]">Client</TabsTrigger>
          <TabsTrigger value="intinc" className="text-[10px]">INT Inc</TabsTrigger>
          <TabsTrigger value="b2b" className="text-[10px]">B2B</TabsTrigger>
          <TabsTrigger value="aiaas" className="text-[10px]">AIaaS</TabsTrigger>
          <TabsTrigger value="custom" className="text-[10px]">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="product" className="mt-3">
          <div className="grid gap-2">
            {PRODUCT_TEAM_ROLES.map((role) => {
              const Icon = role.icon;
              const selected = isSelected(role.id);
              
              return (
                <RoleCard 
                  key={role.id}
                  role={role}
                  selected={selected}
                  onToggle={handleToggleRole}
                  influence={getInfluence(role.id)}
                  onInfluenceChange={handleInfluenceChange}
                  colorClasses={colorClasses}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="client" className="mt-3">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Front of House (Client-Facing)</p>
              <div className="grid gap-2">
                {FRONT_OF_HOUSE_ROLES.map((role) => (
                  <RoleCard 
                    key={role.id}
                    role={role}
                    selected={isSelected(role.id)}
                    onToggle={handleToggleRole}
                    influence={getInfluence(role.id)}
                    onInfluenceChange={handleInfluenceChange}
                    colorClasses={colorClasses}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Back of House (Internal Ops)</p>
              <div className="grid gap-2">
                {BACK_OF_HOUSE_ROLES.map((role) => (
                  <RoleCard 
                    key={role.id}
                    role={role}
                    selected={isSelected(role.id)}
                    onToggle={handleToggleRole}
                    influence={getInfluence(role.id)}
                    onInfluenceChange={handleInfluenceChange}
                    colorClasses={colorClasses}
                  />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="intinc" className="mt-3">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Front of House</p>
              <div className="grid gap-2">
                {INT_FRONT_OF_HOUSE_ROLES.map((role) => (
                  <RoleCard 
                    key={role.id}
                    role={role}
                    selected={isSelected(role.id)}
                    onToggle={handleToggleRole}
                    influence={getInfluence(role.id)}
                    onInfluenceChange={handleInfluenceChange}
                    colorClasses={colorClasses}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Back of House</p>
              <div className="grid gap-2">
                {INT_BACK_OF_HOUSE_ROLES.map((role) => (
                  <RoleCard 
                    key={role.id}
                    role={role}
                    selected={isSelected(role.id)}
                    onToggle={handleToggleRole}
                    influence={getInfluence(role.id)}
                    onInfluenceChange={handleInfluenceChange}
                    colorClasses={colorClasses}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Corporate</p>
              <div className="grid gap-2">
                {INT_CORPORATE_ROLES.map((role) => (
                  <RoleCard 
                    key={role.id}
                    role={role}
                    selected={isSelected(role.id)}
                    onToggle={handleToggleRole}
                    influence={getInfluence(role.id)}
                    onInfluenceChange={handleInfluenceChange}
                    colorClasses={colorClasses}
                  />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="b2b" className="mt-3">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Corporation - Customer Facing</p>
              <div className="grid gap-2">
                {CORPORATION_FRONT_OF_HOUSE.map((r) => {
                  const role = { 
                    id: r.id, 
                    name: r.name, 
                    icon: ICON_MAP[r.icon] || User, 
                    color: r.color, 
                    defaultInfluence: r.default_influence 
                  };
                  return (
                    <RoleCard 
                      key={role.id}
                      role={role}
                      selected={isSelected(role.id)}
                      onToggle={handleToggleRole}
                      influence={getInfluence(role.id)}
                      onInfluenceChange={handleInfluenceChange}
                      colorClasses={colorClasses}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Corporation - Internal</p>
              <div className="grid gap-2">
                {CORPORATION_BACK_OF_HOUSE.map((r) => {
                  const role = { 
                    id: r.id, 
                    name: r.name, 
                    icon: ICON_MAP[r.icon] || User, 
                    color: r.color, 
                    defaultInfluence: r.default_influence 
                  };
                  return (
                    <RoleCard 
                      key={role.id}
                      role={role}
                      selected={isSelected(role.id)}
                      onToggle={handleToggleRole}
                      influence={getInfluence(role.id)}
                      onInfluenceChange={handleInfluenceChange}
                      colorClasses={colorClasses}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Client Organizations</p>
              <div className="grid gap-2">
                {[...CLIENT_FRONT_OF_HOUSE, ...CLIENT_BACK_OF_HOUSE].map((r) => {
                  const role = { 
                    id: r.id, 
                    name: r.name, 
                    icon: ICON_MAP[r.icon] || User, 
                    color: r.color, 
                    defaultInfluence: r.default_influence 
                  };
                  return (
                    <RoleCard 
                      key={role.id}
                      role={role}
                      selected={isSelected(role.id)}
                      onToggle={handleToggleRole}
                      influence={getInfluence(role.id)}
                      onInfluenceChange={handleInfluenceChange}
                      colorClasses={colorClasses}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Partners & Integrators</p>
              <div className="grid gap-2">
                {PARTNER_ROLES.map((r) => {
                  const role = { 
                    id: r.id, 
                    name: r.name, 
                    icon: ICON_MAP[r.icon] || User, 
                    color: r.color, 
                    defaultInfluence: r.default_influence 
                  };
                  return (
                    <RoleCard 
                      key={role.id}
                      role={role}
                      selected={isSelected(role.id)}
                      onToggle={handleToggleRole}
                      influence={getInfluence(role.id)}
                      onInfluenceChange={handleInfluenceChange}
                      colorClasses={colorClasses}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="aiaas" className="mt-3">
          <div className="grid gap-2">
            {INT_AIAAS_ROLES.map((role) => (
              <RoleCard 
                key={role.id}
                role={role}
                selected={isSelected(role.id)}
                onToggle={handleToggleRole}
                influence={getInfluence(role.id)}
                onInfluenceChange={handleInfluenceChange}
                colorClasses={colorClasses}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-3">
          <div className="grid gap-2">
            {customRoles.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                No custom roles yet. Create one above!
              </div>
            ) : (
              customRoles.map(cr => {
                const role = {
                  id: `custom_${cr.id}`,
                  name: cr.name,
                  icon: ICON_MAP[cr.icon_name] || User,
                  color: cr.color,
                  defaultInfluence: cr.default_influence,
                  isCustom: true,
                  customData: cr
                };
                
                return (
                  <RoleCard 
                    key={role.id}
                    role={role}
                    selected={isSelected(role.id)}
                    onToggle={handleToggleRole}
                    influence={getInfluence(role.id)}
                    onInfluenceChange={handleInfluenceChange}
                    colorClasses={colorClasses}
                    onEdit={handleEditRole}
                    onDelete={handleDeleteRole}
                  />
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CustomRoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveRole}
        editRole={editingRole}
      />
    </div>
  );
}

function RoleCard({ role, selected, onToggle, influence, onInfluenceChange, colorClasses, onEdit, onDelete }) {
  const Icon = role.icon;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border transition-all duration-200
        ${selected 
          ? 'bg-white border-slate-200 shadow-sm' 
          : 'bg-slate-50/50 border-transparent hover:border-slate-200'
        }
      `}
    >
      <div className="p-3">
        <div className="flex items-center gap-3">
          <Checkbox 
            checked={selected}
            onCheckedChange={() => onToggle(role.id)}
            className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
          />
          <div className={`p-1.5 rounded-lg ${colorClasses[role.color]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className={`text-sm ${selected ? 'font-medium text-slate-800' : 'text-slate-600'} flex-1`}>
            {role.name}
          </span>
          {role.isCustom && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(role);
                }}
              >
                <Edit2 className="w-3 h-3 text-slate-400 hover:text-slate-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(role.id);
                }}
              >
                <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-600" />
              </Button>
            </div>
          )}
        </div>
        
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 pl-8">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-16">Influence</span>
                  <Slider
                    value={[influence]}
                    onValueChange={(val) => onInfluenceChange(role.id, val)}
                    max={10}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs font-semibold text-violet-600 w-6 text-right">
                    {influence}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export { PRODUCT_TEAM_ROLES as ROLES };