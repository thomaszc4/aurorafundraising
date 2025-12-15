import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    School, HeartHandshake, Palette, HeartPulse, Rocket,
    ChevronRight, ArrowLeft, Upload, Image as ImageIcon, Check, CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Types
type FundraisingReason = 'school' | 'charity' | 'creative' | 'medical' | 'other';

interface ReasonOption {
    id: FundraisingReason;
    label: string;
    description: string;
    icon: any;
    isOrg: boolean;
    color: string;
}

const REASON_OPTIONS: ReasonOption[] = [
    {
        id: 'school',
        label: 'School Group / Team',
        description: 'For a class, sports team, or club',
        icon: School,
        isOrg: true,
        color: 'text-blue-500 bg-blue-500/10 border-blue-200'
    },
    {
        id: 'charity',
        label: 'Community Org / Charity',
        description: 'Non-profit or community cause',
        icon: HeartHandshake,
        isOrg: true,
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-200'
    },
    {
        id: 'creative',
        label: 'Creative Project',
        description: 'Art, music, film, or personal creation',
        icon: Palette,
        isOrg: false,
        color: 'text-purple-500 bg-purple-500/10 border-purple-200'
    },
    {
        id: 'medical',
        label: 'Medical / Emergency',
        description: 'Help with bills or recovery',
        icon: HeartPulse,
        isOrg: false,
        color: 'text-rose-500 bg-rose-500/10 border-rose-200'
    },
    {
        id: 'other',
        label: 'Other Cause',
        description: 'Everything else under the sun',
        icon: Rocket,
        isOrg: false,
        color: 'text-amber-500 bg-amber-500/10 border-amber-200'
    }
];

interface IndividualSetupWizardProps {
    onComplete: () => void;
}

