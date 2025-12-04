import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProfileData {
  full_name: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  interests: string[] | null;
  communication_preference: string | null;
  children_names: string[] | null;
}

export function ProfileEditor() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [newChildName, setNewChildName] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } else if (data) {
      setProfile(data as ProfileData);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        bio: profile.bio,
        interests: profile.interests,
        communication_preference: profile.communication_preference,
        children_names: profile.children_names
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile saved successfully');
    }
    setSaving(false);
  };

  const addInterest = () => {
    if (!newInterest.trim() || !profile) return;
    setProfile({
      ...profile,
      interests: [...(profile.interests || []), newInterest.trim()]
    });
    setNewInterest('');
  };

  const removeInterest = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      interests: (profile.interests || []).filter((_, i) => i !== index)
    });
  };

  const addChildName = () => {
    if (!newChildName.trim() || !profile) return;
    setProfile({
      ...profile,
      children_names: [...(profile.children_names || []), newChildName.trim()]
    });
    setNewChildName('');
  };

  const removeChildName = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      children_names: (profile.children_names || []).filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Edit Profile
        </CardTitle>
        <CardDescription>Update your personal information and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Your phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="communication">Communication Preference</Label>
            <Select
              value={profile.communication_preference || 'email'}
              onValueChange={(value) => setProfile({ ...profile, communication_preference: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="text">Text Message</SelectItem>
                <SelectItem value="mail">Physical Mail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell us a little about yourself..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Interests</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(profile.interests || []).map((interest, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {interest}
                <button onClick={() => removeInterest(index)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add an interest..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addInterest}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Children's Names (optional)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(profile.children_names || []).map((name, index) => (
              <Badge key={index} variant="outline" className="gap-1">
                {name}
                <button onClick={() => removeChildName(index)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="Add a child's name..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChildName())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addChildName}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ProfileEditor;
