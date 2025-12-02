import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Package, ShoppingCart } from 'lucide-react';
import { ProductCard } from '@/components/fundraising/ProductCard';
import { Cart } from '@/components/fundraising/Cart';

export default function PublicStudentPage() {
  const { slug } = useParams();
  const [fundraiser, setFundraiser] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

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
        .single();

      if (fundraiserData) {
        setFundraiser(fundraiserData);
        setCampaign(fundraiserData.campaigns);
      }

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching fundraiser data:', error);
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

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const progress = fundraiser?.personal_goal 
    ? (Number(fundraiser.total_raised) / Number(fundraiser.personal_goal)) * 100 
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!fundraiser) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <Card>
            <CardHeader>
              <CardTitle>Fundraiser Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This fundraising page doesn't exist or is no longer active.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-wide py-12">
        {/* Hero Section */}
        <div className="bg-hero rounded-3xl p-8 mb-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold text-primary-foreground mb-4">
              Support {fundraiser.profiles?.full_name || 'This Student'}
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-6">
              {campaign?.name}
            </p>
            {fundraiser.custom_message && (
              <p className="text-primary-foreground/70 mb-6">
                {fundraiser.custom_message}
              </p>
            )}
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <Card className="bg-card/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-primary-blue" />
                  <span className="text-sm font-medium">Total Raised</span>
                </div>
                <p className="text-2xl font-bold">${Number(fundraiser.total_raised).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">of ${Number(fundraiser.personal_goal).toFixed(2)} goal</p>
                <Progress value={progress} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-6">Products Available</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>

        {/* Floating Cart Button */}
        {cartItemsCount > 0 && (
          <div className="fixed bottom-8 right-8 z-50">
            <Button
              size="lg"
              onClick={() => setShowCart(true)}
              className="rounded-full shadow-2xl"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {cartItemsCount} items (${cartTotal.toFixed(2)})
            </Button>
          </div>
        )}

        {/* Cart Drawer */}
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
