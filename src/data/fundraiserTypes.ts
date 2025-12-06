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
    tasks: { task: string; daysBeforeEvent?: number; description: string }[];
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
    { phase: 'Setup (Week 1)', tasks: [
      { task: 'Create campaign', daysBeforeEvent: 28, description: 'Set up your fundraiser with goals and dates' },
      { task: 'Select products', daysBeforeEvent: 28, description: 'Choose products to offer' },
      { task: 'Add participants', daysBeforeEvent: 25, description: 'Import or add student/volunteer list' },
      { task: 'Send invitations', daysBeforeEvent: 21, description: 'Invite participants to join' }
    ]},
    { phase: 'Launch (Week 2)', tasks: [
      { task: 'Kick-off announcement', daysBeforeEvent: 14, description: 'Announce the fundraiser officially' },
      { task: 'Share social posts', daysBeforeEvent: 14, description: 'Post on social media channels' },
      { task: 'Send parent emails', daysBeforeEvent: 12, description: 'Email families about the fundraiser' }
    ]},
    { phase: 'Active Selling (Weeks 2-3)', tasks: [
      { task: 'Monitor progress', description: 'Track sales and participant activity daily' },
      { task: 'Send reminders', daysBeforeEvent: 7, description: 'Remind participants to keep selling' },
      { task: 'Celebrate milestones', description: 'Recognize achievements and top sellers' }
    ]},
    { phase: 'Final Push (Week 4)', tasks: [
      { task: 'Last chance reminders', daysBeforeEvent: 3, description: 'Final push for sales' },
      { task: 'Close campaign', daysBeforeEvent: 0, description: 'End the fundraiser' },
      { task: 'Announce results', description: 'Share final totals and thank everyone' }
    ]},
    { phase: 'Fulfillment', tasks: [
      { task: 'Process orders', description: 'Review and finalize all orders' },
      { task: 'Coordinate delivery', description: 'Arrange product pickup or distribution' },
      { task: 'Thank donors', description: 'Send thank you messages to supporters' }
    ]}
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
