import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Loader2, Send, MessageSquare, Users, Clock, Trash2, Filter
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Message {
  id: string;
  title: string;
  content: string;
  created_at: string;
  audience_filters?: any;
}

interface Campaign {
  id: string;
  name: string;
}

interface CommunicationCenterProps {
  campaignId?: string;
  initialTitle?: string;
  initialContent?: string;
}

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Participants' },
  { value: 'active', label: 'Active Participants (Joined)' },
  { value: 'zero_raised', label: 'Zero Raised ($0)' },
  { value: 'top_performers', label: 'Top Performers (>$100)' },
  { value: 'parents', label: 'Parents Only' },
];

interface MessageTemplate {
  id: string;
  label: string;
  subject: string;
  content: (campaignName: string, goalAmount: string) => string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'kickoff',
    label: '🚀 Campaign Kick-off',
    subject: 'Our Fundraiser is officially LIVE!',
    content: (name, goal) => `
      <h1>The wait is over!</h1>
      <p>Hi everyone,</p>
      <p>Our organization's fundraiser, <strong>${name}</strong>, is officially live and ready for your support. We are raising funds to support our mission, and every contribution makes a difference.</p>
      <p><strong>How to get started:</strong></p>
      <ol>
        <li>Login to your personal dashboard.</li>
        <li>Share your unique link with friends and family.</li>
        <li>Track your progress and climb the leaderboard!</li>
      </ol>
      <p>Thank you for your energy and support!</p>
    `
  },
  {
    id: 'parents',
    label: '👨‍👩‍👧 Parent Information',
    subject: 'Important: Helping with our Fundraiser',
    content: (name, goal) => `
      <p>Dear Parents,</p>
      <p>We are excited to announce the launch of our newest fundraising campaign for <strong>${name}</strong>! Our goal is to raise <strong>$${goal}</strong> to support our organization's needs.</p>
      <p>This year, we've moved to a fully digital platform to make everything easier for you. Your student has a customized dashboard where they can track their sales and share the campaign link.</p>
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Check your email for login credentials.</li>
        <li>Help your student share their link via text, email, or social media.</li>
        <li>Look out for weekly updates on our progress!</li>
      </ul>
      <p>Thank you for being part of our community.</p>
    `
  },
  {
    id: 'midway',
    label: '🎯 Midway Motivation',
    subject: 'Halfway there! Let\'s keep the momentum going!',
    content: (name, goal) => `
      <p>Hi Team,</p>
      <p>We are officially moving through our campaign for <strong>${name}</strong>! We've made great progress so far, but we still have a bit further to go to reach our goal of <strong>$${goal}</strong>.</p>
      <p>Did you know that just 1 extra sale from everyone would push us over the finish line?</p>
      <p><strong>Quick Challenge:</strong> Try to reach out to 3 people who haven't seen your link yet today. You'll be surprised how much support is just one message away!</p>
      <p>Keep up the great work!</p>
    `
  },
  {
    id: 'final_push',
    label: '⏳ Final Push (3 Days Left)',
    subject: 'Final 72 Hours: Let\'s reach our goal!',
    content: (name, goal) => `
      <p>This is it! There are only 3 days left in our fundraiser for <strong>${name}</strong>.</p>
      <p>We are so close to our goal of <strong>$${goal}</strong>. Now is the time for that final push. Let's make sure no one misses out on the chance to support us.</p>
      <p><strong>Action Item:</strong> Send one final "Last Chance" message to your inner circle. Sometimes people just need one last reminder!</p>
      <p>Let's finish strong!</p>
    `
  },
  {
    id: 'thank_you',
    label: '❤️ Thank You / Results',
    subject: 'Mission Accomplished! Thank You!',
    content: (name, goal) => `
      <h1>We did it!</h1>
      <p>Thank you so much to everyone who participated, shared, and donated during the <strong>${name}</strong> fundraiser.</p>
      <p>Because of your hard work, we've made huge strides toward our <strong>$${goal}</strong> goal!</p>
      <p>These funds will go directly towards our mission, and we couldn't have done it without this incredible community.</p>
      <p>We'll be sharing more updates on how the funds are being used soon. For now, enjoy the victory!</p>
    `
  }
];

