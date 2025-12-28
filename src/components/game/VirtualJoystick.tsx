import React, { useEffect, useRef, useState } from 'react';

interface JoystickProps {
    onMove: (angle: number, force: number) => void;
    onStop: () => void;
}

export const VirtualJoystick: React.FC<JoystickProps> = ({ onMove, onStop }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stickRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Relative to center
    const center = useRef({ x: 0, y: 0 });
    const maxDistance = 50; // Max stick movement radius

    const handleStart = (clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        center.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        setActive(true);
        handleMove(clientX, clientY);
    };

    const handleMove = (clientX: number, clientY: number) => {
        const dx = clientX - center.current.x;
        const dy = clientY - center.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const force = Math.min(distance, maxDistance);
        const clampedX = Math.cos(angle) * force;
        const clampedY = Math.sin(angle) * force;

        setPosition({ x: clampedX, y: clampedY });
        onMove(angle, force / maxDistance);
    };

    const handleEnd = () => {
        setActive(false);
        setPosition({ x: 0, y: 0 });
        onStop();
    };

    // Touch Events
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
        };
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (active) handleMove(e.touches[0].clientX, e.touches[0].clientY);
        };
        const onTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            handleEnd();
        };

        container.addEventListener('touchstart', onTouchStart, { passive: false });
        // Bind move/end to window to capture drags outside container
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            container.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [active]);

    // Mouse Events for testing
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onMouseDown = (e: MouseEvent) => {
            handleStart(e.clientX, e.clientY);
        };
        const onMouseMove = (e: MouseEvent) => {
            if (active) handleMove(e.clientX, e.clientY);
        };
        const onMouseUp = () => {
            if (active) handleEnd();
        };

        container.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            container.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [active]);

    return (
        <div
            ref={containerRef}
            className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 touch-none z-50 flex items-center justify-center"
        >
            <div
                ref={stickRef}
                className="w-12 h-12 rounded-full bg-white/50 shadow-lg"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    transition: active ? 'none' : 'transform 0.2s ease-out'
                }}
            />
        </div>
    );
};
