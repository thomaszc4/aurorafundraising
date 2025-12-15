import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ConnectionDebug() {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const runDiagnostics = async () => {
        setLogs([]);
        setStatus('testing');
        addLog('Starting Diagnostics...');

        try {
            // 1. Check Env Vars
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

            if (!url || !key) {
                throw new Error('Missing Environment Variables! Check .env file.');
            }
            addLog(`Env Vars Detected: URL=${url.substring(0, 10)}...`);

            // 2. Check Public Connectivity (Campaigns table is public read)
            addLog('Testing Public Table Read (campaigns)...');
            const start = performance.now();
            const { data: campaigns, error: campaignError } = await supabase
                .from('campaigns')
                .select('count')
                .limit(1);

            if (campaignError) {
                throw new Error(`Public Read Failed: ${campaignError.message} (${campaignError.code})`);
            }
            addLog(`Public Read Success (${Math.round(performance.now() - start)}ms)`);

            // 3. Check Auth Service status
            addLog('Checking Auth Service...');
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                throw new Error(`Auth Service Error: ${sessionError.message}`);
            }
            addLog(`Auth Service Reachable. Session: ${sessionData.session ? 'Active' : 'None'}`);

            setStatus('success');
            addLog('✅ ALL SYSTEMS GO. Connection is healthy.');

        } catch (err: any) {
            console.error(err);
            setStatus('error');
            addLog(`❌ CRITICAL FAILURE: ${err.message}`);
            if (err.cause) addLog(`Cause: ${JSON.stringify(err.cause)}`);
        }
    };

    const testLogin = async () => {
        setStatus('testing');
        addLog('Testing Admin Login...');

        // Sign out first
        await supabase.auth.signOut();

        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@test.com',
            password: 'Test1234!',
        });

        if (error) {
            addLog(`❌ LOGIN FAILED: ${error.message} (Status: ${error.status})`);
            addLog(`Details: ${JSON.stringify(error)}`);
        } else {
            addLog('✅ LOGIN SUCCESS!');

            addLog('Checking Roles...');
            const { data: roles, error: roleError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', data.user?.id);

            if (roleError) {
                addLog(`❌ ROLE CHECK FAILED: ${roleError.message}`);
            } else {
                addLog(`✅ Roles: ${JSON.stringify(roles)}`);
            }
        }
    };

    const testSignup = async () => {
        setStatus('testing');
        const randomEmail = `aurora.test.${Math.floor(Math.random() * 1000)}@gmail.com`;
        addLog(`Testing Signup with ${randomEmail}...`);

        await supabase.auth.signOut();

        const { data, error } = await supabase.auth.signUp({
            email: randomEmail,
            password: 'Test1234!',
            options: {
                data: { full_name: 'Test Visitor' }
            }
        });

        if (error) {
            addLog(`❌ SIGNUP FAILED: ${error.message} (Status: ${error.status})`);
            addLog(`Details: ${JSON.stringify(error)}`);
        } else {
            addLog('✅ SIGNUP SUCCESS!');
            addLog(`User ID: ${data.user?.id}`);
        }
    };

    const createAdminUser = async () => {
        setStatus('testing');
        addLog(`Creating 'admin@test.com' via API...`);

        await supabase.auth.signOut();

        const { data, error } = await supabase.auth.signUp({
            email: 'admin@test.com',
            password: 'Test1234!',
            options: {
                data: { full_name: 'Admin1' }
            }
        });

        if (error) {
            addLog(`❌ CREATION FAILED: ${error.message}`);
            addLog(`Details: ${JSON.stringify(error)}`);
        } else {
            addLog('✅ CREATION SUCCESS! User is valid.');
            addLog('👉 NOW RUN "supabase/promote_admin.sql" to give them power.');
        }
    };

    return (
        <Card className="mt-8 border-red-500/50 bg-red-500/5">
            <CardHeader>
                <CardTitle className="text-red-500 flex justify-between items-center text-sm">
                    <span>Connection Diagnostics</span>
                    <div className="space-x-2">
                        <Button onClick={runDiagnostics} variant="destructive" size="sm" disabled={status === 'testing'}>
                            Network
                        </Button>
                        <Button onClick={testLogin} variant="outline" size="sm" disabled={status === 'testing'} className="text-black border-red-500 hover:bg-red-100">
                            Login
                        </Button>
                        <Button onClick={createAdminUser} variant="outline" size="sm" disabled={status === 'testing'} className="text-black border-red-500 hover:bg-red-100">
                            Create Admin
                        </Button>
                        <Button onClick={testSignup} variant="outline" size="sm" disabled={status === 'testing'} className="text-black border-red-500 hover:bg-red-100">
                            Signup
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-black/90 text-green-400 font-mono text-xs p-4 rounded-md h-48 overflow-y-auto whitespace-pre-wrap">
                    {logs.length === 0 ? 'Ready to test connection...' : logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-white/10 pb-1 last:border-0">{log}</div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
