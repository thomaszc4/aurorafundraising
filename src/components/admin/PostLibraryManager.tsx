import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Rocket, TrendingUp, Clock, Check, Copy, Download, 
  Sparkles, Image as ImageIcon, AlertCircle 
} from 'lucide-react';

interface PostTemplate {
  id: string;
  category: 'launch' | 'progress' | 'urgency';
  platform: string;
  post_template: string;
  comment_template: string | null;
  base_image_url: string | null;
  is_active: boolean;
}

interface CampaignPost {
  id: string;
  campaign_id: string;
  post_template_id: string;
  customized_post: string | null;
  customized_comment: string | null;
  generated_image_url: string | null;
  is_participant_visible: boolean;
}

interface PostLibraryManagerProps {
  campaignId: string;
  organizationName: string;
  fundraiserGoal?: number;
  brandColors?: { primary: string; secondary: string; accent: string } | null;
  logoUrl?: string | null;
}

const CATEGORY_CONFIG = {
  launch: { icon: Rocket, label: 'Launch Announcement', color: 'bg-emerald-500' },
  progress: { icon: TrendingUp, label: 'Progress Updates', color: 'bg-blue-500' },
  urgency: { icon: Clock, label: 'Urgency Push', color: 'bg-orange-500' },
};

export function PostLibraryManager({
  campaignId,
  organizationName,
  fundraiserGoal,
  brandColors,
  logoUrl
}: PostLibraryManagerProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [campaignPosts, setCampaignPosts] = useState<CampaignPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    try {
      const [templatesRes, postsRes] = await Promise.all([
        supabase.from('post_templates').select('*').eq('is_active', true),
        supabase.from('campaign_posts').select('*').eq('campaign_id', campaignId)
      ]);

      if (templatesRes.data) {
        setTemplates(templatesRes.data as PostTemplate[]);
      }

      if (postsRes.data) {
        setCampaignPosts(postsRes.data as CampaignPost[]);
        setSelectedPosts(new Set(postsRes.data.map(p => p.post_template_id)));
      }
    } catch (error) {
      console.error('Error fetching post data:', error);
    } finally {
      setLoading(false);
    }
  };

  const customizeTemplate = (template: string) => {
    return template
      .replace(/\{\{organization_name\}\}/g, organizationName)
      .replace(/\{\{fundraiser_goal\}\}/g, fundraiserGoal?.toLocaleString() || '[goal]')
      .replace(/\{\{progress_percent\}\}/g, '50')
      .replace(/\{\{days_remaining\}\}/g, '7');
  };

  const togglePost = (templateId: string) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const saveSelection = async () => {
    if (selectedPosts.size < 3 || selectedPosts.size > 5) {
      toast.error('Please select between 3 and 5 posts for participants');
      return;
    }

    setSaving(true);
    try {
      // Delete existing posts
      await supabase.from('campaign_posts').delete().eq('campaign_id', campaignId);

      // Insert new selections
      const inserts = Array.from(selectedPosts).map(templateId => {
        const template = templates.find(t => t.id === templateId);
        return {
          campaign_id: campaignId,
          post_template_id: templateId,
          customized_post: template ? customizeTemplate(template.post_template) : null,
          customized_comment: template?.comment_template ? customizeTemplate(template.comment_template) : null,
          selected_by: user?.id,
          is_participant_visible: true
        };
      });

      const { error } = await supabase.from('campaign_posts').insert(inserts);
      if (error) throw error;

      toast.success('Post selection saved! Participants can now see these posts.');
      fetchData();
    } catch (error) {
      console.error('Error saving posts:', error);
      toast.error('Failed to save selection');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTemplatesByCategory = (category: 'launch' | 'progress' | 'urgency') => 
    templates.filter(t => t.category === category);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            Social Post Library
          </CardTitle>
          <CardDescription>
            Select 3-5 posts for your participants to share. Posts will be customized with your organization's details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Selection counter */}
          <div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full ${
                selectedPosts.size >= 3 && selectedPosts.size <= 5 
                  ? 'bg-secondary/20 text-secondary' 
                  : 'bg-destructive/20 text-destructive'
              }`}>
                {selectedPosts.size} / 5 selected
              </div>
              {selectedPosts.size < 3 && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Select at least 3 posts
                </span>
              )}
            </div>
            <Button 
              onClick={saveSelection} 
              disabled={saving || selectedPosts.size < 3 || selectedPosts.size > 5}
            >
              {saving ? 'Saving...' : 'Save & Publish to Participants'}
            </Button>
          </div>

          <Tabs defaultValue="launch">
            <TabsList className="mb-6">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const count = getTemplatesByCategory(key as 'launch' | 'progress' | 'urgency').length;
                return (
                  <TabsTrigger key={key} value={key} className="gap-2">
                    <Icon className="h-4 w-4" />
                    {config.label}
                    <Badge variant="secondary" className="ml-1">{count}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
              <TabsContent key={category} value={category} className="space-y-4">
                {getTemplatesByCategory(category as 'launch' | 'progress' | 'urgency').length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No {config.label.toLowerCase()} templates available yet.</p>
                    <p className="text-sm">Templates will be added by your administrator.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getTemplatesByCategory(category as 'launch' | 'progress' | 'urgency').map(template => {
                      const isSelected = selectedPosts.has(template.id);
                      const customizedPost = customizeTemplate(template.post_template);
                      const customizedComment = template.comment_template 
                        ? customizeTemplate(template.comment_template) 
                        : null;

                      return (
                        <div
                          key={template.id}
                          className={`relative rounded-xl border-2 p-4 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-secondary bg-secondary/5' 
                              : 'border-border hover:border-muted-foreground/50'
                          }`}
                          onClick={() => togglePost(template.id)}
                        >
                          {/* Selection checkbox */}
                          <div className="absolute top-4 right-4">
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => togglePost(template.id)}
                              className="h-5 w-5"
                            />
                          </div>

                          {/* Template image */}
                          {template.base_image_url && (
                            <div className="mb-4 rounded-lg overflow-hidden bg-muted aspect-video">
                              <img 
                                src={template.base_image_url} 
                                alt="Post template" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Post content */}
                          <div className="space-y-3">
                            <Badge className={config.color}>{config.label}</Badge>
                            <p className="text-sm text-foreground">{customizedPost}</p>
                            
                            {customizedComment && (
                              <div className="pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-1">Suggested comment:</p>
                                <p className="text-sm text-foreground/80 italic">"{customizedComment}"</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2" onClick={e => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => copyToClipboard(customizedPost)}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy
                              </Button>
                              {template.base_image_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={template.base_image_url} download target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-1" />
                                    Image
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Selected indicator */}
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full p-1">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
