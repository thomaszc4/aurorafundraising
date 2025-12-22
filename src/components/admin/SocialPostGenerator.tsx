import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sparkles, Copy, Check, Facebook, Instagram, Twitter, Loader2, RefreshCw,
  Plus, Save, Trash2, Edit2, MessageSquare, Mail, Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SocialPost {
  post: string;
  suggestedComment: string;
  platform: string;
}

interface SavedTemplate {
  id: string;
  platform: string;
  title: string;
  content_template: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface SocialPostGeneratorProps {
  campaignId: string;
  organizationName: string;
  organizationType?: string;
  fundraiserType: string;
  goalAmount?: number;
  description?: string;
  brandColors?: { primary: string; secondary: string; accent: string } | null;
  onPostsGenerated?: (posts: SocialPost[]) => void;
}

const platformIcons: Record<string, React.ReactNode> = {
  Facebook: <Facebook className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  Instagram: <Instagram className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  Twitter: <Twitter className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  generic: <Share2 className="h-4 w-4" />,
  All: null,
};

const platformColors: Record<string, string> = {
  Facebook: "bg-blue-600",
  facebook: "bg-blue-600",
  Instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  Twitter: "bg-sky-500",
  twitter: "bg-sky-500",
  sms: "bg-green-500",
  email: "bg-gray-600",
  generic: "bg-primary",
  All: "bg-muted",
};

const platformOptions = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter/X" },
  { value: "sms", label: "Text Message" },
  { value: "email", label: "Email" },
  { value: "generic", label: "Any Platform" },
];

