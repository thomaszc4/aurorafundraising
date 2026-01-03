import { ShoppingBag, LucideIcon } from 'lucide-react';

export interface FundraiserSuccessStep {
  title: string;
  description: string;
  tips?: string[];
}

export interface FundraiserType {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  avgRaised: number;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeToOrganize: string;
  successGuide: FundraiserSuccessStep[];
  defaultUnit?: string;
  projectManagerSteps: {
    phase: string;
    tasks: {
      task: string;
      daysBeforeEvent?: number;
      description: string;
      category?: string;
      actionView?: string;
      actionLabel?: string;
    }[];
  }[];
}

export interface FundraiserCategory {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  types: FundraiserType[];
}

// Product-only fundraiser type
const PRODUCT_FUNDRAISER: FundraiserType = {
  id: 'product',
  label: 'Product Fundraiser',
  icon: ShoppingBag,
  description: 'Sell unique, useful products that customers actually want. Our products generate 10x more revenue than traditional fundraisers.',
  avgRaised: 150,
  color: 'from-primary to-primary/80',
  difficulty: 'easy',
  timeToOrganize: '2-4 weeks',
  successGuide: [
    { title: 'Choose Your Products', description: 'Select the products that best fit your audience. Consider price points and profit margins.' },
    { title: 'Set Up Your Campaign', description: 'Create your fundraising page, set goals, and customize messaging for your organization.' },
    { title: 'Invite Participants', description: 'Add students/volunteers and send invitations. Each participant gets their own fundraising page.' },
    { title: 'Launch & Promote', description: 'Share on social media, send emails, and encourage participants to reach out to their networks.' },
    { title: 'Track Progress', description: 'Monitor sales in real-time, celebrate milestones, and motivate top performers.' },
    { title: 'Collect & Distribute', description: 'Receive products, organize distribution, and celebrate your success!' }
  ],
  projectManagerSteps: [
    {
      phase: 'Setup (Week 1)', tasks: [
        { task: 'Send invitations', daysBeforeEvent: 28, description: 'Share the signup link with students and volunteers so they can join the campaign', category: 'Communication', actionView: 'participants', actionLabel: 'Invite Participants' }
      ]
    },
    {
      phase: 'Launch (Week 2)', tasks: [
        {
          task: 'Kick-off announcement',
          daysBeforeEvent: 28,
          description: 'Officially announce the fundraiser to your group',
          category: 'Communication',
          actionView: 'messages&title=Fundraiser Kick-off!&content=Hi everyone, our fundraiser is officially live! Please login to your dashboard to get started.',
          actionLabel: 'Compose Message'
        },
        { task: 'Share social posts', daysBeforeEvent: 28, description: 'Post the main fundraiser link on your organization\'s social media', category: 'Marketing', actionView: 'social-posts', actionLabel: 'Create Posts' },
        {
          task: 'Send parent emails',
          daysBeforeEvent: 25,
          description: 'Email parents explaining the goals and how to help',
          category: 'Communication',
          actionView: 'messages&title=Fundraiser Information&content=Dear Parents, we are excited to announce our new fundraiser! Check your email for login instructions.',
          actionLabel: 'Compose Email'
        }
      ]
    },
    {
      phase: 'Active Selling (Weeks 2-3)', tasks: [
        { task: 'Monitor progress', daysBeforeEvent: 20, description: 'Check the dashboard daily to track sales volume', category: 'Financial', actionView: 'overview', actionLabel: 'View Dashboard' },
        {
          task: 'Send motivation email',
          daysBeforeEvent: 14,
          description: 'Encourage participants who haven\'t sold anything yet',
          category: 'Communication',
          actionView: 'messages&title=We need your help!&content=We are halfway there but need everyone to pitch in. Even 1 sale helps!',
          actionLabel: 'Send Reminder'
        },
        { task: 'Celebrate milestones', daysBeforeEvent: 15, description: 'Post updates when you reach 25%, 50%, and 75% of your goal', category: 'Marketing', actionView: 'social-posts', actionLabel: 'Create Update Post' }
      ]
    },
    {
      phase: 'Final Push (Week 4)', tasks: [
        {
          task: 'Last chance reminders',
          daysBeforeEvent: 3,
          description: 'Send a "3 Days Left" urgency email',
          category: 'Communication',
          actionView: 'messages&title=Only 3 days left!&content=This is the final push! Let\'s finish strong.',
          actionLabel: 'Send Final Push'
        },
        { task: 'Close campaign', daysBeforeEvent: 0, description: 'Officially end the fundraiser to stop new orders', category: 'Planning', actionView: 'settings', actionLabel: 'Campaign Settings' },
        { task: 'Broadcast results', daysBeforeEvent: -1, description: 'Announce the final amount raised to everyone', category: 'Marketing', actionView: 'social-posts', actionLabel: 'Create Result Post' }
      ]
    },
    {
      phase: 'Fulfillment', tasks: [
        { task: 'Process orders', daysBeforeEvent: -2, description: 'Review orders and mark them as ready for pickup/shipping', actionView: 'orders', actionLabel: 'Manage Orders' },
        { task: 'Coordinate Pickup Day', daysBeforeEvent: -5, description: 'Set a date for families to pick up their products' },
        {
          task: 'Thank donors',
          daysBeforeEvent: -7,
          description: 'Send a final thank you email to all supporters',
          actionView: 'messages&title=Thank You!&content=Thank you so much for your support. Because of you, we reached our goal!',
          actionLabel: 'Send Thank You'
        }
      ]
    }
  ]
};

// Single category for products only
export const FUNDRAISER_CATEGORIES: FundraiserCategory[] = [
  {
    id: 'product-sales',
    label: 'Product Fundraising',
    description: 'Sell unique products that people actually want to buy. Higher profits, easier selling.',
    icon: ShoppingBag,
    color: 'from-primary to-primary/80',
    types: [PRODUCT_FUNDRAISER]
  }
];

// Helper functions
export function getAllFundraiserTypes(): FundraiserType[] {
  return FUNDRAISER_CATEGORIES.flatMap(category => category.types);
}

export function getFundraiserTypeById(id: string): FundraiserType | undefined {
  return getAllFundraiserTypes().find(type => type.id === id);
}

export function getCategoryById(id: string): FundraiserCategory | undefined {
  return FUNDRAISER_CATEGORIES.find(category => category.id === id);
}
