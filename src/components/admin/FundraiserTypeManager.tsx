import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FUNDRAISER_CATEGORIES, FundraiserType } from '@/data/fundraiserTypes';
import { Settings, Save, Loader2 } from 'lucide-react';

export function FundraiserTypeManager() {
  const [enabledTypes, setEnabledTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEnabledTypes();
  }, []);

  const fetchEnabledTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'enabled_fundraiser_types')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.value) {
        setEnabledTypes(data.value as string[]);
      } else {
        // Default all types enabled
        const allTypes = FUNDRAISER_CATEGORIES.flatMap(cat => cat.types.map(t => t.id));
        setEnabledTypes(allTypes);
      }
    } catch (error) {
      console.error('Error fetching enabled types:', error);
      toast.error('Failed to load fundraiser settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleType = (typeId: string) => {
    setEnabledTypes(prev => 
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleToggleCategory = (category: typeof FUNDRAISER_CATEGORIES[0]) => {
    const categoryTypeIds = category.types.map(t => t.id);
    const allEnabled = categoryTypeIds.every(id => enabledTypes.includes(id));
    
    if (allEnabled) {
      setEnabledTypes(prev => prev.filter(id => !categoryTypeIds.includes(id)));
    } else {
      setEnabledTypes(prev => [...new Set([...prev, ...categoryTypeIds])]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'enabled_fundraiser_types',
          value: enabledTypes,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Fundraiser types updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getDifficultyBadge = (difficulty: FundraiserType['difficulty']) => {
    const colors = {
      easy: 'bg-green-500/20 text-green-600',
      medium: 'bg-yellow-500/20 text-yellow-600',
      hard: 'bg-red-500/20 text-red-600',
    };
    return colors[difficulty];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Available Fundraiser Types</CardTitle>
              <CardDescription>
                Select which fundraiser types organizations can choose from
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {FUNDRAISER_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const categoryTypeIds = category.types.map(t => t.id);
          const enabledCount = categoryTypeIds.filter(id => enabledTypes.includes(id)).length;
          const allEnabled = enabledCount === categoryTypeIds.length;
          const someEnabled = enabledCount > 0 && enabledCount < categoryTypeIds.length;

          return (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b">
                <Checkbox
                  checked={allEnabled}
                  ref={(el) => {
                    if (el && someEnabled) {
                      (el as any).indeterminate = true;
                    }
                  }}
                  onCheckedChange={() => handleToggleCategory(category)}
                />
                <div className={`p-1.5 rounded bg-gradient-to-br ${category.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{category.label}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <Badge variant="secondary">
                  {enabledCount}/{categoryTypeIds.length} enabled
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-8">
                {category.types.map((type) => {
                  const TypeIcon = type.icon;
                  const isEnabled = enabledTypes.includes(type.id);
                  
                  return (
                    <div
                      key={type.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted'
                      }`}
                    >
                      <Checkbox
                        checked={isEnabled}
                        onCheckedChange={() => handleToggleType(type.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm truncate">{type.label}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getDifficultyBadge(type.difficulty)}>
                            {type.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ~${type.avgRaised}/person
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>{enabledTypes.length}</strong> fundraiser types enabled. 
            Organizations will only see enabled types when creating new campaigns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
