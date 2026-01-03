import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShoppingCart, Clock, Quote, Sparkles, Building2, Share2 } from 'lucide-react';
import { ProductCard } from '@/components/fundraising/ProductCard';
import { Cart } from '@/components/fundraising/Cart';
import { SocialShareButtons } from '@/components/fundraising/SocialShareButtons';
import { QuickDonate } from '@/components/fundraising/QuickDonate';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function PublicStudentPage() {
  const { slug } = useParams();
  const location = window.location;
  const [fundraiser, setFundraiser] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [donationProduct, setDonationProduct] = useState<any>(null);
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
          .select('*, campaigns(*)')
          .eq('id', slug)
          .single();

        if (participantData) {
          const adaptedFundraiser = {
            id: participantData.id,
            student_id: participantData.id,
            total_raised: participantData.total_raised || 0,
            personal_goal: 100, // Default personal goal
            custom_message: "Help us reach our goal!",
            profiles: {
              full_name: 'Supporter',
              avatar_url: null
            },
            campaigns: participantData.campaigns
          };

          setFundraiser(adaptedFundraiser);
          setCampaign(participantData.campaigns);

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

      setProducts((productsData || []).filter(p => p.name !== 'General Donation'));
      setDonationProduct((productsData || []).find(p => p.name === 'General Donation'));
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
    // Removed auto-open cart
    // setShowCart(true);
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
    if (!donationProduct) {
      // Fallback if DB product not found (shouldn't happen after migration)
      toast.error('Donation system is initializing. Please try again.');
      return;
    }

    addToCart(donationProduct, amount);

    toast.success(`Added $${amount} donation to cart!`, {
      action: {
        label: "View Cart",
        onClick: () => setShowCart(true)
      }
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  // Use campaign goal or personal goal? User said removing "Why I'm Fundraising", so maybe show Campaign Goal or just visual progress.
  // I'll keep the visual progress based on *something*, maybe still personal goal but label it differently.
  // Or if "don't have live activity" implies less social pressure, maybe just "Fundraiser Progress".
  const progress = fundraiser?.personal_goal
    ? (Number(fundraiser.total_raised) / Number(fundraiser.personal_goal)) * 100
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="container-wide py-12 pt-28">
          <div className="flex justify-center pb-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

  const orgName = campaign?.organization_name || "Our Organization";
  const campaignName = campaign?.name || "Fundraiser";

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 pb-20">

        {/* Hero Header - Anonymous / Org Focused */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white pt-32 pb-20 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <Building2 size={400} />
          </div>
          <div className="container-wide relative z-10 text-center">

            <Badge variant="secondary" className="mb-6 bg-white/10 hover:bg-white/20 text-blue-100 border-none px-4 py-1 text-sm backdrop-blur-sm">
              <Clock className="w-4 h-4 mr-2" /> {daysLeft} days left to support
            </Badge>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              {orgName}
            </h1>
            <p className="text-2xl text-white font-medium max-w-3xl mx-auto">
              {campaignName}
            </p>
          </div>
        </div>

        <div className="container-wide -mt-10 relative z-20">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Column: Products & Goal */}
            <div className="lg:col-span-2 space-y-8">

              {/* Goal Card */}
              <Card className="border-none shadow-xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Fundraiser Progress</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-blue-900">${Number(fundraiser.total_raised).toFixed(0)}</span>
                        <span className="text-xl text-muted-foreground font-medium">raised</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-indigo-600 mb-1">
                        {Math.round(progress)}% of Goal
                      </p>
                    </div>
                  </div>

                  <div className="relative h-6 bg-secondary/20 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>

                  {progress >= 100 && (
                    <div className="bg-green-100 text-green-800 p-4 rounded-xl flex items-center gap-3">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-bold">Goal Reached! Thank you for your support!</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* REMOVED: "Why I'm Fundraising" Story Section */}

              {/* Products Grid */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                    Shop & Support
                  </h2>
                </div>

                {products.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-xl border border-dashed text-muted-foreground">
                    <p>No products available at the moment.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        onUpdateQuantity={updateCartQuantity}
                        quantity={cart.find(item => item.product.id === product.id)?.quantity || 0}
                        fundraiserSlug={slug}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="lg:col-span-1 space-y-6">

              {/* Quick Donate */}
              <div className="sticky top-24 space-y-6">
                <QuickDonate onDonate={handleQuickDonate} />

                {/* Generic "Help Us Win" Card */}
                <Card className="border-none shadow-md bg-indigo-900 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <CardContent className="p-6 relative z-10">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Share2 className="h-5 w-5" /> Spread the Word
                    </h3>
                    <p className="text-indigo-200 text-sm mb-4">
                      Share this page to help {orgName} reach their goal.
                    </p>
                    <SocialShareButtons
                      url={currentUrl}
                      title={`Support ${orgName}!`}
                      description={`Help ${orgName} reach their goal for ${campaignName}!`}
                    />
                  </CardContent>
                </Card>

                {/* REMOVED: Live Activity / Recent Supporters */}
                {/* REMOVED: Student Leaderboard Rank */}

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
