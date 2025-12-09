// Task Registry - Central definition of all campaign tasks
// This pattern allows new features to register tasks without modifying existing code

export type TaskActionType = 'auto' | 'navigate' | 'confirm' | 'info';

export interface TaskDefinition {
  id: string;
  name: string;
  phase: 'setup' | 'launch' | 'active' | 'closing';
  instructions: string;
  actionType: TaskActionType;
  actionUrl?: string;
  actionLabel?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  canAutomate: boolean;
  autoFunction?: string;
  prerequisites: string[];
  estimatedMinutes: number;
  category: 'setup' | 'communications' | 'engagement' | 'social' | 'closing';
  icon: string;
  // Dynamic check functions - these determine if task is needed/complete
  isApplicable?: (context: TaskContext) => boolean;
  isComplete?: (context: TaskContext) => boolean;
}

export interface TaskContext {
  campaignId: string;
  fundraiserType: string;
  hasLogo: boolean;
  hasParticipants: boolean;
  participantCount: number;
  invitationsSent: boolean;
  hasProducts: boolean;
  hasSocialPosts: boolean;
  campaignStarted: boolean;
  campaignEnded: boolean;
  daysUntilStart: number;
  daysUntilEnd: number;
  totalRaised: number;
  goalAmount: number;
}

// Core task definitions - streamlined to only essential tasks
export const TASK_REGISTRY: TaskDefinition[] = [
  // ===== SETUP PHASE =====
  {
    id: 'upload_logo',
    name: 'Upload Your Logo',
    phase: 'setup',
    instructions: 'Add your organization\'s logo to personalize your campaign. This will appear on your fundraising pages and all participant materials.',
    actionType: 'navigate',
    actionUrl: '/admin?view=settings',
    actionLabel: 'Go to Settings',
    canAutomate: false,
    prerequisites: [],
    estimatedMinutes: 2,
    category: 'setup',
    icon: 'Image',
    isComplete: (ctx) => ctx.hasLogo,
  },
  {
    id: 'select_products',
    name: 'Choose Your Products',
    phase: 'setup',
    instructions: 'Select which products your participants will sell. You can choose from our catalog of high-quality items with great profit margins.',
    actionType: 'navigate',
    actionUrl: '/admin?view=products',
    actionLabel: 'Select Products',
    canAutomate: false,
    prerequisites: [],
    estimatedMinutes: 5,
    category: 'setup',
    icon: 'Package',
    isApplicable: (ctx) => ctx.fundraiserType === 'product',
    isComplete: (ctx) => ctx.hasProducts,
  },
  {
    id: 'add_participants',
    name: 'Add Your Participants',
    phase: 'setup',
    instructions: 'Add the students, team members, or volunteers who will be fundraising. You can add them one by one or upload a CSV file with all their information.',
    actionType: 'navigate',
    actionUrl: '/admin?view=participants',
    actionLabel: 'Add Participants',
    secondaryLabel: 'Upload CSV',
    secondaryUrl: '/admin?view=participants&action=upload',
    canAutomate: false,
    prerequisites: [],
    estimatedMinutes: 10,
    category: 'setup',
    icon: 'Users',
    isComplete: (ctx) => ctx.hasParticipants,
  },

  // ===== LAUNCH PHASE =====
  {
    id: 'send_invitations',
    name: 'Send Participant Invitations',
    phase: 'launch',
    instructions: 'Send email invitations to all participants. They\'ll receive a link to create their account and access their personal fundraising page.',
    actionType: 'auto',
    actionUrl: '/admin?view=participants',
    actionLabel: 'Send Invitations Now',
    secondaryLabel: 'Preview Email',
    canAutomate: true,
    autoFunction: 'sendParticipantInvitations',
    prerequisites: ['add_participants'],
    estimatedMinutes: 1,
    category: 'communications',
    icon: 'Mail',
    isComplete: (ctx) => ctx.invitationsSent,
  },
  {
    id: 'select_social_posts',
    name: 'Choose Social Media Posts',
    phase: 'launch',
    instructions: 'Select which pre-made social media posts your participants can share. These are designed to maximize engagement and donations.',
    actionType: 'navigate',
    actionUrl: '/admin?view=posts',
    actionLabel: 'Browse Post Library',
    canAutomate: false,
    prerequisites: [],
    estimatedMinutes: 5,
    category: 'social',
    icon: 'Share2',
    isComplete: (ctx) => ctx.hasSocialPosts,
  },
  {
    id: 'launch_announcement',
    name: 'Send Launch Announcement',
    phase: 'launch',
    instructions: 'Announce the start of your fundraiser! This email goes to all participants with tips for getting started and sharing their pages.',
    actionType: 'auto',
    actionUrl: '/admin?view=email',
    actionLabel: 'Send Announcement',
    secondaryLabel: 'Customize Email',
    canAutomate: true,
    autoFunction: 'sendLaunchAnnouncement',
    prerequisites: ['send_invitations'],
    estimatedMinutes: 1,
    category: 'communications',
    icon: 'Megaphone',
  },

  // ===== ACTIVE PHASE =====
  {
    id: 'mid_campaign_reminder',
    name: 'Send Mid-Campaign Reminder',
    phase: 'active',
    instructions: 'Boost participation with a mid-campaign reminder. This email includes progress updates and encouragement to keep sharing.',
    actionType: 'auto',
    actionLabel: 'Send Reminder',
    secondaryLabel: 'Schedule for Later',
    canAutomate: true,
    autoFunction: 'sendMidCampaignReminder',
    prerequisites: ['launch_announcement'],
    estimatedMinutes: 1,
    category: 'communications',
    icon: 'Bell',
  },
  {
    id: 'final_push',
    name: 'Send Final Push Reminder',
    phase: 'active',
    instructions: 'Create urgency with a final push email. Let participants know time is running out and encourage them to make one last effort.',
    actionType: 'auto',
    actionLabel: 'Send Final Push',
    canAutomate: true,
    autoFunction: 'sendFinalPushReminder',
    prerequisites: ['mid_campaign_reminder'],
    estimatedMinutes: 1,
    category: 'communications',
    icon: 'Zap',
  },

  // ===== CLOSING PHASE =====
  {
    id: 'thank_participants',
    name: 'Thank Your Participants',
    phase: 'closing',
    instructions: 'Send a heartfelt thank you to all participants for their hard work. Include final results and celebrate achievements.',
    actionType: 'auto',
    actionUrl: '/admin?view=email',
    actionLabel: 'Send Thank You',
    secondaryLabel: 'Customize Message',
    canAutomate: true,
    autoFunction: 'sendParticipantThankYou',
    prerequisites: [],
    estimatedMinutes: 1,
    category: 'communications',
    icon: 'Heart',
  },
  {
    id: 'thank_donors',
    name: 'Thank Your Donors',
    phase: 'closing',
    instructions: 'Send appreciation emails to everyone who supported your fundraiser. A personal thank you increases the chance they\'ll donate again.',
    actionType: 'auto',
    actionUrl: '/admin?view=donors',
    actionLabel: 'Send Thank You Emails',
    secondaryLabel: 'View Donor List',
    canAutomate: true,
    autoFunction: 'sendDonorThankYou',
    prerequisites: [],
    estimatedMinutes: 1,
    category: 'communications',
    icon: 'Gift',
  },
  {
    id: 'close_campaign',
    name: 'Close Campaign',
    phase: 'closing',
    instructions: 'Mark your campaign as complete. This will finalize all orders and generate your final report.',
    actionType: 'confirm',
    actionUrl: '/admin?view=settings',
    actionLabel: 'Close Campaign',
    secondaryLabel: 'View Final Report',
    canAutomate: true,
    autoFunction: 'closeCampaign',
    prerequisites: ['thank_participants', 'thank_donors'],
    estimatedMinutes: 1,
    category: 'closing',
    icon: 'CheckCircle',
  },
];