// Register Custom Fonts
const Parchment = ReactQuill.Quill.import('parchment');
const Font = ReactQuill.Quill.import('formats/font');
// Cast to any to avoid TS errors with internal Quill API
(Font as any).whitelist = ['arial', 'roboto', 'playfair', 'montserrat', 'oswald', 'merriweather', 'lato', 'inconsolata'];
ReactQuill.Quill.register(Font as any, true);

// Custom Editor Styles
const editorStyles = `
  /* Font Families */
  #aurora-rich-editor .ql-font-roboto { font-family: 'Roboto', sans-serif; }
  #aurora-rich-editor .ql-font-playfair { font-family: 'Playfair Display', serif; }
  #aurora-rich-editor .ql-font-montserrat { font-family: 'Montserrat', sans-serif; }
  #aurora-rich-editor .ql-font-oswald { font-family: 'Oswald', sans-serif; }
  #aurora-rich-editor .ql-font-merriweather { font-family: 'Merriweather', serif; }
  #aurora-rich-editor .ql-font-lato { font-family: 'Lato', sans-serif; }
  #aurora-rich-editor .ql-font-inconsolata { font-family: 'Inconsolata', monospace; }

  /* Toolbar styling */
  #aurora-rich-editor .ql-toolbar.ql-snow {
    border: 1px solid hsl(var(--border)) !important;
    border-bottom: none !important;
    border-radius: var(--radius) var(--radius) 0 0 !important;
    background-color: hsl(var(--secondary) / 0.05) !important;
    padding: 16px !important;
    font-family: inherit;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  #aurora-rich-editor .ql-container.ql-snow {
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 0 0 var(--radius) var(--radius) !important;
    background-color: hsl(var(--background)) !important;
    font-family: inherit;
    font-size: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  }

  /* Formats groups */
  #aurora-rich-editor .ql-formats {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-right: 12px !important;
    padding-right: 12px;
    border-right: 1px solid hsl(var(--border));
  }
  #aurora-rich-editor .ql-formats:last-child {
    border-right: none;
  }

  /* Dropdowns */
  #aurora-rich-editor .ql-snow .ql-picker {
    color: hsl(var(--foreground));
    font-size: 13px;
    font-weight: 500;
    height: 36px !important;
  }
  #aurora-rich-editor .ql-snow .ql-picker-label {
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    height: 100% !important;
  }
  
  /* Make color and align pickers look like buttons */
  #aurora-rich-editor .ql-picker.ql-color,
  #aurora-rich-editor .ql-picker.ql-background,
  #aurora-rich-editor .ql-picker.ql-align {
    width: 36px !important;
  }
  #aurora-rich-editor .ql-picker.ql-color .ql-picker-label,
  #aurora-rich-editor .ql-picker.ql-background .ql-picker-label,
  #aurora-rich-editor .ql-picker.ql-align .ql-picker-label {
    padding: 0 !important;
  }
  
  #aurora-rich-editor .ql-snow .ql-picker-label:hover {
    background-color: hsl(var(--secondary) / 0.1);
    border-color: hsl(var(--secondary) / 0.2);
    color: hsl(var(--secondary-dark));
  }
  #aurora-rich-editor .ql-snow .ql-picker-label:hover .ql-stroke {
    stroke: hsl(var(--secondary-dark));
  }
  
  /* Buttons */
  #aurora-rich-editor .ql-snow.ql-toolbar button {
    height: 36px !important;
    width: 36px !important;
    border-radius: 8px !important;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #aurora-rich-editor .ql-snow.ql-toolbar button:hover {
    background-color: hsl(var(--secondary) / 0.1);
    color: hsl(var(--secondary-dark));
  }
  #aurora-rich-editor .ql-snow.ql-toolbar button.ql-active {
    background-color: hsl(var(--secondary) / 0.15);
    color: hsl(var(--secondary-dark));
  }
  
  /* Standardize Icon Sizes */
  #aurora-rich-editor .ql-snow.ql-toolbar button svg,
  #aurora-rich-editor .ql-picker-label svg {
    width: 22px !important;
    height: 22px !important;
  }
  #aurora-rich-editor .ql-snow.ql-toolbar button svg .ql-stroke,
  #aurora-rich-editor .ql-picker-label svg .ql-stroke {
    stroke-width: 1.8 !important;
  }
  
  /* Special handling for text dropdowns arrows */
  #aurora-rich-editor .ql-picker.ql-font .ql-picker-label svg,
  #aurora-rich-editor .ql-picker.ql-size .ql-picker-label svg,
  #aurora-rich-editor .ql-picker.ql-header .ql-picker-label svg {
    width: 16px !important;
    height: 16px !important;
  }

  /* Fix Tooltip position and appearance */
  #aurora-rich-editor .ql-snow .ql-tooltip {
    background-color: hsl(var(--popover)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: var(--radius) !important;
    box-shadow: var(--shadow-xl) !important;
    color: hsl(var(--foreground)) !important;
    padding: 10px 15px !important;
    z-index: 50 !important;
    left: 20px !important; /* Keep it left-aligned inside if it overflows */
    transition: opacity 0.2s ease-in-out;
  }
  #aurora-rich-editor .ql-snow .ql-tooltip input[type=text] {
    background-color: hsl(var(--background)) !important;
    border: 1px solid hsl(var(--border)) !important;
    color: hsl(var(--foreground)) !important;
    border-radius: 4px !important;
    padding: 4px 8px !important;
    font-size: 13px !important;
  }
  #aurora-rich-editor .ql-snow .ql-tooltip a.ql-action {
    background-color: hsl(var(--primary)) !important;
    color: white !important;
    padding: 4px 12px !important;
    border-radius: 4px !important;
    text-decoration: none !important;
    margin-left: 10px !important;
    font-weight: 500 !important;
  }
  #aurora-rich-editor .ql-snow .ql-tooltip a.ql-remove {
    margin-left: 8px !important;
    color: hsl(var(--destructive)) !important;
    font-size: 12px !important;
    opacity: 0.7;
  }
  #aurora-rich-editor .ql-snow .ql-tooltip a.ql-remove:hover {
    opacity: 1;
    text-decoration: underline !important;
  }

  /* Icons */
  #aurora-rich-editor .ql-snow .ql-stroke {
    stroke: hsl(var(--muted-foreground));
    stroke-width: 1.5;
  }
  #aurora-rich-editor .ql-snow .ql-fill {
    fill: hsl(var(--muted-foreground));
  }
  
  /* Active/Hover Icon States */
  #aurora-rich-editor .ql-snow.ql-toolbar button:hover .ql-stroke,
  #aurora-rich-editor .ql-snow.ql-toolbar button:focus .ql-stroke,
  #aurora-rich-editor .ql-snow.ql-toolbar button.ql-active .ql-stroke,
  #aurora-rich-editor .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke,
  #aurora-rich-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke {
    stroke: hsl(var(--secondary-dark)) !important;
  }
  
  #aurora-rich-editor .ql-snow.ql-toolbar button:hover .ql-fill,
  #aurora-rich-editor .ql-snow.ql-toolbar button:focus .ql-fill,
  #aurora-rich-editor .ql-snow.ql-toolbar button.ql-active .ql-fill,
  #aurora-rich-editor .ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill,
  #aurora-rich-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill {
    fill: hsl(var(--secondary-dark)) !important;
  }

  /* Dropdown Menus */
  #aurora-rich-editor .ql-snow .ql-picker-options {
    background-color: hsl(var(--popover));
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    padding: 6px;
  }
  #aurora-rich-editor .ql-snow .ql-picker-options .ql-picker-item {
    color: hsl(var(--foreground));
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 13px;
  }
  #aurora-rich-editor .ql-snow .ql-picker-options .ql-picker-item:hover {
    background-color: hsl(var(--secondary) / 0.1);
    color: hsl(var(--secondary-dark));
  }
  
  /* Font Dropdown Items */
  #aurora-rich-editor .ql-picker-item[data-value="roboto"]::before { content: "Roboto" !important; font-family: 'Roboto'; }
  #aurora-rich-editor .ql-picker-label[data-value="roboto"]::before { content: "Roboto" !important; font-family: 'Roboto'; }
  
  #aurora-rich-editor .ql-picker-item[data-value="playfair"]::before { content: "Playfair" !important; font-family: 'Playfair Display'; }
  #aurora-rich-editor .ql-picker-label[data-value="playfair"]::before { content: "Playfair" !important; font-family: 'Playfair Display'; }
  
  #aurora-rich-editor .ql-picker-item[data-value="montserrat"]::before { content: "Montserrat" !important; font-family: 'Montserrat'; }
  #aurora-rich-editor .ql-picker-label[data-value="montserrat"]::before { content: "Montserrat" !important; font-family: 'Montserrat'; }
  
  #aurora-rich-editor .ql-picker-item[data-value="oswald"]::before { content: "Oswald" !important; font-family: 'Oswald'; }
  #aurora-rich-editor .ql-picker-label[data-value="oswald"]::before { content: "Oswald" !important; font-family: 'Oswald'; }
  
  #aurora-rich-editor .ql-picker-item[data-value="merriweather"]::before { content: "Merriweather" !important; font-family: 'Merriweather'; }
  #aurora-rich-editor .ql-picker-label[data-value="merriweather"]::before { content: "Merriweather" !important; font-family: 'Merriweather'; }
  
  #aurora-rich-editor .ql-picker-item[data-value="lato"]::before { content: "Lato" !important; font-family: 'Lato'; }
  #aurora-rich-editor .ql-picker-label[data-value="lato"]::before { content: "Lato" !important; font-family: 'Lato'; }
  
  #aurora-rich-editor .ql-picker-label[data-value="inconsolata"]::before { content: "Inconsolata" !important; font-family: 'Inconsolata'; }
`;

