import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CampaignSettings from '../CampaignSettings';
import Orders from '../Orders';

// Hoist mocks to ensure they are available for vi.mock
const { mockSelect, mockOrder, mockEq, mockFrom } = vi.hoisted(() => {
    return {
        mockSelect: vi.fn(),
        mockOrder: vi.fn(),
        mockEq: vi.fn(),
        mockFrom: vi.fn(),
    };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: (table: string) => {
            mockFrom(table);
            return {
                select: (...args: any[]) => {
                    mockSelect(...args);
                    return {
                        eq: (...args: any[]) => {
                            mockEq(...args);
                            return {
                                order: (...args: any[]) => {
                                    return mockOrder(...args);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}));

// We need a way to change the mock return values per test
let mockCampaignsData: any[] = [];
let mockCampaignsCount: number = 0;

// Override the specific chain implementation for the tests
mockOrder.mockImplementation(() => {
    return Promise.resolve({
        data: mockCampaignsData,
        count: mockCampaignsCount,
        error: null
    });
});

// Mock Auth Context
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id', email: 'test@example.com' },
        signOut: vi.fn(),
    }),
}));

// Mock Sidebar and AdminLayout components to avoid complex rendering
// We just want to check if "AdminLayout" is rendered containing expected children
vi.mock('@/components/layout/AdminLayout', () => ({
    AdminLayout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="admin-layout">{children}</div>
    ),
}));

describe('Page Restrictions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCampaignsData = [];
        mockCampaignsCount = 0;
    });

    describe('CampaignSettings', () => {
        it('shows Welcome screen when user has no campaigns', async () => {
            mockCampaignsCount = 0;
            mockCampaignsData = [];

            render(
                <MemoryRouter>
                    <CampaignSettings />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome to Aurora/i)).toBeInTheDocument();
                expect(screen.getByText(/Create Your First Fundraiser/i)).toBeInTheDocument();
            });
        });

        it('shows Settings form when user has active campaigns', async () => {
            mockCampaignsCount = 1;
            mockCampaignsData = [{
                id: '123',
                name: 'Test Campaign',
                brand_colors: null,
                status: 'active',
                organization_name: 'Test Org'
            }];

            render(
                <MemoryRouter>
                    <CampaignSettings />
                </MemoryRouter>
            );

            await waitFor(() => {
                // Should NOT show welcome screen
                expect(screen.queryByText(/Welcome to Aurora/i)).not.toBeInTheDocument();
                // Should show settings content
                expect(screen.getByText(/Campaign Settings/i)).toBeInTheDocument();
                expect(screen.getByText(/Configure your campaign details/i)).toBeInTheDocument();
            });
        });
    });

    describe('Orders', () => {
        it('shows Welcome screen when user has no campaigns', async () => {
            mockCampaignsCount = 0;
            mockCampaignsData = [];

            render(
                <MemoryRouter>
                    <Orders />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome to Aurora/i)).toBeInTheDocument();
                expect(screen.getByText(/start receiving orders/i)).toBeInTheDocument();
            });
        });

        it('shows Orders list when user has active campaigns', async () => {
            mockCampaignsCount = 1;
            mockCampaignsData = [{ id: '123', name: 'Test Campaign' }];

            render(
                <MemoryRouter>
                    <Orders />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(screen.queryByText(/Welcome to Aurora/i)).not.toBeInTheDocument();
                expect(screen.getByText(/Track and manage orders/i)).toBeInTheDocument();
                expect(screen.getByText(/Test Campaign/i)).toBeInTheDocument(); // Checks checking for campaign name in header
            });
        });
    });
});
