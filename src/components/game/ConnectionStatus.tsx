import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ConnectionStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showReconnect, setShowReconnect] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnect(false);
        };
        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnect(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline && !showReconnect) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[250] animate-bounce-in">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-2xl ${isOnline ? 'bg-green-600/90 border-green-400' : 'bg-red-600/90 border-red-400'
                }`}>
                {isOnline ? (
                    <Wifi className="w-4 h-4 text-white" />
                ) : (
                    <WifiOff className="w-4 h-4 text-white" />
                )}
                <span className="text-white text-sm font-bold">
                    {isOnline ? 'Connection Restored' : 'No Internet Connection'}
                </span>
                {!isOnline && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-white bg-white/10 hover:bg-white/20"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Reload
                    </Button>
                )}
            </div>
        </div>
    );
};
