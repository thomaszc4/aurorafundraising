import { 
  ShoppingBag, Trophy, Footprints, Music, Bike, Waves, Target, Zap, 
  SkipForward, Mic, BookOpen, Gamepad2, Sparkles, ChefHat, PawPrint, 
  Scissors, PartyPopper, Ticket, Gift, Shirt, Recycle, Dice1, 
  Globe, Smartphone, Users, Heart, Building2, Car, Mountain,
  Coffee, UtensilsCrossed, Calendar, Video, MessageCircle, CreditCard,
  Mail, Handshake, FileText, Award, LucideIcon
} from 'lucide-react';

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

export const FUNDRAISER_CATEGORIES: FundraiserCategory[] = [
  {
    id: 'event-based',
    label: 'Event-Based',
    description: 'Gatherings or activities where participants pay fees, buy tickets, or pledge support',
    icon: PartyPopper,
    color: 'from-violet-500 to-purple-600',
    types: [
      {
        id: 'walkathon',
        label: 'Walk-a-thon',
        icon: Footprints,
        description: 'Participants walk a course to raise pledges based on distance walked or time spent. Popular and easy to organize for all ages.',
        avgRaised: 120,
        color: 'from-emerald-500 to-green-600',
        difficulty: 'easy',
        timeToOrganize: '4-6 weeks',
        defaultUnit: 'lap',
        successGuide: [
          { title: 'Set Your Date & Venue', description: 'Choose a date 4-6 weeks out. Secure a walking route at a local park, school track, or community center.' },
          { title: 'Create Pledge Forms', description: 'Design simple pledge forms where sponsors can pledge per lap or flat donations. Make digital options available.' },
          { title: 'Recruit Participants', description: 'Send invitations to students/participants. Set personal fundraising goals for each walker.' },
          { title: 'Promote the Event', description: 'Use social media, flyers, and email to spread the word. Encourage participants to share their fundraising pages.' },
          { title: 'Plan Event Day Logistics', description: 'Arrange for lap counters, water stations, first aid, and volunteers. Create a fun atmosphere with music.' },
          { title: 'Collect & Celebrate', description: 'Follow up on pledges within 2 weeks. Celebrate top fundraisers and share total results!' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (6-4 weeks before)', tasks: [
            { task: 'Set date and time', daysBeforeEvent: 42, description: 'Choose a date that avoids conflicts with major events' },
            { task: 'Secure venue/route', daysBeforeEvent: 42, description: 'Book location and get necessary permits' },
            { task: 'Set fundraising goal', daysBeforeEvent: 35, description: 'Determine overall goal and per-participant targets' },
            { task: 'Recruit volunteer committee', daysBeforeEvent: 35, description: 'Assemble 5-10 volunteers for key roles' }
          ]},
          { phase: 'Promotion (4-2 weeks before)', tasks: [
            { task: 'Create promotional materials', daysBeforeEvent: 28, description: 'Design flyers, social media graphics, email templates' },
            { task: 'Launch registration', daysBeforeEvent: 28, description: 'Open participant registration with pledge forms' },
            { task: 'Send email invitations', daysBeforeEvent: 21, description: 'Blast to all potential participants and supporters' },
            { task: 'Social media campaign', daysBeforeEvent: 14, description: 'Daily posts leading up to event' }
          ]},
          { phase: 'Preparation (2-1 weeks before)', tasks: [
            { task: 'Confirm volunteers', daysBeforeEvent: 14, description: 'Assign specific roles and schedules' },
            { task: 'Order supplies', daysBeforeEvent: 10, description: 'Water, cups, lap counters, first aid kit, signs' },
            { task: 'Plan route logistics', daysBeforeEvent: 7, description: 'Mark course, set up station locations' },
            { task: 'Send participant reminders', daysBeforeEvent: 3, description: 'Final details email with parking, check-in info' }
          ]},
          { phase: 'Event Day', tasks: [
            { task: 'Set up stations', description: 'Water stations, registration, lap counting areas' },
            { task: 'Volunteer briefing', description: 'Quick meeting to review roles and emergency procedures' },
            { task: 'Participant check-in', description: 'Register walkers, hand out materials' },
            { task: 'Track laps', description: 'Count and record each participant\'s progress' },
            { task: 'Celebrate finish', description: 'Announce top performers, thank everyone' }
          ]},
          { phase: 'Follow-up (1-2 weeks after)', tasks: [
            { task: 'Collect outstanding pledges', description: 'Send reminders to sponsors who haven\'t paid' },
            { task: 'Send thank you notes', description: 'Personal thanks to participants, sponsors, volunteers' },
            { task: 'Announce final totals', description: 'Share results via email and social media' },
            { task: 'Document lessons learned', description: 'Notes for next year\'s event' }
          ]}
        ]
      },
      {
        id: 'dance-athon',
        label: 'Dance-a-thon',
        icon: Music,
        description: 'Participants dance for extended periods, often in themed events or marathons. High energy and great for all ages.',
        avgRaised: 150,
        color: 'from-pink-500 to-rose-600',
        difficulty: 'medium',
        timeToOrganize: '6-8 weeks',
        defaultUnit: 'hour',
        successGuide: [
          { title: 'Choose Theme & Duration', description: 'Pick an exciting theme (decades, disco, etc.) and decide on duration (4-12 hours works well for most groups).' },
          { title: 'Book a Venue', description: 'Secure a space with good flooring, sound system access, and room for all participants plus spectators.' },
          { title: 'Create DJ Playlist', description: 'Prepare hours of upbeat music or hire a DJ. Mix in crowd favorites and dance challenges.' },
          { title: 'Set Up Sponsorship Levels', description: 'Create per-hour pledges or flat donation tiers. Offer incentives for top fundraisers.' },
          { title: 'Plan Rest & Refreshments', description: 'Schedule short breaks, provide water and snacks. Have medical volunteers on standby.' },
          { title: 'Document & Celebrate', description: 'Take photos/videos throughout. Announce winners and total raised at the finale!' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (8-6 weeks before)', tasks: [
            { task: 'Select theme', daysBeforeEvent: 56, description: 'Choose a fun, engaging theme that appeals to participants' },
            { task: 'Book venue', daysBeforeEvent: 56, description: 'Ensure adequate space, sound system, and flooring' },
            { task: 'Hire DJ or create playlist', daysBeforeEvent: 42, description: '8+ hours of diverse, danceable music' },
            { task: 'Plan schedule', daysBeforeEvent: 42, description: 'Break times, dance challenges, announcements' }
          ]},
          { phase: 'Promotion (6-3 weeks before)', tasks: [
            { task: 'Launch registration', daysBeforeEvent: 42, description: 'Open sign-ups with sponsorship tracking' },
            { task: 'Create themed promo materials', daysBeforeEvent: 35, description: 'Posters, social media, costume ideas' },
            { task: 'Recruit dance leaders', daysBeforeEvent: 28, description: 'People to teach group dances and keep energy high' },
            { task: 'Partner with local businesses', daysBeforeEvent: 21, description: 'Food donations, prizes, matching donations' }
          ]},
          { phase: 'Final Prep (2 weeks before)', tasks: [
            { task: 'Finalize participant list', daysBeforeEvent: 14, description: 'Confirm all registrations and pledges' },
            { task: 'Order supplies', daysBeforeEvent: 10, description: 'Decorations, snacks, drinks, glow items, prizes' },
            { task: 'Test sound equipment', daysBeforeEvent: 7, description: 'Ensure everything works perfectly' },
            { task: 'Create event schedule', daysBeforeEvent: 5, description: 'Minute-by-minute timeline for volunteers' }
          ]},
          { phase: 'Event Day', tasks: [
            { task: 'Set up venue', description: 'Decorations, sound, lighting, registration area' },
            { task: 'Participant check-in', description: 'Wristbands, pledge verification, rules review' },
            { task: 'Run dance activities', description: 'Group dances, challenges, theme hours' },
            { task: 'Track participation', description: 'Record hours danced per participant' },
            { task: 'Grand finale celebration', description: 'Final dance, total reveal, awards' }
          ]},
          { phase: 'Post-Event', tasks: [
            { task: 'Collect pledges', description: 'Follow up on outstanding sponsor payments' },
            { task: 'Share highlights', description: 'Photos, videos, testimonials on social media' },
            { task: 'Thank participants', description: 'Certificates, shout-outs, prizes' }
          ]}
        ]
      },
      {
        id: 'bike-athon',
        label: 'Bike-a-thon',
        icon: Bike,
        description: 'Cycling event with mapped routes for participants. Great for fitness-minded communities.',
        avgRaised: 140,
        color: 'from-blue-500 to-cyan-600',
        difficulty: 'hard',
        timeToOrganize: '8-10 weeks',
        defaultUnit: 'mile',
        successGuide: [
          { title: 'Map Your Route', description: 'Plan a safe cycling route with multiple distance options (5, 10, 25 miles). Get necessary permits.' },
          { title: 'Safety First', description: 'Require helmets, plan rest stops, and have support vehicles. Brief all cyclists on safety rules.' },
          { title: 'Registration System', description: 'Create online registration with waiver signing. Collect emergency contacts for all riders.' },
          { title: 'Recruit & Train Volunteers', description: 'You\'ll need route marshals, registration helpers, and SAG wagon drivers.' },
          { title: 'Sponsorship Collection', description: 'Set up per-mile pledges. Provide participants with shareable fundraising pages.' },
          { title: 'Event Day Execution', description: 'Start with a safety briefing, stagger starts if needed, and have a celebration at the finish!' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (10-8 weeks before)', tasks: [
            { task: 'Design route options', daysBeforeEvent: 70, description: 'Multiple distances for different skill levels' },
            { task: 'Get permits', daysBeforeEvent: 60, description: 'Road closures, park permissions, liability coverage' },
            { task: 'Arrange SAG support', daysBeforeEvent: 56, description: 'Support vehicles for breakdowns and emergencies' },
            { task: 'Partner with bike shops', daysBeforeEvent: 50, description: 'Mechanic support, prizes, promotion' }
          ]},
          { phase: 'Promotion (6-4 weeks before)', tasks: [
            { task: 'Launch registration', daysBeforeEvent: 42, description: 'Include waiver and emergency contact collection' },
            { task: 'Promote to cycling clubs', daysBeforeEvent: 35, description: 'Reach serious cyclists who can raise more' },
            { task: 'Create route maps', daysBeforeEvent: 28, description: 'Detailed maps with rest stops and hazards marked' }
          ]},
          { phase: 'Logistics (3-1 weeks before)', tasks: [
            { task: 'Train volunteers', daysBeforeEvent: 21, description: 'Route marshals, registration, first aid' },
            { task: 'Confirm rest stops', daysBeforeEvent: 14, description: 'Water, snacks, shade at each location' },
            { task: 'Test ride the route', daysBeforeEvent: 7, description: 'Identify and fix any issues' },
            { task: 'Prepare rider packets', daysBeforeEvent: 5, description: 'Numbers, route maps, safety info' }
          ]},
          { phase: 'Event Day', tasks: [
            { task: 'Set up start/finish', description: 'Registration, staging, celebration area' },
            { task: 'Safety briefing', description: 'Mandatory pre-ride meeting for all participants' },
            { task: 'Wave starts', description: 'Stagger departures to prevent congestion' },
            { task: 'Monitor route', description: 'Marshals and SAG support throughout' },
            { task: 'Finish line celebration', description: 'Food, awards, total announcement' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Collect pledges', description: 'Per-mile pledges based on actual distance' },
            { task: 'Share photos/results', description: 'Individual and overall accomplishments' },
            { task: 'Survey participants', description: 'Feedback for next year' }
          ]}
        ]
      },
      {
        id: 'gala-auction',
        label: 'Gala & Auction',
        icon: Award,
        description: 'Elegant evening events with silent or live auctions, dinner, and entertainment. Premium fundraising potential.',
        avgRaised: 500,
        color: 'from-amber-500 to-yellow-600',
        difficulty: 'hard',
        timeToOrganize: '12-16 weeks',
        successGuide: [
          { title: 'Set Theme & Venue', description: 'Choose an elegant venue that matches your organization\'s prestige. Select a compelling theme.' },
          { title: 'Build Auction Inventory', description: 'Solicit donated items and experiences. Aim for variety: trips, art, services, unique experiences.' },
          { title: 'Secure Sponsors', description: 'Approach businesses for table sponsorships, item donations, and underwriting.' },
          { title: 'Plan Entertainment', description: 'Book musicians, speakers, or performers. Include a compelling program with your mission.' },
          { title: 'Sell Tickets/Tables', description: 'Create ticket tiers and table packages. Promote heavily to your network.' },
          { title: 'Execute Flawlessly', description: 'Hire professional auctioneer, create beautiful displays, and have a smooth checkout process.' }
        ],
        projectManagerSteps: [
          { phase: 'Early Planning (16-12 weeks)', tasks: [
            { task: 'Set date and budget', daysBeforeEvent: 112, description: 'Avoid conflicts, determine target revenue' },
            { task: 'Book venue', daysBeforeEvent: 100, description: 'Elegant space with catering capabilities' },
            { task: 'Form planning committee', daysBeforeEvent: 90, description: 'Chairs for auction, sponsors, promotion, logistics' },
            { task: 'Select theme', daysBeforeEvent: 84, description: 'Cohesive theme for decor, invitations, program' }
          ]},
          { phase: 'Solicitation (12-6 weeks)', tasks: [
            { task: 'Create sponsor packages', daysBeforeEvent: 84, description: 'Tiered benefits for business partners' },
            { task: 'Solicit auction items', daysBeforeEvent: 70, description: 'Reach out to businesses, individuals for donations' },
            { task: 'Design invitations', daysBeforeEvent: 60, description: 'Beautiful printed or digital invites' },
            { task: 'Send save-the-dates', daysBeforeEvent: 56, description: 'Early notice to VIPs and top donors' }
          ]},
          { phase: 'Promotion (6-3 weeks)', tasks: [
            { task: 'Send formal invitations', daysBeforeEvent: 42, description: 'Full details with RSVP instructions' },
            { task: 'Launch ticket sales', daysBeforeEvent: 35, description: 'Online and personal sales push' },
            { task: 'Catalog auction items', daysBeforeEvent: 28, description: 'Photos, descriptions, starting bids' },
            { task: 'Secure entertainment', daysBeforeEvent: 21, description: 'MC, musicians, speakers confirmed' }
          ]},
          { phase: 'Final Prep (2 weeks)', tasks: [
            { task: 'Finalize guest list', daysBeforeEvent: 14, description: 'Seating chart, dietary needs, special requests' },
            { task: 'Prepare auction displays', daysBeforeEvent: 10, description: 'Bid sheets, item arrangements, signage' },
            { task: 'Rehearse program', daysBeforeEvent: 5, description: 'Run-through with MC and key speakers' },
            { task: 'Create checkout system', daysBeforeEvent: 3, description: 'Multiple payment options, efficient process' }
          ]},
          { phase: 'Event Night', tasks: [
            { task: 'Setup and decor', description: 'Transform venue to match theme' },
            { task: 'Guest check-in', description: 'Bid numbers, seating assignments' },
            { task: 'Silent auction period', description: 'Guests browse and bid' },
            { task: 'Live auction', description: 'Professional auctioneer for premium items' },
            { task: 'Fund-a-need appeal', description: 'Direct donation ask for your cause' },
            { task: 'Efficient checkout', description: 'Quick, accurate payment processing' }
          ]},
          { phase: 'Post-Event', tasks: [
            { task: 'Process payments', description: 'Complete all transactions within 48 hours' },
            { task: 'Deliver auction items', description: 'Coordinate pickup or delivery' },
            { task: 'Send thank you notes', description: 'Personal thanks to sponsors, donors, attendees' },
            { task: 'Calculate ROI', description: 'Analyze what worked for next year' }
          ]}
        ]
      },
      {
        id: 'carnival',
        label: 'Carnival/Festival',
        icon: PartyPopper,
        description: 'Fun-filled community events with games, food, and entertainment. Great for family engagement.',
        avgRaised: 300,
        color: 'from-orange-500 to-red-600',
        difficulty: 'hard',
        timeToOrganize: '8-12 weeks',
        successGuide: [
          { title: 'Choose Venue & Date', description: 'Find a large outdoor space or gymnasium. Consider weather backup plans.' },
          { title: 'Plan Games & Activities', description: 'Mix carnival games, bounce houses, face painting, and interactive booths.' },
          { title: 'Organize Food Options', description: 'Classic carnival fare: popcorn, cotton candy, hot dogs. Consider food truck partnerships.' },
          { title: 'Recruit Volunteers', description: 'Need lots of help! Game operators, food servers, ticket sellers, cleanup crew.' },
          { title: 'Sell Tickets & Wristbands', description: 'Pre-sale for discounts, wristbands for unlimited games, or individual tickets.' },
          { title: 'Create Excitement', description: 'Add a raffle, silent auction, or special attractions to boost revenue.' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (12-8 weeks)', tasks: [
            { task: 'Secure venue', daysBeforeEvent: 84, description: 'Outdoor space or large indoor facility' },
            { task: 'Create activity list', daysBeforeEvent: 70, description: 'Games, rides, entertainment lineup' },
            { task: 'Arrange rentals', daysBeforeEvent: 60, description: 'Bounce houses, game equipment, tents' },
            { task: 'Plan food service', daysBeforeEvent: 56, description: 'Vendors, volunteers, permits' }
          ]},
          { phase: 'Organization (8-4 weeks)', tasks: [
            { task: 'Recruit volunteers', daysBeforeEvent: 56, description: 'Need 30-50+ depending on size' },
            { task: 'Secure prizes', daysBeforeEvent: 42, description: 'Donated items for games and raffles' },
            { task: 'Pre-sell tickets', daysBeforeEvent: 35, description: 'Early bird pricing drives commitment' },
            { task: 'Promote heavily', daysBeforeEvent: 28, description: 'Flyers, social media, school announcements' }
          ]},
          { phase: 'Final Prep (2 weeks)', tasks: [
            { task: 'Confirm all vendors', daysBeforeEvent: 14, description: 'Final headcount and logistics' },
            { task: 'Create layout map', daysBeforeEvent: 10, description: 'Where everything goes' },
            { task: 'Assign volunteer shifts', daysBeforeEvent: 7, description: 'Clear schedules for everyone' },
            { task: 'Prepare money handling', daysBeforeEvent: 5, description: 'Change, cash boxes, payment processing' }
          ]},
          { phase: 'Event Day', tasks: [
            { task: 'Early setup', description: 'Start 3-4 hours before opening' },
            { task: 'Volunteer check-in', description: 'Brief everyone on their roles' },
            { task: 'Run activities', description: 'Keep all stations staffed and fun' },
            { task: 'Money management', description: 'Regular cash collection for security' },
            { task: 'Teardown', description: 'Efficient cleanup with volunteer help' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Return rentals', description: 'On-time to avoid fees' },
            { task: 'Calculate results', description: 'Revenue minus expenses' },
            { task: 'Thank volunteers', description: 'Recognition for everyone who helped' }
          ]}
        ]
      },
      {
        id: 'golf-tournament',
        label: 'Golf Tournament',
        icon: Target,
        description: 'Classic fundraising event attracting business professionals. High revenue potential with sponsorships.',
        avgRaised: 400,
        color: 'from-green-500 to-emerald-600',
        difficulty: 'hard',
        timeToOrganize: '12-16 weeks',
        successGuide: [
          { title: 'Book the Course', description: 'Secure a golf course 3-4 months ahead. Negotiate package pricing for groups.' },
          { title: 'Create Sponsorship Tiers', description: 'Hole sponsors, cart sponsors, title sponsor. Offer signage and recognition.' },
          { title: 'Recruit Teams', description: 'Reach out to businesses, local clubs. Offer team packages with meals included.' },
          { title: 'Plan Contest Holes', description: 'Longest drive, closest to pin, hole-in-one prizes add excitement.' },
          { title: 'Organize Reception', description: 'Post-golf dinner, awards ceremony, raffle or auction.' },
          { title: 'Execute Professionally', description: 'Smooth registration, on-course refreshments, memorable swag bags.' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (16-12 weeks)', tasks: [
            { task: 'Book golf course', daysBeforeEvent: 112, description: 'Negotiate package with carts, meals, range' },
            { task: 'Create sponsorship packages', daysBeforeEvent: 100, description: 'Multiple tiers with clear benefits' },
            { task: 'Form committee', daysBeforeEvent: 90, description: 'Sponsors chair, registration, on-course activities' }
          ]},
          { phase: 'Sponsorship Push (12-6 weeks)', tasks: [
            { task: 'Solicit sponsors', daysBeforeEvent: 84, description: 'Personal asks to business contacts' },
            { task: 'Open team registration', daysBeforeEvent: 70, description: 'Early bird pricing for first registrants' },
            { task: 'Secure hole-in-one insurance', daysBeforeEvent: 60, description: 'For big prize contests' },
            { task: 'Plan silent auction', daysBeforeEvent: 50, description: 'Items for reception' }
          ]},
          { phase: 'Logistics (6-2 weeks)', tasks: [
            { task: 'Confirm teams', daysBeforeEvent: 42, description: 'Follow up on pending registrations' },
            { task: 'Order signage', daysBeforeEvent: 28, description: 'Sponsor signs, directional signs' },
            { task: 'Plan goody bags', daysBeforeEvent: 21, description: 'Balls, tees, sponsor items' },
            { task: 'Create pairings', daysBeforeEvent: 14, description: 'Group assignments and cart signs' }
          ]},
          { phase: 'Final Week', tasks: [
            { task: 'Confirm with course', daysBeforeEvent: 7, description: 'Final numbers, special requests' },
            { task: 'Prepare registration materials', daysBeforeEvent: 5, description: 'Badges, scorecards, gift bags' },
            { task: 'Brief volunteers', daysBeforeEvent: 3, description: 'Contest holes, registration, beverage cart' }
          ]},
          { phase: 'Tournament Day', tasks: [
            { task: 'Early setup', description: 'Registration table, sponsor signage, contest holes' },
            { task: 'Player check-in', description: 'Cart assignments, rules, schedule' },
            { task: 'On-course activities', description: 'Contests, refreshments, photography' },
            { task: 'Awards reception', description: 'Dinner, prizes, thank sponsors' }
          ]},
          { phase: 'Post-Event', tasks: [
            { task: 'Send thank you notes', description: 'Sponsors, teams, volunteers' },
            { task: 'Share photos', description: 'Email and social media galleries' },
            { task: 'Document results', description: 'Total raised, lessons for next year' }
          ]}
        ]
      },
      {
        id: 'swim-athon',
        label: 'Swim-a-thon',
        icon: Waves,
        description: 'Participants swim laps, fundraising based on distances swum. Perfect for swim teams and aquatic centers.',
        avgRaised: 130,
        color: 'from-cyan-500 to-teal-600',
        difficulty: 'medium',
        timeToOrganize: '4-6 weeks',
        defaultUnit: 'lap',
        successGuide: [
          { title: 'Secure Pool Time', description: 'Book lanes at a local pool. Most facilities offer group rates for fundraising events.' },
          { title: 'Set Lap Goals', description: 'Create age-appropriate lap goals. Allow relay teams for younger swimmers.' },
          { title: 'Lifeguard Coordination', description: 'Ensure certified lifeguards are present. Brief them on your event format.' },
          { title: 'Lane Organization', description: 'Assign lanes by speed/ability. Have lap counters for each lane.' },
          { title: 'Pledge Collection', description: 'Use per-lap pledges with minimum guarantees. Online collection makes follow-up easier.' },
          { title: 'Recognition', description: 'Award certificates for participation, most laps, and top fundraisers!' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (6-4 weeks)', tasks: [
            { task: 'Reserve pool lanes', daysBeforeEvent: 42, description: 'Coordinate with facility management' },
            { task: 'Set lap goals by age', daysBeforeEvent: 35, description: 'Realistic targets for all skill levels' },
            { task: 'Design pledge forms', daysBeforeEvent: 28, description: 'Per-lap and flat donation options' }
          ]},
          { phase: 'Promotion (4-2 weeks)', tasks: [
            { task: 'Distribute pledge forms', daysBeforeEvent: 28, description: 'To all potential swimmers' },
            { task: 'Promote to families', daysBeforeEvent: 21, description: 'Email, flyers, social media' },
            { task: 'Train lap counters', daysBeforeEvent: 14, description: 'Accurate counting is essential' }
          ]},
          { phase: 'Final Prep (1 week)', tasks: [
            { task: 'Confirm lifeguards', daysBeforeEvent: 7, description: 'Adequate coverage for all lanes' },
            { task: 'Prepare lane assignments', daysBeforeEvent: 5, description: 'Group by speed/ability' },
            { task: 'Create tracking sheets', daysBeforeEvent: 3, description: 'Individual swimmer lap counts' }
          ]},
          { phase: 'Event Day', tasks: [
            { task: 'Pool setup', description: 'Lane assignments, timing equipment' },
            { task: 'Swimmer check-in', description: 'Verify pledges, assign lanes' },
            { task: 'Track laps', description: 'Accurate counting for each swimmer' },
            { task: 'Celebrate finishers', description: 'Announce achievements, photos' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Calculate results', description: 'Total laps and amounts per swimmer' },
            { task: 'Collect pledges', description: 'Based on actual laps completed' },
            { task: 'Award certificates', description: 'Recognition for all participants' }
          ]}
        ]
      },
      {
        id: 'readathon',
        label: 'Read-a-thon',
        icon: BookOpen,
        description: 'Participants read and log pages or books to collect sponsorships. Popular with schools and libraries.',
        avgRaised: 95,
        color: 'from-indigo-500 to-blue-600',
        difficulty: 'easy',
        timeToOrganize: '3-4 weeks',
        defaultUnit: 'book',
        successGuide: [
          { title: 'Set Reading Period', description: 'Typically 2-4 weeks. Decide if counting pages, books, or minutes read.' },
          { title: 'Create Reading Logs', description: 'Provide easy-to-use logs for tracking. Digital apps make this even easier.' },
          { title: 'Age-Appropriate Goals', description: 'Set realistic targets by grade level. Include read-aloud time for younger kids.' },
          { title: 'Library Partnership', description: 'Partner with school or public library for book access and reading recommendations.' },
          { title: 'Mid-Event Updates', description: 'Share progress updates to keep motivation high. Highlight top readers.' },
          { title: 'Celebration Event', description: 'Host a reading celebration with author visit, book swap, or reading party!' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (4-3 weeks)', tasks: [
            { task: 'Set reading period dates', daysBeforeEvent: 28, description: '2-4 week reading window' },
            { task: 'Choose tracking method', daysBeforeEvent: 25, description: 'Pages, minutes, or books' },
            { task: 'Create reading logs', daysBeforeEvent: 21, description: 'Paper or digital tracking' },
            { task: 'Partner with library', daysBeforeEvent: 21, description: 'Book access and recommendations' }
          ]},
          { phase: 'Launch (Week 1)', tasks: [
            { task: 'Kick-off assembly', description: 'Exciting launch with goals and prizes' },
            { task: 'Distribute logs and pledge forms', description: 'Every participant gets materials' },
            { task: 'Parent communication', description: 'Explain program and sponsorship' }
          ]},
          { phase: 'During Event', tasks: [
            { task: 'Weekly updates', description: 'Progress reports to maintain excitement' },
            { task: 'Classroom competitions', description: 'Friendly rivalry boosts participation' },
            { task: 'Social media highlights', description: 'Share reader photos and achievements' }
          ]},
          { phase: 'Wrap-up', tasks: [
            { task: 'Collect reading logs', description: 'Verify and tally results' },
            { task: 'Calculate pledge totals', description: 'Based on actual reading' },
            { task: 'Celebration event', description: 'Awards, prizes, recognition' },
            { task: 'Collect outstanding pledges', description: 'Follow up with sponsors' }
          ]}
        ]
      },
      {
        id: 'jogathon',
        label: 'Jog-a-thon',
        icon: Trophy,
        description: 'Sponsors pledge per lap or distance jogged. Great for athletic programs and school PE events.',
        avgRaised: 110,
        color: 'from-sky-500 to-blue-600',
        difficulty: 'easy',
        timeToOrganize: '4-6 weeks',
        defaultUnit: 'lap',
        successGuide: [
          { title: 'Track Preparation', description: 'Secure a running track or measured course. Mark clear start/finish lines and lap counters.' },
          { title: 'Warm-Up Plan', description: 'Schedule group warm-ups with stretching. Include music to energize participants.' },
          { title: 'Pace Groups', description: 'Create pace groups for different fitness levels. No one should feel left behind.' },
          { title: 'Hydration Stations', description: 'Set up water stations. Have sports drinks available for longer events.' },
          { title: 'Real-Time Updates', description: 'Post lap counts publicly. Cheer on runners as they hit milestones.' },
          { title: 'Cool Down & Awards', description: 'Group cool-down, announce results, and celebrate with healthy snacks!' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (6-4 weeks)', tasks: [
            { task: 'Reserve track/field', daysBeforeEvent: 42, description: 'Secure running location' },
            { task: 'Create pledge forms', daysBeforeEvent: 35, description: 'Per-lap sponsorship system' },
            { task: 'Plan course layout', daysBeforeEvent: 28, description: 'Clear markings, water stations' }
          ]},
          { phase: 'Promotion (4-2 weeks)', tasks: [
            { task: 'Distribute materials', daysBeforeEvent: 28, description: 'Pledge forms to all participants' },
            { task: 'Set individual goals', daysBeforeEvent: 21, description: 'Motivating targets for each jogger' },
            { task: 'Recruit volunteers', daysBeforeEvent: 14, description: 'Lap counters, water station, first aid' }
          ]},
          { phase: 'Final Prep', tasks: [
            { task: 'Confirm logistics', daysBeforeEvent: 7, description: 'Venue, supplies, volunteers' },
            { task: 'Create lap tracking system', daysBeforeEvent: 5, description: 'Cards, wristbands, or electronic' },
            { task: 'Prepare awards', daysBeforeEvent: 3, description: 'Certificates, prizes for top performers' }
          ]},
          { phase: 'Event Day', tasks: [
            { task: 'Setup course', description: 'Markers, stations, start/finish' },
            { task: 'Group warm-up', description: 'Stretching and energy building' },
            { task: 'Track laps', description: 'Accurate counting for each participant' },
            { task: 'Cool down and celebrate', description: 'Awards, snacks, total announcement' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Calculate totals', description: 'Laps and pledges per participant' },
            { task: 'Collect pledges', description: 'Based on actual performance' },
            { task: 'Thank sponsors', description: 'Share results and impact' }
          ]}
        ]
      },
      {
        id: 'game-athon',
        label: 'Game-a-thon',
        icon: Gamepad2,
        description: 'Gaming marathons where players raise funds based on playtime or achievements. Appeals to younger demographics.',
        avgRaised: 120,
        color: 'from-purple-500 to-indigo-600',
        difficulty: 'medium',
        timeToOrganize: '3-4 weeks',
        defaultUnit: 'hour',
        successGuide: [
          { title: 'Platform & Games', description: 'Choose games that allow multiplayer or streaming. Popular games attract more sponsors.' },
          { title: 'Streaming Setup', description: 'Set up Twitch or YouTube streaming. Viewers can donate in real-time.' },
          { title: 'Duration Planning', description: '12-24 hour events are popular. Plan shifts if doing longer marathons.' },
          { title: 'Donation Goals', description: 'Create milestone goals that unlock special gaming challenges or rewards.' },
          { title: 'Viewer Engagement', description: 'Interact with chat, do donation shoutouts, and offer incentives for donations.' },
          { title: 'Health & Safety', description: 'Take breaks, stay hydrated, and stretch. End with a highlight reel and thank donors!' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (4-3 weeks)', tasks: [
            { task: 'Select games', daysBeforeEvent: 28, description: 'Popular, streamable titles' },
            { task: 'Setup streaming', daysBeforeEvent: 21, description: 'Twitch/YouTube with donation integration' },
            { task: 'Create schedule', daysBeforeEvent: 14, description: 'Game rotation, break times' }
          ]},
          { phase: 'Promotion (2 weeks)', tasks: [
            { task: 'Announce event', daysBeforeEvent: 14, description: 'Social media, gaming communities' },
            { task: 'Set donation milestones', daysBeforeEvent: 10, description: 'Unlock challenges at certain amounts' },
            { task: 'Create overlay/graphics', daysBeforeEvent: 7, description: 'Professional stream appearance' }
          ]},
          { phase: 'Event', tasks: [
            { task: 'Test all equipment', description: 'Before going live' },
            { task: 'Start stream', description: 'Welcoming intro, explain cause' },
            { task: 'Engage viewers', description: 'Chat interaction, donation shoutouts' },
            { task: 'Hit milestones', description: 'Special challenges keep interest high' },
            { task: 'Grand finale', description: 'Thank donors, reveal total' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Process donations', description: 'Ensure all payments complete' },
            { task: 'Share highlights', description: 'Best moments on social media' },
            { task: 'Thank participants', description: 'Shoutouts to top donors and players' }
          ]}
        ]
      }
    ]
  },
  {
    id: 'product-sales',
    label: 'Product & Sales',
    description: 'Participants sell items to generate profit margins',
    icon: ShoppingBag,
    color: 'from-amber-500 to-orange-600',
    types: [
      {
        id: 'product',
        label: 'Product Sale',
        icon: ShoppingBag,
        description: 'Students sell products that people actually need. Proven fundraising method with established profit margins.',
        avgRaised: 150,
        color: 'from-amber-500 to-orange-600',
        difficulty: 'easy',
        timeToOrganize: '2-3 weeks',
        successGuide: [
          { title: 'Choose Products', description: 'Select high-quality items with good profit margins. Consider seasonal appeal and broad market appeal.' },
          { title: 'Set Student Goals', description: 'Give each student a realistic selling target. Provide incentive prizes for top sellers.' },
          { title: 'Create Sales Materials', description: 'Order forms, product samples, digital catalog links. Make it easy for students to share.' },
          { title: 'Train Sellers', description: 'Quick tips on approaching potential buyers, explaining the cause, and taking orders.' },
          { title: 'Track Progress', description: 'Weekly updates on sales totals. Celebrate milestones and encourage friendly competition.' },
          { title: 'Fulfill Orders', description: 'Coordinate product delivery, distribute to buyers, and collect any outstanding payments.' }
        ],
        projectManagerSteps: [
          { phase: 'Setup (3-2 weeks before)', tasks: [
            { task: 'Select products', daysBeforeEvent: 21, description: 'High-margin, appealing items' },
            { task: 'Create order forms', daysBeforeEvent: 18, description: 'Paper and digital options' },
            { task: 'Set incentive prizes', daysBeforeEvent: 14, description: 'Motivate top performers' }
          ]},
          { phase: 'Launch', tasks: [
            { task: 'Kick-off meeting', description: 'Explain products, goals, prizes' },
            { task: 'Distribute materials', description: 'Catalogs, order forms, samples' },
            { task: 'Parent letter', description: 'Explain program and support needed' }
          ]},
          { phase: 'Selling Period', tasks: [
            { task: 'Weekly check-ins', description: 'Track progress, encourage sellers' },
            { task: 'Mid-point push', description: 'Extra motivation for lagging sales' },
            { task: 'Final week reminder', description: 'Last chance messaging' }
          ]},
          { phase: 'Close-out', tasks: [
            { task: 'Collect all orders', description: 'Final tally and verification' },
            { task: 'Submit order', description: 'To product supplier' },
            { task: 'Distribute products', description: 'Get items to buyers' },
            { task: 'Celebrate success', description: 'Awards for top sellers' }
          ]}
        ]
      },
      {
        id: 'quickstove',
        label: 'QuickStove',
        icon: ChefHat,
        description: 'Sell QuickStove portable camping stoves through Aurora. High-profit product with proven $150 average per student.',
        avgRaised: 150,
        color: 'from-orange-500 to-red-600',
        difficulty: 'easy',
        timeToOrganize: '2-4 weeks',
        successGuide: [
          { title: 'Set Up Aurora Account', description: 'Create your campaign on Aurora and add QuickStove products to your catalog.' },
          { title: 'Add Students', description: 'Invite students to join the campaign. Each gets their own personalized fundraising page.' },
          { title: 'Students Share Pages', description: 'Students share their personal fundraising links with family, friends, and neighbors.' },
          { title: 'Track Orders', description: 'Monitor sales in real-time through the Aurora dashboard. See which students are top performers.' },
          { title: 'Deliver Products', description: 'Coordinate product delivery. Aurora handles fulfillment to make it easy.' },
          { title: 'Celebrate Success', description: 'Recognize top sellers and celebrate reaching your goal!' }
        ],
        projectManagerSteps: [
          { phase: 'Setup (2-1 weeks before)', tasks: [
            { task: 'Create Aurora campaign', daysBeforeEvent: 14, description: 'Set up organization and goal' },
            { task: 'Add students', daysBeforeEvent: 12, description: 'Invite all participants' },
            { task: 'Set incentive prizes', daysBeforeEvent: 10, description: 'Motivate top performers' }
          ]},
          { phase: 'Launch', tasks: [
            { task: 'Kick-off meeting', description: 'Explain the fundraiser, show student pages' },
            { task: 'Share page links', description: 'Ensure all students have their links' },
            { task: 'Parent notification', description: 'Explain how to support their student' }
          ]},
          { phase: 'Selling Period (2-3 weeks)', tasks: [
            { task: 'Weekly check-ins', description: 'Review dashboard, encourage sellers' },
            { task: 'Social media push', description: 'Help students share their pages' },
            { task: 'Mid-point celebration', description: 'Recognize early leaders' }
          ]},
          { phase: 'Close-out', tasks: [
            { task: 'Final push', description: 'Last chance to order messaging' },
            { task: 'Coordinate delivery', description: 'Plan product distribution' },
            { task: 'Celebrate success', description: 'Awards ceremony for top sellers' }
          ]}
        ]
      },
      {
        id: 'bake-sale',
        label: 'Bake Sale',
        icon: ChefHat,
        description: 'Classic fundraiser with homemade or donated baked goods. Low cost, high community engagement.',
        avgRaised: 75,
        color: 'from-rose-500 to-pink-600',
        difficulty: 'easy',
        timeToOrganize: '1-2 weeks',
        successGuide: [
          { title: 'Set Date & Location', description: 'High-traffic location: school event, church, community center. Get necessary permits.' },
          { title: 'Recruit Bakers', description: 'Sign-up sheet for donations. Suggest popular items and quantities needed.' },
          { title: 'Price Items', description: 'Keep prices reasonable ($1-5 range). Round numbers make transactions easy.' },
          { title: 'Display Attractively', description: 'Tablecloths, signs, clear labeling. Note any allergens in ingredients.' },
          { title: 'Staff the Table', description: 'Friendly volunteers in shifts. Have change ready and consider card payments.' },
          { title: 'Sell Out!', description: 'Discount items near close if needed. Donate unsold items to local shelter.' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (2 weeks before)', tasks: [
            { task: 'Set date and location', daysBeforeEvent: 14, description: 'High-traffic area with permission' },
            { task: 'Create signup sheet', daysBeforeEvent: 12, description: 'For bakers and volunteers' },
            { task: 'Set pricing', daysBeforeEvent: 10, description: 'Consistent, easy-to-calculate prices' }
          ]},
          { phase: 'Preparation (1 week)', tasks: [
            { task: 'Confirm bakers', daysBeforeEvent: 7, description: 'Follow up on commitments' },
            { task: 'Get supplies', daysBeforeEvent: 5, description: 'Bags, napkins, signs, cash box' },
            { task: 'Create labels', daysBeforeEvent: 3, description: 'Ingredient/allergen info' }
          ]},
          { phase: 'Event Day', tasks: [
            { task: 'Collect baked goods', description: 'Morning of or night before' },
            { task: 'Set up display', description: 'Attractive, organized presentation' },
            { task: 'Staff table', description: 'Rotating volunteer shifts' },
            { task: 'Track sales', description: 'Monitor inventory and money' },
            { task: 'End-of-day discounts', description: 'Move remaining inventory' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Count money', description: 'Accurate final total' },
            { task: 'Thank bakers', description: 'Appreciation for donations' },
            { task: 'Donate leftovers', description: 'To shelter or food bank' }
          ]}
        ]
      },
      {
        id: 'merchandise',
        label: 'Spirit Merchandise',
        icon: Shirt,
        description: 'Custom t-shirts, hoodies, and gear with your logo. Great for school spirit and ongoing brand awareness.',
        avgRaised: 125,
        color: 'from-blue-500 to-indigo-600',
        difficulty: 'medium',
        timeToOrganize: '4-6 weeks',
        successGuide: [
          { title: 'Design Your Items', description: 'Create compelling designs that people want to wear. Get input from your community.' },
          { title: 'Choose Quality Products', description: 'Work with reputable vendors. Order samples before committing to large orders.' },
          { title: 'Calculate Pricing', description: 'Cost plus markup for profit. Consider bulk ordering for better margins.' },
          { title: 'Pre-Order Campaign', description: 'Collect orders before placing bulk order. Reduces risk and ensures right sizes.' },
          { title: 'Promote Heavily', description: 'Social media, email, events. Show people wearing the merchandise.' },
          { title: 'Distribute Orders', description: 'Efficient pickup system. Consider shipping option for distance buyers.' }
        ],
        projectManagerSteps: [
          { phase: 'Design (6-4 weeks)', tasks: [
            { task: 'Create designs', daysBeforeEvent: 42, description: 'Compelling, wearable graphics' },
            { task: 'Select vendor', daysBeforeEvent: 35, description: 'Quality, price, turnaround time' },
            { task: 'Order samples', daysBeforeEvent: 28, description: 'Verify quality before committing' }
          ]},
          { phase: 'Pre-Order (4-2 weeks)', tasks: [
            { task: 'Set up order system', daysBeforeEvent: 28, description: 'Online form with size/color options' },
            { task: 'Launch campaign', daysBeforeEvent: 25, description: 'Promotional push to community' },
            { task: 'Photo campaign', daysBeforeEvent: 21, description: 'People wearing samples' }
          ]},
          { phase: 'Order & Fulfillment', tasks: [
            { task: 'Close pre-orders', daysBeforeEvent: 14, description: 'Final order count' },
            { task: 'Place bulk order', daysBeforeEvent: 12, description: 'With vendor' },
            { task: 'Receive shipment', daysBeforeEvent: 5, description: 'Quality check all items' },
            { task: 'Organize by buyer', description: 'Sort for distribution' },
            { task: 'Distribution event', description: 'Pickup day or shipping' }
          ]}
        ]
      },
      {
        id: 'raffle',
        label: 'Raffle/50-50',
        icon: Dice1,
        description: 'Sell tickets for a chance to win prizes or split pot. Easy to organize with high engagement.',
        avgRaised: 100,
        color: 'from-purple-500 to-violet-600',
        difficulty: 'easy',
        timeToOrganize: '2-4 weeks',
        successGuide: [
          { title: 'Check Legal Requirements', description: 'Verify raffle laws in your area. Some jurisdictions require permits or have restrictions.' },
          { title: 'Secure Great Prizes', description: 'Donated items keep costs low. Mix big-ticket items with smaller prizes.' },
          { title: 'Print Tickets', description: 'Numbered tickets with your org info. Sell singles and bulk packages.' },
          { title: 'Sell Tickets Widely', description: 'Events, door-to-door, online. Set a deadline and create urgency.' },
          { title: 'Hold the Drawing', description: 'Public event adds excitement. Record video for transparency.' },
          { title: 'Award Prizes', description: 'Contact winners immediately. Share winner photos (with permission).' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (4-3 weeks)', tasks: [
            { task: 'Check legal requirements', daysBeforeEvent: 28, description: 'Permits, restrictions in your area' },
            { task: 'Solicit prize donations', daysBeforeEvent: 25, description: 'Approach businesses and individuals' },
            { task: 'Print tickets', daysBeforeEvent: 21, description: 'Numbered, professional looking' }
          ]},
          { phase: 'Sales (3-1 weeks)', tasks: [
            { task: 'Launch ticket sales', daysBeforeEvent: 21, description: 'In-person and online options' },
            { task: 'Promote prizes', daysBeforeEvent: 14, description: 'Photos and descriptions' },
            { task: 'Mid-point push', daysBeforeEvent: 10, description: 'Increase urgency' },
            { task: 'Final sales push', daysBeforeEvent: 5, description: 'Last chance messaging' }
          ]},
          { phase: 'Drawing', tasks: [
            { task: 'Collect all ticket stubs', description: 'Account for all sold tickets' },
            { task: 'Hold public drawing', description: 'Event with audience' },
            { task: 'Record drawing', description: 'Video for transparency' },
            { task: 'Contact winners', description: 'Immediate notification' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Distribute prizes', description: 'Pickup or delivery' },
            { task: 'Share winner photos', description: 'With permission, on social media' },
            { task: 'Thank donors', description: 'Recognition for prize providers' }
          ]}
        ]
      },
      {
        id: 'shoe-drive',
        label: 'Shoe Drive',
        icon: Recycle,
        description: 'Collect gently used shoes for recycling programs. Paid per pound—no selling required!',
        avgRaised: 80,
        color: 'from-green-500 to-teal-600',
        difficulty: 'easy',
        timeToOrganize: '4-6 weeks',
        successGuide: [
          { title: 'Partner with Shoe Recycler', description: 'Organizations like Funds2Orgs pay per pound of collected shoes.' },
          { title: 'Set Collection Goal', description: 'Aim for 2,500+ pairs for meaningful revenue. More shoes = more money.' },
          { title: 'Place Collection Boxes', description: 'Schools, businesses, churches, community centers. The more locations, the better.' },
          { title: 'Promote the Drive', description: 'Flyers, social media, announcements. Make it easy to participate.' },
          { title: 'Collect & Sort', description: 'Gather shoes regularly. Pair and bag them according to partner requirements.' },
          { title: 'Ship & Get Paid', description: 'Arrange pickup or shipping. Receive payment based on weight collected.' }
        ],
        projectManagerSteps: [
          { phase: 'Setup (6-4 weeks)', tasks: [
            { task: 'Partner with recycler', daysBeforeEvent: 42, description: 'Funds2Orgs or similar organization' },
            { task: 'Set collection goal', daysBeforeEvent: 35, description: 'Target number of pairs' },
            { task: 'Secure collection locations', daysBeforeEvent: 28, description: 'Schools, businesses, churches' }
          ]},
          { phase: 'Collection Period (4 weeks)', tasks: [
            { task: 'Deploy boxes', description: 'Labeled collection containers' },
            { task: 'Launch promotion', description: 'Flyers, social media, announcements' },
            { task: 'Weekly collection', description: 'Empty boxes, track progress' },
            { task: 'Mid-point push', description: 'Remind community, update on progress' }
          ]},
          { phase: 'Wrap-up', tasks: [
            { task: 'Final collection', description: 'Gather all remaining shoes' },
            { task: 'Sort and bag', description: 'Per partner requirements' },
            { task: 'Arrange shipping', description: 'Schedule pickup or drop-off' },
            { task: 'Receive payment', description: 'Based on weight/pairs' }
          ]}
        ]
      }
    ]
  },
  {
    id: 'online-digital',
    label: 'Online & Digital',
    description: 'Low-overhead options leveraging technology for broad reach',
    icon: Globe,
    color: 'from-cyan-500 to-blue-600',
    types: [
      {
        id: 'crowdfunding',
        label: 'Crowdfunding Campaign',
        icon: Globe,
        description: 'Online campaigns on platforms like GoFundMe. Reach donors worldwide with compelling stories.',
        avgRaised: 200,
        color: 'from-teal-500 to-cyan-600',
        difficulty: 'easy',
        timeToOrganize: '1-2 weeks',
        successGuide: [
          { title: 'Choose Your Platform', description: 'GoFundMe, Kickstarter, or cause-specific platforms. Consider fees and features.' },
          { title: 'Craft Your Story', description: 'Compelling narrative with photos/video. Show the impact of donations.' },
          { title: 'Set Realistic Goal', description: 'Research similar campaigns. Set achievable target with stretch goals.' },
          { title: 'Launch with Momentum', description: 'Get early donations from close contacts. Early success attracts more donors.' },
          { title: 'Share Relentlessly', description: 'Social media, email, personal outreach. Ask supporters to share.' },
          { title: 'Update Regularly', description: 'Progress updates keep donors engaged. Thank contributors publicly.' }
        ],
        projectManagerSteps: [
          { phase: 'Preparation (2 weeks before)', tasks: [
            { task: 'Choose platform', daysBeforeEvent: 14, description: 'Compare fees and features' },
            { task: 'Write story', daysBeforeEvent: 12, description: 'Compelling, emotional narrative' },
            { task: 'Gather visuals', daysBeforeEvent: 10, description: 'Photos, video for campaign' },
            { task: 'Set goal', daysBeforeEvent: 7, description: 'Realistic target amount' }
          ]},
          { phase: 'Launch', tasks: [
            { task: 'Create campaign page', description: 'Story, images, goal' },
            { task: 'Seed with early donations', description: 'Close contacts give first' },
            { task: 'Announce launch', description: 'Email blast, social media' }
          ]},
          { phase: 'Ongoing (Campaign Duration)', tasks: [
            { task: 'Daily sharing', description: 'Social media posts' },
            { task: 'Personal outreach', description: 'Direct asks to network' },
            { task: 'Post updates', description: 'Progress milestones, thank donors' },
            { task: 'Ask for shares', description: 'Expand reach through supporters' }
          ]},
          { phase: 'Close-out', tasks: [
            { task: 'Final push', description: 'Last chance messaging' },
            { task: 'Thank all donors', description: 'Personal appreciation' },
            { task: 'Share results', description: 'Final total and impact' },
            { task: 'Withdraw funds', description: 'Transfer to organization' }
          ]}
        ]
      },
      {
        id: 'peer-to-peer',
        label: 'Peer-to-Peer',
        icon: Users,
        description: 'Supporters create their own fundraising pages. Multiplies your reach through personal networks.',
        avgRaised: 175,
        color: 'from-blue-500 to-indigo-600',
        difficulty: 'medium',
        timeToOrganize: '3-4 weeks',
        successGuide: [
          { title: 'Set Up Campaign Platform', description: 'Choose a peer-to-peer platform. Create main campaign page with branding.' },
          { title: 'Recruit Fundraisers', description: 'Identify passionate supporters willing to create personal pages.' },
          { title: 'Provide Resources', description: 'Templates, talking points, images. Make it easy for fundraisers to share.' },
          { title: 'Set Individual Goals', description: 'Give each fundraiser a target. Create leaderboard for friendly competition.' },
          { title: 'Support Your Fundraisers', description: 'Regular check-ins, encouragement, tips. Help them succeed.' },
          { title: 'Celebrate & Thank', description: 'Recognize top performers. Thank everyone who participated.' }
        ],
        projectManagerSteps: [
          { phase: 'Setup (4 weeks before)', tasks: [
            { task: 'Choose platform', daysBeforeEvent: 28, description: 'Peer-to-peer capable system' },
            { task: 'Create main page', daysBeforeEvent: 25, description: 'Campaign branding and story' },
            { task: 'Recruit fundraisers', daysBeforeEvent: 21, description: 'Identify passionate supporters' }
          ]},
          { phase: 'Launch (3 weeks before)', tasks: [
            { task: 'Train fundraisers', daysBeforeEvent: 21, description: 'How to use platform, share, ask' },
            { task: 'Provide resources', daysBeforeEvent: 18, description: 'Templates, images, talking points' },
            { task: 'Launch personal pages', daysBeforeEvent: 14, description: 'All fundraisers go live' }
          ]},
          { phase: 'Campaign Period', tasks: [
            { task: 'Weekly check-ins', description: 'Support and encourage fundraisers' },
            { task: 'Share leaderboard', description: 'Friendly competition updates' },
            { task: 'Celebrate milestones', description: 'Public recognition of achievements' }
          ]},
          { phase: 'Wrap-up', tasks: [
            { task: 'Final push', description: 'Encourage last donations' },
            { task: 'Announce winners', description: 'Top fundraiser recognition' },
            { task: 'Thank everyone', description: 'Fundraisers and donors' },
            { task: 'Share impact', description: 'Total raised and how it helps' }
          ]}
        ]
      },
      {
        id: 'virtual-event',
        label: 'Virtual Event',
        icon: Video,
        description: 'Online events like trivia nights, concerts, or fitness classes. No venue costs, unlimited attendance.',
        avgRaised: 150,
        color: 'from-purple-500 to-pink-600',
        difficulty: 'medium',
        timeToOrganize: '3-4 weeks',
        successGuide: [
          { title: 'Choose Event Format', description: 'Trivia, talent show, fitness class, cooking demo. What engages your audience?' },
          { title: 'Select Platform', description: 'Zoom, YouTube Live, or dedicated event platform. Consider interactivity needs.' },
          { title: 'Plan Content', description: 'Engaging programming with your cause woven in. Include donation moments.' },
          { title: 'Promote Registration', description: 'Free or ticketed entry. Collect email addresses for follow-up.' },
          { title: 'Execute Smoothly', description: 'Test technology beforehand. Have backup plans for technical issues.' },
          { title: 'Follow Up', description: 'Thank attendees, share recording, make final donation ask.' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (4-3 weeks)', tasks: [
            { task: 'Choose event type', daysBeforeEvent: 28, description: 'What will engage your audience?' },
            { task: 'Select platform', daysBeforeEvent: 25, description: 'Zoom, YouTube Live, etc.' },
            { task: 'Plan content', daysBeforeEvent: 21, description: 'Schedule, hosts, activities' }
          ]},
          { phase: 'Promotion (3-1 weeks)', tasks: [
            { task: 'Create registration', daysBeforeEvent: 21, description: 'Ticketing or free signup' },
            { task: 'Promote event', daysBeforeEvent: 18, description: 'Email, social media campaign' },
            { task: 'Send reminders', daysBeforeEvent: 3, description: 'With login details' }
          ]},
          { phase: 'Event Day', tasks: [
            { task: 'Test technology', description: 'Audio, video, screen sharing' },
            { task: 'Run event', description: 'Engaging content with donation asks' },
            { task: 'Monitor chat', description: 'Engagement and technical issues' },
            { task: 'Thank attendees', description: 'Live appreciation' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Share recording', description: 'For those who missed it' },
            { task: 'Send thank you', description: 'With donation link' },
            { task: 'Calculate ROI', description: 'Attendance, donations, engagement' }
          ]}
        ]
      },
      {
        id: 'dine-to-donate',
        label: 'Dine-to-Donate',
        icon: UtensilsCrossed,
        description: 'Partner with restaurants to donate a percentage of sales. Easy for supporters to participate.',
        avgRaised: 100,
        color: 'from-orange-500 to-red-600',
        difficulty: 'easy',
        timeToOrganize: '2-3 weeks',
        successGuide: [
          { title: 'Approach Restaurants', description: 'Local restaurants often love to support community causes. Ask for 10-20% of sales.' },
          { title: 'Negotiate Terms', description: 'Date, time, percentage, any requirements (flyer at check-in, mention cause).' },
          { title: 'Promote Heavily', description: 'The more diners, the more raised. Social media, flyers, email blast.' },
          { title: 'Make It Easy', description: 'Clear instructions: when, where, what to say. Digital flyer to show.' },
          { title: 'Thank the Restaurant', description: 'Public appreciation. Consider future partnership.' },
          { title: 'Share Results', description: 'Let supporters know the impact of their dinner out.' }
        ],
        projectManagerSteps: [
          { phase: 'Setup (3 weeks before)', tasks: [
            { task: 'Identify restaurants', daysBeforeEvent: 21, description: 'Local spots likely to participate' },
            { task: 'Pitch partnership', daysBeforeEvent: 18, description: 'Meeting with manager' },
            { task: 'Finalize terms', daysBeforeEvent: 14, description: 'Date, percentage, requirements' }
          ]},
          { phase: 'Promotion (2 weeks)', tasks: [
            { task: 'Create promotional materials', daysBeforeEvent: 14, description: 'Flyers, social graphics' },
            { task: 'Email community', daysBeforeEvent: 12, description: 'Save the date announcement' },
            { task: 'Social media campaign', daysBeforeEvent: 7, description: 'Daily posts leading up' },
            { task: 'Day-of reminders', description: 'Final push notifications' }
          ]},
          { phase: 'Event Day', tasks: [
            { task: 'Remind supporters', description: 'Morning reminder posts' },
            { task: 'Share photos', description: 'Live posts from restaurant' },
            { task: 'Thank diners', description: 'Appreciation for participation' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Get sales report', description: 'From restaurant' },
            { task: 'Collect check', description: 'Donation percentage' },
            { task: 'Thank restaurant', description: 'Public appreciation' },
            { task: 'Share results', description: 'Total raised announcement' }
          ]}
        ]
      },
      {
        id: 'social-challenge',
        label: 'Social Media Challenge',
        icon: MessageCircle,
        description: 'Viral challenges with donation component. Think Ice Bucket Challenge. Massive reach potential.',
        avgRaised: 250,
        color: 'from-pink-500 to-rose-600',
        difficulty: 'medium',
        timeToOrganize: '2-3 weeks',
        successGuide: [
          { title: 'Create Compelling Challenge', description: 'Fun, shareable, connected to your cause. Easy to participate and film.' },
          { title: 'Make It Viral-Worthy', description: 'Simple rules, hashtag, nomination element. Should be fun to watch.' },
          { title: 'Seed with Influencers', description: 'Get local celebrities, leaders, influencers to participate first.' },
          { title: 'Clear Donation Link', description: 'Every post should include easy donation link. Make giving simple.' },
          { title: 'Engage & Amplify', description: 'Like, share, comment on every participant. Keep momentum going.' },
          { title: 'Thank Participants', description: 'Public recognition. Share total impact achieved.' }
        ],
        projectManagerSteps: [
          { phase: 'Design (3 weeks before)', tasks: [
            { task: 'Create challenge concept', daysBeforeEvent: 21, description: 'Fun, shareable, connected to cause' },
            { task: 'Develop rules', daysBeforeEvent: 18, description: 'Simple, clear participation guidelines' },
            { task: 'Create hashtag', daysBeforeEvent: 15, description: 'Unique, memorable tag' }
          ]},
          { phase: 'Seeding (2 weeks)', tasks: [
            { task: 'Recruit influencers', daysBeforeEvent: 14, description: 'Local celebrities to launch' },
            { task: 'Create example video', daysBeforeEvent: 12, description: 'Show how it\'s done' },
            { task: 'Set up donation page', daysBeforeEvent: 10, description: 'Easy link to give' }
          ]},
          { phase: 'Launch', tasks: [
            { task: 'Influencer posts', description: 'Launch with key voices' },
            { task: 'Monitor hashtag', description: 'Engage with every post' },
            { task: 'Share highlights', description: 'Best videos on your channels' },
            { task: 'Nominate strategically', description: 'Encourage viral spread' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Thank participants', description: 'Public appreciation' },
            { task: 'Share total impact', description: 'Donations and reach' },
            { task: 'Create highlight reel', description: 'Best moments compilation' }
          ]}
        ]
      }
    ]
  },
  {
    id: 'direct-giving',
    label: 'Direct Giving',
    description: 'Traditional fundraising through direct appeals and partnerships',
    icon: Heart,
    color: 'from-rose-500 to-red-600',
    types: [
      {
        id: 'email-campaign',
        label: 'Email Campaign',
        icon: Mail,
        description: 'Targeted email appeals to your supporter list. Low cost, direct communication, measurable results.',
        avgRaised: 125,
        color: 'from-blue-500 to-cyan-600',
        difficulty: 'easy',
        timeToOrganize: '1-2 weeks',
        successGuide: [
          { title: 'Segment Your List', description: 'Target messages to different groups: past donors, prospects, volunteers.' },
          { title: 'Craft Compelling Subject', description: 'Subject line determines opens. Test different approaches.' },
          { title: 'Tell a Story', description: 'Personal stories connect. Show impact of giving.' },
          { title: 'Clear Call to Action', description: 'One obvious ask. Make donating one click away.' },
          { title: 'Send Series', description: 'Initial appeal, reminder, last chance. Don\'t give up after one email.' },
          { title: 'Thank Immediately', description: 'Automated thank you. Personal follow-up for larger gifts.' }
        ],
        projectManagerSteps: [
          { phase: 'Preparation (2 weeks before)', tasks: [
            { task: 'Clean email list', daysBeforeEvent: 14, description: 'Remove bounces, segment contacts' },
            { task: 'Write email series', daysBeforeEvent: 12, description: 'Initial appeal, reminder, final ask' },
            { task: 'Design template', daysBeforeEvent: 10, description: 'On-brand, mobile-friendly' },
            { task: 'Set up donation page', daysBeforeEvent: 7, description: 'Easy, secure giving' }
          ]},
          { phase: 'Campaign Launch', tasks: [
            { task: 'Send initial appeal', description: 'Compelling story and ask' },
            { task: 'Monitor opens/clicks', description: 'Track engagement metrics' },
            { task: 'Send reminder (day 3)', description: 'To non-openers' },
            { task: 'Send final appeal (day 7)', description: 'Last chance messaging' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Thank donors', description: 'Immediate and personal' },
            { task: 'Analyze results', description: 'Open rates, click rates, donations' },
            { task: 'Update list', description: 'Tag new donors' }
          ]}
        ]
      },
      {
        id: 'corporate-sponsor',
        label: 'Corporate Sponsorship',
        icon: Building2,
        description: 'Partner with businesses for financial support. Larger donations with mutual benefits.',
        avgRaised: 500,
        color: 'from-slate-500 to-gray-600',
        difficulty: 'hard',
        timeToOrganize: '4-8 weeks',
        successGuide: [
          { title: 'Identify Prospects', description: 'Local businesses, companies connected to your cause, employer matching.' },
          { title: 'Create Sponsor Packages', description: 'Tiered benefits: logo placement, recognition, employee engagement.' },
          { title: 'Make the Ask', description: 'Personal meeting with decision maker. Professional proposal.' },
          { title: 'Negotiate Terms', description: 'Be flexible on benefits. Focus on value for both parties.' },
          { title: 'Deliver on Promises', description: 'All promised recognition and benefits. Keep sponsor informed.' },
          { title: 'Steward the Relationship', description: 'Year-round communication. Make renewal easy.' }
        ],
        projectManagerSteps: [
          { phase: 'Research (8-6 weeks)', tasks: [
            { task: 'Identify prospects', daysBeforeEvent: 56, description: 'Local businesses, aligned companies' },
            { task: 'Research contacts', daysBeforeEvent: 50, description: 'Decision makers for giving' },
            { task: 'Create sponsor packet', daysBeforeEvent: 42, description: 'Benefits, impact, recognition tiers' }
          ]},
          { phase: 'Outreach (6-4 weeks)', tasks: [
            { task: 'Send intro emails', daysBeforeEvent: 42, description: 'Request meetings' },
            { task: 'Make presentations', daysBeforeEvent: 35, description: 'In-person pitches' },
            { task: 'Follow up', daysBeforeEvent: 28, description: 'Answer questions, negotiate' }
          ]},
          { phase: 'Closing', tasks: [
            { task: 'Finalize agreements', description: 'Signed contracts' },
            { task: 'Collect payments', description: 'Invoice and process' },
            { task: 'Deliver benefits', description: 'Promised recognition' }
          ]},
          { phase: 'Stewardship', tasks: [
            { task: 'Regular updates', description: 'Keep sponsors informed' },
            { task: 'Impact report', description: 'Show how funds were used' },
            { task: 'Plan renewal', description: 'Start conversation for next year' }
          ]}
        ]
      },
      {
        id: 'grant-writing',
        label: 'Grant Applications',
        icon: FileText,
        description: 'Apply for foundation and government grants. Significant funding potential for qualified organizations.',
        avgRaised: 1000,
        color: 'from-emerald-500 to-green-600',
        difficulty: 'hard',
        timeToOrganize: '8-12 weeks',
        successGuide: [
          { title: 'Research Funders', description: 'Foundation databases, government opportunities. Match your mission to theirs.' },
          { title: 'Prepare Documentation', description: '501(c)(3) letter, financials, board list, organizational documents.' },
          { title: 'Craft Compelling Proposal', description: 'Clear problem statement, solution, budget, expected outcomes.' },
          { title: 'Follow Guidelines Exactly', description: 'Every funder has specific requirements. Missing details can disqualify.' },
          { title: 'Submit Before Deadline', description: 'Allow time for technical issues. Early submission shows professionalism.' },
          { title: 'Follow Up Appropriately', description: 'Thank reviewers. Report on funded projects. Build relationships.' }
        ],
        projectManagerSteps: [
          { phase: 'Research (12-8 weeks)', tasks: [
            { task: 'Identify opportunities', daysBeforeEvent: 84, description: 'Foundation and government grants' },
            { task: 'Review eligibility', daysBeforeEvent: 70, description: 'Match your mission to requirements' },
            { task: 'Note deadlines', daysBeforeEvent: 60, description: 'Create calendar of opportunities' }
          ]},
          { phase: 'Preparation (8-4 weeks)', tasks: [
            { task: 'Gather documentation', daysBeforeEvent: 56, description: '501(c)(3), financials, board list' },
            { task: 'Develop project plan', daysBeforeEvent: 42, description: 'Goals, activities, timeline' },
            { task: 'Create budget', daysBeforeEvent: 35, description: 'Detailed, justified expenses' }
          ]},
          { phase: 'Writing (4-2 weeks)', tasks: [
            { task: 'Draft proposal', daysBeforeEvent: 28, description: 'Following funder guidelines' },
            { task: 'Get feedback', daysBeforeEvent: 21, description: 'Internal review and editing' },
            { task: 'Finalize application', daysBeforeEvent: 14, description: 'Complete all sections' }
          ]},
          { phase: 'Submission', tasks: [
            { task: 'Final proofread', daysBeforeEvent: 7, description: 'Errors can disqualify' },
            { task: 'Submit early', daysBeforeEvent: 3, description: 'Avoid technical issues at deadline' },
            { task: 'Confirm receipt', description: 'Verify submission was received' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Thank reviewers', description: 'Regardless of outcome' },
            { task: 'Report if funded', description: 'Required updates on project' },
            { task: 'Learn from rejection', description: 'Feedback for improvement' }
          ]}
        ]
      },
      {
        id: 'monthly-giving',
        label: 'Monthly Giving Program',
        icon: CreditCard,
        description: 'Recurring donation program for sustained support. Builds reliable revenue over time.',
        avgRaised: 300,
        color: 'from-indigo-500 to-purple-600',
        difficulty: 'medium',
        timeToOrganize: '4-6 weeks',
        successGuide: [
          { title: 'Create Giving Levels', description: 'Named tiers with specific impact. $10, $25, $50+ monthly options.' },
          { title: 'Set Up Recurring Payments', description: 'Easy signup through your donation platform. Secure and reliable.' },
          { title: 'Emphasize Impact', description: 'Show what monthly gifts accomplish. "$25/month provides X".' },
          { title: 'Convert Existing Donors', description: 'Ask one-time donors to become monthly. Emphasize convenience.' },
          { title: 'Provide Exclusive Benefits', description: 'Special updates, recognition, events for monthly donors.' },
          { title: 'Steward Continuously', description: 'Regular thank-yous, impact updates. Make them feel valued.' }
        ],
        projectManagerSteps: [
          { phase: 'Setup (6-4 weeks)', tasks: [
            { task: 'Design program', daysBeforeEvent: 42, description: 'Giving levels, benefits, naming' },
            { task: 'Set up technology', daysBeforeEvent: 35, description: 'Recurring payment capability' },
            { task: 'Create materials', daysBeforeEvent: 28, description: 'Web page, email templates' }
          ]},
          { phase: 'Launch (4-2 weeks)', tasks: [
            { task: 'Announce program', daysBeforeEvent: 28, description: 'Email to full list' },
            { task: 'Target existing donors', daysBeforeEvent: 21, description: 'Ask for upgrade' },
            { task: 'Social media campaign', daysBeforeEvent: 14, description: 'Ongoing promotion' }
          ]},
          { phase: 'Ongoing', tasks: [
            { task: 'Monthly thank-yous', description: 'Automated and personal' },
            { task: 'Quarterly updates', description: 'Impact reports to monthly donors' },
            { task: 'Annual recognition', description: 'Special appreciation' },
            { task: 'Upgrade asks', description: 'Invitation to increase giving' }
          ]}
        ]
      },
      {
        id: 'car-wash',
        label: 'Car Wash',
        icon: Car,
        description: 'Classic community fundraiser. High visibility, fun for volunteers, immediate results.',
        avgRaised: 85,
        color: 'from-sky-500 to-blue-600',
        difficulty: 'easy',
        timeToOrganize: '2-3 weeks',
        successGuide: [
          { title: 'Secure Location', description: 'High-traffic area with water access. Get permission from property owner.' },
          { title: 'Gather Supplies', description: 'Buckets, sponges, soap, hoses, towels. Consider getting donations.' },
          { title: 'Schedule Volunteers', description: 'Shifts of 4-6 people. Plan for breaks and hydration.' },
          { title: 'Set Pricing', description: 'Flat rate or donation basis. Signs should be clear and visible.' },
          { title: 'Promote Location', description: 'Signs on road, social media, tell friends. Visibility is key.' },
          { title: 'Execute Efficiently', description: 'Assembly line process. Quick turnaround keeps line moving.' }
        ],
        projectManagerSteps: [
          { phase: 'Planning (3 weeks before)', tasks: [
            { task: 'Secure location', daysBeforeEvent: 21, description: 'High traffic, water access' },
            { task: 'Get supplies', daysBeforeEvent: 14, description: 'Buckets, soap, sponges, signs' },
            { task: 'Recruit volunteers', daysBeforeEvent: 14, description: 'Shifts throughout the day' }
          ]},
          { phase: 'Promotion (2 weeks)', tasks: [
            { task: 'Create signs', daysBeforeEvent: 14, description: 'Large, visible signage' },
            { task: 'Promote on social media', daysBeforeEvent: 10, description: 'Date, time, location, cause' },
            { task: 'Confirm volunteers', daysBeforeEvent: 5, description: 'Final schedule' }
          ]},
          { phase: 'Event Day', tasks: [
            { task: 'Setup early', description: 'Signs, supplies, volunteer briefing' },
            { task: 'Wash cars efficiently', description: 'Assembly line process' },
            { task: 'Stay hydrated', description: 'Water and snacks for volunteers' },
            { task: 'Track donations', description: 'Keep money secure' },
            { task: 'Clean up', description: 'Leave location spotless' }
          ]},
          { phase: 'Follow-up', tasks: [
            { task: 'Count money', description: 'Accurate final total' },
            { task: 'Thank volunteers', description: 'Appreciation for hard work' },
            { task: 'Share results', description: 'Social media announcement' }
          ]}
        ]
      }
    ]
  }
];

export const getAllFundraiserTypes = (): FundraiserType[] => {
  return FUNDRAISER_CATEGORIES.flatMap(category => category.types);
};

export const getFundraiserTypeById = (id: string): FundraiserType | undefined => {
  return getAllFundraiserTypes().find(type => type.id === id);
};

export const getCategoryById = (id: string): FundraiserCategory | undefined => {
  return FUNDRAISER_CATEGORIES.find(cat => cat.id === id);
};
