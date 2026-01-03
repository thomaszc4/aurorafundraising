import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ProductCardProps {
  product: any;
  onAddToCart: (product: any, quantity: number) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  quantity?: number;
  fundraiserSlug?: string;
}

export const ProductCard = ({ product, onAddToCart, onUpdateQuantity, quantity = 0, fundraiserSlug }: ProductCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    const basePath = fundraiserSlug ? `/fundraise/${fundraiserSlug}` : '';
    navigate(`${basePath}/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateQuantity) {
      onUpdateQuantity(product.id, quantity + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateQuantity) {
      onUpdateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer group"
      onClick={handleCardClick}
    >
      <CardHeader className="p-0">
        <AspectRatio ratio={1}>
          <div className="w-full h-full bg-muted flex items-center justify-center relative overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="text-6xl text-muted-foreground/20">📦</div>
            )}
          </div>
        </AspectRatio>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold text-foreground mb-2">{product.name}</h3>
        <p className="text-muted-foreground text-sm mb-4 flex-1 min-h-[40px] line-clamp-2">
          {product.description || ""}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-2xl font-bold text-primary-blue">
            ${Number(product.price).toFixed(2)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        {quantity > 0 && onUpdateQuantity ? (
          <div className="flex items-center justify-between w-full bg-secondary/20 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDecrement}
              className="h-8 w-8 hover:bg-white/50"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-bold text-base w-8 text-center">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleIncrement}
              className="h-8 w-8 hover:bg-white/50"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleAddToCart}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
