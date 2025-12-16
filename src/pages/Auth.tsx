import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ConnectionDebug } from '@/components/debug/ConnectionDebug';
import { Building2, User } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, isAdmin, isSuperAdmin, isStudent, isOrgAdmin, isIndividual, loading, userRoles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("signin");
  const signInEmailRef = useRef<HTMLInputElement>(null);
  const signUpNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "signup" || tabParam === "signin") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!loading && user && userRoles.length > 0) {
      redirectToDashboard();
    }
  }, [user, loading, userRoles, isSuperAdmin, isAdmin, isStudent]);

  // Focus management when tabs change
  useEffect(() => {
    // Small timeout to allow tab content to mount/render
    const timer = setTimeout(() => {
      if (activeTab === "signin" && signInEmailRef.current) {
        signInEmailRef.current.focus();
      } else if (activeTab === "signup" && signUpNameRef.current) {
        signUpNameRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const redirectToDashboard = () => {
    if (isSuperAdmin) {
      navigate('/admin/super');
    } else if (isAdmin || isOrgAdmin) {
      navigate('/admin');
    } else if (isIndividual) {
      navigate('/individual/dashboard');
    } else if (isStudent) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else {
      toast.success('Welcome back!');
      // Redirect will happen via useEffect when roles are loaded
    }
  };

  // State for conditional rendering
  const [accountType, setAccountType] = useState<'organization_admin' | 'individual'>('organization_admin');

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim();
    const password = (formData.get('password') as string).trim();
    const fullName = (formData.get('fullName') as string).trim();
    const orgName = (formData.get('orgName') as string)?.trim();
    const programName = (formData.get('programName') as string)?.trim();

    const { error } = await signUp(email, password, fullName, accountType, orgName, programName);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created successfully!');
      if (accountType === 'organization_admin') {
        navigate('/admin');
      } else {
        navigate('/individual/dashboard');
      }
    }

    setIsLoading(false);
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-hero p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-blue/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <Card className="w-full max-w-md glass-card border-white/20 shadow-glow relative z-10 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-foreground">Welcome to Aurora</CardTitle>
          <CardDescription className="text-center text-muted-foreground/80">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 relative z-20">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {activeTab === 'signin' && (
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      ref={signInEmailRef}
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="bg-background/50 border-white/10 focus:border-primary-blue transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      className="bg-background/50 border-white/10 focus:border-primary-blue transition-colors"
                    />
                  </div>
                  <Button type="submit" className="w-full shadow-lg shadow-primary-blue/25 hover:shadow-primary-blue/40" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
            )}

            {activeTab === 'signup' && (
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      ref={signUpNameRef}
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      className="bg-background/50 border-white/10 focus:border-primary-blue transition-colors"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Account Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent/50 ${accountType === 'organization_admin'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-muted bg-popover/50 hover:border-primary/50'
                          }`}
                        onClick={() => setAccountType('organization_admin')}
                      >
                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                          <div className={`p-2 rounded-full ${accountType === 'organization_admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Organization</p>
                            <p className="text-xs text-muted-foreground">School, Team, or Group</p>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent/50 ${accountType === 'individual'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-muted bg-popover/50 hover:border-primary/50'
                          }`}
                        onClick={() => setAccountType('individual')}
                      >
                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                          <div className={`p-2 rounded-full ${accountType === 'individual' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Individual</p>
                            <p className="text-xs text-muted-foreground">Personal Fundraiser</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Organization Details (Conditional) */}
                  {accountType === 'organization_admin' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                          id="orgName"
                          name="orgName"
                          placeholder="Lincoln High School"
                          required
                          className="bg-background/50 border-white/10 focus:border-primary-blue transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="programName">Program Name (Optional)</Label>
                        <Input
                          id="programName"
                          name="programName"
                          placeholder="Marching Band, Football Team, etc."
                          className="bg-background/50 border-white/10 focus:border-primary-blue transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="bg-background/50 border-white/10 focus:border-primary-blue transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      className="bg-background/50 border-white/10 focus:border-primary-blue transition-colors"
                    />
                  </div>
                  <Button type="submit" className="w-full shadow-lg shadow-primary-blue/25 hover:shadow-primary-blue/40" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            )}
            {/* End of Signup Tab */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