export function CommunicationCenter({ campaignId, initialTitle, initialContent }: CommunicationCenterProps) {
  const { user } = useAuth();

  // Inject styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = editorStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(campaignId || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState(initialTitle || '');
  const [content, setContent] = useState(initialContent || '');
  const [participantCount, setParticipantCount] = useState(0);
  const [audience, setAudience] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    fetchData();
  }, [campaignId, user]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchMessages(selectedCampaign);
      fetchParticipantCount(selectedCampaign, audience);
    }
  }, [selectedCampaign, audience]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch campaigns for this admin
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('id, name, goal_amount, description')
        .eq('organization_admin_id', user.id)
        .order('created_at', { ascending: false });

      setCampaigns(campaignsData || []);

      if (campaignId) {
        setSelectedCampaign(campaignId);
      } else if (campaignsData && campaignsData.length > 0 && !selectedCampaign) {
        setSelectedCampaign(campaignsData[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (campId: string) => {
    const { data } = await supabase
      .from('participant_messages')
      .select('*')
      .eq('campaign_id', campId)
      .order('created_at', { ascending: false });

    setMessages(data || []);
  };

  const fetchParticipantCount = async (campId: string, audienceFilter: string) => {
    let query = supabase
      .from('student_fundraisers') // Use student_fundraisers for stats filtering
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campId)
      .eq('is_active', true);

    if (audienceFilter === 'zero_raised') {
      query = query.eq('total_raised', 0);
    } else if (audienceFilter === 'top_performers') {
      query = query.gt('total_raised', 100);
    }
    // Note: 'parents' filtering would require role or email checks not implemented in this MVP query

    const { count } = await query;
    setParticipantCount(count || 0);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const campaign = campaigns.find(c => c.id === selectedCampaign);
    const campaignName = campaign?.name || 'our fundraiser';
    const goalAmount = campaign?.goal_amount ? Number(campaign.goal_amount).toLocaleString() : 'our goal';

    setTitle(template.subject);
    setContent(template.content(campaignName, goalAmount));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!selectedCampaign) {
      toast.error('Please select a campaign');
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from('participant_messages')
        .insert({
          campaign_id: selectedCampaign,
          title: title.trim(),
          content: content.trim(), // Rich text content
          sent_by: user?.id,
          audience_filters: { type: audience }
        });

      if (error) throw error;

      toast.success(`Message sent to ${participantCount} participants!`);
      setTitle('');
      setContent('');
      setSelectedTemplate(''); // Reset template selection
      fetchMessages(selectedCampaign);
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('participant_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Message deleted');
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Selector (if not passed as prop) */}
      {!campaignId && campaigns.length > 1 && (
        <div className="space-y-2">
          <Label>Select Campaign</Label>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            {campaigns.map(camp => (
              <option key={camp.id} value={camp.id}>{camp.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Message */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Message
            </CardTitle>
            <CardDescription>
              Create a rich message to engage your fundraisers.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <form onSubmit={handleSend} className="space-y-4 h-full flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <div className="flex gap-2 items-center">
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIENCE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap min-w-[100px]">
                    <Users className="w-4 h-4" />
                    <span>{participantCount} users</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TEMPLATES.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Great job this week!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={sending}
                />
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <Label htmlFor="content">Message</Label>
                <div id="aurora-rich-editor" className="flex-1 bg-background rounded-md flex flex-col min-h-[350px]">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    className="flex-1 flex flex-col [&>.ql-container]:flex-1 [&>.ql-editor]:min-h-[250px]"
                    modules={{
                      toolbar: [
                        [{ 'font': ['arial', 'roboto', 'playfair', 'montserrat', 'oswald', 'merriweather', 'lato', 'inconsolata'] }],
                        [{ 'size': ['small', false, 'large', 'huge'] }],
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'script': 'sub' }, { 'script': 'super' }],
                        [{ 'align': [] }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                        ['blockquote', 'code-block'],
                        ['link', 'image', 'video'],
                        ['clean']
                      ],
                      clipboard: {
                        matchVisual: false,
                      }
                    }}
                    formats={[
                      'font', 'size', 'header',
                      'bold', 'italic', 'underline', 'strike',
                      'color', 'background',
                      'script', 'align',
                      'list', 'bullet', 'indent',
                      'blockquote', 'code-block',
                      'link', 'image', 'video'
                    ]}
                  />
                </div>
                {/* Spacer for Quill toolbar */}
                <div className="h-10"></div>
              </div>

              <Button type="submit" className="w-full mt-auto" disabled={sending || participantCount === 0}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to {participantCount} Participants
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Message History */}
        <Card className="h-full max-h-[800px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message History
            </CardTitle>
            <CardDescription>
              Previously sent broadcasts
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground h-full flex flex-col justify-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No messages sent yet</p>
              </div>
            ) : (
              <div className="space-y-3 h-full overflow-y-auto pr-2">
                {messages.map((message) => (
                  <div key={message.id} className="p-4 rounded-lg bg-muted/50 border hover:bg-muted/80 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-sm truncate pr-2">{message.title}</p>
                          {message.audience_filters?.type && (
                            <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">
                              {AUDIENCE_OPTIONS.find(o => o.value === message.audience_filters.type)?.label || message.audience_filters.type}
                            </span>
                          )}
                        </div>

                        <div
                          className="text-sm text-muted-foreground line-clamp-2 prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: message.content }}
                        />

                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0 -mr-2 -mt-2 opacity-50 hover:opacity-100">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the message from participant dashboards.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(message.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
