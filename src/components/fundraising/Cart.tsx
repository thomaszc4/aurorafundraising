import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CartProps {
  cart: any[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  fundraiserId: string;
}

export const Cart = ({ cart, isOpen, onClose, onUpdateQuantity, fundraiserId }: CartProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [displayOnWall, setDisplayOnWall] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      toast.error('Please provide your name and email');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Call checkout edge function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          fundraiserId,
          cart: cart.map(item => ({
            productId: item.product.id,
            stripePriceId: item.product.stripe_price_id,
            quantity: item.quantity,
            price: item.product.price,
            cost: item.product.cost,
          })),
          customerInfo,
          donorPreferences: {
            displayOnWall,
            displayName: displayOnWall ? (displayName || customerInfo.name) : null,
            marketingConsent,
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.open(data.url, '_blank');
        onClose();
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to create checkout session');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Cart Items */}
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.product.id} className="flex gap-4 border-b pb-4">
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    ${Number(item.product.price).toFixed(2)} each
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 ml-auto"
                      onClick={() => onUpdateQuantity(item.product.id, 0)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    ${(Number(item.product.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Your Information</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Recognition Wall Opt-in */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id="displayOnWall"
                checked={displayOnWall}
                onCheckedChange={(checked) => setDisplayOnWall(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="displayOnWall" className="cursor-pointer font-medium">
                  Display my name on the Supporter Wall
                </Label>
                <p className="text-sm text-muted-foreground">
                  Celebrate your support by appearing on our public recognition wall
                </p>
              </div>
            </div>
            {displayOnWall && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="displayName">Display Name (optional)</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={customerInfo.name || "How you'd like to be recognized"}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use your name, or enter a custom display name
                </p>
              </div>
            )}
          </div>

          {/* Marketing Communications Opt-in */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id="marketingConsent"
                checked={marketingConsent}
                onCheckedChange={(checked) => setMarketingConsent(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="marketingConsent" className="cursor-pointer font-medium">
                  Stay connected with our organization
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By checking this box, I expressly consent to receive promotional emails, newsletters, 
                  fundraising updates, event announcements, and other marketing communications from this 
                  organization at the email address provided above. I understand that: (i) my consent is 
                  voluntary and not a condition of my donation or purchase; (ii) I may withdraw my consent 
                  at any time by clicking the "unsubscribe" link in any email or by contacting the organization 
                  directly; (iii) message and data rates may apply; (iv) my information will be handled in 
                  accordance with the organization's privacy policy. I acknowledge that I am at least 18 years 
                  of age or have parental/guardian consent.
                </p>
              </div>
            </div>
          </div>

          {/* Total and Checkout */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full"
              size="lg"
              disabled={isProcessing || cart.length === 0}
            >
              {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
