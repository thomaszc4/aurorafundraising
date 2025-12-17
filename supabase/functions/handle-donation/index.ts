
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

console.log("Hello from Functions!")

serve(async (req) => {
    try {
        const { amount, campaign_id, donor_name } = await req.json()

        if (!amount || !campaign_id) {
            return new Response(JSON.stringify({ error: 'Missing amount or campaign_id' }), { status: 400 })
        }

        // Create Supabase Client
        const supabaseClient = createClient(
            // Supabase API URL - Env var exported by default.
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase API ANON KEY - Env var exported by default.
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}` },
                },
            }
        )

        // 1. Update Campaign Total
        // We use a simplified increment approach. In prod, you'd insert into a 'donations' table and trigger an update.
        // For this prototype, we'll increment the 'total_raised' column directly.
        // *Assuming 'total_raised' exists on campaigns table based on plan.

        // First fetch current to ensure it exists
        const { data: campaign, error: fetchError } = await supabaseClient
            .from('campaigns')
            .select('total_raised, id')
            .eq('id', campaign_id)
            .single()

        if (fetchError || !campaign) {
            console.error("Campaign not found", fetchError)
            return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404 })
        }

        const newTotal = (campaign.total_raised || 0) + amount

        const { error: updateError } = await supabaseClient
            .from('campaigns')
            .update({ total_raised: newTotal })
            .eq('id', campaign_id)

        if (updateError) {
            console.error("Update failed", updateError)
            return new Response(JSON.stringify({ error: 'Update failed' }), { status: 500 })
        }

        // 2. Check Milestones (The "Cliffhanger" Logic)
        // Find next locked milestone
        const { data: milestones } = await supabaseClient
            .from('campaign_milestones')
            .select('*')
            .eq('campaign_id', campaign_id)
            .eq('is_unlocked', false)
            .lte('unlock_threshold', newTotal)
            .order('unlock_threshold', { ascending: true })

        const eventsToBroadcast = []

        if (milestones && milestones.length > 0) {
            for (const m of milestones) {
                // Unlock it
                await supabaseClient.from('campaign_milestones').update({ is_unlocked: true, unlocked_at: new Date() }).eq('id', m.id)

                // Add to event log
                await supabaseClient.from('campaign_events').insert({
                    campaign_id,
                    type: 'milestone_unlocked',
                    message: `MILESTONE REACHED: ${m.title}!`,
                    data: { milestone_id: m.id, description: m.description }
                })

                eventsToBroadcast.push({ type: 'milestone', data: m })
            }
        }

        // 3. Broadcast to Game Clients
        // We use the channel `game_${campaign_id}` matching the client
        const channel = supabaseClient.channel(`game_${campaign_id}`)

        await channel.send({
            type: 'broadcast',
            event: 'fundraising_update',
            payload: {
                total_raised: newTotal,
                last_donor: donor_name || 'Anonymous',
                amount,
                new_milestones: eventsToBroadcast
            }
        })

        // Cleanup channel (though serverless, it might not persist, but good practice to close if possible, 
        // but in stateless fn, we just return)

        return new Response(
            JSON.stringify({ success: true, new_total: newTotal, milestones_unlocked: eventsToBroadcast.length }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
