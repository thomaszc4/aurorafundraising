import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Send } from 'lucide-react';

interface ChatMessage {
    id: string;
    sender: string;
    senderId: string;
    text: string;
    timestamp: number;
}

interface ChatUIProps {
    campaignId: string;
    playerName: string;
    playerId: string;
}

export const ChatUI: React.FC<ChatUIProps> = ({ campaignId, playerName, playerId }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const channel = supabase.channel(`chat_${campaignId}`)
            .on('broadcast', { event: 'message' }, (payload) => {
                const msg = payload.payload as ChatMessage;
                setMessages(prev => [...prev, msg]);
                setIsOpen(true);
                window.dispatchEvent(new CustomEvent('game-chat-message', { detail: msg }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [campaignId]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Handle Click Outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        const msg: ChatMessage = {
            id: Math.random().toString(36).substr(2, 9),
            sender: playerName,
            senderId: playerId,
            text: inputText.trim(),
            timestamp: Date.now()
        };

        // Optimistic UI
        setMessages(prev => [...prev, msg]);
        window.dispatchEvent(new CustomEvent('game-chat-message', { detail: msg }));

        // Broadcast
        await supabase.channel(`chat_${campaignId}`).send({
            type: 'broadcast',
            event: 'message',
            payload: msg
        });

        setInputText('');
    };

    return (
        <div
            ref={containerRef}
            className={`absolute bottom-20 left-6 z-50 flex flex-col transition-all duration-300 ease-out ${isOpen ? 'w-96 h-80' : 'w-96 h-10'}`}
        >
            {/* Chat Messages */}
            <div className={`flex-1 bg-slate-950/85 backdrop-blur-xl rounded-t-2xl p-4 overflow-y-auto flex flex-col gap-2 border-x border-t border-cyan-500/30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {messages.map(m => (
                    <div key={m.id} className="text-sm animate-in fade-in slide-in-from-left-2">
                        <span className="font-bold text-cyan-400 drop-shadow-md text-[13px]">{m.sender}</span>
                        <span className="text-slate-200 ml-2 text-[13px]">{m.text}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className={`bg-slate-950/90 p-3 flex gap-3 border border-cyan-500/30 backdrop-blur-xl shadow-2xl transition-all duration-300 ${isOpen ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex flex-col items-center justify-center text-[10px] text-cyan-500/80 hover:text-cyan-300 px-2 font-mono uppercase tracking-wider border-r border-white/10"
                >
                    <div className="font-bold">{isOpen ? '▼' : '▲'}</div>
                    Chat
                </button>
                <form onSubmit={sendMessage} className="flex-1 flex gap-2 items-center">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()} // Stop Phaser from capturing spacebar
                        onFocus={() => setIsOpen(true)}
                        placeholder="Comms Channel..."
                        className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-cyan-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800 transition-colors font-mono"
                    />
                    <button type="submit" className="text-cyan-400 hover:text-cyan-300 p-2 rounded-lg hover:bg-cyan-950/30 transition-colors">
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};
