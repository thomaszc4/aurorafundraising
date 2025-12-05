import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, FileText, Link as LinkIcon, Image, Trash2, Edit, 
  Eye, EyeOff, ExternalLink, FolderOpen, ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  url: string | null;
  content: string | null;
  is_visible_to_students: boolean;
  created_at: string;
}

interface ResourcesManagerProps {
  campaignId: string;
  onClose?: () => void;
}

export function ResourcesManager({ campaignId, onClose }: ResourcesManagerProps) {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'link',
    url: '',
    content: '',
    is_visible_to_students: false,
  });

  useEffect(() => {
    fetchResources();
  }, [campaignId]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('campaign_id', campaignId)
        .is('student_only_for', null)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const resourceData = {
        campaign_id: campaignId,
        title: formData.title,
        description: formData.description || null,
        resource_type: formData.resource_type,
        url: formData.url || null,
        content: formData.content || null,
        is_visible_to_students: formData.is_visible_to_students,
        created_by: user?.id,
      };

      if (editingResource) {
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editingResource.id);
        if (error) throw error;
        toast.success('Resource updated');
      } else {
        const { error } = await supabase
          .from('resources')
          .insert(resourceData);
        if (error) throw error;
        toast.success('Resource added');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error('Failed to save resource');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Resource deleted');
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      resource_type: resource.resource_type,
      url: resource.url || '',
      content: resource.content || '',
      is_visible_to_students: resource.is_visible_to_students,
    });
    setIsDialogOpen(true);
  };

  const toggleVisibility = async (resource: Resource) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ is_visible_to_students: !resource.is_visible_to_students })
        .eq('id', resource.id);
      if (error) throw error;
      toast.success(resource.is_visible_to_students ? 'Hidden from students' : 'Visible to students');
      fetchResources();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const resetForm = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      resource_type: 'link',
      url: '',
      content: '',
      is_visible_to_students: false,
    });
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'link': return <LinkIcon className="h-4 w-4" />;
      case 'article': return <FileText className="h-4 w-4" />;
      case 'post': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading resources...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="h-6 w-6" />
              Resources
            </h2>
            <p className="text-muted-foreground">Manage fundraiser resources and materials</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Resource title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.resource_type}
                  onValueChange={(value) => setFormData({ ...formData, resource_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="post">Social Media Post</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this resource"
                  rows={2}
                />
              </div>

              {(formData.resource_type === 'link' || formData.resource_type === 'file') && (
                <div className="space-y-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
              )}

              {(formData.resource_type === 'article' || formData.resource_type === 'post') && (
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter the content..."
                    rows={4}
                  />
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label htmlFor="visibility">Visible to Students</Label>
                  <p className="text-xs text-muted-foreground">Allow students to see this resource</p>
                </div>
                <Switch
                  id="visibility"
                  checked={formData.is_visible_to_students}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_visible_to_students: checked })}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingResource ? 'Update Resource' : 'Add Resource'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resources Table */}
      <Card>
        <CardContent className="p-0">
          {resources.length === 0 ? (
            <div className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No resources yet</p>
              <p className="text-sm text-muted-foreground">
                Add links, articles, and posts for your fundraising team
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {getResourceIcon(resource.resource_type)}
                        </div>
                        <div>
                          <p className="font-medium">{resource.title}</p>
                          {resource.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {resource.resource_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(resource)}
                        className="gap-1"
                      >
                        {resource.is_visible_to_students ? (
                          <>
                            <Eye className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Students</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Admin only</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {resource.url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(resource)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}