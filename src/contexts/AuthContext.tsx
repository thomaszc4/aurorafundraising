import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRoles: string[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role?: 'organization_admin' | 'individual', organizationName?: string, programName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isStudent: boolean;
  isOrgAdmin: boolean;
  isIndividual: boolean;
  rolesLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setRolesLoaded(false);

        if (session?.user) {
          // Fetch user role after a delay to ensure profile/role is created via trigger
          setTimeout(async () => {
            await fetchUserRoles(session.user.id);
          }, 1000);
        } else {
          setUserRoles([]);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string, attempt = 1) => {
    let roles: string[] = [];
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
      } else {
        roles = data?.map(r => r.role) || [];
        setUserRoles(roles);
      }
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
    } finally {
      // If no roles found, possibly due to trigger delay, retry up to 3 times
      if (roles.length === 0 && attempt < 3) {
        console.log(`No roles found, retrying... (${attempt + 1}/3)`);
        setTimeout(() => fetchUserRoles(userId, attempt + 1), 1000);
        return; // Don't set rolesLoaded yet
      }

      console.log('Final User Roles:', roles);
      setRolesLoaded(true);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'organization_admin' | 'individual' = 'organization_admin',
    organizationName?: string,
    programName?: string
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
          organization_name: organizationName,
          program_name: programName
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRoles([]);
    navigate('/auth');
  };

  const isSuperAdmin = userRoles.includes('super_admin');
  const isAdmin = userRoles.includes('admin') || isSuperAdmin;
  const isStudent = userRoles.includes('student');
  const isOrgAdmin = userRoles.includes('organization_admin');
  const isIndividual = userRoles.includes('individual');

  const value = {
    user,
    session,
    userRoles,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isSuperAdmin,
    isStudent,
    isOrgAdmin,
    isIndividual,
    rolesLoaded,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
