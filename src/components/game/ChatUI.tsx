import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Send } from 'lucide-react';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
}

interface ChatUIProps {
    campaignId: string;
    playerName: string;
}

export const ChatUI: React.FC<ChatUIProps> = ({ campaignId, playerName }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleChat = (data: any) => {
            setMessages(prev => [...prev.slice(-49), {
                id: crypto.randomUUID(),
                sender: data.id === (window as any).GAME_NETWORK?.playerId ? 'You' : 'Player', // We need names in chat payload really
                text: data.message,
                timestamp: Date.now()
            }]);
            setIsOpen(true);
        };

        // Poll for Network Manager or use event?
        // Easier: Listen to window event or just assume NetworkManager is ready?
        // Best: HubScene emits global event?
        // Let's rely on simple interval for now or add a listener if we can access the instance.

        const interval = setInterval(() => {
            const net = (window as any).GAME_NETWORK;
            if (net) {
                // Hacky: We need to hook into the callback.
                // NetworkManager doesn't expose a simple "add listener from UI" unless we expose it.
                // It has .on().
                net.on('chat', (payload: any) => {
                    // We need to fetch specific logic? 
                    // payload is { id, message }
                    // We need sender name. Net manager doesn't send name in 'chat' payload yet.
                    // I should enable sending name in NetworkManager.sendChat.

                    setMessages(prev => [...prev.slice(-49), {
                        id: crypto.randomUUID(),
                        sender: payload.id.substring(0, 6), // Placeholder
                        text: payload.message,
                        timestamp: Date.now()
                    }]);
                    setIsOpen(true);
                });
                clearInterval(interval);
            }
        }, 1000);

        return () => {
            // Cleanup?
        };
    }, []);

    const sendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        if ((window as any).GAME_NETWORK) {
            (window as any).GAME_NETWORK.sendChat(inputText.trim());
        }
        setInputText('');
    };

    return (
        <div className={`absolute bottom-4 left-24 z-20 flex flex-col transition-all duration-300 ${isOpen ? 'w-80 h-64' : 'w-80 h-10'}`}>
            {/* Chat Window */}
            {isOpen && (
                <div className="flex-1 bg-black/70 backdrop-blur-sm rounded-t-lg p-2 overflow-y-auto flex flex-col gap-1 border border-white/20">
                    {messages.map(m => (
                        <div key={m.id} className="text-sm">
                            <span className="font-bold text-yellow-500">{m.sender}:</span>
                            <span className="text-white ml-1">{m.text}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input Bar */}
            <div className="bg-black/80 p-2 rounded-b-lg flex gap-2 border border-white/20 rounded-t-lg">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-xs text-gray-400 hover:text-white px-1"
                >
                    {isOpen ? '▼' : '▲'} Chat
                </button>
                <form onSubmit={sendMessage} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Say hello..."
                        className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-gray-500"
                        onFocus={() => setIsOpen(true)}
                    />
                    <button type="submit" className="text-blue-400 hover:text-blue-300">
                        <Send size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
};
