import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Home, Check, X, Clock, MapPin, ChevronRight,
  RefreshCw, MessageSquare, Copy, QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DoorEntry {
  id: string;
  status: 'knocked' | 'interested' | 'sold' | 'not_home' | 'not_interested';
  notes?: string;
  timestamp: Date;
}

interface DoorToDoorModeProps {
  shareUrl: string;
  studentName?: string;
  productName?: string;
}

export function DoorToDoorMode({ shareUrl, studentName, productName }: DoorToDoorModeProps) {
  const [doors, setDoors] = useState<DoorEntry[]>([]);
  const [showScript, setShowScript] = useState(true);

  const stats = {
    total: doors.length,
    sold: doors.filter(d => d.status === 'sold').length,
    interested: doors.filter(d => d.status === 'interested').length,
    notHome: doors.filter(d => d.status === 'not_home').length,
    notInterested: doors.filter(d => d.status === 'not_interested').length,
  };

  const conversionRate = stats.total > 0
    ? ((stats.sold / stats.total) * 100).toFixed(0)
    : '0';

  const addDoor = (status: DoorEntry['status']) => {
    const newDoor: DoorEntry = {
      id: Date.now().toString(),
      status,
      timestamp: new Date(),
    };
    setDoors(prev => [newDoor, ...prev]);

    const messages: Record<string, string> = {
      sold: '🎉 Great job! Sale recorded!',
      interested: '👍 Noted! Follow up later.',
      not_home: '🏠 No one home - noted.',
      not_interested: '👋 On to the next one!',
      knocked: '🚪 Door tracked.',
    };
    toast.success(messages[status]);
  };

  const resetSession = () => {
    if (confirm('Are you sure you want to reset your session? All tracked doors will be cleared.')) {
      setDoors([]);
      toast.success('Session reset');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied! Ready to share.');
  };

  const salesScript = `Hi! My name is ${studentName || '[Your Name]'} and I'm raising money for ${productName || 'my school program'}. 

We're selling amazing products that people actually love and use. Would you like to take a look?

[Show QR code or phone]

You can scan this QR code to see our products and order online - it's quick and secure!

Thank you so much for your support!`;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="glass-card p-6 rounded-2xl border border-white/5">
        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Doors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{stats.sold}</div>
            <div className="text-xs text-muted-foreground">Sales</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-500">{stats.interested}</div>
            <div className="text-xs text-muted-foreground">Interested</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-muted-foreground">{stats.notHome}</div>
            <div className="text-xs text-muted-foreground">Not Home</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{conversionRate}%</div>
            <div className="text-xs text-muted-foreground">Conversion</div>
          </div>
        </div>
        <Progress value={parseInt(conversionRate)} className="mt-4 h-2" />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Track This Door</CardTitle>
          <CardDescription>Tap to record what happened</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => addDoor('sold')}
              className="h-16 bg-green-600 hover:bg-green-700 gap-2"
            >
              <Check className="h-5 w-5" />
              Made a Sale!
            </Button>
            <Button
              onClick={() => addDoor('interested')}
              variant="outline"
              className="h-16 border-amber-500 text-amber-600 hover:bg-amber-50 gap-2"
            >
              <Clock className="h-5 w-5" />
              Interested
            </Button>
            <Button
              onClick={() => addDoor('not_home')}
              variant="outline"
              className="h-16 gap-2"
            >
              <Home className="h-5 w-5" />
              Not Home
            </Button>
            <Button
              onClick={() => addDoor('not_interested')}
              variant="outline"
              className="h-16 gap-2"
            >
              <X className="h-5 w-5" />
              Not Interested
            </Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={copyShareLink} className="flex-1 gap-2">
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
            <Button variant="outline" onClick={resetSession} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Script */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Your Sales Script
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScript(!showScript)}
            >
              {showScript ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showScript && (
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-line">
              {salesScript}
            </div>
            <Button
              variant="outline"
              className="w-full mt-3 gap-2"
              onClick={() => {
                navigator.clipboard.writeText(salesScript);
                toast.success('Script copied!');
              }}
            >
              <Copy className="h-4 w-4" />
              Copy Script
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Recent Activity */}
      {doors.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <div className="space-y-2">
            {doors.slice(0, 10).map((door) => (
              <div
                key={door.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border border-transparent",
                  door.status === 'sold' && "bg-green-500/10 border-green-500/20",
                  door.status === 'interested' && "bg-amber-500/10 border-amber-500/20",
                  door.status === 'not_home' && "bg-white/5 border-white/5",
                  door.status === 'not_interested' && "bg-white/5 border-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    door.status === 'sold' && "bg-green-500/20 text-green-500",
                    door.status === 'interested' && "bg-amber-500/20 text-amber-500",
                    door.status === 'not_home' && "bg-white/10 text-muted-foreground",
                    door.status === 'not_interested' && "bg-white/10 text-muted-foreground"
                  )}>
                    {door.status === 'sold' && <Check className="h-4 w-4" />}
                    {door.status === 'interested' && <Clock className="h-4 w-4" />}
                    {door.status === 'not_home' && <Home className="h-4 w-4" />}
                    {door.status === 'not_interested' && <X className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium capitalize text-foreground">{door.status.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {door.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips Card */}
      <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl">
        <div className="mb-2">
          <h3 className="text-lg font-semibold">Pro Tips</h3>
        </div>
        <div>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Smile and be confident - you're helping a great cause!</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Have your QR code ready to show immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>If they're interested but busy, ask if you can come back</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Thank everyone for their time, even if they say no</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}