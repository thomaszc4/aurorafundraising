import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Minus, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { toast } from 'sonner';

interface ProductDetailProps {
  onAddToCart?: (product: any, quantity: number) => void;
  cart?: any[];
}

interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
}

export default function ProductDetail({ onAddToCart, cart }: ProductDetailProps) {
  const { slug, productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      // Fetch product and images in parallel
      const [productResult, imagesResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('display_order', { ascending: true })
      ]);

      setProduct(productResult.data);
      setProductImages(imagesResult.data || []);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all images including main image_url
  const getAllImages = () => {
    const images: string[] = [];
    
    // Add main product image first if it exists
    if (product?.image_url) {
      images.push(product.image_url);
    }
    
    // Add additional images
    productImages.forEach(img => {
      if (!images.includes(img.image_url)) {
        images.push(img.image_url);
      }
    });
    
    return images;
  };

  const allImages = product ? getAllImages() : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleAddToCart = () => {
    if (onAddToCart && product) {
      onAddToCart(product, quantity);
      toast.success(`Added ${quantity} ${product.name} to cart`);
    }
  };

  const handleBack = () => {
    if (slug) {
      navigate(`/fundraise/${slug}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-96 bg-muted rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <Card>
            <CardContent className="pt-6">
              <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
              <p className="text-muted-foreground mb-4">
                This product doesn't exist or is no longer available.
              </p>
              <Button onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-wide py-12">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <Card className="overflow-hidden relative">
              <AspectRatio ratio={1}>
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  {allImages.length > 0 ? (
                    <img
                      src={allImages[currentImageIndex]}
                      alt={`${product.name} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-8xl text-muted-foreground/20">📦</div>
                  )}
                </div>
              </AspectRatio>
              
              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </Card>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <p className="text-4xl font-bold text-primary-blue">
                ${Number(product.price).toFixed(2)}
              </p>
            </div>

            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Quantity</h2>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-semibold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add {quantity} to Cart - ${(Number(product.price) * quantity).toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}