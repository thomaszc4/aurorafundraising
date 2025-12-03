import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: any;
  onAddToCart: (product: any, quantity: number) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="aspect-square bg-muted flex items-center justify-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-6xl text-muted-foreground/20">📦</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold text-foreground mb-2">{product.name}</h3>
        <p className="text-muted-foreground text-sm mb-4 flex-1 min-h-[40px]">
          {product.description || ""}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-2xl font-bold text-primary-blue">
            ${Number(product.price).toFixed(2)}
          </span>
          {product.inventory_count !== null && (
            <span className="text-sm text-muted-foreground">
              {product.inventory_count} in stock
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button
          onClick={() => onAddToCart(product, 1)}
          className="w-full"
          disabled={product.inventory_count === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};
