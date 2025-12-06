import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Rocket, TrendingUp, Clock, Copy, Download, Check,
  Share2, Facebook, Instagram, Twitter
} from 'lucide-react';

interface CampaignPost {
  id: string;
  customized_post: string | null;
  customized_comment: string | null;
  generated_image_url: string | null;
  post_templates: {
    category: 'launch' | 'progress' | 'urgency';
    platform: string;
    base_image_url: string | null;
  };
}

interface SocialPostsDashboardProps {
  campaignId: string;
  participantName?: string;
}

const CATEGORY_CONFIG = {
  launch: { icon: Rocket, label: 'Launch', color: 'bg-emerald-500', description: 'Announce your fundraiser' },
  progress: { icon: TrendingUp, label: 'Progress', color: 'bg-blue-500', description: 'Share updates & thank supporters' },
  urgency: { icon: Clock, label: 'Final Push', color: 'bg-orange-500', description: 'Last chance messages' },
};

export function SocialPostsDashboard({ campaignId, participantName }: SocialPostsDashboardProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [campaignId]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_posts')
        .select(`
          id,
          customized_post,
          customized_comment,
          generated_image_url,
          post_templates (
            category,
            platform,
            base_image_url
          )
        `)
        .eq('campaign_id', campaignId)
        .eq('is_participant_visible', true);

      if (error) throw error;
      setPosts(data as unknown as CampaignPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const personalizePost = (text: string | null) => {
    if (!text) return '';
    return text.replace(/\{\{participant_name\}\}/g, participantName || 'I');
  };

  const copyToClipboard = async (text: string, postId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(postId);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const shareToSocial = (platform: string, text: string) => {
    const encodedText = encodeURIComponent(text);
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?quote=${encodedText}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      default:
        toast.info('Copy the text and paste it in your social media app!');
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No social posts available yet</p>
            <p className="text-sm">Your campaign manager will select posts for you soon!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group posts by category
  const postsByCategory = posts.reduce((acc, post) => {
    const category = post.post_templates?.category || 'launch';
    if (!acc[category]) acc[category] = [];
    acc[category].push(post);
    return acc;
  }, {} as Record<string, CampaignPost[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-secondary" />
            Your Social Posts
          </CardTitle>
          <CardDescription>
            Share these posts on social media to boost your fundraiser. Each post is ready to go!
          </CardDescription>
        </CardHeader>
      </Card>

      {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
        const categoryPosts = postsByCategory[category] || [];
        if (categoryPosts.length === 0) return null;

        const Icon = config.icon;

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{config.label}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryPosts.map(post => {
                const personalizedPost = personalizePost(post.customized_post);
                const personalizedComment = personalizePost(post.customized_comment);
                const imageUrl = post.generated_image_url || post.post_templates?.base_image_url;
                const isCopied = copiedId === post.id;

                return (
                  <div
                    key={post.id}
                    className="rounded-xl border border-border p-4 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      {imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt="Post image"
                            className="w-32 h-32 rounded-lg object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground mb-3">{personalizedPost}</p>

                        {personalizedComment && (
                          <div className="mb-3 p-3 rounded-lg bg-muted/50 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">💬 Suggested comment:</p>
                            <p className="text-sm text-foreground/80 italic">{personalizedComment}</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant={isCopied ? "secondary" : "default"}
                            size="sm"
                            onClick={() => copyToClipboard(personalizedPost, post.id)}
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Text
                              </>
                            )}
                          </Button>

                          {imageUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={imageUrl} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                Save Image
                              </a>
                            </Button>
                          )}

                          <div className="flex items-center gap-1 ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => shareToSocial('facebook', personalizedPost)}
                            >
                              <Facebook className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => shareToSocial('twitter', personalizedPost)}
                            >
                              <Twitter className="h-4 w-4 text-sky-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => shareToSocial('instagram', personalizedPost)}
                            >
                              <Instagram className="h-4 w-4 text-pink-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