// Get tasks for a specific phase
export function getTasksByPhase(phase: TaskDefinition['phase']): TaskDefinition[] {
  return TASK_REGISTRY.filter(task => task.phase === phase);
}

// Get tasks that are applicable for a given context
export function getApplicableTasks(context: TaskContext): TaskDefinition[] {
  return TASK_REGISTRY.filter(task => {
    if (task.isApplicable) {
      return task.isApplicable(context);
    }
    return true;
  });
}

// Get next actionable tasks (prerequisites met, not complete)
export function getNextTasks(context: TaskContext, completedTaskIds: string[]): TaskDefinition[] {
  const applicableTasks = getApplicableTasks(context);
  
  return applicableTasks.filter(task => {
    // Skip if already complete
    if (completedTaskIds.includes(task.id)) return false;
    if (task.isComplete && task.isComplete(context)) return false;
    
    // Check prerequisites
    const prereqsMet = task.prerequisites.every(prereq => 
      completedTaskIds.includes(prereq)
    );
    
    return prereqsMet;
  });
}

// Get automatable tasks
export function getAutomatableTasks(): TaskDefinition[] {
  return TASK_REGISTRY.filter(task => task.canAutomate);
}

// Get task by ID
export function getTaskById(id: string): TaskDefinition | undefined {
  return TASK_REGISTRY.find(task => task.id === id);
}

// Phase display info
export const PHASE_INFO = {
  setup: {
    label: 'Setup',
    description: 'Get your campaign ready to launch',
    color: 'bg-blue-500',
  },
  launch: {
    label: 'Launch',
    description: 'Kick off your fundraiser',
    color: 'bg-green-500',
  },
  active: {
    label: 'Active',
    description: 'Keep momentum going',
    color: 'bg-amber-500',
  },
  closing: {
    label: 'Closing',
    description: 'Wrap up and celebrate',
    color: 'bg-purple-500',
  },
};
