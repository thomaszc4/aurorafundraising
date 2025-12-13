export interface BrandColors {
    primary?: string;
    secondary?: string;
    accent?: string;
    'primary-blue'?: string;
    [key: string]: string | undefined;
}

// Helper to convert hex to space-separated HSL values for Tailwind
const hexToHsl = (hex: string): string | null => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    // Round values
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
};

export const applyTheme = (colors: BrandColors | null) => {
    const root = document.documentElement;

    if (!colors) {
        // Reset to defaults (defined in index.css)
        root.style.removeProperty('--primary');
        root.style.removeProperty('--primary-foreground');
        root.style.removeProperty('--primary-blue');
        root.style.removeProperty('--secondary');
        root.style.removeProperty('--accent');
        return;
    }

    // Apply Brand Colors
    if (colors.primary) {
        const hsl = hexToHsl(colors.primary);
        if (hsl) root.style.setProperty('--primary', hsl);
    }

    if (colors['primary-blue']) {
        const hsl = hexToHsl(colors['primary-blue']);
        if (hsl) root.style.setProperty('--primary-blue', hsl);
    } else if (colors.secondary) {
        // Fallback: If no primary-blue provided, maybe use secondary? 
        // For now, let's strictly check for primary-blue or just leave default
    }

    if (colors.secondary) {
        const hsl = hexToHsl(colors.secondary);
        if (hsl) root.style.setProperty('--secondary', hsl);
    }

    if (colors.accent) {
        const hsl = hexToHsl(colors.accent);
        if (hsl) root.style.setProperty('--accent', hsl);
    }
};
