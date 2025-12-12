import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Package, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const VENDOR_STORAGE_KEY = 'vendor_session';

export default function VendorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate against vendor_accounts table
      const { data: vendor, error } = await supabase
        .from('vendor_accounts')
        .select('id, email, company_name, is_active')
        .eq('email', email.toLowerCase().trim())
        .eq('password_hash', password) // In production, use proper password hashing
        .eq('is_active', true)
        .single();

      if (error || !vendor) {
        toast.error('Invalid email or password');
        setLoading(false);
        return;
      }

      // Update last login
      await supabase
        .from('vendor_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', vendor.id);

      // Store vendor session
      localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify({
        id: vendor.id,
        email: vendor.email,
        company_name: vendor.company_name
      }));

      toast.success('Welcome back!');
      navigate('/vendor/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Vendor Portal</CardTitle>
            <CardDescription>
              Access your shipment and order information
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
