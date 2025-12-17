import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Share2, Heart, ShieldCheck, Users, ArrowRight, Book, Rocket, Laptop, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { LiveDonationFeed } from '@/components/campaign/LiveDonationFeed';
import { LeaderboardWidget } from '@/components/campaign/LeaderboardWidget';
import { Checkbox } from '@/components/ui/checkbox';

export default function PublicCampaignPage() {
    const { id } = useParams();
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRaised: 0, percentGoal: 0, donorCount: 0 });
    const [donationAmount, setDonationAmount] = useState('50');
    const [coverFees, setCoverFees] = useState(true);

    useEffect(() => {
        if (id) fetchCampaign();
    }, [id]);

    const fetchCampaign = async () => {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setCampaign(data);

            if (data) {
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total_amount')
                    .eq('campaign_id', data.id)
                    .eq('status', 'completed');

                const total = orders?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0;
                const count = orders?.length || 0;

                setStats({
                    totalRaised: total,
                    percentGoal: Math.min(100, Math.round((total / (data.goal_amount || 1)) * 100)),
                    donorCount: count
                });
            }

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDonate = async () => {
        if (!campaign) return;
        if (!donationAmount || isNaN(parseFloat(donationAmount)) || parseFloat(donationAmount) <= 0) {
            toast.error("Please enter a valid donation amount");
            return;
        }

        toast.info("Processing donation...");

        // Simulate donation processing
        try {
            const { error } = await supabase
                .from('orders')
                .insert({
                    campaign_id: campaign.id,
                    total_amount: parseFloat(donationAmount) + (coverFees ? (parseFloat(donationAmount) * 0.029 + 0.30) : 0),
                    status: 'completed',
                    customer_email: 'donor@test.com',
                    customer_name: 'Test Donor',
                });

            if (error) throw error;

            toast.success("Thank you for your donation!");
            fetchCampaign(); // Refresh stats
        } catch (err: any) {
            toast.error("Donation failed: " + err.message);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
                </div>
            </Layout>
        );
    }

    if (!campaign) {
        return (
            <Layout>
                <div className="container-tight py-20 text-center">
                    <h1 className="text-2xl font-bold">Campaign Not Found</h1>
                    <p className="text-muted-foreground mt-2">The campaign you are looking for does not exist or has ended.</p>
                    <Button className="mt-6" asChild><a href="/">Return Home</a></Button>
                </div>
            </Layout>
        );
    }



    return (
        <Layout>
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-hero min-h-[400px] flex items-center">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-blue/10 rounded-full blur-3xl animate-float animation-delay-200" />
                </div>

                <div className="container-wide relative z-10">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm font-medium text-secondary mb-6 animate-fade-in">
                            <Heart className="w-4 h-4 fill-current" />
                            <span>Support this campaign</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-slide-up leading-tight">
                            {campaign.name}
                        </h1>
                        <div className="flex flex-wrap gap-4 animate-slide-up animation-delay-100">
                            <div className="glass px-6 py-3 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <p className="text-sm text-white/70">Supporters</p>
                                    <p className="text-xl font-bold text-white">{stats.donorCount}</p>
                                </div>
                            </div>
                            <div className="glass px-6 py-3 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-blue/20 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-primary-blue" />
                                </div>
                                <div>
                                    <p className="text-sm text-white/70">Trusted</p>
                                    <p className="text-sm font-medium text-white">Verified Campaign</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="container-wide -mt-12 relative z-20 pb-20">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8 animate-slide-up animation-delay-200">
                        <Card className="border-none shadow-xl overflow-hidden">
                            <div className="h-2 bg-gradient-to-r from-secondary to-primary-blue" />
                            <CardHeader>
                                <CardTitle className="text-2xl">About this Campaign</CardTitle>
                            </CardHeader>
                            <CardContent className="prose max-w-none text-muted-foreground">
                                <p className="whitespace-pre-wrap leading-relaxed text-lg">
                                    {campaign.description || "No description provided for this campaign."}
                                </p>
                                {/* Placeholder for more content/images if needed */}
                                <div className="mt-8 p-6 bg-muted/30 rounded-2xl border border-border/50">
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Why your support matters</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                            <span>Direct impact on our community goals and projects.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                            <span>100% secure donation processing.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="mt-8 p-6 bg-muted/30 rounded-2xl border border-border/50">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Trust & Transparency</h3>
                                    <div className="relative pl-2">
                                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border/50"></div>
                                        <div className="space-y-6 relative">
                                            <div className="flex gap-4 items-start">
                                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white z-10 shadow-sm mt-0.5"><ShieldCheck className="w-3 h-3" /></div>
                                                <div><p className="font-medium text-sm">Campaign Launched</p><p className="text-xs text-muted-foreground">Verified Organization</p></div>
                                            </div>
                                            <div className="flex gap-4 items-start">
                                                <div className="w-6 h-6 rounded-full bg-primary-blue flex items-center justify-center text-white z-10 shadow-glow-blue mt-0.5"><Heart className="w-3 h-3" /></div>
                                                <div><p className="font-medium text-sm">Fundraising Active</p><p className="text-xs text-muted-foreground">Accepting secure donations</p></div>
                                            </div>
                                            <div className="flex gap-4 items-start">
                                                <div className="w-6 h-6 rounded-full bg-muted border-2 border-border flex items-center justify-center z-10 mt-0.5"></div>
                                                <div><p className="font-medium text-sm text-muted-foreground">Goal Purchased</p><p className="text-xs text-muted-foreground">Expected: Jan 2026</p></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Donation */}
                    <div className="lg:col-span-1 animate-slide-up animation-delay-300">
                        <div className="sticky top-24 space-y-6">
                            <LeaderboardWidget campaignId={campaign.id} />
                            <LiveDonationFeed campaignId={campaign.id} />

                            <Card className="border-none shadow-2xl ring-1 ring-border/50 relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary-blue/5 to-transparent pointer-events-none" />

                                <CardHeader>
                                    <CardTitle className="text-xl">Make a Donation</CardTitle>
                                    <CardDescription>Target Goal: ${campaign.goal_amount?.toLocaleString()}</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-3xl font-bold text-foreground">${stats.totalRaised.toLocaleString()}</span>
                                            <span className="text-sm font-medium text-muted-foreground mb-1">{stats.percentGoal}% raised</span>
                                        </div>
                                        <Progress value={stats.percentGoal} className="h-3 bg-secondary/20" indicatorClassName="bg-gradient-teal" />
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-foreground">Select Amount</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { amount: '25', label: 'Supplies', icon: Book },
                                                { amount: '50', label: 'Class Trip', icon: Rocket },
                                                { amount: '100', label: 'Technology', icon: Laptop },
                                                { amount: '250', label: 'Scholarship', icon: GraduationCap }
                                            ].map((tier) => (
                                                <button
                                                    key={tier.amount}
                                                    onClick={() => setDonationAmount(tier.amount)}
                                                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02] ${donationAmount === tier.amount
                                                        ? 'bg-primary-blue/5 border-primary-blue shadow-md'
                                                        : 'bg-background hover:bg-muted border-border hover:border-primary-blue/30'
                                                        }`}
                                                >
                                                    <div className={`absolute top-3 right-3 ${donationAmount === tier.amount ? 'text-primary-blue' : 'text-muted-foreground'}`}>
                                                        <tier.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className={`text-lg font-bold ${donationAmount === tier.amount ? 'text-primary-blue' : 'text-foreground'}`}>
                                                        ${tier.amount}
                                                    </div>
                                                    <div className="text-xs font-medium text-muted-foreground mt-1">
                                                        {tier.label}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <Input
                                                type="number"
                                                placeholder="Other Amount"
                                                className="pl-10 h-12 text-lg"
                                                value={donationAmount}
                                                onChange={(e) => setDonationAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-lg font-semibold shadow-glow-teal hover:shadow-glow hover:scale-[1.02] transition-all bg-gradient-teal border-0"
                                        onClick={handleDonate}
                                    >
                                        Donate ${((parseFloat(donationAmount || '0') || 0) + (coverFees ? ((parseFloat(donationAmount || '0') || 0) * 0.029 + 0.30) : 0)).toFixed(2)}
                                    </Button>

                                    <div className="flex items-center space-x-2 pt-2 justify-center">
                                        <Checkbox
                                            id="cover-fees"
                                            checked={coverFees}
                                            onCheckedChange={(checked) => setCoverFees(checked as boolean)}
                                        />
                                        <label
                                            htmlFor="cover-fees"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                                        >
                                            Cover the ${((parseFloat(donationAmount || '0') || 0) * 0.029 + 0.30).toFixed(2)} transaction fee
                                        </label>
                                    </div>

                                    <p className="text-xs text-center text-muted-foreground">
                                        All donations are secure and encrypted.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                                <CardContent className="p-6 flex items-start gap-4">
                                    <div className="bg-white/10 p-2 rounded-lg">
                                        <Share2 className="w-5 h-5" />
                                    </div>
                                    <div className="w-full">
                                        <h4 className="font-semibold mb-1">Share & Multiply Impact</h4>
                                        <p className="text-sm text-primary-foreground/80 mb-3">Sharing can double your impact!</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full gap-2"
                                                onClick={() => {
                                                    const text = `Help ${campaign.name} reach our goal! Donate here: ${window.location.href}`;
                                                    window.open(`sms:?body=${encodeURIComponent(text)}`);
                                                }}
                                            >
                                                📱 SMS
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full gap-2"
                                                onClick={() => {
                                                    const text = `Help ${campaign.name} reach our goal! Donate here: ${window.location.href}`;
                                                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
                                                }}
                                            >
                                                💬 WhatsApp
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full col-span-2 border-white/20 hover:bg-white/10 text-primary-foreground"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    toast.success("Link copied to clipboard!");
                                                }}
                                            >
                                                🔗 Copy Link
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
