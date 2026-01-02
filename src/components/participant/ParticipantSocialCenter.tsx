import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Copy, Check, Share2, MessageSquare, Mail, Facebook, Instagram, Twitter,
    Loader2, Sparkles
} from 'lucide-react';

interface SocialTemplate {
    id: string;
    platform: string;
    title: string;
    content_template: string;
    image_url: string | null;
}

interface ParticipantSocialCenterProps {
    campaignId: string;
    participantId: string;
    participantName: string;
    shareUrl: string;
}

const platformConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    facebook: { icon: Facebook, color: 'bg-blue-600', label: 'Facebook' },
    instagram: { icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500', label: 'Instagram' },
    twitter: { icon: Twitter, color: 'bg-sky-500', label: 'Twitter/X' },
    sms: { icon: MessageSquare, color: 'bg-green-500', label: 'Text Message' },
    email: { icon: Mail, color: 'bg-gray-600', label: 'Email' },
    generic: { icon: Share2, color: 'bg-primary', label: 'Any Platform' },
};

export function ParticipantSocialCenter({
    campaignId,
    participantId,
    participantName,
    shareUrl,
}: ParticipantSocialCenterProps) {
    const [templates, setTemplates] = useState<SocialTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, [campaignId]);

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('social_share_templates')
                .select('id, platform, title, content_template, image_url')
                .eq('campaign_id', campaignId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (err) {
            console.error('Error fetching templates:', err);
        } finally {
            setLoading(false);
        }
    };

    // Replace template placeholders with actual values
    const processTemplate = (template: string): string => {
        return template
            .replace(/\{\{link\}\}/g, shareUrl)
            .replace(/\{\{name\}\}/g, participantName)
            .replace(/\{\{url\}\}/g, shareUrl);
    };

    const copyToClipboard = async (templateId: string, content: string) => {
        const processedContent = processTemplate(content);
        try {
            await navigator.clipboard.writeText(processedContent);
            setCopiedId(templateId);
            toast.success('Copied! Now paste it anywhere.');
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error('Failed to copy');
        }
    };

    const handleNativeShare = async (content: string, title: string) => {
        const processedContent = processTemplate(content);
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: processedContent,
                });
            } catch (err) {
                // User cancelled or share failed - not necessarily an error
                console.log('Share cancelled or failed:', err);
            }
        } else {
            // Fallback to copy
            await navigator.clipboard.writeText(processedContent);
            toast.success('Link copied! Share feature not available on this device.');
        }
    };

    const openSmsShare = (content: string) => {
        const processedContent = processTemplate(content);
        // SMS link - works on mobile devices
        const smsUrl = `sms:?body=${encodeURIComponent(processedContent)}`;
        window.open(smsUrl, '_blank');
    };

    const openEmailShare = (content: string, title: string) => {
        const processedContent = processTemplate(content);
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(processedContent)}`;
        window.open(mailtoUrl, '_blank');
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/20">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Share & Spread the Word
                </CardTitle>
                <CardDescription>
                    Copy these ready-to-share messages. Your personal link is already included!
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Quick Share Link */}
                <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-2">Your personal fundraising link:</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-background px-2 py-1 rounded border truncate">
                            {shareUrl}
                        </code>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard('link', shareUrl)}
                        >
                            {copiedId === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {templates.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <Share2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No share templates available yet.</p>
                        <p className="text-xs mt-1">Copy your link above and share it with friends and family!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {templates.map((template) => {
                            const config = platformConfig[template.platform] || platformConfig.generic;
                            const IconComponent = config.icon;
                            const processedContent = processTemplate(template.content_template);

                            return (
                                <div
                                    key={template.id}
                                    className="p-4 rounded-lg border bg-card hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`${config.color} text-white`}>
                                                <IconComponent className="h-3 w-3 mr-1" />
                                                {config.label}
                                            </Badge>
                                            <span className="text-sm font-medium">{template.title}</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3 line-clamp-3">
                                        {processedContent}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => copyToClipboard(template.id, template.content_template)}
                                            className="gap-1"
                                        >
                                            {copiedId === template.id ? (
                                                <>
                                                    <Check className="h-4 w-4" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4" />
                                                    Copy Text
                                                </>
                                            )}
                                        </Button>

                                        {/* Platform-specific actions */}
                                        {template.platform === 'sms' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openSmsShare(template.content_template)}
                                                className="gap-1"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                Send Text
                                            </Button>
                                        )}

                                        {template.platform === 'email' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEmailShare(template.content_template, template.title)}
                                                className="gap-1"
                                            >
                                                <Mail className="h-4 w-4" />
                                                Send Email
                                            </Button>
                                        )}

                                        {/* Native share button for mobile */}
                                        {'share' in navigator && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleNativeShare(template.content_template, template.title)}
                                                className="gap-1"
                                            >
                                                <Share2 className="h-4 w-4" />
                                                Share
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