export function SocialPostGenerator({
  campaignId,
  organizationName,
  organizationType,
  fundraiserType,
  goalAmount,
  description,
  brandColors,
  onPostsGenerated,
}: SocialPostGeneratorProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Dialog state for saving a post as template
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savingPost, setSavingPost] = useState<{ post: string; platform: string } | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [savePlatform, setSavePlatform] = useState("generic");
  const [isSaving, setIsSaving] = useState(false);

  // Dialog state for editing a template
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SavedTemplate | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPlatform, setEditPlatform] = useState("generic");

  // Dialog state for creating new template
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPlatform, setNewPlatform] = useState("generic");

  useEffect(() => {
    if (campaignId) {
      fetchSavedTemplates();
    }
  }, [campaignId]);

  const fetchSavedTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("social_share_templates")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedTemplates(data || []);
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const generatePosts = async () => {
    if (!organizationName) {
      toast.error("Please enter an organization name first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-posts", {
        body: {
          organizationName,
          organizationType,
          fundraiserType,
          goalAmount,
          description,
          brandColors,
        },
      });

      if (error) throw error;

      if (data?.posts) {
        setPosts(data.posts);
        onPostsGenerated?.(data.posts);
        toast.success("Social media posts generated!");
      }
    } catch (error: any) {
      console.error("Error generating posts:", error);
      toast.error(error.message || "Failed to generate posts");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const openSaveDialog = (post: SocialPost) => {
    setSavingPost({ post: post.post, platform: post.platform.toLowerCase() });
    setSaveTitle(`${post.platform} Post`);
    setSavePlatform(post.platform.toLowerCase());
    setSaveDialogOpen(true);
  };

  const handleSaveAsTemplate = async () => {
    if (!savingPost || !saveTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsSaving(true);
    try {
      // Add {{link}} placeholder if not present
      let contentWithLink = savingPost.post;
      if (!contentWithLink.includes("{{link}}")) {
        contentWithLink += "\n\n{{link}}";
      }

      const { error } = await supabase
        .from("social_share_templates")
        .insert({
          campaign_id: campaignId,
          platform: savePlatform,
          title: saveTitle.trim(),
          content_template: contentWithLink,
          is_active: true,
        });

      if (error) throw error;

      toast.success("Template saved! Participants can now use this post.");
      setSaveDialogOpen(false);
      setSavingPost(null);
      setSaveTitle("");
      fetchSavedTemplates();
    } catch (err: any) {
      console.error("Error saving template:", err);
      toast.error(err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (template: SavedTemplate) => {
    setEditingTemplate(template);
    setEditTitle(template.title);
    setEditContent(template.content_template);
    setEditPlatform(template.platform);
    setEditDialogOpen(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !editTitle.trim() || !editContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("social_share_templates")
        .update({
          title: editTitle.trim(),
          content_template: editContent.trim(),
          platform: editPlatform,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTemplate.id);

      if (error) throw error;

      toast.success("Template updated!");
      setEditDialogOpen(false);
      setEditingTemplate(null);
      fetchSavedTemplates();
    } catch (err: any) {
      console.error("Error updating template:", err);
      toast.error(err.message || "Failed to update template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("social_share_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast.success("Template deleted");
      setSavedTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err: any) {
      console.error("Error deleting template:", err);
      toast.error(err.message || "Failed to delete template");
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("social_share_templates")
        .insert({
          campaign_id: campaignId,
          platform: newPlatform,
          title: newTitle.trim(),
          content_template: newContent.trim(),
          is_active: true,
        });

      if (error) throw error;

      toast.success("Template created!");
      setCreateDialogOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewPlatform("generic");
      fetchSavedTemplates();
    } catch (err: any) {
      console.error("Error creating template:", err);
      toast.error(err.message || "Failed to create template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate (AI)
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Save className="h-4 w-4 mr-2" />
            Saved Templates ({savedTemplates.length})
          </TabsTrigger>
        </TabsList>

        {/* AI Generation Tab */}
        <TabsContent value="generate" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">AI Social Media Posts</h3>
              <p className="text-sm text-muted-foreground">
                Generate posts for your fundraiser, then save them as templates for participants.
              </p>
            </div>
            <Button
              onClick={generatePosts}
              disabled={isGenerating || !organizationName}
              variant={posts.length > 0 ? "outline" : "default"}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : posts.length > 0 ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Posts
                </>
              )}
            </Button>
          </div>

          {posts.length === 0 && !isGenerating && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Sparkles className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Click "Generate Posts" to create AI-powered social media content.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Posts will be customized based on your campaign details.
                </p>
              </CardContent>
            </Card>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  Creating engaging posts for {organizationName}...
                </p>
              </div>
            </div>
          )}

          {posts.length > 0 && !isGenerating && (
            <div className="grid gap-4">
              {posts.map((post, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`${platformColors[post.platform] || platformColors.All} text-white`}
                        >
                          {platformIcons[post.platform]}
                          <span className="ml-1">{post.platform}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">Post {index + 1}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSaveDialog(post)}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(post.post, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm whitespace-pre-wrap">{post.post}</p>
                    {post.suggestedComment && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Suggested comment to engage:
                        </p>
                        <p className="text-sm italic">{post.suggestedComment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Saved Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Share Templates</h3>
              <p className="text-sm text-muted-foreground">
                These templates are available to all participants. Use {"{{link}}"} for their personal link.
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {loadingTemplates ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : savedTemplates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Save className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No templates saved yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate posts with AI and save them, or create a new template manually.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {savedTemplates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={`${platformColors[template.platform] || platformColors.generic} text-white`}
                          >
                            {platformIcons[template.platform] || platformIcons.generic}
                            <span className="ml-1 capitalize">{template.platform}</span>
                          </Badge>
                          <span className="font-medium text-sm">{template.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">
                          {template.content_template}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the template from participant dashboards.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Save as Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              This template will be available to all participants with their unique link auto-inserted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g., Launch Announcement"
              />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={savePlatform} onValueChange={setSavePlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Post content:</p>
              <p className="text-sm whitespace-pre-wrap">{savingPost?.post}</p>
              <p className="text-xs text-primary mt-2">
                {"{{link}}"} will be added automatically if not present.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Use {"{{link}}"} where you want the participant's personal link inserted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Template title"
              />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={editPlatform} onValueChange={setEditPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                placeholder="Post content with {{link}} placeholder..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Write a share message for participants. Use {"{{link}}"} for their personal fundraising link
              and {"{{name}}"} for their name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Text Message to Friends"
              />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={newPlatform} onValueChange={setNewPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
                placeholder={`Hey! I'm fundraising for our team. You can support me here: {{link}}\n\nEvery bit helps! 🙏`}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Keep it short for SMS, longer for email/social media.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
