import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestLog } from '../QuestLog';

describe('QuestLog Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when no active quest', () => {
        const { container } = render(<QuestLog />);
        // Should be empty or null
        expect(container.firstChild).toBeNull();
    });

    it('shows quest info when game-quest-update event is fired', async () => {
        render(<QuestLog />);

        // Dispatch quest update event
        window.dispatchEvent(new CustomEvent('game-quest-update', {
            detail: {
                id: 'test_quest',
                title: 'Test Quest',
                steps: [
                    { id: 'step1', description: 'Do something', completed: false },
                    { id: 'step2', description: 'Do another thing', completed: true }
                ]
            }
        }));

        // Wait for state update
        await screen.findByText('Test Quest');
        expect(screen.getByText('Do something')).toBeInTheDocument();
        expect(screen.getByText('Do another thing')).toBeInTheDocument();
    });

    it('displays completed steps with checkmark', async () => {
        render(<QuestLog />);

        window.dispatchEvent(new CustomEvent('game-quest-update', {
            detail: {
                id: 'test_quest',
                title: 'Test Quest',
                steps: [
                    { id: 'step1', description: 'Completed step', completed: true }
                ]
            }
        }));

        await screen.findByText('Test Quest');
        // Check for completed styling (line-through or checkmark) on the container
        const stepElement = screen.getByText('Completed step');
        expect(stepElement.parentElement).toHaveClass('line-through');
    });

    it('hides when quest is cleared (null detail)', async () => {
        const { container } = render(<QuestLog />);

        // First show a quest
        window.dispatchEvent(new CustomEvent('game-quest-update', {
            detail: {
                id: 'test_quest',
                title: 'Test Quest',
                steps: []
            }
        }));

        await screen.findByText('Test Quest');

        // Then clear it
        window.dispatchEvent(new CustomEvent('game-quest-update', {
            detail: null
        }));

        // Wait for it to disappear
        await waitFor(() => {
            expect(screen.queryByTestId('quest-log')).toBeNull();
        });
    });
});
