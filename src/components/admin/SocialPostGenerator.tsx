import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Check, Facebook, Instagram, Twitter, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SocialPost {
  post: string;
  suggestedComment: string;
  platform: string;
}

interface SocialPostGeneratorProps {
  organizationName: string;
  organizationType?: string;
  fundraiserType: string;
  goalAmount?: number;
  description?: string;
  onPostsGenerated?: (posts: SocialPost[]) => void;
}

const platformIcons: Record<string, React.ReactNode> = {
  Facebook: <Facebook className="h-4 w-4" />,
  Instagram: <Instagram className="h-4 w-4" />,
  Twitter: <Twitter className="h-4 w-4" />,
  All: null,
};

const platformColors: Record<string, string> = {
  Facebook: "bg-blue-500",
  Instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  Twitter: "bg-sky-500",
  All: "bg-muted",
};

export function SocialPostGenerator({
  organizationName,
  organizationType,
  fundraiserType,
  goalAmount,
  description,
  onPostsGenerated,
}: SocialPostGeneratorProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Social Media Posts</h3>
        </div>
        <Button
          onClick={generatePosts}
          disabled={isGenerating || !organizationName}
          variant={posts.length > 0 ? "outline" : "default"}
          size="sm"
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
        <p className="text-sm text-muted-foreground">
          Generate 5 AI-powered social media posts to promote your fundraiser. Posts will be customized based on your organization and campaign details.
        </p>
      )}

      {isGenerating && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Creating engaging posts for {organizationName}...</p>
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
                    <Badge variant="secondary" className={`${platformColors[post.platform]} text-white`}>
                      {platformIcons[post.platform]}
                      <span className="ml-1">{post.platform}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">Post {index + 1}</span>
                  </div>
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
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{post.post}</p>
                {post.suggestedComment && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Suggested comment to engage:</p>
                    <p className="text-sm italic">{post.suggestedComment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
