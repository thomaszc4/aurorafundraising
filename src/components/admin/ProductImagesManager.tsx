import { useState, useEffect, useRef } from 'react';
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
import { Plus, Trash2, GripVertical, Image as ImageIcon, Upload, Link } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

function SortableImageItem({ 
  image, 
  index, 
  onDelete 
}: { 
  image: ProductImage; 
  index: number;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
    >
      <button
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      
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
        onClick={() => onDelete(image.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleAddImageUrl = async () => {
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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedCount = { success: 0, failed: 0 };

    try {
      let currentMaxOrder = images.length > 0 
        ? Math.max(...images.map(img => img.display_order)) 
        : -1;

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          uploadedCount.failed++;
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          uploadedCount.failed++;
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          uploadedCount.failed++;
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        // Add to product_images table
        currentMaxOrder++;
        const { error: insertError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: publicUrl,
            display_order: currentMaxOrder,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          uploadedCount.failed++;
          continue;
        }

        uploadedCount.success++;
      }

      if (uploadedCount.success > 0) {
        toast.success(`${uploadedCount.success} image(s) uploaded successfully`);
        fetchImages();
      }
      if (uploadedCount.failed > 0) {
        toast.error(`${uploadedCount.failed} image(s) failed to upload`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);

      // Update display_order in database
      try {
        const updates = newImages.map((img, index) => 
          supabase
            .from('product_images')
            .update({ display_order: index })
            .eq('id', img.id)
        );

        await Promise.all(updates);
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error('Failed to update image order');
        fetchImages(); // Revert to server state
      }
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
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Add URL
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-2 mt-4">
              <Label>Upload Images</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-primary');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-primary');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-primary');
                  handleFileUpload(e.dataTransfer.files);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Click or drag images here'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 5MB each. Select multiple files for bulk upload.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="space-y-2 mt-4">
              <Label>Add Image URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddImageUrl()}
                />
                <Button onClick={handleAddImageUrl} disabled={adding}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Image list */}
          <div className="space-y-2">
            <Label>Current Images ({images.length})</Label>
            <p className="text-xs text-muted-foreground">Drag to reorder images</p>
            
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No images yet. Upload or add images above.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map(img => img.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {images.map((image, index) => (
                      <SortableImageItem
                        key={image.id}
                        image={image}
                        index={index}
                        onDelete={handleDeleteImage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
