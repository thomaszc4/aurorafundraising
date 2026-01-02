import React, { useEffect, useState } from 'react';

interface NotificationData {
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    duration?: number;
}

export const GameNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);

    useEffect(() => {
        const handleNotification = (e: Event) => {
            const data = (e as CustomEvent).detail as Omit<NotificationData, 'id'>;
            const id = Math.random().toString(36).substr(2, 9);
            const notification: NotificationData = { ...data, id };

            setNotifications(prev => [...prev, notification]);

            // Auto-remove after duration
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, data.duration || 3000);
        };

        window.addEventListener('game-notification', handleNotification);
        return () => window.removeEventListener('game-notification', handleNotification);
    }, []);

    const getTypeStyles = (type: NotificationData['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-600/90 border-green-400';
            case 'warning':
                return 'bg-yellow-600/90 border-yellow-400';
            case 'error':
                return 'bg-red-600/90 border-red-400';
            default:
                return 'bg-blue-600/90 border-blue-400';
        }
    };

    const getIcon = (type: NotificationData['type']) => {
        switch (type) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'error': return '✕';
            default: return 'ℹ';
        }
    };

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
            {notifications.map(n => (
                <div
                    key={n.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-white shadow-lg animate-bounce-in ${getTypeStyles(n.type)}`}
                >
                    <span className="text-lg">{getIcon(n.type)}</span>
                    <span className="text-sm font-medium">{n.message}</span>
                </div>
            ))}
        </div>
    );
};
