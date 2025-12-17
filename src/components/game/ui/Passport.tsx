import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

interface PassportProps {
    initialAppearance: { archetype: string, gender: string };
    onSave: (appearance: { archetype: string, gender: string }) => void;
    onClose: () => void;
}

export const PassportUI: React.FC<PassportProps> = ({ initialAppearance, onSave, onClose }) => {
    const [archetype, setArchetype] = useState(initialAppearance?.archetype || 'alpinist');
    const [gender, setGender] = useState(initialAppearance?.gender || 'm');

    const archetypes = [
        { id: 'alpinist', label: 'The Alpinist', desc: 'Heavy fur for the frozen peaks.' },
        { id: 'surveyor', label: 'The Surveyor', desc: 'Practical gear for mapping the unknown.' },
        { id: 'local', label: 'The Local', desc: 'Traditional knowledge of the land.' }
    ];

    const genders = [
        { id: 'm', label: 'Male' },
        { id: 'f', label: 'Female' }
    ];

    const getPreviewImage = () => {
        return `/assets/game/char_${archetype}_${gender}.png`; // Using the spritesheet as preview for now (will show full sheet, crop via css maybe?)
    };

    // Style for cropping the first frame of the spritesheet for preview
    const previewStyle: React.CSSProperties = {
        backgroundImage: `url(/assets/game/char_${archetype}_${gender}.png)`,
        backgroundPosition: '0px 0px', // Top-left frame (Idle/Walk 1)
        // backgroundSize: '200% 100%', // 4 frames wide? Actually our sheet is 4 frames horizontal? 
        // Wait, generated sheets are 1x4 (horizontal). 
        // If 512x512 frame, total width is 2048.
        // To show 1 frame: size 400% 100%?
        backgroundSize: '400% 100%',
        width: '128px', // Display size
        height: '128px',
        imageRendering: 'pixelated'
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            {/* PASSPORT BOOK */}
            <div className="relative w-[600px] h-[400px] bg-[#fdf6e3] rounded-lg shadow-2xl flex overflow-hidden border-4 border-[#8b5a2b]">
                {/* LEFT PAGE (Photo) */}
                <div className="w-1/2 p-6 border-r border-[#d4c5a5] flex flex-col items-center justify-center relative bg-[url('/assets/paper_texture.png')]">
                    <div className="absolute inset-0 bg-[#d4c5a5]/20 pointer-events-none"></div>

                    <h2 className="text-2xl font-serif text-[#5c4033] mb-4 tracking-widest uppercase font-bold">Identity</h2>

                    {/* PHOTO AREA */}
                    <div className="w-36 h-36 bg-white border-2 border-dashed border-gray-400 mb-4 shadow-inner flex items-center justify-center overflow-hidden relative group">
                        <div style={previewStyle} className="scale-150 transform translate-y-2"></div>
                        <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[10px] px-1">PASSPORT PHOTO</div>
                    </div>

                    <div className="text-center">
                        <p className="font-serif text-[#8b5a2b] text-sm">ARCHETYPE</p>
                        <h3 className="font-bold text-xl text-[#3e2723] uppercase">{archetypes.find(a => a.id === archetype)?.label}</h3>
                    </div>
                </div>

                {/* RIGHT PAGE (Details/Stamps) */}
                <div className="w-1/2 p-6 flex flex-col relative bg-[url('/assets/paper_texture.png')]">
                    <div className="absolute inset-0 bg-[#d4c5a5]/20 pointer-events-none"></div>

                    <div className="flex justify-end mb-4">
                        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-red-100 text-[#8b5a2b]">
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* GENDER SELECT */}
                        <div>
                            <p className="font-serif text-[#8b5a2b] text-xs mb-2 uppercase tracking-wider">Select Gender</p>
                            <div className="flex gap-2">
                                {genders.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setGender(g.id)}
                                        className={`flex-1 py-1 border-2 font-serif text-sm transition-all transform ${gender === g.id ? 'border-[#3e2723] bg-[#3e2723] text-white -rotate-1' : 'border-[#d4c5a5] text-[#8b5a2b] hover:bg-[#faeedd]'}`}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ARCHETYPE SELECT */}
                        <div>
                            <p className="font-serif text-[#8b5a2b] text-xs mb-2 uppercase tracking-wider">Select Occupation</p>
                            <div className="flex flex-col gap-2">
                                {archetypes.map(a => (
                                    <button
                                        key={a.id}
                                        onClick={() => setArchetype(a.id)}
                                        className={`w-full text-left p-2 border font-serif text-xs transition-all ${archetype === a.id ? 'border-[#3e2723] bg-[#faeedd] shadow-sm ml-2' : 'border-transparent text-[#8b5a2b] hover:bg-[#faeedd]/50'}`}
                                    >
                                        <div className="font-bold">{a.label}</div>
                                        <div className="opacity-70 text-[10px]">{a.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="mt-auto pt-4 border-t border-[#d4c5a5]">
                        <Button onClick={() => onSave({ archetype, gender })} className="w-full bg-[#3e2723] hover:bg-[#5d4037] text-[#fdf6e3] font-serif tracking-widest">
                            <Check className="w-4 h-4 mr-2" />
                            APPROVE IDENTITY
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
