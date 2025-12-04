import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, Star, Clock, DollarSign, CheckCircle2, X, 
  TrendingUp, Users, Sparkles, Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  FUNDRAISER_CATEGORIES, 
  FundraiserType 
} from '@/data/fundraiserTypes';

interface FundraiserComparisonProps {
  onSelect?: (type: FundraiserType) => void;
  onClose?: () => void;
}

export function FundraiserComparison({ onSelect, onClose }: FundraiserComparisonProps) {
  const [selectedTypes, setSelectedTypes] = useState<FundraiserType[]>([]);
  
  const allTypes = FUNDRAISER_CATEGORIES.flatMap(cat => cat.types);

  const toggleType = (type: FundraiserType) => {
    setSelectedTypes(prev => {
      if (prev.find(t => t.id === type.id)) {
        return prev.filter(t => t.id !== type.id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), type];
      }
      return [...prev, type];
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-500';
      case 'medium': return 'bg-amber-500';
      case 'hard': return 'bg-rose-500';
      default: return 'bg-muted';
    }
  };

  const getDifficultyScore = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              Fundraiser Comparison Tool
            </h2>
            <p className="text-muted-foreground">Select up to 4 fundraiser types to compare</p>
          </div>
        </div>
        {selectedTypes.length > 0 && (
          <Button variant="outline" onClick={() => setSelectedTypes([])}>
            Clear Selection
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Type Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Select Fundraiser Types</CardTitle>
            <CardDescription>Click to add to comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {FUNDRAISER_CATEGORIES.map(category => (
                  <div key={category.id}>
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const Icon = category.icon;
                        return (
                          <div className={cn(
                            "h-6 w-6 rounded flex items-center justify-center text-white text-xs bg-gradient-to-br",
                            category.color
                          )}>
                            <Icon className="h-3 w-3" />
                          </div>
                        );
                      })()}
                      <span className="font-medium text-sm">{category.label}</span>
                    </div>
                    <div className="space-y-1 ml-8">
                      {category.types.map(type => {
                        const isSelected = selectedTypes.some(t => t.id === type.id);
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => toggleType(type)}
                            className={cn(
                              "w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors",
                              isSelected 
                                ? "bg-primary/10 border border-primary" 
                                : "hover:bg-muted/50 border border-transparent"
                            )}
                          >
                            <Checkbox checked={isSelected} className="pointer-events-none" />
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className={cn(isSelected && "font-medium")}>{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Side-by-Side Comparison</CardTitle>
            <CardDescription>
              {selectedTypes.length === 0 
                ? "Select fundraiser types from the left panel"
                : `Comparing ${selectedTypes.length} fundraiser type${selectedTypes.length > 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Scale className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Select fundraiser types to see comparison</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Click on types from the list to add them</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-muted-foreground w-32"></th>
                      {selectedTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <th key={type.id} className="p-3 min-w-[180px]">
                            <div className="flex flex-col items-center gap-2">
                              <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br",
                                type.color
                              )}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <span className="font-semibold text-foreground">{type.label}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleType(type)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Avg Raised */}
                    <tr className="border-b">
                      <td className="p-3 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Avg. Raised
                        </div>
                      </td>
                      {selectedTypes.map(type => {
                        const maxRaised = Math.max(...selectedTypes.map(t => t.avgRaised));
                        const isMax = type.avgRaised === maxRaised && selectedTypes.length > 1;
                        return (
                          <td key={type.id} className="p-3 text-center">
                            <span className={cn(
                              "text-xl font-bold",
                              isMax ? "text-emerald-500" : "text-foreground"
                            )}>
                              ${type.avgRaised}
                            </span>
                            <span className="text-sm text-muted-foreground">/person</span>
                            {isMax && <Star className="h-4 w-4 text-emerald-500 inline ml-1" />}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Difficulty */}
                    <tr className="border-b">
                      <td className="p-3 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Difficulty
                        </div>
                      </td>
                      {selectedTypes.map(type => {
                        const minDiff = Math.min(...selectedTypes.map(t => getDifficultyScore(t.difficulty)));
                        const isEasiest = getDifficultyScore(type.difficulty) === minDiff && selectedTypes.length > 1;
                        return (
                          <td key={type.id} className="p-3 text-center">
                            <Badge 
                              className={cn("text-white", getDifficultyColor(type.difficulty))}
                            >
                              {type.difficulty}
                            </Badge>
                            {isEasiest && <Star className="h-4 w-4 text-emerald-500 inline ml-1" />}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Time to Organize */}
                    <tr className="border-b">
                      <td className="p-3 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Time Needed
                        </div>
                      </td>
                      {selectedTypes.map(type => (
                        <td key={type.id} className="p-3 text-center font-medium">
                          {type.timeToOrganize}
                        </td>
                      ))}
                    </tr>

                    {/* Success Steps */}
                    <tr className="border-b">
                      <td className="p-3 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Planning Steps
                        </div>
                      </td>
                      {selectedTypes.map(type => (
                        <td key={type.id} className="p-3 text-center">
                          <span className="font-medium">{type.successGuide.length}</span>
                          <span className="text-muted-foreground text-sm"> steps</span>
                        </td>
                      ))}
                    </tr>

                    {/* Project Tasks */}
                    <tr className="border-b">
                      <td className="p-3 font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Total Tasks
                        </div>
                      </td>
                      {selectedTypes.map(type => {
                        const totalTasks = type.projectManagerSteps.reduce(
                          (sum, phase) => sum + phase.tasks.length, 0
                        );
                        return (
                          <td key={type.id} className="p-3 text-center">
                            <span className="font-medium">{totalTasks}</span>
                            <span className="text-muted-foreground text-sm"> tasks</span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Description */}
                    <tr>
                      <td className="p-3 font-medium text-muted-foreground align-top">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Description
                        </div>
                      </td>
                      {selectedTypes.map(type => (
                        <td key={type.id} className="p-3 text-sm text-muted-foreground">
                          {type.description}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      {selectedTypes.length > 0 && onSelect && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Ready to start? Select a fundraiser type to begin your campaign.
              </p>
              <div className="flex gap-2">
                {selectedTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      onClick={() => onSelect(type)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      Start {type.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FundraiserComparison;
