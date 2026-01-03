import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check, Instagram, Facebook, Twitter } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SocialTemplate {
    id: string;
    name: string;
    imageUrl: string;
    captions: {
        short: string;
        medium: string;
        long: string;
    };
}

interface SocialMediaTemplatesProps {
    shareUrl?: string;
    campaignName?: string;
    organizationName?: string;
    fundraiserType?: string;
}

// Generate program-specific templates based on fundraiser type
const generateTemplates = (
    fundraiserType: string,
    campaignName: string,
    organizationName: string
): SocialTemplate[] => {
    const campaignDisplay = campaignName || 'our fundraiser';
    const orgDisplay = organizationName || 'our organization';

    // Template variations by fundraiser type
    const templatesByType: Record<string, SocialTemplate[]> = {
        product: [
            {
                id: 'classic',
                name: 'Classic Elegant',
                imageUrl: '/templates/orchestra_template_1.png',
                captions: {
                    short: `🎯 Supporting ${campaignDisplay}! Help us reach our goal - every purchase makes a difference! Link in bio! 💙`,
                    medium: `🎯 Supporting ${campaignDisplay}! 💙\n\nI'm raising funds for ${orgDisplay} and would love your support! Every purchase through my fundraising page helps us reach our goals.\n\nClick the link to browse awesome products and support ${campaignDisplay}! 🚀`,
                    long: `🎯 Exciting news! I'm fundraising for ${campaignDisplay}! 💙\n\n${orgDisplay} means so much to me, and I'm working to help raise funds for our important mission. Your support would mean the world!\n\nEvery purchase through my fundraising link helps us get closer to our goal. Browse quality products and support a great cause at the same time!\n\n🔗 Link in bio to shop and support!\n\nThank you for your generosity! 💙\n\n#Fundraising #SupportLocal #CommunitySupport #MakeADifference`
                }
            },
            {
                id: 'energetic',
                name: 'Warm & Energetic',
                imageUrl: '/templates/orchestra_template_2.png',
                captions: {
                    short: `💪 Making it happen! Support ${campaignDisplay} by shopping our fundraiser. Link in bio! ✨`,
                    medium: `💪 Making It Happen! 🎯\n\nI'm participating in ${campaignDisplay} and need your help! By shopping through my link, you're not just getting great products – you're helping ${orgDisplay}.\n\nClick the link in my bio to browse and buy. Every purchase makes a difference! 🌟`,
                    long: `💪 Let's make a difference together! 🎯\n\nI'm so excited to be part of ${campaignDisplay}! This cause has given me so much, and now I have a chance to give back and help our program thrive.\n\nHere's how you can help:\n✨ Shop through my fundraising link\n✨ Find amazing products for yourself or as gifts\n✨ Know that every purchase directly supports ${orgDisplay}\n\n🔗 Link in bio to get started!\n\nThank you for your support! 💙\n\n#Fundraising #SupportLocal #ShopWithPurpose #CommunityLove`
                }
            },
            {
                id: 'minimal',
                name: 'Clean & Minimalist',
                imageUrl: '/templates/orchestra_template_3.png',
                captions: {
                    short: `Your support = our success! 🎯 Help fund ${campaignDisplay} through my fundraising link. Shop now! 💙`,
                    medium: `Your Support = Our Success! 🎯\n\nI'm raising funds for ${campaignDisplay} and would be so grateful for your help! Shopping through my fundraising link is an easy way to support ${orgDisplay} while getting quality products.\n\n🔗 Link in bio to shop and support!\n\nThank you for making a difference! 💙`,
                    long: `Your Support = Our Success! 🎯\n\nAs a participant in ${campaignDisplay}, I've experienced firsthand how important this cause is. Now I'm fundraising to help ensure future success.\n\nWhy your support matters:\n💙 Funds our important mission\n🎯 Supports ${orgDisplay}\n✨ Keeps our program strong and growing\n\nHow to help:\nSimply shop through my fundraising link! You'll find quality products at great prices, and a portion of every purchase supports ${campaignDisplay}.\n\n🔗 Click the link in my bio to browse and shop!\n\nEvery purchase, no matter how small, moves us closer to our goal. Thank you!\n\n#Fundraising #CommunitySupport #MakeADifference #SupportLocal`
                }
            }
        ],
        orchestra: [
            {
                id: 'classic',
                name: 'Classic Elegant',
                imageUrl: '/templates/orchestra_template_1.png',
                captions: {
                    short: `🎻 Help support our orchestra! Every purchase brings us closer to our goal. Link in bio! 🎵`,
                    medium: `🎻 Help support our orchestra! 🎵\n\nI'm raising funds for ${campaignDisplay} and would love your support! Every purchase through my fundraising page helps us reach our goals.\n\nClick the link in my bio to browse awesome products and support our orchestra! 🎼`,
                    long: `🎻 Exciting news! I'm fundraising for ${campaignDisplay}! 🎵\n\nOur orchestra means so much to me, and I'm working to help raise funds for new instruments, music, and performance opportunities. Your support would mean the world!\n\nEvery purchase through my fundraising link helps us get closer to our goal. Browse quality products and support music education at the same time!\n\n🔗 Link in bio to shop and support!\n\nThank you for believing in the power of music! 💙\n\n#MusicEducation #OrchestraLife #Fundraising #SupportTheArts`
                }
            },
            {
                id: 'artistic',
                name: 'Warm & Artistic',
                imageUrl: '/templates/orchestra_template_2.png',
                captions: {
                    short: `🎵 Making music happen! Support our orchestra by shopping our fundraiser. Link in bio! ✨`,
                    medium: `🎵 Making Music Happen! 🎻\n\nI'm participating in ${campaignDisplay} and need your help! By shopping through my link, you're not just getting great products – you're helping fund our music program.\n\nClick the link in my bio to browse and buy. Every purchase makes a difference! 🌟`,
                    long: `🎵 Let's make beautiful music together! 🎻\n\nI'm so excited to be part of ${campaignDisplay}! Music has given me so much, and now I have a chance to give back and help our program thrive.\n\nHere's how you can help:\n✨ Shop through my fundraising link\n✨ Find amazing products for yourself or as gifts\n✨ Know that every purchase directly supports our orchestra\n\nYour support helps us:\n• Purchase new instruments and equipment\n• Fund performance opportunities\n• Keep music education thriving\n\n🔗 Link in bio to get started!\n\nThank you for supporting the arts! 🎼❤️\n\n#SupportLocalMusic #OrchestraFundraiser #MusicMatters #ShopWithPurpose`
                }
            },
            {
                id: 'minimal',
                name: 'Clean & Minimalist',
                imageUrl: '/templates/orchestra_template_3.png',
                captions: {
                    short: `Your support = our success! 🎼 Help fund our orchestra program through my fundraising link. Shop now! 🎻`,
                    medium: `Your Support = Our Success! 🎼\n\nI'm raising funds for ${campaignDisplay} and would be so grateful for your help! Shopping through my fundraising link is an easy way to support music education while getting quality products.\n\n🔗 Link in bio to shop and support!\n\nThank you for making a difference! 🎻`,
                    long: `Your Support = Our Success! 🎼\n\nAs a member of ${orgDisplay}, I've experienced firsthand how music education changes lives. Now I'm participating in ${campaignDisplay} to help ensure future students have the same opportunities I've had.\n\nWhy your support matters:\n🎻 Funds new instruments for students\n🎵 Supports performance and competition travel\n🎼 Keeps our music program strong and growing\n\nHow to help:\nSimply shop through my fundraising link! You'll find quality products at great prices, and a portion of every purchase supports our orchestra.\n\n🔗 Click the link in my bio to browse and shop!\n\nEvery purchase, no matter how small, moves us closer to our goal. Thank you for investing in music education!\n\n#MusicEducation #OrchestraFundraiser #SupportTheArts #CommunitySupport #MusicMatters`
                }
            }
        ]
    };

    // Return appropriate template set, defaulting to 'product' if type not found
    return templatesByType[fundraiserType] || templatesByType.product;
};

