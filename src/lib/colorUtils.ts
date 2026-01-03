/**
 * Calculate the relative luminance of a color
 * Based on WCAG 2.0 guidelines
 * @param hex - Hex color string (e.g., '#FF5733' or 'FF5733')
 * @returns Luminance value between 0 (black) and 1 (white)
 */
export function getLuminance(hex: string): number {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Convert hex to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    // Apply gamma correction
    const [rs, gs, bs] = [r, g, b].map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    // Calculate relative luminance
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Get the appropriate text color (black or white) based on background color
 * @param backgroundColor - Hex color string for the background
 * @param threshold - Luminance threshold (default: 0.5, higher = more sensitive to light backgrounds)
 * @returns '#000000' for light backgrounds, '#FFFFFF' for dark backgrounds
 */
export function getContrastTextColor(
    backgroundColor: string,
    threshold: number = 0.5
): string {
    const luminance = getLuminance(backgroundColor);
    return luminance > threshold ? '#000000' : '#FFFFFF';
}

/**
 * Get Tailwind text color class based on background color
 * @param backgroundColor - Hex color string for the background
 * @returns 'text-white' for dark backgrounds, 'text-black' for light backgrounds
 */
export function getContrastTextClass(backgroundColor: string): string {
    const luminance = getLuminance(backgroundColor);
    return luminance > 0.5 ? 'text-black' : 'text-white';
}
