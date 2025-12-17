import { supabase } from '@/integrations/supabase/client';
import { LevelData } from '@/stores/useEditorStore';

export const MapService = {
    async saveMap(data: LevelData): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Check if map exists (by ID) to decide Insert vs Update
        // For simplicity in this iteration, we always upsert based on ID if present

        const payload = {
            id: data.id === 'new-map' ? undefined : data.id, // Let DB generate ID if new
            name: data.name,
            data: data, // Store the entire object
            owner_id: user.id,
            updated_at: new Date().toISOString()
        };

        const { data: saved, error } = await supabase
            .from('maps')
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;
        return saved.id;
    },

    async loadMap(id: string): Promise<LevelData> {
        const { data, error } = await supabase
            .from('maps')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Return the stored data, ensuring the ID matches the record
        return {
            ...data.data as LevelData,
            id: data.id, // Ensure ID is consistent
            name: data.name
        };
    },

    async listMyMaps(): Promise<{ id: string, name: string, updated_at: string }[]> {
        const { data, error } = await supabase
            .from('maps')
            .select('id, name, updated_at')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
