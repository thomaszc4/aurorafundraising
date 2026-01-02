import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DialogueOverlay } from '../DialogueOverlay';

describe('DialogueOverlay Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing initially', () => {
        const { container } = render(<DialogueOverlay />);
        expect(container.firstChild).toBeNull();
    });

    it('shows dialogue when game-show-dialogue event is fired', async () => {
        render(<DialogueOverlay />);

        window.dispatchEvent(new CustomEvent('game-show-dialogue', {
            detail: {
                speaker: 'Captain Aurora',
                text: 'Hello, adventurer!',
                portrait: '👨‍✈️'
            }
        }));

        await screen.findByText('Captain Aurora');
        expect(screen.getByText('Hello, adventurer!')).toBeInTheDocument();
        expect(screen.getByText('👨‍✈️')).toBeInTheDocument();
    });

    it('displays continue prompt', async () => {
        render(<DialogueOverlay />);

        window.dispatchEvent(new CustomEvent('game-show-dialogue', {
            detail: {
                speaker: 'NPC',
                text: 'Some dialogue'
            }
        }));

        await screen.findByText('NPC');
        expect(screen.getByText(/Press E or Click to continue/i)).toBeInTheDocument();
    });

    it('hides dialogue when game-hide-dialogue event is fired', async () => {
        const { container } = render(<DialogueOverlay />);

        // Show dialogue first
        window.dispatchEvent(new CustomEvent('game-show-dialogue', {
            detail: {
                speaker: 'NPC',
                text: 'Some dialogue'
            }
        }));

        await screen.findByText('NPC');

        // Hide dialogue
        window.dispatchEvent(new CustomEvent('game-hide-dialogue'));

        // Wait for animation
        await waitFor(() => {
            expect(container.querySelector('.opacity-0')).toBeTruthy();
        }, { timeout: 500 });
    });

    it('works without portrait', async () => {
        render(<DialogueOverlay />);

        window.dispatchEvent(new CustomEvent('game-show-dialogue', {
            detail: {
                speaker: 'Mystery Voice',
                text: 'No portrait here'
            }
        }));

        await screen.findByText('Mystery Voice');
        expect(screen.getByText('No portrait here')).toBeInTheDocument();
    });
});
