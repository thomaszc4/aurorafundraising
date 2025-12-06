import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Upload, Rocket, TrendingUp, Clock, Edit, Eye,
  Image as ImageIcon
} from 'lucide-react';

interface PostTemplate {
  id: string;
  category: 'launch' | 'progress' | 'urgency';
  platform: string;
  post_template: string;
  comment_template: string | null;
  base_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { value: 'launch', label: 'Launch Announcement', icon: Rocket, color: 'bg-emerald-500' },
  { value: 'progress', label: 'Progress Updates', icon: TrendingUp, color: 'bg-blue-500' },
  { value: 'urgency', label: 'Urgency Push', icon: Clock, color: 'bg-orange-500' },
];

const PLACEHOLDERS = [
  { key: '{{organization_name}}', description: 'Name of the organization' },
  { key: '{{fundraiser_goal}}', description: 'Fundraising goal amount' },
  { key: '{{participant_name}}', description: 'Individual participant name' },
  { key: '{{progress_percent}}', description: 'Current progress percentage' },
  { key: '{{days_remaining}}', description: 'Days left in fundraiser' },
];

export function PostTemplateManager() {
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PostTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [category, setCategory] = useState<'launch' | 'progress' | 'urgency'>('launch');
  const [platform, setPlatform] = useState('all');
  const [postTemplate, setPostTemplate] = useState('');
  const [commentTemplate, setCommentTemplate] = useState('');
  const [baseImageUrl, setBaseImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('post_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } else {
      setTemplates(data as PostTemplate[]);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `template-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-templates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('post-templates')
        .getPublicUrl(fileName);

      setBaseImageUrl(urlData.publicUrl);
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setCategory('launch');
    setPlatform('all');
    setPostTemplate('');
    setCommentTemplate('');
    setBaseImageUrl('');
    setIsActive(true);
    setEditingTemplate(null);
  };

  const openEditDialog = (template: PostTemplate) => {
    setEditingTemplate(template);
    setCategory(template.category);
    setPlatform(template.platform);
    setPostTemplate(template.post_template);
    setCommentTemplate(template.comment_template || '');
    setBaseImageUrl(template.base_image_url || '');
    setIsActive(template.is_active);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!postTemplate) {
      toast.error('Post template is required');
      return;
    }

    try {
      const data = {
        category,
        platform,
        post_template: postTemplate,
        comment_template: commentTemplate || null,
        base_image_url: baseImageUrl || null,
        is_active: isActive,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('post_templates')
          .update(data)
          .eq('id', editingTemplate.id);
        if (error) throw error;
        toast.success('Template updated');
      } else {
        const { error } = await supabase
          .from('post_templates')
          .insert(data);
        if (error) throw error;
        toast.success('Template created');
      }

      setDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    const { error } = await supabase.from('post_templates').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Template deleted');
      fetchTemplates();
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('post_templates')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchTemplates();
    }
  };

  const getCategoryBadge = (cat: string) => {
    const config = CATEGORY_OPTIONS.find(c => c.value === cat);
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Post Template Library</CardTitle>
            <CardDescription>
              Create social media post templates for campaign managers to use
            </CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </CardHeader>
        <CardContent>
          {/* Placeholder reference */}
          <div className="mb-6 p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Available Placeholders:</p>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map(p => (
                <Badge key={p.key} variant="outline" className="font-mono text-xs">
                  {p.key}
                </Badge>
              ))}
            </div>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates yet. Create your first one!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Post Preview</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell>{getCategoryBadge(template.category)}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate">{template.post_template}</p>
                    </TableCell>
                    <TableCell>
                      {template.base_image_url ? (
                        <img 
                          src={template.base_image_url} 
                          alt="" 
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">No image</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => toggleActive(template.id, template.is_active)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              Create a social post template with placeholders for personalization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v: 'launch' | 'progress' | 'urgency') => setCategory(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Post Template *</Label>
              <Textarea
                value={postTemplate}
                onChange={(e) => setPostTemplate(e.target.value)}
                placeholder="🎉 We're launching our fundraiser for {{organization_name}}! Help us reach our goal of ${{fundraiser_goal}}..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use placeholders like {'{{organization_name}}'} for auto-personalization
              </p>
            </div>

            <div className="space-y-2">
              <Label>Suggested Comment (Optional)</Label>
              <Textarea
                value={commentTemplate}
                onChange={(e) => setCommentTemplate(e.target.value)}
                placeholder="Support {{organization_name}} today! Every purchase helps us reach our goal. 🙏"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Base Image</Label>
              <div className="flex items-center gap-4">
                {baseImageUrl ? (
                  <img src={baseImageUrl} alt="Template" className="w-24 h-24 rounded-lg object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active (visible to campaign managers)</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingTemplate ? 'Update' : 'Create'} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
