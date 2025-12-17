-- Create quest_definitions table
CREATE TABLE IF NOT EXISTS public.quest_definitions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    steps JSONB NOT NULL, -- Array of QuestStep
    rewards JSONB, -- Array of Rewards
    next_quest_id TEXT, -- For chaining
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quest_definitions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read
CREATE POLICY "Everyone can read quests" ON public.quest_definitions
    FOR SELECT USING (true);

-- Seed Data (Migrating form QuestSystem.ts)
INSERT INTO public.quest_definitions (id, title, description, steps, rewards, next_quest_id)
VALUES 
(
    'q_arrival', 
    'The Arrival', 
    'Welcome to the Tundra. Reach Base Camp to begin your journey.', 
    '[
        {
            "id": "reach_base",
            "description": "Navigate to Base Camp (4000, 4000)",
            "type": "LOCATION_VISIT",
            "targetValue": { "x": 4000, "y": 4000, "radius": 200 },
            "currentValue": 0,
            "isCompleted": false
        }
    ]',
    '{ "xp": 100, "tokens": 50 }',
    'q_build_shelter'
),
(
    'q_build_shelter',
    'Survival Basics',
    'It gets cold at night. Gather wood to build a fire or find shelter.',
    '[
        {
            "id": "collect_wood",
            "description": "Collect 5 Pine Wood from trees.",
            "type": "ITEM_COLLECT",
            "targetValue": { "itemId": "pine_wood", "count": 5 },
            "currentValue": 0,
            "isCompleted": false
        }
    ]',
    '{ "xp": 200, "tokens": 100, "items": [{ "id": "campfire_kit", "count": 1 }] }',
    'q_bridge_fund'
),
(
    'q_bridge_fund',
    'The Community Bridge',
    'This bridge requires community effort. Raise funds to repair it.',
    '[
        {
            "id": "fund_bridge",
            "description": "Community Goal: Raise $5000 Total",
            "type": "FUNDRAISING_GOAL",
            "targetValue": 5000,
            "currentValue": 0,
            "isCompleted": false
        }
    ]',
    '{ "xp": 500, "tokens": 250, "unlocks": ["bridge_access"] }',
    null
)
ON CONFLICT (id) DO UPDATE SET 
    steps = EXCLUDED.steps,
    rewards = EXCLUDED.rewards,
    next_quest_id = EXCLUDED.next_quest_id;
