import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface StudentLeaderboardRankProps {
    campaignId: string;
    studentId: string;
    currentAmount: number;
}

export function StudentLeaderboardRank({ campaignId, studentId, currentAmount }: StudentLeaderboardRankProps) {
    const [rank, setRank] = useState<number | null>(null);
    const [totalParticipants, setTotalParticipants] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (!campaignId || !studentId) {
            setLoading(false);
            return;
        }

        const fetchRank = async () => {
            try {
                // Fetch all student fundraisers for this campaign to calculate rank
                const { data, error } = await supabase
                    .from('student_fundraisers')
                    .select('id, total_raised')
                    .eq('campaign_id', campaignId)
                    .eq('is_active', true)
                    .order('total_raised', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    setTotalParticipants(data.length);
                    // Find index of current student
                    const studentIndex = data.findIndex(p => p.id === studentId);
                    if (studentIndex !== -1) {
                        setRank(studentIndex + 1); // 1-based rank
                    }
                }
            } catch (err) {
                console.error("Error fetching rank:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchRank();
    }, [campaignId, studentId, currentAmount]);

    if (loading || error || !rank || totalParticipants === 0) return null;

    return (
        <Card className="bg-yellow-50/50 border-yellow-200">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-full">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-yellow-800">Current Rank</p>
                        <p className="text-2xl font-bold text-yellow-900">
                            #{rank} <span className="text-sm font-normal text-yellow-700/80">of {totalParticipants}</span>
                        </p>
                    </div>
                </div>
                {rank === 1 && <Medal className="w-8 h-8 text-yellow-500 animate-bounce" />}
                {rank <= 3 && rank > 1 && <Star className="w-6 h-6 text-yellow-400" />}
            </CardContent>
        </Card>
    );
}
