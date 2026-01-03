import { Tables } from '@/integrations/supabase/types';

export type TaskStatus = 'pending' | 'completed' | 'not_applicable';

export interface ParticipantTask {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: 'auto' | 'manual';
    isComplete: (participant: Partial<Tables<'participants'>>, customStates: Record<string, boolean>, goalAmount: number) => boolean;
}

export const PARTICIPANT_TASKS: ParticipantTask[] = [
    {
        id: 'welcome',
        name: 'Welcome!',
        description: 'You joined the fundraiser. Welcome to the team!',
        icon: 'PartyPopper',
        type: 'auto',
        isComplete: () => true, // Always complete once they are in the dashboard
    },
    {
        id: 'share_link',
        name: 'Share Your Page',
        description: 'Share your personal link with 3 people to get started.',
        icon: 'Share2',
        type: 'manual',
        isComplete: (_, customStates) => !!customStates['share_link'],
    },
    {
        id: 'first_donation',
        name: 'Get Your First Donation',
        description: 'Recieve your very first donation to kick things off!',
        icon: 'Trophy',
        type: 'auto',
        isComplete: (p) => (p.total_raised || 0) > 0,
    },
    {
        id: 'halfway',
        name: 'Reach 50% of Goal',
        description: 'You are halfway there! Keep up the great work.',
        icon: 'TrendingUp',
        type: 'auto',
        isComplete: (p, _, goal) => {
            const raised = p.total_raised || 0;
            return raised >= (goal * 0.5);
        },
    },
    {
        id: 'goal_reached',
        name: 'Goal Achieved!',
        description: 'Amazing! You reached your personal fundraising goal.',
        icon: 'Crown',
        type: 'auto',
        isComplete: (p, _, goal) => {
            const raised = p.total_raised || 0;
            return raised >= goal;
        },
    },
];

export function getParticipantTaskStatus(
    participant: Partial<Tables<'participants'>>,
    taskStates: any,
    goalAmount: number = 100
) {
    const states = typeof taskStates === 'object' && taskStates !== null ? taskStates : {};

    return PARTICIPANT_TASKS.map(task => ({
        ...task,
        status: task.isComplete(participant, states, goalAmount) ? 'completed' : 'pending' as TaskStatus
    }));
}
