import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmoteMenu } from '../EmoteMenu';

describe('EmoteMenu Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the toggle button initially', () => {
        render(<EmoteMenu />);
        expect(screen.getByTitle('Emotes')).toBeInTheDocument();
    });

    it('opens menu when toggle button is clicked', () => {
        render(<EmoteMenu />);

        fireEvent.click(screen.getByTitle('Emotes'));

        expect(screen.getByText('Emotes')).toBeInTheDocument();
        expect(screen.getByTitle('Smile')).toBeInTheDocument();
        expect(screen.getByTitle('Like')).toBeInTheDocument();
        expect(screen.getByTitle('Love')).toBeInTheDocument();
    });

    it('dispatches game-trigger-emote event when emote is selected', () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<EmoteMenu />);

        // Open menu
        fireEvent.click(screen.getByTitle('Emotes'));

        // Click an emote
        fireEvent.click(screen.getByTitle('Wave'));

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'game-trigger-emote'
            })
        );

        dispatchSpy.mockRestore();
    });

    it('closes menu after emote selection', () => {
        render(<EmoteMenu />);

        // Open menu
        fireEvent.click(screen.getByTitle('Emotes'));
        expect(screen.getByText('Emotes')).toBeInTheDocument();

        // Click an emote
        fireEvent.click(screen.getByTitle('Wave'));

        // Menu should close (toggle button should be visible again)
        expect(screen.getByTitle('Emotes')).toBeInTheDocument();
    });

    it('closes menu when X button is clicked', () => {
        render(<EmoteMenu />);

        // Open menu
        fireEvent.click(screen.getByTitle('Emotes'));

        // Find and click close button (X icon)
        const closeButton = screen.getByRole('button', { name: '' }); // X button has no label
        // Actually let's find the second button which is the close
        const buttons = screen.getAllByRole('button');
        const closeBtn = buttons.find(btn => btn.querySelector('svg.lucide-x'));
        if (closeBtn) fireEvent.click(closeBtn);

        // Should be closed
        expect(screen.getByTitle('Emotes')).toBeInTheDocument();
    });
});
