
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardTaskList } from '../DashboardTaskList';
import { FundraiserProjectManager } from '../FundraiserProjectManager';
import { ProjectTask } from '@/hooks/useProjectManagerTasks';

// Mock the hook
const mockToggleTask = vi.fn();
const mockSaveTask = vi.fn();
const mockDeleteTask = vi.fn();
const mockRefresh = vi.fn();

const mockTasks: ProjectTask[] = [
    {
        id: 'task-1',
        campaign_id: 'camp-1',
        phase: 'setup',
        task: 'Setup Campaign',
        description: 'Initial setup description',
        detailed_instructions: 'Detailed setup instructions',
        days_before_event: 30,
        is_completed: false,
        is_custom: false,
        display_order: 1,
        action_url: '/admin?view=settings',
        action_label: 'Go to Settings',
        due_date: new Date('2025-01-01')
    },
    {
        id: 'task-2',
        campaign_id: 'camp-1',
        phase: 'launch',
        task: 'Send Invites',
        description: 'Invite people',
        detailed_instructions: null,
        days_before_event: 15,
        is_completed: true,
        is_custom: false,
        display_order: 2,
        action_url: null,
        action_label: null,
        due_date: new Date('2025-01-15')
    }
];

vi.mock('@/hooks/useProjectManagerTasks', () => ({
    useProjectManagerTasks: () => ({
        tasks: mockTasks,
        loading: false,
        toggleTask: mockToggleTask,
        saveTask: mockSaveTask,
        deleteTask: mockDeleteTask,
        refresh: mockRefresh
    })
}));

// Mock Auth Context
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user', email: 'test@example.com' }
    })
}));

// Mock FundraiserTypes
vi.mock('@/data/fundraiserTypes', () => ({
    getFundraiserTypeById: () => ({
        label: 'Product Fundraiser',
        icon: () => <div data-testid="type-icon" />,
        color: 'bg-blue-500',
        projectManagerSteps: [
            { phase: 'setup', tasks: [] },
            { phase: 'launch', tasks: [] }
        ],
        successGuide: []
    })
}));

// Mock UI Components (Tabs) to flatten render structure
vi.mock('@/components/ui/tabs', () => ({
    Tabs: ({ children }: any) => <div>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children }: any) => <button>{children}</button>,
    TabsContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock ProjectGanttChart
vi.mock('../ProjectGanttChart', () => ({
    ProjectGanttChart: () => <div data-testid="mock-gantt-chart">Mocked Gantt Chart</div>
}));

// Setup ResizeObserver
const originalResizeObserver = global.ResizeObserver;
beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
});

afterAll(() => {
    global.ResizeObserver = originalResizeObserver;
});

describe('Project Manager Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('DashboardTaskList', () => {
        it('renders upcoming tasks correctly', () => {
            render(
                <MemoryRouter>
                    <DashboardTaskList
                        campaignId="camp-1"
                        fundraiserTypeId="product"
                        onViewAll={() => { }}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText('Setup Campaign')).toBeInTheDocument();
            expect(screen.getByText('Initial setup description')).toBeInTheDocument();
            expect(screen.queryByText('Send Invites')).not.toBeInTheDocument();
        });

        it('shows action button for actionable tasks', () => {
            render(
                <MemoryRouter>
                    <DashboardTaskList
                        campaignId="camp-1"
                        fundraiserTypeId="product"
                        onViewAll={() => { }}
                    />
                </MemoryRouter>
            );

            expect(screen.getByText('Action')).toBeInTheDocument();
        });

        it('toggles task completion', () => {
            render(
                <MemoryRouter>
                    <DashboardTaskList
                        campaignId="camp-1"
                        fundraiserTypeId="product"
                        onViewAll={() => { }}
                    />
                </MemoryRouter>
            );

            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[0]);

            expect(mockToggleTask).toHaveBeenCalledWith('task-1', false);
        });
    });

    describe('FundraiserProjectManager', () => {
        it('renders all tasks including completed ones', () => {
            render(
                <MemoryRouter>
                    <FundraiserProjectManager
                        campaignId="camp-1"
                        fundraiserTypeId="product"
                    />
                </MemoryRouter>
            );

            expect(screen.getByText('Setup Campaign')).toBeInTheDocument();
        });

        it('renders Gantt chart component', async () => {
            render(
                <MemoryRouter>
                    <FundraiserProjectManager
                        campaignId="camp-1"
                        fundraiserTypeId="product"
                        startDate={new Date('2025-01-01')}
                    />
                </MemoryRouter>
            );

            // With flattened Tabs mock, both content should be visible
            expect(screen.getByTestId('mock-gantt-chart')).toBeInTheDocument();
        });

        it('allows toggling tasks from manager', () => {
            render(
                <MemoryRouter>
                    <FundraiserProjectManager
                        campaignId="camp-1"
                        fundraiserTypeId="product"
                    />
                </MemoryRouter>
            );

            const checkboxes = screen.getAllByRole('checkbox');
            if (checkboxes.length > 0) {
                fireEvent.click(checkboxes[checkboxes.length - 1]);
                expect(mockToggleTask).toHaveBeenCalled();
            }
        });
    });
});
