import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Plus, Trash2, ArrowLeft, ArrowRight, Check, CalendarIcon, ShoppingBag, Trophy, Footprints, Music, Bike, Waves, Target, Zap, SkipForward, Mic, BookOpen, Gamepad2, Sparkles, ChefHat, PawPrint, Scissors, X, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  average_raised_per_student: number | null;
}

interface StudentEntry {
  name: string;
  email: string;
}

interface CreateCampaignWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  editingCampaign?: any;
}

type FundraiserType = 'product' | 'walkathon' | 'readathon' | 'jogathon' | 'other_athon';
type AthonDonationType = 'pledge_per_unit' | 'flat_donation';
type FundraiserCategory = 'product' | 'athon' | null;

const ATHON_TYPES = [
  {
    value: 'walkathon',
    label: 'Walk-a-thon',
    icon: Footprints,
    description: 'Participants walk a course to raise pledges based on distance walked or time spent. Popular and easy to organize for all ages.',
    defaultUnit: 'lap',
    avgRaised: 120,
    color: 'from-emerald-500 to-green-600',
    successGuide: [
      { title: 'Set Your Date & Venue', description: 'Choose a date 4-6 weeks out. Secure a walking route at a local park, school track, or community center.' },
      { title: 'Create Pledge Forms', description: 'Design simple pledge forms where sponsors can pledge per lap or flat donations. Make digital options available.' },
      { title: 'Recruit Participants', description: 'Send invitations to students/participants. Set personal fundraising goals for each walker.' },
      { title: 'Promote the Event', description: 'Use social media, flyers, and email to spread the word. Encourage participants to share their fundraising pages.' },
      { title: 'Plan Event Day Logistics', description: 'Arrange for lap counters, water stations, first aid, and volunteers. Create a fun atmosphere with music.' },
      { title: 'Collect & Celebrate', description: 'Follow up on pledges within 2 weeks. Celebrate top fundraisers and share total results!' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Dance-a-thon',
    icon: Music,
    description: 'Participants dance for extended periods (e.g., 12-48 hours), often in themed events or marathons.',
    defaultUnit: 'hour',
    avgRaised: 150,
    color: 'from-pink-500 to-rose-600',
    successGuide: [
      { title: 'Choose Theme & Duration', description: 'Pick an exciting theme (decades, disco, etc.) and decide on duration (4-12 hours works well for most groups).' },
      { title: 'Book a Venue', description: 'Secure a space with good flooring, sound system access, and room for all participants plus spectators.' },
      { title: 'Create DJ Playlist', description: 'Prepare hours of upbeat music or hire a DJ. Mix in crowd favorites and dance challenges.' },
      { title: 'Set Up Sponsorship Levels', description: 'Create per-hour pledges or flat donation tiers. Offer incentives for top fundraisers.' },
      { title: 'Plan Rest & Refreshments', description: 'Schedule short breaks, provide water and snacks. Have medical volunteers on standby.' },
      { title: 'Document & Celebrate', description: 'Take photos/videos throughout. Announce winners and total raised at the finale!' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Bike-a-thon',
    icon: Bike,
    description: 'Similar to walk-a-thons but cycling instead, often with routes mapped out for participants.',
    defaultUnit: 'mile',
    avgRaised: 140,
    color: 'from-blue-500 to-cyan-600',
    successGuide: [
      { title: 'Map Your Route', description: 'Plan a safe cycling route with multiple distance options (5, 10, 25 miles). Get necessary permits.' },
      { title: 'Safety First', description: 'Require helmets, plan rest stops, and have support vehicles. Brief all cyclists on safety rules.' },
      { title: 'Registration System', description: 'Create online registration with waiver signing. Collect emergency contacts for all riders.' },
      { title: 'Recruit & Train Volunteers', description: 'You\'ll need route marshals, registration helpers, and SAG wagon drivers.' },
      { title: 'Sponsorship Collection', description: 'Set up per-mile pledges. Provide participants with shareable fundraising pages.' },
      { title: 'Event Day Execution', description: 'Start with a safety briefing, stagger starts if needed, and have a celebration at the finish!' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Swim-a-thon',
    icon: Waves,
    description: 'Participants swim laps, fundraising based on distances swum.',
    defaultUnit: 'lap',
    avgRaised: 130,
    color: 'from-cyan-500 to-teal-600',
    successGuide: [
      { title: 'Secure Pool Time', description: 'Book lanes at a local pool. Most facilities offer group rates for fundraising events.' },
      { title: 'Set Lap Goals', description: 'Create age-appropriate lap goals. Allow relay teams for younger swimmers.' },
      { title: 'Lifeguard Coordination', description: 'Ensure certified lifeguards are present. Brief them on your event format.' },
      { title: 'Lane Organization', description: 'Assign lanes by speed/ability. Have lap counters for each lane.' },
      { title: 'Pledge Collection', description: 'Use per-lap pledges with minimum guarantees. Online collection makes follow-up easier.' },
      { title: 'Recognition', description: 'Award certificates for participation, most laps, and top fundraisers!' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Bowl-a-thon',
    icon: Target,
    description: 'Bowling events where individuals or teams raise money through participation.',
    defaultUnit: 'game',
    avgRaised: 100,
    color: 'from-orange-500 to-amber-600',
    successGuide: [
      { title: 'Partner with Bowling Alley', description: 'Negotiate group rates and lane reservations. Many alleys offer fundraiser packages.' },
      { title: 'Team Formation', description: 'Create teams of 4-5 bowlers. Allow mixed skill levels to keep it fun and inclusive.' },
      { title: 'Sponsorship Structure', description: 'Flat per-game pledges work best. Add bonus donations for strikes and spares.' },
      { title: 'Event Extras', description: 'Add costume contests, raffles, and prizes to increase engagement and donations.' },
      { title: 'Food & Beverages', description: 'Coordinate with the alley or bring your own refreshments. Add a bake sale if allowed.' },
      { title: 'Score & Celebrate', description: 'Track scores publicly, announce winners, and tally total raised before everyone leaves!' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Jump-a-thon',
    icon: Zap,
    description: 'Participants jump (often on trampolines) for a set time to collect pledges.',
    defaultUnit: 'minute',
    avgRaised: 90,
    color: 'from-yellow-500 to-orange-600',
    successGuide: [
      { title: 'Venue Selection', description: 'Partner with a trampoline park or rent equipment. Ensure adequate space and safety padding.' },
      { title: 'Time-Based Goals', description: 'Set jumping duration goals (30-60 minutes total). Include rest breaks for safety.' },
      { title: 'Safety Waivers', description: 'Require signed waivers. Have adult supervisors and first aid ready.' },
      { title: 'Energy Management', description: 'Start with warmups, plan water breaks, and keep music playing to maintain energy.' },
      { title: 'Per-Minute Pledges', description: 'Sponsors pledge per minute jumped. Cap the maximum to make it affordable for sponsors.' },
      { title: 'Cool Down & Celebrate', description: 'End with stretching, announce results, and hand out participation certificates!' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Skate-a-thon',
    icon: SkipForward,
    description: 'Participants skate for distance or time to fundraise.',
    defaultUnit: 'lap',
    avgRaised: 110,
    color: 'from-violet-500 to-purple-600',
    successGuide: [
      { title: 'Rink Rental', description: 'Book a roller or ice rink. Many offer special rates for fundraising events.' },
      { title: 'Skill Levels', description: 'Welcome all skill levels. Have helpers available for beginners.' },
      { title: 'Safety Equipment', description: 'Require helmets and pads for roller skating. Provide rental equipment if possible.' },
      { title: 'Lap Tracking', description: 'Use wristbands or stamps to track laps. Post a live leaderboard for excitement.' },
      { title: 'Entertainment', description: 'DJ music, disco lights, and skating games keep the energy high.' },
      { title: 'Awards Ceremony', description: 'End with prizes for most laps, best costume, and top fundraiser!' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Sing-a-thon',
    icon: Mic,
    description: 'Participants sing or perform music for pledges during a set time period.',
    defaultUnit: 'song',
    avgRaised: 95,
    color: 'from-red-500 to-pink-600',
    successGuide: [
      { title: 'Format Decision', description: 'Choose format: karaoke, choir marathon, or talent show style. Each has different appeal.' },
      { title: 'Equipment Setup', description: 'Arrange microphones, speakers, and screens for lyrics. Test everything beforehand.' },
      { title: 'Song Selection', description: 'Create a diverse song list. Let participants choose or assign songs based on donations.' },
      { title: 'Audience Engagement', description: 'Encourage audience participation and donations for song requests or dedications.' },
      { title: 'Performance Schedule', description: 'Create time slots for performers. Keep the show moving with smooth transitions.' },
      { title: 'Grand Finale', description: 'End with a group song! Announce totals and thank all performers and donors.' }
    ]
  },
  {
    value: 'readathon',
    label: 'Read-a-thon',
    icon: BookOpen,
    description: 'Participants read and log pages or books to collect sponsorships, popular with schools.',
    defaultUnit: 'book',
    avgRaised: 95,
    color: 'from-indigo-500 to-blue-600',
    successGuide: [
      { title: 'Set Reading Period', description: 'Typically 2-4 weeks. Decide if counting pages, books, or minutes read.' },
      { title: 'Create Reading Logs', description: 'Provide easy-to-use logs for tracking. Digital apps make this even easier.' },
      { title: 'Age-Appropriate Goals', description: 'Set realistic targets by grade level. Include read-aloud time for younger kids.' },
      { title: 'Library Partnership', description: 'Partner with school or public library for book access and reading recommendations.' },
      { title: 'Mid-Event Updates', description: 'Share progress updates to keep motivation high. Highlight top readers.' },
      { title: 'Celebration Event', description: 'Host a reading celebration with author visit, book swap, or reading party!' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Game-a-thon',
    icon: Gamepad2,
    description: 'Gaming marathons where players raise funds based on playtime or achievements.',
    defaultUnit: 'hour',
    avgRaised: 120,
    color: 'from-purple-500 to-indigo-600',
    successGuide: [
      { title: 'Platform & Games', description: 'Choose games that allow multiplayer or streaming. Popular games attract more sponsors.' },
      { title: 'Streaming Setup', description: 'Set up Twitch or YouTube streaming. Viewers can donate in real-time.' },
      { title: 'Duration Planning', description: '12-24 hour events are popular. Plan shifts if doing longer marathons.' },
      { title: 'Donation Goals', description: 'Create milestone goals that unlock special gaming challenges or rewards.' },
      { title: 'Viewer Engagement', description: 'Interact with chat, do donation shoutouts, and offer incentives for donations.' },
      { title: 'Health & Safety', description: 'Take breaks, stay hydrated, and stretch. End with a highlight reel and thank donors!' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Clean-a-thon',
    icon: Sparkles,
    description: 'Volunteers collect donations for hours or areas cleaned, often environmental.',
    defaultUnit: 'bag',
    avgRaised: 85,
    color: 'from-green-500 to-emerald-600',
    successGuide: [
      { title: 'Identify Areas', description: 'Partner with local parks, beaches, or neighborhoods. Get necessary permissions.' },
      { title: 'Supplies Preparation', description: 'Gather trash bags, gloves, grabbers, and safety vests. Many organizations donate supplies.' },
      { title: 'Volunteer Sign-Up', description: 'Create shifts or zones. Provide orientation on safety and sorting recyclables.' },
      { title: 'Sponsorship Model', description: 'Per-bag collected or per-hour volunteered. Share before/after photos with sponsors.' },
      { title: 'Documentation', description: 'Take photos and track bags collected. This data helps with future grant applications.' },
      { title: 'Impact Celebration', description: 'Share environmental impact stats. Thank volunteers with certificates or small gifts!' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Cook-a-thon',
    icon: ChefHat,
    description: 'Participants cook, compete, or share recipes as fundraising.',
    defaultUnit: 'dish',
    avgRaised: 105,
    color: 'from-amber-500 to-yellow-600',
    successGuide: [
      { title: 'Format Choice', description: 'Competition, cooking marathon, or recipe collection? Each engages differently.' },
      { title: 'Kitchen Logistics', description: 'Secure a commercial kitchen or coordinate home cooking. Ensure food safety compliance.' },
      { title: 'Ingredient Sourcing', description: 'Get donations from local grocers or set a budget per participant.' },
      { title: 'Judging Panel', description: 'Recruit local chefs or food bloggers. Create categories like taste, presentation, creativity.' },
      { title: 'Tasting Event', description: 'Sell tasting tickets to the public. Add a silent auction of signature dishes.' },
      { title: 'Recipe Book', description: 'Compile recipes into a cookbook to sell! Digital versions are cost-effective.' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Pet Walk-a-thon',
    icon: PawPrint,
    description: 'Participants walk with pets to raise money for animal causes.',
    defaultUnit: 'lap',
    avgRaised: 115,
    color: 'from-teal-500 to-cyan-600',
    successGuide: [
      { title: 'Pet-Friendly Route', description: 'Choose a safe route with shade, water access, and waste stations.' },
      { title: 'Registration Requirements', description: 'Require vaccination records, leashes, and signed liability waivers.' },
      { title: 'Pet Categories', description: 'Create categories: best costume, longest ears, best trick, etc.' },
      { title: 'Vendor Partnerships', description: 'Invite pet stores, groomers, and vets for booths and samples.' },
      { title: 'Water Stations', description: 'Provide water bowls along the route. Have treats available at the finish.' },
      { title: 'Photo Booth', description: 'Set up a pet photo booth! Share photos on social media to boost donations.' }
    ]
  },
  {
    value: 'other_athon',
    label: 'Knit-a-thon',
    icon: Scissors,
    description: 'Participants knit or crochet items while raising funds.',
    defaultUnit: 'hour',
    avgRaised: 80,
    color: 'from-rose-500 to-red-600',
    successGuide: [
      { title: 'Project Selection', description: 'Choose projects like scarves, hats, or blankets. Have patterns ready for all skill levels.' },
      { title: 'Materials Sourcing', description: 'Get yarn donations or set up a supply swap. Provide needles for beginners.' },
      { title: 'Workshop Sessions', description: 'Host learn-to-knit sessions leading up to the event. Build community early.' },
      { title: 'Marathon Format', description: 'Set up a cozy space for 4-8 hours of knitting. Include tea, snacks, and good conversation.' },
      { title: 'Item Donations', description: 'Finished items can be donated to shelters or sold at a craft fair.' },
      { title: 'Showcase & Celebrate', description: 'Display finished projects, share stories, and announce total hours knitted!' }
    ]
  },
  {
    value: 'jogathon',
    label: 'Jog-a-thon',
    icon: Trophy,
    description: 'Sponsors pledge per lap or distance jogged. Great for athletic programs.',
    defaultUnit: 'lap',
    avgRaised: 110,
    color: 'from-sky-500 to-blue-600',
    successGuide: [
      { title: 'Track Preparation', description: 'Secure a running track or measured course. Mark clear start/finish lines and lap counters.' },
      { title: 'Warm-Up Plan', description: 'Schedule group warm-ups with stretching. Include music to energize participants.' },
      { title: 'Pace Groups', description: 'Create pace groups for different fitness levels. No one should feel left behind.' },
      { title: 'Hydration Stations', description: 'Set up water stations. Have sports drinks available for longer events.' },
      { title: 'Real-Time Updates', description: 'Post lap counts publicly. Cheer on runners as they hit milestones.' },
      { title: 'Cool Down & Awards', description: 'Group cool-down, announce results, and celebrate with healthy snacks!' }
    ]
  },
];

export function CreateCampaignWizard({ onComplete, onCancel, editingCampaign }: CreateCampaignWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Basic Info
  const [name, setName] = useState(editingCampaign?.name || '');
  const [organizationName, setOrganizationName] = useState(editingCampaign?.organization_name || '');
  const [description, setDescription] = useState(editingCampaign?.description || '');
  const [goalAmount, setGoalAmount] = useState(editingCampaign?.goal_amount?.toString() || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    editingCampaign?.start_date ? new Date(editingCampaign.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    editingCampaign?.end_date ? new Date(editingCampaign.end_date) : undefined
  );

  // Step 2: Fundraiser Type
  const [fundraiserCategory, setFundraiserCategory] = useState<FundraiserCategory>(
    editingCampaign?.fundraiser_type === 'product' ? 'product' : 
    editingCampaign?.fundraiser_type ? 'athon' : null
  );
  const [fundraiserType, setFundraiserType] = useState<FundraiserType>(
    editingCampaign?.fundraiser_type || 'product'
  );
  const [selectedAthonLabel, setSelectedAthonLabel] = useState<string>(
    editingCampaign?.athon_unit_name ? 
      ATHON_TYPES.find(a => a.defaultUnit === editingCampaign.athon_unit_name)?.label || '' : ''
  );
  const [athonDonationType, setAthonDonationType] = useState<AthonDonationType>(
    editingCampaign?.athon_donation_type || 'pledge_per_unit'
  );
  const [athonUnitName, setAthonUnitName] = useState(editingCampaign?.athon_unit_name || '');
  const [showSuccessGuide, setShowSuccessGuide] = useState(false);
  const [selectedGuideAthon, setSelectedGuideAthon] = useState<typeof ATHON_TYPES[0] | null>(null);

  // Step 3: Products (for product type)
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Step 4: Students
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');

  useEffect(() => {
    if (fundraiserType === 'product') {
      fetchProducts();
    }
  }, [fundraiserType]);

  useEffect(() => {
    if (editingCampaign?.id) {
      fetchExistingStudents();
      fetchSelectedProducts();
    }
  }, [editingCampaign]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, average_raised_per_student')
      .eq('is_active', true);

    if (!error && data) {
      setProducts(data);
    }
  };

  const fetchExistingStudents = async () => {
    if (!editingCampaign?.id) return;
    const { data } = await supabase
      .from('student_invitations')
      .select('student_name, student_email')
      .eq('campaign_id', editingCampaign.id);

    if (data) {
      setStudents(data.map(s => ({ name: s.student_name, email: s.student_email })));
    }
  };

  const fetchSelectedProducts = async () => {
    if (!editingCampaign?.id) return;
    const { data } = await supabase
      .from('campaign_products')
      .select('product_id')
      .eq('campaign_id', editingCampaign.id);

    if (data) {
      setSelectedProductIds(data.map(p => p.product_id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const newStudents: StudentEntry[] = jsonData.map((row: any) => ({
        name: row.name || row.Name || row.student_name || row['Student Name'] || '',
        email: row.email || row.Email || row.student_email || row['Student Email'] || '',
      })).filter(s => s.name && s.email);

      setStudents(prev => [...prev, ...newStudents]);
      toast.success(`Added ${newStudents.length} students from file`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file. Please use a valid CSV or Excel file.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addStudent = () => {
    if (!newStudentName || !newStudentEmail) {
      toast.error('Please enter both name and email');
      return;
    }

    if (students.some(s => s.email === newStudentEmail)) {
      toast.error('This email is already in the list');
      return;
    }

    setStudents(prev => [...prev, { name: newStudentName, email: newStudentEmail }]);
    setNewStudentName('');
    setNewStudentEmail('');
  };

  const removeStudent = (index: number) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async () => {
    if (!goalAmount) {
      toast.error('Goal amount is required');
      return;
    }

    setLoading(true);
    try {
      const campaignData = {
        name,
        organization_name: organizationName,
        description: description || null,
        goal_amount: Math.ceil(parseFloat(goalAmount)),
        start_date: startDate ? startDate.toISOString() : null,
        end_date: endDate ? endDate.toISOString() : null,
        fundraiser_type: fundraiserType,
        athon_donation_type: fundraiserType !== 'product' ? athonDonationType : null,
        athon_unit_name: fundraiserType !== 'product' ? athonUnitName : null,
        organization_admin_id: user?.id,
      };

      let campaignId: string;

      if (editingCampaign?.id) {
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);

        if (error) throw error;
        campaignId = editingCampaign.id;

        // Clear existing students and products
        await supabase.from('student_invitations').delete().eq('campaign_id', campaignId);
        await supabase.from('campaign_products').delete().eq('campaign_id', campaignId);
      } else {
        const { data, error } = await supabase
          .from('campaigns')
          .insert(campaignData)
          .select('id')
          .single();

        if (error) throw error;
        campaignId = data.id;
      }

      // Add selected products
      if (fundraiserType === 'product' && selectedProductIds.length > 0) {
        const productInserts = selectedProductIds.map(productId => ({
          campaign_id: campaignId,
          product_id: productId,
        }));
        await supabase.from('campaign_products').insert(productInserts);
      }

      // Add students
      if (students.length > 0) {
        const studentInserts = students.map(s => ({
          campaign_id: campaignId,
          student_name: s.name,
          student_email: s.email,
        }));
        await supabase.from('student_invitations').insert(studentInserts);
      }

      toast.success(editingCampaign ? 'Campaign updated successfully' : 'Campaign created successfully');
      onComplete();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return name && organizationName && goalAmount && startDate && endDate;
      case 2:
        if (fundraiserCategory === 'product') return true;
        if (fundraiserCategory === 'athon' && selectedAthonLabel && athonUnitName) return true;
        return false;
      case 3:
        if (fundraiserType !== 'product') return true;
        return selectedProductIds.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const totalSteps = fundraiserType === 'product' ? 4 : 3;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i + 1 === step
                  ? 'bg-primary text-primary-foreground'
                  : i + 1 < step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-12 h-0.5 ${i + 1 < step ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Enter the basic information for your fundraiser</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lincoln High School"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Program Type *</Label>
                <Input
                  id="org"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Marching Band"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your fundraiser..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Fundraising Goal *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="goal"
                  type="text"
                  value={goalAmount ? Number(goalAmount).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    // Only allow one decimal point
                    const parts = value.split('.');
                    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
                    setGoalAmount(sanitized);
                  }}
                  onBlur={() => {
                    // Round up on blur
                    if (goalAmount) {
                      setGoalAmount(Math.ceil(parseFloat(goalAmount)).toString());
                    }
                  }}
                  placeholder="10,000"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 items-center",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        // Clear end date if it's before the new start date
                        if (endDate && date && date > endDate) {
                          setEndDate(undefined);
                        }
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 items-center",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Fundraiser Type */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Fundraiser Type</CardTitle>
            <CardDescription>Choose the type of fundraiser you want to run</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phase 1: Product Sale vs A-Thon */}
            {!fundraiserCategory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Sale Card */}
                <button
                  type="button"
                  onClick={() => {
                    setFundraiserCategory('product');
                    setFundraiserType('product');
                  }}
                  className="group relative overflow-hidden rounded-2xl border-2 border-transparent bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-6 text-left transition-all hover:border-amber-400 hover:shadow-lg hover:shadow-amber-200/50 dark:hover:shadow-amber-900/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 opacity-0 transition-opacity group-hover:opacity-10" />
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Product Sale</h3>
                  <p className="text-muted-foreground mb-4">
                    Students sell products like cookie dough, candles, or gift items to raise funds.
                  </p>
                  <div className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
                    <span>~$150 avg. raised per student</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>

                {/* A-Thon Card */}
                <button
                  type="button"
                  onClick={() => setFundraiserCategory('athon')}
                  className="group relative overflow-hidden rounded-2xl border-2 border-transparent bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-6 text-left transition-all hover:border-violet-400 hover:shadow-lg hover:shadow-violet-200/50 dark:hover:shadow-violet-900/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-500 opacity-0 transition-opacity group-hover:opacity-10" />
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-lg">
                    <Trophy className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">A-Thon Event</h3>
                  <p className="text-muted-foreground mb-4">
                    Activity-based fundraising where sponsors pledge per unit of activity completed.
                  </p>
                  <div className="flex items-center text-violet-600 dark:text-violet-400 font-medium">
                    <span>14 event types to choose from</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              </div>
            )}

            {/* Phase 2: Product Sale selected - show confirmation */}
            {fundraiserCategory === 'product' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setFundraiserCategory(null)}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to options
                  </button>
                </div>
                <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-6">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg flex-shrink-0">
                      <ShoppingBag className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">Product Sale</h3>
                      <p className="text-muted-foreground">
                        You'll select specific products in the next step. Students will share their personalized pages where supporters can purchase items.
                      </p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-amber-500 flex-shrink-0" />
                  </div>
                </div>
              </div>
            )}

            {/* Phase 2: A-Thon selected - show all A-thon types */}
            {fundraiserCategory === 'athon' && !selectedAthonLabel && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setFundraiserCategory(null)}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to options
                  </button>
                </div>
                <p className="text-muted-foreground">Choose your A-Thon type:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ATHON_TYPES.map((athon) => {
                    const Icon = athon.icon;
                    return (
                      <button
                        key={athon.label}
                        type="button"
                        onClick={() => {
                          setSelectedAthonLabel(athon.label);
                          setFundraiserType(athon.value as FundraiserType);
                          setAthonUnitName(athon.defaultUnit);
                        }}
                        className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
                      >
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-10",
                          athon.color
                        )} />
                        <div className={cn(
                          "mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                          athon.color
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h4 className="font-semibold text-foreground mb-1">{athon.label}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{athon.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-primary font-medium">~${athon.avgRaised}/student</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGuideAthon(athon);
                              setShowSuccessGuide(true);
                            }}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                          >
                            View guide
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Phase 3: Specific A-Thon selected - show configuration */}
            {fundraiserCategory === 'athon' && selectedAthonLabel && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedAthonLabel('')}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Choose different A-Thon
                  </button>
                </div>
                
                {(() => {
                  const athon = ATHON_TYPES.find(a => a.label === selectedAthonLabel);
                  if (!athon) return null;
                  const Icon = athon.icon;
                  return (
                    <>
                      <div className={cn(
                        "rounded-2xl border-2 p-6",
                        `border-${athon.color.split('-')[1]}-400 bg-gradient-to-br ${athon.color.replace('from-', 'from-').replace('to-', 'to-')}/10`
                      )} style={{
                        borderColor: `hsl(var(--primary))`,
                        background: `linear-gradient(to bottom right, hsl(var(--primary) / 0.05), hsl(var(--primary) / 0.1))`
                      }}>
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg flex-shrink-0",
                            athon.color
                          )}>
                            <Icon className="h-7 w-7" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xl font-bold text-foreground mb-1">{athon.label}</h3>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedGuideAthon(athon);
                                  setShowSuccessGuide(true);
                                }}
                                className="text-sm text-primary hover:underline"
                              >
                                View Success Guide
                              </button>
                            </div>
                            <p className="text-muted-foreground text-sm">{athon.description}</p>
                          </div>
                          <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>Donation Type</Label>
                          <RadioGroup
                            value={athonDonationType}
                            onValueChange={(v) => setAthonDonationType(v as AthonDonationType)}
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div className="relative">
                                <RadioGroupItem value="pledge_per_unit" id="pledge" className="peer sr-only" />
                                <Label
                                  htmlFor="pledge"
                                  className="flex flex-col p-4 border rounded-lg cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                                >
                                  <span className="font-medium">Pledge per {athonUnitName || 'unit'}</span>
                                  <span className="text-xs text-muted-foreground">Sponsors pledge a $ amount per {athonUnitName || 'unit'} completed</span>
                                </Label>
                              </div>
                              <div className="relative">
                                <RadioGroupItem value="flat_donation" id="flat" className="peer sr-only" />
                                <Label
                                  htmlFor="flat"
                                  className="flex flex-col p-4 border rounded-lg cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                                >
                                  <span className="font-medium">Flat donations</span>
                                  <span className="text-xs text-muted-foreground">Sponsors give a one-time donation amount</span>
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit Name *</Label>
                          <Input
                            id="unit"
                            value={athonUnitName}
                            onChange={(e) => setAthonUnitName(e.target.value)}
                            placeholder={athon.defaultUnit}
                          />
                          <p className="text-xs text-muted-foreground">
                            This is what sponsors will pledge per (e.g., "${'{'}amount{'}'} per {athonUnitName || athon.defaultUnit}")
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success Guide Modal */}
      <Dialog open={showSuccessGuide} onOpenChange={setShowSuccessGuide}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedGuideAthon && (
                <>
                  <div className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                    selectedGuideAthon.color
                  )}>
                    <selectedGuideAthon.icon className="h-5 w-5" />
                  </div>
                  {selectedGuideAthon.label} Success Guide
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Follow these steps to run a successful {selectedGuideAthon?.label}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              {selectedGuideAthon?.successGuide.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br",
                    selectedGuideAthon.color
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowSuccessGuide(false)}>Got it!</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Step 3: Products (only for product type) */}
      {step === 3 && fundraiserType === 'product' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Products</CardTitle>
            <CardDescription>Choose which products students can sell</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Avg. Raised/Student</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell className="text-primary">
                      ${product.average_raised_per_student?.toFixed(2) || '0.00'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Step 3/4: Students */}
      {((step === 3 && fundraiserType !== 'product') || (step === 4 && fundraiserType === 'product')) && (
        <Card>
          <CardHeader>
            <CardTitle>Add Students</CardTitle>
            <CardDescription>
              Upload a CSV/Excel file or manually add students. They'll receive login emails when the fundraiser starts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload a CSV or Excel file with columns: name, email
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label>Or add students manually</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Student name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
                <Input
                  placeholder="Email address"
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                />
                <Button onClick={addStudent}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Student List */}
            {students.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStudent(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {students.length} student{students.length !== 1 ? 's' : ''} added
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        {step < totalSteps ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        )}
      </div>
    </div>
  );
}
