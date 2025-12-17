import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export const QuestEditor = () => {
    return (
        <div className="h-full flex flex-col p-4 text-slate-200">
            <div className="mb-4 flex justify-between items-center">
                <h3 className="font-bold">Quests</h3>
                <Button size="sm" variant="secondary"><Plus className="w-4 h-4 mr-1" /> New</Button>
            </div>

            <ScrollArea className="flex-1 bg-slate-950/50 rounded-md p-2">
                <div className="text-sm text-slate-500 text-center py-4">
                    No quests created yet.
                </div>
            </ScrollArea>
        </div>
    );
};