export function IndividualSetupWizard({ onComplete }: IndividualSetupWizardProps) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [reason, setReason] = useState<FundraisingReason | null>(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [goalAmount, setGoalAmount] = useState('');
    const [campaignTitle, setCampaignTitle] = useState('');
    const [orgName, setOrgName] = useState('');
    const [programName, setProgramName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // Deadline State
    const [hasDeadline, setHasDeadline] = useState(false);
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);

    const selectedReason = REASON_OPTIONS.find(r => r.id === reason);
    const isOrgFlow = selectedReason?.isOrg || false;

    // Handlers
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => setLogoPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Upload
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('campaign-logos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('campaign-logos')
                .getPublicUrl(fileName);

            setLogoUrl(publicUrl);
            toast.success('Logo uploaded!');
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Failed to upload logo');
        }
    };

    const handleSubmit = async () => {
        if (!reason || !goalAmount) return;
        if (isOrgFlow && !orgName) {
            toast.error('Organization Name is required');
            return;
        }
        if (!isOrgFlow && !campaignTitle) {
            toast.error('Campaign Title is required');
            return;
        }
        if (hasDeadline && !deadline) {
            toast.error('Please select a deadline date');
            return;
        }

        setLoading(true);
        try {
            // Construct Data
            const finalName = isOrgFlow
                ? (programName ? `${orgName} - ${programName}` : orgName)
                : campaignTitle;

            const campaignData = {
                organization_admin_id: user?.id,
                name: finalName,

                // Meta fields
                organization_name: isOrgFlow ? orgName : null,
                program_name: isOrgFlow ? programName : null,
                description: `Fundraising for ${selectedReason?.label}`,

                goal_amount: Math.ceil(parseFloat(goalAmount)),
                status: 'active' as const,
                fundraiser_type: 'product' as const,

                logo_url: logoUrl || null,
                start_date: new Date().toISOString(),
                // If hasDeadline is true use selected date, else null
                end_date: hasDeadline && deadline ? deadline.toISOString() : null,
            };

            const { data, error } = await supabase
                .from('campaigns')
                .insert(campaignData)
                .select()
                .single();

            if (error) throw error;

            // Auto-add Default Product (QuickStove) if it exists
            const { data: products } = await supabase
                .from('products')
                .select('id')
                .eq('active', true);

            if (products && products.length > 0) {
                const productInserts = products.map(p => ({
                    campaign_id: data.id,
                    product_id: p.id
                }));
                await supabase.from('campaign_products').insert(productInserts);
            }

            toast.success('Campaign created successfully!');
            onComplete();

        } catch (error: any) {
            console.error('Error creating campaign:', error);
            toast.error(error.message || 'Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    // Render Steps

    // STEP 1: CHOOSE REASON
    if (step === 1) {
        return (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 pb-20">
                <div className="text-center mb-8 pt-4">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Welcome, {user?.user_metadata.full_name?.split(' ')[0]}!
                        </span>
                        <span className="ml-2">👋</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">What are you raising money for today?</p>
                </div>

                <div className="space-y-3">
                    {REASON_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = reason === option.id;

                        return (
                            <div
                                key={option.id}
                                onClick={() => setReason(option.id)}
                                className={cn(
                                    "relative group cursor-pointer border rounded-2xl p-4 transition-all duration-200 active:scale-[0.98]",
                                    isSelected
                                        ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                                        : "border-border/50 bg-card hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0",
                                        option.color
                                    )}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg leading-tight mb-0.5">{option.label}</h3>
                                        <p className="text-sm text-muted-foreground truncate">{option.description}</p>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                        isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
                                    )}>
                                        {isSelected && <Check className="w-3 h-3" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t md:relative md:bg-transparent md:border-t-0 md:p-0 mt-8 z-10 transition-transform">
                    <div className="max-w-2xl mx-auto">
                        <Button
                            size="lg"
                            disabled={!reason}
                            onClick={() => setStep(2)}
                            className="w-full text-lg h-14 rounded-xl shadow-lg shadow-primary/25"
                        >
                            Next Step <ChevronRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                </div>
                {/* Spacer for fixed bottom button on mobile */}
                <div className="h-20 md:hidden" />
            </div>
        );
    }

    // STEP 2: DETAILS
    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500 px-4 pb-12">
            <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Back to options
            </Button>

            <Card className="border-muted/40 shadow-xl overflow-hidden glass-card">
                <div className={cn("h-2 w-full", selectedReason?.color || "bg-primary")} />
                <CardHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", selectedReason?.color)}>
                            {selectedReason && <selectedReason.icon className="w-5 h-5" />}
                        </div>
                        <div>
                            <CardTitle className="text-2xl">{selectedReason?.label}</CardTitle>
                            <CardDescription>Let's get the details set up</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">

                    {/* Common Field: Goal */}
                    <div className="space-y-3">
                        <Label htmlFor="goal" className="text-base font-semibold">Fundraising Goal</Label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</div>
                            <Input
                                id="goal"
                                type="text"
                                className="pl-9 h-14 text-xl font-medium border-muted-foreground/20 bg-background/50 focus:bg-background transition-all"
                                placeholder="1,000"
                                value={goalAmount ? Number(goalAmount).toLocaleString() : ''}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setGoalAmount(val);
                                }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Aim high! You can always change this later.</p>
                    </div>

                    {/* Conditional Fields: Org vs Personal */}
                    {isOrgFlow ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-3">
                                <Label htmlFor="orgName" className="text-base font-semibold">Organization Name</Label>
                                <Input
                                    id="orgName"
                                    className="h-12 bg-background/50"
                                    placeholder={reason === 'charity' ? "e.g. Red Cross, Local Animal Shelter" : "e.g. Lincoln High School, Red Cross"}
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="program" className="text-base font-semibold">
                                    {reason === 'charity' ? 'Division (Optional)' : 'Program / Group (Optional)'}
                                </Label>
                                <Input
                                    id="program"
                                    className="h-12 bg-background/50"
                                    placeholder={reason === 'charity' ? "e.g. West Coast Division" : "e.g. Marching Band, Football Team"}
                                    value={programName}
                                    onChange={(e) => setProgramName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Organization Logo (Optional)</Label>
                                <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-xl border-muted hover:border-primary/50 transition-colors bg-muted/5">
                                    <div
                                        className="w-16 h-16 rounded-lg bg-background border shadow-sm flex items-center justify-center cursor-pointer overflow-hidden relative group"
                                        onClick={() => logoInputRef.current?.click()}
                                    >
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Upload className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium mb-1">Click to upload logo</p>
                                        <p className="text-xs text-muted-foreground">Recommended: Square PNG or JPG</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={logoInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-3">
                                <Label htmlFor="title" className="text-base font-semibold">Name your fundraiser</Label>
                                <Input
                                    id="title"
                                    className="h-12 bg-background/50"
                                    placeholder="e.g. Helping John's Surgery, Art Supply Fund"
                                    value={campaignTitle}
                                    onChange={(e) => setCampaignTitle(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Give it a catchy title that tells people what it's for.</p>
                            </div>
                        </div>
                    )}

                    {/* Deadline Section - NEW */}
                    <div className="p-4 bg-muted/30 rounded-xl border border-muted/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Set a Deadline?</Label>
                                <p className="text-sm text-muted-foreground">Most campaigns run for 2-4 weeks</p>
                            </div>
                            <Switch
                                checked={hasDeadline}
                                onCheckedChange={setHasDeadline}
                            />
                        </div>

                        {hasDeadline && (
                            <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                                <Label className="text-sm font-medium mb-2 block">Campaign End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-12 bg-background/50",
                                                !deadline && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={deadline}
                                            onSelect={setDeadline}
                                            initialFocus
                                            disabled={(date) => date < new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </div>

                    <div className="pt-6">
                        <Button
                            className="w-full h-12 text-lg rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all font-bold"
                            disabled={loading || !goalAmount || (isOrgFlow ? !orgName : !campaignTitle) || (hasDeadline && !deadline)}
                            onClick={handleSubmit}
                        >
                            {loading ? 'Launching...' : '🚀 Launch Fundraiser'}
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
