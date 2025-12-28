import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Lobby } from '../Lobby';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: () => ({
            update: () => ({
                eq: () => ({
                    eq: () => Promise.resolve({ data: null, error: null })
                })
            })
        })
    }
}));

describe('Lobby Component', () => {
    const defaultProps = {
        playerId: 'test-player-id',
        campaignId: 'test-campaign-id',
        displayName: 'TestPlayer',
        currentData: null,
        onReady: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the lobby screen', () => {
        render(<Lobby {...defaultProps} />);

        expect(screen.getByText('Character Customization')).toBeInTheDocument();
        expect(screen.getByText('Choose Color')).toBeInTheDocument();
        expect(screen.getByText('Enter World')).toBeInTheDocument();
    });

    it('displays color options', () => {
        render(<Lobby {...defaultProps} />);

        // Should have 6 color buttons
        const colorButtons = screen.getAllByRole('button').filter(btn =>
            btn.style.backgroundColor !== '' && btn.textContent === ''
        );
        expect(colorButtons.length).toBeGreaterThanOrEqual(6);
    });

    it('updates preview when color is selected', () => {
        render(<Lobby {...defaultProps} />);

        // Find red color button (has title="Red")
        const redButton = screen.getByTitle('Red');
        fireEvent.click(redButton);

        // Check that the button has the selected styling (border-white)
        expect(redButton).toHaveClass('border-white');
    });

    it('calls onReady with appearance data when Enter World is clicked', async () => {
        const onReady = vi.fn();
        render(<Lobby {...defaultProps} onReady={onReady} />);

        // Select a color
        fireEvent.click(screen.getByTitle('Blue'));

        // Click Enter World
        fireEvent.click(screen.getByText('Enter World'));

        await waitFor(() => {
            expect(onReady).toHaveBeenCalledWith(
                expect.objectContaining({
                    appearance: expect.objectContaining({
                        color: expect.any(Number)
                    })
                })
            );
        });
    });

    it('loads existing appearance data', () => {
        const currentData = {
            inventory: [],
            stats: { warmth: 100 },
            appearance: { color: 0xff4444 } // Red
        };

        render(<Lobby {...defaultProps} currentData={currentData} />);

        // Red button should be selected (have border)
        const redButton = screen.getByTitle('Red');
        expect(redButton).toHaveClass('border-white');
    });
});
