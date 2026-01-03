import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const T_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
type TShirtSize = typeof T_SHIRT_SIZES[number];

interface TShirtSizeSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    participantId: string;
    onSizeSelected: (size: string) => void;
}

export function TShirtSizeSelector({ isOpen, onClose, participantId, onSizeSelected }: TShirtSizeSelectorProps) {
    const [selectedSize, setSelectedSize] = useState<TShirtSize | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!selectedSize) {
            toast.error('Please select a size');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('participants')
                .update({
                    tshirt_size: selectedSize,
                    tshirt_claimed: true
                })
                .eq('id', participantId);

            if (error) throw error;

            toast.success('T-shirt size saved!');
            onSizeSelected(selectedSize);
            onClose();
        } catch (error) {
            console.error('Error saving t-shirt size:', error);
            toast.error('Failed to save t-shirt size');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        👕 Claim Your Free T-Shirt!
                    </DialogTitle>
                    <DialogDescription>
                        Select your size to claim your free fundraiser t-shirt. You can only claim one free shirt.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-3 gap-3">
                        {T_SHIRT_SIZES.map((size) => (
                            <Button
                                key={size}
                                variant={selectedSize === size ? 'default' : 'outline'}
                                className="h-16 text-lg font-bold"
                                onClick={() => setSelectedSize(size)}
                            >
                                {size}
                            </Button>
                        ))}
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            <strong>Sizing Info:</strong> These are unisex sizing. If you're between sizes, we recommend sizing up for a more relaxed fit.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!selectedSize || saving}>
                        {saving ? 'Saving...' : 'Claim T-Shirt'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
