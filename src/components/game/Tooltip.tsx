import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    text: string;
    description?: string;
    children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, description, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
            setIsVisible(true);
        }
    };

    return (
        <div
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVisible(false)}
            className="relative cursor-help"
        >
            {children}
            {isVisible && (
                <div
                    className="fixed z-[200] transform -translate-x-1/2 -translate-y-full px-3 py-2 bg-slate-800/95 border border-slate-600 rounded-lg shadow-xl pointer-events-none animate-bounce-in min-w-[120px]"
                    style={{ left: coords.x, top: coords.y }}
                >
                    <div className="text-white font-bold text-sm mb-0.5">{text}</div>
                    {description && <div className="text-slate-400 text-xs leading-tight">{description}</div>}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800" />
                </div>
            )}
        </div>
    );
};