export function SocialMediaTemplates({
    shareUrl,
    campaignName = 'our fundraiser',
    organizationName = 'our organization',
    fundraiserType = 'product'
}: SocialMediaTemplatesProps) {
    const [copiedCaption, setCopiedCaption] = useState<string | null>(null);

    const templates = useMemo(() =>
        generateTemplates(fundraiserType, campaignName, organizationName),
        [fundraiserType, campaignName, organizationName]
    );

    const copyToClipboard = async (text: string, id: string) => {
        try {
            // Replace "link in bio" with actual link if provided
            const finalText = shareUrl
                ? text.replace(/Link in bio/gi, `Link: ${shareUrl}`)
                : text;

            await navigator.clipboard.writeText(finalText);
            setCopiedCaption(id);
            toast.success('Caption copied to clipboard!');
            setTimeout(() => setCopiedCaption(null), 2000);
        } catch (error) {
            toast.error('Failed to copy caption');
        }
    };

    const downloadImage = (imageUrl: string, templateName: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${templateName.replace(/\s+/g, '-')}-Template.png`;
        link.click();
        toast.success('Template downloaded!');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-primary" />
                    Social Media Templates
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    Download ready-to-use graphics and copy captions to share on social media!
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {templates.map((template) => (
                    <div key={template.id} className="space-y-3">
                        <div className="flex items-start gap-4">
                            {/* Template Preview */}
                            <div className="flex-shrink-0 w-32 h-32 relative group">
                                <img
                                    src={template.imageUrl}
                                    alt={template.name}
                                    className="w-full h-full object-cover rounded-lg border-2 border-border"
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="absolute inset-0 m-auto w-fit h-fit opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => downloadImage(template.imageUrl, template.name)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            </div>

                            {/* Template Info & Captions */}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h4 className="font-semibold text-sm">{template.name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Perfect for Instagram, Facebook, and Twitter
                                    </p>
                                </div>

                                <Tabs defaultValue="short" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="short" className="text-xs">Short</TabsTrigger>
                                        <TabsTrigger value="medium" className="text-xs">Medium</TabsTrigger>
                                        <TabsTrigger value="long" className="text-xs">Long</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="short" className="space-y-2">
                                        <div className="bg-muted/50 p-3 rounded-lg text-sm">
                                            <p className="whitespace-pre-line">{template.captions.short}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => copyToClipboard(template.captions.short, `${template.id}-short`)}
                                        >
                                            {copiedCaption === `${template.id}-short` ? (
                                                <><Check className="h-3 w-3 mr-2" /> Copied!</>
                                            ) : (
                                                <><Copy className="h-3 w-3 mr-2" /> Copy Caption</>
                                            )}
                                        </Button>
                                    </TabsContent>

                                    <TabsContent value="medium" className="space-y-2">
                                        <div className="bg-muted/50 p-3 rounded-lg text-sm max-h-32 overflow-y-auto">
                                            <p className="whitespace-pre-line">{template.captions.medium}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => copyToClipboard(template.captions.medium, `${template.id}-medium`)}
                                        >
                                            {copiedCaption === `${template.id}-medium` ? (
                                                <><Check className="h-3 w-3 mr-2" /> Copied!</>
                                            ) : (
                                                <><Copy className="h-3 w-3 mr-2" /> Copy Caption</>
                                            )}
                                        </Button>
                                    </TabsContent>

                                    <TabsContent value="long" className="space-y-2">
                                        <div className="bg-muted/50 p-3 rounded-lg text-sm max-h-32 overflow-y-auto">
                                            <p className="whitespace-pre-line">{template.captions.long}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => copyToClipboard(template.captions.long, `${template.id}-long`)}
                                        >
                                            {copiedCaption === `${template.id}-long` ? (
                                                <><Check className="h-3 w-3 mr-2" /> Copied!</>
                                            ) : (
                                                <><Copy className="h-3 w-3 mr-2" /> Copy Caption</>
                                            )}
                                        </Button>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                        {template.id !== 'minimal' && <div className="border-b" />}
                    </div>
                ))}

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium mb-2">💡 How to use:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Download your favorite template</li>
                        <li>Choose a caption length (short, medium, or long)</li>
                        <li>Copy the caption to your clipboard</li>
                        <li>Post on Instagram, Facebook, or Twitter with your fundraising link!</li>
                    </ol>
                </div>
            </CardContent>
        </Card>
    );
}
