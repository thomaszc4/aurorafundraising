export interface RewardItem {
    id: string;
    name: string;
    pointCost: number;
    category: 'Gaming & Tech' | 'Beauty & Style' | 'Apparel' | 'Lifestyle & Fun' | 'Gift Cards' | 'Experiences' | 'Other';
    image?: string; // Optional image path override
    description?: string;
}

export interface RewardTierGroup {
    pointCost: number;
    items: RewardItem[];
}

/**
 * REWARDS SHOP CATALOG
 * Points Logic: 1 Item Sold = 2 Points
 * This catalog is organized by Points Cost (Price Points).
 */
export const REWARD_CATALOG: RewardTierGroup[] = [
    {
        pointCost: 10,
        items: [
            { id: '10_gaming_tshirt', name: 'Gaming T-Shirt (Fortnite/Anime)', pointCost: 10, category: 'Apparel' },
            { id: '10_energy_pack', name: 'Energy Drink Variety Pack', pointCost: 10, category: 'Lifestyle & Fun' },
            { id: '10_fishing_lure', name: 'Fishing Lure Kit', pointCost: 10, category: 'Lifestyle & Fun' },
            { id: '10_hair_clips', name: 'Hair Clips / Scrunchies Set', pointCost: 10, category: 'Beauty & Style' },
            { id: '10_lip_gloss', name: 'Lip Gloss / Lip Balm Set', pointCost: 10, category: 'Beauty & Style' },
            { id: '10_sticker_pack', name: 'Sticker Pack Collection', pointCost: 10, category: 'Lifestyle & Fun' },
            { id: '10_funko_pop', name: 'Funko Pop Vinyl Figure', pointCost: 10, category: 'Lifestyle & Fun' },
            { id: '10_screen_protector', name: 'Phone Screen Protector', pointCost: 10, category: 'Gaming & Tech' },
            { id: '10_eshop', name: 'Nintendo eShop Card ($10)', pointCost: 10, category: 'Gift Cards' },
        ]
    },
    {
        pointCost: 20,
        items: [
            { id: '20_skate_hoodie', name: 'Skateboard Hoodie (Primitive)', pointCost: 20, category: 'Apparel' },
            { id: '20_tool_set', name: 'Basic Hand Tool Set', pointCost: 20, category: 'Lifestyle & Fun' },
            { id: '20_fishing_acc', name: 'Fishing Accessory Pack', pointCost: 20, category: 'Lifestyle & Fun' },
            { id: '20_makeup_brush', name: 'Makeup Brush Set', pointCost: 20, category: 'Beauty & Style' },
            { id: '20_jewelry_case', name: 'Travel Jewelry Case', pointCost: 20, category: 'Beauty & Style' },
            { id: '20_beauty_calendar', name: 'Beauty Advent Calendar', pointCost: 20, category: 'Beauty & Style' },
            { id: '20_apple_card', name: 'Apple Gift Card ($20)', pointCost: 20, category: 'Gift Cards' },
            { id: '20_heyday_buds', name: 'Heyday Wireless Earbuds', pointCost: 20, category: 'Gaming & Tech' },
            { id: '20_bt_speaker', name: 'Bluetooth Speaker', pointCost: 20, category: 'Gaming & Tech' },
        ]
    },
    {
        pointCost: 30,
        items: [
            { id: '30_logitech_g432', name: 'Logitech G432 Gaming Headset', pointCost: 30, category: 'Gaming & Tech' },
            { id: '30_columbia_hoodie', name: 'Columbia Tech Hoodie', pointCost: 30, category: 'Apparel' },
            { id: '30_skate_acc', name: 'Skateboard Grip Tape/Accessories', pointCost: 30, category: 'Lifestyle & Fun' },
            { id: '30_blanket_hoodie', name: 'Oversized Blanket Hoodie (Catalonia)', pointCost: 30, category: 'Apparel' },
            { id: '30_hair_styling', name: 'Hair Styling Kit', pointCost: 30, category: 'Beauty & Style' },
            { id: '30_jewelry_box', name: 'Personalized Jewelry Box', pointCost: 30, category: 'Beauty & Style' },
            { id: '30_switch_game_1', name: 'Nintendo Switch Game (Unravel 2)', pointCost: 30, category: 'Gaming & Tech' },
            { id: '30_jlab_buds', name: 'JLab Go Air Pop Earbuds', pointCost: 30, category: 'Gaming & Tech' },
            { id: '30_charging_pad', name: 'Wireless Charging Pad', pointCost: 30, category: 'Gaming & Tech' },
        ]
    },
    {
        pointCost: 60,
        items: [
            { id: '60_astro_a20', name: 'Astro A20 Gaming Headset', pointCost: 60, category: 'Gaming & Tech' },
            { id: '60_fishing_bundle', name: 'Fishing Equipment Bundle', pointCost: 60, category: 'Lifestyle & Fun' },
            { id: '60_instax_camera', name: 'Instax Mini 12 Camera Bundle', pointCost: 60, category: 'Lifestyle & Fun' }, // Replaced Drone
            { id: '60_wearable_blanket', name: 'Oversized Wearable Blanket Hoodie', pointCost: 60, category: 'Apparel' },
            { id: '60_beauty_basket', name: 'Beauty Gift Basket (11-piece)', pointCost: 60, category: 'Beauty & Style' },
            { id: '60_makeup_bundle', name: 'Makeup & Accessories Bundle', pointCost: 60, category: 'Beauty & Style' },
            { id: '60_sony_buds', name: 'Sony WF-C510 Earbuds', pointCost: 60, category: 'Gaming & Tech' },
            { id: '60_switch_game_major', name: 'Nintendo Switch Game (Major Titles)', pointCost: 60, category: 'Gaming & Tech' },
            { id: '60_apple_card_60', name: 'Apple Gift Card ($60)', pointCost: 60, category: 'Gift Cards' },
        ]
    },
    {
        pointCost: 90,
        items: [
            { id: '90_corsair_void', name: 'Corsair Void Wireless Headset', pointCost: 90, category: 'Gaming & Tech' },
            { id: '90_skate_apparel', name: 'Skateboarding Apparel Collection', pointCost: 90, category: 'Apparel' },
            { id: '90_fisher_rod', name: 'Advanced Fishing Rod Set', pointCost: 90, category: 'Lifestyle & Fun' },
            { id: '90_premium_beauty', name: 'Premium Beauty/Skincare Set', pointCost: 90, category: 'Beauty & Style' },
            { id: '90_designer_hoodie', name: 'Designer Hoodie or Jacket', pointCost: 90, category: 'Apparel' },
            { id: '90_jewelry_col', name: 'Jewelry Collection Set', pointCost: 90, category: 'Beauty & Style' },
            { id: '90_sony_headphones', name: 'Sony WH-CH720N Headphones', pointCost: 90, category: 'Gaming & Tech' },
            { id: '90_console_game', name: 'PS5/Xbox Game Title', pointCost: 90, category: 'Gaming & Tech' },
            { id: '90_pro_controller', name: 'Nintendo Switch Pro Controller', pointCost: 90, category: 'Gaming & Tech' },
        ]
    },
    {
        pointCost: 120,
        items: [
            { id: '120_razer_blackshark', name: 'Razer BlackShark Pro Headset', pointCost: 120, category: 'Gaming & Tech' },
            { id: '120_skate_gear', name: 'Deluxe Skateboarding Gear', pointCost: 120, category: 'Lifestyle & Fun' },
            { id: '120_dj_mixer', name: 'DJ/Content Creator Mixer', pointCost: 120, category: 'Gaming & Tech' },
            { id: '120_wireless_buds', name: 'High-End Wireless Earbuds', pointCost: 120, category: 'Gaming & Tech' },
            { id: '120_designer_cloth', name: 'Designer Clothing Bundle', pointCost: 120, category: 'Apparel' },
            { id: '120_prem_acc', name: 'Premium Accessories Kit', pointCost: 120, category: 'Beauty & Style' },
            { id: '120_airpods', name: 'Apple AirPods (Standard)', pointCost: 120, category: 'Gaming & Tech' },
            { id: '120_sony_prem', name: 'Sony Premium Headphones', pointCost: 120, category: 'Gaming & Tech' },
            { id: '120_monitor_acc', name: 'Gaming Monitor Accessory', pointCost: 120, category: 'Gaming & Tech' },
        ]
    },
    {
        pointCost: 150,
        items: [
            { id: '150_pc_headset', name: 'High-End Gaming PC Headset', pointCost: 150, category: 'Gaming & Tech' },
            { id: '150_skate_deck', name: 'Skateboard Complete Deck + Gear', pointCost: 150, category: 'Lifestyle & Fun' },
            { id: '150_e_skate_1', name: 'Electric Skateboard (Entry-Level)', pointCost: 150, category: 'Lifestyle & Fun' },
            { id: '150_airpods_pro1', name: 'AirPods Pro (1st Gen)', pointCost: 150, category: 'Gaming & Tech' },
            { id: '150_designer_athletic', name: 'Designer Athletic Wear', pointCost: 150, category: 'Apparel' },
            { id: '150_noise_cancel', name: 'Wireless Noise-Cancelling Headphones', pointCost: 150, category: 'Gaming & Tech' },
            { id: '150_airpods_pro_std', name: 'AirPods Pro (Standard)', pointCost: 150, category: 'Gaming & Tech' },
            { id: '150_switch_oled', name: 'Nintendo Switch OLED Console', pointCost: 150, category: 'Gaming & Tech' },
            { id: '150_ninja_creami', name: 'Ninja Creami Ice Cream Maker', pointCost: 150, category: 'Lifestyle & Fun' }, // Replaced Drone
        ]
    },
    {
        pointCost: 200,
        items: [
            { id: '200_ipad', name: 'Apple iPad 10.2" (9th Gen)', pointCost: 200, category: 'Gaming & Tech' }, // Replaced Drone
            { id: '200_gaming_bundle', name: 'High-End Gaming Headset Bundle', pointCost: 200, category: 'Gaming & Tech' },
            { id: '200_e_skate_2', name: 'Electric Skateboard (Quality)', pointCost: 200, category: 'Lifestyle & Fun' },
            { id: '200_airpods_pro2', name: 'AirPods Pro 2nd Gen', pointCost: 200, category: 'Gaming & Tech' },
            { id: '200_leather_jacket', name: 'Designer Leather Jacket', pointCost: 200, category: 'Apparel' },
            { id: '200_apple_watch', name: 'Apple Watch (Entry-Level)', pointCost: 200, category: 'Gaming & Tech' },
            { id: '200_ps5_games', name: 'PS5 AAA Titles (Ghost of Yotei, etc)', pointCost: 200, category: 'Gaming & Tech' },
            { id: '200_switch_bundle', name: 'Nintendo Switch OLED + Game Bundle', pointCost: 200, category: 'Gaming & Tech' },
            { id: '200_creami_deluxe', name: 'Ninja Creami Deluxe + Accessories', pointCost: 200, category: 'Lifestyle & Fun' } // Replaced Drone Combo
        ]
    }
];

// Compatibility Interface and Export for Admin Tools
export interface IncentiveTier {
    name: string;
    itemsRequired: number;
    pointCost: number;
    icon: string;
    gradient: string;
    description: string;
    category?: 'apparel' | 'gift_card' | 'experience' | 'electronics' | 'other';
}

export const INCENTIVE_TIERS: IncentiveTier[] = REWARD_CATALOG.map(group => ({
    name: `$${group.pointCost} Rewards`,
    itemsRequired: group.pointCost / 2, // 1 item = 2 points
    pointCost: group.pointCost,
    icon: '🎁',
    gradient: 'from-primary to-primary/60',
    description: `${group.items.length} items available in this tier`,
    category: 'other'
}));

export const REWARD_TIERS = INCENTIVE_TIERS;
