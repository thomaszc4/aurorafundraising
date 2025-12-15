import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Users, DollarSign, TrendingUp, Share2,
    Settings, Copy, ExternalLink, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CreateCampaignWizard } from '@/components/admin/CreateCampaignWizard';
import { IndividualSetupWizard } from '@/components/individual/IndividualSetupWizard';

export default function IndividualDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState<any>(null);
    const [stats, setStats] = useState({
        totalRaised: 0,
        donationCount: 0,
        daysLeft: 0,
        percentGoal: 0
    });

    useEffect(() => {
        if (user) fetchCampaign();
    }, [user]);

    const fetchCampaign = async () => {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('organization_admin_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setCampaign(data);
                calculateStats(data);
            }
        } catch (error) {
            console.error('Error fetching campaign:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = async (campaignData: any) => {
        // Determine days left
        let days = 0;
        if (campaignData.end_date) {
            const end = new Date(campaignData.end_date);
            const now = new Date();
            const diffTime = end.getTime() - now.getTime();
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Fetch generic 'total raised' (mock calculation for now or complex query)
        // Ideally we sum up orders for this campaign
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignData.id)
            .eq('status', 'completed');

        // For Demo: Randomize or calculate real total if we had order sums easily accessible
        // We'll trust the 'orders' summation in a real app, here we will just use a placeholder
        // or fetch real sum if feasible. let's fetch sum.
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('campaign_id', campaignData.id)
            .eq('status', 'completed');

        const total = orders?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0;

        setStats({
            totalRaised: total,
            donationCount: count || 0,
            daysLeft: days,
            percentGoal: Math.min(100, Math.round((total / (campaignData.goal_amount || 1)) * 100))
        });
    };

    const copyLink = () => {
        // Assuming campaign page is /campaign/:id or /c/:code
        // For now we use ID
        const url = `${window.location.origin}/campaign/${campaign.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Campaign link copied!');
    };

    if (loading) {
        return <div className="p-8 text-center">Loading dashboard...</div>;
    }

    // If no campaign, Show Wizard
    if (!campaign) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <IndividualSetupWizard
                    onComplete={fetchCampaign}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{campaign.name}</h1>
                    <p className="text-muted-foreground">Personal Fundraiser</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open(`/campaign/${campaign.id}`, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Page
                    </Button>
                    <Button onClick={copyLink}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Link
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalRaised.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.percentGoal}% of ${campaign.goal_amount?.toLocaleString()} goal
                        </p>
                        <Progress value={stats.percentGoal} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Donations</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.donationCount}</div>
                        <p className="text-xs text-muted-foreground">Total supporters</p>
                    </CardContent>
                </Card>

                {campaign.end_date && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Days Left</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.daysLeft}</div>
                            <p className="text-xs text-muted-foreground">Until campaign ends</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Edit / Manage Section */}
            <Tabs defaultValue="share" className="w-full">
                <TabsList>
                    <TabsTrigger value="share">Share & Promote</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="orders">Donations</TabsTrigger>
                </TabsList>

                <TabsContent value="share" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Share Your Campaign</CardTitle>
                            <CardDescription>Get the word out to friends and family</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3">
                                <Label className="text-sm font-medium text-muted-foreground">Your Campaign Link</Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        className="font-mono text-sm bg-muted/50"
                                        value={`${window.location.origin}/campaign/${campaign.id}`}
                                    />
                                    <Button onClick={copyLink} className="shrink-0 font-semibold shadow-sm">
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Link
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Share this link via text, email, or social media. Anyone with the link can donate.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Social Share Buttons could go here */}
                                <Button className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90">Facebook</Button>
                                <Button className="w-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90">Twitter</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CreateCampaignWizard
                                editingCampaign={campaign}
                                onComplete={() => {
                                    fetchCampaign();
                                    toast.success("Saved!");
                                }}
                                onCancel={() => { }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
}
