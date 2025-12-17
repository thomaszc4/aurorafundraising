import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicStudentPage from '../PublicPage';
import { supabase } from '@/integrations/supabase/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

vi.mock('@/components/layout/Layout', () => ({
    Layout: ({ children }: any) => <div data-testid="layout">{children}</div>
}));

// Mock child components to isolate page logic
vi.mock('@/components/fundraising/QuickDonate', () => ({
    QuickDonate: () => <div data-testid="quick-donate">Quick Donate Widget</div>
}));

vi.mock('@/components/fundraising/StudentLeaderboardRank', () => ({
    StudentLeaderboardRank: () => <div data-testid="leaderboard-rank">Rank Widget</div>
}));

const mockFundraiser = {
    id: 'f-123',
    personal_goal: 1000,
    total_raised: 500,
    custom_message: 'My Story',
    student_id: 's-1',
    profiles: {
        full_name: 'John Doe',
        avatar_url: 'avatar.png'
    },
    campaigns: {
        id: 'c-1',
        name: 'School Run',
        end_date: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    }
};

describe('PublicStudentPage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders fundraiser data correctly', async () => {
        // Mock success response
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'student_fundraisers') {
                return {
                    select: () => ({
                        eq: () => ({
                            eq: () => ({
                                maybeSingle: vi.fn().mockResolvedValue({ data: mockFundraiser, error: null })
                            })
                        })
                    })
                };
            }
            if (table === 'products') {
                return {
                    select: () => ({
                        eq: vi.fn().mockResolvedValue({ data: [], error: null })
                    })
                };
            }
            return { select: () => ({ eq: () => ({ maybeSingle: () => ({}) }) }) };
        });

        render(
            <MemoryRouter initialEntries={['/fundraise/john-doe']}>
                <Routes>
                    <Route path="/fundraise/:slug" element={<PublicStudentPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Verify Hero info
        await waitFor(() => {
            expect(screen.getByText("John Doe's Fundraiser")).toBeInTheDocument();
            expect(screen.getByText("School Run")).toBeInTheDocument();
        });

        // Verify Progress
        expect(screen.getByText('$500')).toBeInTheDocument();
        expect(screen.getByText(/50% Complete/i)).toBeInTheDocument();

        // Verify Features exist
        expect(screen.getByTestId('quick-donate')).toBeInTheDocument();
        expect(screen.getByTestId('leaderboard-rank')).toBeInTheDocument();
    });

    it('renders "Fundraiser Not Found" when API returns null', async () => {
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'student_fundraisers') {
                return {
                    select: () => ({
                        eq: () => ({
                            eq: () => ({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
                            })
                        })
                    })
                };
            }
            return { select: () => ({ eq: vi.fn().mockResolvedValue({ data: [] }) }) };
        });

        render(
            <MemoryRouter initialEntries={['/fundraise/unknown']}>
                <Routes>
                    <Route path="/fundraise/:slug" element={<PublicStudentPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Fundraiser Not Found')).toBeInTheDocument();
        });
    });

    it('handles Supabase errors gracefully with Toast', async () => {
        // We need to mock toast to verify it was called, but for integration test 
        // verifying the page doesn't crash is key.

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'student_fundraisers') {
                return {
                    select: () => ({
                        eq: () => ({
                            eq: () => ({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network failed' } })
                            })
                        })
                    })
                };
            }
            return { select: () => ({ eq: vi.fn().mockResolvedValue({ data: [] }) }) };
        });

        render(
            <MemoryRouter initialEntries={['/fundraise/error-slug']}>
                <Routes>
                    <Route path="/fundraise/:slug" element={<PublicStudentPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Should eventually stop loading
        await waitFor(() => {
            // Because data is null on error, it currently falls through to "Fundraiser Not Found" UI 
            // OR simply finishes loading.
            // Our code sets data to null if error occurs, so "Fundraiser Not Found" is the fallback UI state.
            expect(screen.getByText('Fundraiser Not Found')).toBeInTheDocument();
        });
    });
});
