import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, Star, MessageSquare, Heart } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  organization_name: string;
}

export default function PublicSurvey() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    satisfactionRating: 0,
    wouldRecommend: null as boolean | null,
    feedback: '',
    improvementSuggestions: '',
    preferredUpdateFrequency: '',
  });

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, organization_name')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Campaign not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.name) {
      toast.error('Please provide your name and email');
      return;
    }

    if (formData.satisfactionRating === 0) {
      toast.error('Please provide a satisfaction rating');
      return;
    }

    setSubmitting(true);

    try {
      // First, find or create donor record
      let donorId: string;
      
      const { data: existingDonor } = await supabase
        .from('donors')
        .select('id')
        .eq('email', formData.email)
        .eq('campaign_id', campaignId)
        .single();

      if (existingDonor) {
        donorId = existingDonor.id;
      } else {
        const { data: newDonor, error: createError } = await supabase
          .from('donors')
          .insert({
            campaign_id: campaignId,
            email: formData.email,
            name: formData.name,
            segment: 'first_time',
          })
          .select('id')
          .single();

        if (createError) throw createError;
        donorId = newDonor.id;
      }

      // Submit survey response
      const { error: surveyError } = await supabase
        .from('donor_surveys')
        .insert({
          campaign_id: campaignId,
          donor_id: donorId,
          satisfaction_rating: formData.satisfactionRating,
          would_recommend: formData.wouldRecommend,
          feedback: formData.feedback || null,
          improvement_suggestions: formData.improvementSuggestions || null,
          preferred_update_frequency: formData.preferredUpdateFrequency || null,
        });

      if (surveyError) throw surveyError;

      // Update donor communication preference if provided
      if (formData.preferredUpdateFrequency) {
        await supabase
          .from('donors')
          .update({ communication_preference: formData.preferredUpdateFrequency })
          .eq('id', donorId);
      }

      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (error: any) {
      console.error('Error submitting survey:', error);
      toast.error(error.message || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-tight py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <div className="container-tight py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Survey Not Found</h1>
          <p className="text-muted-foreground">This survey link may be invalid or expired.</p>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="container-tight py-12">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-6">
                Your feedback helps us improve our fundraising efforts and better serve our community.
              </p>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Heart className="h-5 w-5" />
                <span className="font-medium">Your support means everything to us</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-tight py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Share Your Feedback</CardTitle>
            <CardDescription>
              Help {campaign.organization_name} improve the {campaign.name} fundraiser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Satisfaction Rating */}
              <div className="space-y-3">
                <Label>How satisfied are you with your experience? *</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, satisfactionRating: rating })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.satisfactionRating >= rating
                          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
                          : 'border-muted hover:border-yellow-200'
                      }`}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          formData.satisfactionRating >= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.satisfactionRating === 0 && 'Click to rate'}
                  {formData.satisfactionRating === 1 && 'Very Unsatisfied'}
                  {formData.satisfactionRating === 2 && 'Unsatisfied'}
                  {formData.satisfactionRating === 3 && 'Neutral'}
                  {formData.satisfactionRating === 4 && 'Satisfied'}
                  {formData.satisfactionRating === 5 && 'Very Satisfied'}
                </p>
              </div>

              {/* Would Recommend */}
              <div className="space-y-3">
                <Label>Would you recommend us to others?</Label>
                <RadioGroup
                  value={formData.wouldRecommend?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, wouldRecommend: value === 'true' })}
                >
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="true" id="yes" />
                      <Label htmlFor="yes" className="cursor-pointer">Yes, definitely!</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="false" id="no" />
                      <Label htmlFor="no" className="cursor-pointer">Not at this time</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Update Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">How often would you like to hear from us?</Label>
                <Select
                  value={formData.preferredUpdateFrequency}
                  onValueChange={(value) => setFormData({ ...formData, preferredUpdateFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly updates</SelectItem>
                    <SelectItem value="monthly">Monthly updates</SelectItem>
                    <SelectItem value="quarterly">Quarterly updates</SelectItem>
                    <SelectItem value="major_only">Major announcements only</SelectItem>
                    <SelectItem value="never">Prefer not to receive emails</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback">What did you enjoy most about supporting this fundraiser?</Label>
                <Textarea
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="Share your positive experiences..."
                  rows={3}
                />
              </div>

              {/* Improvement Suggestions */}
              <div className="space-y-2">
                <Label htmlFor="improvements">How can we improve?</Label>
                <Textarea
                  id="improvements"
                  value={formData.improvementSuggestions}
                  onChange={(e) => setFormData({ ...formData, improvementSuggestions: e.target.value })}
                  placeholder="We value your suggestions..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
