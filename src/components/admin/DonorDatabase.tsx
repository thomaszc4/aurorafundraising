import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, Plus, Mail, Download, Upload, Users, 
  Filter, MoreHorizontal, Edit, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Donor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  segment: string;
  total_donated: number;
  donation_count: number;
  first_donation_at?: string;
  last_donation_at?: string;
  is_thanked: boolean;
  marketing_consent: boolean;
  campaign_id: string;
  campaign?: { name: string };
  notes?: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

interface DonorDatabaseProps {
  onClose?: () => void;
}

export function DonorDatabase({ onClose }: DonorDatabaseProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterSegment, setFilterSegment] = useState('all');
  const [filterMarketing, setFilterMarketing] = useState('all');
  const [selectedDonors, setSelectedDonors] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    segment: 'first_time',
    notes: '',
    campaign_id: '',
    marketing_consent: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [donorsRes, campaignsRes] = await Promise.all([
        supabase
          .from('donors')
          .select(`
            *,
            campaign:campaigns(name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('campaigns')
          .select('id, name, status')
          .order('created_at', { ascending: false })
      ]);

      if (donorsRes.data) setDonors(donorsRes.data as any);
      if (campaignsRes.data) setCampaigns(campaignsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = 
      donor.name.toLowerCase().includes(search.toLowerCase()) ||
      donor.email.toLowerCase().includes(search.toLowerCase());
    const matchesCampaign = filterCampaign === 'all' || donor.campaign_id === filterCampaign;
    const matchesSegment = filterSegment === 'all' || donor.segment === filterSegment;
    const matchesMarketing = 
      filterMarketing === 'all' || 
      (filterMarketing === 'yes' && donor.marketing_consent) ||
      (filterMarketing === 'no' && !donor.marketing_consent);
    
    return matchesSearch && matchesCampaign && matchesSegment && matchesMarketing;
  });

  const handleSelectAll = () => {
    if (selectedDonors.size === filteredDonors.length) {
      setSelectedDonors(new Set());
    } else {
      setSelectedDonors(new Set(filteredDonors.map(d => d.id)));
    }
  };

  const handleSelectDonor = (donorId: string) => {
    const newSelected = new Set(selectedDonors);
    if (newSelected.has(donorId)) {
      newSelected.delete(donorId);
    } else {
      newSelected.add(donorId);
    }
    setSelectedDonors(newSelected);
  };

  const handleAddDonor = async () => {
    if (!formData.name || !formData.email || !formData.campaign_id) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase.from('donors').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        segment: formData.segment as any,
        notes: formData.notes || null,
        campaign_id: formData.campaign_id,
        marketing_consent: formData.marketing_consent,
        marketing_consent_at: formData.marketing_consent ? new Date().toISOString() : null,
      });

      if (error) throw error;

      toast.success('Donor added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error adding donor:', error);
      toast.error('Failed to add donor');
    }
  };

  const handleUpdateDonor = async () => {
    if (!editingDonor) return;

    try {
      const { error } = await supabase
        .from('donors')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          segment: formData.segment as any,
          notes: formData.notes || null,
          marketing_consent: formData.marketing_consent,
        })
        .eq('id', editingDonor.id);

      if (error) throw error;

      toast.success('Donor updated successfully');
      setEditingDonor(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating donor:', error);
      toast.error('Failed to update donor');
    }
  };

  const handleDeleteDonor = async (donorId: string) => {
    if (!confirm('Are you sure you want to delete this donor?')) return;

    try {
      const { error } = await supabase.from('donors').delete().eq('id', donorId);
      if (error) throw error;

      toast.success('Donor deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting donor:', error);
      toast.error('Failed to delete donor');
    }
  };

  const handleExport = () => {
    const exportData = filteredDonors.map(d => ({
      Name: d.name,
      Email: d.email,
      Phone: d.phone || '',
      Segment: d.segment,
      'Total Donated': d.total_donated,
      'Donation Count': d.donation_count,
      'Marketing Consent': d.marketing_consent ? 'Yes' : 'No',
      Campaign: d.campaign?.name || '',
    }));

    const csv = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donors-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      segment: 'first_time',
      notes: '',
      campaign_id: campaigns[0]?.id || '',
      marketing_consent: false,
    });
  };

  const openEditDialog = (donor: Donor) => {
    setEditingDonor(donor);
    setFormData({
      name: donor.name,
      email: donor.email,
      phone: donor.phone || '',
      segment: donor.segment,
      notes: donor.notes || '',
      campaign_id: donor.campaign_id,
      marketing_consent: donor.marketing_consent,
    });
  };

  const segmentColors: Record<string, string> = {
    first_time: 'bg-blue-100 text-blue-800',
    recurring: 'bg-green-100 text-green-800',
    major: 'bg-purple-100 text-purple-800',
    lapsed: 'bg-orange-100 text-orange-800',
    business: 'bg-indigo-100 text-indigo-800',
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const DonorForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Donor name"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Email *</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="donor@example.com"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Phone</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(555) 123-4567"
        />
      </div>
      {!isEdit && (
        <div>
          <label className="text-sm font-medium">Campaign *</label>
          <Select
            value={formData.campaign_id}
            onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Segment</label>
        <Select
          value={formData.segment}
          onValueChange={(v) => setFormData({ ...formData, segment: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first_time">First-Time</SelectItem>
            <SelectItem value="recurring">Recurring</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="lapsed">Lapsed</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Internal notes about this donor"
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="marketing"
          checked={formData.marketing_consent}
          onCheckedChange={(c) => setFormData({ ...formData, marketing_consent: c as boolean })}
        />
        <label htmlFor="marketing" className="text-sm">
          Marketing consent given
        </label>
      </div>
      <Button onClick={isEdit ? handleUpdateDonor : handleAddDonor} className="w-full">
        {isEdit ? 'Update Donor' : 'Add Donor'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Donor Database</h2>
          <p className="text-muted-foreground">
            Manage all donors across campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Donor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Donor</DialogTitle>
              </DialogHeader>
              <DonorForm />
            </DialogContent>
          </Dialog>
          {onClose && <Button variant="outline" onClick={onClose}>Close</Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Donors</p>
                <p className="text-2xl font-bold">{donors.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Marketing Opt-In</p>
              <p className="text-2xl font-bold">
                {donors.filter(d => d.marketing_consent).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Donated</p>
              <p className="text-2xl font-bold">
                ${donors.reduce((sum, d) => sum + (d.total_donated || 0), 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search donors..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCampaign} onValueChange={setFilterCampaign}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSegment} onValueChange={setFilterSegment}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All segments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="first_time">First-Time</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="lapsed">Lapsed</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMarketing} onValueChange={setFilterMarketing}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Marketing consent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Opted In</SelectItem>
                <SelectItem value="no">Not Opted In</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Donors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDonors.size === filteredDonors.length && filteredDonors.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Marketing</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDonors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No donors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDonors.map(donor => (
                  <TableRow key={donor.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedDonors.has(donor.id)}
                        onCheckedChange={() => handleSelectDonor(donor.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{donor.name}</TableCell>
                    <TableCell>{donor.email}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {donor.campaign?.name || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={segmentColors[donor.segment] || ''}>
                        {donor.segment}
                      </Badge>
                    </TableCell>
                    <TableCell>${donor.total_donated?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      {donor.marketing_consent ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(donor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDonor(donor.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingDonor} onOpenChange={(open) => !open && setEditingDonor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Donor</DialogTitle>
          </DialogHeader>
          <DonorForm isEdit />
        </DialogContent>
      </Dialog>

      {/* Bulk Actions */}
      {selectedDonors.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedDonors.size} donor(s) selected
          </span>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDonors(new Set())}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
