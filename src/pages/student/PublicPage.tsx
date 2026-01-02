import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShoppingCart, Clock, Quote, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/fundraising/ProductCard';
import { Cart } from '@/components/fundraising/Cart';
import { SocialShareButtons } from '@/components/fundraising/SocialShareButtons';
import { RecentSupporters } from '@/components/fundraising/RecentSupporters';
import { QuickDonate } from '@/components/fundraising/QuickDonate';
import { StudentLeaderboardRank } from '@/components/fundraising/StudentLeaderboardRank';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function PublicStudentPage() {
  const { slug } = useParams();
  const location = window.location;
  const [fundraiser, setFundraiser] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number>(0);

  const currentUrl = `${location.origin}${location.pathname}`;

  useEffect(() => {
    if (slug) {
      fetchFundraiserData();
    }
  }, [slug]);

  const fetchFundraiserData = async () => {
    try {
      // Fetch student fundraiser
      const { data: fundraiserData } = await supabase
        .from('student_fundraisers')
        .select('*, campaigns(*), profiles(*)')
        .eq('page_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (fundraiserData) {
        setFundraiser(fundraiserData);
        setCampaign(fundraiserData.campaigns);

        // Calculate days left
        if (fundraiserData.campaigns?.end_date) {
          const end = new Date(fundraiserData.campaigns.end_date);
          const now = new Date();
          const diffTime = Math.abs(end.getTime() - now.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysLeft(diffDays);
        }
      } else {
        // Fallback: Check 'participants' table (for join-link participants)
        const { data: participantData } = await supabase
          .from('participants')
          .select('*, campaigns(*)') // Fetch related campaign
          .eq('id', slug) // Slug is passed as ID for participants
          .single();

        if (participantData) {
          const adaptedFundraiser = {
            id: participantData.id,
            student_id: participantData.id, // Using same ID
            total_raised: participantData.total_raised || 0,
            personal_goal: 100, // Default personal goal
            custom_message: "Help me reach my goal!",
            profiles: {
              full_name: (participantData as any).first_name || 'Supporter',
              avatar_url: null
            },
            campaigns: participantData.campaigns
          };

          setFundraiser(adaptedFundraiser);
          setCampaign(participantData.campaigns); // Access joined campaign data

          if ((participantData.campaigns as any)?.end_date) {
            const end = new Date((participantData.campaigns as any).end_date);
            const now = new Date();
            const diffTime = Math.abs(end.getTime() - now.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysLeft(diffDays);
          }
        }
      }

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching fundraiser data:', error);
      toast.error('Could not load fundraiser data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any, quantity: number = 1) => {
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity }]);
    }
    setShowCart(true); // Open cart on add
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const handleQuickDonate = (amount: number) => {
    // Feature placeholder: In a real implementation this would add a line item or redirect
    toast.info(`Quick Donate $${amount} selected!`, {
      description: "This feature will be connected to checkout in the next phase."
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const progress = fundraiser?.personal_goal
    ? (Number(fundraiser.total_raised) / Number(fundraiser.personal_goal)) * 100
    : 0;

  const studentName = fundraiser?.profiles?.full_name || 'Student';
  const studentInitial = studentName.charAt(0);

  if (loading) {
    return (
      <Layout>
        <div className="container-wide py-12 pt-28">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-3xl w-full mb-8"></div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div className="h-32 bg-muted rounded-xl"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
              </div>
              <div className="h-64 bg-muted rounded-xl"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!fundraiser) {
    return (
      <Layout>
        <div className="container-wide py-12 pt-28 text-center">
          <h1 className="text-2xl font-bold mb-4">Fundraiser Not Found</h1>
          <p className="text-muted-foreground">This page is not available.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-secondary/5 pb-20">

        {/* Immersive Hero Header */}
        <div className="bg-gradient-to-r from-primary-blue to-primary-purple text-white pt-32 pb-24 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Sparkles size={400} />
          </div>
          <div className="container-wide relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white/30 shadow-2xl">
                <AvatarImage src={fundraiser.profiles?.avatar_url} />
                <AvatarFallback className="text-4xl font-bold text-primary-blue bg-white">{studentInitial}</AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left space-y-2">
                <Badge variant="secondary" className="mb-2 bg-white/20 hover:bg-white/30 text-white border-none">
                  <Clock className="w-3 h-3 mr-1" /> {daysLeft} days left
                </Badge>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                  {studentName}'s Fundraiser
                </h1>
                <p className="text-xl text-blue-100 font-medium max-w-2xl">
                  Raising money for <span className="text-white underline decoration-wavy underline-offset-4">{campaign?.name}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container-wide -mt-12 relative z-20">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Column: Story & Products */}
            <div className="lg:col-span-2 space-y-8">

              {/* Goal Card */}
              <Card className="border-none shadow-xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Raised</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-primary-blue">${Number(fundraiser.total_raised).toFixed(0)}</span>
                        <span className="text-xl text-muted-foreground font-medium">/ ${Number(fundraiser.personal_goal).toFixed(0)} goal</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-purple mb-1">
                        {Math.round(progress)}% Complete
                      </p>
                    </div>
                  </div>

                  <div className="relative h-6 bg-secondary/20 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-blue to-primary-purple transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span>$0</span>
                    <span>${Number(fundraiser.personal_goal).toFixed(0)}</span>
                  </div>

                  {progress >= 100 && (
                    <div className="bg-green-100 text-green-800 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-bold">Goal Reached! Thank you for your support!</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Story Section */}
              {fundraiser.custom_message && (
                <Card className="border-none shadow-md bg-white">
                  <CardContent className="p-8">
                    <div className="flex gap-4">
                      <Quote className="w-10 h-10 text-primary-blue/20 flex-shrink-0" />
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-gray-900">Why I'm Fundraising</h3>
                        <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {fundraiser.custom_message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Products Grid */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Shop & Support</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      fundraiserSlug={slug}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Key Actions & Social Proof */}
            <div className="lg:col-span-1 space-y-6">

              {/* Quick Donate */}
              <div className="sticky top-24 space-y-6">
                <QuickDonate onDonate={handleQuickDonate} />

                <StudentLeaderboardRank
                  campaignId={campaign?.id}
                  studentId={fundraiser.student_id}
                  currentAmount={Number(fundraiser.total_raised)}
                />

                <Card className="border-none shadow-md bg-indigo-900 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <CardContent className="p-6 relative z-10">
                    <h3 className="font-bold text-lg mb-2">Help {studentName} Win!</h3>
                    <p className="text-indigo-200 text-sm mb-4">Share this page to help them reach the top of the leaderboard.</p>
                    <SocialShareButtons
                      url={currentUrl}
                      title={`Support ${studentName}!`}
                      description={`Help ${studentName} reach their goal for ${campaign?.name}!`}
                    />
                  </CardContent>
                </Card>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live Activity
                  </h3>
                  <RecentSupporters fundraiserId={fundraiser.id} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cart Button */}
        {cartItemsCount > 0 && (
          <div className="fixed bottom-8 right-8 z-50 animate-bounce-in">
            <Button
              size="lg"
              onClick={() => setShowCart(true)}
              className="rounded-full shadow-2xl h-16 px-8 bg-gray-900 hover:bg-black text-white border-2 border-white/20"
            >
              <ShoppingCart className="h-6 w-6 mr-2" />
              <div className="flex flex-col items-start ml-1">
                <span className="text-xs font-normal text-gray-300">Checkout</span>
                <span className="text-lg font-bold">{cartItemsCount} items • ${cartTotal.toFixed(2)}</span>
              </div>
            </Button>
          </div>
        )}

        <Cart
          cart={cart}
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateCartQuantity}
          fundraiserId={fundraiser.id}
        />
      </div>
    </Layout>
  );
}
