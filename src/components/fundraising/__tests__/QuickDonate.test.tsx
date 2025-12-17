import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickDonate } from '../QuickDonate';

describe('QuickDonate Component', () => {
    it('renders all donation options correctly', () => {
        render(<QuickDonate onDonate={() => { }} />);

        expect(screen.getByText('$10')).toBeInTheDocument();
        expect(screen.getByText('Supporter')).toBeInTheDocument();

        expect(screen.getByText('$25')).toBeInTheDocument();
        expect(screen.getByText('$50')).toBeInTheDocument();
        expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('calls onDonate with correct amount when clicked', () => {
        const handleDonate = vi.fn();
        render(<QuickDonate onDonate={handleDonate} />);

        // Click $50 button
        fireEvent.click(screen.getByRole('button', { name: /\$50/i }));

        expect(handleDonate).toHaveBeenCalledTimes(1);
        expect(handleDonate).toHaveBeenCalledWith(50);
    });

    it('disables buttons when isLoading is true', () => {
        render(<QuickDonate onDonate={() => { }} isLoading={true} />);

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
            // Skip the "Choose custom amount" button if it's not disabled (it usually isn't in this component logic based on code)
            // But the main options should be.
            // Let's check specifically the option buttons which correspond to the first 4 buttons
            if (button.textContent?.includes('$')) {
                expect(button).toBeDisabled();
            }
        });
    });

    it('displays the custom amount option', () => {
        render(<QuickDonate onDonate={() => { }} />);
        expect(screen.getByText('Choose custom amount')).toBeInTheDocument();
    });
});
