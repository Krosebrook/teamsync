import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  Eye
} from "lucide-react";

const ROLES = [
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
};

export default function RoleSelector({ selectedRoles, onRolesChange }) {
  const handleToggleRole = (roleId) => {
    const exists = selectedRoles.find(r => r.role === roleId);
    if (exists) {
      onRolesChange(selectedRoles.filter(r => r.role !== roleId));
    } else {
      const roleData = ROLES.find(r => r.id === roleId);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700 tracking-tight">Team Roles</h3>
        <Badge variant="outline" className="text-xs font-normal">
          {selectedRoles.length} selected
        </Badge>
      </div>
      
      <div className="grid gap-2">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const selected = isSelected(role.id);
          
          return (
            <motion.div
              key={role.id}
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
                    onCheckedChange={() => handleToggleRole(role.id)}
                    className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                  />
                  <div className={`p-1.5 rounded-lg ${colorClasses[role.color]}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-sm ${selected ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                    {role.name}
                  </span>
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
                            value={[getInfluence(role.id)]}
                            onValueChange={(val) => handleInfluenceChange(role.id, val)}
                            max={10}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs font-semibold text-violet-600 w-6 text-right">
                            {getInfluence(role.id)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export { ROLES };