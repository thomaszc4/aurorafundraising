import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Participant {
  id: string;
  campaign_id: string;
  nickname: string;
  total_raised: number;
  items_sold: number;
  is_active: boolean;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  organization_name: string;
  goal_amount: number | null;
  end_date: string | null;
}

interface ParticipantContextType {
  participant: Participant | null;
  campaign: Campaign | null;
  loading: boolean;
  error: string | null;
  login: (accessToken: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
}

const ParticipantContext = createContext<ParticipantContextType | undefined>(undefined);

const STORAGE_KEY = 'participant_token';

export function ParticipantProvider({ children }: { children: ReactNode }) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipantData = async (token: string): Promise<boolean> => {
    try {
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('*')
        .eq('access_token', token)
        .eq('is_active', true)
        .single();

      if (participantError || !participantData) {
        return false;
      }

      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('id, name, organization_name, goal_amount, end_date')
        .eq('id', participantData.campaign_id)
        .single();

      setParticipant(participantData);
      setCampaign(campaignData);
      return true;
    } catch (err) {
      console.error('Error fetching participant:', err);
      return false;
    }
  };

  const login = async (accessToken: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    const success = await fetchParticipantData(accessToken);
    
    if (success) {
      localStorage.setItem(STORAGE_KEY, accessToken);
    } else {
      setError('Invalid or expired access token');
    }
    
    setLoading(false);
    return success;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setParticipant(null);
    setCampaign(null);
  };

  const refreshData = async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      await fetchParticipantData(token);
    }
  };

  useEffect(() => {
    const initializeFromStorage = async () => {
      const token = localStorage.getItem(STORAGE_KEY);
      if (token) {
        await fetchParticipantData(token);
      }
      setLoading(false);
    };

    initializeFromStorage();
  }, []);

  return (
    <ParticipantContext.Provider value={{
      participant,
      campaign,
      loading,
      error,
      login,
      logout,
      refreshData
    }}>
      {children}
    </ParticipantContext.Provider>
  );
}

export function useParticipant() {
  const context = useContext(ParticipantContext);
  if (context === undefined) {
    throw new Error('useParticipant must be used within a ParticipantProvider');
  }
  return context;
}
