import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapService } from '@/services/MapService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, File, Calendar } from 'lucide-react';
import { useEditorStore } from '@/stores/useEditorStore';
import { toast } from 'sonner';

export const LoadMapModal = ({ children }: { children: React.ReactNode }) => {
    const [maps, setMaps] = useState<{ id: string, name: string, updated_at: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const setMapData = useEditorStore(s => s.setMapData);

    useEffect(() => {
        if (isOpen) {
            loadList();
        }
    }, [isOpen]);

    const loadList = async () => {
        setIsLoading(true);
        try {
            const list = await MapService.listMyMaps();
            setMaps(list);
        } catch (e) {
            console.error(e);
            toast.error("Failed to list maps");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoad = async (id: string) => {
        try {
            const data = await MapService.loadMap(id);
            setMapData(data);
            toast.success(`Loaded "${data.name}"`);
            setIsOpen(false);
            // Hint to reload scene? React store update should trigger it.
        } catch (e) {
            console.error(e);
            toast.error("Failed to load map");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-900 text-white border-slate-700">
                <DialogHeader>
                    <DialogTitle>My Maps</DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[300px] mt-4 p-2 border border-slate-700 rounded-md bg-slate-950">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-blue-500" />
                        </div>
                    ) : maps.length === 0 ? (
                        <div className="text-center text-slate-500 p-8">
                            No saved maps found.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {maps.map((map) => (
                                <button
                                    key={map.id}
                                    onClick={() => handleLoad(map.id)}
                                    className="w-full text-left p-3 rounded bg-slate-800 hover:bg-slate-700 transition flex justify-between items-center group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-900 p-2 rounded">
                                            <File className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{map.name}</div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(map.updated_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Load
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="flex justify-end pt-2">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
