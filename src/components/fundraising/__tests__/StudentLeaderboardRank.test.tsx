import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentLeaderboardRank } from '../StudentLeaderboardRank';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        order: vi.fn(),
                    })),
                })),
            })),
        })),
    },
}));

describe('StudentLeaderboardRank Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders rank correctly when data is fetched', async () => {
        // Setup Mock response
        const mockData = [
            { id: 'other-student', total_raised: 500 },
            { id: 'target-student', total_raised: 200 }, // Rank 2
            { id: 'another-student', total_raised: 100 },
        ];

        const orderSpy = vi.fn().mockResolvedValue({ data: mockData, error: null });

        // Chain mocks
        (supabase.from as any).mockImplementation(() => ({
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        order: orderSpy
                    })
                })
            })
        }));

        render(
            <StudentLeaderboardRank
                campaignId="cmp-123"
                studentId="target-student"
                currentAmount={200}
            />
        );

        // Should find text "#2"
        await waitFor(() => {
            expect(screen.getByText('#2')).toBeInTheDocument();
            expect(screen.getByText(/of 3/i)).toBeInTheDocument();
        });
    });

    it('handles empty data gracefully (renders nothing)', async () => {
        const orderSpy = vi.fn().mockResolvedValue({ data: [], error: null });

        (supabase.from as any).mockImplementation(() => ({
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        order: orderSpy
                    })
                })
            })
        }));

        const { container } = render(
            <StudentLeaderboardRank
                campaignId="cmp-123"
                studentId="target-student"
                currentAmount={0}
            />
        );

        await waitFor(() => {
            expect(container).toBeEmptyDOMElement();
        });
    });

    it('handles API errors gracefully (renders nothing)', async () => {
        const orderSpy = vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } });

        (supabase.from as any).mockImplementation(() => ({
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        order: orderSpy
                    })
                })
            })
        }));

        const { container } = render(
            <StudentLeaderboardRank
                campaignId="cmp-123"
                studentId="target-student"
                currentAmount={0}
            />
        );

        await waitFor(() => {
            expect(container).toBeEmptyDOMElement();
        });
    });
});
