import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
}

interface ProductImagesManagerProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductImagesManager({ 
  productId, 
  productName, 
  open, 
  onOpenChange 
}: ProductImagesManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open && productId) {
      fetchImages();
    }
  }, [open, productId]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    setAdding(true);
    try {
      const maxOrder = images.length > 0 
        ? Math.max(...images.map(img => img.display_order)) 
        : -1;

      const { error } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: newImageUrl.trim(),
          display_order: maxOrder + 1,
        });

      if (error) throw error;
      
      toast.success('Image added successfully');
      setNewImageUrl('');
      fetchImages();
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('Failed to add image');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      
      toast.success('Image deleted successfully');
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleMoveImage = async (imageId: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const currentImage = images[currentIndex];
    const swapImage = images[newIndex];

    try {
      await Promise.all([
        supabase
          .from('product_images')
          .update({ display_order: swapImage.display_order })
          .eq('id', currentImage.id),
        supabase
          .from('product_images')
          .update({ display_order: currentImage.display_order })
          .eq('id', swapImage.id),
      ]);

      fetchImages();
    } catch (error) {
      console.error('Error reordering images:', error);
      toast.error('Failed to reorder images');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Manage Images - {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new image */}
          <div className="space-y-2">
            <Label>Add New Image</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
              />
              <Button onClick={handleAddImage} disabled={adding}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Image list */}
          <div className="space-y-2">
            <Label>Current Images ({images.length})</Label>
            
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No images yet. Add your first image above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => handleMoveImage(image.id, 'up')}
                      >
                        <GripVertical className="h-4 w-4 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === images.length - 1}
                        onClick={() => handleMoveImage(image.id, 'down')}
                      >
                        <GripVertical className="h-4 w-4 rotate-90" />
                      </Button>
                    </div>
                    
                    <div className="h-16 w-16 rounded-md overflow-hidden bg-background flex-shrink-0">
                      <img 
                        src={image.image_url} 
                        alt={`Product image ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Image {index + 1}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {image.image_url}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
