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
        { task: 'Create campaign', daysBeforeEvent: 28, description: 'Set up your fundraiser with goals and dates', actionView: 'create', actionLabel: 'Create Campaign' },
        { task: 'Select products', daysBeforeEvent: 28, description: 'Choose products to offer', actionView: 'settings', actionLabel: 'Select Products' },
        { task: 'Add participants', daysBeforeEvent: 25, description: 'Import or add student/volunteer list', actionView: 'participants', actionLabel: 'Add Participants' },
        { task: 'Send invitations', daysBeforeEvent: 21, description: 'Invite participants to join', actionView: 'participants', actionLabel: 'Send Invitations' }
      ]
    },
    {
      phase: 'Launch (Week 2)', tasks: [
        {
          task: 'Kick-off announcement',
          daysBeforeEvent: 14,
          description: 'Announce the fundraiser officially',
          actionView: 'messages&title=Fundraiser Kick-off!&content=Hi everyone, our fundraiser is officially live! Please login to your dashboard to get started.',
          actionLabel: 'Compose Message'
        },
        { task: 'Share social posts', daysBeforeEvent: 14, description: 'Post on social media channels', actionView: 'social-posts', actionLabel: 'Create Posts' },
        {
          task: 'Send parent emails',
          daysBeforeEvent: 12,
          description: 'Email families about the fundraiser',
          actionView: 'messages&title=Fundraiser Information&content=Dear Parents, we are excited to announce our new fundraiser! Check your email for login instructions.',
          actionLabel: 'Compose Email'
        }
      ]
    },
    {
      phase: 'Active Selling (Weeks 2-3)', tasks: [
        { task: 'Monitor progress', description: 'Track sales and participant activity daily', actionView: 'overview', actionLabel: 'View Dashboard' },
        {
          task: 'Send reminders',
          daysBeforeEvent: 7,
          description: 'Remind participants to keep selling',
          actionView: 'messages&title=Keep up the great work!&content=We are halfway there! Keep sharing your link and reaching out to supporters.',
          actionLabel: 'Send Reminder'
        },
        { task: 'Celebrate milestones', description: 'Recognize achievements and top sellers', actionView: 'incentives', actionLabel: 'Setup Incentives' }
      ]
    },
    {
      phase: 'Final Push (Week 4)', tasks: [
        {
          task: 'Last chance reminders',
          daysBeforeEvent: 3,
          description: 'Final push for sales',
          actionView: 'messages&title=Only 3 days left!&content=This is the final push! Let\'s finish strong.',
          actionLabel: 'Send Final Push'
        },
        { task: 'Close campaign', daysBeforeEvent: 0, description: 'End the fundraiser', actionView: 'settings', actionLabel: 'Campaign Settings' },
        { task: 'Announce results', description: 'Share final totals and thank everyone', actionView: 'social-posts', actionLabel: 'Create Thank You Post' }
      ]
    },
    {
      phase: 'Fulfillment', tasks: [
        { task: 'Process orders', description: 'Review and finalize all orders' },
        { task: 'Coordinate delivery', description: 'Arrange product pickup or distribution' },
        {
          task: 'Thank donors',
          description: 'Send thank you messages to supporters',
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
