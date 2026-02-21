import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Target,
  Filter,
  Star,
  Edit2,
  Trash2,
  Copy,
  Loader2,
  ChevronRight,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const COMPLEXITY_COLORS = {
  simple: "bg-green-100 text-green-700 border-green-200",
  moderate: "bg-yellow-100 text-yellow-700 border-yellow-200",
  complex: "bg-orange-100 text-orange-700 border-orange-200",
  advanced: "bg-red-100 text-red-700 border-red-200"
};

const INDUSTRY_LABELS = {
  fintech: "FinTech",
  healthcare: "Healthcare",
  b2b_saas: "B2B SaaS",
  e_commerce: "E-Commerce",
  enterprise: "Enterprise",
  consumer: "Consumer",
  devtools: "DevTools",
  ai_ml: "AI/ML",
  crypto: "Crypto",
  consulting: "Consulting",
  marketing: "Marketing",
  technology: "Technology",
  general: "General"
};

export default function ScenarioLibrary({ open, onClose, onApplyTemplate, currentSimulation }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedComplexity, setSelectedComplexity] = useState('all');
  const [selectedConflict, setSelectedConflict] = useState('all');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['scenarioLibrary'],
    queryFn: () => base44.entities.SimulationTemplate.list('-use_count'),
  });

  const { data: simulations = [] } = useQuery({
    queryKey: ['simulations'],
    queryFn: () => base44.entities.Simulation.list('-created_date', 10),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SimulationTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarioLibrary'] });
      toast.success('Scenario deleted');
    },
  });

  const updateUseMutation = useMutation({
    mutationFn: ({ id, useCount }) => base44.entities.SimulationTemplate.update(id, { use_count: useCount + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarioLibrary'] });
    },
  });

  const uniqueConflicts = useMemo(() => {
    const conflicts = new Set();
    templates.forEach(t => {
      if (t.conflict_types) {
        t.conflict_types.forEach(c => conflicts.add(c));
      }
    });
    return Array.from(conflicts);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesIndustry = selectedIndustry === 'all' || t.industry === selectedIndustry;
      const matchesComplexity = selectedComplexity === 'all' || t.complexity === selectedComplexity;
      const matchesConflict = selectedConflict === 'all' || t.conflict_types?.includes(selectedConflict);

      return matchesSearch && matchesIndustry && matchesComplexity && matchesConflict;
    });
  }, [templates, searchQuery, selectedIndustry, selectedComplexity, selectedConflict]);

  const generateAISuggestions = async () => {
    if (!currentSimulation?.scenario && simulations.length === 0) {
      toast.error('No simulation context available for suggestions');
      return;
    }

    setLoadingSuggestions(true);
    try {
      const context = currentSimulation?.scenario || simulations.slice(0, 3).map(s => s.scenario).join('\n');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this simulation context, suggest 5 related scenario ideas that would help the user explore related decision-making challenges:

CONTEXT:
${context}

Generate 5 creative, relevant scenario suggestions that:
- Build on similar themes or industries
- Explore different angles of similar problems
- Vary in complexity
- Would provide complementary insights

Return a JSON array of scenarios with this structure for each:
{
  "name": "Brief scenario name",
  "description": "Why this scenario is relevant (1 sentence)",
  "scenario": "Detailed scenario description (2-3 paragraphs)",
  "industry": "relevant industry",
  "complexity": "simple|moderate|complex|advanced",
  "conflict_types": ["type1", "type2"],
  "tags": ["tag1", "tag2"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  scenario: { type: "string" },
                  industry: { type: "string" },
                  complexity: { type: "string" },
                  conflict_types: { type: "array", items: { type: "string" } },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setAiSuggestions(result.suggestions || []);
      toast.success('AI suggestions generated');
    } catch (error) {
      toast.error('Failed to generate suggestions');
      console.error(error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleApplyTemplate = (template) => {
    updateUseMutation.mutate({ id: template.id, useCount: template.use_count || 0 });
    onApplyTemplate(template);
    onClose();
  };

  const handleSaveSuggestion = async (suggestion) => {
    try {
      await base44.entities.SimulationTemplate.create({
        name: suggestion.name,
        description: suggestion.description,
        scenario_template: suggestion.scenario,
        industry: suggestion.industry,
        complexity: suggestion.complexity,
        conflict_types: suggestion.conflict_types,
        tags: suggestion.tags,
        is_ai_generated: true
      });
      queryClient.invalidateQueries({ queryKey: ['scenarioLibrary'] });
      toast.success('Scenario saved to library');
    } catch (error) {
      toast.error('Failed to save scenario');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-600" />
            Scenario Library
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="browse" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="browse">
              <Search className="w-4 h-4 mr-2" />
              Browse Library
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4">
            {/* Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search scenarios, tags, descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Complexity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="complex">Complex</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedConflict} onValueChange={setSelectedConflict}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Conflict Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conflicts</SelectItem>
                    {uniqueConflicts.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{filteredTemplates.length} scenarios found</span>
                {(selectedIndustry !== 'all' || selectedComplexity !== 'all' || selectedConflict !== 'all' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedIndustry('all');
                      setSelectedComplexity('all');
                      setSelectedConflict('all');
                    }}
                    className="h-6 text-xs"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>

            {/* Scenarios Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredTemplates.map((template) => (
                <ScenarioCard
                  key={template.id}
                  template={template}
                  onApply={handleApplyTemplate}
                  onDelete={deleteMutation.mutate}
                />
              ))}

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Filter className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No scenarios found matching your filters</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Get AI-powered scenario suggestions based on your current work
              </p>
              <Button
                onClick={generateAISuggestions}
                disabled={loadingSuggestions}
                className="gap-2"
              >
                {loadingSuggestions ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Suggestions
                  </>
                )}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {aiSuggestions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Zap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm mb-2">No suggestions yet</p>
                  <p className="text-xs text-slate-400">Click "Generate Suggestions" to get AI-powered scenario ideas</p>
                </div>
              ) : (
                aiSuggestions.map((suggestion, idx) => (
                  <SuggestionCard
                    key={idx}
                    suggestion={suggestion}
                    onSave={handleSaveSuggestion}
                    onApply={() => {
                      onApplyTemplate({
                        scenario_template: suggestion.scenario,
                        name: suggestion.name,
                        industry: suggestion.industry
                      });
                      onClose();
                    }}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ScenarioCard({ template, onApply, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="hover:shadow-md transition-all border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm text-slate-900 truncate">
                  {template.name}
                </h3>
                {template.is_ai_generated && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {template.industry && (
                  <Badge variant="outline" className="text-xs">
                    {INDUSTRY_LABELS[template.industry] || template.industry}
                  </Badge>
                )}
                {template.complexity && (
                  <Badge className={`text-xs ${COMPLEXITY_COLORS[template.complexity]}`}>
                    {template.complexity}
                  </Badge>
                )}
                {template.estimated_duration && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="w-3 h-3" />
                    {template.estimated_duration}
                  </Badge>
                )}
              </div>

              {template.description && (
                <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                  {template.description}
                </p>
              )}

              {expanded && template.scenario_template && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-3 p-3 bg-slate-50 rounded-lg"
                >
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">
                    {template.scenario_template}
                  </p>
                </motion.div>
              )}

              <div className="flex items-center gap-2 mt-2">
                {template.tags?.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="text-xs text-slate-500">
                    #{tag}
                  </span>
                ))}
                {template.use_count > 0 && (
                  <span className="text-xs text-slate-400 ml-auto">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {template.use_count} uses
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={() => onApply(template)}
                className="gap-1 h-7 text-xs"
              >
                <Target className="w-3 h-3" />
                Use
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
                className="h-7 text-xs"
              >
                {expanded ? 'Less' : 'More'}
              </Button>
              {template.created_by && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(template.id)}
                  className="h-7 text-xs text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SuggestionCard({ suggestion, onSave, onApply }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-slate-900 mb-1">
                {suggestion.name}
              </h3>
              <p className="text-xs text-slate-600 mb-2 italic">
                {suggestion.description}
              </p>
              
              <div className="flex items-center gap-2 mb-2">
                {suggestion.industry && (
                  <Badge variant="outline" className="text-xs">
                    {INDUSTRY_LABELS[suggestion.industry] || suggestion.industry}
                  </Badge>
                )}
                {suggestion.complexity && (
                  <Badge className={`text-xs ${COMPLEXITY_COLORS[suggestion.complexity]}`}>
                    {suggestion.complexity}
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-700 line-clamp-3">
                {suggestion.scenario}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={onApply}
                className="gap-1 h-7 text-xs"
              >
                <ChevronRight className="w-3 h-3" />
                Use Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSave(suggestion)}
                className="gap-1 h-7 text-xs"
              >
                <Star className="w-3 h-3" />
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}